#!/usr/bin/env python3
"""
Detecta automáticamente la URL más reciente del catálogo Zaphiro
y actualiza zaphiro_config.json en el repositorio.
"""

import re, json, sys, os, datetime
import requests
from bs4 import BeautifulSoup

URL_ZAPHIRO = 'https://www.zaphirogroup.com/lineas-de-productos/'
CONFIG_PATH = 'zaphiro_config.json'

def obtener_url_catalogo():
    """Raspa la página de Zaphiro y devuelve la URL del catálogo principal."""
    headers = {'User-Agent': 'Mozilla/5.0 (compatible; OrencioMatasBot/1.0)'}
    resp = requests.get(URL_ZAPHIRO, headers=headers, timeout=20)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')

    # Buscar todos los enlaces a PDFs que contengan "CATALOGO-ZAPHIRO"
    urls = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        if 'CATALOGO-ZAPHIRO' in href and href.endswith('.pdf'):
            urls.append(href)

    if not urls:
        # Fallback: buscar cualquier PDF con "zaphiro" y año reciente
        año_actual = datetime.datetime.now().year
        for a in soup.find_all('a', href=True):
            href = a['href']
            if str(año_actual) in href and 'zaphiro' in href.lower() and '.pdf' in href:
                urls.append(href)

    if not urls:
        print("⚠ No se encontró URL del catálogo Zaphiro")
        return None

    # Preferir la URL con el año más reciente
    urls.sort(reverse=True)
    return urls[0]

def main():
    print("🔍 Buscando catálogo Zaphiro...")
    url = obtener_url_catalogo()

    if not url:
        sys.exit(1)

    print(f"✓ URL encontrada: {url}")

    # Extraer año del catálogo de la URL
    año_match = re.search(r'(\d{4})', url)
    año = año_match.group(1) if año_match else str(datetime.datetime.now().year)

    # Leer config anterior si existe
    config_anterior = {}
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH) as f:
            config_anterior = json.load(f)

    config = {
        'url':              url,
        'año':              año,
        'titulo':           f'Catálogo Zaphiro {año}',
        'actualizado':      datetime.datetime.utcnow().isoformat() + 'Z',
        'url_anterior':     config_anterior.get('url', ''),
    }

    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    print(f"✓ {CONFIG_PATH} actualizado — año: {año}")

    # Indicar si cambió la URL
    if url != config_anterior.get('url', ''):
        print(f"🆕 URL actualizada: {config_anterior.get('url','(ninguna)')} → {url}")
    else:
        print("ℹ URL sin cambios")

if __name__ == '__main__':
    main()
