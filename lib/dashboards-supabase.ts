import { supabaseServer } from "./supabase";

export type Dashboard = {
  id: string;
  slug: string;
  proyecto: string;
  nombre: string;
  objetivo: string;
  icono: string;
  es_publico: boolean;
  esPublico: boolean;
  orden?: number;
};

export type ProyectoPublico = {
  id: string;
  slug: string;
  nombre: string;
  cliente: string;
  resumen: string;
  descripcion: string;
  estado: string;
  imagen?: string;
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
        esPublico: d.es_publico,
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

export async function getPasswordHash(slug: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseServer
      .from("dashboards")
      .select("password_hash")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    return data?.password_hash || null;
  } catch (err) {
    console.error("Error leyendo password_hash:", err);
    return null;
  }
}

export async function getDashboardHTML(slug: string): Promise<string | null> {
  // 1) Intentar leer el HTML guardado en Supabase
  try {
    const { data, error } = await supabaseServer
      .from("dashboards")
      .select("html")
      .eq("slug", slug)
      .single();
    if (!error && data?.html && data.html.trim().length > 0) {
      return data.html;
    }
  } catch (err) {
    console.error("Error leyendo HTML de Supabase:", err);
  }

  // 2) Fallback: leer el archivo dashboards/<slug>/dashboard.html del repo
  try {
    const fs = await import("fs");
    const path = await import("path");
    const ruta = path.join(process.cwd(), "dashboards", slug, "dashboard.html");
    if (fs.existsSync(ruta)) {
      return fs.readFileSync(ruta, "utf8");
    }
  } catch (err) {
    console.error("Error leyendo HTML de archivo:", err);
  }

  return null;
}

// ---------- Proyectos desde Supabase ----------
export async function getProyectos(): Promise<ProyectoPublico[]> {
  try {
    const { data, error } = await supabaseServer
      .from("proyectos")
      .select("*")
      .order("orden", { ascending: true });
    if (error) throw error;
    return (
      data?.map((p) => ({
        id: p.id,
        slug: p.slug,
        nombre: p.nombre,
        cliente: p.cliente || "",
        resumen: p.resumen || "",
        descripcion: p.descripcion || "",
        estado: p.estado || "",
        imagen: p.imagen_url || undefined,
        orden: p.orden,
      })) || []
    );
  } catch (err) {
    console.error("Error leyendo proyectos:", err);
    return [];
  }
}

export async function getProyectoBySlug(slug: string): Promise<ProyectoPublico | undefined> {
  const all = await getProyectos();
  return all.find((p) => p.slug === slug);
}
