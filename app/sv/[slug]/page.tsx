import { notFound } from "next/navigation";
import DashboardSellado from "@/components/DashboardSellado";
import { getDashboardBySlug } from "@/lib/dashboards-supabase";

export const dynamic = "force-dynamic";

export default async function PaginaSellada({
  params,
}: {
  params: { slug: string };
}) {
  const dashboard = await getDashboardBySlug(params.slug);
  if (!dashboard) notFound();

  return (
    <DashboardSellado
      dashboardSlug={dashboard.slug}
      dashboardNombre={dashboard.nombre}
      esPublico={dashboard.esPublico}
    />
  );
}
