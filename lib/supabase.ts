import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// IMPORTANTE: este fetch evita que Next.js (en Vercel) cachee las lecturas de
// Supabase. Sin esto, la lista de dashboards/proyectos se "congela" con los
// datos del primer build y los cambios hechos en el admin no aparecen en el
// sitio público. Con cache:"no-store" cada lectura es siempre en vivo.
const fetchSinCache: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

// Cliente público (en el navegador) — solo para lecturas sin sensibilidad
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchSinCache },
});

// Cliente servidor (solo en API routes) — acceso completo con service role
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  global: { fetch: fetchSinCache },
});

export type Database = any; // Actualizar si usas codegen de tipos

