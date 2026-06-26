#!/usr/bin/env python3
"""
Lee la configuración del catálogo Zaphiro desde Google Sheets
y actualiza zaphiro_config.json.
"""

import json, sys, os, datetime
import requests

CONFIG_PATH = 'zaphiro_config.json'
SHEET_ID    = os.environ.get('SHEET_ID', '')

def leer_config_zaphiro():
    """Lee la hoja 'Configuracion' del Google Sheet."""
    url = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
           f"/gviz/tq?tqx=out:csv&sheet=Configuracion")
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()

    print(f"DEBUG respuesta raw:\n{resp.text[:500]}")

    import csv, io
    reader = csv.DictReader(io.StringIO(resp.text))
    config = {}
    for row in reader:
        print(f"DEBUG fila: {dict(row)}")
        clave = row.get('clave', '').strip().lower()
        valor = row.get('valor', '').strip()
        if clave and valor:
            config[clave] = valor
    print(f"DEBUG config final: {config}")
    return config

def main():
    print("📋 Leyendo configuración Zaphiro desde Google Sheets...")

    config_sheet = leer_config_zaphiro()

    url   = config_sheet.get('zaphiro_url', '')
    año   = config_sheet.get('zaphiro_año', str(datetime.datetime.now().year))
    activo = config_sheet.get('zaphiro_activo', 'si').lower()

    if not url:
        print("⚠ No se encontró zaphiro_url en la hoja Configuracion")
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
        'activo':       activo == 'si',
        'actualizado':  datetime.datetime.utcnow().isoformat() + 'Z',
        'url_anterior': config_anterior.get('url', ''),
    }

    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    if url != config_anterior.get('url', ''):
        print(f"🆕 URL actualizada → {url}")
    else:
        print("ℹ URL sin cambios")

    print(f"✓ {CONFIG_PATH} actualizado — año: {año}, activo: {activo}")

if __name__ == '__main__':
    main()
