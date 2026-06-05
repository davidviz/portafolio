// app/api/sheet/route.js
// Lee dos Google Sheets con una cuenta de servicio y los une por codigo de equipo.
// SIN dependencias externas: usa solo modulos nativos de Node (crypto + fetch).
// La data NUNCA pasa por el navegador: el front solo llama a /api/sheet.

import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ====================== CONFIG ======================
   OJO: la columna llave se llama DISTINTO en cada archivo.
==================================================== */
const CONFIG = {
  matriz:   { spreadsheetId: "15yjUdAlBqfp7nXg6XImF8Si_tbXVovsC5EIeHgwZbLY", tab: "05_CONSOLIDADO_PI", keyCol: "COD. EQ." },
  alertas:  { spreadsheetId: "15yjUdAlBqfp7nXg6XImF8Si_tbXVovsC5EIeHgwZbLY", tab: "07_ALERTAS_PI",     keyCol: "COD. EQ." },
  programa: { spreadsheetId: "1cALi0t3s-HE8aMg7v5fuxbt-WnUirmAxMrNPeNSniI4", gid: 1132094064,           keyCol: "CODIDGO"  },
};
/* ==================================================== */

const norm = (v) => (v ?? "").toString().trim();

function getCreds() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("Falta la variable GOOGLE_SERVICE_ACCOUNT_B64 en Vercel.");
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// Firma un JWT con la llave de la cuenta de servicio y obtiene un token de acceso
async function getAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = header + "." + claim;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(creds.private_key);
  const jwt = unsigned + "." + b64url(signature);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("No se pudo autenticar con Google: " + JSON.stringify(j));
  return j.access_token;
}

async function sheetsGet(token, url) {
  const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  const j = await res.json();
  if (j.error) throw new Error(j.error.message || "Error de Google Sheets");
  return j;
}

function findHeaderRow(rows, keyCol) {
  const target = norm(keyCol).toLowerCase();
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    if ((rows[i] || []).some((c) => norm(c).toLowerCase() === target)) return i;
  }
  return 1; // por defecto fila 2 (indice 1)
}

function rowsToObjects(rows, keyCol) {
  const hIdx = findHeaderRow(rows, keyCol);
  if (rows.length <= hIdx) return [];
  const headers = (rows[hIdx] || []).map(norm);
  return rows.slice(hIdx + 1)
    .filter((r) => r.some((c) => norm(c) !== ""))
    .map((r) => { const o = {}; headers.forEach((h, i) => { if (h) o[h] = norm(r[i]); }); return o; });
}

async function readTab(token, spreadsheetId, tab, keyCol) {
  const range = encodeURIComponent("'" + tab + "'");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=FORMATTED_VALUE`;
  const j = await sheetsGet(token, url);
  return rowsToObjects(j.values || [], keyCol);
}

async function tabNameByGid(token, spreadsheetId, gid) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`;
  const j = await sheetsGet(token, url);
  const s = (j.sheets || []).find((x) => x.properties.sheetId === gid);
  if (!s) throw new Error("No hay pestana con gid " + gid);
  return s.properties.title;
}

function groupByKey(list, keyCol) {
  const m = {};
  for (const r of list) { const k = norm(r[keyCol]); if (k) (m[k] = m[k] || []).push(r); }
  return m;
}

export async function GET() {
  try {
    const creds = getCreds();
    const token = await getAccessToken(creds);

    const programaTab = await tabNameByGid(token, CONFIG.programa.spreadsheetId, CONFIG.programa.gid);

    const [matriz, alertas, programa] = await Promise.all([
      readTab(token, CONFIG.matriz.spreadsheetId,   CONFIG.matriz.tab,   CONFIG.matriz.keyCol),
      readTab(token, CONFIG.alertas.spreadsheetId,  CONFIG.alertas.tab,  CONFIG.alertas.keyCol),
      readTab(token, CONFIG.programa.spreadsheetId, programaTab,         CONFIG.programa.keyCol),
    ]);

    const progByCode  = groupByKey(programa, CONFIG.programa.keyCol);
    const alertByCode = groupByKey(alertas,  CONFIG.alertas.keyCol);

    const data = matriz.map((row) => {
      const code = norm(row[CONFIG.matriz.keyCol]);
      return { ...row, _ubicaciones: progByCode[code] || [], _alertas: alertByCode[code] || [] };
    });

    return Response.json(
      { ok: true, generadoEn: new Date().toISOString(), total: data.length,
        conAlerta: data.filter((d) => d._alertas.length > 0).length, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
