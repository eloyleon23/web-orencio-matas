# -*- coding: utf-8 -*-
"""
buscar_imagenes_api.py
========================
EJECUTAR EN TU ORDENADOR. Busca imágenes para productos de drogería/
perfumería usando la Google Custom Search API (búsqueda de imágenes),
restringida SIEMPRE al dominio oficial del fabricante — nunca busca en
Amazon, retailers ni agregadores, precisamente para evitar el problema de
derechos de imagen que ya hablamos (esas fotos son propiedad del vendedor,
no del fabricante).

Qué hace:
 1. Carga data/productos.json, filtra productos de área drogueria/perfumeria
    sin imagen_validada ni fecha_actualizacion_imagen.
 2. Detecta la marca a partir del nombre del producto (primera palabra,
    comparada contra marcas_dominios.json).
 3. Si la marca no tiene dominio configurado, el producto se omite y se
    anota en sin_dominio_configurado.csv (para que amplíes el mapa de
    marcas cuando quieras, o me pidas que investigue más dominios).
 4. Si tiene dominio, llama a la API de búsqueda de imágenes de Google
    restringida a ese dominio (siteSearch) y descarga el primer resultado.
 5. Genera imagenes_descargadas.csv (mismo formato que el resto del
    pipeline: referencia, nombre_producto, nombre_archivo, score) — se
    puede usar directamente con generar_revision_html.py y
    sincronizar_drive_sheet.py, sin tocar nada de esos dos scripts.

IMPORTANTE — a diferencia del matching de Titán (basado en similitud de
texto contra nombres de fichero reales), aquí el "score" no mide una
coincidencia calculada: es un valor fijo (75) que solo indica "encontrado
vía API, pendiente de revisión visual". La revisión manual en la galería
sigue siendo imprescindible.

═══════════════════════════════════════════════════════════════
CONFIGURACIÓN (una sola vez):

  1. En el mismo proyecto de Google Cloud que ya usas para Drive/Sheets
     (console.cloud.google.com, proyecto 653585333298), habilita la
     "Custom Search API" en "APIs y servicios" → "Biblioteca".
  2. Ve a https://programmablesearchengine.google.com/ → "Añadir" →
     crea un motor de búsqueda con "Buscar en toda la Web" activado
     (no lo restrinjas a sitios concretos al crearlo: la restricción por
     dominio se hace en cada consulta con el parámetro siteSearch, ver
     abajo). Activa también "Búsqueda de imágenes" en su configuración.
     Copia el "ID de motor de búsqueda" (cx).
  3. "APIs y servicios" → "Credenciales" → "Crear credenciales" →
     "Clave de API". Puedes restringirla a la Custom Search API.
  4. Crea `google_search_credentials.json` en esta carpeta:
        {"api_key": "TU_CLAVE", "cx": "TU_ID_DE_MOTOR"}

COSTE: 100 consultas/día gratis. A partir de ahí, 5 USD por cada 1000
consultas (máximo 10.000/día). Con ~5.900 productos pendientes en
drogería+perfumería, hacerlo todo de una vez costaría en torno a 25-30 USD;
repartido en el tramo gratuito llevaría unos 60 días. Usa --limite para
controlar cuánto gastas/tardas en cada ejecución.
═══════════════════════════════════════════════════════════════

Uso:
    python buscar_imagenes_api.py --limite 20 --dry-run   # primero simula
    python buscar_imagenes_api.py --limite 90             # dentro del tramo gratis diario
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import unicodedata

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from normalizar import normalizar_nombre

API_URL = "https://www.googleapis.com/customsearch/v1"
EXTENSIONES_VALIDAS = (".jpg", ".jpeg", ".png", ".webp")


def _sin_acentos(t):
    return "".join(c for c in unicodedata.normalize("NFKD", t or "") if not unicodedata.combining(c)).upper()


def cargar_mapa_marcas(ruta):
    with open(ruta, encoding="utf-8") as f:
        data = json.load(f)
    return {k: v for k, v in data.items() if not k.startswith("_")}


def detectar_marca(nombre, mapa_marcas):
    nombre_norm = _sin_acentos(nombre)
    # Coincidencia por palabra completa al inicio del nombre (patrón dominante
    # observado: "BABARIA CHAMPU...", "NIVEA BODY MILK...")
    for marca in mapa_marcas:
        if re.match(rf"^{re.escape(marca)}\b", nombre_norm):
            return marca
    # Si no está al principio, buscar en cualquier parte del nombre
    for marca in mapa_marcas:
        if re.search(rf"\b{re.escape(marca)}\b", nombre_norm):
            return marca
    return None


def cargar_productos_pendientes(ruta_json, areas):
    with open(ruta_json, encoding="utf-8") as f:
        data = json.load(f)
    productos = data["productos"] if isinstance(data, dict) else data
    return [
        p for p in productos
        if p.get("area") in areas
        and not p.get("imagen_validada")
        and not p.get("fecha_actualizacion_imagen")
    ]


def buscar_imagen(api_key, cx, query, dominio, sesion):
    params = {
        "key": api_key,
        "cx": cx,
        "q": query,
        "searchType": "image",
        "siteSearch": dominio,
        "siteSearchFilter": "i",  # incluir SOLO resultados de ese dominio
        "num": 1,
        "safe": "active",
    }
    resp = sesion.get(API_URL, params=params, timeout=20)
    if resp.status_code == 429:
        raise RuntimeError("cuota diaria de la API agotada (429)")
    if resp.status_code == 403:
        # Extraer el motivo REAL que da Google (facturacion, API no habilitada,
        # clave restringida...), no solo "403 Forbidden" — eso es lo que
        # necesitas ver para arreglarlo, no el codigo HTTP desnudo.
        try:
            detalle = resp.json().get("error", {}).get("message", resp.text[:300])
        except Exception:
            detalle = resp.text[:300]
        raise ConfigError(f"403 de la API de Google: {detalle}")
    resp.raise_for_status()
    data = resp.json()
    items = data.get("items", [])
    if not items:
        return None
    return items[0].get("link")


class ConfigError(Exception):
    """Error de configuracion (permisos, facturacion, clave...) — no tiene
    sentido seguir intentando las siguientes consultas si esto falla, todas
    fallarian igual, así que se detiene la ejecucion en vez de gastar el
    resto del limite en errores identicos."""
    pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--productos", default="../data/productos.json")
    ap.add_argument("--dominios", default="marcas_dominios.json")
    ap.add_argument("--credenciales", default="google_search_credentials.json")
    ap.add_argument("--areas", default="drogueria,perfumeria",
                     help="Áreas a procesar, separadas por coma")
    ap.add_argument("--salida", default="imagenes_pendientes_revision/drogueria_perfumeria")
    ap.add_argument("--limite", type=int, default=20,
                     help="Máximo de CONSULTAS A LA API a realizar en esta ejecución (cuidado con la cuota/coste)")
    ap.add_argument("--dry-run", action="store_true",
                     help="Muestra qué buscaría y con qué dominio, sin llamar a la API ni descargar nada")
    args = ap.parse_args()

    mapa_marcas = cargar_mapa_marcas(args.dominios)
    print(f"→ {len(mapa_marcas)} marcas con dominio oficial configurado.")

    areas = [a.strip() for a in args.areas.split(",")]
    productos = cargar_productos_pendientes(args.productos, areas)
    print(f"→ {len(productos)} productos pendientes en áreas {areas}.")

    api_key = cx = None
    sesion = requests.Session()
    if not args.dry_run:
        if not os.path.exists(args.credenciales):
            print(f"[ERROR] No encuentro {args.credenciales}. Revisa la sección de configuración en la cabecera del script.")
            sys.exit(1)
        with open(args.credenciales, encoding="utf-8") as f:
            cred = json.load(f)
        api_key, cx = cred["api_key"], cred["cx"]
        os.makedirs(args.salida, exist_ok=True)

    encontradas = []
    sin_dominio = []
    sin_resultado = []
    consultas_realizadas = 0

    for p in productos:
        if consultas_realizadas >= args.limite:
            print(f"\nLímite de {args.limite} consultas alcanzado en esta ejecución. "
                  f"Vuelve a lanzar el script para continuar con el resto.")
            break

        # La marca a veces no está en el nombre del producto sino en la
        # "familia" (p.ej. VIJUSA: 44 productos como "OPERA AMBIENTADOR",
        # "TENSOGEL GEL LAVAMANOS"... agrupados bajo familia=VIJUSA sin
        # mencionar VIJUSA en el nombre).
        marca = detectar_marca(p["nombre"], mapa_marcas) or detectar_marca(p.get("familia", ""), mapa_marcas)
        if not marca:
            sin_dominio.append({"referencia": p["ref"], "nombre_producto": p["nombre"], "motivo": "marca no detectada"})
            continue
        dominio = mapa_marcas[marca]

        query = normalizar_nombre(p["nombre"], para_busqueda=False)

        if args.dry_run:
            print(f"  {p['ref']}: {query!r}  ->  site:{dominio}")
            consultas_realizadas += 1
            continue

        try:
            url_imagen = buscar_imagen(api_key, cx, query, dominio, sesion)
            consultas_realizadas += 1
        except RuntimeError as e:
            print(f"\n[STOP] {e}. Progreso guardado hasta aquí.")
            break
        except ConfigError as e:
            print(f"\n[STOP] Error de configuración — todas las consultas fallarían igual, así que paro aquí:")
            print(f"       {e}")
            print(f"       Revisa: API habilitada, facturación vinculada, restricciones de la clave.")
            break
        except Exception as e:
            sin_resultado.append({"referencia": p["ref"], "nombre_producto": p["nombre"], "motivo": str(e)})
            continue

        if not url_imagen:
            sin_resultado.append({"referencia": p["ref"], "nombre_producto": p["nombre"], "motivo": "sin resultados"})
            print(f"  {p['ref']}: sin resultados en {dominio}")
            continue

        ext = os.path.splitext(url_imagen.split("?")[0])[1].lower()
        if ext not in EXTENSIONES_VALIDAS:
            ext = ".jpg"
        nombre_archivo = f"{p['ref']}{ext}"
        ruta_local = os.path.join(args.salida, nombre_archivo)

        try:
            r = sesion.get(url_imagen, timeout=20)
            r.raise_for_status()
            with open(ruta_local, "wb") as f:
                f.write(r.content)
            encontradas.append({
                "referencia": p["ref"],
                "nombre_producto": p["nombre"],
                "nombre_archivo": nombre_archivo,
                "score": 75,
            })
            print(f"  {p['ref']}: OK  ({marca} -> {dominio})")
        except Exception as e:
            sin_resultado.append({"referencia": p["ref"], "nombre_producto": p["nombre"], "motivo": f"error descarga: {e}"})

        time.sleep(0.3)  # cortesía, no martillear la API

    if args.dry_run:
        print(f"\n(simulación) {consultas_realizadas} consultas se habrían realizado.")
        return

    os.makedirs(args.salida, exist_ok=True)
    with open(os.path.join(args.salida, "imagenes_descargadas.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "nombre_archivo", "score"])
        w.writeheader()
        w.writerows(encontradas)

    with open(os.path.join(args.salida, "sin_dominio_configurado.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "motivo"])
        w.writeheader()
        w.writerows(sin_dominio)

    with open(os.path.join(args.salida, "sin_resultado.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "motivo"])
        w.writeheader()
        w.writerows(sin_resultado)

    print(f"\n✓ {len(encontradas)} imágenes descargadas ({consultas_realizadas} consultas usadas).")
    print(f"  {len(sin_dominio)} sin marca/dominio configurado -> sin_dominio_configurado.csv")
    print(f"  {len(sin_resultado)} con dominio pero sin resultado -> sin_resultado.csv")
    print(f"  Revisa con: python generar_revision_html.py --carpeta {args.salida}")


if __name__ == "__main__":
    main()
