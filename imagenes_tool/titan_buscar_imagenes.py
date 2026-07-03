# -*- coding: utf-8 -*-
"""
titan_buscar_imagenes.py
=========================
EJECUTAR EN TU ORDENADOR (no en un entorno con red restringida), porque
necesita acceso libre a ficheros.industriastitan.es.

Qué hace:
 1. Carga data/productos.json del repo (o una copia local que le pases).
 2. Filtra productos del área "pinturas" sin imagen_validada ni
    fecha_actualizacion_imagen, Y cuyo nombre, familia o subfamilia
    mencionen TITAN o AKZONOBEL (el resto de marcas —Kelsia, MPL,
    Quimibase...— no tiene sentido buscarlas en el servidor de Titan).
 3. Rastrea recursivamente el listado de ficheros de
    http://ficheros.industriastitan.es/titan/FOTOS%20ENVASES/
    (es un servidor h5ai: listados HTML simples, sin login).
 4. Normaliza nombres de producto y nombres de fichero (quitando también
    palabras de marca no discriminativas como "titan"/"akzonobel", que ya
    no aportan nada distintivo dentro de este lote) y empareja por
    similitud de tokens, exigiendo un mínimo de coincidencias reales
    (no solo ratio) para evitar falsos positivos.
 5. Descarga las imágenes candidatas a:
       imagenes_pendientes_revision/pinturas/<REFERENCIA>__<score>.png
    y genera un CSV "revision_pinturas.csv" con:
       referencia, nombre_producto, fichero_candidato, url, score, ruta_local
    para que revises visualmente antes de subir nada a Drive.

No sube nada a Google Drive ni modifica el Sheet: es solo un paso de
preparación para tu revisión manual (o para alimentar luego
`moverImagenesNuevasACarpetaPrincipal` con las que apruebes).

Requisitos:
    pip install requests beautifulsoup4

Uso:
    python titan_buscar_imagenes.py --productos ../data/productos.json --min-score 55
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import unicodedata
from urllib.parse import urljoin, unquote

import requests
from bs4 import BeautifulSoup

BASE_URL = "http://ficheros.industriastitan.es/titan/FOTOS%20ENVASES/"
EXTENSIONES_IMG = (".png", ".jpg", ".jpeg", ".webp")

# ── Normalización (versión standalone, igual criterio que normalizar.py) ──
ABREVIATURAS_PUNTO = {
    "C": "con", "P": "para", "S": "sin", "EDT": "eau de toilette",
    "EDP": "eau de parfum", "UDS": "unidades", "REF": "referencia",
    "RF": "referencia", "VAP": "vaporizador", "ESM": "esmalte",
    "PINT": "pintura", "GRS": "gramos", "GR": "gramos", "EST": "estuche",
    "MTS": "metros", "SAT": "satinado", "SINT": "sintetico",
    "LIQ": "liquido", "PROF": "profesional", "INST": "instituto",
    "URET": "uretano", "EXT": "exterior", "INT": "interior",
    "PERF": "perfume", "LIMP": "limpiador", "IMPERM": "impermeabilizante",
    "INTEMP": "intemperie", "DESINF": "desinfectante", "MOD": "modelo",
}
ABREVIATURAS_BARRA = {"C": "con", "P": "para", "S": "sin", "B": "bote"}
STOPWORDS = {"con", "para", "sin", "de", "del", "la", "el", "los", "las",
             "y", "en", "al", "un", "una"}

# Palabras que aparecen en (casi) todos los ficheros/productos de este lote
# porque ya hemos filtrado por marca — no discriminan, se excluyen del todo.
PALABRAS_MARCA_NO_DISCRIMINATIVAS = {"titan", "akzonobel", "pintura", "pinturas"}

# Palabras "débiles": describen tipo de producto o acabado, pero se repiten en
# decenas de líneas distintas (Oxiron, Acualux, Titanlak, Titanlux...), así
# que por sí solas NO son evidencia de que sea el producto correcto.
PALABRAS_DEBILES = {
    "barniz", "esmalte", "pintura", "brillo", "brillante", "satinado", "sat",
    "mate", "liso", "laca", "interior", "exterior", "agua", "al", "sintetico",
    "plastico", "impermeabilizante", "intemperie", "envase", "bote", "frontal",
    "foto", "fotos",
    "ml", "l", "kg", "gr", "g", "cm", "mm", "uds", "ud",
}

# Formatos de envase habituales (litros/mililitros como número suelto): son
# muy comunes y NO identifican por sí solos qué producto es, así que se tratan
# como débiles salvo que vayan acompañados de más coincidencias.
VOLUMENES_COMUNES = {
    "1", "2", "3", "4", "5", "10", "15", "20", "25", "30", "40", "50", "60",
    "70", "75", "80", "90", "100", "125", "150", "175", "200", "250", "300",
    "375", "400", "500", "600", "650", "700", "750", "800", "900", "1000",
    "2000", "2500", "4000", "5000", "15000",
}


def _sin_acentos(t):
    return "".join(c for c in unicodedata.normalize("NFKD", t) if not unicodedata.combining(c))


def normalizar(texto):
    if not texto:
        return ""
    t = texto.strip()
    # Números decimales con coma ("0,5 L.") -> punto, para no partirlos en
    # dos tokens sueltos ("0" y "5") que ensucien el matching.
    t = re.sub(r"(?<=\d),(?=\d)", ".", t)
    t = re.sub(
        r"\b(" + "|".join(ABREVIATURAS_BARRA) + r")/",
        lambda m: ABREVIATURAS_BARRA.get(m.group(1).upper(), m.group(1)) + " ",
        t, flags=re.IGNORECASE,
    )
    t = re.sub(
        r"\b(" + "|".join(ABREVIATURAS_PUNTO) + r")\.",
        lambda m: ABREVIATURAS_PUNTO.get(m.group(1).upper(), m.group(1)) + " ",
        t, flags=re.IGNORECASE,
    )
    t = re.sub(r"(?<=\d)\s*(ML|L|KG|GR|G|CM|MM|UDS|UD)\.?\b",
               lambda m: " " + m.group(1).lower() + " ", t, flags=re.IGNORECASE)
    # Paréntesis: el contenido (casi siempre un código de color, p.ej. "(859)")
    # es justo lo más valioso para identificar la variante exacta -> se deja
    # como palabra suelta en vez de perderse pegado a los símbolos.
    t = t.replace("(", " ").replace(")", " ")
    t = re.sub(r"(?<!\d)\.(?!\d)", " ", t)
    t = t.replace(",", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return _sin_acentos(t).lower()


def es_producto_titan_akzonobel(p):
    """True si el producto pertenece al universo que SÍ puede tener imagen en
    el servidor de Titan: nombre, familia o subfamilia mencionan TITAN o
    AKZONOBEL. El resto de pinturas (Kelsia, MPL, Quimibase...) se descarta
    porque no hay razón para esperar que Titan tenga su foto."""
    campos = " ".join([
        _sin_acentos(p.get("nombre", "")),
        _sin_acentos(p.get("familia", "")),
        _sin_acentos(p.get("subfamilia", "")),
    ]).upper()
    return "TITAN" in campos or "AKZONOBEL" in campos


def tokens(texto, quitar_marca=False):
    norm = normalizar(texto)
    stop = STOPWORDS | PALABRAS_MARCA_NO_DISCRIMINATIVAS if quitar_marca else STOPWORDS
    return [w for w in re.split(r"[\s\-_]+", norm) if w and w not in stop and len(w) > 1]


def _es_debil(tok):
    if tok in PALABRAS_DEBILES:
        return True
    numero = tok.replace(".", "", 1)
    if numero.isdigit() and numero in VOLUMENES_COMUNES:
        return True
    return False


def _es_codigo_fuerte(tok):
    """Token puramente numérico que NO es un formato de envase habitual:
    caso típico, código de color de 3-4 cifras (859, 1005, 1006...)."""
    return tok.isdigit() and tok not in VOLUMENES_COMUNES


def score_similitud(tokens_producto, tokens_fichero):
    """
    Puntuación 0-100 con dos niveles de evidencia:

    - Palabras "débiles" (barniz, satinado, ml, 750...) se repiten en
      decenas de líneas de producto distintas y por sí solas NO bastan
      para dar un match por bueno.
    - Palabras "fuertes" (nombre de línea: titanlak/acualux/oxiron, color:
      cerezo/oro/amarillo, código de color: 859/1005...) sí identifican
      el producto concreto.

    Regla dura: sin al menos 2 coincidencias fuertes (o 1 si es un código
    numérico de color, muy discriminativo por sí solo), el score es 0 —
    es preferible no sugerir nada a sugerir un producto de otra línea.
    """
    sp = set(t for t in tokens_producto if t not in PALABRAS_MARCA_NO_DISCRIMINATIVAS)
    sf = set(t for t in tokens_fichero if t not in PALABRAS_MARCA_NO_DISCRIMINATIVAS)
    if not sp or not sf:
        return 0.0

    inter = sp & sf
    fuertes_producto = [t for t in sp if not _es_debil(t)]
    fuertes_inter = [t for t in inter if not _es_debil(t)]
    codigo_en_inter = any(_es_codigo_fuerte(t) for t in inter)

    minimo_fuerte = 1 if len(fuertes_producto) <= 1 else 2
    if not codigo_en_inter and len(fuertes_inter) < minimo_fuerte:
        return 0.0

    def peso(t):
        return 0.25 if _es_debil(t) else 1.0

    peso_inter = sum(peso(t) for t in inter)
    peso_producto = sum(peso(t) for t in sp)
    # Cobertura sobre el producto (no Jaccard sobre la unión): los ficheros
    # de Titan suelen llevar códigos de serie sin sentido ("04G_0000_EBR.1_")
    # que no deben penalizar un acierto real solo por "sobrar" en el fichero.
    cobertura = peso_inter / peso_producto if peso_producto else 0.0

    bonus = 0.0
    if codigo_en_inter:
        bonus += 0.25
    if len(fuertes_inter) >= 2:
        bonus += 0.20

    return round(min((cobertura + bonus) * 100, 100), 1)


# ── Rastreo del servidor de ficheros (h5ai: HTML plano, <a href>) ──
def listar_directorio(url, sesion, vistos=None):
    """Devuelve lista de (nombre_fichero, url_absoluta) para todas las imágenes
    encontradas recursivamente a partir de `url`. Tolerante a fallos: si una
    subcarpeta da timeout o error de conexión, se reintenta un par de veces
    y si sigue fallando se salta (con aviso), pero NO aborta todo el rastreo
    — con un árbol tan profundo, es cuestión de tiempo que alguna carpeta
    falle puntualmente."""
    if vistos is None:
        vistos = set()
    if url in vistos:
        return []
    vistos.add(url)

    resp = None
    for intento in range(3):
        try:
            resp = sesion.get(url, timeout=30)
            resp.raise_for_status()
            break
        except requests.exceptions.RequestException as e:
            if intento < 2:
                time.sleep(1.5 * (intento + 1))
                continue
            print(f"  ! Aviso: no se pudo leer {url} tras 3 intentos ({e}). Se omite esa carpeta.")
            return []

    soup = BeautifulSoup(resp.text, "html.parser")

    imagenes = []
    subcarpetas = []
    for a in soup.select("a[href]"):
        href = a["href"]
        if href.startswith("..") or href in ("/", "./"):
            continue
        absoluta = urljoin(url, href)
        if not absoluta.startswith(BASE_URL.rsplit("FOTOS%20ENVASES", 1)[0]):
            continue  # no seguir enlaces fuera del dominio/base
        if absoluta.rstrip("/") == url.rstrip("/"):
            continue
        if href.endswith("/"):
            subcarpetas.append(absoluta)
        elif href.lower().endswith(EXTENSIONES_IMG):
            nombre = unquote(href.split("/")[-1])
            imagenes.append((nombre, absoluta))

    for sub in subcarpetas:
        imagenes.extend(listar_directorio(sub, sesion, vistos))
        time.sleep(0.1)  # cortesía, no martillear el servidor

    return imagenes


def obtener_catalogo_titan(sesion, cache_path, forzar_recarga=False, horas_cache=24):
    """Devuelve la lista [(nombre, url), ...] de todas las imágenes del
    servidor de Titan, usando una caché local en disco para no tener que
    rastrear el árbol entero (varios minutos, y sujeto a timeouts) cada vez
    que se lanza el script. La caché caduca a las `horas_cache` horas."""
    if not forzar_recarga and os.path.exists(cache_path):
        edad_horas = (time.time() - os.path.getmtime(cache_path)) / 3600
        if edad_horas < horas_cache:
            with open(cache_path, encoding="utf-8") as f:
                datos = json.load(f)
            print(f"  Usando caché local ({len(datos)} imágenes, generada hace {edad_horas:.1f} h).")
            print(f"  (Usa --recargar-cache para forzar un rastreo nuevo del servidor.)")
            return [(d["nombre"], d["url"]) for d in datos]

    ficheros = listar_directorio(BASE_URL, sesion)
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump([{"nombre": n, "url": u} for n, u in ficheros], f, ensure_ascii=False)
    return ficheros


def cargar_productos_pendientes(ruta_json):
    with open(ruta_json, encoding="utf-8") as f:
        data = json.load(f)
    productos = data["productos"] if isinstance(data, dict) else data
    pendientes = [
        p for p in productos
        if p.get("area") == "pinturas"
        and not p.get("imagen_validada")
        and not p.get("fecha_actualizacion_imagen")
    ]
    # Solo tiene sentido buscar en el servidor de Titan los productos que
    # realmente son de esa marca (o Akzonobel, que se distribuye desde el
    # mismo servidor). El resto (Kelsia, MPL, Quimibase...) se descarta.
    return [p for p in pendientes if es_producto_titan_akzonobel(p)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--productos", default="data/productos.json",
                     help="Ruta a productos.json")
    ap.add_argument("--salida", default="imagenes_pendientes_revision/pinturas",
                     help="Carpeta donde guardar las imágenes candidatas")
    ap.add_argument("--min-score", type=float, default=55.0,
                     help="Umbral mínimo de similitud (0-100) para descargar")
    ap.add_argument("--limite", type=int, default=0,
                     help="Máximo de productos a procesar (0 = todos)")
    ap.add_argument("--recargar-cache", action="store_true",
                     help="Ignora la caché local y vuelve a rastrear el servidor de Titan")
    ap.add_argument("--cache", default="catalogo_titan_cache.json",
                     help="Ruta del fichero de caché del catálogo de Titan")
    args = ap.parse_args()

    os.makedirs(args.salida, exist_ok=True)
    sesion = requests.Session()
    sesion.headers["User-Agent"] = "Mozilla/5.0 (compatible; OrencioMatasImgBot/1.0)"

    print("→ Obteniendo catálogo de imágenes de Titan (puede tardar unos minutos si no hay caché)...")
    ficheros = obtener_catalogo_titan(sesion, args.cache, forzar_recarga=args.recargar_cache)
    print(f"  {len(ficheros)} imágenes encontradas en el servidor de Titan.")

    catalogo = [
        (nombre, url, tokens(os.path.splitext(nombre)[0], quitar_marca=True))
        for nombre, url in ficheros
    ]

    productos = cargar_productos_pendientes(args.productos)
    if args.limite:
        productos = productos[: args.limite]
    print(f"→ {len(productos)} productos de PINTURAS TITAN/AKZONOBEL pendientes de validar a procesar.")

    filas = []
    try:
        for i, p in enumerate(productos, 1):
            # Incluir la subfamilia como contexto ayuda a distinguir líneas de
            # producto (p.ej. "Titan madera" vs "Titan Plástico al agua") aunque
            # no aparezca literalmente en el nombre del producto.
            texto_producto = p["nombre"] + " " + (p.get("subfamilia") or "")
            tp = tokens(texto_producto, quitar_marca=True)

            mejor_score, mejor_nombre, mejor_url = 0.0, None, None
            for nombre, url, tf in catalogo:
                s = score_similitud(tp, tf)
                if s > mejor_score:
                    mejor_score, mejor_nombre, mejor_url = s, nombre, url
            score, nombre_fichero, url = mejor_score, mejor_nombre, mejor_url

            ruta_local = ""
            if score >= args.min_score and url:
                ext = os.path.splitext(nombre_fichero)[1].lower() or ".png"
                # El nombre del fichero DEBE ser la referencia (EAN) + extensión,
                # sin nada más: es lo que espera el flujo de subida a Drive /
                # Sheet (imagenes_nuevas_pendientes_procesar usa nombre=EAN).
                ruta_local = os.path.join(args.salida, f"{p['ref']}{ext}")
                descargada = False
                for intento in range(2):
                    try:
                        r = sesion.get(url, timeout=30)
                        r.raise_for_status()
                        with open(ruta_local, "wb") as fimg:
                            fimg.write(r.content)
                        descargada = True
                        break
                    except Exception as e:
                        if intento == 0:
                            time.sleep(1.5)
                            continue
                        print(f"  ! Error descargando {url}: {e}")
                if not descargada:
                    ruta_local = ""

            filas.append({
                "referencia": p["ref"],
                "nombre_producto": p["nombre"],
                "fichero_candidato": nombre_fichero or "",
                "url": url or "",
                "score": score,
                "ruta_local": ruta_local,
            })

            if i % 50 == 0:
                print(f"  procesados {i}/{len(productos)}...")
    except KeyboardInterrupt:
        print("\n  Interrumpido por el usuario. Guardando lo procesado hasta ahora...")
    finally:
        csv_path = os.path.join(args.salida, "revision_pinturas.csv")
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=[
                "referencia", "nombre_producto", "fichero_candidato", "url", "score", "ruta_local"
            ])
            w.writeheader()
            w.writerows(filas)

        # CSV aparte solo con las que sí tienen imagen descargada en disco:
        # es el listado que necesitas para la subida a Drive / Sheet.
        descargadas = [f for f in filas if f["ruta_local"]]
        csv_descargadas_path = os.path.join(args.salida, "imagenes_descargadas.csv")
        with open(csv_descargadas_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=[
                "referencia", "nombre_producto", "nombre_archivo", "score"
            ])
            w.writeheader()
            for fila in descargadas:
                w.writerow({
                    "referencia": fila["referencia"],
                    "nombre_producto": fila["nombre_producto"],
                    "nombre_archivo": os.path.basename(fila["ruta_local"]),
                    "score": fila["score"],
                })

        print(f"\n✓ Listo. {len(descargadas)}/{len(filas)} productos con imagen candidata descargada.")
        print(f"  Listado completo (con y sin match): {csv_path}")
        print(f"  Solo descargadas (para subir a Drive): {csv_descargadas_path}")
        print(f"  Imágenes en: {args.salida}/  (nombradas <referencia>.ext)")


if __name__ == "__main__":
    main()
