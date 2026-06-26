#!/usr/bin/env python3
"""
Detecta automáticamente la URL más reciente del catálogo Zaphiro
probando URLs predecibles por año y mes, sin depender de scraping.
"""

import json, sys, os, datetime
import requests

CONFIG_PATH = 'zaphiro_config.json'
BASE_URL    = 'https://www.zaphirogroup.com/wp-content/uploads'

def construir_urls_candidatas(año):
    """Genera todas las URLs posibles para el catálogo de un año dado."""
    urls = []
    for mes in range(12, 0, -1):  # de diciembre a enero
        mes_str = f'{mes:02d}'
        urls.append(f'{BASE_URL}/{año}/{mes_str}/CATALOGO-ZAPHIRO-{año}_web.pdf')
        # Variantes de nombre que Zaphiro ha usado
        urls.append(f'{BASE_URL}/{año}/{mes_str}/CATALOGO-ZAPHIRO-{año}.pdf')
        urls.append(f'{BASE_URL}/{año}/{mes_str}/catalogo-zaphiro-{año}.pdf')
    return urls

def verificar_url(url):
    """Comprueba si una URL de PDF es accesible (HEAD request)."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; OrencioMatasBot/1.0)'}
        resp = requests.head(url, headers=headers, timeout=15, allow_redirects=True)
        return resp.status_code == 200
    except Exception:
        return False

def encontrar_url_catalogo():
    """Busca la URL del catálogo probando año actual y anterior."""
    ahora     = datetime.datetime.now()
    años      = [ahora.year, ahora.year + 1, ahora.year - 1]  # actual, siguiente, anterior

    for año in años:
        print(f"  Probando año {año}...")
        for url in construir_urls_candidatas(año):
            print(f"    → {url}")
            if verificar_url(url):
                print(f"  ✓ Encontrado: {url}")
                return url, str(año)

    return None, None

def main():
    print("🔍 Buscando catálogo Zaphiro por URL predecible...")

    url, año = encontrar_url_catalogo()

    if not url:
        # Si no encontramos nada, mantener la config anterior sin fallar
        if os.path.exists(CONFIG_PATH):
            print("⚠ No se encontró nueva URL. Manteniendo config anterior.")
            sys.exit(0)
        else:
            print("⚠ No se encontró URL y no hay config previa.")
            sys.exit(1)

    # Leer config anterior
    config_anterior = {}
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH) as f:
            config_anterior = json.load(f)

    config = {
        'url':          url,
        'año':          año,
        'titulo':       f'Catálogo Zaphiro {año}',
        'actualizado':  datetime.datetime.utcnow().isoformat() + 'Z',
        'url_anterior': config_anterior.get('url', ''),
    }

    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    if url != config_anterior.get('url', ''):
        print(f"🆕 URL actualizada → {url}")
    else:
        print("ℹ URL sin cambios")

    print(f"✓ {CONFIG_PATH} actualizado — año: {año}")

if __name__ == '__main__':
    main()
