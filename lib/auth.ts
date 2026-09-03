import crypto from "crypto";

// =============================================================
//  SEGURIDAD EN SERVIDOR  —  lib/auth.ts
//  La contrasena se compara aqui, en el servidor. Nunca en el navegador.
//  Los datos del dashboard solo se entregan tras validar la contrasena.
// =============================================================

// Lee las contrasenas desde una variable de entorno (Vercel), nunca del codigo.
// Formato esperado de DASHBOARD_PASSWORDS (JSON):
//   {"hrdt-seguimiento-sdd":"miClaveSegura"}
function leerPasswords(): Record<string, string> {
  const raw = process.env.DASHBOARD_PASSWORDS;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

// Secreto para firmar el token de sesion del dashboard (variable de entorno).
function authSecret(): string {
  return process.env.AUTH_SECRET || "cambia-este-secreto-en-vercel";
}

// Comparacion en tiempo constante para evitar fugas por temporizacion.
function comparaSeguro(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Valida la contrasena de un dashboard. Devuelve true/false.
export function passwordCorrecta(slug: string, intento: string): boolean {
  const passwords = leerPasswords();
  const esperada = passwords[slug];
  if (!esperada) return false;
  return comparaSeguro(esperada, intento);
}

// Token de sesion = HMAC del slug con el secreto. Va en cookie httpOnly.
export function generarToken(slug: string): string {
  return crypto.createHmac("sha256", authSecret()).update(slug).digest("hex");
}

export function tokenValido(slug: string, token: string | undefined): boolean {
  if (!token) return false;
  const esperado = generarToken(slug);
  return comparaSeguro(esperado, token);
}

export function nombreCookie(slug: string): string {
  // Cookie por dashboard, sin caracteres invalidos.
  return "dash_" + slug.replace(/[^a-zA-Z0-9_-]/g, "_");
}

// ---------- Sesion de administracion (token firmado) ----------
// El token de admin se firma con HMAC y lleva su propio vencimiento. Antes se
// generaba un valor aleatorio que nunca se guardaba ni se contrastaba, de modo
// que cualquier cookie "admin_token" no vacia era aceptada como valida.
//
// La clave de firma combina AUTH_SECRET con ADMIN_PASSWORD: asi el token sigue
// siendo infalsificable aunque AUTH_SECRET no este configurado en el entorno.
function adminSecret(): string {
  return authSecret() + "::" + (process.env.ADMIN_PASSWORD || "");
}

const ADMIN_VIGENCIA_MS = 8 * 60 * 60 * 1000; // 8 horas

export function generarTokenAdmin(): string {
  const vence = String(Date.now() + ADMIN_VIGENCIA_MS);
  const firma = crypto.createHmac("sha256", adminSecret()).update(vence).digest("hex");
  return `${vence}.${firma}`;
}

export function tokenAdminValido(token: string | undefined): boolean {
  if (!token) return false;
  const corte = token.lastIndexOf(".");
  if (corte <= 0) return false;

  const vence = token.slice(0, corte);
  const firma = token.slice(corte + 1);
  const esperada = crypto.createHmac("sha256", adminSecret()).update(vence).digest("hex");

  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  const limite = Number(vence);
  return Number.isFinite(limite) && Date.now() < limite;
}

// ---------- Hash de contrasenas por dashboard (scrypt) ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const intento = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(intento);
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
