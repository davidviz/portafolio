// =============================================================
//  TEMA GLOBAL  —  config/tema.ts
//  Cambiar la identidad visual de TODO el sitio se hace aqui.
//  No es necesario tocar ningun dashboard ni ninguna pagina.
// =============================================================

export const tema = {
  colores: {
    fondo: "#f6f5f1", // lienzo general (hueso cálido)
    superficie: "#ffffff", // tarjetas y paneles
    tinta: "#0f1c2e", // texto principal (azul casi negro)
    tintaSuave: "#5a6573", // texto secundario
    primario: "#0f3d5c", // azul corporativo profundo
    primarioClaro: "#1f6f93", // azul medio (hover, detalles)
    acento: "#16a39a", // verde-azulado clínico (acentos, líneas)
    borde: "#e3e0d8", // bordes sutiles
  },
  fuentes: {
    // Se cargan por <link> en app/layout.tsx
    display: "'Fraunces', Georgia, serif",
    cuerpo: "'Hanken Grotesk', system-ui, sans-serif",
  },
} as const;

// Convierte el objeto en variables CSS para :root (lo usa el layout).
export function temaComoVariablesCss(): string {
  const c = tema.colores;
  return [
    `--color-fondo:${c.fondo}`,
    `--color-superficie:${c.superficie}`,
    `--color-tinta:${c.tinta}`,
    `--color-tinta-suave:${c.tintaSuave}`,
    `--color-primario:${c.primario}`,
    `--color-primario-claro:${c.primarioClaro}`,
    `--color-acento:${c.acento}`,
    `--color-borde:${c.borde}`,
    `--fuente-display:${tema.fuentes.display}`,
    `--fuente-cuerpo:${tema.fuentes.cuerpo}`,
  ].join(";");
}
