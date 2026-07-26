#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
buscar_imagenes_barcode.py
============================
Busca la foto de un producto directamente por su código de barras (EAN),
en vez de por nombre de marca — así NO hace falta configurar ni investigar
ningún dominio de fabricante (lo tedioso de marcas_dominios.json). Usa las
bases de datos abiertas y gratuitas Open Food Facts / Open Beauty Facts /
Open Products Facts (mismo proyecto, sin necesidad de API key), que cubren
justo el tipo de producto de este catálogo: droguería, limpieza,
perfumería y cosmética de consumo con EAN real.

Como es un match EXACTO por código de barras (no una búsqueda difusa por
texto), cuando encuentra algo la fiabilidad es muy alta — o es el EAN
exacto, o no aparece nada.

Uso:
    python buscar_imagenes_barcode.py --excel productos_nuevos.xlsx --salida imagenes_barcode

    # Solo ver qué encontraría, sin descargar nada:
    python buscar_imagenes_barcode.py --excel productos_nuevos.xlsx --salida imagenes_barcode --dry-run

    # Limitar a los N primeros (para probar antes de lanzar todo)
    python buscar_imagenes_barcode.py --excel productos_nuevos.xlsx --salida imagenes_barcode --limite 20
"""

import argparse
import csv
import os
import sys
import time
import unicodedata

import pandas as pd
import requests

TIMEOUT = 15
EXTENSIONES_VALIDAS = (".jpg", ".jpeg", ".png", ".webp")

# Bases de datos a probar, en orden — todas hermanas del mismo proyecto
# (Open Food Facts), sin API key. Se prueban las 3 porque un mismo
# producto de droguería/perfumería puede estar catalogado en cualquiera
# de ellas según quién lo dio de alta en su día.
BASES_DATOS = [
    ("Open Products Facts", "https://world.openproductsfacts.org/api/v2/product/{ean}.json"),
    ("Open Beauty Facts",   "https://world.openbeautyfacts.org/api/v2/product/{ean}.json"),
    ("Open Food Facts",     "https://world.openfoodfacts.org/api/v2/product/{ean}.json"),
]

# Open Food Facts pide explícitamente un User-Agent descriptivo de la
# app + contacto (no uno genérico tipo "bot") para no arriesgarse a que
# lo bloqueen — ver documentación oficial.
USER_AGENT = "OrencioMatasImgBot/1.0 (correo@orenciomatas.es)"


def sin_acentos(t):
    return "".join(c for c in unicodedata.normalize("NFKD", str(t) or "") if not unicodedata.combining(c))


def es_ean_valido(referencia):
    """Solo tiene sentido buscar por código de barras si la referencia
    ES un EAN real (8, 12 o 13 dígitos) — las referencias internas tipo
    'Z006099002' (Zaphiro) o similares no son códigos de barras y no
    aportarían nada aquí."""
    ref = str(referencia).strip()
    return ref.isdigit() and len(ref) in (8, 12, 13, 14)


def buscar_imagen_por_ean(ean, sesion):
    """Prueba las 3 bases de datos en orden. Devuelve (url_imagen,
    nombre_producto_encontrado, base_datos, motivo)."""
    motivos = []
    for nombre_bd, url_plantilla in BASES_DATOS:
        url = url_plantilla.format(ean=ean)
        try:
            r = sesion.get(url, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            motivos.append(f"{nombre_bd}: error de red ({e})")
            continue

        if r.status_code == 404:
            motivos.append(f"{nombre_bd}: no encontrado (404)")
            continue
        if r.status_code != 200:
            motivos.append(f"{nombre_bd}: HTTP {r.status_code}")
            continue

        try:
            data = r.json()
        except ValueError:
            motivos.append(f"{nombre_bd}: respuesta no es JSON")
            continue

        if data.get("status") != 1:
            motivos.append(f"{nombre_bd}: {data.get('status_verbose', 'no encontrado')}")
            continue

        producto = data.get("product", {})
        # image_front_url = la foto principal del envase (lo que interesa
        # para un catálogo); image_url como respaldo si esa no viene.
        url_img = producto.get("image_front_url") or producto.get("image_url")
        nombre_producto = producto.get("product_name") or producto.get("product_name_es") or ""

        if not url_img:
            motivos.append(f"{nombre_bd}: producto encontrado pero sin foto")
            continue

        return url_img, nombre_producto, nombre_bd, "OK"

    return None, None, None, " | ".join(motivos)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--excel", required=True, help="Excel de productos sin foto (ej. productos_nuevos.xlsx)")
    ap.add_argument("--salida", default="imagenes_barcode", help="Directorio de salida")
    ap.add_argument("--limite", type=int, default=None, help="Procesar solo los N primeros (para pruebas)")
    ap.add_argument("--espera", type=float, default=0.3,
                     help="Segundos de espera entre productos, por cortesía con las APIs gratuitas (por defecto 0.3)")
    ap.add_argument("--dry-run", action="store_true", help="Muestra qué encontraría sin descargar nada")
    args = ap.parse_args()

    if not os.path.exists(args.excel):
        print(f"[ERROR] No encuentro el Excel: {args.excel}")
        sys.exit(1)

    df = pd.read_excel(args.excel)
    df.columns = [c.strip().lower() for c in df.columns]
    if "referencia" not in df.columns or "nombre" not in df.columns:
        print(f"[ERROR] Faltan columnas 'referencia'/'nombre'. Columnas encontradas: {list(df.columns)}")
        sys.exit(1)

    if "imagen_drive_id" in df.columns:
        antes = len(df)
        df = df[df["imagen_drive_id"].astype(str).str.strip().str.upper() == "NO_TIENE_FOTO"]
        print(f"→ Filtrado NO_TIENE_FOTO: {len(df)}/{antes} productos")

    # Solo referencias que parecen EAN real — evita perder tiempo con
    # referencias internas de Talleres (Z..., etc.) que nunca van a
    # aparecer en estas bases de datos de código de barras.
    antes = len(df)
    df = df[df["referencia"].apply(es_ean_valido)]
    print(f"→ Filtrado solo referencias con formato de EAN válido: {len(df)}/{antes} productos")

    if args.limite:
        df = df.head(args.limite)
        print(f"→ Limitado a los primeros {args.limite}")

    if not args.dry_run:
        os.makedirs(args.salida, exist_ok=True)

    sesion = requests.Session()
    sesion.headers["User-Agent"] = USER_AGENT

    encontradas = []
    sin_resultado = []

    for i, row in enumerate(df.itertuples(), 1):
        referencia = str(row.referencia).strip()
        nombre = row.nombre

        print(f"[{i}/{len(df)}] {referencia}: {str(nombre)[:50]}...")

        url_img, nombre_encontrado, base_datos, motivo = buscar_imagen_por_ean(referencia, sesion)

        if url_img:
            print(f"  → Encontrada en {base_datos}: {nombre_encontrado!r}")
            if not args.dry_run:
                try:
                    resp_img = sesion.get(url_img, timeout=TIMEOUT)
                    resp_img.raise_for_status()
                    ext = os.path.splitext(url_img.split("?")[0])[1].lower()
                    if ext not in EXTENSIONES_VALIDAS:
                        ext = ".jpg"
                    nombre_archivo = f"{referencia}{ext}"
                    with open(os.path.join(args.salida, nombre_archivo), "wb") as f:
                        f.write(resp_img.content)
                    encontradas.append({
                        "referencia": referencia,
                        "nombre_producto": nombre,
                        "nombre_archivo": nombre_archivo,
                        "metodo": f"{base_datos} (EAN exacto) — nombre allí: {nombre_encontrado}",
                        "url_origen": url_img,
                        "score": 95,  # match exacto por EAN — muy alta confianza por diseño
                    })
                except Exception as e:
                    print(f"  → [ERROR] descargando imagen: {e}")
                    sin_resultado.append({"referencia": referencia, "nombre": nombre, "motivo": f"encontrada pero fallo al descargar: {e}"})
        else:
            print(f"  → No encontrada ({motivo})")
            sin_resultado.append({"referencia": referencia, "nombre": nombre, "motivo": motivo})

        time.sleep(args.espera)

    if args.dry_run:
        print(f"\n(simulación) {len(df)} productos evaluados, "
              f"{len(df) - len(sin_resultado)} encontrados, {len(sin_resultado)} sin resultado")
        return

    with open(os.path.join(args.salida, "imagenes_descargadas.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "nombre_archivo", "metodo", "url_origen", "score"])
        w.writeheader()
        w.writerows(encontradas)

    with open(os.path.join(args.salida, "sin_resultado.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre", "motivo"])
        w.writeheader()
        w.writerows(sin_resultado)

    print(f"\n✓ Completado:")
    print(f"  {len(encontradas)} imágenes descargadas en {args.salida}/")
    print(f"  {len(sin_resultado)} sin resultado")
    print(f"\n→ Revisa visualmente con: python generar_revision_html.py --carpeta {args.salida}")
    print(f"  (aunque el match es por EAN exacto, revisa igual: a veces el mismo código")
    print(f"  se reutiliza entre variantes de packaging/tamaño distintas del mismo producto)")


if __name__ == "__main__":
    main()
