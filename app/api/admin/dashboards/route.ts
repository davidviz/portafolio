import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

function verificarToken(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  return !!token;
}

export async function GET(req: NextRequest) {
  if (!verificarToken(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  try {
    const { data, error } = await supabaseServer.from("dashboards").select("*").order("orden");
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verificarToken(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Petición inválida" }, { status: 400 });
  }

  // Construir registro; hashear contraseña si es privado
  const { password, password_hash, es_publico, ...resto } = body;
  const registro: any = { ...resto, es_publico };
  if (es_publico) {
    registro.password_hash = null;
  } else if (password) {
    registro.password_hash = hashPassword(password);
  }

  try {
    const { data, error } = await supabaseServer
      .from("dashboards")
      .insert([registro])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!verificarToken(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Petición inválida" }, { status: 400 });
  }

  const { id, password, password_hash, es_publico, ...resto } = body;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
  }

  const cambios: any = { ...resto, es_publico, actualizado_en: new Date().toISOString() };
  if (es_publico) {
    cambios.password_hash = null; // al volverse público se borra la contraseña
  } else if (password) {
    cambios.password_hash = hashPassword(password); // nueva contraseña
  }
  // si es privado y no mandó password nueva, no tocamos password_hash

  try {
    const { data, error } = await supabaseServer
      .from("dashboards")
      .update(cambios)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verificarToken(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
  }
  try {
    const { error } = await supabaseServer.from("dashboards").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
