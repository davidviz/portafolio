# -*- coding: utf-8 -*-
"""
PUBLICADOR DEL PANEL CS PARACHIQUE  —  lo ejecuta GitHub Actions
================================================================
Sube a Supabase los tableros generados por `panel/generar.py` y refresca la
ficha del proyecto. Usa la clave de servicio que ya vive como secreto del
repositorio, de modo que nadie tiene que escribir ninguna contraseña.

    SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python panel/publicar.py

QUÉ TOCA Y QUÉ NO
  · Actualiza: html, nombre, objetivo, icono, orden, actualizado_en.
  · NO toca:  password_hash ni es_publico. Publicar contenido nunca cambia
              quién puede entrar. Las contraseñas se administran desde /admin.
  · No toca ningún tablero que no empiece por «parachique-».
"""

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent
SALIDA = BASE / "salida"

# Todo lo que se informa queda también en la bitácora de la base, para poder
# diagnosticar una corrida sin abrir los registros de GitHub Actions.
_BITACORA = []


def avisar(texto=""):
    print(texto)
    _BITACORA.append(str(texto))

URL = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY") or ""


BUCKET = "imagenes"
CARPETA_BUCKET = "parachique"
RENDERS = BASE / "renders"


def subir_imagenes() -> int:
    """Sube los renders al almacenamiento público del proyecto.

    Se hace antes de publicar los tableros porque estos los referencian por
    URL. Incrustarlas en el HTML hacía que el Centro de Mando pesara 810 KB y
    la petición fuera rechazada; además, así el navegador las cachea.
    """
    if not RENDERS.exists():
        return 0
    subidas = 0
    for f in sorted(RENDERS.glob("*.jpg")):
        req = urllib.request.Request(
            f"{URL}/storage/v1/object/{BUCKET}/{CARPETA_BUCKET}/{f.name}",
            data=f.read_bytes(), method="POST")
        req.add_header("apikey", KEY)
        req.add_header("Authorization", f"Bearer {KEY}")
        req.add_header("Content-Type", "image/jpeg")
        req.add_header("x-upsert", "true")
        req.add_header("Cache-Control", "public, max-age=31536000, immutable")
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                if r.status in (200, 201):
                    subidas += 1
        except urllib.error.HTTPError as e:
            avisar(f"  imagen {f.name}: ERROR {e.code} {e.read().decode('utf-8','ignore')[:160]}")
    avisar(f"  imágenes en el almacenamiento: {subidas} de {len(list(RENDERS.glob('*.jpg')))}")
    return subidas


def rest(metodo, camino, cuerpo=None, extra=None):
    datos = json.dumps(cuerpo).encode("utf-8") if cuerpo is not None else None
    req = urllib.request.Request(f"{URL}/rest/v1/{camino}", data=datos, method=metodo)
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", extra or "return=representation")
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            texto = r.read().decode("utf-8")
            return r.status, (json.loads(texto) if texto.strip() else [])
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode("utf-8", "ignore")[:400]}


def main() -> int:
    if not URL or not KEY:
        avisar("ERROR: faltan SUPABASE_URL o SUPABASE_SERVICE_KEY.")
        return 1

    carpetas = sorted((SALIDA / "dashboards").glob("parachique-*"))
    if not carpetas:
        avisar("ERROR: no hay tableros en panel/salida. Ejecute antes panel/generar.py")
        return 1

    aviso = SALIDA / "aviso.log"
    if aviso.exists():
        for linea in aviso.read_text(encoding="utf-8").splitlines():
            if linea.strip():
                avisar("  [generación] " + linea.strip())

    subir_imagenes()

    estado, existentes = rest("GET", "dashboards?select=slug,id&proyecto_slug=eq.parachique")
    if estado != 200:
        avisar(f"ERROR leyendo tableros ({estado}): {existentes}")
        return 1
    conocidos = {d["slug"] for d in existentes}

    ahora = datetime.now(timezone.utc).isoformat()
    fallos = 0
    for carpeta in carpetas:
        meta = json.loads((carpeta / "meta.json").read_text(encoding="utf-8"))
        html = (carpeta / "dashboard.html").read_text(encoding="utf-8")
        slug = meta["slug"]

        campos = {
            "nombre": meta["nombre"],
            "objetivo": meta["objetivo"],
            "icono": meta["icono"],
            "orden": meta["orden"],
            "html": html,
            "actualizado_en": ahora,
        }

        if slug in conocidos:
            estado, resp = rest("PATCH", f"dashboards?slug=eq.{slug}", campos, "return=minimal")
            accion = "actualizado"
        else:
            # Alta solo si aún no existe. Nace privado y sin contraseña: se le
            # asigna desde /admin, para no dejar claves escritas en el repo.
            campos.update({"slug": slug, "proyecto_slug": "parachique", "es_publico": False})
            estado, resp = rest("POST", "dashboards", campos, "return=minimal")
            accion = "creado (asigne su contraseña en /admin)"

        if estado in (200, 201, 204):
            avisar(f"  {slug:26s} {accion:38s} {len(html)/1024:7.0f} KB")
        else:
            pista = "  (el cuerpo excede el límite de la API; revise el peso del HTML)" if estado == 413 else ""
            avisar(f"  {slug:26s} ERROR {estado}{pista}: {resp}")
            fallos += 1

    # Portada del proyecto
    portada = SALIDA / "portada.txt"
    if portada.exists():
        estado, resp = rest("PATCH", "proyectos?slug=eq.parachique",
                            {"imagen_url": portada.read_text(encoding="utf-8").strip()},
                            "return=minimal")
        avisar(f"  portada del proyecto        {'actualizada' if estado in (200, 204) else f'ERROR {estado}: {resp}'}")
        if estado not in (200, 204):
            fallos += 1

    if fallos:
        avisar(f"\nTerminó con {fallos} error(es).")
        return 1
    avisar("\nPublicado. https://portafolio-alpha-brown-61.vercel.app/proyectos/parachique")
    return 0


def guardar_bitacora(ok: bool):
    """Deja el resultado en la base. Nunca hace fallar la publicación."""
    if not URL or not KEY:
        return
    try:
        rest("POST", "panel_bitacora",
             {"proyecto": "parachique", "ok": ok,
              "detalle": chr(10).join(_BITACORA)[:8000]},
             "return=minimal")
    except Exception:
        pass


if __name__ == "__main__":
    try:
        codigo = main()
    except Exception as e:
        import traceback
        avisar("EXCEPCIÓN NO CONTROLADA:")
        avisar(traceback.format_exc()[:4000])
        codigo = 1
    guardar_bitacora(codigo == 0)
    sys.exit(codigo)
