#!/usr/bin/env python3
"""
Buscar imágenes de productos usando Pexels API (gratuita)
Busca por descripción completa del producto sin depender de dominios específicos.
"""

import argparse
import csv
import json
import os
import sys
import time
import requests
import pandas as pd
from PIL import Image
from io import BytesIO

# Configuración
TIMEOUT = 20
EXTENSIONES_VALIDAS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]

def buscar_imagen_pexels(api_key, query, sesion):
    """Busca imágenes usando Pexels API (gratuita)."""
    API_URL = "https://api.pexels.com/v1/search"
    headers = {
        "Authorization": api_key
    }
    params = {
        "query": query,
        "per_page": "3",
        "orientation": "all"
    }
    try:
        resp = sesion.get(API_URL, headers=headers, params=params, timeout=20)
        if resp.status_code == 401:
            return None, "API Key de Pexels inválida (401)"
        if resp.status_code == 429:
            return None, "cuota de Pexels agotada (429)"
        if resp.status_code != 200:
            return None, f"Pexels HTTP {resp.status_code}"
        
        data = resp.json()
        photos = data.get("photos", [])
        if not photos:
            return None, "sin resultados"
        
        # Devolver la primera imagen (la más relevante)
        image_data = photos[0]
        src = image_data.get("src", {})
        return src.get("large") or src.get("medium") or src.get("small"), "Pexels API OK"
    except Exception as e:
        return None, f"error: {e}"

def normalizar_query(nombre):
    """Normaliza el nombre del producto para búsqueda."""
    # Eliminar palabras comunes que no ayudan
    palabras_ignorar = [
        "ml", "l", "cm", "mm", "mts", "metros", "kilos", "kg", "gramos", "g",
        "uds", "unidades", "pack", "caja", "bolsa", "bote", "frasco", "botella"
    ]
    
    tokens = nombre.split()
    tokens_filtrados = [t for t in tokens if t.lower() not in palabras_ignorar and len(t) > 2]
    
    # Mantener hasta 6 palabras clave más importantes
    query = " ".join(tokens_filtrados[:6])
    return query

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--excel", required=True,
                     help="Ruta al Excel filtrado de productos nuevos")
    ap.add_argument("--pexels-key", required=True,
                     help="API Key de Pexels (gratuita en pexels.com/api)")
    ap.add_argument("--salida", default="imagenes_pexels",
                     help="Directorio temporal para guardar las imágenes")
    ap.add_argument("--limite", type=int, default=0,
                     help="Máximo de productos a procesar (0 = todos)")
    ap.add_argument("--dry-run", action="store_true",
                     help="Simula el proceso sin descargar imágenes")
    args = ap.parse_args()
    
    # Verificar que el Excel existe
    if not os.path.exists(args.excel):
        print(f"[ERROR] No encuentro el Excel: {args.excel}")
        sys.exit(1)
    
    # Cargar el Excel
    print(f"→ Cargando Excel: {args.excel}")
    try:
        df = pd.read_excel(args.excel)
        df.columns = [c.strip().lower() for c in df.columns]
        
        # Verificar columnas requeridas
        columnas_requeridas = ["referencia", "nombre"]
        columnas_faltantes = [c for c in columnas_requeridas if c not in df.columns]
        if columnas_faltantes:
            print(f"[ERROR] Faltan columnas requeridas: {columnas_faltantes}")
            sys.exit(1)
        
        # Convertir todos los valores a strings
        for col in df.columns:
            df[col] = df[col].astype(str).replace('nan', '')
        
        productos = df.to_dict("records")
        if args.limite:
            productos = productos[:args.limite]
        
        print(f"  {len(productos)} productos a procesar")
    except Exception as e:
        print(f"[ERROR] Error leyendo el Excel: {e}")
        sys.exit(1)
    
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
        
        if not referencia:
            print(f"[{i}/{len(productos)}] FALLO: sin referencia")
            sin_resultado.append({
                "referencia": referencia,
                "nombre": nombre,
                "motivo": "sin referencia"
            })
            continue
        
        print(f"[{i}/{len(productos)}] {referencia}: {nombre[:50]}...")
        
        # Normalizar query
        query = normalizar_query(nombre)
        print(f"  Query: {query}")
        
        # Buscar en Pexels
        url_imagen, metodo = buscar_imagen_pexels(args.pexels_key, query, sesion)
        
        if args.dry_run:
            if url_imagen:
                print(f"  → Encontrada: {metodo}")
            else:
                print(f"  → No encontrada: {metodo}")
            continue
        
        if url_imagen:
            try:
                # Descargar imagen
                r = sesion.get(url_imagen, timeout=TIMEOUT)
                r.raise_for_status()
                
                # Convertir a JPG
                img = Image.open(BytesIO(r.content))
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                nombre_archivo = f"{referencia}.jpg"
                ruta_local = os.path.join(args.salida, nombre_archivo)
                img.save(ruta_local, 'JPEG', quality=85)
                
                encontradas.append({
                    "referencia": referencia,
                    "nombre_producto": nombre,
                    "nombre_archivo": nombre_archivo,
                    "metodo": metodo,
                    "url_origen": url_imagen,
                    "query": query
                })
                print(f"  ✓ Descargada: {nombre_archivo}")
            except Exception as e:
                sin_resultado.append({
                    "referencia": referencia,
                    "nombre": nombre,
                    "motivo": f"error descarga: {e}"
                })
                print(f"  ✗ Error descargando: {e}")
        else:
            sin_resultado.append({
                "referencia": referencia,
                "nombre": nombre,
                "motivo": metodo
            })
            print(f"  ✗ Sin resultados: {metodo}")
        
        time.sleep(0.2)  # Cortesía
    
    if args.dry_run:
        print(f"\n(simulación) {len(productos)} productos procesados")
        return
    
    # Guardar CSV con imágenes descargadas
    csv_path = os.path.join(args.salida, "imagenes_descargadas.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "nombre_archivo", "metodo", "url_origen", "query"])
        w.writeheader()
        w.writerows(encontradas)
    
    # Guardar CSV con sin resultado
    csv_sin_path = os.path.join(args.salida, "sin_resultado.csv")
    with open(csv_sin_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre", "motivo"])
        w.writeheader()
        w.writerows(sin_resultado)
    
    print(f"\n✔ Completado:")
    print(f"  {len(encontradas)} imágenes descargadas en {args.salida}/")
    print(f"  {len(sin_resultado)} sin resultados")
    print(f"  CSV descargadas: {csv_path}")
    print(f"  CSV sin resultado: {csv_sin_path}")
    print(f"\n→ Revisa las imágenes en {args.salida}/ y elimina las que no sean adecuadas.")

if __name__ == "__main__":
    main()
