"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Contraseña incorrecta");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fondo px-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-borde bg-superficie p-8">
        <h1 className="font-display text-2xl font-semibold text-tinta">Panel Admin</h1>
        <p className="mt-2 text-sm text-tintaSuave">Acceso restringido a administradores</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          disabled={cargando}
          className="mt-6 w-full rounded-lg border border-borde bg-fondo px-4 py-3 text-tinta outline-none transition-colors focus:border-primario disabled:opacity-50"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={cargando || password.length === 0}
          className="mt-6 w-full rounded-lg bg-primario px-4 py-3 font-medium text-white transition-colors hover:bg-primarioClaro disabled:opacity-50"
        >
          {cargando ? "Validando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
