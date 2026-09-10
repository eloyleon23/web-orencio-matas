#!/usr/bin/env python3
"""
Genera sugerencias de productos relacionados ("compra conjunta") usando
la IA (Gemini), para revisar y validar antes de pegarlas en la columna
"relacionados" de la hoja Productos del Sheet.

Complementa a generar_sugerencias_relacionados.py (el de reglas fijas):
aquel es rápido, gratuito y cubre bien los patrones más obvios (12
reglas droguería, 8 perfumería, 1 pinturas); este cubre el resto del
catálogo con criterio de la IA, reutilizando EXACTAMENTE el mismo
mecanismo ya afinado y probado en el buscador web el 10/09/2026
(sugerencias "al vuelo" en la ficha de producto):
  - Candidatos reales del catálogo, muestreados por familia dentro de
    la misma área (nunca inventados por la IA).
  - Prompt con criterio "misma tarea concreta, no mismo tema" y el
    ejemplo real de error ya encontrado (césped artificial + abono).
  - Validación anti-alucinación: cada sugerencia se comprueba contra
    la lista real de candidatos antes de aceptarla.
  - Sin el bug de parseo ya corregido en Apps Script (quitar puntos
    finales rompía la comparación en casi todos los nombres reales del
    catálogo, que terminan en "L.", "ML.", "KG."...).

NO escribe nada directamente en el Sheet ni en productos.json — genera
un Excel de revisión, en el MISMO formato que la herramienta de
reglas, para poder mezclar ambos orígenes en la misma revisión.

Talleres queda EXCLUIDO a propósito, igual que ya hace la herramienta
de reglas — sugerir mal ahí podría significar mezclar productos de
sistemas químicos incompatibles (R-M, URKI-MIX, CAR, BASLAC...), algo
que no se puede juzgar con fiabilidad solo por el nombre del producto,
ni siquiera con IA, sin conocimiento experto real del sistema de
pintura de cada marca.

USO:
    export GEMINI_API_KEY="tu-clave-de-apps-script"
    pip install openpyxl requests

    # Prueba rápida con pocos productos primero (recomendado):
    python3 generar_sugerencias_relacionados_ia.py --entrada productos.json --limite 20

    # Ejecución completa (puede tardar VARIAS HORAS — miles de
    # productos, una llamada a la IA por cada uno). Se puede
    # interrumpir en cualquier momento (Ctrl+C) y reanudar más tarde
    # sin repetir lo ya hecho, gracias al checkpoint:
    python3 generar_sugerencias_relacionados_ia.py --entrada productos.json --salida sugerencias_ia.xlsx

Si se interrumpe, simplemente se vuelve a lanzar el mismo comando —
retoma donde se quedó leyendo checkpoint_relacionados_ia.json (se
puede cambiar la ruta con --checkpoint).
"""
import argparse
import json
import os
import random
import re
import time
import unicodedata
from collections import defaultdict

try:
    import requests
except ImportError:
    raise SystemExit("Falta requests. Instala con: pip install requests")

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
except ImportError:
    raise SystemExit("Falta openpyxl. Instala con: pip install openpyxl")

# Mismo modelo y configuración que usa Apps Script en producción — ver
# llamarGemini_() en scripts/apps_script_trigger.js. Si ese modelo
# cambia allí, cambiarlo también aquí para que las sugerencias sean
# consistentes con lo que ya ve el cliente en la web.
MODELO_GEMINI = 'gemini-3.5-flash-lite'
MAX_CANDIDATOS_POR_PRODUCTO = 30
MAX_SUGERENCIAS_POR_PRODUCTO = 4
AREAS_CUBIERTAS = {'drogueria', 'perfumeria', 'pinturas'}  # Talleres excluido a propósito, ver docstring


def sin_acentos_mayus(texto):
    if not texto:
        return ''
    nfkd = unicodedata.normalize('NFKD', texto)
    return ''.join(c for c in nfkd if not unicodedata.combining(c)).upper()


def cargar_checkpoint(ruta):
    if not os.path.exists(ruta):
        return {}
    with open(ruta, encoding='utf-8') as f:
        return json.load(f)


def guardar_checkpoint(ruta, datos):
    # Escritura atómica (archivo temporal + rename) para no dejar el
    # checkpoint corrupto a medio escribir si el proceso se interrumpe
    # justo en ese instante.
    tmp = ruta + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False)
    os.replace(tmp, ruta)


def calcular_candidatos(producto, por_area_menos_familia, rng):
    """Mismo criterio que calcularCandidatosComplementarios() en
    buscador.html: muestreo ESTRATIFICADO por familia (dentro de la
    misma área, excluyendo la familia propia — eso serían variantes del
    mismo producto, no un complemento), tomando por turnos de familias
    distintas para no sobrerrepresentar a las más grandes."""
    area = producto.get('area', '')
    familia_propia = producto.get('familia', '')
    ref_propia = producto.get('ref', '')

    por_familia = por_area_menos_familia.get(area, {})
    familias = [f for f in por_familia.keys() if f != familia_propia]
    rng.shuffle(familias)
    for f in familias:
        rng.shuffle(por_familia[f])

    candidatos = []
    indice = 0
    while len(candidatos) < MAX_CANDIDATOS_POR_PRODUCTO and any(len(por_familia[f]) > indice for f in familias):
        for f in familias:
            if len(candidatos) >= MAX_CANDIDATOS_POR_PRODUCTO:
                break
            lista = por_familia[f]
            if indice < len(lista) and lista[indice].get('ref') != ref_propia:
                candidatos.append(lista[indice])
        indice += 1
    return candidatos


def detalle_familia(item):
    familia = item.get('familia') or 'sin familia conocida'
    sub = item.get('subfamilia')
    if sub and sub != 'General':
        return f'{familia} > {sub}'
    return familia


def construir_prompt(producto, candidatos, maximo):
    """Mismo prompt EXACTO (con el mismo criterio y el mismo ejemplo
    anti-patrón) que procesarSugerirComplementariosIA() en
    scripts/apps_script_trigger.js — para que las sugerencias en lote
    sean consistentes con las que ya ve el cliente al pedir "Ver
    sugerencias con IA" en la propia ficha del producto."""
    lista_candidatos = '\n'.join(
        f"{c.get('nombre', '')}  [familia real del catálogo: {detalle_familia(c)}]" for c in candidatos
    )
    detalle_producto = detalle_familia(producto)
    nombre_producto = producto.get('nombre', '')

    return (
        'Eres un dependiente experto de Orencio Matas y Hermanos, una tienda de droguería, '
        'perfumería, pinturas y suministros para talleres y carrocerías.\n'
        f'Un cliente está viendo la ficha de este producto:\n"{nombre_producto}" (familia real del catálogo: {detalle_producto})\n\n'
        'Estos son productos REALES de nuestro catálogo, de varias familias distintas dentro de la misma área — pueden no tener ninguna relación real con el producto principal. Junto a cada uno se indica SU PROPIA familia (y subfamilia si la tiene) dentro del catálogo — úsala como pista principal para juzgar si encaja de verdad, no te fijes solo en el nombre (cópialos EXACTAMENTE tal cual aparecen ANTES del corchete, letra por letra, si los eliges — el corchete "[familia real del catálogo: ...]" es solo información para ti, nunca forma parte del nombre del producto):\n'
        f'{lista_candidatos}\n\n'
        f'Elige hasta {maximo} de esos candidatos (pueden ser menos, o ninguno) que un cliente compraría de verdad JUNTO CON el producto principal para la MISMA tarea o actividad concreta — no basta con que "sean del mismo tema" o "sirvan para el mismo sitio en general" (jardín, baño, coche...), tienen que servir literalmente para el mismo trabajo. Piensa en herramientas de aplicación del propio producto, algo del paso justo anterior o posterior del mismo proceso, protección para usarlo, o limpieza de lo empleado — nunca un producto que solo comparta ámbito o ubicación de forma genérica.\n\n'
        'EJEMPLO REAL DE ERROR A EVITAR: para un abono líquido de jardín, NO seleccionar césped artificial ni sus accesorios (cinta de unión, adhesivo, cortador) — el césped artificial no se abona, por muy "de jardín" que suenen ambos. Sería un acierto, en cambio, un producto de riego o un fertilizante complementario para plantas reales.\n\n'
        'NUNCA elijas el mismo producto, ni una variante de él (mismo tipo de producto en otro color/tamaño/formato) — eso no es un complemento, es el mismo producto. Ante la duda, es mucho mejor no elegir ninguno que forzar una relación dudosa — un acierto real vale más que cuatro sugerencias de relleno.\n\n'
        f'Responde EXACTAMENTE con este formato, una línea por cada producto elegido, copiando SOLO el nombre del producto (nunca el corchete de familia) TAL CUAL aparece arriba, sin numerar, sin nada más:\n'
        'PRODUCTO: nombre exacto del candidato 1\n'
        'PRODUCTO: nombre exacto del candidato 2\n'
        f'(y así hasta un máximo de {maximo} líneas — si no eliges ninguno, no escribas ninguna línea PRODUCTO)'
    )


def llamar_gemini(prompt, api_key, max_output_tokens=200, intentos_maximos=3):
    """Mismo endpoint/payload/safety settings que llamarGemini_() en
    Apps Script. Reintentos con backoff ante 429 (límite de peticiones
    por minuto) y 503 (sobrecarga temporal) — a diferencia de Apps
    Script (que solo reintenta una vez, pensado para una sola petición
    de usuario), aquí hacen falta más intentos y más paciencia: se van
    a hacer miles de peticiones seguidas."""
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{MODELO_GEMINI}:generateContent?key={api_key}'
    payload = {
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'temperature': 0.2, 'maxOutputTokens': max_output_tokens},
        'safetySettings': [
            {'category': 'HARM_CATEGORY_HARASSMENT', 'threshold': 'BLOCK_ONLY_HIGH'},
            {'category': 'HARM_CATEGORY_HATE_SPEECH', 'threshold': 'BLOCK_ONLY_HIGH'},
            {'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold': 'BLOCK_ONLY_HIGH'},
            {'category': 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold': 'BLOCK_ONLY_HIGH'},
        ],
    }

    espera = 2
    for intento in range(1, intentos_maximos + 1):
        try:
            resp = requests.post(url, json=payload, timeout=30)
        except requests.RequestException as exc:
            if intento == intentos_maximos:
                return {'ok': False, 'error': str(exc)}
            time.sleep(espera)
            espera *= 2
            continue

        if resp.status_code == 200:
            datos = resp.json()
            candidatos_resp = datos.get('candidates') or []
            if not candidatos_resp:
                # Bloqueo de seguridad u otra causa sin candidatos — no
                # es un error de red, no tiene sentido reintentar igual.
                return {'ok': True, 'texto': '', 'bloqueado': True, 'promptFeedback': datos.get('promptFeedback')}
            texto = (((candidatos_resp[0] or {}).get('content') or {}).get('parts') or [{}])[0].get('text', '')
            return {'ok': True, 'texto': texto, 'bloqueado': False}

        if resp.status_code in (429, 503) and intento < intentos_maximos:
            time.sleep(espera)
            espera *= 2
            continue

        return {'ok': False, 'error': f'HTTP {resp.status_code}: {resp.text[:300]}'}

    return {'ok': False, 'error': 'Reintentos agotados'}


def parsear_sugerencias(texto, candidatos):
    """Misma lógica de parseo YA CORREGIDA que en Apps Script: solo se
    quitan comillas sueltas al principio/final, NUNCA puntos — casi
    todos los nombres reales de este catálogo terminan en punto de
    forma legítima ("1 L.", "500 ML."...). Quitarlo rompía la
    comparación exacta contra los candidatos (bug real corregido el
    10/09/2026)."""
    nombres_candidatos = {c.get('nombre', '') for c in candidatos}
    elegidos = []
    for linea in texto.split('\n'):
        l = linea.strip()
        if not re.match(r'^PRODUCTO:', l, re.IGNORECASE):
            continue
        nombre = re.sub(r'^PRODUCTO:', '', l, flags=re.IGNORECASE).strip()
        nombre = re.sub(r'^["\']+|["\']+$', '', nombre)
        if nombre:
            elegidos.append(nombre)
    # Nunca se confía a ciegas en lo que devuelve la IA.
    return [n for n in elegidos if n in nombres_candidatos][:MAX_SUGERENCIAS_POR_PRODUCTO]


def construir_indice_por_area_familia(productos):
    """{area: {familia: [productos...]}} — solo productos activos (sin
    fecha_baja), de las áreas cubiertas. Es la base para el muestreo de
    candidatos de cada producto a procesar."""
    indice = defaultdict(lambda: defaultdict(list))
    for p in productos:
        if p.get('fecha_baja'):
            continue
        area = p.get('area', '')
        if area not in AREAS_CUBIERTAS:
            continue
        indice[area][p.get('familia', '')].append(p)
    return indice


def productos_a_procesar(productos):
    """Mismo criterio que el buscador web: sin fecha_baja, sin
    relacionados YA informado, y sin relacionados_gestionado (si
    alguien ya decidió a propósito que este producto no lleva ninguno,
    esa decisión se respeta y no se vuelve a sugerir encima)."""
    return [
        p for p in productos
        if not p.get('fecha_baja')
        and not p.get('relacionados')
        and not p.get('relacionados_gestionado')
        and p.get('area', '') in AREAS_CUBIERTAS
    ]


def exportar_excel(filas, ruta_salida):
    """MISMO formato que generar_sugerencias_relacionados.py (el de
    reglas), para poder mezclar ambos orígenes en la misma revisión del
    Sheet — la columna 'regla' vale 'ia' aquí, para distinguirlas de un
    vistazo si se combinan los dos Excel."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Sugerencias IA'

    cabeceras = ['referencia', 'relacionados_sugeridos', 'relacionados_nombres', 'regla']
    ws.append(cabeceras)
    for cell in ws[1]:
        cell.font = Font(bold=True, color='FFFFFF')
        cell.fill = PatternFill('solid', fgColor='1A1A1A')
        cell.alignment = Alignment(horizontal='center')

    for fila in filas:
        ws.append([fila['referencia'], fila['relacionados_sugeridos'], fila['relacionados_nombres'], 'ia'])

    anchos = [16, 26, 46, 10]
    for i, ancho in enumerate(anchos, start=1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = ancho

    ws.freeze_panes = 'A2'
    wb.save(ruta_salida)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--entrada', default='productos.json', help='Ruta al productos.json de entrada')
    ap.add_argument('--salida', default='sugerencias_relacionados_ia.xlsx', help='Ruta del Excel de salida')
    ap.add_argument('--checkpoint', default='checkpoint_relacionados_ia.json', help='Progreso guardado, para poder reanudar')
    ap.add_argument('--limite', type=int, default=None, help='Procesar solo los N primeros productos (para pruebas rápidas)')
    ap.add_argument('--pausa', type=float, default=1.2, help='Segundos de pausa entre peticiones a la IA')
    ap.add_argument('--api-key', default=os.environ.get('GEMINI_API_KEY'), help='Clave de la API de Gemini (o variable de entorno GEMINI_API_KEY)')
    ap.add_argument('--semilla', type=int, default=42, help='Semilla del muestreo aleatorio de candidatos, para resultados reproducibles')
    args = ap.parse_args()

    if not args.api_key:
        raise SystemExit(
            'Falta la clave de la API de Gemini. Pásala con --api-key o exporta GEMINI_API_KEY '
            '(la misma clave que ya usa Apps Script — ver GEMINI_API_KEY en scripts/apps_script_trigger.js).'
        )

    with open(args.entrada, encoding='utf-8') as f:
        datos = json.load(f)
    productos = datos.get('productos', datos)
    print(f'Cargados {len(productos)} productos de {args.entrada}')

    indice = construir_indice_por_area_familia(productos)
    pendientes = productos_a_procesar(productos)
    if args.limite:
        pendientes = pendientes[:args.limite]
    print(f'Productos a procesar (sin relacionados, áreas droguería/perfumería/pinturas): {len(pendientes)}')

    progreso = cargar_checkpoint(args.checkpoint)
    ya_procesados = set(progreso.get('procesados', {}).keys())
    if ya_procesados:
        print(f'Checkpoint encontrado: {len(ya_procesados)} productos ya procesados en una ejecución anterior — se retoma desde ahí.')

    rng = random.Random(args.semilla)
    resultados = dict(progreso.get('procesados', {}))  # ref -> {nombre, sugeridos: [{ref, nombre}], sin_sugerencia: bool}
    sin_candidatos = 0
    bloqueados = 0
    errores = 0

    restantes = [p for p in pendientes if p.get('ref') not in ya_procesados]
    print(f'Quedan {len(restantes)} por procesar en esta ejecución.\n')

    try:
        for i, producto in enumerate(restantes, start=1):
            ref = producto.get('ref', '')
            candidatos = calcular_candidatos(producto, indice, rng)
            if not candidatos:
                sin_candidatos += 1
                resultados[ref] = {'nombre': producto.get('nombre', ''), 'sugeridos': []}
            else:
                r = llamar_gemini(construir_prompt(producto, candidatos, MAX_SUGERENCIAS_POR_PRODUCTO), args.api_key)
                if not r.get('ok'):
                    errores += 1
                    print(f'  [{i}/{len(restantes)}] ERROR en {ref} ({producto.get("nombre","")[:40]}): {r.get("error")}')
                    # No se marca como procesado -- se reintentará en la
                    # próxima ejecución si se relanza el script.
                    continue
                if r.get('bloqueado'):
                    bloqueados += 1
                    resultados[ref] = {'nombre': producto.get('nombre', ''), 'sugeridos': []}
                else:
                    elegidos = parsear_sugerencias(r['texto'], candidatos)
                    por_nombre = {c['nombre']: c for c in candidatos}
                    sugeridos = [{'ref': por_nombre[n]['ref'], 'nombre': n} for n in elegidos if n in por_nombre]
                    resultados[ref] = {'nombre': producto.get('nombre', ''), 'sugeridos': sugeridos}

            if i % 20 == 0 or i == len(restantes):
                progreso['procesados'] = resultados
                guardar_checkpoint(args.checkpoint, progreso)
                print(f'  [{i}/{len(restantes)}] progreso guardado ({len(resultados)} productos en total, {sin_candidatos} sin candidatos, {bloqueados} bloqueados, {errores} con error)')

            time.sleep(args.pausa)

    except KeyboardInterrupt:
        print('\nInterrumpido por el usuario — guardando progreso antes de salir...')
        progreso['procesados'] = resultados
        guardar_checkpoint(args.checkpoint, progreso)
        print(f'Progreso guardado en {args.checkpoint}. Vuelve a lanzar el mismo comando para continuar donde lo dejaste.')
        return

    progreso['procesados'] = resultados
    guardar_checkpoint(args.checkpoint, progreso)

    filas = []
    for ref, info in resultados.items():
        if not info['sugeridos']:
            continue
        filas.append({
            'referencia': ref,
            'relacionados_sugeridos': ','.join(s['ref'] for s in info['sugeridos']),
            'relacionados_nombres': ' | '.join(s['nombre'] for s in info['sugeridos']),
        })

    print(f'\nProcesados en total: {len(resultados)}')
    print(f'Con al menos una sugerencia: {len(filas)}')
    print(f'Sin candidatos disponibles: {sin_candidatos}')
    print(f'Bloqueados por seguridad (sin sugerencia): {bloqueados}')
    if errores:
        print(f'Con error de red (pendientes de reintentar en la próxima ejecución): {errores}')

    exportar_excel(filas, args.salida)
    print(f'\n✓ Excel generado: {args.salida}')
    print('''
  Cómo traer esto a una columna nueva en el propio Sheet (mismo
  procedimiento que la herramienta de reglas — se pueden pegar ambos
  Excel en la misma pestaña, uno debajo del otro):

  1. Pega el contenido de este Excel en una pestaña NUEVA y TEMPORAL del
     Sheet, llamada exactamente "Sugerencias_Temp" (Insertar → Hoja),
     incluyendo la fila de cabeceras.
  2. Menú "📦 Catálogos Orencio Matas" → "🔗 Importar sugerencias de
     relacionados" — crea (o reutiliza) una columna
     "relacionados_sugeridos" en Productos y la rellena emparejando por
     referencia, automáticamente.
  3. Revisa fila a fila: la columna nueva queda justo en Productos,
     comparable directamente con la columna "relacionados" ya existente
     en la misma fila. La columna "regla" en el Excel dice "ia" para
     que sepas qué sugerencias vienen de aquí si mezclas con las de
     generar_sugerencias_relacionados.py.
  4. Para lo que apruebes, copia el valor de "relacionados_sugeridos"
     (como VALOR, no fórmula) a la columna "relacionados" — recuerda
     escribir SIEMPRE con espacio tras la coma ("ref1, ref2"), nunca
     sin él: Google Sheets con configuración regional española
     interpreta una lista sin espacios como un número decimal.
  5. Cuando termines, puedes borrar la columna "relacionados_sugeridos",
     la pestaña "Sugerencias_Temp", y el archivo de checkpoint
     (''' + args.checkpoint + ''') — ya no hacen falta.
''')


if __name__ == '__main__':
    main()
