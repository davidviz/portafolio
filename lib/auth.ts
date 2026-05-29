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
