/**
 * Refresco real de un dashboard: no recarga lo publicado, sino que pide que se
 * REGENERE desde el Google Sheet.
 *
 * Por qué existe: el botón «Actualizar» solo hacía `iframe.src = iframe.src`,
 * o sea volvía a pedir el HTML ya publicado. Si un ingeniero acababa de editar
 * la matriz y pulsaba Actualizar, veía exactamente lo mismo de antes y se iba
 * pensando que el tablero estaba al día. Quien regenera de verdad es GitHub
 * Actions, y hasta ahora solo lo despertaba un cron cada 6 h.
 *
 * Cómo funciona:
 *   POST → llama a la Edge Function `hrdt-vigia?forzar=1`, que es la que sabe
 *          hablar con GitHub (tiene el PAT). Aquí NO hay ningún token de
 *          GitHub: este endpoint solo llama a una función del propio proyecto.
 *   GET  → devuelve `actualizado_en` del dashboard. El navegador lo consulta
 *          cada pocos segundos para saber cuándo terminó la republicación.
 *          Son ~80 bytes por consulta; sondear el HTML serían 3 MB cada vez.
 *
 * Se exige la MISMA autorización que para ver el tablero (cookie de sesión en
 * los privados). Sin eso, cualquiera con la URL podría encadenar corridas de
 * GitHub Actions, que se facturan por minuto.
 *
 * Los dashboards que no salen de la matriz HRDT responden `soportado: false` y
 * el botón se comporta como siempre: recargar y ya.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDashboardBySlug } from "@/lib/dashboards-supabase";
import { tokenValido, nombreCookie } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Solo los tableros que se regeneran desde el Sheet tienen algo que refrescar.
const CON_VIGIA = new Set(["hrdt-seguimiento-sdd", "hrdt-supervision"]);

async function actualizadoEn(slug: string): Promise<string | null> {
  const { data } = await supabaseServer
    .from("dashboards")
    .select("actualizado_en")
    .eq("slug", slug)
    .single();
  return (data as { actualizado_en?: string } | null)?.actualizado_en ?? null;
}

/** Mismo criterio de acceso que sirve el HTML del tablero. */
async function denegado(req: NextRequest, slug: string) {
  const dashboard = await getDashboardBySlug(slug);
  if (!dashboard) return new NextResponse("Dashboard no encontrado", { status: 404 });
  if (!dashboard.es_publico) {
    const token = req.cookies.get(nombreCookie(slug))?.value;
    if (!tokenValido(slug, token)) return new NextResponse("No autorizado", { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const no = await denegado(req, slug);
  if (no) return no;

  return NextResponse.json({
    soportado: CON_VIGIA.has(slug),
    actualizadoEn: await actualizadoEn(slug),
  });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const no = await denegado(req, slug);
  if (no) return no;

  const antes = await actualizadoEn(slug);

  if (!CON_VIGIA.has(slug)) {
    return NextResponse.json({ soportado: false, actualizadoEn: antes });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return NextResponse.json(
      { soportado: true, disparado: false, error: "Falta NEXT_PUBLIC_SUPABASE_URL", actualizadoEn: antes },
      { status: 500 },
    );
  }

  try {
    // `forzar=1` porque el refresco lo está pidiendo una persona: aunque el
    // vigía crea que no hay novedad, quiere que se regenere igual.
    const r = await fetch(`${base}/functions/v1/hrdt-vigia?forzar=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const cuerpo = await r.json().catch(() => ({} as Record<string, unknown>));

    if (!r.ok) {
      // El error del vigía se devuelve tal cual —«faltan secretos», por
      // ejemplo— en vez de un «no se pudo» genérico: así quien pulsa el botón
      // distingue un fallo pasajero de algo que hay que configurar una vez.
      return NextResponse.json(
        {
          soportado: true,
          disparado: false,
          error: (cuerpo as { error?: string })?.error || `El vigía respondió ${r.status}`,
          actualizadoEn: antes,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      soportado: true,
      disparado: (cuerpo as { disparado?: boolean })?.disparado !== false,
      actualizadoEn: antes,
    });
  } catch (e) {
    return NextResponse.json(
      {
        soportado: true,
        disparado: false,
        error: e instanceof Error ? e.message : String(e),
        actualizadoEn: antes,
      },
      { status: 502 },
    );
  }
}
