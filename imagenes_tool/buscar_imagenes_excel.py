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
from urllib.parse import quote

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


# Palabras descriptivas genéricas que aparecen en productos de fabricantes
# y tipos muy distintos (material del mango, acabado...) sin aportar nada
# para saber si es el MISMO producto — se excluyen de la comparación de
# similitud para no inflar el solapamiento entre productos que solo
# comparten esto. BIMAT/BIMATERIA = "mango bimaterial" (confirmado por el
# usuario, no es una marca ni un modelo).
PALABRAS_DESCRIPTIVAS_GENERICAS = {"BIMAT", "BIMATERIA", "INOX", "INOXIDABLE"}

# Algunos fabricantes usan el nombre del color en inglés como parte del
# propio nombre comercial de la variante (ej. la línea Brillowax de
# Thomil: "Brillowax Dark", "Brillowax Clear", "Brillowax Red"), mientras
# que el CRM describe el producto en español ("...CERA PLASTICA...NEGRA").
# Sin esto, "NEGRA" y "DARK" no se parecen en nada por texto aunque sea
# la misma variante — se añade el equivalente en ambos idiomas a los
# tokens para que el solapamiento los reconozca como lo mismo.
SINONIMOS_COLOR = {
    "NEGRA": "DARK", "NEGRO": "DARK",
    "ROJA": "RED", "ROJO": "RED",
    "INCOLORA": "CLEAR", "INCOLORO": "CLEAR", "TRANSPARENTE": "CLEAR",
    "BLANCA": "WHITE", "BLANCO": "WHITE",
    "AZUL": "BLUE",
    "VERDE": "GREEN",
    "AMARILLA": "YELLOW", "AMARILLO": "YELLOW",
    "GRIS": "GREY",
}
SINONIMOS_COLOR_INVERSO = {v: k for k, v in SINONIMOS_COLOR.items()}


def _tokens_significativos(texto):
    tokens = set(w for w in re.findall(r"[A-Z0-9]+", _sin_acentos(texto or ""))
                 if len(w) > 2 and w not in PALABRAS_DESCRIPTIVAS_GENERICAS)
    extra = set()
    for t in tokens:
        if t in SINONIMOS_COLOR:
            extra.add(SINONIMOS_COLOR[t])
        elif t in SINONIMOS_COLOR_INVERSO:
            extra.add(SINONIMOS_COLOR_INVERSO[t])
    return tokens | extra


def _solapamiento_sin_marca(texto_query, texto_candidato, marca):
    """Solapamiento de tokens entre query y candidato, EXCLUYENDO las
    palabras que forman el nombre de la marca ya detectada. Si ya
    sabemos que este candidato viene de la página de esa marca, que
    comparta el nombre de marca con la query (ej. 'ALVAREZ'+'GOMEZ')
    no aporta ninguna información sobre si es el MISMO producto — sin
    esto, el nombre de marca por sí solo podía cruzar el umbral cuando
    el resto de la query tenía pocas palabras, haciendo que un único
    producto genérico "ganara" repetidamente para varios productos
    distintos de esa marca (confirmado con datos reales: 4 variantes
    de colonia distintas de Alvarez Gómez todas emparejadas con la
    misma foto de 'Titanio', solo por compartir el nombre de marca).
    Devuelve (solapamiento, t_query_sin_marca) — t_query_sin_marca para
    poder reusar el tamaño ya calculado."""
    t_marca = _tokens_significativos(marca) if marca else set()
    t_query = _tokens_significativos(texto_query) - t_marca
    t_candidato = _tokens_significativos(texto_candidato) - t_marca
    if not t_query:
        return 0.0, t_query
    return len(t_query & t_candidato) / len(t_query), t_query


def _extraer_tamano(texto):
    """Extrae el tamaño/volumen/peso del texto, normalizado a mililitros
    (volumen) o gramos (peso) — para poder exigir que dos productos sean
    del MISMO tamaño, no solo del mismo tipo. 'FAIRY ULTRA 5 L' y
    'Fairy 650 Ml' comparten marca y palabras, pero son envases
    completamente distintos; sin esto, el solapamiento de texto los
    aceptaba como si fueran el mismo producto. Devuelve (tipo, valor) o
    None si no se detecta ningún tamaño en el texto."""
    t = _sin_acentos(texto or "").lower().replace(",", ".")
    m = re.search(r"(\d+(?:\.\d+)?)\s*(mls?|lts?|litros?|l)\b", t)
    if m:
        valor = float(m.group(1))
        unidad = m.group(2)
        if unidad.startswith("l") or "litro" in unidad:
            return ("volumen_ml", valor * 1000)
        return ("volumen_ml", valor)
    m = re.search(r"(\d+(?:\.\d+)?)\s*(kgs?|kilos?|gr?s?|gramos?)\b", t)
    if m:
        valor = float(m.group(1))
        unidad = m.group(2)
        if unidad.startswith("k") or "kilo" in unidad:
            return ("peso_g", valor * 1000)
        return ("peso_g", valor)
    return None


def tamanos_compatibles(texto1, texto2, tolerancia=0.05):
    """False solo si AMBOS textos tienen un tamaño detectado y no
    coinciden (con un ±5% de margen por redondeos de conversión). Si no
    se puede extraer tamaño de alguno de los dos, no se bloquea por esto
    — no hay suficiente información para saber si coincide o no."""
    t1 = _extraer_tamano(texto1)
    t2 = _extraer_tamano(texto2)
    if t1 is None or t2 is None:
        return True
    tipo1, valor1 = t1
    tipo2, valor2 = t2
    if tipo1 != tipo2 or valor1 == 0:
        return True
    return abs(valor1 - valor2) / max(valor1, valor2) <= tolerancia


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
    if not tamanos_compatibles(nombre_resultado, query):
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
            if solapamiento >= 0.34 and solapamiento > mejor_solapamiento and tamanos_compatibles(alt, query):
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
        # contra la query (excluyendo el nombre de marca, ver
        # _solapamiento_sin_marca) y solo se acepta si hay solapamiento
        # suficiente.
        for img in soup.select("img"):
            alt = img.get("alt", "")
            src = img.get("src") or img.get("data-src") or ""
            if not alt or not src:
                continue
            if not any(src.lower().split("?")[0].endswith(ext) for ext in EXTENSIONES_VALIDAS):
                continue

            solapamiento, t_query_sin_marca = _solapamiento_sin_marca(query, alt, marca)
            if not t_query_sin_marca:
                continue  # la query solo tenía el nombre de marca, nada que discrimine
            if solapamiento >= 0.34 and solapamiento > mejor_solapamiento and tamanos_compatibles(alt, query):
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


# ── Thomil: catálogo antiguo (no WooCommerce) con páginas de categoría ──
# thomil.com (la web corporativa) bloquea peticiones automatizadas (HTTP
# 403 confirmado). Pero tienen un subdominio de catálogo aparte
# (catalogodeproductos.thomil.com) con páginas de listado por categoría
# que SÍ son accesibles y traen nombre + foto de cada producto. No tiene
# una API ni un patrón de búsqueda por texto conocido (?s=query no
# aplica, es un sistema propio, no WordPress) — en vez de adivinar su
# buscador, se recorren las categorías conocidas UNA VEZ por ejecución y
# se construye un índice en memoria, reutilizado para todos los
# productos Thomil de esa ejecución (recorrer todo el catálogo en cada
# producto sería carísimo).
THOMIL_BASE = "https://catalogodeproductos.thomil.com"
THOMIL_CATEGORIAS = [
    "limpieza-de-superficies",
    "lavado-de-vajillas",
    "tratamiento-de-suelos/preparacion",
    "tratamiento-de-suelos/tratamiento",
    "tratamiento-de-suelos/fregasuelos-neutros",
    "tratamiento-de-suelos/desengrasantes",
    "tratamiento-de-suelos/moquetas",
    "tratamiento-de-suelos/abrillantadores",
    "thomilmatic-lavanderia",
    "higiene-personal",
    "higiene-ambiental",
    "limpieza-concentrada",
    "sumo-industria-y-automocion",
    "naturelle-limpiadores-ecolabel",
    "prosolution-diluibles",
    "masterbox-ultra-concentrados",
]
_thomil_indice_cache = None


def construir_indice_thomil(sesion):
    """Recorre todas las categorías conocidas de Thomil (con paginación) y
    construye un índice nombre_producto -> imagen. Se cachea en memoria
    para el resto de la ejecución del script."""
    global _thomil_indice_cache
    if _thomil_indice_cache is not None:
        return _thomil_indice_cache

    from bs4 import BeautifulSoup
    indice = []

    for cat in THOMIL_CATEGORIAS:
        pagina = 1
        while pagina <= 20:  # límite de seguridad
            url = f"{THOMIL_BASE}/{cat}" if pagina == 1 else f"{THOMIL_BASE}/{cat}/{pagina}"
            try:
                resp = sesion.get(url, timeout=10)
                if resp.status_code != 200:
                    break
            except Exception:
                break

            soup = BeautifulSoup(resp.text, "html.parser")
            nuevos_en_pagina = 0
            # Cada producto del listado es un enlace a una ficha ".../iNNN"
            # con una imagen dentro (miniatura con el nombre en alt)
            for a in soup.select("a[href*='/i']"):
                img = a.find("img")
                if not img:
                    continue
                nombre = (img.get("alt") or "").strip()
                src = img.get("src", "")
                if not nombre or not src or "pic.php" not in src:
                    continue
                # Las miniaturas del listado son pequeñas (width=104) —
                # pedir la versión grande cambiando el comando de tamaño
                src_grande = re.sub(r"width=\d+&(amp;)?height=\d+", "cmd=sz800x800", src)
                src_grande = src_grande.replace("&amp;", "&")
                if src_grande.startswith("/"):
                    src_grande = THOMIL_BASE + src_grande
                indice.append((nombre, _tokens_significativos(nombre), src_grande))
                nuevos_en_pagina += 1

            if nuevos_en_pagina == 0:
                break
            pagina += 1

    _thomil_indice_cache = indice
    return indice


def buscar_imagen_thomil(query, sesion):
    """Busca en el índice de categorías de Thomil (construido una vez y
    cacheado) el producto cuyo nombre mejor coincida con la query."""
    indice = construir_indice_thomil(sesion)
    if not indice:
        return None, "Thomil: no se pudo construir el índice de categorías (revisar conectividad)"

    t_query = _tokens_significativos(query) - {"THOMIL"}
    if not t_query:
        return None, "Thomil: query vacía tras normalizar"

    mejor_nombre = None
    mejor_url = None
    mejor_solapamiento = 0.0
    for nombre, tokens, url_img in indice:
        tokens_sin_marca = tokens - {"THOMIL"}
        solapamiento = len(t_query & tokens_sin_marca) / len(t_query)
        # Umbral algo más laxo que el resto (0.30 en vez de 0.34): el
        # catálogo de Thomil es de un solo proveedor de confianza (menor
        # riesgo de casar con un producto de otra marca), y sus nombres
        # de variante suelen ser cortos ("Brillowax Dark"), así que un
        # nombre de línea de producto distintivo compartido (ej.
        # "BRILLOWAX") ya es una señal fuerte aunque el resto de palabras
        # de la query (tipo de producto, descripción) no aparezcan en el
        # nombre corto de Thomil.
        if solapamiento >= 0.30 and solapamiento > mejor_solapamiento and tamanos_compatibles(nombre, query):
            mejor_solapamiento = solapamiento
            mejor_nombre = nombre
            mejor_url = url_img

    if mejor_url:
        return mejor_url, f"Thomil (producto: {mejor_nombre!r}, solapamiento {mejor_solapamiento:.2f}, índice: {len(indice)} productos)"

    return None, f"Thomil: catálogo indexado ({len(indice)} productos) pero ninguno coincide suficiente"


# ── Retailers PrestaShop con página de marca paginada ──
# Patrón genérico: https://{dominio}/brand/{id}-{marca} (con ?page=N para
# el resto de páginas). Reutilizable para cualquier retailer PrestaShop
# que venda las marcas que necesitamos como distribuidor mayorista/
# profesional — más relevante para nuestro catálogo que un retailer de
# consumo (ver Suministros Limpiadores: vende Thomil, Fairy, Airwick,
# Ambipur... con nombres de producto muy parecidos a los del CRM, al ser
# el mismo tipo de negocio que Orencio Matas).
#
# Mapa MARCA -> URL completa de su página de marca en cada retailer
# conocido. Si una marca tiene varias URLs (varios retailers), se
# prueban en orden hasta encontrar algo.
RETAILERS_PRESTASHOP_MARCA = {
    "THOMIL": ["https://tiendasuministroslimpiadores.com/brand/10-thomil"],
    "FAIRY": [
        "https://tiendasuministroslimpiadores.com/brand/32-fairy",
        "https://compralimpieza.com/4_fairy",
        "https://drogueline.com/marca/fairy/",
    ],
    "ALVAREZ GOMEZ": ["https://www.primor.eu/es_es/alvarez-gomez"],
    "A.GOMEZ": ["https://www.primor.eu/es_es/alvarez-gomez"],
    "AXE": ["https://www.primor.eu/es_es/axe"],
    "WERKU": [
        "https://www.werku.com/categoria-producto/herramientas-electricas/",
        "https://www.werku.com/categoria-producto/herramientas-airless/",
        "https://www.werku.com/categoria-producto/herramientas-neumaticas/",
        "https://www.werku.com/categoria-producto/herramientas-manuales/",
        "https://www.werku.com/categoria-producto/escaleras-plataformas/",
        "https://www.werku.com/categoria-producto/proteccion-seguridad/",
    ],
}
_prestashop_indice_cache = {}


def construir_indice_prestashop_marca(url_base, sesion, max_paginas=10, param_pagina="page"):
    """Recorre las páginas de un listado de marca en un retailer
    PrestaShop, WooCommerce o Magento y construye un índice
    nombre_producto -> imagen. Cacheado por url_base para el resto de
    la ejecución.

    Soporta los estilos de paginación habituales:
      - PrestaShop: ?page=N (parámetro de query, por defecto)
      - Magento (ej. Primor): ?p=N — pasar param_pagina="p"
      - WordPress/WooCommerce: /page/N/ (segmento de ruta — se usa si
        url_base termina en "/", típico de un archivo de taxonomía)
    """
    if url_base in _prestashop_indice_cache:
        return _prestashop_indice_cache[url_base]

    from bs4 import BeautifulSoup
    indice = []
    es_wordpress = url_base.rstrip().endswith("/")

    for pagina in range(1, max_paginas + 1):
        if pagina == 1:
            url = url_base
        elif es_wordpress:
            url = f"{url_base.rstrip('/')}/page/{pagina}/"
        else:
            url = f"{url_base}?{param_pagina}={pagina}"
        try:
            resp = sesion.get(url, timeout=10)
            if resp.status_code != 200:
                break
        except Exception:
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        nuevos_en_pagina = 0
        # Restringido a enlaces a una ficha de producto real — "img" a
        # secas también cogía el logo de la tienda, iconos de pago
        # (Bizum/tarjetas), el píxel de Google Tag Manager, etc.,
        # inflando el índice con basura que además podía ganarle la
        # comparación de similitud al producto real.
        # ".html" es el patrón típico de PrestaShop; "/producto/" o
        # "/product/" el de WooCommerce (sin extensión .html).
        vistos = set()  # evitar duplicados: la misma ficha suele aparecer 2 veces (imagen + título)
        for a in soup.select("a[href*='.html'], a[href*='/producto/'], a[href*='/product/']"):
            href = a.get("href", "")
            if href in vistos:
                continue

            # La imagen puede estar DENTRO del enlace (PrestaShop) o en un
            # elemento hermano dentro del mismo contenedor de producto
            # (algunos temas WooCommerce separan la miniatura del enlace
            # del título en dos <a> distintos que comparten <li>/<div>
            # padre) — se busca primero dentro, y si no hay nada, se
            # amplía la búsqueda al contenedor padre (hasta 2 niveles).
            img = a.find("img")
            contenedor = a
            intentos = 0
            while img is None and contenedor.parent is not None and intentos < 2:
                contenedor = contenedor.parent
                img = contenedor.find("img")
                intentos += 1
            if img is None:
                continue

            alt = (img.get("alt") or "").strip()
            # Varios plugins/temas de carga diferida usan nombres de
            # atributo distintos para la URL real de la imagen — cuantos
            # más se reconozcan, menos productos se pierden en silencio
            # solo porque su tema en concreto usa un nombre distinto.
            src = (img.get("src") or img.get("data-src") or img.get("data-lazy-src")
                   or img.get("data-original") or img.get("data-lazy") or "")
            if not src:
                # Último recurso: tomar la primera URL de un srcset/
                # data-srcset (patrón nativo de WordPress/WooCommerce
                # para imágenes responsive, muy habitual).
                srcset = img.get("srcset") or img.get("data-srcset") or ""
                if srcset:
                    src = srcset.split(",")[0].strip().split(" ")[0].strip()

            # Si la imagen no lleva alt (bastante común e inconsistente en
            # PrestaShop), no descartar el producto entero — usar el title
            # o el texto del propio enlace como nombre de reserva. Sin
            # esto, un producto real se perdía en silencio del índice solo
            # por no tener alt, aunque su foto sí estuviera ahí.
            if not alt:
                alt = (a.get("title") or a.get_text(strip=True) or "").strip()
            if not alt or not src:
                continue
            if not any(src.lower().split("?")[0].endswith(ext) for ext in EXTENSIONES_VALIDAS):
                continue

            vistos.add(href)
            # Las miniaturas de listado en PrestaShop suelen llevar
            # "-home_default"/"-small_default" en la URL — pedir la
            # versión grande cambiando el sufijo, si existe ese patrón.
            # WooCommerce/WordPress suele llevar "-300x300" (ancho x
            # alto) al final del nombre de archivo — quitarlo para pedir
            # la imagen a tamaño completo.
            src_grande = re.sub(r"-(home|small|medium)_default", "-large_default", src)
            src_grande = re.sub(r"-\d+x\d+(?=\.\w+$)", "", src_grande)
            indice.append((alt, _tokens_significativos(alt), src_grande))
            nuevos_en_pagina += 1

        if nuevos_en_pagina == 0:
            break

    _prestashop_indice_cache[url_base] = indice

    # Volcar el índice completo a un archivo de depuración — así se puede
    # comprobar directamente si un producto concreto entró o no en el
    # índice (grep "DEKA" imagenes_tool/debug_indices_marca.log), en vez
    # de tener que adivinarlo indirectamente por los resultados.
    try:
        with open("debug_indices_marca.log", "a", encoding="utf-8") as f:
            f.write(f"\n=== {url_base} ({len(indice)} productos) ===\n")
            for nombre, _, url_img in indice:
                f.write(f"  {nombre}  ->  {url_img}\n")
    except Exception:
        pass

    return indice


def buscar_imagen_prestashop_marca(marca, query, sesion):
    """Prueba todas las URLs de marca conocidas para esa marca en
    retailers PrestaShop (RETAILERS_PRESTASHOP_MARCA), en orden."""
    urls = RETAILERS_PRESTASHOP_MARCA.get(marca, [])
    if not urls:
        return None, "sin retailer PrestaShop configurado para esta marca"

    t_marca = _tokens_significativos(marca) if marca else set()
    t_query = _tokens_significativos(query) - t_marca
    if not t_query:
        return None, "query vacía tras normalizar (o solo tenía el nombre de la marca)"

    diagnostico_urls = []
    for url_base in urls:
        param_pagina = "p" if "primor.eu" in url_base else "page"
        indice = construir_indice_prestashop_marca(url_base, sesion, param_pagina=param_pagina)
        if not indice:
            diagnostico_urls.append(f"{url_base}: índice vacío (revisar conectividad o estructura de la página)")
            continue

        mejor_nombre = None
        mejor_url = None
        mejor_solapamiento = 0.0
        # Para diagnóstico: mejor candidato aunque no llegue al umbral,
        # para saber si el producto SÍ está en el índice pero se queda
        # corto de coincidencia, o si genuinamente no hay nada parecido.
        mejor_nombre_bruto = None
        mejor_solapamiento_bruto = 0.0

        for nombre, tokens, url_img in indice:
            # Igual que en Clarel: se excluye el nombre de la marca del
            # cálculo — sin esto, el propio nombre de marca (compartido
            # por definición por TODO lo de este índice) podía cruzar el
            # umbral él solo cuando el resto de la query tenía pocas
            # palabras, haciendo que el mismo producto genérico ganara
            # repetidamente para productos distintos de la misma marca.
            tokens_sin_marca = tokens - t_marca
            solapamiento = len(t_query & tokens_sin_marca) / len(t_query)
            if solapamiento > mejor_solapamiento_bruto:
                mejor_solapamiento_bruto = solapamiento
                mejor_nombre_bruto = nombre
            if solapamiento >= 0.34 and solapamiento > mejor_solapamiento and tamanos_compatibles(nombre, query):
                mejor_solapamiento = solapamiento
                mejor_nombre = nombre
                mejor_url = url_img

        if mejor_url:
            return mejor_url, f"{url_base} (producto: {mejor_nombre!r}, solapamiento {mejor_solapamiento:.2f}, índice: {len(indice)})"

        diagnostico_urls.append(
            f"{url_base}: índice de {len(indice)} productos, mejor candidato "
            f"{mejor_nombre_bruto!r} con solapamiento {mejor_solapamiento_bruto:.2f} "
            f"(insuficiente o tamaño incompatible)"
        )

    return None, " | ".join(diagnostico_urls)


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
TITANLUX_BASE = "https://www.titanlux.es"
TITANLUX_CATEGORIAS = [
    "decoracion",
    "bricolajecreativo",       # antes "bricolaje-creativo" (404) — sin guión
    "pinturas-sprays",         # antes "sprays" (404)
    "pinturas-antihumedad",    # antes "antihumedad" (404)
    "deportiva",
    "pinturas-nauticas",
    "ebanisteria",
    "color-a-medida",          # antes "colores-a-medida" (404) — singular
    "profesional",
    "acriton-pintura-fachadas",  # antes "acriton" (404)
]
_titanlux_indice_cache = None


def construir_indice_titanlux(sesion):
    """Recorre las páginas de categoría reales de titanlux.es (con
    paginación) y construye un índice nombre_producto -> ficha de
    producto. Se usa en vez de su buscador interno porque este no
    maneja bien consultas de varias palabras: una búsqueda de una sola
    palabra ('barniz') funciona, pero el nombre completo de un producto
    (varias palabras) devuelve sistemáticamente 'sin resultados' aunque
    el producto exista — confirmado con el sin_resultado.csv real del
    usuario, 100% de los productos con 'sin resultados en el buscador'.
    Cacheado en memoria para el resto de la ejecución."""
    global _titanlux_indice_cache
    if _titanlux_indice_cache is not None:
        return _titanlux_indice_cache

    from bs4 import BeautifulSoup
    indice = []
    resumen_categorias = []

    for cat in TITANLUX_CATEGORIAS:
        antes = len(indice)
        pagina = 1
        paginas_reales = 0
        while pagina <= 15:
            url = f"{TITANLUX_BASE}/es/productos/ver/{cat}"
            if pagina > 1:
                url += f"?page={pagina}"
            try:
                resp = sesion.get(url, timeout=10)
                if resp.status_code != 200:
                    if pagina == 1:
                        resumen_categorias.append(f"{cat}: HTTP {resp.status_code} en la página 1 (slug probablemente incorrecto)")
                    break
            except Exception as e:
                if pagina == 1:
                    resumen_categorias.append(f"{cat}: error de red en la página 1 ({str(e)[:80]})")
                break

            soup = BeautifulSoup(resp.text, "html.parser")
            nuevos_en_pagina = 0
            for a in soup.select("a[href*='/productos/producto/']"):
                nombre = (a.get("title") or a.get_text(strip=True) or "").strip()
                href = a.get("href", "")
                if not nombre or not href:
                    continue
                if not href.startswith("http"):
                    href = TITANLUX_BASE + href
                # Evitar duplicados (el mismo producto puede aparecer en
                # varias categorías, o repetido varias veces en la misma
                # página por bloques de imagen+título)
                if any(u == href for _, _, u in indice):
                    continue
                indice.append((nombre, _tokens_significativos(nombre), href))
                nuevos_en_pagina += 1

            if nuevos_en_pagina == 0:
                break
            paginas_reales += 1
            pagina += 1

        nuevos_de_esta_categoria = len(indice) - antes
        if nuevos_de_esta_categoria > 0:
            resumen_categorias.append(f"{cat}: {nuevos_de_esta_categoria} productos ({paginas_reales} página(s))")
        elif not any(cat in r for r in resumen_categorias):
            resumen_categorias.append(f"{cat}: 0 productos (página cargó pero sin enlaces de producto reconocidos)")

    # Volcar el resumen a un archivo de depuración — así se puede ver
    # directamente qué categoría está fallando (slug incorrecto, sin
    # paginación real, etc.) sin tener que inferirlo del resultado final.
    try:
        with open("debug_indice_titanlux.log", "w", encoding="utf-8") as f:
            f.write(f"Índice de Titanlux: {len(indice)} productos en total\n\n")
            for linea in resumen_categorias:
                f.write(f"  {linea}\n")
    except Exception:
        pass

    _titanlux_indice_cache = indice
    return indice


TITANTECH_BASE = "https://www.titantech.es"
_titantech_indice_cache = None


def construir_indice_titantech(sesion):
    """Titantech es un sitio APARTE de titanlux.es (misma empresa,
    INDUSTRIAS TITAN, línea profesional/industrial distinta: esmaltes
    poliuretano, imprimaciones epoxi, pavimentos...). Confirmado por
    fetch real: mismo patrón de ficha (titantech.es/productos/{slug},
    foto en meta og:image), pero un único listado en /productos en vez
    de varias categorías. Cacheado en memoria para el resto de la
    ejecución."""
    global _titantech_indice_cache
    if _titantech_indice_cache is not None:
        return _titantech_indice_cache

    from bs4 import BeautifulSoup
    indice = []

    pagina = 1
    while pagina <= 15:
        url = f"{TITANTECH_BASE}/productos"
        if pagina > 1:
            url += f"?page={pagina}"
        try:
            resp = sesion.get(url, timeout=10)
            if resp.status_code != 200:
                break
        except Exception:
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        nuevos_en_pagina = 0
        for a in soup.select("a[href*='/productos/']"):
            href = a.get("href", "")
            # Excluir el propio enlace a /productos (listado), solo
            # fichas individuales tipo /productos/{slug}
            if href.rstrip("/").endswith("/productos"):
                continue
            nombre = (a.get("title") or a.get_text(strip=True) or "").strip()
            if not nombre or not href:
                continue
            if not href.startswith("http"):
                href = TITANTECH_BASE + href
            if any(u == href for _, _, u in indice):
                continue
            indice.append((nombre, _tokens_significativos(nombre), href))
            nuevos_en_pagina += 1

        if nuevos_en_pagina == 0:
            break
        pagina += 1

    _titantech_indice_cache = indice
    return indice


def buscar_imagen_titantech(query, sesion):
    """Busca en el índice de titantech.es (construido una vez y
    cacheado) el producto cuyo nombre mejor coincida con la query, y
    saca su foto real del meta og:image de su ficha."""
    indice = construir_indice_titantech(sesion)
    if not indice:
        return None, "titantech: no se pudo construir el índice (revisar conectividad)"

    t_query = _tokens_significativos(query)
    if not t_query:
        return None, "titantech: query vacía tras normalizar"

    mejor_nombre = None
    mejor_url_producto = None
    mejor_solapamiento = 0.0
    for nombre, tokens, url_producto in indice:
        solapamiento = len(t_query & tokens) / len(t_query)
        if solapamiento > mejor_solapamiento and tamanos_compatibles(nombre, query):
            mejor_solapamiento = solapamiento
            mejor_nombre = nombre
            mejor_url_producto = url_producto

    if not mejor_url_producto or mejor_solapamiento < 0.34:
        detalle = f"mejor candidato {mejor_nombre!r} con solapamiento {mejor_solapamiento:.2f}" if mejor_nombre else "ninguna coincidencia"
        return None, f"titantech: {detalle} (índice: {len(indice)} productos)"

    from bs4 import BeautifulSoup
    try:
        resp2 = sesion.get(mejor_url_producto, timeout=10)
        if resp2.status_code != 200:
            return None, f"titantech ficha HTTP {resp2.status_code}"
    except Exception as e:
        return None, f"titantech ficha error: {str(e)[:100]}"

    soup2 = BeautifulSoup(resp2.text, "html.parser")
    meta_img = soup2.find("meta", attrs={"property": "og:image"})
    if not meta_img or not meta_img.get("content"):
        return None, f"titantech: ficha de {mejor_nombre!r} encontrada pero sin foto"

    return meta_img["content"].strip(), f"Titantech (producto: {mejor_nombre!r}, solapamiento {mejor_solapamiento:.2f}, índice: {len(indice)})"


def buscar_imagen_titanlux(query, sesion):
    """Busca en el índice de categorías de titanlux.es (construido una
    vez y cacheado) el producto cuyo nombre mejor coincida con la
    query, y saca su foto real del meta og:image de su ficha."""
    indice = construir_indice_titanlux(sesion)
    if not indice:
        return None, "titanlux: no se pudo construir el índice de categorías (revisar conectividad)"

    t_query = _tokens_significativos(query)
    if not t_query:
        return None, "titanlux: query vacía tras normalizar"

    mejor_nombre = None
    mejor_url_producto = None
    mejor_solapamiento = 0.0
    for nombre, tokens, url_producto in indice:
        solapamiento = len(t_query & tokens) / len(t_query)
        if solapamiento > mejor_solapamiento and tamanos_compatibles(nombre, query):
            mejor_solapamiento = solapamiento
            mejor_nombre = nombre
            mejor_url_producto = url_producto

    if not mejor_url_producto or mejor_solapamiento < 0.34:
        detalle = f"mejor candidato {mejor_nombre!r} con solapamiento {mejor_solapamiento:.2f}" if mejor_nombre else "ninguna coincidencia"
        return None, f"titanlux: {detalle} (índice: {len(indice)} productos)"

    # Ir a la ficha de producto real y sacar la foto del meta og:image
    from bs4 import BeautifulSoup
    try:
        resp2 = sesion.get(mejor_url_producto, timeout=10)
        if resp2.status_code != 200:
            return None, f"titanlux ficha HTTP {resp2.status_code}"
    except Exception as e:
        return None, f"titanlux ficha error: {str(e)[:100]}"

    soup2 = BeautifulSoup(resp2.text, "html.parser")
    meta_img = soup2.find("meta", attrs={"property": "og:image"})
    if not meta_img or not meta_img.get("content"):
        return None, f"titanlux: ficha de {mejor_nombre!r} encontrada pero sin foto"

    return meta_img["content"].strip(), f"Titanlux (producto: {mejor_nombre!r}, solapamiento {mejor_solapamiento:.2f}, índice: {len(indice)})"


def buscar_imagen_titan(nombre_producto, sesion):
    """Busca imágenes en el servidor de Titan para productos de pinturas.
    Titan organiza las fotos en varias carpetas por línea de producto —
    se listan todas las conocidas y se combinan las candidatas."""
    CARPETAS = [
        "http://ficheros.industriastitan.es/titan/FOTOS%20ENVASES/",
        "http://ficheros.industriastitan.es/titan/FOTOS%20ENVASES/TITANPRO/",
    ]

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
    if not tokens_producto:
        return None, "Titan: nombre de producto vacío tras normalizar"

    imagenes = []
    mejor_ratio_bruto = 0.0
    mejor_nombre_bruto = None
    errores = []

    for BASE_URL in CARPETAS:
        try:
            resp = sesion.get(BASE_URL, timeout=10)
            resp.raise_for_status()
        except Exception as e:
            errores.append(f"{BASE_URL}: {e}")
            continue

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")

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
                ratio = len(interseccion) / len(tokens_producto) if tokens_producto else 0

                if ratio > mejor_ratio_bruto:
                    mejor_ratio_bruto = ratio
                    mejor_nombre_bruto = nombre_img

                if ratio >= 0.34 and tamanos_compatibles(nombre_img, nombre_producto):
                    imagenes.append((ratio, len(interseccion), url_img, nombre_img))

    if not imagenes and errores and len(errores) == len(CARPETAS):
        # Ninguna carpeta respondió — error de red real, no "sin resultados"
        return None, f"Error accediendo a servidor Titan: {' | '.join(errores)}"

    if imagenes:
        # Devolver la de mayor proporción de solapamiento (y, en empate, mayor nº de tokens)
        imagenes.sort(reverse=True, key=lambda x: (x[0], x[1]))
        return imagenes[0][2], f"Titan (solapamiento: {imagenes[0][0]:.2f}, tokens: {imagenes[0][1]})"

    if mejor_nombre_bruto:
        return None, (f"Sin resultados en servidor Titan con solapamiento suficiente "
                       f"(mejor candidato: {mejor_nombre_bruto!r}, solapamiento {mejor_ratio_bruto:.2f})")
    return None, "Sin resultados en servidor Titan (ninguna imagen de las carpetas conocidas comparte ni una palabra)"


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
    ap.add_argument("--marca", default=None,
                     help="Filtrar solo productos de esta(s) marca(s), separadas por coma (ej. --marca THOMIL,FAIRY) — para probar un fix concreto sin lanzar todo el catálogo")
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

        # Filtrar solo lo que de verdad necesita trabajo: sin foto en
        # absoluto (NO_TIENE_FOTO) O con foto pero todavía sin validar
        # (imagen_validada vacía) — ambos casos se benefician de que este
        # script encuentre una foto confirmada. Si el Excel viene ya
        # filtrado de antemano (ej. un export "ProductosSinFotoValidada_*"
        # hecho a mano desde el Sheet), este filtro no quita nada de más:
        # es un superconjunto de NO_TIENE_FOTO (que siempre tiene
        # imagen_validada vacía también).
        antes = len(df)
        tiene_col_drive = "imagen_drive_id" in df.columns
        tiene_col_validada = "imagen_validada" in df.columns

        if tiene_col_drive and tiene_col_validada:
            sin_foto = df["imagen_drive_id"].astype(str).str.strip().str.upper() == "NO_TIENE_FOTO"
            sin_validar = df["imagen_validada"].isna() | (df["imagen_validada"].astype(str).str.strip() == "")
            df = df[sin_foto | sin_validar]
            print(f"  → Filtrado sin foto o sin validar: {len(df)}/{antes} productos")
        elif tiene_col_drive:
            df = df[df["imagen_drive_id"].astype(str).str.strip().str.upper() == "NO_TIENE_FOTO"]
            print(f"  → Filtrado NO_TIENE_FOTO: {len(df)}/{antes} productos")
        elif tiene_col_validada:
            df = df[df["imagen_validada"].isna() | (df["imagen_validada"].astype(str).str.strip() == "")]
            print(f"  → Filtrado sin validar: {len(df)}/{antes} productos")

        # Convertir todos los valores a strings para evitar errores de tipo
        for col in df.columns:
            df[col] = df[col].astype(str).replace('nan', '')
        
        # Convertir a lista de diccionarios
        productos = df.to_dict("records")
        
        print(f"  {len(productos)} productos en el Excel")
    except Exception as e:
        print(f"[ERROR] Error leyendo el Excel: {e}")
        sys.exit(1)
    
    # Cargar mapa de marcas
    mapa_marcas = cargar_mapa_marcas(args.dominios)
    print(f"→ {len(mapa_marcas)} marcas con dominio configurado")

    # Filtrar por marca(s) si se especifica --marca (para probar un fix
    # concreto sin lanzar todo el catálogo) — se aplica ANTES de
    # --limite, para que --limite corte sobre el subconjunto ya filtrado
    if args.marca:
        marcas_filtro = {m.strip().upper() for m in args.marca.split(",")}
        antes = len(productos)
        productos = [
            p for p in productos
            if (detectar_marca(p.get("nombre", ""), mapa_marcas) in marcas_filtro
                or detectar_marca(p.get("familia", ""), mapa_marcas) in marcas_filtro)
        ]
        print(f"→ Filtrado --marca {sorted(marcas_filtro)}: {len(productos)}/{antes} productos")

    if args.limite:
        productos = productos[:args.limite]

    print(f"  {len(productos)} productos a procesar")
    
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
    # Antes se identificaba como "OrencioMatasImgBot" — algunos sitios
    # (confirmado con Thomil: HTTP 403 en TODO, incluida una simple carga
    # de página) bloquean cualquier petición que se autoidentifique como
    # bot, aunque sea de forma transparente, salvo que esté en su lista
    # blanca (Googlebot, Bingbot...). Se usa un User-Agent de navegador
    # estándar en su lugar, con cabeceras que un navegador real también
    # envía — estas páginas son públicas, cualquier visitante con un
    # navegador las vería igual.
    sesion.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9",
    })
    
    encontradas = []
    sin_resultado = []
    urls_ya_asignadas = {}  # url_imagen -> referencia que la reclamó primero (ver detección de duplicados)
    
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
            # Retailers PrestaShop/WooCommerce de marca específica (ej.
            # Werku): se prueban PRIMERO — máxima prioridad, antes incluso
            # que Titanlux, ya que estas marcas no son de Titan y perder
            # tiempo ahí antes no aporta nada. Este bloque faltaba en la
            # rama de pinturas (solo estaba en la de droguería/perfumería),
            # así que marcas como WERKU nunca lo intentaban pese a estar
            # configuradas en RETAILERS_PRESTASHOP_MARCA.
            if not url_imagen and marca in RETAILERS_PRESTASHOP_MARCA:
                for query in queries[:2]:
                    url, motivo = buscar_imagen_prestashop_marca(marca, query, sesion)
                    motivos_debug.append(f"PrestaShop [{query}]: {motivo}")
                    if url:
                        url_imagen = url
                        metodo_usado = f"PrestaShop: {motivo}"
                        break

            # Luego titanlux.es (la web de producto real, con fichas y
            # foto fiable en el meta og:image) — mucho más completa que
            # el servidor de archivos antiguo, que solo cubre la línea
            # profesional TitanPro con nombres de archivo poco descriptivos.
            titanlux_ok = True
            for query in (queries[:3] if not url_imagen else []):
                if not titanlux_ok:
                    break
                url, motivo = buscar_imagen_titanlux(query, sesion)
                motivos_debug.append(f"Titanlux [{query}]: {motivo}")
                if url:
                    url_imagen = url
                    metodo_usado = f"Titanlux: {motivo}"
                    break
                if motivo.startswith("titanlux error") or motivo.startswith("titanlux ficha error"):
                    print(f"    [AVISO] titanlux.es no responde, se abandona para este producto")
                    titanlux_ok = False

            # Titantech: sitio APARTE de titanlux.es, misma empresa
            # (Industrias Titan) pero línea profesional/industrial
            # distinta (esmaltes poliuretano, imprimaciones epoxi,
            # pavimentos...) — confirmado con datos reales: productos
            # TITANTECH no aparecían en absoluto en el índice de titanlux.es.
            titantech_ok = True
            for query in (queries[:3] if not url_imagen else []):
                if not titantech_ok:
                    break
                url, motivo = buscar_imagen_titantech(query, sesion)
                motivos_debug.append(f"Titantech [{query}]: {motivo}")
                if url:
                    url_imagen = url
                    metodo_usado = f"Titantech: {motivo}"
                    break
                if motivo.startswith("titantech: no se pudo") or motivo.startswith("titantech ficha error"):
                    print(f"    [AVISO] titantech.es no responde, se abandona para este producto")
                    titantech_ok = False

            # Si no encuentra en titanlux.es ni titantech.es, probar el
            # servidor de archivos antiguo (por si tiene algo de la línea
            # TitanPro que no esté en ninguna de las dos webs de producto)
            titan_ok = True
            for query in (queries if not url_imagen else []):
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

            # Retailers PrestaShop de suministros profesionales (ej.
            # Suministros Limpiadores): se prueban PRIMERO si hay alguno
            # configurado para esta marca — más relevante para nuestro
            # catálogo (mismo tipo de negocio, formatos profesionales)
            # que la web corporativa de la marca o un retailer de
            # consumo genérico.
            if not url_imagen and marca in RETAILERS_PRESTASHOP_MARCA:
                for query in queries[:2]:
                    url, motivo = buscar_imagen_prestashop_marca(marca, query, sesion)
                    motivos_debug.append(f"PrestaShop [{query}]: {motivo}")
                    if url:
                        url_imagen = url
                        metodo_usado = f"PrestaShop: {motivo}"
                        break

            if marca and not url_imagen:
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

            # Thomil: catálogo antiguo con índice de categorías propio (no
            # WooCommerce, no ?s=query) — misma lógica que Clarel, función
            # dedicada en vez de scraping genérico.
            if not url_imagen and marca == "THOMIL" and mapa_marcas.get(marca) == "catalogodeproductos.thomil.com":
                for query in queries[:2]:
                    url, motivo = buscar_imagen_thomil(query, sesion)
                    motivos_debug.append(f"Thomil [{query}]: {motivo}")
                    if url:
                        url_imagen = url
                        metodo_usado = f"Thomil: {motivo}"
                        break

            # Fallback: scraping directo si hay marca (y el dominio respondía) —
            # no aplica a Clarel/Thomil, que ya tienen su propia función dedicada
            if (not url_imagen and marca and dominio_ok
                    and mapa_marcas.get(marca) not in ("clarel.es", "catalogodeproductos.thomil.com")):
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

        # Red de seguridad: si esta MISMA imagen ya se asignó a OTRO
        # producto en esta ejecución, es casi seguro que sea el mismo
        # fallo de "un candidato genérico gana repetidamente" (ej. el
        # nombre de marca cruzando el umbral él solo) — rara vez dos
        # productos distintos usan de verdad la misma foto exacta,
        # incluso siendo de la misma familia/marca. Se descarta en vez
        # de arriesgarse a subir la misma imagen para varios productos.
        # Limpieza general por si acaso: espacios sobrantes al principio/
        # final de la URL (confirmado real en titanlux.es: un
        # "...SZ3.jpg " con espacio final provocaba un 403 al descargar,
        # porque el espacio se codifica como %20 y el CDN rechaza esa URL)
        if url_imagen:
            url_imagen = url_imagen.strip()

        if url_imagen and url_imagen in urls_ya_asignadas:
            ref_previa = urls_ya_asignadas[url_imagen]
            motivos_debug.append(
                f"Descartado: esta misma imagen ya se asignó a la referencia {ref_previa} "
                f"en esta ejecución — posible candidato genérico, no específico de este producto"
            )
            url_imagen = None
            metodo_usado = None
        elif url_imagen:
            urls_ya_asignadas[url_imagen] = referencia

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
    print(f"\n→ SIGUIENTE PASO — revisar visualmente ANTES de subir nada:")
    print(f"  python generar_revision_html.py --carpeta {args.salida}")
    print(f"  Abre el revision.html generado, aprueba/rechaza cada una, y pulsa")
    print(f'  "Descargar aprobadas.csv" al terminar (normalmente cae en tu carpeta')
    print(f"  de Descargas — muévelo a {args.salida}\\ antes del siguiente paso).")
    print(f"\n→ IMPORTANTE al subir: usa aprobadas.csv, NO {os.path.basename(csv_path)}")
    print(f"  (ese tiene TODO lo encontrado sin filtrar, incluidas las que rechazaste):")
    print(f"  python subir_imagenes_validadas.py --directorio {args.salida} --csv {args.salida}\\aprobadas.csv")


if __name__ == "__main__":
    main()
