"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Dashboard = {
  id: string;
  slug: string;
  proyecto_slug: string;
  nombre: string;
  objetivo: string;
  icono: string;
  html: string;
  es_publico: boolean;
  orden: number;
};

export default function EditarDashboard({ params }: { params: { slug: string } }) {
  const [d, setD] = useState<Dashboard | null>(null);
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargar() {
    try {
      const res = await fetch("/api/admin/dashboards");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      const found = data.data.find((x: Dashboard) => x.slug === params.slug);
      if (!found) setError("Dashboard no encontrado");
      else setD(found);
    } catch {
      setError("Error cargando dashboard");
    } finally {
      setCargando(false);
    }
  }

  function set<K extends keyof Dashboard>(campo: K, valor: Dashboard[K]) {
    if (d) setD({ ...d, [campo]: valor });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!d) return;
    if (!d.es_publico && password === "" && !confirm("No escribiste una contraseña nueva. Se mantendrá la contraseña actual. ¿Continuar?")) {
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/dashboards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, password: password || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
        return;
      }
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function borrar() {
    if (!d) return;
    if (!confirm(`¿Seguro que quieres borrar el dashboard "${d.nombre}"? Esta acción no se puede deshacer.`)) return;
    setBorrando(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/dashboards?id=${d.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al borrar");
        return;
      }
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBorrando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo">
        <p className="text-tintaSuave">Cargando...</p>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-fondo">
        <p className="text-tintaSuave">{error || "Dashboard no encontrado"}</p>
        <Link href="/admin/dashboard" className="text-sm text-primario">← Volver</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo">
      <header className="border-b border-borde bg-superficie">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link href="/admin/dashboard" className="text-sm text-tintaSuave hover:text-primario">← Volver</Link>
          <h1 className="mt-3 font-display text-2xl font-semibold text-tinta">Editar Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <form onSubmit={guardar} className="space-y-6 rounded-xl border border-borde bg-superficie p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tinta">Slug (identificador)</label>
              <input type="text" value={d.slug} disabled
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tintaSuave outline-none opacity-60" />
              <p className="mt-1 text-xs text-tintaSuave">El slug no se edita</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-tinta">Orden</label>
              <input type="number" min={1} value={d.orden}
                onChange={(e) => set("orden", Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-tinta">Nombre</label>
            <input type="text" value={d.nombre} required
              onChange={(e) => set("nombre", e.target.value)}
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
          </div>

          <div>
            <label className="block text-sm font-medium text-tinta">Objetivo/Descripción</label>
            <textarea value={d.objetivo || ""} rows={3}
              onChange={(e) => set("objetivo", e.target.value)}
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tinta">Ícono (emoji)</label>
              <input type="text" value={d.icono || "📊"} maxLength={2}
                onChange={(e) => set("icono", e.target.value)}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-center text-2xl outline-none focus:border-primario" />
            </div>
            <div>
              <label className="block text-sm font-medium text-tinta">Privacidad</label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={d.es_publico} onChange={() => set("es_publico", true)} className="h-4 w-4" />
                  <span className="text-sm text-tinta">Público</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={!d.es_publico} onChange={() => set("es_publico", false)} className="h-4 w-4" />
                  <span className="text-sm text-tinta">Con contraseña</span>
                </label>
              </div>
            </div>
          </div>

          {!d.es_publico && (
            <div>
              <label className="block text-sm font-medium text-tinta">Contraseña</label>
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Escribe una nueva contraseña (o deja vacío para mantener la actual)"
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
              <p className="mt-1 text-xs text-tintaSuave">Se guarda cifrada. Déjalo vacío si no quieres cambiarla.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-tinta">HTML del Dashboard</label>
            <textarea value={d.html || ""} rows={10}
              onChange={(e) => set("html", e.target.value)}
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 font-mono text-sm text-tinta outline-none focus:border-primario" />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-6">
            <button type="submit" disabled={enviando}
              className="flex-1 rounded-lg bg-primario px-4 py-3 font-medium text-white transition-colors hover:bg-primarioClaro disabled:opacity-50">
              {enviando ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link href="/admin/dashboard"
              className="rounded-lg border border-borde px-6 py-3 text-center font-medium text-tinta transition-colors hover:bg-fondo">
              Cancelar
            </Link>
            <button type="button" onClick={borrar} disabled={borrando}
              className="rounded-lg border border-red-300 px-6 py-3 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50">
              {borrando ? "Borrando..." : "Borrar"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
