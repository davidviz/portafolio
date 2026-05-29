// =============================================================
//  PROYECTOS  —  config/proyectos.ts
//  Aqui SOLO vive la informacion del proyecto (nombre, descripcion,
//  imagen). Los dashboards se detectan solos desde /dashboards.
// =============================================================

export type Proyecto = {
  slug: string; // p.ej. "hrdt" (debe coincidir con "proyecto" del meta.json)
  nombre: string;
  cliente: string;
  resumen: string; // texto breve de la tarjeta en el home
  descripcion: string; // texto al abrir el proyecto (parrafos separados por linea en blanco)
  estado: string;
  imagen?: string; // ruta dentro de /public, p.ej. "/proyectos/hrdt.jpg"
};

export const proyectos: Proyecto[] = [
  {
    slug: "hrdt",
    nombre: "Hospital Regional Docente de Trujillo",
    cliente: "HRDT · PRONIS / MINSA",
    resumen:
      "Validación de diseño, compatibilización de especialidades y trazabilidad técnica del equipamiento de un hospital de alta complejidad.",
    descripcion:
      "El HRDT es un nuevo hospital de tercer nivel de atención desarrollado bajo el modelo de cooperación Gobierno a Gobierno (G2G) entre Perú y el Reino Unido, en el marco de PRONIS/MINSA. El proyecto contempla la construcción y el equipamiento integral de un establecimiento de alta complejidad con 36 unidades productoras de servicios (UPSS/UPS) y más de 2,000 ambientes, dotado de cerca de 28,000 equipos médicos.\n\nComo Especialista en Equipamiento Médico del frente de equipamiento, participo en la validación del diseño, la compatibilización de especialidades (arquitectura, instalaciones eléctricas y sanitarias, gases medicinales, HVAC y conectividad clínica) y el aseguramiento del cumplimiento normativo (NTS N° 119-MINSA/DGIEM) y de los estándares G2G, garantizando la trazabilidad técnica de cada equipo desde su programación hasta su preinstalación.",
    estado: "En ejecución",
    imagen: "/proyectos/hrdt.jpg",
  },
];

export function getProyecto(slug: string): Proyecto | undefined {
  return proyectos.find((p) => p.slug === slug);
}
