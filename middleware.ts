import { NextRequest, NextResponse } from "next/server";

// Solo corre en la Home y en las páginas de proyectos.
// (No toca /sv, /api, /admin ni los archivos internos.)
export const config = {
  matcher: ["/", "/proyectos/:path*"],
};

export function middleware(req: NextRequest) {
  // ¿El visitante ya entró a algún dashboard? Su sesión deja una cookie "dash_<slug>".
  const cookieDash = req.cookies.getAll().find((c) => c.name.startsWith("dash_"));

  // Si tiene sesión de dashboard e intenta ir a tu Home o a la grilla,
  // lo devolvemos a su dashboard sellado. No puede salir.
  if (cookieDash) {
    const slug = cookieDash.name.slice("dash_".length);
    const destino = req.nextUrl.clone();
    destino.pathname = `/sv/${slug}`;
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  // Visitante anónimo (reclutador, etc.): pasa normal a tu Home neutra.
  return NextResponse.next();
}
