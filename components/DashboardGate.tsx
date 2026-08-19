"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Props = {
  proyectoSlug: string;
  proyectoNombre: string;
  dashboardSlug: string;
  dashboardNombre: string;
  esPublico: boolean;
};

export default function DashboardGate({
  proyectoSlug,
  proyectoNombre,
  dashboardSlug,
  dashboardNombre,
  esPublico,
}: Props) {
  const [autorizado, setAutorizado] = useState(esPublico);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Estado del botón «Actualizar». Ver `actualizar()` más abajo.
  const [refresco, setRefresco] = useState<"" | "pidiendo" | "esperando" | "listo" | "error">("");
  const [avisoRefresco, setAvisoRefresco] = useState("");
  const sondeoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const srcDashboard = `/api/dashboard/${dashboardSlug}`;

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboard: dashboardSlug,
          password,
        }),
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

  // Si el usuario se va de la página a mitad de la espera, el sondeo tiene que
  // morir con el componente; si no, sigue pegándole al endpoint en segundo plano.
  useEffect(() => {
    return () => { if (sondeoRef.current) clearInterval(sondeoRef.current); };
  }, []);

  function recargarIframe() {
    const f = contenedorRef.current?.querySelector("iframe");
    if (f) f.src = f.src;
  }

  /**
   * «Actualizar» significa traer lo último del Google Sheet, no volver a pedir
   * el HTML que ya estaba publicado —que es lo único que hacía antes—.
   *
   * El tablero lo regenera GitHub Actions y tarda alrededor de un minuto, así
   * que no se puede recargar y ya: hay que disparar, esperar y avisar. El
   * progreso se sigue consultando `actualizado_en` (unos bytes) en vez de
   * volver a bajar el HTML de 3 MB en cada intento.
   *
   * Si el tablero no se regenera desde el Sheet, o si el disparo falla, se
   * recarga igual: el botón nunca deja al usuario sin respuesta.
   */
  async function actualizar() {
    if (refresco === "pidiendo" || refresco === "esperando") return;
    if (sondeoRef.current) clearInterval(sondeoRef.current);

    setRefresco("pidiendo");
    setAvisoRefresco("Pidiendo los últimos datos del Sheet…");

    let antes: string | null = null;
    try {
      const r = await fetch(`/api/dashboard/${dashboardSlug}/refrescar`, { method: "POST" });
      const d = await r.json();
      antes = d?.actualizadoEn ?? null;

      if (!d?.soportado) {           // tablero sin vigía: recargar y listo
        recargarIframe();
        setRefresco("");
        setAvisoRefresco("");
        return;
      }
      if (!r.ok || d?.disparado === false) {
        setRefresco("error");
        setAvisoRefresco(d?.error ? `No se pudo regenerar: ${d.error}` : "No se pudo regenerar. Se muestra lo último publicado.");
        recargarIframe();
        return;
      }
    } catch {
      setRefresco("error");
      setAvisoRefresco("No se pudo contactar al servidor. Se muestra lo último publicado.");
      recargarIframe();
      return;
    }

    setRefresco("esperando");
    setAvisoRefresco("Regenerando desde el Sheet… (suele tardar un minuto)");

    // Se sondea hasta 4 min: el pipeline tarda ~1 min, pero si hay otra corrida
    // en cola GitHub la encola en vez de lanzarla en paralelo.
    const limite = Date.now() + 4 * 60 * 1000;
    sondeoRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/dashboard/${dashboardSlug}/refrescar`, { cache: "no-store" });
        const d = await r.json();
        if (d?.actualizadoEn && d.actualizadoEn !== antes) {
          if (sondeoRef.current) clearInterval(sondeoRef.current);
          recargarIframe();
          setRefresco("listo");
          setAvisoRefresco("Actualizado con los últimos datos del Sheet.");
          setTimeout(() => { setRefresco(""); setAvisoRefresco(""); }, 6000);
          return;
        }
      } catch { /* un fallo suelto de red no debe cortar la espera */ }

      if (Date.now() > limite) {
        if (sondeoRef.current) clearInterval(sondeoRef.current);
        setRefresco("error");
        setAvisoRefresco("Está tardando más de lo normal. Vuelve a pulsar Actualizar en un momento.");
      }
    }, 5000);
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

  // ---------- PANTALLA DE CONTRASEÑA ----------
  if (!autorizado) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
        <Link
          href={`/proyectos/${proyectoSlug}`}
          className="mb-8 text-sm text-tintaSuave transition-colors hover:text-primario"
        >
          ← {proyectoNombre}
        </Link>

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

  // ---------- DASHBOARD (autorizado) ----------
  return (
    <div className="flex h-screen flex-col bg-fondo">
      <div className="flex items-center justify-between border-b border-borde bg-superficie px-5 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/proyectos/${proyectoSlug}`}
            className="text-sm text-tintaSuave transition-colors hover:text-primario"
          >
            ← {proyectoNombre}
          </Link>
          <span className="text-borde">/</span>
          <span className="font-display text-sm font-semibold text-tinta">{dashboardNombre}</span>
        </div>

        <div className="flex items-center gap-2">
          {avisoRefresco && (
            <span
              className={
                "hidden text-xs sm:inline " +
                (refresco === "error"
                  ? "text-red-600"
                  : refresco === "listo"
                    ? "text-green-700"
                    : "text-tintaSuave")
              }
            >
              {avisoRefresco}
            </span>
          )}
          <button
            onClick={actualizar}
            disabled={refresco === "pidiendo" || refresco === "esperando"}
            className="rounded-lg border border-borde px-3 py-1.5 text-sm text-tinta transition-colors hover:border-primario disabled:cursor-wait disabled:opacity-60"
            title="Regenerar el tablero con los últimos datos del Google Sheet"
          >
            {refresco === "pidiendo" || refresco === "esperando" ? "Actualizando…" : "Actualizar"}
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
        <iframe
          src={srcDashboard}
          title={dashboardNombre}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
