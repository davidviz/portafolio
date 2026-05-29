import { supabaseServer } from "./supabase";

export type Dashboard = {
  id: string;
  slug: string;
  proyecto: string;
  nombre: string;
  objetivo: string;
  icono: string;
  es_publico: boolean;
  orden?: number;
};

export async function getDashboards(): Promise<Dashboard[]> {
  try {
    const { data, error } = await supabaseServer
      .from("dashboards")
      .select("*")
      .order("orden", { ascending: true });

    if (error) throw error;

    return (
      data?.map((d) => ({
        id: d.id,
        slug: d.slug,
        proyecto: d.proyecto_slug,
        nombre: d.nombre,
        objetivo: d.objetivo,
        icono: d.icono || "📊",
        es_publico: d.es_publico,
        orden: d.orden,
      })) || []
    );
  } catch (err) {
    console.error("Error leyendo dashboards:", err);
    return [];
  }
}

export async function getDashboardsByProyecto(proyecto: string): Promise<Dashboard[]> {
  const all = await getDashboards();
  return all.filter((d) => d.proyecto === proyecto);
}

export async function getDashboardBySlug(slug: string): Promise<Dashboard | undefined> {
  const all = await getDashboards();
  return all.find((d) => d.slug === slug);
}

export async function getDashboardHTML(slug: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseServer
      .from("dashboards")
      .select("html")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data?.html || null;
  } catch (err) {
    console.error("Error leyendo HTML del dashboard:", err);
    return null;
  }
}
