// Sin reglas de bloqueo: la Home y la grilla son públicas (escaparate).
// El sellado del dashboard se logra en la vista /sv/<slug>,
// que no tiene enlaces de salida hacia el sitio.

import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
