import { NextRequest, NextResponse } from "next/server";
import { getDashboardBySlug, getDashboardHTML } from "@/lib/dashboards-supabase";
import { tokenValido, nombreCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  const dashboard = await getDashboardBySlug(slug);

  if (!dashboard) {
    return new NextResponse("Dashboard no encontrado", { status: 404 });
  }

  // Si es privado, exige cookie de sesion valida
  if (!dashboard.es_publico) {
    const token = req.cookies.get(nombreCookie(slug))?.value;
    if (!tokenValido(slug, token)) {
      return new NextResponse("No autorizado", { status: 401 });
    }
  }

  const html = await getDashboardHTML(slug);
  if (!html) {
    return new NextResponse("Dashboard en preparación", { status: 404 });
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
