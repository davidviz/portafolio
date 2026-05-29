import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Estos colores leen las variables CSS inyectadas desde config/tema.ts.
        // Cambiar la paleta = editar SOLO config/tema.ts (regla de tema global).
        fondo: "var(--color-fondo)",
        superficie: "var(--color-superficie)",
        tinta: "var(--color-tinta)",
        tintaSuave: "var(--color-tinta-suave)",
        primario: "var(--color-primario)",
        primarioClaro: "var(--color-primario-claro)",
        acento: "var(--color-acento)",
        borde: "var(--color-borde)",
      },
      fontFamily: {
        display: ["var(--fuente-display)", "Georgia", "serif"],
        sans: ["var(--fuente-cuerpo)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        contenido: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
