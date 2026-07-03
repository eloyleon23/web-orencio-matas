#!/usr/bin/env python3
"""
Script para buscar imágenes de productos usando Bing Search API
Gratis: 1000 búsquedas/mes
Documentación: https://docs.microsoft.com/en-us/bing/web-search/
"""

import requests
import json
import os
from typing import List, Dict, Optional

# Configuración
BING_API_KEY = os.environ.get('BING_API_KEY', '')
BING_SEARCH_ENDPOINT = "https://api.bing.microsoft.com/v7.0/images/search"

def buscar_imagen_producto(
    nombre_producto: str,
    marca: Optional[str] = None,
    referencia: Optional[str] = None,
    count: int = 10
) -> List[Dict]:
    """
    Busca imágenes de un producto usando Bing Search API
    
    Args:
        nombre_producto: Nombre del producto
        marca: Marca del producto (opcional)
        referencia: Referencia del producto (opcional)
        count: Número de resultados a devolver (máximo 150)
    
    Returns:
        Lista de diccionarios con información de las imágenes
    """
    if not BING_API_KEY:
        raise ValueError("BING_API_KEY no está configurada en variables de entorno")
    
    # Construir query de búsqueda
    query = nombre_producto
    if marca:
        query += f" {marca}"
    if referencia:
        query += f" {referencia}"
    
    # Añadir términos para mejorar precisión
    query += " producto packshot"
    
    headers = {
        'Ocp-Apim-Subscription-Key': BING_API_KEY
    }
    
    params = {
        'q': query,
        'count': count,
        'imageType': 'Photo',
        'size': 'Medium',
        'safeSearch': 'Moderate',
        'mkt': 'es-ES'
    }
    
    try:
        response = requests.get(BING_SEARCH_ENDPOINT, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Extraer información relevante de las imágenes
        resultados = []
        for img in data.get('value', []):
            resultados.append({
                'url': img.get('contentUrl'),
                'thumbnail_url': img.get('thumbnailUrl'),
                'name': img.get('name'),
                'host_page_url': img.get('hostPageUrl'),
                'width': img.get('width'),
                'height': img.get('height'),
                'encoding_format': img.get('encodingFormat')
            })
        
        return resultados
        
    except requests.exceptions.RequestException as e:
        print(f"Error al buscar imágenes: {e}")
        return []

def buscar_imagenes_lote(
    productos: List[Dict],
    max_busquedas: int = 1000
) -> Dict[str, List[Dict]]:
    """
    Busca imágenes para un lote de productos
    
    Args:
        productos: Lista de diccionarios con información de productos
        max_busquedas: Número máximo de búsquedas a realizar
    
    Returns:
        Diccionario con resultados por referencia
    """
    resultados = {}
    busquedas_realizadas = 0
    
    for producto in productos:
        if busquedas_realizadas >= max_busquedas:
            print(f"Límite de {max_busquedas} búsquedas alcanzado")
            break
        
        referencia = producto.get('referencia', '')
        nombre = producto.get('nombre', '')
        marca = producto.get('marca', '')
        
        if not referencia or not nombre:
            continue
        
        print(f"Buscando imagen para {nombre} ({referencia})...")
        imagenes = buscar_imagen_producto(nombre, marca, referencia, count=5)
        
        if imagenes:
            resultados[referencia] = imagenes
            busquedas_realizadas += 1
        else:
            print(f"No se encontraron imágenes para {nombre}")
    
    return resultados

if __name__ == "__main__":
    # Prueba con un producto de ejemplo
    producto_prueba = {
        'nombre': 'Champú Anticaspa',
        'marca': 'Pantene',
        'referencia': '8411582237609'
    }
    
    print("Buscando imagen de prueba...")
    resultados = buscar_imagen_producto(
        producto_prueba['nombre'],
        producto_prueba['marca'],
        producto_prueba['referencia']
    )
    
    print(f"\nSe encontraron {len(resultados)} imágenes:")
    for i, img in enumerate(resultados, 1):
        print(f"\n{i}. {img.get('name')}")
        print(f"   URL: {img.get('url')}")
        print(f"   Dimensiones: {img.get('width')}x{img.get('height')}")
        print(f"   Página origen: {img.get('host_page_url')}")
