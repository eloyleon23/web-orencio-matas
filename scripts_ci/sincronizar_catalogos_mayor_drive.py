#!/usr/bin/env python3
"""
Igual que sincronizar_catalogos_drive.py, pero para los catálogos AL POR
MAYOR (ver scripts/generar_catalogos_mayor.py): lee el manifiesto propio
de esta variante y avisa a Apps Script con la acción
"sincronizar_catalogos_mayor", que guarda los PDFs en Drive en sus
propios archivos de nombre fijo (sufijo "_mayor"), sin tocar en ningún
momento los catálogos normales.

No bloquea el resto del workflow si falla — mismo criterio que la
variante normal.
"""
import json
import urllib.request

APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec'


def main():
    with open('catalogos_output/manifiesto_mayor.json', encoding='utf-8') as f:
        manifiesto = json.load(f)

    catalogos_payload = {}
    for area, info in manifiesto.get('catalogos', {}).items():
        archivo = info.get('archivo')
        if not archivo:
            continue
        # URL del asset en el Release "catalogos-mayor-latest", publicado
        # por el paso anterior del workflow (softprops/action-gh-release).
        url_release = (
            f'https://github.com/eloyleon23/web-orencio-matas/releases/download/'
            f'catalogos-mayor-latest/{archivo}'
        )
        catalogos_payload[area] = {
            'url': url_release,
            'paginas': info.get('paginas'),
            'productos': info.get('productos'),
        }

    if not catalogos_payload:
        print('Nada que sincronizar (manifiesto al por mayor sin catálogos).')
        return

    payload = json.dumps({
        'accion': 'sincronizar_catalogos_mayor',
        'catalogos': catalogos_payload,
    }).encode('utf-8')

    req = urllib.request.Request(
        APPS_SCRIPT_URL,
        data=payload,
        headers={'Content-Type': 'text/plain;charset=utf-8'},
    )

    try:
        with urllib.request.urlopen(req, timeout=280) as resp:
            print('Sincronización de catálogos al por mayor en Drive:', resp.read().decode())
    except Exception as e:
        print(f'Aviso: no se pudo sincronizar los catálogos al por mayor en Drive ({e}) — no crítico, se reintentará en la próxima generación.')


if __name__ == '__main__':
    main()
