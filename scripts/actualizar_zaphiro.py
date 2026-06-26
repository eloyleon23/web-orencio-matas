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
    """Lee la hoja 'Configuracion' del Google Sheet fila a fila."""
    url = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
           f"/gviz/tq?tqx=out:csv&sheet=Configuracion")
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()

    import csv, io
    config = {}

    for row in csv.reader(io.StringIO(resp.text)):
        if len(row) < 2:
            continue

        # Limpiar clave: quitar prefijos espurios como "clave "
        clave = row[0].strip().lower()
        for prefijo in ('clave ', 'key '):
            if clave.startswith(prefijo):
                clave = clave[len(prefijo):]
        clave = clave.replace(' ', '_')

        # Limpiar valor: quitar prefijos espurios como "valor "
        valor = row[1].strip()
        for prefijo in ('valor ', 'value '):
            if valor.lower().startswith(prefijo):
                valor = valor[len(prefijo):]

        if clave.startswith('zaphiro_') and valor:
            config[clave] = valor

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
