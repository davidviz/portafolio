"use client";

import { useEffect, useState } from "react";
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

type Dashboard = {
  id: string;
  slug: string;
  proyecto_slug: string;
  nombre: string;
  objetivo: string;
  icono: string;
  es_publico: boolean;
  orden: number;
};

export default function AdminDashboard() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<"proyectos" | "dashboards">("proyectos");
  const router = useRouter();

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [resProyectos, resDashboards] = await Promise.all([
        fetch("/api/admin/proyectos"),
        fetch("/api/admin/dashboards"),
      ]);

      if (!resProyectos.ok || !resDashboards.ok) {
        // No autorizado
        router.push("/admin");
        return;
      }

      const data1 = await resProyectos.json();
      const data2 = await resDashboards.json();

      setProyectos(data1.data || []);
      setDashboards(data2.data || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setCargando(false);
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
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-tinta">Panel Admin</h1>
            <p className="text-sm text-tintaSuave">Gestiona tus proyectos y dashboards</p>
          </div>
          <div className="space-x-3">
            <Link href="/" className="text-sm text-tintaSuave hover:text-primario">
              Ver sitio
            </Link>
            <button
              onClick={() => {
                document.cookie = "admin_token=; path=/; max-age=0";
                router.push("/admin");
              }}
              className="text-sm text-tintaSuave hover:text-primario"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 border-t border-borde flex gap-4">
          <button
            onClick={() => setTab("proyectos")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "proyectos" ? "border-primario text-primario" : "border-transparent text-tintaSuave hover:text-tinta"
            }`}
          >
            Proyectos ({proyectos.length})
          </button>
          <button
            onClick={() => setTab("dashboards")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "dashboards" ? "border-primario text-primario" : "border-transparent text-tintaSuave hover:text-tinta"
            }`}
          >
            Dashboards ({dashboards.length})
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {tab === "proyectos" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-tinta">Proyectos</h2>
              <Link
                href="/admin/proyectos/nuevo"
                className="rounded-lg bg-primario px-4 py-2 text-sm font-medium text-white hover:bg-primarioClaro"
              >
                + Nuevo proyecto
              </Link>
            </div>
            <div className="space-y-3">
              {proyectos.length === 0 ? (
                <p className="text-tintaSuave">No hay proyectos aún.</p>
              ) : (
                proyectos.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/proyectos/${p.slug}`}
                    className="block rounded-lg border border-borde bg-superficie p-4 transition-colors hover:border-acento"
                  >
                    <h3 className="font-semibold text-tinta">{p.nombre}</h3>
                    <p className="text-sm text-tintaSuave">{p.cliente}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "dashboards" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-tinta">Dashboards</h2>
              <Link
                href="/admin/dashboards/nuevo"
                className="rounded-lg bg-primario px-4 py-2 text-sm font-medium text-white hover:bg-primarioClaro"
              >
                + Nuevo dashboard
              </Link>
            </div>
            <div className="space-y-3">
              {dashboards.length === 0 ? (
                <p className="text-tintaSuave">No hay dashboards aún.</p>
              ) : (
                dashboards.map((d) => (
                  <Link
                    key={d.id}
                    href={`/admin/dashboards/${d.slug}`}
                    className="block rounded-lg border border-borde bg-superficie p-4 transition-colors hover:border-acento"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{d.icono}</span>
                        <div>
                          <h3 className="font-semibold text-tinta">{d.nombre}</h3>
                          <p className="text-sm text-tintaSuave">{d.proyecto_slug}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          d.es_publico ? "bg-acento/12 text-acento" : "bg-primario/10 text-primario"
                        }`}
                      >
                        {d.es_publico ? "Público" : "Privado"}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
