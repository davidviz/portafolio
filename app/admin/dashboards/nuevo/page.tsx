"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Proyecto = { slug: string; nombre: string };

export default function NuevoDashboard() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [icono, setIcono] = useState("📊");
  const [proyectoSlug, setProyectoSlug] = useState("");
  const [html, setHtml] = useState("");
  const [esPublico, setEsPublico] = useState(true);
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    cargarProyectos();
  }, []);

  async function cargarProyectos() {
    try {
      const res = await fetch("/api/admin/proyectos");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      setProyectos(data.data.map((p: any) => ({ slug: p.slug, nombre: p.nombre })));
    } catch (err) {
      setError("Error cargando proyectos");
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");

    try {
      const res = await fetch("/api/admin/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          proyecto_slug: proyectoSlug,
          nombre,
          objetivo,
          icono,
          html,
          es_publico: esPublico,
          password_hash: esPublico ? null : password, // Aquí iría hash en prod
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear dashboard");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo">
        <p className="text-tintaSuave">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo">
      <header className="border-b border-borde bg-superficie">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link href="/admin/dashboard" className="text-sm text-tintaSuave hover:text-primario">
            ← Volver
          </Link>
          <h1 className="mt-3 font-display text-2xl font-semibold text-tinta">Nuevo Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-borde bg-superficie p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tinta">Slug (identificador)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="hrdt-seguimiento-sdd"
                required
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
              />
              <p className="mt-1 text-xs text-tintaSuave">URL amigable, sin espacios</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-tinta">Proyecto</label>
              <select
                value={proyectoSlug}
                onChange={(e) => setProyectoSlug(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
              >
                <option value="">Elige un proyecto...</option>
                {proyectos.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-tinta">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Seguimiento SDD"
              required
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tinta">Objetivo/Descripción</label>
            <textarea
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Avance semanal de los entregables..."
              rows={3}
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tinta">Ícono (emoji)</label>
              <input
                type="text"
                value={icono}
                onChange={(e) => setIcono(e.target.value)}
                placeholder="📊"
                maxLength={2}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-center text-2xl outline-none focus:border-primario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-tinta">Privacidad</label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={esPublico}
                    onChange={() => setEsPublico(true)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-tinta">Público</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!esPublico}
                    onChange={() => setEsPublico(false)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-tinta">Con contraseña</span>
                </label>
              </div>
            </div>
          </div>

          {!esPublico && (
            <div>
              <label className="block text-sm font-medium text-tinta">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="contraseña..."
                required={!esPublico}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-tinta">HTML del Dashboard</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Pega el HTML aquí..."
              rows={10}
              required
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 font-mono text-sm text-tinta outline-none focus:border-primario"
            />
            <p className="mt-1 text-xs text-tintaSuave">Copia y pega el código HTML completo de tu dashboard</p>
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 rounded-lg bg-primario px-4 py-3 font-medium text-white transition-colors hover:bg-primarioClaro disabled:opacity-50"
            >
              {enviando ? "Creando..." : "Crear Dashboard"}
            </button>
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-borde px-6 py-3 text-center font-medium text-tinta transition-colors hover:bg-fondo"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
