// =============================================================
//  PERFIL GLOBAL  —  config/perfil.ts
//  Tus datos profesionales. Edita aqui y cambia en todo el sitio.
// =============================================================

export const perfil = {
  nombre: "David Lee Vizcarra Mondragón",
  titulo: "Gerente de Proyectos | Especialista en Equipamiento Biomédico",
  profesion: "Ingeniero Electrónico — CIP 193686",
  tagline:
    "8+ años de experiencia · 88+ meses certificados · Liderazgo ejecutivo en proyectos de gran envergadura",

  propuestaValor:
    "Gerente de Proyectos e Ingeniero Electrónico especializado en equipamiento biomédico y hospitalario, con liderazgo ejecutivo comprobado en proyectos de gran envergadura. Experto en transformación digital con Python e Inteligencia Artificial, dominio integral de las normas NTS 113/110/119 y metodologías ágiles. Experiencia internacional y gestión de equipos multidisciplinarios en proyectos de hasta 80+ millones de soles.",

  contacto: {
    telefono: "+51 944 749 645",
    email: "david.vizcarra.mondragon@gmail.com",
    ubicacion: "Lima, Perú",
    linkedin: "https://www.linkedin.com/in/d-vizcarra",
    linkedinTexto: "linkedin.com/in/d-vizcarra",
  },

  metricas: [
    { valor: "88.9", unidad: "meses", etiqueta: "Experiencia certificada" },
    { valor: "400+", unidad: "MM S/", etiqueta: "Valor gestionado en proyectos" },
    { valor: "60", unidad: "MM S/", etiqueta: "Proyecto insignia (EsSalud)" },
    { valor: "15+", unidad: "", etiqueta: "Especialistas liderados" },
  ],

  competencias: [
    {
      area: "Liderazgo",
      items: [
        "Gerencia ejecutiva",
        "Equipos multidisciplinarios",
        "Coordinación de stakeholders",
        "Toma de decisiones",
      ],
    },
    {
      area: "Técnico",
      items: [
        "Equipamiento biomédico y electromecánico",
        "Compatibilización IE / IS / IM",
        "Normas NTS 113/110/119",
        "Preinstalaciones avanzadas",
      ],
    },
    {
      area: "Tecnología",
      items: [
        "Python (avanzado)",
        "Anthropic Claude (experto)",
        "Power BI · Looker Studio",
        "AutoCAD · Revit",
      ],
    },
    {
      area: "Gestión",
      items: [
        "Metodologías PMI / PMP",
        "Last Planner System",
        "Control de cronogramas",
        "Gestión de riesgos y calidad",
      ],
    },
  ],

  experiencia: [
    {
      cargo: "Especialista de Equipamiento Médico y Hospitalario",
      empresa: "Grupo Pérgola — Huánuco",
      periodo: "Jun 2024 – Abr 2026 (22.3 meses)",
      detalle:
        "Elaboración integral de expedientes técnicos con automatización en Python, supervisión de preinstalaciones, validación de infraestructura y control de calidad con dashboards.",
    },
    {
      cargo: "Gerente de Proyectos (Liderazgo Ejecutivo)",
      empresa: "Ibermansa Perú — Lima",
      periodo: "2023 – 2024 · Renovación EsSalud (60 MM S/)",
      detalle:
        "Liderazgo de equipos de 15+ especialistas y gestión integral del proyecto de renovación de equipamiento en hospitales EsSalud Kaelin y Barton.",
    },
    {
      cargo: "Supervisor de Equipamiento Médico",
      empresa: "PRONIS — Lima",
      periodo: "2024 – 2025 · Proyecto San Miguel",
      detalle:
        "Supervisión integral de expedientes técnicos, validación de compatibilización y emisión de opinión técnica especializada para entidades nacionales.",
    },
    {
      cargo: "Supervisor de Equipamiento Médico y Hospitalario",
      empresa: "Currie & Brown — Lima",
      periodo: "2021 – 2022 · INSN San Borja (APP)",
      detalle:
        "Supervisión en Asociación Público-Privada de alta complejidad, gestión de equipamiento clínico y no clínico con dashboards automatizados.",
    },
  ],

  formacion: [
    "Ingeniero Electrónico — Universidad Tecnológica del Perú",
    "Tecnologías de Salud — University of Vermont",
    "Project Management Professional — PMP Prep (92.5%)",
    "Equipamiento Hospitalario Especializado — ASPAIH",
    "IFMBE Clinical Engineering (Internacional)",
  ],
} as const;
