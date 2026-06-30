"use client";

import { useRef, useState } from "react";

type Props = {
  dashboardSlug: string;
  dashboardNombre: string;
  esPublico: boolean;
};

export default function DashboardSellado({
  dashboardSlug,
  dashboardNombre,
  esPublico,
}: Props) {
  const [autorizado, setAutorizado] = useState(esPublico);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const srcDashboard = `/api/dashboard/${dashboardSlug}`;

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard: dashboardSlug, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAutorizado(true);
      } else {
        setError(data.error || "No se pudo validar la contraseña");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  function pantallaCompleta() {
    const el = contenedorRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }

  // ---------- PANTALLA DE CONTRASEÑA (sin enlaces de salida) ----------
  if (!autorizado) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
        <div className="rounded-2xl border border-borde bg-superficie p-8 shadow-[0_24px_60px_-30px_rgba(15,28,46,0.4)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primario/10 text-primario">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>

          <h1 className="mt-5 font-display text-2xl font-semibold text-tinta">
            {dashboardNombre}
          </h1>
          <p className="mt-2 text-sm text-tintaSuave">
            Este dashboard es privado. Ingresa la contraseña para ver los datos.
          </p>

          <form onSubmit={entrar} className="mt-6 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoFocus
              className="w-full rounded-lg border border-borde bg-fondo px-4 py-3 text-tinta outline-none transition-colors focus:border-primario"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={cargando || password.length === 0}
              className="w-full rounded-lg bg-primario px-4 py-3 font-medium text-white transition-colors hover:bg-primarioClaro disabled:opacity-50"
            >
              {cargando ? "Validando…" : "Acceder"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD (autorizado, sin barra de navegación al sitio) ----------
  return (
    <div className="flex h-screen flex-col bg-fondo">
      <div className="flex items-center justify-between border-b border-borde bg-superficie px-5 py-3">
        <span className="font-display text-sm font-semibold text-tinta">
          {dashboardNombre}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const f = contenedorRef.current?.querySelector("iframe");
              if (f) f.src = f.src;
            }}
            className="rounded-lg border border-borde px-3 py-1.5 text-sm text-tinta transition-colors hover:border-primario"
            title="Volver a leer los datos"
          >
            Actualizar
          </button>
          <button
            onClick={pantallaCompleta}
            className="rounded-lg bg-primario px-3 py-1.5 text-sm text-white transition-colors hover:bg-primarioClaro"
          >
            Pantalla completa
          </button>
        </div>
      </div>

      <div ref={contenedorRef} className="relative flex-1 bg-white">
        <iframe src={srcDashboard} title={dashboardNombre} className="h-full w-full border-0" />
      </div>
    </div>
  );
}
