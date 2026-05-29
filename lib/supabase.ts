import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Cliente público (en el navegador) — solo para lecturas sin sensibilidad
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Cliente servidor (solo en API routes) — acceso completo con service role
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export type Database = any; // Actualizar si usas codegen de tipos
