# -*- coding: utf-8 -*-

"""

GENERADOR DEL PANEL CS PARACHIQUE

=================================

Arma los cinco tableros a partir de una única fuente de datos y los deja en

`panel/salida/`. Lo ejecuta GitHub Actions en cada cambio; también corre igual

en local para ver el resultado antes de subirlo.

    python panel/generar.py


Fuente de datos, por orden de preferencia:

  1. La hoja de cálculo publicada en `datos.sheetCsv`, si está configurada.

  2. `panel/datos-parachique.json` (siempre presente, es el respaldo).


Salida:

  panel/salida/dashboards/parachique-*/dashboard.html

  panel/salida/portada.txt          (portada del proyecto como data URI)


No edite los archivos de `salida/`: se rehacen en cada ejecución.

"""


import base64

import io

import json

import os

import sys

import urllib.error
import urllib.request

from pathlib import Path


BASE = Path(__file__).resolve().parent
_REGISTRO = []


def avisar(texto=""):
    """Informa por consola y guarda el texto para la bitácora de la base."""
    print(texto)
    _REGISTRO.append(str(texto))

PLANTILLAS = BASE / "plantillas"

RENDERS = BASE / "renders"

SALIDA = BASE / "salida"


# slug -> (plantilla, nombre, objetivo, icono, orden, recibe_datos_reservados)

TABLEROS = {
    "parachique-centro-mando": (
        "centro-mando.html", "Centro de Mando",
        "Vista ejecutiva de la supervisión de equipamiento: alertas de gestión, consumo del plazo "
        "contractual, estado de los 16 componentes del expediente y vistas del proyecto terminado.",
        "🧭", 1, False,
    ),
    "parachique-cartas": (
        "cartas.html", "Cartas y Respuestas",
        "Registro bidireccional de documentos por etapa: informes del Contratista que exigen "
        "pronunciamiento, respuestas emitidas y control del membrete oficial.",
        "📨", 2, False,
    ),
    "parachique-fichas": (
        "fichas.html", "Fichas Técnicas",
        "Estado de aprobación de las fichas técnicas de los 179 códigos de equipo y su incidencia en "
        "el presupuesto de equipamiento: cuántas faltan y cuánto valor representan.",
        "🗂️", 3, False,
    ),
    "parachique-valorizacion": (
        "valorizacion.html", "Valorización",
        "Hitos de pago por unidad, regla de valorización proporcional y requisitos previos para "
        "habilitar la etapa.",
        "📐", 4, False,
    ),
    "parachique-pagos": (
        "pagos.html", "Honorarios y Pagos",
        "Control económico reservado: devengado por numeral, estado de cobranza, recibos por "
        "honorarios emitidos y evidencias de abono.",
        "🔒", 5, True,
    ),

}


MODULOS_JS = ("_base.js", "_interruptores.js", "_filtros.js", "_visor.js", "_excel.js")


# Claves con información económica del suscrito: solo viajan al tablero reservado.

CLAVES_RESERVADAS = ("tarifario", "condiciones", "liquidaciones", "pagos", "recibos", "cuentas")


def datos_reservados() -> dict:
    """Trae de la base privada los bloques económicos del suscrito.

    Nunca viven en este repositorio, que es público: tarifario, condiciones,
    liquidaciones, pagos, recibos, cuentas bancarias y las alertas con importes
    están en la tabla `panel_reservado`, sin acceso anónimo. Solo la clave de
    servicio —secreto del repositorio— puede leerlos.

    Si no hay credenciales (por ejemplo al generar en local para ver el
    diseño), se devuelve vacío y el tablero de pagos sale sin cifras. Es el
    comportamiento correcto: mejor un tablero incompleto que cifras filtradas.
    """
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or ""
    if not url or not key:
        avisar("  aviso: sin credenciales de Supabase; el tablero reservado saldrá sin cifras.")
        return {}
    try:
        req = urllib.request.Request(
            f"{url}/rest/v1/panel_reservado?id=eq.parachique&select=datos")
        req.add_header("apikey", key)
        req.add_header("Authorization", f"Bearer {key}")
        with urllib.request.urlopen(req, timeout=45) as r:
            filas = json.loads(r.read().decode("utf-8"))
        d = (filas[0]["datos"] if filas else {}) or {}
        avisar(f"  bloques reservados leídos: {', '.join(d.keys()) or 'ninguno'}")
        return d
    except Exception as e:
        avisar(f"  aviso: no se pudieron leer los datos reservados ({e}).")
        return {}


def leer(ruta: Path) -> str:
    return ruta.read_text(encoding="utf-8")


def redactar(datos: dict) -> dict:
    """Copia sin la información económica del suscrito.

    Los tableros compartidos se sirven al Consorcio y a la Entidad: su HTML no
    debe contener honorarios, liquidaciones, recibos ni cuentas bancarias,
    aunque el portafolio los proteja con contraseña. Lo que no se envía no se
    puede filtrar.
    """
    import copy

    d = copy.deepcopy(datos)
    for clave in CLAVES_RESERVADAS:
        d.pop(clave, None)
    for doc in d.get("documentos", []):
        doc.pop("honorarioNeto", None)
    d["alertas"] = [a for a in d.get("alertas", []) if not a.get("reservada")]
    d["_reservado"] = False
    return d


BUCKET = "imagenes"

CARPETA_BUCKET = "parachique"


def url_publica(archivo: str) -> str:
    """Dirección pública de una imagen en el almacenamiento de Supabase."""
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    if not url:
        return ""
    return f"{url}/storage/v1/object/public/{BUCKET}/{CARPETA_BUCKET}/{archivo}"


def imagen_datauri(ruta: Path, ancho: int, calidad: int) -> str:
    """Devuelve la imagen como data URI. Sin Pillow, usa el archivo tal cual."""
    try:
        from PIL import Image

        im = Image.open(ruta)
        if im.width != ancho:
            im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
        buf = io.BytesIO()
        im.convert("RGB").save(buf, "JPEG", quality=calidad, optimize=True, progressive=True)
        crudo = buf.getvalue()
    except ImportError:
        crudo = ruta.read_bytes()
    return "data:image/jpeg;base64," + base64.b64encode(crudo).decode()


def galeria(datos: dict):
    """Renders del proyecto terminado, listos para incrustar."""
    salida = []
    for vista in datos.get("renders", {}).get("vistas", []):
        f = RENDERS / vista["archivo"]
        if not f.exists():
            continue
        salida.append({
            "titulo": vista["titulo"],
            "detalle": vista["detalle"],
            "archivo": vista["archivo"],
            # Referencia al almacenamiento: mantiene el HTML liviano y deja que
            # el navegador cachee la imagen entre visitas. Sin entorno (prueba
            # local) se incrusta, para poder ver el tablero abriendo el archivo.
            "uri": url_publica(vista["archivo"]) or imagen_datauri(f, 1100, 72),
        })
    return salida


def datos_de_la_hoja(cfg: dict):
    """Lee la hoja de cálculo publicada, si hay una configurada.

    Se espera un CSV publicado (Archivo → Compartir → Publicar en la web). No
    requiere credenciales, por eso la hoja debe ser de solo lectura pública.
    Si algo falla, se devuelve None y se usa el JSON del repositorio.
    """
    url = (cfg or {}).get("sheetCsv")
    if not url:
        return None
    try:
        with urllib.request.urlopen(url, timeout=45) as r:
            crudo = r.read().decode("utf-8")
        import csv

        filas = list(csv.DictReader(io.StringIO(crudo)))
        print(f"  hoja de cálculo leída: {len(filas)} filas")
        return filas
    except Exception as e:  # la hoja es una mejora, nunca un punto de fallo
        print(f"  aviso: no se pudo leer la hoja de cálculo ({e}). Se usa el JSON del repositorio.")
        return None


def aplicar_hoja(datos: dict, filas):
    """Vuelca el estado de las fichas técnicas que venga de la hoja.

    Columnas esperadas: `codigo`, `ficha` y, opcionalmente, `observacion`.
    Solo se toca lo que la hoja menciona; el resto del catálogo queda igual.
    """
    if not filas:
        return 0
    validos = {"SIN PRESENTAR", "PRESENTADA", "OBSERVADA", "APROBADA"}
    porCodigo = {c["cod"].strip().upper(): c for c in datos.get("catalogo", [])}
    cambios = 0
    for f in filas:
        cod = (f.get("codigo") or f.get("cod") or "").strip().upper()
        estado = (f.get("ficha") or f.get("estado") or "").strip().upper()
        if cod in porCodigo and estado in validos:
            porCodigo[cod]["ficha"] = estado
            obs = (f.get("observacion") or f.get("obs") or "").strip()
            porCodigo[cod]["obs"] = obs or None
            cambios += 1
    print(f"  estado de fichas actualizado desde la hoja: {cambios} códigos")
    return cambios


def main() -> int:
    datos = json.loads(leer(BASE / "datos-parachique.json"))

    filas = datos_de_la_hoja(datos.get("datos"))
    if filas:
        aplicar_hoja(datos, filas)

    reservado = datos_reservados()
    completos = dict(datos)
    completos.update({k: v for k, v in reservado.items() if k != "alertas"})
    completos["alertas"] = datos.get("alertas", []) + reservado.get("alertas", [])
    orden_nivel = {"CRITICA": 0, "SUSTANCIAL": 1, "LEVE": 2}
    completos["alertas"].sort(key=lambda a: orden_nivel.get(a.get("nivel"), 9))
    completos["_reservado"] = True

    css = leer(PLANTILLAS / "_base.css")
    js = "\n\n".join(leer(PLANTILLAS / n) for n in MODULOS_JS)
    json_reservado = json.dumps(completos, ensure_ascii=False, indent=2)
    json_compartido = json.dumps(redactar(datos), ensure_ascii=False, indent=2)
    renders_js = json.dumps(galeria(datos), ensure_ascii=False)

    generados = []
    for slug, (plantilla, nombre, objetivo, icono, orden, reservado) in TABLEROS.items():
        html = leer(PLANTILLAS / plantilla)
        for marca, contenido in (("/*__CSS__*/", css), ("/*__JS__*/", js)):
            if marca not in html:
                print(f"ERROR: {plantilla} no contiene {marca}")
                return 1
            html = html.replace(marca, contenido)
        html = html.replace("/*__DATOS__*/ null", json_reservado if reservado else json_compartido)
        if "/*__RENDERS__*/ []" in html:
            html = html.replace("/*__RENDERS__*/ []", renders_js)

        # Postgres no admite el carácter nulo en columnas de texto: si se cuela
        # uno en una plantilla, la publicación falla con 22P05. Se limpia aquí,
        # que es el único punto por el que pasa todo el HTML.
        if chr(0) in html:
            avisar(f"  aviso: se retiraron caracteres nulos de {plantilla}")
            html = html.replace(chr(0), "")

        destino = SALIDA / "dashboards" / slug
        destino.mkdir(parents=True, exist_ok=True)
        (destino / "dashboard.html").write_text(html, encoding="utf-8")
        (destino / "meta.json").write_text(json.dumps({
            "slug": slug, "proyecto": "parachique", "nombre": nombre,
            "objetivo": objetivo, "icono": icono, "orden": orden,
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        generados.append((slug, len(html), reservado))

    nombre_portada = datos.get("renders", {}).get("portada", "01.jpg")
    if (RENDERS / nombre_portada).exists():
        SALIDA.mkdir(parents=True, exist_ok=True)
        (SALIDA / "portada.txt").write_text(
            url_publica(nombre_portada) or imagen_datauri(RENDERS / nombre_portada, 1600, 82),
            encoding="utf-8")

    print("Panel CS PARACHIQUE generado\n")
    for slug, tam, reservado in generados:
        print(f"  {slug:26s} {tam / 1024:7.1f} KB   [{'RESERVADO' if reservado else 'compartido'}]")
    print(f"\nDatos al {datos['meta']['actualizado']} · "
          f"{len(datos['documentos'])} documentos · {len(datos['alertas'])} alertas · "
          f"{len(datos.get('catalogo', []))} códigos")

    # publicar.py sube este registro a la bitácora de la base, para poder
    # diagnosticar una corrida sin abrir los registros de GitHub Actions.
    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / "aviso.log").write_text(chr(10).join(_REGISTRO), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())

