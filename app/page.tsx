import Header from "@/components/Header";
import ProyectoCard from "@/components/ProyectoCard";
import { perfil } from "@/config/perfil";
import { proyectos } from "@/config/proyectos";
import { getDashboardsByProyecto } from "@/lib/dashboards";

export default function Home() {
  return (
    <>
      <Header />

      {/* ---------- HERO / PERFIL ---------- */}
      <section className="relative overflow-hidden border-b border-borde">
        <div className="fondo-tecnico pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-contenido items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="kicker aparecer text-acento" style={{ animationDelay: "0.05s" }}>
              {perfil.profesion}
            </p>
            <h1
              className="aparecer mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.08] text-tinta sm:text-6xl"
              style={{ animationDelay: "0.12s" }}
            >
              {perfil.nombre}
            </h1>
            <p
              className="aparecer mt-5 max-w-2xl text-lg text-primario sm:text-xl"
              style={{ animationDelay: "0.2s" }}
            >
              {perfil.titulo}
            </p>
            <p
              className="aparecer mt-6 max-w-2xl text-base leading-relaxed text-tintaSuave"
              style={{ animationDelay: "0.28s" }}
            >
              {perfil.propuestaValor}
            </p>

            <div
              className="aparecer mt-8 flex flex-wrap items-center gap-4 text-sm"
              style={{ animationDelay: "0.36s" }}
            >
              <a
                href="#proyectos"
                className="rounded-full bg-primario px-5 py-2.5 font-medium text-white transition-colors hover:bg-primarioClaro"
              >
                Ver proyectos
              </a>
              <a
                href={perfil.contacto.linkedin}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-borde px-5 py-2.5 font-medium text-tinta transition-colors hover:border-primario"
              >
                {perfil.contacto.linkedinTexto}
              </a>
              <span className="text-tintaSuave">{perfil.contacto.telefono}</span>
            </div>
          </div>

          {/* Retrato */}
          <div className="aparecer relative mx-auto hidden w-full max-w-sm lg:block" style={{ animationDelay: "0.2s" }}>
            <div className="absolute -bottom-4 -right-4 h-full w-full rounded-2xl bg-primario/12" />
            <img
              src="/perfil.jpg"
              alt={perfil.nombre}
              className="relative w-full rounded-2xl border border-borde object-cover shadow-[0_30px_70px_-35px_rgba(15,28,46,0.55)]"
            />
          </div>
        </div>
      </section>

      {/* ---------- MÉTRICAS ---------- */}
      <section className="border-b border-borde bg-superficie">
        <div className="mx-auto grid max-w-contenido grid-cols-2 divide-x divide-borde px-6 sm:grid-cols-4">
          {perfil.metricas.map((m) => (
            <div key={m.etiqueta} className="px-4 py-8 first:pl-0">
              <div className="font-display text-3xl font-semibold text-primario sm:text-4xl">
                {m.valor}
                {m.unidad && (
                  <span className="ml-1 text-base font-normal text-tintaSuave">{m.unidad}</span>
                )}
              </div>
              <div className="mt-1 text-xs leading-snug text-tintaSuave">{m.etiqueta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- COMPETENCIAS ---------- */}
      <section className="mx-auto max-w-contenido px-6 py-16">
        <p className="kicker text-acento">Áreas de competencia</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {perfil.competencias.map((c) => (
            <div key={c.area} className="rounded-xl border border-borde bg-superficie p-6">
              <h3 className="font-display text-lg font-semibold text-tinta">{c.area}</h3>
              <ul className="mt-3 space-y-2 text-sm text-tintaSuave">
                {c.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-acento" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- EXPERIENCIA ---------- */}
      <section className="border-y border-borde bg-superficie">
        <div className="mx-auto max-w-contenido px-6 py-16">
          <p className="kicker text-acento">Experiencia ejecutiva</p>
          <div className="mt-8 divide-y divide-borde">
            {perfil.experiencia.map((e) => (
              <div key={e.cargo + e.empresa} className="grid gap-2 py-7 sm:grid-cols-[1fr_2fr]">
                <div>
                  <h3 className="font-display text-lg font-semibold text-tinta">{e.cargo}</h3>
                  <p className="text-sm text-primario">{e.empresa}</p>
                  <p className="mt-1 text-xs text-tintaSuave">{e.periodo}</p>
                </div>
                <p className="text-sm leading-relaxed text-tintaSuave">{e.detalle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PROYECTOS (GRILLA) ---------- */}
      <section id="proyectos" className="mx-auto max-w-contenido scroll-mt-20 px-6 py-20">
        <div className="max-w-2xl">
          <p className="kicker text-acento">Portafolio de proyectos</p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-tinta sm:text-4xl">
            Proyectos y centros de seguimiento
          </h2>
          <p className="mt-3 text-base text-tintaSuave">
            Cada proyecto reúne uno o varios dashboards interactivos. Entra a un proyecto para ver
            su detalle y sus tableros de seguimiento.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((p) => (
            <ProyectoCard
              key={p.slug}
              proyecto={p}
              cantidadDashboards={getDashboardsByProyecto(p.slug).length}
            />
          ))}
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-borde bg-primario text-white">
        <div className="mx-auto flex max-w-contenido flex-col gap-4 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xl font-semibold">{perfil.nombre}</p>
            <p className="mt-1 text-sm text-white/70">{perfil.profesion}</p>
          </div>
          <div className="space-y-1 text-sm text-white/80">
            <p>{perfil.contacto.telefono}</p>
            <p>{perfil.contacto.email}</p>
            <p>{perfil.contacto.ubicacion}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
