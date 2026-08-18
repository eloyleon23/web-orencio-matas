#!/usr/bin/env python3
"""
Tras publicar los catálogos como assets de un Release de GitHub, avisa
al Web App de Apps Script con esas URLs — Apps Script las descarga y las
guarda en Drive, en archivos de nombre fijo (conservando su ID entre
regeneraciones vía el servicio avanzado de Drive), para que la web
pueda enlazarlas directamente sin depender de ningún despliegue, ni en
GitHub Pages ni en IONOS.

No bloquea el resto del workflow si falla: los catálogos ya están
publicados en el Release y en el repositorio igualmente (vía
data/catalogos/, ver el propio workflow), así que un fallo aquí solo
significa que la vista servida desde Drive se queda un poco atrás hasta
la próxima generación — no se pierde nada.
"""
import json
import sys
import urllib.request

APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec'


def main():
    with open('catalogos_output/manifiesto.json', encoding='utf-8') as f:
        manifiesto = json.load(f)

    catalogos_payload = {}
    for area, info in manifiesto.get('catalogos', {}).items():
        archivo = info.get('archivo')
        if not archivo:
            continue
        # URL del asset en el Release "catalogos-latest", publicado por
        # el paso anterior del workflow (softprops/action-gh-release).
        url_release = (
            f'https://github.com/eloyleon23/web-orencio-matas/releases/download/'
            f'catalogos-latest/{archivo}'
        )
        catalogos_payload[area] = {
            'url': url_release,
            'paginas': info.get('paginas'),
            'productos': info.get('productos'),
        }

    if not catalogos_payload:
        print('Nada que sincronizar (manifiesto sin catálogos).')
        return

    payload = json.dumps({
        'accion': 'sincronizar_catalogos',
        'catalogos': catalogos_payload,
    }).encode('utf-8')

    req = urllib.request.Request(
        APPS_SCRIPT_URL,
        data=payload,
        headers={'Content-Type': 'text/plain;charset=utf-8'},
    )

    try:
        # Descargar varios PDFs grandes desde dentro de Apps Script puede
        # tardar — margen amplio antes de darlo por fallido.
        with urllib.request.urlopen(req, timeout=280) as resp:
            print('Sincronización de catálogos en Drive:', resp.read().decode())
    except Exception as e:
        print(f'Aviso: no se pudo sincronizar los catálogos en Drive ({e}) — no crítico, se reintentará en la próxima generación.')


if __name__ == '__main__':
    main()
