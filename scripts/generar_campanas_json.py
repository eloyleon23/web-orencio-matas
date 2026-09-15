#!/usr/bin/env python3
"""
Generador de campanas.json para Escaparate OM (escaparate.html y
escaparate-campanas.html).

Por qué existe: ambas páginas leían las campañas llamando en vivo a la
acción 'obtener_campanas' del Web App de Apps Script — funciona, pero un
Web App de Apps Script tiene una latencia propia nada despreciable
(arranque en frío incluido), así que CADA carga de página pagaba ese
coste de nuevo. Mismo motivo por el que existe productos.json para el
buscador en vez de leer la hoja "Productos" en vivo en cada visita.

Con este generador, ambas páginas pasan a leer data/campanas.json — un
archivo estático servido por GitHub Pages (rápido, con caché de CDN),
regenerado:
- por Apps Script, justo después de cualquier cambio real (crear/editar/
  eliminar una campaña, cambiar sus productos, o su imagen) — ver
  dispararWorkflowCampanasJson() en apps_script_trigger.js;
- por un cron de seguridad cada 15 minutos, por si algún disparo puntual
  fallara por lo que sea;
- manualmente, si hiciera falta.

La gestión (crear/editar/borrar desde el modal) NO depende de este
archivo para funcionar — sigue escribiendo directamente en el Sheet vía
Apps Script, como siempre. Este archivo es solo la vía de LECTURA rápida
para las páginas públicas; puede quedar desactualizado unos segundos/
minutos tras un cambio (mismo margen ya aceptado en el proyecto para
productos.json), nunca más que eso gracias al disparo automático.
"""

import os
import re
import json
import csv
import io
import time
import datetime
import requests

SHEET_ID = os.environ.get('SHEET_ID', '')
OUTPUT_DIR = 'data'

# Mismas cabeceras que CABECERAS_CAMPANAS_ en apps_script_trigger.js —
# si esa lista cambia alguna vez, actualizar también aquí.
CABECERAS_ESPERADAS = [
    'id', 'nombre', 'tipo', 'origen', 'color_set', 'color_personalizado_1',
    'color_personalizado_2', 'fecha_inicio', 'fecha_fin', 'areas', 'productos',
    'destacados', 'imagen_fondo', 'eslogan', 'activa', 'fecha_creacion',
    'fecha_actualizacion',
]


def normalizar_fecha_iso(valor):
    """Intenta dejar una fecha en formato YYYY-MM-DD sea cual sea el
    formato con el que la exportó gviz (puede variar según el locale de
    la hoja) — más defensivo que asumir un único formato, ya que esto no
    se puede probar contra el Sheet real desde aquí. Si no reconoce el
    formato, devuelve el valor tal cual (mejor eso que perder el dato)."""
    valor = (valor or '').strip()
    if not valor:
        return ''
    # Ya viene en ISO (lo más común, si la celda es texto plano)
    if re.match(r'^\d{4}-\d{2}-\d{2}', valor):
        return valor[:10]
    # DD/MM/YYYY o D/M/YYYY (locale español, el más probable en este Sheet)
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', valor)
    if m:
        d, mo, y = m.groups()
        return f"{y}-{mo.zfill(2)}-{d.zfill(2)}"
    # "Date(2026,8,1)" — notación literal que a veces usa gviz para fechas
    m = re.match(r'^Date\((\d+),(\d+),(\d+)\)$', valor)
    if m:
        y, mo0, d = m.groups()
        return f"{y}-{str(int(mo0)+1).zfill(2)}-{d.zfill(2)}"
    return valor[:10]


def partir_lista(valor):
    return [s.strip() for s in (valor or '').split(',') if s.strip()]


def leer_destacados(valor):
    valor = (valor or '').strip()
    if not valor:
        return []
    try:
        datos = json.loads(valor)
        return datos if isinstance(datos, list) else []
    except (ValueError, TypeError):
        print(f"  ⚠ destacados con JSON inválido, se ignora: {valor[:80]}")
        return []


def es_no(valor):
    """Solo un 'no' explícito desactiva — misma regla que leerCampanas_()
    en Apps Script, para que celda vacía = activa por defecto (compatible
    con campañas creadas antes de que existiera esta columna)."""
    return (valor or '').strip().lower() == 'no'


def leer_campanas():
    """Lee la hoja 'Campañas' del Google Sheet exportada como CSV — mismo
    mecanismo gviz que usa generar_productos_json.py, sin necesitar
    credenciales (el Sheet ya está compartido para lectura por enlace)."""
    url = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
           f"/gviz/tq?tqx=out:csv&sheet=Campa%C3%B1as")
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    reader = csv.DictReader(io.StringIO(resp.text))
    raw_headers = reader.fieldnames or []
    print(f"  Campañas cabeceras: {raw_headers}")

    faltantes = [h for h in CABECERAS_ESPERADAS
                 if h.lower().strip().replace(' ', '_') not in
                 [rh.lower().strip().replace(' ', '_') for rh in raw_headers]]
    if faltantes:
        print(f"  ⚠ Columnas esperadas que no aparecen en la hoja: {faltantes} "
              "(probablemente Apps Script aún no se ha desplegado con la última "
              "versión — se exportarán vacías, no es un error fatal)")

    campanas = []
    for row in reader:
        clean = {k.strip().lower().replace(' ', '_'): (v or '').strip()
                 for k, v in row.items()}
        cid = clean.get('id', '').strip()
        if not cid:
            continue  # fila en blanco
        campanas.append({
            'id': cid,
            'nombre': clean.get('nombre', ''),
            'tipo': clean.get('tipo') or 'temporada',
            'origen': clean.get('origen') or 'manual',
            'colorSet': clean.get('color_set') or 'rojo_verde',
            'colorPersonalizado1': clean.get('color_personalizado_1', ''),
            'colorPersonalizado2': clean.get('color_personalizado_2', ''),
            'fechaInicio': normalizar_fecha_iso(clean.get('fecha_inicio', '')),
            'fechaFin': normalizar_fecha_iso(clean.get('fecha_fin', '')),
            'areas': partir_lista(clean.get('areas', '')),
            'productos': partir_lista(clean.get('productos', '')),
            'destacados': leer_destacados(clean.get('destacados', '')),
            'imagenFondo': clean.get('imagen_fondo', ''),
            'eslogan': clean.get('eslogan', ''),
            'activa': not es_no(clean.get('activa', '')),
            'fechaCreacion': clean.get('fecha_creacion', ''),
            'fechaActualizacion': clean.get('fecha_actualizacion', ''),
        })

    print(f"✓ {len(campanas)} campañas leídas")
    return campanas


def exportar_campanas_json(campanas):
    payload = {
        'generado': datetime.datetime.utcnow().isoformat() + 'Z',
        'total': len(campanas),
        'campanas': campanas,
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, 'campanas.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = os.path.getsize(out_path) // 1024
    print(f"  ✓ {len(campanas)} campañas exportadas → {out_path} ({size_kb} KB)")


def main():
    print("▶ Generando campanas.json para Escaparate OM...")
    campanas = leer_campanas()
    exportar_campanas_json(campanas)
    print("\n✓ Completado: campanas.json generado → data/")


if __name__ == '__main__':
    main()
