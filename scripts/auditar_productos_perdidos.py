#!/usr/bin/env python3
"""
Auditoría: compara TODAS las referencias activas (sin fecha_baja) de la
hoja Productos del Sheet contra lo que de verdad hay en data/productos.json,
para encontrar productos que se están "perdiendo" silenciosamente en la
exportación — el mismo tipo de caso real detectado el 10/09/2026 con la
referencia 3137370180333 (NINA RICCI EDT.50 ML.VAP.): registrada el
13/08/2026 (¡casi un mes antes!), sin fecha_baja, sin ningún filtro activo
en el Sheet (confirmado por Eloy) — así que NO fue un simple problema de
"todavía no le tocaba el cron horario", ni tampoco el filtro que ya se
sospechó y se descartó. Algo en el propio mecanismo de exportación CSV
(gviz) estuvo ignorando esa fila de forma persistente durante semanas,
hasta que Eloy regeneró la caché de Apps Script (que lee la hoja de forma
NATIVA, sin pasar por gviz) y el producto apareció de inmediato.

DIAGNÓSTICO PROFUNDO (--diagnostico-profundo, o pasando --buscar-referencia
sin más): compara el CSV EN BRUTO (antes de parsear) contra el resultado
de csv.DictReader, para detectar el tipo de anomalía real:
  - Si la referencia buscada NO aparece ni siquiera en el texto crudo del
    CSV → Google ni siquiera está incluyendo esa fila en la respuesta de
    gviz (causa ajena al parseo de Python; puede ser una particularidad
    de esa fila que gviz no sabe serializar — una celda con error de
    fórmula, un valor fuera de lo común, etc.).
  - Si aparece en el texto crudo PERO no como una fila propia al
    parsearla con csv.reader → hay un problema de estructura CSV (una
    comilla sin cerrar, un salto de línea sin escapar dentro de una
    celda...) que está fusionando o rompiendo esa fila con la anterior o
    la siguiente.
  - También se comprueban TODAS las filas por longitud inesperada
    (distinto número de columnas que la cabecera) — la señal más
    fiable de una fila mal formada en cualquier punto del CSV, no solo
    en la referencia que se esté buscando.

USO:
    export SHEET_ID="el-id-real-del-sheet"

    # Comparación general (como hasta ahora):
    python3 auditar_productos_perdidos.py --productos-json ../data/productos.json

    # Diagnóstico profundo de un caso concreto:
    python3 auditar_productos_perdidos.py --buscar-referencia 3137370180333

Ya se descartó que hubiera un filtro activo en la hoja "Productos" (Datos
→ Crear un filtro) — si en algún momento se sospecha de nuevo, revisar
también eso antes de asumir que la causa es más compleja.
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


def descargar_csv_crudo(sheet_id):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet=Productos"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.text


def leer_productos_del_sheet(texto_csv):
    reader = csv.DictReader(io.StringIO(texto_csv))
    productos = []
    for row in reader:
        clean = {k.strip().lower().replace(' ', '_'): (v or '').strip() for k, v in row.items()}
        productos.append(clean)
    return productos


def diagnostico_profundo(texto_csv, referencia_buscada):
    print(f'\n{"="*70}')
    print(f'DIAGNÓSTICO PROFUNDO para la referencia {referencia_buscada}')
    print(f'{"="*70}\n')

    en_texto_crudo = referencia_buscada in texto_csv
    print(f'¿Aparece literalmente en el CSV en bruto (antes de parsear)?  {en_texto_crudo}')
    if not en_texto_crudo:
        print('  → Google NO está incluyendo esta fila en absoluto en la respuesta de')
        print('    gviz. La causa está en cómo Google genera esa exportación para esta')
        print('    fila concreta (posible celda con error de fórmula, algún valor que')
        print('    gviz no sepa serializar, o alguna particularidad de esa fila/celda),')
        print('    no en cómo Python interpreta el CSV después.')
        return

    # Está en el texto crudo — comprobar si el PARSEO la reconoce como fila propia
    filas_dict = leer_productos_del_sheet(texto_csv)
    encontrada_tras_parsear = any(row.get('referencia', '') == referencia_buscada for row in filas_dict)
    print(f'¿Se reconoce como fila propia tras parsear con csv.DictReader?  {encontrada_tras_parsear}')

    if not encontrada_tras_parsear:
        print('  → Está en el texto, pero el parseo no la separa en su propia fila —')
        print('    típico de una comilla sin cerrar o un salto de línea sin escapar en')
        print('    alguna celda ANTERIOR, que hace que todo lo siguiente se lea como')
        print('    parte de la misma celda hasta la próxima comilla que cierre bien.')

    # Comprobar TODAS las filas por longitud de columnas inesperada — señal
    # fiable de una fila mal formada en cualquier punto del CSV.
    lector_crudo = csv.reader(io.StringIO(texto_csv))
    cabecera = next(lector_crudo, [])
    n_columnas_esperadas = len(cabecera)
    print(f'\nCabecera con {n_columnas_esperadas} columnas. Revisando longitud de cada fila...')
    anomalias = []
    for i, fila in enumerate(lector_crudo, start=2):  # fila 2 = primera fila de datos
        if len(fila) != n_columnas_esperadas:
            anomalias.append((i, len(fila), fila))

    if not anomalias:
        print('  ✓ Todas las filas tienen el número de columnas esperado — no hay')
        print('    ninguna fila estructuralmente rota en todo el CSV.')
    else:
        print(f'  ⚠ {len(anomalias)} fila(s) con número de columnas distinto al esperado:')
        for num_fila, n_cols, fila in anomalias[:10]:
            fragmento = (fila[0] if fila else '')[:60]
            print(f'     Fila {num_fila}: {n_cols} columnas (se esperaban {n_columnas_esperadas}) — empieza por: {fragmento!r}')
        if len(anomalias) > 10:
            print(f'     ... y {len(anomalias) - 10} más.')
    print(f'{"="*70}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sheet-id', default=os.environ.get('SHEET_ID', ''), help='ID del Google Sheet (o variable de entorno SHEET_ID)')
    ap.add_argument('--productos-json', default='../data/productos.json', help='Ruta al productos.json ya generado')
    ap.add_argument('--buscar-referencia', default=None, help='Referencia concreta a diagnosticar en profundidad (ver docstring)')
    args = ap.parse_args()

    if not args.sheet_id:
        raise SystemExit('Falta el SHEET_ID. Pásalo con --sheet-id o exporta la variable de entorno SHEET_ID.')

    print('Descargando la hoja Productos del Sheet (mismo mecanismo que el workflow real: gviz CSV)...')
    texto_csv = descargar_csv_crudo(args.sheet_id)
    filas_sheet = leer_productos_del_sheet(texto_csv)
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

    if args.buscar_referencia:
        diagnostico_profundo(texto_csv, args.buscar_referencia)
        return

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
        print('  1. Vuelve a comprobar si hay un filtro activo en el Sheet (ver aviso de arriba).')
        print('  2. Ejecuta este mismo script con --buscar-referencia <ref> para cada uno de')
        print('     estos productos, para un diagnóstico más preciso de la causa exacta.')
        print('  3. Tras corregir la causa, vuelve a disparar el workflow de GitHub Actions')
        print('     "Generar productos.json" para regenerar el catálogo.')
    print(f'{"="*70}')


if __name__ == '__main__':
    main()
