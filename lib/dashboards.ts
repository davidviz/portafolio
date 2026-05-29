import fs from "fs";
import path from "path";

// =============================================================
//  AUTO-DESCUBRIMIENTO DE DASHBOARDS  —  lib/dashboards.ts
//  Cada dashboard es una CARPETA dentro de /dashboards con:
//    - dashboard.html   (el tablero que exportaste)
//    - meta.json        ({proyecto, nombre, objetivo, esPublico})
//  El slug = nombre de la carpeta. Aqui se leen todas las carpetas
//  y se arma la lista automaticamente. No hay que editar codigo.
// =============================================================

export type Dashboard = {
  slug: string;
  proyecto: string;
  nombre: string;
  objetivo: string;
  esPublico: boolean; // true = sin contrasena
  orden?: number;
};

const DIR = path.join(process.cwd(), "dashboards");

export function getDashboards(): Dashboard[] {
  let carpetas: string[] = [];
  try {
    carpetas = fs
      .readdirSync(DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }

  const lista: Dashboard[] = [];
  for (const slug of carpetas) {
    try {
      const raw = fs.readFileSync(path.join(DIR, slug, "meta.json"), "utf8");
      const meta = JSON.parse(raw);
      lista.push({
        slug,
        proyecto: String(meta.proyecto ?? ""),
        nombre: String(meta.nombre ?? slug),
        objetivo: String(meta.objetivo ?? ""),
        esPublico: Boolean(meta.esPublico),
        orden: typeof meta.orden === "number" ? meta.orden : undefined,
      });
    } catch {
      // Carpeta sin meta.json valido: se ignora sin romper el sitio.
    }
  }

  lista.sort(
    (a, b) =>
      (a.orden ?? 999) - (b.orden ?? 999) || a.nombre.localeCompare(b.nombre)
  );
  return lista;
}

export function getDashboardsByProyecto(proyecto: string): Dashboard[] {
  return getDashboards().filter((d) => d.proyecto === proyecto);
}

export function getDashboardBySlug(slug: string): Dashboard | undefined {
  return getDashboards().find((d) => d.slug === slug);
}
