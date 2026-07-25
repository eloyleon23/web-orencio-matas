#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
casar_imagenes_talleres.py
===========================
Muchos productos nuevos de Talleres (llegados por el listado del CRM) son en
realidad EL MISMO producto real que ya tenemos fotografiado en los catálogos
de Zaphiro/Besa (extraídos antes por PDF) — solo que con una referencia
distinta, porque el CRM y el catálogo de proveedor no comparten código.

Este script NO busca nada en internet: casa por similitud de nombre contra
las imágenes que YA tenemos descargadas en assets/imagenes_talleres/, y
copia las candidatas a un directorio local para revisión manual, con el
MISMO formato de CSV que ya usan el resto de scripts de esta carpeta — así
generar_revision_html.py funciona igual sin cambios.

Fuentes usadas (con imagen real, no genérica):
  - data/productos_talleres.json (Zaphiro) — 799/801 con imagen
  - data/productos_besa.json (Besa)        —  29/49  con imagen
Glasurit no tiene imagen propia en ningún producto (usa fallback genérico) y
Baslac es un único registro genérico — ninguno de los dos aporta candidatas
aquí, así que se excluyen a propósito.

Uso:
    python casar_imagenes_talleres.py --excel productos_nuevos.xlsx --salida candidatos_talleres

    # Solo ver qué casaría, sin copiar nada:
    python casar_imagenes_talleres.py --excel productos_nuevos.xlsx --salida candidatos_talleres --dry-run

    # Ajustar el umbral mínimo de similitud (por defecto 2 tokens en común)
    python casar_imagenes_talleres.py --excel productos_nuevos.xlsx --salida candidatos_talleres --umbral 3
"""

import argparse
import csv
import json
import os
import re
import shutil
import sys
import unicodedata

import pandas as pd

RUTA_REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_IMAGENES_TALLERES = os.path.join(RUTA_REPO, "assets", "imagenes_talleres")
RUTA_CATALOGOS = {
    "Zaphiro": os.path.join(RUTA_REPO, "data", "productos_talleres.json"),
    "Besa": os.path.join(RUTA_REPO, "data", "productos_besa.json"),
}

# Palabras sin valor discriminante para el matching (unidades, envases,
# conectores) — se quitan antes de comparar, para que el solapamiento de
# tokens refleje similitud real de producto y no solo "los dos llevan ML".
PALABRAS_VACIAS = {
    "ML", "L", "LTS", "LT", "KG", "KGS", "GR", "GRS", "G", "MM", "CM", "MTS", "M",
    "CAJA", "CAJAS", "UDS", "UD", "UNIDAD", "UNIDADES", "PACK", "BOTE", "FRASCO",
    "BOTELLA", "GARRAFA", "SACO", "BOLSA", "KIT", "JUEGO", "REF", "DE", "LA", "EL",
    "LOS", "LAS", "Y", "PARA", "CON", "SIN", "A", "X",
}


def sin_acentos(texto):
    if texto is None:
        return ""
    t = str(texto)
    return "".join(c for c in unicodedata.normalize("NFKD", t) if not unicodedata.combining(c))


def normalizar_tokens(nombre):
    """Quita el punto inicial (artefacto habitual del CRM al dar de alta
    productos, ver README/hallazgo de esta sesión), acentos, y separa en
    tokens en mayúsculas, descartando las palabras vacías y los tokens de
    un solo carácter. Devuelve los tokens en tres grupos:
      - tokens_codigo: alfanuméricos reales (mezclan letras Y dígitos, ej.
        "S230L", "ZPQ05", "P-60", "ER05TE") — la prueba más fuerte de que
        es el MISMO producto.
      - tokens_numero: solo dígitos (ej. "30", "100") — probablemente una
        medida/capacidad/cantidad, NO un código de modelo; dos productos
        distintos comparten "30" (de 30 L.) constantemente sin ser el
        mismo producto, así que cuentan como señal débil, igual que una
        palabra genérica, no como un código fuerte.
      - tokens_palabra: el resto (solo letras).
    Esta triple separación es clave para el matching: dos productos del
    mismo tipo y marca pero de modelo distinto (ej. aspirador RUPES S130L
    vs S230L) comparten palabras genéricas Y a veces un número de
    capacidad igual (30 L. en ambos) — sin distinguir "código real" de
    "número suelto", ese número coincidente inflaba la confianza como si
    fuera prueba de ser el mismo modelo."""
    n = sin_acentos(nombre).upper().lstrip(".").strip()
    n = re.sub(r"[^\w\s-]", " ", n)  # puntuación fuera, guiones se mantienen (P-60, URKI-FAST...)
    tokens = [t for t in n.split() if t not in PALABRAS_VACIAS and len(t) > 1]

    tokens_codigo = set()
    tokens_numero = set()
    tokens_palabra = set()
    for t in tokens:
        tiene_digito = any(ch.isdigit() for ch in t)
        tiene_letra = any(ch.isalpha() for ch in t)
        if tiene_digito and tiene_letra:
            tokens_codigo.add(t)
        elif tiene_digito:
            tokens_numero.add(t)
        else:
            tokens_palabra.add(t)
    return tokens_codigo, tokens_numero, tokens_palabra


def cargar_catalogo(fabricante, ruta):
    """Devuelve lista de candidatos (con tokens separados en código/palabra)
    solo para productos que sí tienen imagen real (no genérica) en el catálogo."""
    with open(ruta, encoding="utf-8") as f:
        data = json.load(f)
    productos = data.get("productos", data) if isinstance(data, dict) else data

    candidatos = []
    for p in productos:
        img = p.get("img")
        if not img:
            continue
        ruta_img = os.path.join(RUTA_IMAGENES_TALLERES, img)
        if not os.path.exists(ruta_img):
            continue  # el JSON dice que tiene imagen pero el archivo no está — no ofrecer un candidato roto
        tokens_codigo, tokens_numero, tokens_palabra = normalizar_tokens(p.get("nombre", ""))
        if not tokens_codigo and not tokens_numero and not tokens_palabra:
            continue
        candidatos.append({
            "fabricante": fabricante,
            "ref": p.get("ref", ""),
            "nombre": p.get("nombre", ""),
            "img": img,
            "ruta_img": ruta_img,
            "tokens_codigo": tokens_codigo,
            "tokens_numero": tokens_numero,
            "tokens_palabra": tokens_palabra,
        })
    return candidatos


# Peso de un código/modelo coincidente frente a un número suelto o una
# palabra genérica coincidente — un código exacto (ZPQ05, S230L, ER05TE)
# es una prueba mucho más fuerte de que es el MISMO producto que
# compartir solo el tipo de producto y la marca (ej. "ASPIRADOR RUPES") o
# una medida/capacidad que muchos productos distintos comparten por
# casualidad (ej. "30" de 30 L.).
PESO_CODIGO = 4
PESO_NUMERO = 1
PESO_PALABRA = 1


def mejor_coincidencia(tokens_codigo_obj, tokens_numero_obj, tokens_palabra_obj, catalogo):
    """Puntúa cada candidato del catálogo por solapamiento de tokens con el
    producto objetivo (con mucho más peso a los códigos/modelos que a
    números sueltos o palabras genéricas), y devuelve el de mayor
    puntuación junto con el detalle de cuántos códigos/números/palabras
    coincidieron (para decidir confianza después)."""
    mejor = None
    mejor_score = 0
    mejor_detalle = (0, 0, 0)  # (codigos_en_comun, numeros_en_comun, palabras_en_comun)
    for c in catalogo:
        codigos_comunes = tokens_codigo_obj & c["tokens_codigo"]
        numeros_comunes = tokens_numero_obj & c["tokens_numero"]
        palabras_comunes = tokens_palabra_obj & c["tokens_palabra"]
        score = (len(codigos_comunes) * PESO_CODIGO
                 + len(numeros_comunes) * PESO_NUMERO
                 + len(palabras_comunes) * PESO_PALABRA)
        if score > mejor_score:
            mejor_score = score
            mejor = c
            mejor_detalle = (len(codigos_comunes), len(numeros_comunes), len(palabras_comunes))
    return mejor, mejor_score, mejor_detalle


def calcular_confianza(n_codigos, n_numeros, n_palabras):
    """Traduce el detalle de la coincidencia a un score 0-100 para el
    visor (bajo <60, medio 60-79, alto ≥80 — umbrales ya usados por
    generar_revision_html.py). Un código/modelo coincidente es la prueba
    real de que es el MISMO producto; números sueltos (capacidad, talla)
    o palabras genéricas en común (mismo tipo de producto y marca, pero
    posiblemente otro modelo/color) nunca deben llegar a "alto" por sí
    solos, por mucho que se acumulen."""
    if n_codigos >= 2:
        return 92
    if n_codigos == 1:
        return 85 if (n_numeros + n_palabras) >= 1 else 78
    total_debil = n_numeros + n_palabras
    if total_debil >= 5:
        return 70
    if total_debil >= 3:
        return 62
    return 50


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--excel", required=True,
                     help="Excel de productos sin foto (ej. productos_nuevos.xlsx)")
    ap.add_argument("--salida", default="candidatos_talleres",
                     help="Directorio donde copiar las imágenes candidatas y el CSV")
    ap.add_argument("--umbral", type=int, default=3,
                     help="Score mínimo ponderado para aceptar una coincidencia (por defecto 3: "
                          "equivale a 1 código/modelo en común, o 3 palabras genéricas)")
    ap.add_argument("--solo-area-talleres", action="store_true", default=True,
                     help="Restringir a productos con area=talleres (por defecto activado)")
    ap.add_argument("--dry-run", action="store_true",
                     help="Muestra las coincidencias sin copiar nada")
    args = ap.parse_args()

    if not os.path.exists(args.excel):
        print(f"[ERROR] No encuentro el Excel: {args.excel}")
        sys.exit(1)

    df = pd.read_excel(args.excel)
    df.columns = [c.strip().lower() for c in df.columns]
    if "referencia" not in df.columns or "nombre" not in df.columns:
        print(f"[ERROR] Faltan columnas 'referencia'/'nombre'. Columnas encontradas: {list(df.columns)}")
        sys.exit(1)

    # Solo productos realmente sin foto (por si el Excel trajera alguno ya resuelto)
    if "imagen_drive_id" in df.columns:
        antes = len(df)
        df = df[df["imagen_drive_id"].astype(str).str.strip().str.upper() == "NO_TIENE_FOTO"]
        print(f"→ Filtrado NO_TIENE_FOTO: {len(df)}/{antes} productos")

    if args.solo_area_talleres and "area" in df.columns:
        antes = len(df)
        df = df[df["area"].astype(str).str.strip().str.lower() == "talleres"]
        print(f"→ Filtrado area=talleres: {len(df)}/{antes} productos")

    # Cargar catálogos fuente (con imagen real)
    catalogo = []
    for fabricante, ruta in RUTA_CATALOGOS.items():
        if not os.path.exists(ruta):
            print(f"[AVISO] No encuentro {ruta}, se omite {fabricante}")
            continue
        parte = cargar_catalogo(fabricante, ruta)
        print(f"→ {fabricante}: {len(parte)} productos con imagen real disponibles como candidatas")
        catalogo.extend(parte)

    if not catalogo:
        print("[ERROR] No hay ningún catálogo fuente con imágenes disponibles.")
        sys.exit(1)

    if not args.dry_run:
        os.makedirs(args.salida, exist_ok=True)

    encontradas = []
    sin_resultado = []

    for _, row in df.iterrows():
        referencia = str(row["referencia"]).strip()
        nombre = row["nombre"]

        tokens_codigo_obj, tokens_numero_obj, tokens_palabra_obj = normalizar_tokens(nombre)
        candidato, score, (n_codigos, n_numeros, n_palabras) = mejor_coincidencia(
            tokens_codigo_obj, tokens_numero_obj, tokens_palabra_obj, catalogo)

        if candidato and score >= args.umbral:
            confianza = calcular_confianza(n_codigos, n_numeros, n_palabras)
            print(f"{referencia}: {nombre[:55]!r}")
            print(f"   → {candidato['fabricante']} {candidato['ref']} {candidato['nombre'][:55]!r} "
                  f"(códigos: {n_codigos}, números: {n_numeros}, palabras: {n_palabras}, confianza: {confianza})")

            if not args.dry_run:
                ext = os.path.splitext(candidato["img"])[1] or ".jpg"
                nombre_archivo = f"{referencia}{ext}"
                shutil.copy2(candidato["ruta_img"], os.path.join(args.salida, nombre_archivo))
                encontradas.append({
                    "referencia": referencia,
                    "nombre_producto": nombre,
                    "nombre_archivo": nombre_archivo,
                    "metodo": f"Catálogo {candidato['fabricante']} ({candidato['ref']}) — "
                              f"{n_codigos} código(s), {n_numeros} número(s), {n_palabras} palabra(s) en común",
                    "url_origen": "",
                    "score": confianza,
                })
        else:
            sin_resultado.append({
                "referencia": referencia,
                "nombre": nombre,
                "motivo": f"mejor coincidencia score {score} (umbral {args.umbral})" if candidato else "ninguna coincidencia",
            })

    if args.dry_run:
        print(f"\n(simulación) {len(df)} productos evaluados, "
              f"{len(df) - len(sin_resultado)} con coincidencia ≥{args.umbral}, "
              f"{len(sin_resultado)} sin coincidencia suficiente")
        return

    csv_path = os.path.join(args.salida, "imagenes_descargadas.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "nombre_archivo", "metodo", "url_origen", "score"])
        w.writeheader()
        w.writerows(encontradas)

    csv_sin_path = os.path.join(args.salida, "sin_resultado.csv")
    with open(csv_sin_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre", "motivo"])
        w.writeheader()
        w.writerows(sin_resultado)

    print(f"\n✓ Completado:")
    print(f"  {len(encontradas)} candidatas copiadas en {args.salida}/")
    print(f"  {len(sin_resultado)} sin coincidencia suficiente")
    print(f"\n→ Revisa visualmente con: python generar_revision_html.py --carpeta {args.salida}")
    print(f"→ IMPORTANTE: aunque el nombre se parezca mucho, es una foto de OTRO producto")
    print(f"  (referencia distinta) — revisa que el envase/formato/color realmente coincida")
    print(f"  antes de aprobar, sobre todo en variantes (tamaño, color, grano...). Presta")
    print(f"  especial atención a las de confianza 'media' o 'baja' en el visor.")


if __name__ == "__main__":
    main()
