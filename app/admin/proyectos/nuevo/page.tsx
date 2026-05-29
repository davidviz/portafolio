"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NuevoProyecto() {
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [cliente, setCliente] = useState("");
  const [resumen, setResumen] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("En ejecución");
  const [imagenUrl, setImagenUrl] = useState("");
  const [orden, setOrden] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");

    try {
      const res = await fetch("/api/admin/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          nombre,
          cliente,
          resumen,
          descripcion,
          estado,
          imagen_url: imagenUrl || null,
          orden,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear proyecto");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-fondo">
      <header className="border-b border-borde bg-superficie">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link href="/admin/dashboard" className="text-sm text-tintaSuave hover:text-primario">
            ← Volver
          </Link>
          <h1 className="mt-3 font-display text-2xl font-semibold text-tinta">Nuevo Proyecto</h1>
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
                placeholder="hrdt"
                required
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
              />
              <p className="mt-1 text-xs text-tintaSuave">URL amigable, sin espacios</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-tinta">Orden</label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(Number(e.target.value))}
                min={1}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
              />
              <p className="mt-1 text-xs text-tintaSuave">Posición en la lista (1 = primero)</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tinta">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Hospital Regional Docente de Trujillo"
                required
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-tinta">Cliente</label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="PRONIS / MINSA"
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-tinta">Resumen (texto corto)</label>
            <input
              type="text"
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              placeholder="Validación de diseño y trazabilidad técnica del equipamiento."
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tinta">Descripción (texto largo)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción completa del proyecto..."
              rows={4}
              className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tinta">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
              >
                <option value="En ejecución">En ejecución</option>
                <option value="Finalizado">Finalizado</option>
                <option value="En pausa">En pausa</option>
                <option value="Planificación">Planificación</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-tinta">URL de imagen (opcional)</label>
              <input
                type="text"
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
                placeholder="/proyectos/hrdt.jpg"
                className="mt-2 w-full rounded-lg border border-borde bg-fondo px-4 py-2 text-tinta outline-none focus:border-primario"
              />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 rounded-lg bg-primario px-4 py-3 font-medium text-white transition-colors hover:bg-primarioClaro disabled:opacity-50"
            >
              {enviando ? "Creando..." : "Crear Proyecto"}
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
