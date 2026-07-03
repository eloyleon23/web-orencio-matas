# -*- coding: utf-8 -*-
"""
buscar_imagenes_gratis.py
===========================
EJECUTAR EN TU ORDENADOR. Alternativa SIN COSTE a buscar_imagenes_api.py:
en vez de pagar por la Google Custom Search API, prueba a usar la propia
API pública de producto de cada web de marca.

Por qué funciona: muchas de las webs de marca que tenemos en
marcas_dominios.json están construidas con WooCommerce (WordPress), que por
defecto expone una API REST pública de solo lectura — la misma que usa el
buscador interno de la propia tienda — sin necesitar clave ni cuenta de
facturación. Por ejemplo, comprobé que babaria.es corre WooCommerce 10.7.0.

Prueba, para cada dominio, EN ESTE ORDEN, y usa el primero que responda:
 1. WooCommerce Store API:  /wp-json/wc/store/v1/products?search=...
    (API moderna de WooCommerce, pública por defecto desde WC 8.x)
 2. WooCommerce API legacy: /wp-json/wc/v1/products?search=...
    (algunas tiendas antiguas solo tienen esta, a veces también pública)
 3. WordPress REST search:  /wp-json/wp/v2/search?search=...&subtype=product
    (fallback genérico si las anteriores no están disponibles)

Si NINGUNA de las tres responde para un dominio, el producto se anota en
sin_metodo_gratuito.csv — para esos puedes recurrir a
buscar_imagenes_api.py (la vía de pago) solo para esos casos concretos.

IMPORTANTE: la primera vez que lo uses, lánzalo con --limite 10 y revisa
si realmente encuentra imágenes razonables — no todas las webs tendrán
la API pública activa, y esto no lo puedo comprobar por ti de antemano
(mi entorno no tiene acceso a esos dominios). Este script te dirá, dominio
por dominio, cuál funciona y cuál no (ver --diagnostico).

Uso:
    # Primero, comprobar qué dominios tienen API pública disponible:
    python buscar_imagenes_gratis.py --diagnostico

    # Luego, buscar imágenes de verdad:
    python buscar_imagenes_gratis.py --limite 30 --dry-run
    python buscar_imagenes_gratis.py --limite 200
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
from normalizar import normalizar_nombre, tokens_clave

EXTENSIONES_VALIDAS = (".jpg", ".jpeg", ".png", ".webp")
TIMEOUT = 12


def _sin_acentos(t):
    return "".join(c for c in unicodedata.normalize("NFKD", t or "") if not unicodedata.combining(c)).upper()


def cargar_mapa_marcas(ruta):
    with open(ruta, encoding="utf-8") as f:
        data = json.load(f)
    return {k: v for k, v in data.items() if not k.startswith("_")}


def detectar_marca(nombre, mapa_marcas):
    nombre_norm = _sin_acentos(nombre)
    for marca in mapa_marcas:
        if re.match(rf"^{re.escape(marca)}\b", nombre_norm):
            return marca
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


# ── Los tres métodos gratuitos, probados en orden ──
def _probar_store_api(dominio, query, sesion):
    url = f"https://{dominio}/wp-json/wc/store/v1/products"
    r = sesion.get(url, params={"search": query, "per_page": 1}, timeout=TIMEOUT)
    if r.status_code != 200:
        return None, f"store_api HTTP {r.status_code}"
    try:
        items = r.json()
    except ValueError:
        return None, "store_api respuesta no es JSON (¿bloqueado por CDN/WAF?)"
    if not isinstance(items, list) or not items:
        return None, "store_api 200 pero 0 resultados"
    imagenes = items[0].get("images") or []
    if not imagenes:
        return None, "store_api encontró producto pero sin imagen"
    return imagenes[0].get("src"), "store_api OK"


def _probar_wc_legacy_api(dominio, query, sesion):
    url = f"https://{dominio}/wp-json/wc/v1/products"
    r = sesion.get(url, params={"search": query, "per_page": 1}, timeout=TIMEOUT)
    if r.status_code != 200:
        return None, f"wc_legacy HTTP {r.status_code}"
    try:
        items = r.json()
    except ValueError:
        return None, "wc_legacy respuesta no es JSON"
    if not isinstance(items, list) or not items:
        return None, "wc_legacy 200 pero 0 resultados"
    imagenes = items[0].get("images") or []
    if not imagenes:
        return None, "wc_legacy encontró producto pero sin imagen"
    return imagenes[0].get("src"), "wc_legacy OK"


def _probar_wp_search(dominio, query, sesion):
    url = f"https://{dominio}/wp-json/wp/v2/search"
    r = sesion.get(url, params={"search": query, "subtype": "product", "per_page": 1}, timeout=TIMEOUT)
    if r.status_code != 200:
        return None, f"wp_search HTTP {r.status_code}"
    try:
        items = r.json()
    except ValueError:
        return None, "wp_search respuesta no es JSON"
    if not isinstance(items, list) or not items:
        return None, "wp_search 200 pero 0 resultados"
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


METODOS = [
    ("store_api", _probar_store_api),
    ("wc_legacy", _probar_wc_legacy_api),
    ("wp_search", _probar_wp_search),
]


def buscar_imagen_gratis(dominio, query, sesion):
    """Prueba los 3 métodos en orden, devuelve (url_imagen, metodo, diagnostico)."""
    motivos = []
    for nombre_metodo, funcion in METODOS:
        try:
            url, motivo = funcion(dominio, query, sesion)
            motivos.append(motivo)
            if url:
                return url, nombre_metodo, motivo
        except requests.exceptions.RequestException as e:
            motivos.append(f"{nombre_metodo} error de red: {e}")
            continue
    return None, None, " | ".join(motivos)


def modo_diagnostico(mapa_marcas, sesion):
    print("→ Probando disponibilidad de API pública en cada dominio configurado...\n")
    resultados = []
    for marca, dominio in mapa_marcas.items():
        url, metodo, motivo = buscar_imagen_gratis(dominio, "crema", sesion)  # query generica de prueba
        estado = f"OK ({metodo})" if url else f"sin metodo gratuito disponible ({motivo})"
        print(f"  {marca:15} {dominio:25} -> {estado}")
        resultados.append({"marca": marca, "dominio": dominio, "disponible": bool(url), "metodo": metodo or "", "motivo": motivo})
        time.sleep(0.2)

    disponibles = sum(1 for r in resultados if r["disponible"])
    print(f"\n✓ {disponibles}/{len(resultados)} dominios con API pública gratuita disponible.")
    with open("diagnostico_apis_gratuitas.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["marca", "dominio", "disponible", "metodo", "motivo"])
        w.writeheader()
        w.writerows(resultados)
    print("  Detalle guardado en diagnostico_apis_gratuitas.csv")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--productos", default="../data/productos.json")
    ap.add_argument("--dominios", default="marcas_dominios.json")
    ap.add_argument("--areas", default="drogueria,perfumeria")
    ap.add_argument("--salida", default="imagenes_pendientes_revision/drogueria_perfumeria")
    ap.add_argument("--limite", type=int, default=30)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--diagnostico", action="store_true",
                     help="Solo comprueba que dominios tienen API publica disponible, no busca productos")
    args = ap.parse_args()

    mapa_marcas = cargar_mapa_marcas(args.dominios)
    sesion = requests.Session()
    sesion.headers["User-Agent"] = "Mozilla/5.0 (compatible; OrencioMatasImgBot/1.0)"

    if args.diagnostico:
        modo_diagnostico(mapa_marcas, sesion)
        return

    productos = cargar_productos_pendientes(args.productos, [a.strip() for a in args.areas.split(",")])
    print(f"→ {len(productos)} productos pendientes en drogueria/perfumeria.")

    if not args.dry_run:
        os.makedirs(args.salida, exist_ok=True)

    encontradas, sin_metodo, sin_resultado = [], [], []
    consultas = 0

    UNIDADES = {"ml", "l", "kg", "gr", "g", "cm", "mm", "uds", "ud"}

    def construir_queries(nombre, marca):
        """Devuelve [query_corta, query_larga] para probar en ese orden.
        La query corta quita la marca (redundante, ya restringimos por
        dominio) y los tokens de formato/volumen (400, ml...), que suelen
        hacer el buscador interno de la tienda demasiado estricto y no
        encontrar nada con el nombre completo y literal del producto."""
        tk = tokens_clave(nombre)
        marca_norm = _sin_acentos(marca).lower()
        corta = [t for t in tk if t != marca_norm and t not in UNIDADES and not t.isdigit()]
        query_corta = " ".join(corta[:5]) if corta else None
        query_larga = normalizar_nombre(nombre, para_busqueda=False)
        # Evitar probar dos veces la misma query si coinciden
        if query_corta and query_corta.lower() == query_larga.lower():
            return [query_larga]
        return [q for q in (query_corta, query_larga) if q]

    for p in productos:
        if consultas >= args.limite:
            print(f"\nLímite de {args.limite} productos procesados. Vuelve a lanzar para continuar.")
            break

        marca = detectar_marca(p["nombre"], mapa_marcas) or detectar_marca(p.get("familia", ""), mapa_marcas)
        if not marca:
            continue  # igual que en buscar_imagenes_api.py: sin marca detectada, se omite

        dominio = mapa_marcas[marca]
        queries = construir_queries(p["nombre"], marca)
        consultas += 1

        if args.dry_run:
            print(f"  {p['ref']}: queries={queries!r}  ->  {dominio} (WooCommerce/WP API)")
            continue

        url_imagen = metodo = None
        motivos_probados = []
        for query in queries:
            url_imagen, metodo, motivo = buscar_imagen_gratis(dominio, query, sesion)
            motivos_probados.append(f"[{query!r}] {motivo}")
            if url_imagen:
                break

        if not url_imagen:
            sin_resultado.append({
                "referencia": p["ref"], "nombre_producto": p["nombre"],
                "dominio": dominio, "motivo": " || ".join(motivos_probados),
            })
            print(f"  {p['ref']}: sin resultado en {dominio} ({motivos_probados[-1]})")
            continue

        ext = os.path.splitext(url_imagen.split("?")[0])[1].lower()
        if ext not in EXTENSIONES_VALIDAS:
            ext = ".jpg"
        nombre_archivo = f"{p['ref']}{ext}"
        ruta_local = os.path.join(args.salida, nombre_archivo)

        try:
            r = sesion.get(url_imagen, timeout=TIMEOUT)
            r.raise_for_status()
            with open(ruta_local, "wb") as fimg:
                fimg.write(r.content)
            encontradas.append({
                "referencia": p["ref"], "nombre_producto": p["nombre"],
                "nombre_archivo": nombre_archivo, "score": 75,
            })
            print(f"  {p['ref']}: OK  ({marca} vía {metodo})")
        except Exception as e:
            sin_resultado.append({
                "referencia": p["ref"], "nombre_producto": p["nombre"],
                "dominio": dominio, "motivo": f"error descarga: {e}",
            })

        time.sleep(0.2)

    if args.dry_run:
        return

    with open(os.path.join(args.salida, "imagenes_descargadas.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "nombre_archivo", "score"])
        w.writeheader()
        w.writerows(encontradas)

    with open(os.path.join(args.salida, "sin_metodo_gratuito_o_resultado.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "dominio", "motivo"])
        w.writeheader()
        w.writerows(sin_resultado)

    print(f"\n✓ {len(encontradas)} imágenes descargadas gratis, {len(sin_resultado)} sin resultado.")


if __name__ == "__main__":
    main()
