import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

function verificarToken(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  return !!token; // En producción, validar token contra BD o firma
}

export async function GET(req: NextRequest) {
  if (!verificarToken(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseServer.from("proyectos").select("*").order("orden");

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Error GET proyectos:", err);
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

  try {
    const { data, error } = await supabaseServer
      .from("proyectos")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err: any) {
    console.error("Error POST proyectos:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
