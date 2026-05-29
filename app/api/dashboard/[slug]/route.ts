import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { tokenValido, nombreCookie } from "@/lib/auth";
import { getDashboardBySlug } from "@/lib/dashboards";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  const dashboard = getDashboardBySlug(slug);

  if (!dashboard) {
    return new NextResponse("Dashboard no encontrado", { status: 404 });
  }

  // Si es privado, exige cookie de sesion valida (firmada en el servidor).
  if (!dashboard.esPublico) {
    const token = req.cookies.get(nombreCookie(slug))?.value;
    if (!tokenValido(slug, token)) {
      return new NextResponse("No autorizado", { status: 401 });
    }
  }

  try {
    const ruta = path.join(process.cwd(), "dashboards", slug, "dashboard.html");
    const html = await fs.readFile(ruta, "utf8");
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Dashboard en preparación", { status: 404 });
  }
}
