// app/api/parachique-sheets/route.js
// Publica las hojas de seguimiento de CS Parachique para que las lea el robot
// que arma el panel. Usa la MISMA cuenta de servicio que ya tiene Vercel para
// HRDT (GOOGLE_SERVICE_ACCOUNT_B64), asi que no hace falta ningun secreto nuevo
// en GitHub: el generador simplemente pide esta URL.
//
// Sin dependencias externas: crypto + fetch nativos, igual que /api/sheet.
//
// Lo que devuelve ya esta en los tableros publicos del proyecto, de modo que
// esta ruta no expone nada que no se vea al abrir el panel. Lo economico del
// suscrito no vive en estas hojas y nunca debe vivir aqui.

import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Las tres hojas de la carpeta «7.Panel Portafolio» del Drive del supervisor.
const HOJAS = {
  catalogo:      "14uyd1mGwm0NnTPnaxHoSf_udS-vFDqbJh0JZgv21uhw",
  seguimiento:   "1fFLVEzHM9kfdplK32EvBc1ZPhsLsAD6-ZuO5tqpg7zU",
  observaciones: "139iM1VddIgtjhiEwsrostyef_DnbXPC8GetmtShkEmQ",
};

const norm = (v) => (v ?? "").toString().trim();

function getCreds() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("Falta la variable GOOGLE_SERVICE_ACCOUNT_B64 en Vercel.");
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

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
  const firma = crypto.createSign("RSA-SHA256").update(unsigned).sign(creds.private_key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: unsigned + "." + b64url(firma),
    }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("No se pudo autenticar con Google: " + JSON.stringify(j));
  return j.access_token;
}

// La fila 1 son los rotulos; cada fila siguiente es un objeto.
function aObjetos(filas) {
  if (!filas || !filas.length) return [];
  const rotulos = (filas[0] || []).map((c) => norm(c).toLowerCase());
  return filas.slice(1)
    .filter((f) => f.some((c) => norm(c) !== ""))
    .map((f) => {
      const o = {};
      rotulos.forEach((r, i) => { if (r) o[r] = norm(f[i]); });
      return o;
    });
}

async function leerHoja(token, id) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A1:ZZ?majorDimension=ROWS`;
  const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  const j = await res.json();
  if (j.error) throw new Error(j.error.message || "Error de Google Sheets");
  return aObjetos(j.values || []);
}

export async function GET() {
  let cuenta = null;
  try {
    const creds = getCreds();
    cuenta = creds.client_email;   // no es secreto: es a quien hay que compartir las hojas
    const token = await getAccessToken(creds);

    const nombres = Object.keys(HOJAS);
    const leidas = await Promise.all(nombres.map(async (n) => {
      // Una hoja sin compartir no debe tumbar a las demas.
      try {
        return { n, filas: await leerHoja(token, HOJAS[n]) };
      } catch (e) {
        return { n, filas: [], error: e.message };
      }
    }));

    const salida = { ok: true, cuenta, generadoEn: new Date().toISOString() };
    const problemas = [];
    for (const { n, filas, error } of leidas) {
      salida[n] = filas;
      if (error) problemas.push({ hoja: n, error });
    }
    if (problemas.length) salida.problemas = problemas;

    return Response.json(salida, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ ok: false, cuenta, error: e.message }, { status: 500 });
  }
}
