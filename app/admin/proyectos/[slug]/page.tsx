"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Proyecto = {
  id: string;
  slug: string;
  nombre: string;
  cliente: string;
  resumen: string;
  descripcion: string;
  estado: string;
  imagen_url: string | null;
  orden: number;
};

export default function EditarProyecto({ params }: { params: { slug: string } }) {
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
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
      const res = await fetch("/api/admin/proyectos");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      const p = data.data.find((x: Proyecto) => x.slug === params.slug);
      if (!p) {
        setError("Proyecto no encontrado");
      } else {
        setProyecto(p);
      }
    } catch {
      setError("Error cargando proyecto");
    } finally {
      setCargando(false);
    }
  }

  function set<K extends keyof Proyecto>(campo: K, valor: Proyecto[K]) {
    if (proyecto) setProyecto({ ...proyecto, [campo]: valor });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!proyecto) return;
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/proyectos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proyecto),
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
    if (!proyecto) return;
    if (!confirm(`¿Seguro que quieres borrar el proyecto "${proyecto.nombre}"? Esta acción no se puede deshacer.`)) return;
    setBorrando(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/proyectos?id=${proyecto.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al borrar (¿tiene dashboards asociados?)");
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

  if (!proyecto) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-fondo">
        <p className="text-tintaSuave">{error || "Proyecto no encontrado"}</p>
        <Link href="/admin/dashboard" className="text-sm text-primario">← Volver</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo">
      <header className="border-b border-borde bg-superficie">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link href="/admin/dashboard" className="text-sm text-tintaSuave hover:text-primario">← Volver</Link>
          <h1 className="mt-3 font-display text-2xl font-semibold text-tinta">Editar Proyecto</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <form onSubmit={guardar} className="space-y-6 rounded-xl border border-borde bg-superficie p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tinta">Slug (identificador)</label>
              <input type="text" value={proyecto.slug} disabled
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tintaSuave outline-none opacity-60" />
              <p className="mt-1 text-xs text-tintaSuave">El slug no se edita (rompería los enlaces)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-tinta">Orden</label>
              <input type="number" min={1} value={proyecto.orden}
                onChange={(e) => set("orden", Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tinta">Nombre</label>
              <input type="text" value={proyecto.nombre} required
                onChange={(e) => set("nombre", e.target.value)}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
            </div>
            <div>
              <label className="block text-sm font-medium text-tinta">Cliente</label>
              <input type="text" value={proyecto.cliente || ""}
                onChange={(e) => set("cliente", e.target.value)}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-tinta">Resumen (texto corto)</label>
            <input type="text" value={proyecto.resumen || ""}
              onChange={(e) => set("resumen", e.target.value)}
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
          </div>

          <div>
            <label className="block text-sm font-medium text-tinta">Descripción (texto largo)</label>
            <textarea value={proyecto.descripcion || ""} rows={4}
              onChange={(e) => set("descripcion", e.target.value)}
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tinta">Estado</label>
              <select value={proyecto.estado || "En ejecución"}
                onChange={(e) => set("estado", e.target.value)}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario">
                <option value="En ejecución">En ejecución</option>
                <option value="Finalizado">Finalizado</option>
                <option value="En pausa">En pausa</option>
                <option value="Planificación">Planificación</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-tinta">URL de imagen (opcional)</label>
              <input type="text" value={proyecto.imagen_url || ""}
                onChange={(e) => set("imagen_url", e.target.value)}
                placeholder="/proyectos/hrdt.jpg"
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario" />
            </div>
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
