import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import DashboardCard from "@/components/DashboardCard";
import { getProyectoBySlug, getDashboardsByProyecto } from "@/lib/dashboards-supabase";

export const dynamic = "force-dynamic";

export default async function PaginaProyecto({
  params,
}: {
  params: { proyecto: string };
}) {
  const proyecto = await getProyectoBySlug(params.proyecto);
  if (!proyecto) notFound();

  const dashboards = await getDashboardsByProyecto(proyecto.slug);
  const parrafos = (proyecto.descripcion || "").split("\n\n");

  return (
    <>
      <Header />

      <section className="relative overflow-hidden border-b border-borde">
        {proyecto.imagen && (
          <div className="absolute inset-0">
            <img src={proyecto.imagen} alt={proyecto.nombre} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-tinta/78" />
            <div className="absolute inset-0 bg-gradient-to-r from-tinta via-tinta/90 to-transparent" />
          </div>
        )}
        <div className="relative mx-auto max-w-contenido px-6 py-20 text-white">
          <Link href="/#proyectos" className="text-sm text-white/70 transition-colors hover:text-white">
            ← Volver a proyectos
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="kicker text-acento">{proyecto.cliente}</span>
            <span className="rounded-full border border-white/30 px-3 py-1 text-xs text-white/80">
              {proyecto.estado}
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
            {proyecto.nombre}
          </h1>
          <div className="mt-5 max-w-2xl space-y-3 text-sm leading-relaxed text-white/90 sm:text-base">
            {parrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-contenido px-6 py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="kicker text-acento">Dashboards del proyecto</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-tinta">
              Tableros de seguimiento
            </h2>
          </div>
          <span className="text-sm text-tintaSuave">
            {dashboards.length} {dashboards.length === 1 ? "dashboard" : "dashboards"}
          </span>
        </div>

        {dashboards.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-borde bg-superficie p-10 text-center text-tintaSuave">
            Aún no hay dashboards en este proyecto.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((d) => (
              <DashboardCard key={d.slug} proyectoSlug={proyecto.slug} dashboard={d} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
