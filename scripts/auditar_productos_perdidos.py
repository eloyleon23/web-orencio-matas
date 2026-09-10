#!/usr/bin/env python3
"""
Auditoría: compara TODAS las referencias activas (sin fecha_baja) de la
hoja Productos del Sheet contra lo que de verdad hay en data/productos.json,
para encontrar productos que se están "perdiendo" silenciosamente en la
exportación — el mismo tipo de caso real detectado el 10/09/2026 con la
referencia 3137370180333 (NINA RICCI EDT.50 ML.VAP.): sin fecha_baja, con
todos los datos aparentemente correctos en el Sheet, pero ausente del
catálogo web.

CAUSA MÁS PROBABLE (ya documentada como problema conocido de este
proyecto): generar_productos_json.py lee el Sheet a través de la
exportación pública en CSV (gviz/tq?tqx=out:csv) — este mecanismo exporta
SOLO LAS FILAS VISIBLES cuando hay un FILTRO NORMAL activo en la hoja
(Datos → Crear un filtro), a diferencia de una "vista de filtro" personal,
que no afecta a nadie más. Si alguien dejó un filtro así activo en la hoja
Productos (por ejemplo, filtrando temporalmente por área o por texto para
revisar algo), CUALQUIER fila que ese filtro oculte deja de exportarse
para TODO EL MUNDO, de forma completamente silenciosa — el producto sigue
"ahí" en el Sheet, perfecto a la vista, pero el robot que genera
productos.json nunca la ve.

Esta auditoría usa EXACTAMENTE el mismo mecanismo (gviz) que el workflow
real, a propósito: si hay un filtro activo, este script lo "sufre" igual
que el workflow, así que el PRIMER diagnóstico a mirar es el total de
filas leídas — si es notablemente menor que lo que Eloy ve contando filas
directamente en el propio Sheet, esa diferencia por sí sola ya apunta al
filtro como causa, sin hacer falta nada más.

USO:
    export SHEET_ID="el-id-real-del-sheet"
    python3 auditar_productos_perdidos.py --productos-json ../data/productos.json

Antes de ejecutar, comprueba manualmente en el Sheet real: en la hoja
"Productos", revisa si el icono de embudo de alguna cabecera de columna
aparece relleno/resaltado (filtro activo) en Datos → Crear un filtro (NO
en "Vistas de filtro", que son personales y no afectan a esta exportación).
"""
import argparse
import csv
import io
import json
import os
import sys

try:
    import requests
except ImportError:
    raise SystemExit("Falta requests. Instala con: pip install requests")


def leer_productos_del_sheet(sheet_id):
    """Misma lógica que leer_productos() en generar_productos_json.py —
    duplicada aquí a propósito (en vez de importarla) para que esta
    auditoría sea un script standalone, sin depender de que el otro
    archivo esté en el mismo directorio con ese nombre exacto."""
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet=Productos"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    reader = csv.DictReader(io.StringIO(resp.text))
    productos = []
    for row in reader:
        clean = {k.strip().lower().replace(' ', '_'): (v or '').strip() for k, v in row.items()}
        productos.append(clean)
    return productos


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sheet-id', default=os.environ.get('SHEET_ID', ''), help='ID del Google Sheet (o variable de entorno SHEET_ID)')
    ap.add_argument('--productos-json', default='../data/productos.json', help='Ruta al productos.json ya generado')
    args = ap.parse_args()

    if not args.sheet_id:
        raise SystemExit('Falta el SHEET_ID. Pásalo con --sheet-id o exporta la variable de entorno SHEET_ID.')

    print('Descargando la hoja Productos del Sheet (mismo mecanismo que el workflow real: gviz CSV)...')
    filas_sheet = leer_productos_del_sheet(args.sheet_id)
    print(f'  Total de filas leídas del Sheet: {len(filas_sheet)}')
    print('  ⚠ Si este número es notablemente MENOR que las filas que ves contando')
    print('    directamente en el Sheet real, hay un FILTRO ACTIVO ocultando filas —')
    print('    revisa Datos → Crear un filtro en la hoja "Productos" antes de seguir.\n')

    activos_sheet = {}
    de_baja_sheet = set()
    sin_referencia = 0
    for row in filas_sheet:
        ref = row.get('referencia', '').strip()
        if not ref:
            sin_referencia += 1
            continue
        if row.get('fecha_baja', '').strip():
            de_baja_sheet.add(ref)
            continue
        activos_sheet[ref] = row.get('nombre', '').strip()

    print(f'  Activos (sin fecha_baja, con referencia): {len(activos_sheet)}')
    print(f'  De baja: {len(de_baja_sheet)}')
    if sin_referencia:
        print(f'  ⚠ Filas sin referencia (ignoradas, revisar si es un error de datos): {sin_referencia}')

    with open(args.productos_json, encoding='utf-8') as f:
        datos_json = json.load(f)
    refs_json = {p['ref'] for p in datos_json.get('productos', datos_json)}
    print(f'\nTotal de productos en {args.productos_json}: {len(refs_json)}')

    perdidos = {ref: nombre for ref, nombre in activos_sheet.items() if ref not in refs_json}

    print(f'\n{"="*70}')
    if not perdidos:
        print('✓ Ninguna referencia activa del Sheet falta en productos.json — todo cuadra.')
    else:
        print(f'⚠ {len(perdidos)} producto(s) activo(s) en el Sheet que NO aparecen en productos.json:\n')
        for ref, nombre in sorted(perdidos.items()):
            print(f'  {ref}  —  {nombre}')
        print('\nPróximos pasos sugeridos:')
        print('  1. Comprueba si hay un filtro activo en el Sheet (ver aviso de arriba).')
        print('  2. Si no hay filtro, revisa manualmente 2-3 de estas filas en el Sheet:')
        print('     columnas con formato inesperado, saltos de línea ocultos en el nombre,')
        print('     o cualquier carácter especial que pudiera romper la fila al exportar a CSV.')
        print('  3. Tras corregir la causa, vuelve a disparar el workflow de GitHub Actions')
        print('     "Generar productos.json" para regenerar el catálogo.')
    print(f'{"="*70}')


if __name__ == '__main__':
    main()
