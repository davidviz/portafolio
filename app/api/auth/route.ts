import { NextRequest, NextResponse } from "next/server";
import { generarToken, nombreCookie, verifyPassword } from "@/lib/auth";
import { getDashboardBySlug, getPasswordHash } from "@/lib/dashboards-supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { dashboard?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Petición inválida" }, { status: 400 });
  }

  const { dashboard, password } = body;
  if (!dashboard || typeof password !== "string") {
    return NextResponse.json({ ok: false, error: "Faltan datos" }, { status: 400 });
  }

  const d = await getDashboardBySlug(dashboard);
  if (!d) {
    return NextResponse.json({ ok: false, error: "Dashboard no encontrado" }, { status: 404 });
  }

  if (d.es_publico) {
    return NextResponse.json({ ok: true });
  }

  const hash = await getPasswordHash(dashboard);
  if (!verifyPassword(password, hash)) {
    return NextResponse.json({ ok: false, error: "Contraseña incorrecta" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(nombreCookie(dashboard), generarToken(dashboard), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
