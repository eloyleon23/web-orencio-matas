# -*- coding: utf-8 -*-
"""
buscar_imagenes_excel.py
========================
Busca imágenes para productos nuevos a partir de un Excel filtrado.

Qué hace:
  1. Lee un Excel filtrado de productos nuevos (columnas: referencia, nombre, 
     familia, area, codigo)
  2. Busca la imagen adecuada usando:
     - Primero: nombre/descripción del producto
     - Luego: familia y código/referencia
  3. Descarga la imagen encontrada y la nombra como <referencia>.ext
  4. Guarda las imágenes en un directorio temporal para evaluación manual
  5. Genera un CSV con la información de las imágenes descargadas

Métodos de búsqueda (en orden de prioridad):
  - Para droguería/perfumería: APIs gratuitas de WooCommerce/WordPress (buscar_imagenes_gratis.py)
  - Para pinturas: servidor de Titan (titan_buscar_imagenes.py)
  - Fallback: Google Custom Search API (buscar_imagenes_api.py)

Uso:
    python buscar_imagenes_excel.py --excel productos_nuevos.xlsx --salida imagenes_temp
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import unicodedata
from datetime import datetime

import requests
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from normalizar import normalizar_nombre, tokens_clave

EXTENSIONES_VALIDAS = (".jpg", ".jpeg", ".png", ".webp")
TIMEOUT = 6  # bajado de 12s: si un dominio no responde en 6s a una API sencilla, no merece la pena esperar más


def dominio_no_responde(motivo):
    """True si buscar_imagen_gratis() falló en TODOS los métodos probados
    por error de red/timeout (dominio caído, DNS que no resuelve, conexión
    que no responde) — a diferencia de "no encontrado", que sí significa
    que el dominio respondió pero no tenía el producto. Sirve para
    abandonar un dominio que no coopera en cuanto se detecta, en vez de
    seguir insistiendo con las demás queries de texto contra el mismo
    dominio muerto (causa real de quedarse colgado varios minutos en un
    solo producto)."""
    partes = motivo.split(" | ")
    return len(partes) >= 1 and all("error de red" in p for p in partes)


def _sin_acentos(t):
    if t is None:
        return ""
    t_str = str(t) if not isinstance(t, str) else t
    return "".join(c for c in unicodedata.normalize("NFKD", t_str or "") if not unicodedata.combining(c)).upper()


def cargar_mapa_marcas(ruta):
    with open(ruta, encoding="utf-8") as f:
        data = json.load(f)
    return {k: v for k, v in data.items() if not k.startswith("_")}


def _tokens_significativos(texto):
    return set(w for w in re.findall(r"[A-Z0-9]+", _sin_acentos(texto or "")) if len(w) > 2)


def resultado_coincide_con_query(nombre_resultado, query, umbral=0.34):
    """Compara el nombre del producto que devolvió la búsqueda del sitio
    contra la query que se envió — para RECHAZAR resultados que la propia
    web devolvió pero que en realidad no tienen nada que ver. Las
    búsquedas de WooCommerce suelen ser laxas: si no hay coincidencia
    exacta, muchas devuelven "lo más parecido que encuentran" en vez de
    una lista vacía, y sin esta comprobación el script se lo creía sin
    más — la causa más probable de que las imágenes encontradas no
    tuvieran relación con el producto real.
    Umbral 0.34 ≈ al menos 1 de cada 3 palabras de la query (sin contar
    palabras de relleno) debe aparecer también en el nombre del
    resultado."""
    if not nombre_resultado:
        return False
    t_query = _tokens_significativos(query)
    t_resultado = _tokens_significativos(nombre_resultado)
    if not t_query:
        return False
    solapamiento = len(t_query & t_resultado) / len(t_query)
    return solapamiento >= umbral


def detectar_marca(nombre, mapa_marcas):
    """Detecta la marca del producto buscando en el nombre de forma más flexible."""
    if not nombre:
        return None
    
    nombre_norm = _sin_acentos(str(nombre))
    
    # Ordenar marcas por longitud (descendente) para priorizar coincidencias más específicas
    marcas_ordenadas = sorted(mapa_marcas.keys(), key=len, reverse=True)
    
    # Primero buscar al inicio del nombre (más probable que sea la marca)
    for marca in marcas_ordenadas:
        if re.match(rf"^{re.escape(marca)}\b", nombre_norm, re.IGNORECASE):
            return marca
    
    # Luego buscar en cualquier parte del nombre
    for marca in marcas_ordenadas:
        if re.search(rf"\b{re.escape(marca)}\b", nombre_norm, re.IGNORECASE):
            return marca
    
    # Último recurso: buscar coincidencia parcial (para marcas con espacios como "DON LIMPIO")
    for marca in marcas_ordenadas:
        if " " in marca:
            marca_sin_espacio = marca.replace(" ", "")
            if marca_sin_espacio in nombre_norm.replace(" ", ""):
                return marca
    
    return None


# ── Métodos de búsqueda gratuitos (WooCommerce/WordPress) ──
def _probar_store_api(dominio, query, sesion):
    url = f"https://{dominio}/wp-json/wc/store/v1/products"
    r = sesion.get(url, params={"search": query, "per_page": 5}, timeout=TIMEOUT)
    if r.status_code != 200:
        return None, f"store_api HTTP {r.status_code}"
    try:
        items = r.json()
    except ValueError:
        return None, "store_api respuesta no es JSON"
    if not isinstance(items, list) or not items:
        return None, "store_api 200 pero 0 resultados"
    nombre_resultado = items[0].get("name", "")
    if not resultado_coincide_con_query(nombre_resultado, query):
        return None, f"store_api encontró {nombre_resultado!r} pero no se parece a la query — descartado"
    imagenes = items[0].get("images") or []
    if not imagenes:
        return None, "store_api encontró producto pero sin imagen"
    return imagenes[0].get("src"), "store_api OK"


def _probar_wc_legacy_api(dominio, query, sesion):
    url = f"https://{dominio}/wp-json/wc/v1/products"
    r = sesion.get(url, params={"search": query, "per_page": 5}, timeout=TIMEOUT)
    if r.status_code != 200:
        return None, f"wc_legacy HTTP {r.status_code}"
    try:
        items = r.json()
    except ValueError:
        return None, "wc_legacy respuesta no es JSON"
    if not isinstance(items, list) or not items:
        return None, "wc_legacy 200 pero 0 resultados"
    nombre_resultado = items[0].get("name", "")
    if not resultado_coincide_con_query(nombre_resultado, query):
        return None, f"wc_legacy encontró {nombre_resultado!r} pero no se parece a la query — descartado"
    imagenes = items[0].get("images") or []
    if not imagenes:
        return None, "wc_legacy encontró producto pero sin imagen"
    return imagenes[0].get("src"), "wc_legacy OK"


def _probar_wp_search(dominio, query, sesion):
    url = f"https://{dominio}/wp-json/wp/v2/search"
    r = sesion.get(url, params={"search": query, "subtype": "product", "per_page": 5}, timeout=TIMEOUT)
    if r.status_code != 200:
        return None, f"wp_search HTTP {r.status_code}"
    try:
        items = r.json()
    except ValueError:
        return None, "wp_search respuesta no es JSON"
    if not isinstance(items, list) or not items:
        return None, "wp_search 200 pero 0 resultados"
    nombre_resultado = items[0].get("title", "")
    if not resultado_coincide_con_query(nombre_resultado, query):
        return None, f"wp_search encontró {nombre_resultado!r} pero no se parece a la query — descartado"
    post_id = items[0].get("id")
    if not post_id:
        return None, "wp_search sin id de post"
    r2 = sesion.get(f"https://{dominio}/wp-json/wp/v2/product/{post_id}", timeout=TIMEOUT)
    if r2.status_code != 200:
        return None, f"wp_search post HTTP {r2.status_code}"
    data = r2.json()
    featured = data.get("featured_media")
    if not featured:
        return None, "wp_search post sin imagen destacada"
    r3 = sesion.get(f"https://{dominio}/wp-json/wp/v2/media/{featured}", timeout=TIMEOUT)
    if r3.status_code != 200:
        return None, f"wp_search media HTTP {r3.status_code}"
    media = r3.json()
    return media.get("source_url"), "wp_search OK"


METODOS_GRATUITOS = [
    ("store_api", _probar_store_api),
    ("wc_legacy", _probar_wc_legacy_api),
    ("wp_search", _probar_wp_search),
]


def buscar_imagen_gratis(dominio, query, sesion):
    """Prueba los 3 métodos gratuitos en orden."""
    motivos = []
    for nombre_metodo, funcion in METODOS_GRATUITOS:
        try:
            url, motivo = funcion(dominio, query, sesion)
            motivos.append(motivo)
            if url:
                return url, nombre_metodo, motivo
        except requests.exceptions.RequestException as e:
            motivos.append(f"{nombre_metodo} error de red: {e}")
            continue
    return None, None, " | ".join(motivos)


# ── Scraping directo de webs oficiales (fallback agresivo) ──
def buscar_imagen_scraping(dominio, query, sesion):
    """Busca imágenes directamente en la página de resultados de búsqueda
    del sitio (mediante scraping, no API estructurada). Requiere que el
    texto alt de la imagen coincida de verdad con la query (misma
    comprobación que en los métodos de API) — antes se aceptaba con solo
    que UNA de las 3 primeras palabras de la query apareciera como
    subcadena en alt+src, lo que enganchaba con facilidad logos, iconos o
    banners de la propia web (p.ej. el nombre de la marca aparece en el
    logo de casi cualquier página del sitio). Se ha quitado también el
    fallback de "si no hay nada en resultados, mirar la portada entera" —
    rebuscar en TODAS las imágenes de la home es aún menos fiable que la
    página de resultados, y era la vía más probable de acabar trayendo el
    logo de la empresa en vez de una foto de producto."""
    try:
        search_url = f"https://{dominio}/"
        params = {"s": query}  # Parámetro típico de búsqueda en WordPress

        resp = sesion.get(search_url, params=params, timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code != 200:
            return None, f"scraping HTTP {resp.status_code}"

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")

        mejor_candidato = None
        mejor_solapamiento = 0.0

        for img in soup.select("img"):
            src = img.get("src", "")
            alt = img.get("alt", "")

            if not src or not alt:
                continue  # sin alt no hay forma fiable de validar relevancia — descartar, no arriesgar
            if not any(src.lower().split("?")[0].endswith(ext) for ext in EXTENSIONES_VALIDAS):
                continue

            t_query = _tokens_significativos(query)
            t_alt = _tokens_significativos(alt)
            if not t_query:
                continue
            solapamiento = len(t_query & t_alt) / len(t_query)

            # Igual que en los métodos de API: al menos ~1/3 de las
            # palabras significativas de la query deben aparecer en el
            # alt de la imagen para considerarla relevante.
            if solapamiento >= 0.34 and solapamiento > mejor_solapamiento:
                mejor_solapamiento = solapamiento
                if src.startswith("//"):
                    src_abs = "https:" + src
                elif src.startswith("/"):
                    src_abs = f"https://{dominio}" + src
                elif not src.startswith("http"):
                    src_abs = f"https://{dominio}/{src.lstrip('/')}"
                else:
                    src_abs = src
                mejor_candidato = (src_abs, f"Scraping resultados (alt: {alt[:40]!r}, solapamiento {solapamiento:.2f})")

        if mejor_candidato:
            return mejor_candidato

        return None, "scraping sin ninguna imagen con alt suficientemente relevante"
    except Exception as e:
        return None, f"scraping error: {str(e)[:100]}"


# ── Clarel (retailer de droguería/perfumería, NO es el fabricante) ──
# Clarel no es WooCommerce ni WordPress — tiene sus propias páginas de
# marca en clarel.es/es/marcas/{marca}, con el listado completo de
# productos de esa marca. Se usa para marcas de gran consumo (Fairy,
# Ariel...) que no venden directo (ver marcas_dominios.json), pero SÍ
# están a la venta en Clarel con nombres de producto muy parecidos a
# como los registra el CRM (ej. "Lavavajillas Ultra Poder Fairy 650Ml").
def buscar_imagen_clarel(marca, query, sesion):
    """Busca en la página de marca de Clarel (clarel.es/es/marcas/{marca})
    el producto cuyo nombre mejor coincida con la query, y devuelve su
    imagen. A diferencia de buscar_imagen_scraping() (pensado para sitios
    WordPress con ?s=query), aquí no hay búsqueda de texto: se lista toda
    la marca y se compara cada producto de la lista contra la query."""
    marca_slug = _sin_acentos(marca).lower().replace(" ", "-")
    url = f"https://www.clarel.es/es/marcas/{marca_slug}"
    try:
        resp = sesion.get(url, timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code != 200:
            return None, f"clarel HTTP {resp.status_code}"

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")

        t_query = _tokens_significativos(query)
        if not t_query:
            return None, "clarel: query vacía tras normalizar"

        mejor_url = None
        mejor_solapamiento = 0.0
        mejor_nombre = None

        # Cada imagen de producto de la parrilla trae su nombre en el
        # atributo alt — igual que en buscar_imagen_scraping, se compara
        # contra la query y solo se acepta si hay solapamiento suficiente.
        for img in soup.select("img"):
            alt = img.get("alt", "")
            src = img.get("src") or img.get("data-src") or ""
            if not alt or not src:
                continue
            if not any(src.lower().split("?")[0].endswith(ext) for ext in EXTENSIONES_VALIDAS):
                continue

            t_alt = _tokens_significativos(alt)
            solapamiento = len(t_query & t_alt) / len(t_query)
            if solapamiento >= 0.34 and solapamiento > mejor_solapamiento:
                mejor_solapamiento = solapamiento
                mejor_nombre = alt
                if src.startswith("//"):
                    mejor_url = "https:" + src
                elif src.startswith("/"):
                    mejor_url = "https://www.clarel.es" + src
                else:
                    mejor_url = src

        if mejor_url:
            return mejor_url, f"Clarel (producto: {mejor_nombre[:50]!r}, solapamiento {mejor_solapamiento:.2f})"

        return None, f"clarel: página de marca cargada pero ningún producto coincide (revisar si carga por JavaScript)"
    except Exception as e:
        return None, f"clarel error: {str(e)[:100]}"


# ── Búsqueda con Google Custom Search API (única opción precisa) ──
def buscar_imagen_google_api(api_key, cx, query, sesion):
    """Busca imágenes usando Google Custom Search API (precisa pero tiene coste)."""
    API_URL = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": api_key,
        "cx": cx,
        "q": query,
        "searchType": "image",
        "num": 5,  # pedir varias para poder validar relevancia, no solo la primera
        "safe": "active",
    }
    try:
        resp = sesion.get(API_URL, params=params, timeout=TIMEOUT)
        if resp.status_code == 429:
            return None, "cuota diaria de la API agotada (429)"
        if resp.status_code == 403:
            try:
                detalle = resp.json().get("error", {}).get("message", resp.text[:300])
            except Exception:
                detalle = resp.text[:300]
            return None, f"403 de la API de Google: {detalle}"
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        if not items:
            return None, "sin resultados"

        # Mismo criterio que en los demás métodos: no aceptar el primer
        # resultado a ciegas — Google Images puede devolver "lo más
        # parecido" (otro producto, un banner, un resultado genérico) si
        # no hay coincidencia exacta. Se exige que el título/snippet se
        # parezca de verdad a la query antes de aceptarlo.
        for item in items:
            titulo = item.get("title", "") + " " + item.get("snippet", "")
            if resultado_coincide_con_query(titulo, query):
                return item.get("link"), f"Google Search API OK (título: {item.get('title', '')[:50]!r})"

        return None, f"Google devolvió {len(items)} resultados pero ninguno se parece a la query — descartados"
    except Exception as e:
        return None, f"error: {e}"


# ── Búsqueda en servidor de Titan (para pinturas) ──
def buscar_imagen_titan(nombre_producto, sesion):
    """Busca imágenes en el servidor de Titan para productos de pinturas."""
    BASE_URL = "http://ficheros.industriastitan.es/titan/FOTOS%20ENVASES/"
    
    # Normalizar nombre del producto para comparación
    def normalizar_titan(texto):
        if texto is None:
            return ""
        t = str(texto).strip()
        t = re.sub(r"(?<=\d),(?=\d)", ".", t)
        t = re.sub(r"[^\w\s\-]", " ", t)
        t = re.sub(r"\s+", " ", t).strip()
        return _sin_acentos(t).lower()
    
    tokens_producto = set(normalizar_titan(nombre_producto).split())
    
    try:
        resp = sesion.get(BASE_URL, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        return None, f"Error accediendo a servidor Titan: {e}"
    
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(resp.text, "html.parser")
    
    imagenes = []
    for a in soup.select("a[href]"):
        href = a["href"]
        if href.startswith("..") or href in ("/", "./"):
            continue
        if href.lower().endswith(EXTENSIONES_VALIDAS):
            nombre_img = href.split("/")[-1]
            url_img = BASE_URL + href
            tokens_img = set(normalizar_titan(os.path.splitext(nombre_img)[0]).split())

            # Solapamiento como proporción de los tokens del producto, no
            # un recuento absoluto — con solo "score > 0" bastaba con
            # coincidir en una sola palabra genérica (ej. un color como
            # "blanco") para aceptar el archivo, aunque fuera de otro
            # producto distinto.
            interseccion = tokens_producto & tokens_img
            if not tokens_producto:
                continue
            ratio = len(interseccion) / len(tokens_producto)

            if ratio >= 0.34:
                imagenes.append((ratio, len(interseccion), url_img, nombre_img))

    if imagenes:
        # Devolver la de mayor proporción de solapamiento (y, en empate, mayor nº de tokens)
        imagenes.sort(reverse=True, key=lambda x: (x[0], x[1]))
        return imagenes[0][2], f"Titan (solapamiento: {imagenes[0][0]:.2f}, tokens: {imagenes[0][1]})"

    return None, "Sin resultados en servidor Titan con solapamiento suficiente"


# ── Construcción de queries de búsqueda ──
def construir_queries(producto, marca=None):
    """Devuelve lista de queries a probar en orden de prioridad."""
    queries = []
    
    nombre = producto.get("nombre", "")
    familia = producto.get("familia", "")
    codigo = producto.get("codigo", "")
    referencia = producto.get("referencia", "")
    
    # Normalizar nombre para análisis
    nombre_norm = normalizar_nombre(nombre, para_busqueda=False)
    
    # 1. Query corta: solo palabras clave (eliminando unidades y palabras comunes)
    tk = tokens_clave(nombre) if nombre else []
    if tk:
        query_corta = " ".join(tk[:5])  # Primeras 5 palabras clave
        if query_corta:
            queries.append(query_corta)
    
    # 2. Nombre completo normalizado
    if nombre_norm:
        queries.append(nombre_norm)
    
    # 3. Nombre sin la marca (redundante cuando buscamos en dominio de marca)
    if marca and nombre:
        nombre_sin_marca = re.sub(rf"{re.escape(marca)}\s*", "", nombre_norm, flags=re.IGNORECASE).strip()
        if nombre_sin_marca and len(nombre_sin_marca) > 3:
            queries.append(nombre_sin_marca)
    
    # 4. Nombre + familia
    if nombre and familia:
        queries.append(f"{nombre_norm} {familia}")

    # NOTA: se han quitado a propósito las queries "familia + código" y
    # "solo código"/"solo referencia" que había aquí antes — tras el alias
    # referencia→codigo (necesario porque el Excel real no trae una
    # columna de código de fabricante separada), esas queries acababan
    # siendo el EAN interno de Orencio Matas buscado tal cual. El buscador
    # interno de una web de fabricante no indexa por EAN, así que esas
    # queries no aportaban nada — como mucho, arriesgaban traer un
    # resultado irrelevante que words_solapan_query() habría tenido que
    # descartar de todas formas.
    
    # Eliminar duplicados y queries vacías
    seen = set()
    unique_queries = []
    for q in queries:
        q_norm = _sin_acentos(q).lower()
        if q_norm and q_norm not in seen and len(q_norm) > 2:
            seen.add(q_norm)
            unique_queries.append(q)
    
    return unique_queries


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--excel", required=True,
                     help="Ruta al Excel filtrado de productos nuevos (columnas: referencia, nombre, familia, area, codigo)")
    ap.add_argument("--dominios", default="marcas_dominios.json",
                     help="Ruta al JSON de marcas->dominios")
    ap.add_argument("--google-creds", default="google_search_credentials.json",
                     help="Ruta al JSON con credenciales de Google Search API (api_key, cx)")
    ap.add_argument("--salida", default="imagenes_temp",
                     help="Directorio temporal para guardar las imágenes")
    ap.add_argument("--limite", type=int, default=0,
                     help="Máximo de productos a procesar (0 = todos)")
    ap.add_argument("--dry-run", action="store_true",
                     help="Simula el proceso sin descargar imágenes")
    ap.add_argument("--usar-google-api", action="store_true",
                     help="Usar Google Custom Search API para productos sin marca (requiere credenciales)")
    ap.add_argument("--debug", action="store_true",
                     help="Muestra el motivo detallado de cada intento fallido (qué método, qué código HTTP, etc.) — para diagnosticar por qué no encuentra nada")
    args = ap.parse_args()
    
    # Verificar que el Excel existe
    if not os.path.exists(args.excel):
        print(f"[ERROR] No encuentro el Excel: {args.excel}")
        sys.exit(1)
    
    # Cargar el Excel
    print(f"→ Cargando Excel: {args.excel}")
    try:
        df = pd.read_excel(args.excel)
        # Normalizar nombres de columnas a minúsculas
        df.columns = [c.strip().lower() for c in df.columns]

        # El Excel exportado directamente de la Sheet de Productos usa
        # "tipologia" (no "familia") y no trae ninguna columna "codigo" —
        # sin este alias, construir_queries() se quedaba sin usar la
        # familia/código en absoluto (no fallaba, solo perdía precisión
        # en las queries de búsqueda en silencio).
        if "familia" not in df.columns and "tipologia" in df.columns:
            df["familia"] = df["tipologia"]
            print("  → Alias aplicado: 'tipologia' se usa como 'familia'")
        if "codigo" not in df.columns and "referencia" in df.columns:
            df["codigo"] = df["referencia"]
            print("  → Alias aplicado: 'referencia' se usa como 'codigo'")

        # Verificar columnas requeridas
        columnas_requeridas = ["referencia", "nombre"]
        columnas_faltantes = [c for c in columnas_requeridas if c not in df.columns]
        if columnas_faltantes:
            print(f"[ERROR] Faltan columnas requeridas en el Excel: {columnas_faltantes}")
            print(f"        Columnas encontradas: {list(df.columns)}")
            sys.exit(1)

        # Si el Excel trae imagen_drive_id, quedarnos solo con lo que de
        # verdad no tiene foto (por si viniera algo ya resuelto colado)
        if "imagen_drive_id" in df.columns:
            antes = len(df)
            df = df[df["imagen_drive_id"].astype(str).str.strip().str.upper() == "NO_TIENE_FOTO"]
            print(f"  → Filtrado NO_TIENE_FOTO: {len(df)}/{antes} productos")

        # Convertir todos los valores a strings para evitar errores de tipo
        for col in df.columns:
            df[col] = df[col].astype(str).replace('nan', '')
        
        # Convertir a lista de diccionarios
        productos = df.to_dict("records")
        if args.limite:
            productos = productos[:args.limite]
        
        print(f"  {len(productos)} productos a procesar")
    except Exception as e:
        print(f"[ERROR] Error leyendo el Excel: {e}")
        sys.exit(1)
    
    # Cargar mapa de marcas
    mapa_marcas = cargar_mapa_marcas(args.dominios)
    print(f"→ {len(mapa_marcas)} marcas con dominio configurado")
    
    # Cargar credenciales de Google API si se va a usar
    google_api_key = google_cx = None
    if args.usar_google_api:
        if os.path.exists(args.google_creds):
            with open(args.google_creds, encoding="utf-8") as f:
                creds = json.load(f)
            google_api_key = creds.get("api_key")
            google_cx = creds.get("cx")
            if google_api_key and google_cx:
                print(f"→ Google Custom Search API configurada")
            else:
                print(f"→ [AVISO] Google Search API configurada pero sin api_key o cx")
        else:
            print(f"→ [AVISO] No se encuentra {args.google_creds}, Google API no disponible")
    
    # Crear directorio de salida
    if not args.dry_run:
        os.makedirs(args.salida, exist_ok=True)
    
    sesion = requests.Session()
    sesion.headers["User-Agent"] = "Mozilla/5.0 (compatible; OrencioMatasImgBot/1.0)"
    
    encontradas = []
    sin_resultado = []
    
    for i, p in enumerate(productos, 1):
        referencia = str(p.get("referencia", "")).strip()
        nombre = p.get("nombre", "")
        familia = p.get("familia", "")
        area = p.get("area", "").lower() if p.get("area") else ""
        codigo = p.get("codigo", "")
        
        if not referencia:
            print(f"[{i}/{len(productos)}] FALLO: sin referencia")
            sin_resultado.append({
                "referencia": referencia,
                "nombre": nombre,
                "motivo": "sin referencia"
            })
            continue
        
        print(f"[{i}/{len(productos)}] {referencia}: {nombre[:50]}...")
        
        # Detectar marca
        marca = detectar_marca(nombre, mapa_marcas) or detectar_marca(familia, mapa_marcas)
        
        # Construir queries de búsqueda
        queries = construir_queries(p, marca)
        
        url_imagen = None
        metodo_usado = None
        motivos_debug = []  # guarda el motivo de cada intento, para --debug

        # Estrategia de búsqueda según área
        if area == "pinturas":
            # Para pinturas, intentar servidor de Titan primero
            titan_ok = True
            for query in queries:
                if not titan_ok:
                    break
                url, motivo = buscar_imagen_titan(query, sesion)
                motivos_debug.append(f"Titan [{query}]: {motivo}")
                if url:
                    url_imagen = url
                    metodo_usado = f"Titan: {motivo}"
                    break
                if motivo.startswith("Error accediendo a servidor Titan"):
                    print(f"    [AVISO] Servidor Titan no responde, se abandona para este producto")
                    titan_ok = False

            # Si no encuentra en Titan, intentar APIs gratuitas si hay marca
            if not url_imagen and marca:
                dominio = mapa_marcas[marca]
                dominio_ok = True
                for query in queries:
                    if not dominio_ok:
                        break
                    url, metodo, motivo = buscar_imagen_gratis(dominio, query, sesion)
                    motivos_debug.append(f"Gratis {dominio} [{query}]: {motivo}")
                    if url:
                        url_imagen = url
                        metodo_usado = f"Gratis ({metodo}): {motivo}"
                        break
                    if dominio_no_responde(motivo):
                        print(f"    [AVISO] {dominio} no responde, se abandona este dominio para este producto")
                        dominio_ok = False

            # Fallback: scraping directo si hay marca (y el dominio respondía)
            if not url_imagen and marca and dominio_ok:
                dominio = mapa_marcas[marca]
                for query in queries[:2]:  # Solo primeras 2 queries para scraping
                    url, motivo = buscar_imagen_scraping(dominio, query, sesion)
                    motivos_debug.append(f"Scraping {dominio} [{query}]: {motivo}")
                    if url:
                        url_imagen = url
                        metodo_usado = f"Scraping: {motivo}"
                        break
        else:
            # Para droguería/perfumería, usar APIs gratuitas si hay marca
            dominio_ok = True
            if marca:
                dominio = mapa_marcas[marca]
                for query in queries:
                    if not dominio_ok:
                        break
                    url, metodo, motivo = buscar_imagen_gratis(dominio, query, sesion)
                    motivos_debug.append(f"Gratis {dominio} [{query}]: {motivo}")
                    if url:
                        url_imagen = url
                        metodo_usado = f"Gratis ({metodo}): {motivo}"
                        break
                    if dominio_no_responde(motivo):
                        print(f"    [AVISO] {dominio} no responde, se abandona este dominio para este producto")
                        dominio_ok = False

            # Clarel es un retailer (no WooCommerce) con su propia
            # página de marca — se prueba con su función dedicada antes
            # del scraping genérico (pensado para WordPress), que no le
            # serviría de nada a este sitio.
            if not url_imagen and marca and mapa_marcas.get(marca) == "clarel.es":
                for query in queries[:2]:
                    url, motivo = buscar_imagen_clarel(marca, query, sesion)
                    motivos_debug.append(f"Clarel [{query}]: {motivo}")
                    if url:
                        url_imagen = url
                        metodo_usado = f"Clarel: {motivo}"
                        break

            # Fallback: scraping directo si hay marca (y el dominio respondía)
            if not url_imagen and marca and dominio_ok and mapa_marcas.get(marca) != "clarel.es":
                dominio = mapa_marcas[marca]
                for query in queries[:2]:  # Solo primeras 2 queries para scraping
                    url, motivo = buscar_imagen_scraping(dominio, query, sesion)
                    motivos_debug.append(f"Scraping {dominio} [{query}]: {motivo}")
                    if url:
                        url_imagen = url
                        metodo_usado = f"Scraping: {motivo}"
                        break
        
        # ÚLTIMO RECURSO: Google Custom Search API (precisa pero requiere credenciales)
        if not url_imagen and google_api_key and google_cx and args.usar_google_api:
            for query in queries[:1]:  # Solo la mejor query
                url, motivo = buscar_imagen_google_api(google_api_key, google_cx, query, sesion)
                motivos_debug.append(f"Google API [{query}]: {motivo}")
                if url:
                    url_imagen = url
                    metodo_usado = f"Google API: {motivo}"
                    break
                elif "cuota diaria" in motivo:
                    # Si se agota la cuota, dejar de intentar con Google API
                    print(f"    [AVISO] {motivo}")
                    break
        
        if args.dry_run:
            if url_imagen:
                print(f"  → Encontrada: {metodo_usado}")
            else:
                print(f"  → No encontrada")
                if args.debug:
                    if not marca:
                        print(f"    [DEBUG] Sin marca detectada en el nombre/familia — no se intenta nada")
                    for m in motivos_debug:
                        print(f"    [DEBUG] {m}")
            continue
        
        if url_imagen:
            try:
                # Descargar imagen
                ext = os.path.splitext(url_imagen.split("?")[0])[1].lower()
                if ext not in EXTENSIONES_VALIDAS:
                    ext = ".jpg"
                nombre_archivo = f"{referencia}{ext}"
                ruta_local = os.path.join(args.salida, nombre_archivo)
                
                r = sesion.get(url_imagen, timeout=TIMEOUT)
                r.raise_for_status()
                
                # Convertir a JPG para asegurar compatibilidad
                from PIL import Image
                from io import BytesIO
                
                img = Image.open(BytesIO(r.content))
                
                # Convertir a RGB si es RGBA (PNG con transparencia)
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Guardar como JPG
                nombre_archivo = f"{referencia}.jpg"
                ruta_local = os.path.join(args.salida, nombre_archivo)
                img.save(ruta_local, 'JPEG', quality=85)
                
                encontradas.append({
                    "referencia": referencia,
                    "nombre_producto": nombre,
                    "nombre_archivo": nombre_archivo,
                    "metodo": metodo_usado,
                    "url_origen": url_imagen,
                    "score": 75,
                })
                print(f"  ✓ Descargada: {nombre_archivo} ({metodo_usado})")
            except Exception as e:
                sin_resultado.append({
                    "referencia": referencia,
                    "nombre": nombre,
                    "motivo": f"error descarga: {e}"
                })
                print(f"  ✗ Error descargando: {e}")
        else:
            motivo_final = " | ".join(motivos_debug) if motivos_debug else ("sin marca detectada" if not marca else "sin resultados")
            sin_resultado.append({
                "referencia": referencia,
                "nombre": nombre,
                "motivo": motivo_final
            })
            print(f"  ✗ Sin resultados")
            if args.debug:
                if not marca:
                    print(f"    [DEBUG] Sin marca detectada en el nombre/familia — no se intenta nada")
                for m in motivos_debug:
                    print(f"    [DEBUG] {m}")
        
        time.sleep(0.3)  # Cortesía
    
    if args.dry_run:
        print(f"\n(simulación) {len(productos)} productos procesados")
        return
    
    # Guardar CSV con imágenes descargadas
    csv_path = os.path.join(args.salida, "imagenes_descargadas.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "nombre_archivo", "metodo", "url_origen", "score"])
        w.writeheader()
        w.writerows(encontradas)
    
    # Guardar CSV con sin resultado
    csv_sin_path = os.path.join(args.salida, "sin_resultado.csv")
    with open(csv_sin_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre", "motivo"])
        w.writeheader()
        w.writerows(sin_resultado)
    
    print(f"\n✓ Completado:")
    print(f"  {len(encontradas)} imágenes descargadas en {args.salida}/")
    print(f"  {len(sin_resultado)} sin resultados")
    print(f"  CSV descargadas: {csv_path}")
    print(f"  CSV sin resultado: {csv_sin_path}")
    print(f"\n→ Revisa las imágenes en {args.salida}/ y elimina las que no sean adecuadas.")
    print(f"→ Luego usa subir_imagenes_validadas.py para subir las validadas a Drive.")


if __name__ == "__main__":
    main()
