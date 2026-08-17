#!/usr/bin/env python3
"""
Envía el contenido recién regenerado de data/productos.json al Web App
de Apps Script, para que sobrescriba la caché en Drive que sirve
directamente el buscador — sin pasar por GitHub Pages en absoluto.

Se ejecuta como paso final de generar_productos_json.yml, tras cada
regeneración completa (cron horario o sincronización del CRM). No
bloquea el resto del workflow si falla: el commit a GitHub sigue siendo
válido igualmente, y la próxima actualización de imagen (o la siguiente
regeneración completa) lo reintentará.
"""
import json
import urllib.request

APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec'


def main():
    with open('data/productos.json', encoding='utf-8') as f:
        contenido = f.read()

    payload = json.dumps({
        'accion': 'sincronizar_cache_completo',
        'contenido': contenido,
    }).encode('utf-8')

    req = urllib.request.Request(
        APPS_SCRIPT_URL,
        data=payload,
        headers={'Content-Type': 'text/plain;charset=utf-8'},
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            print('Sincronización de caché en Drive:', resp.read().decode())
    except Exception as e:
        print(f'Aviso: no se pudo sincronizar la caché de Drive ({e}) — no crítico, se reintentará en la próxima ejecución.')


if __name__ == '__main__':
    main()
