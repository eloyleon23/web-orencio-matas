#!/usr/bin/env python3
"""
Buscar imágenes de productos SOLO por descripción (sin filtros de dominio)
Usa scraping de Bing Images como método principal.
"""

import argparse
import csv
import os
import sys
import time
import requests
import pandas as pd
from PIL import Image
from io import BytesIO
from bs4 import BeautifulSoup

# Configuración
TIMEOUT = 20
EXTENSIONES_VALIDAS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]

def buscar_imagen_bing_descripcion(query, sesion):
    """Busca imágenes directamente en Bing Images por descripción con búsqueda exacta."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        # Usar comillas para búsqueda exacta
        search_url = "https://www.bing.com/images/search"
        params = {
            "q": f'"{query}"',  # Comillas para búsqueda exacta
            "safeSearch": "strict",
            "first": "1",
            "qft": ""  # Filtros adicionales
        }
        
        resp = sesion.get(search_url, params=params, headers=headers, timeout=20)
        if resp.status_code != 200:
            return None, f"Bing HTTP {resp.status_code}"
        
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # Bing Images usa div.mimg
        for img_div in soup.select("div.mimg"):
            img = img_div.select_one("img")
            if not img:
                continue
            
            src = img.get("src", "")
            data_src = img.get("data-src", "")
            msrc = img_div.get("m", "")
            
            image_url = msrc if msrc else (data_src if data_src else src)
            
            if not image_url or not image_url.startswith("http"):
                continue
            
            if "icon" in image_url.lower() or "logo" in image_url.lower():
                continue
            
            # Verificar que sea imagen válida
            try:
                img_resp = sesion.head(image_url, headers=headers, timeout=10, allow_redirects=True)
                if img_resp.status_code == 200:
                    content_type = img_resp.headers.get("content-type", "")
                    if "image" in content_type.lower():
                        return image_url, "Bing Images"
            except:
                continue
        
        return None, "sin resultados"
    except Exception as e:
        return None, f"error: {str(e)[:100]}"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--excel", required=True,
                     help="Ruta al Excel filtrado de productos nuevos")
    ap.add_argument("--salida", default="imagenes_descripcion",
                     help="Directorio temporal para guardar las imágenes")
    ap.add_argument("--limite", type=int, default=0,
                     help="Máximo de productos a procesar (0 = todos)")
    ap.add_argument("--dry-run", action="store_true",
                     help="Simula el proceso sin descargar imágenes")
    args = ap.parse_args()
    
    # Verificar Excel
    if not os.path.exists(args.excel):
        print(f"[ERROR] No encuentro el Excel: {args.excel}")
        sys.exit(1)
    
    # Cargar Excel
    print(f"→ Cargando Excel: {args.excel}")
    try:
        df = pd.read_excel(args.excel)
        df.columns = [c.strip().lower() for c in df.columns]
        
        columnas_requeridas = ["referencia", "nombre"]
        columnas_faltantes = [c for c in columnas_requeridas if c not in df.columns]
        if columnas_faltantes:
            print(f"[ERROR] Faltan columnas requeridas: {columnas_faltantes}")
            sys.exit(1)
        
        # Convertir a strings
        for col in df.columns:
            df[col] = df[col].astype(str).replace('nan', '')
        
        productos = df.to_dict("records")
        if args.limite:
            productos = productos[:args.limite]
        
        print(f"  {len(productos)} productos a procesar")
    except Exception as e:
        print(f"[ERROR] Error leyendo el Excel: {e}")
        sys.exit(1)
    
    # Crear directorio
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
        
        # Usar nombre completo como query
        query = nombre
        print(f"  Query: {query}")
        
        # Buscar en Bing
        url_imagen, metodo = buscar_imagen_bing_descripcion(query, sesion)
        
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
                    "url_origen": url_imagen
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
        
        time.sleep(0.3)  # Cortesía
    
    if args.dry_run:
        print(f"\n(simulación) {len(productos)} productos procesados")
        return
    
    # Guardar CSV
    csv_path = os.path.join(args.salida, "imagenes_descargadas.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["referencia", "nombre_producto", "nombre_archivo", "metodo", "url_origen"])
        w.writeheader()
        w.writerows(encontradas)
    
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
    print(f"\n⚠ IMPORTANTE: Revisa las imágenes manualmente y elimina las incorrectas.")
    print(f"→ El scraping de Bing puede devolver imágenes que no coinciden exactamente.")

if __name__ == "__main__":
    main()
