import { notFound } from "next/navigation";
import DashboardGate from "@/components/DashboardGate";
import { getProyectoBySlug } from "@/lib/dashboards-supabase";
import { getDashboardBySlug } from "@/lib/dashboards-supabase";

export const dynamic = "force-dynamic";

export default async function PaginaDashboard({
  params,
}: {
  params: { proyecto: string; dashboard: string };
}) {
  const proyecto = await getProyectoBySlug(params.proyecto);
  const dashboard = await getDashboardBySlug(params.dashboard);
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
