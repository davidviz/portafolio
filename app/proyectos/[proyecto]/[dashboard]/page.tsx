import { notFound } from "next/navigation";
import DashboardGate from "@/components/DashboardGate";
import { getProyecto } from "@/config/proyectos";
import { getDashboards, getDashboardBySlug } from "@/lib/dashboards";

export function generateStaticParams() {
  return getDashboards().map((d) => ({ proyecto: d.proyecto, dashboard: d.slug }));
}

export default function PaginaDashboard({
  params,
}: {
  params: { proyecto: string; dashboard: string };
}) {
  const proyecto = getProyecto(params.proyecto);
  const dashboard = getDashboardBySlug(params.dashboard);
  if (!proyecto || !dashboard || dashboard.proyecto !== proyecto.slug) notFound();

  return (
    <DashboardGate
      proyectoSlug={proyecto.slug}
      proyectoNombre={proyecto.nombre}
      dashboardSlug={dashboard.slug}
      dashboardNombre={dashboard.nombre}
      esPublico={dashboard.esPublico}
    />
  );
}
