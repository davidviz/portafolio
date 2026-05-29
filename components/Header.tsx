import Link from "next/link";
import { perfil } from "@/config/perfil";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-fondo/85 backdrop-blur">
      <div className="mx-auto flex max-w-contenido items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primario font-display text-lg font-semibold text-white">
            V
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-base font-semibold text-tinta">
              David Vizcarra
            </span>
            <span className="text-xs text-tintaSuave">CIP 193686</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/#proyectos" className="hidden text-tintaSuave transition-colors hover:text-primario sm:block">
            Proyectos
          </Link>
          <a
            href={perfil.contacto.linkedin}
            target="_blank"
            rel="noreferrer"
            className="hidden text-tintaSuave transition-colors hover:text-primario sm:block"
          >
            LinkedIn
          </a>
          <a
            href={`tel:${perfil.contacto.telefono.replace(/\s/g, "")}`}
            className="rounded-full bg-primario px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primarioClaro"
          >
            Contactar
          </a>
        </nav>
      </div>
    </header>
  );
}
