import crypto from "crypto";

// =============================================================
//  SEGURIDAD EN SERVIDOR  —  lib/auth.ts
//  - Contrasenas de dashboards: hash guardado en la base (scrypt).
//  - Token de sesion por dashboard (cookie httpOnly).
//  - Sesion de admin para el panel /admin.
// =============================================================

function authSecret(): string {
  return process.env.AUTH_SECRET || "cambia-este-secreto-en-vercel";
}

// ---------- Hash de contrasenas (scrypt) ----------
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

function comparaSeguro(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ---------- Sesion por dashboard ----------
export function generarToken(slug: string): string {
  return crypto.createHmac("sha256", authSecret()).update("dash:" + slug).digest("hex");
}

export function tokenValido(slug: string, token: string | undefined): boolean {
  if (!token) return false;
  return comparaSeguro(generarToken(slug), token);
}

export function nombreCookie(slug: string): string {
  return "dash_" + slug.replace(/[^a-zA-Z0-9_-]/g, "_");
}

// ---------- Sesion de ADMIN ----------
export function adminPasswordCorrecta(intento: string): boolean {
  const esperada = process.env.ADMIN_PASSWORD || "";
  if (!esperada) return false;
  return comparaSeguro(esperada, intento);
}

export function generarTokenAdmin(): string {
  return crypto.createHmac("sha256", authSecret()).update("admin-session").digest("hex");
}

export function tokenAdminValido(token: string | undefined): boolean {
  if (!token) return false;
  return comparaSeguro(generarTokenAdmin(), token);
}

export const COOKIE_ADMIN = "admin_session";
