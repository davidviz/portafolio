import Link from "next/link";
import type { Dashboard } from "@/lib/dashboards";

export default function DashboardCard({
  proyectoSlug,
  dashboard,
}: {
  proyectoSlug: string;
  dashboard: Dashboard;
}) {
  return (
    <Link
      href={`/proyectos/${proyectoSlug}/${dashboard.slug}`}
      className="group flex flex-col rounded-xl border border-borde bg-superficie p-6 transition-all duration-300 hover:-translate-y-1 hover:border-acento hover:shadow-[0_18px_40px_-22px_rgba(15,28,46,0.35)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            dashboard.esPublico ? "bg-acento/12 text-acento" : "bg-primario/10 text-primario"
          }`}
          aria-hidden
        >
          {dashboard.esPublico ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 13h4l3 7 4-16 3 9h4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          )}
        </span>
        <span className="text-xs font-medium text-tintaSuave">
          {dashboard.esPublico ? "Público" : "Privado"}
        </span>
      </div>

      <h3 className="font-display text-xl font-semibold text-tinta">{dashboard.nombre}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-tintaSuave">{dashboard.objetivo}</p>

      <span className="mt-5 inline-flex items-center text-sm font-medium text-primario transition-transform group-hover:translate-x-1">
        {dashboard.esPublico ? "Abrir dashboard →" : "Acceder con contraseña →"}
      </span>
    </Link>
  );
}
