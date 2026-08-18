#!/usr/bin/env python3
"""
Generador de productos.json para el buscador web de Orencio Matas y Hermanos, S.L.
Lee productos de Google Sheets y genera productos.json para el buscador.
"""

import os, json, requests

# ── Configuración ───────────────────────────────────────────────────────────
SHEET_ID   = os.environ.get('SHEET_ID', '')
OUTPUT_DIR = 'data'

# ── Leer familias del Sheet ─────────────────────────────────────────────────
def leer_familias():
    """Lee la hoja 'FamiliasProductos' y devuelve un dict {familia: orden}."""
    url = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
           f"/gviz/tq?tqx=out:csv&sheet=FamiliaProductos")
    try:
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        import csv, io as sio
        reader = csv.DictReader(sio.StringIO(resp.text))
        # Normalizar cabeceras
        raw_headers = reader.fieldnames or []
        print(f"  FamiliasProductos cabeceras: {raw_headers}")
        familias = {}
        for row in reader:
            # Buscar columnas de forma flexible (case-insensitive)
            clean = {k.strip().lower(): v.strip() for k, v in row.items()}
            familia = (clean.get('familia') or clean.get('family') or '').strip().upper()
            orden_raw = (clean.get('orden') or clean.get('order') or '999').strip()
            try:
                orden = int(float(orden_raw))
            except:
                orden = 999
            if familia:
                familias[familia] = orden
        print(f"✓ {len(familias)} familias leídas")
        return familias
    except Exception as e:
        print(f"⚠ No se pudo leer FamiliasProductos: {e}")
        return {}

# ── Leer subfamilias del Sheet ─────────────────────────────────────────────────
def leer_subfamilias():
    """Lee la hoja 'SubfamiliaProductos' y devuelve un dict {(familia, subfamilia): orden}."""
    url = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
           f"/gviz/tq?tqx=out:csv&sheet=SubfamiliaProductos")
    try:
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        import csv, io as sio
        reader = csv.DictReader(sio.StringIO(resp.text))
        raw_headers = reader.fieldnames or []
        print(f"  SubfamiliaProductos cabeceras: {raw_headers}")
        subfamilias = {}
        for row in reader:
            # Buscar columnas de forma flexible (case-insensitive)
            clean = {k.strip().lower(): v.strip() for k, v in row.items()}
            familia = (clean.get('familia') or clean.get('family') or '').strip().upper()
            subfamilia = (clean.get('subfamilia') or clean.get('subcategory') or '').strip()
            orden_raw = (clean.get('orden') or clean.get('order') or '999').strip()
            try:
                orden = int(float(orden_raw))
            except:
                orden = 999
            if familia and subfamilia:
                subfamilias[(familia, subfamilia)] = orden
        print(f"✓ {len(subfamilias)} subfamilias leídas")
        return subfamilias
    except Exception as e:
        print(f"⚠ No se pudo leer SubfamiliaProductos: {e}")
        return {}

# ── Leer productos del Sheet ────────────────────────────────────────────────
def leer_productos():
    """Lee la hoja 'Productos' del Google Sheet exportada como CSV."""
    url = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
           f"/gviz/tq?tqx=out:csv&sheet=Productos")
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    import csv, io as sio
    reader = csv.DictReader(sio.StringIO(resp.text))
    # Normalizar cabeceras
    raw_headers = reader.fieldnames or []
    print(f"  Productos cabeceras: {raw_headers}")

    productos = []
    for row in reader:
        # Normalizar claves: minúsculas, sin espacios extra, espacios reemplazados por guiones
        clean = {k.strip().lower().replace(' ', '_'): v.strip() for k, v in row.items()}
        productos.append(clean)

    print(f"✓ {len(productos)} productos leídos")
    return productos

# ── Exportar productos.json ──────────────────────────────────────────────────
def exportar_productos_json(productos, familias, subfamilias):
    """Genera un JSON ligero con los productos visibles en catálogo, para el buscador web."""
    print("\n▶ Exportando productos.json para el buscador...")

    def es_si(val):
        return str(val).strip().lower() in ('sí', 'si', 'yes', 'true', '1', '✓')

    # Generar subfamilias_por_familia: {familia: {subfamilia: orden}}
    subfamilias_por_familia = {}
    for (familia, subfamilia), orden in subfamilias.items():
        if familia not in subfamilias_por_familia:
            subfamilias_por_familia[familia] = {}
        subfamilias_por_familia[familia][subfamilia] = orden

    exportados = []
    for p in productos:
        # IMPORTANTE: ya NO se excluyen aquí los productos dados de baja.
        # Antes se hacía "continue" y desaparecían del todo del JSON, lo que
        # hacía imposible ofrecer un filtro para verlos en el buscador — el
        # dato nunca llegaba al navegador. Ahora se exportan igual que el
        # resto, con su fecha_baja informada, y es buscador.html quien
        # decide ocultarlos por defecto (salvo que se active el filtro "Ver
        # solo productos dados de baja").
        fecha_baja = p.get('fecha_baja', '').strip()

        ref = p.get('referencia', '').strip()
        if not ref:
            continue

        img_id = p.get('imagen_drive_id', '').strip()
        if img_id == 'NO_TIENE_FOTO':
            img_id = ''

        precio_sin = p.get('precio_sin_iva', '').strip()
        precio_con = p.get('precio_con_iva', '').strip()

        # Productos relacionados / compra conjunta: columna "relacionados"
        # del Sheet, lista de referencias separadas por comas. Editable
        # directamente ahí — sin tocar código ni redesplegar nada, a
        # diferencia del sistema anterior de reglas fijas en JavaScript.
        relacionados_raw = p.get('relacionados', '').strip()
        relacionados = [r.strip() for r in relacionados_raw.split(',') if r.strip()] if relacionados_raw else []

        exportados.append({
            'ref':       ref,
            'nombre':    p.get('nombre', '').strip(),
            'area':      p.get('area', '').strip().lower(),
            'familia':   p.get('tipologia', '').strip(),
            'subfamilia': p.get('subfamilia', '').strip(),
            'img':       img_id,
            'oferta':    es_si(p.get('oferta', '')),
            'mostrar_precio': es_si(p.get('mostrar_precio', '')),
            'precio_sin': precio_sin,
            'precio_con': precio_con,
            'fecha':     p.get('fecha_registro', '').strip(),
            'espacios':  p.get('espacios_a_ocupar', '1').strip() or '1',
            'imagen_validada': p.get('imagen_validada', '').strip(),
            'fecha_actualizacion_imagen': p.get('fecha_actualizacion_imagen', '').strip(),
            'fecha_baja': fecha_baja,
            'relacionados': relacionados,
        })

    payload = {
        'generado': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'total': len(exportados),
        'familias_orden': familias,  # {familia: orden}
        'subfamilias_orden': subfamilias_por_familia,  # {familia: {subfamilia: orden}}
        'productos': exportados,
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, 'productos.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = os.path.getsize(out_path) // 1024
    print(f"  ✓ {len(exportados)} productos exportados → {out_path} ({size_kb} KB)")

    # Generar archivo de versión para cache-busting en el frontend
    version_path = os.path.join(OUTPUT_DIR, 'productos_version.json')
    version_payload = {
        'version': payload['generado'],
        'timestamp': int(__import__('time').time())
    }
    with open(version_path, 'w', encoding='utf-8') as f:
        json.dump(version_payload, f, ensure_ascii=False, separators=(',', ':'))
    print(f"  ✓ Versión generada → {version_path}")

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("▶ Generando productos.json para el buscador web...")
    
    productos = leer_productos()
    familias  = leer_familias()
    subfamilias = leer_subfamilias()
    
    exportar_productos_json(productos, familias, subfamilias)
    
    print("\n✓ Completado: productos.json generado → data/")

if __name__ == '__main__':
    main()
