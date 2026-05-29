import Link from "next/link";
import type { Proyecto } from "@/config/proyectos";

export default function ProyectoCard({
  proyecto,
  cantidadDashboards,
}: {
  proyecto: Proyecto;
  cantidadDashboards: number;
}) {
  return (
    <Link
      href={`/proyectos/${proyecto.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-borde bg-superficie transition-all duration-300 hover:-translate-y-1 hover:border-acento hover:shadow-[0_18px_40px_-20px_rgba(15,28,46,0.35)]"
    >
      {proyecto.imagen && (
        <div className="relative h-44 overflow-hidden">
          <img
            src={proyecto.imagen}
            alt={proyecto.nombre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute right-3 top-3 rounded-full bg-tinta/80 px-3 py-1 text-xs text-white backdrop-blur">
            {proyecto.estado}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-7">
        <span className="kicker text-acento">{proyecto.cliente}</span>
        <h3 className="mt-3 font-display text-2xl font-semibold leading-snug text-tinta">
          {proyecto.nombre}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-tintaSuave">{proyecto.resumen}</p>

        <div className="mt-6 flex items-center justify-between border-t border-borde pt-4">
          <span className="text-sm font-medium text-tinta">
            {cantidadDashboards} {cantidadDashboards === 1 ? "dashboard" : "dashboards"}
          </span>
          <span className="text-sm font-medium text-primario transition-transform group-hover:translate-x-1">
            Ver proyecto →
          </span>
        </div>
      </div>
    </Link>
  );
}
