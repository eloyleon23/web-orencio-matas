#!/usr/bin/env python3
"""
Generador de productos.json para el buscador web de Orencio Matas y Hermanos, S.L.
Lee productos de Google Sheets y genera productos.json para el buscador.
"""

import os, json, sys, requests

# ── Configuración ───────────────────────────────────────────────────────────
SHEET_ID   = os.environ.get('SHEET_ID', '')
OUTPUT_DIR = 'data'
MAXIMO_HISTORICO_PATH = os.path.join(OUTPUT_DIR, 'productos_maximo_historico.json')
UMBRAL_MINIMO_ABSOLUTO = 50

# Incidente real (24-26/11/2026): este script lee el Sheet vía
# exportación CSV de Google (gviz), que puede devolver un resultado
# incompleto o casi vacío de forma transitoria (p. ej. mientras una
# sincronización del CRM está borrando e importando filas, o un fallo
# puntual de Google) — y, sin ninguna comprobación, lo escribía IGUAL
# en data/productos.json, el archivo que carga primero tanto la web
# pública como el área de clientes. Ese es el origen real de "solo
# aparecen 2 productos": no es un problema de Apps Script ni de la
# caché de Drive (que SÍ tenía esta protección, ver
# cacheProductosDemasiadoPequena_ en apps_script_trigger.js), sino que
# este script, el que de verdad genera el archivo público, no tenía
# ninguna. Mismo criterio aquí: se guarda aparte (en un archivo propio,
# no en el propio productos.json, para que no se pueda rebajar por
# accidente) el máximo de productos exportados hasta la fecha, y se
# compara siempre contra ESE máximo — nunca contra el resultado de la
# ejecución anterior — así un fallo parcial no puede convertirse en la
# nueva referencia para la siguiente vez ("efecto trinquete").
def leer_maximo_historico():
    try:
        with open(MAXIMO_HISTORICO_PATH, encoding='utf-8') as f:
            return int(json.load(f).get('maximo', 0))
    except Exception:
        return 0

def guardar_maximo_historico(valor):
    with open(MAXIMO_HISTORICO_PATH, 'w', encoding='utf-8') as f:
        json.dump({'maximo': valor}, f)

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
        # Los productos dados de baja (fecha_baja informada) se excluyen
        # del JSON — decisión revertida a propósito: se había cambiado
        # previamente a exportarlos igualmente (fecha_baja incluida en
        # cada producto) para poder ofrecer un filtro "Ver solo productos
        # dados de baja" en el buscador. Con cerca de la mitad del
        # catálogo dado de baja, eso duplicaba innecesariamente el peso
        # del JSON que se descarga en cada visita, sin ningún beneficio
        # para el usuario público. La gestión masiva de bajas/
        # reactivaciones ya no depende de poder verlas en el buscador —
        # vive en el panel de administración (baja/reactivación por
        # rango de fecha_alta) — así que se vuelve a excluirlas aquí.
        fecha_baja = p.get('fecha_baja', '').strip()
        if fecha_baja:
            continue

        # Productos deshabilitados a propósito de la web (columna
        # incluir_en_catalogo = "no") — distinto de la baja: el producto
        # sigue de alta y sincronizándose con normalidad desde el CRM,
        # solo que no queremos que se muestre nunca al público. Ver
        # procesarDeshabilitarProductoCatalogo_ en apps_script_trigger.js.
        #
        # BUG REAL ENCONTRADO Y CORREGIDO (26/11/2026): `p.get(clave, 'si')`
        # solo usa el valor por defecto 'si' cuando la CLAVE no existe en
        # absoluto en el diccionario — pero como estas filas vienen de un
        # CSV (csv.DictReader), la columna SIEMPRE existe como clave,
        # aunque la celda esté vacía (devuelve ''). Así que para
        # cualquier producto con esta celda en blanco, p.get(...) nunca
        # llegaba a devolver 'si': devolvía '', es_si('') daba False, y
        # el producto se excluía — justo lo contrario de lo pretendido
        # ("en blanco = incluido por defecto"). Mismo bug, más grave
        # todavía, en visible_usuario_normal un poco más abajo: esa
        # columna se añadió el 24/11/2026 y la inmensa mayoría del
        # catálogo la tiene en blanco — así que prácticamente todo el
        # catálogo se estaba excluyendo de data/productos.json desde esa
        # fecha (la causa real de "solo cargan 2 productos"). apps_script_
        # trigger.js no tiene este bug (usa su propia valorCelda_ con una
        # comparación explícita contra 'no', no contra el valor por
        # defecto de un .get()) — por eso el diagnóstico directo contra
        # el Sheet sí daba el número correcto.
        if (p.get('incluir_en_catalogo', '') or '').strip().lower() == 'no':
            continue

        # Visibilidad por perfil (columnas visible_usuario_normal/
        # visible_usuario_profesional — a petición de Eloy, 24/11/2026):
        # hay productos orientados solo a un perfil u otro. Este JSON
        # estático alimenta las páginas públicas de catálogo (sin perfil
        # profesional, ver catalogo-preview.js), así que aquí solo importa
        # la visibilidad "normal" — el perfil profesional se filtra en
        # vivo, en obtener_productos (apps_script_trigger.js), y en
        # generar_catalogos_mayor.py para el catálogo al por mayor.
        if (p.get('visible_usuario_normal', '') or '').strip().lower() == 'no':
            continue

        ref = p.get('referencia', '').strip()
        if not ref:
            continue

        img_id = p.get('imagen_drive_id', '').strip()
        if img_id == 'NO_TIENE_FOTO':
            img_id = ''

        precio_sin = p.get('precio_sin_iva', '').strip()
        precio_con = p.get('precio_con_iva', '').strip()
        # Precio de venta a MAYOR: deliberadamente NO se exporta a este
        # JSON (commiteado al repo público, servido tal cual por GitHub
        # Pages e IONOS) — a diferencia de precio_sin/precio_con, este es
        # exclusivo del perfil profesional (ver assets/js/perfil-
        # profesional.js y la auditoría de seguridad del perfil
        # profesional). Antes sí se incluía aquí y el navegador lo
        # borraba de memoria por su cuenta si no tocaba mostrarlo
        # (buscador.html, limpiarPrecioMayorSiProcede_), pero eso dejaba
        # el precio de mayor visible en la respuesta de red en bruto de
        # este mismo archivo para cualquiera. Ahora solo viaja desde la
        # acción en vivo "obtener_productos" de Apps Script, y solo
        # cuando la petición lleva un PIN profesional válido.

        # Productos relacionados / compra conjunta: columna "relacionados"
        # del Sheet, lista de referencias separadas por comas. Editable
        # directamente ahí — sin tocar código ni redesplegar nada, a
        # diferencia del sistema anterior de reglas fijas en JavaScript.
        relacionados_raw = p.get('relacionados', '').strip()
        relacionados = [r.strip() for r in relacionados_raw.split(',') if r.strip()] if relacionados_raw else []

        # Distingue "nunca tocado desde el gestor de relacionados" (el
        # buscador cae al respaldo de reglas fijas de JavaScript) de "un
        # humano ya decidió explícitamente los relacionados de este
        # producto, aunque sean cero" — sin esto, guardar una lista
        # vacía desde el gestor era indistinguible de "nunca gestionado"
        # y el respaldo (a veces equivocado) volvía a aparecer sin
        # forma de quitarlo desde la propia herramienta.
        relacionados_gestionado = es_si(p.get('relacionados_gestionado', ''))

        # Enlace directo a la ficha técnica del fabricante — columna
        # "ficha_url" del Sheet (ver procesarActualizarFichaUrl en
        # apps_script_trigger.js, que es quien la rellena desde el botón
        # "Editar ficha técnica" del buscador, solo en preproducción).
        # Cuando está informado tiene prioridad sobre cualquier ficha
        # técnica calculada/adivinada, tanto en buscador.html como en el
        # Centro de Soluciones.
        ficha_url = p.get('ficha_url', '').strip()

        # Agrupación (texto libre, p. ej. "MAQUINARIA") — columna "grupo"
        # del Sheet (ver procesarActualizarGrupoProducto en
        # apps_script_trigger.js). Solo tiene efecto visible en un
        # escaparate si esa campaña tiene activado el check "Agrupar
        # productos" del modal de asignación.
        grupo = p.get('grupo', '').strip()

        # Información adicional (texto enriquecido) — detalles técnicos,
        # limitaciones, venta por cajas/lotes... columna "info_adicional"
        # del Sheet (ver procesarActualizarInfoAdicional en
        # apps_script_trigger.js, que es quien la sanea antes de
        # guardarla — ya llega limpia aquí, nunca HTML arbitrario).
        info_adicional = p.get('info_adicional', '').strip()

        # Formato de envase ("12 unidades/caja") — columnas "envase_cantidad"
        # / "envase_unidad" / "envase_tipo" del Sheet (ver
        # procesarActualizarEnvaseProducto en apps_script_trigger.js).
        envase_cantidad = p.get('envase_cantidad', '').strip()
        envase_unidad = p.get('envase_unidad', '').strip()
        envase_tipo = p.get('envase_tipo', '').strip()

        # Marca/fabricante — columna "marca" del Sheet, ya existente
        # (antes de uso interno). Se exporta como "fabricante", el
        # nombre de campo que ya usa buscador.html para sus badges y
        # filtro de marca — ver apps_script_trigger.js.
        fabricante = p.get('marca', '').strip()

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
            'iva':       p.get('iva', '').strip(),
            'fecha':     p.get('fecha_registro', '').strip(),
            # Fecha de alta en el CRM (columna 'fecha_alta' del Sheet, fija
            # desde que se crea el producto, nunca se sobrescribe en
            # sincronizaciones posteriores) — a petición explícita de Eloy,
            # distinta de 'fecha' (fecha_registro, que sí se actualiza en
            # cada modificación). Usada solo por el filtro/ordenación de
            # "fecha de alta" del buscador.
            'fecha_alta': p.get('fecha_alta', '').strip(),
            'espacios':  p.get('espacios_a_ocupar', '1').strip() or '1',
            'imagen_validada': p.get('imagen_validada', '').strip(),
            'fecha_actualizacion_imagen': p.get('fecha_actualizacion_imagen', '').strip(),
            'relacionados': relacionados,
            'relacionados_gestionado': relacionados_gestionado,
            'ficha_url': ficha_url,
            'grupo': grupo,
            'info_adicional': info_adicional,
            'envase_cantidad': envase_cantidad,
            'envase_unidad': envase_unidad,
            'envase_tipo': envase_tipo,
            'fabricante': fabricante,
        })

    maximo_historico = leer_maximo_historico()
    sospechoso = len(exportados) < UMBRAL_MINIMO_ABSOLUTO or (
        maximo_historico > 0 and len(exportados) < maximo_historico * 0.5
    )
    if sospechoso:
        print(
            f"✗ ABORTADO: solo {len(exportados)} producto(s) leído(s) del Sheet "
            f"(máximo histórico conocido: {maximo_historico}). Esto indica una lectura "
            "incompleta/transitoria del Sheet, no una bajada real del catálogo — no se "
            "sobrescribe data/productos.json ni se sincroniza la caché de Drive. "
            "Se reintentará en la próxima ejecución programada."
        )
        sys.exit(1)

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

    if len(exportados) > maximo_historico:
        guardar_maximo_historico(len(exportados))

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
