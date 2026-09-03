#!/usr/bin/env python3
"""
Generador de catálogo comercial de talleres/carrocería (Fase 1 — prototipo).

Uso:
  # Periodo por argumentos sueltos (pensado para workflow_dispatch de GitHub Actions)
  python scripts/generar_catalogo_comercial.py --tipo mes --valor septiembre --anio 2026

  # Periodo + productos desde un único JSON (pensado para la Fase 2, Sheet → Apps Script)
  python scripts/generar_catalogo_comercial.py --payload entrada.json

Si no se indica --productos ni --payload, usa el set de prueba estático
de 22 productos reales (con imagen) en
data/catalogo_comercial_prueba/productos_prueba.json — pensado
exclusivamente para validar el motor de composición/renderizado antes
de conectar la Sheet real (ver punto 3 del encargo, Fase 1).

INPUT (periodo, productos)
  → validación (errores bloqueantes por producto / warnings)
  → cálculo de precios y ofertas (reglas_comerciales)
  → resolución de tema/campaña (campanas)
  → composición editorial (composicion)
  → renderizado PDF (render_pdf)
  → catalogos_output/catalogo_comercial_<slug>.pdf
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from catalogo_comercial.modelo import Periodo
from catalogo_comercial.validacion import validar_catalogo
from catalogo_comercial.reglas_comerciales import calcular_precios_catalogo
from catalogo_comercial.campanas import resolver_tema
from catalogo_comercial.composicion import componer
from catalogo_comercial.render_pdf import generar_pdf
from catalogo_comercial.layout_engine import generar_pdf_v3

RUTA_PROTOTIPO = os.path.join(os.path.dirname(__file__), '..', 'data',
                               'catalogo_comercial_prueba', 'productos_prueba.json')
CARPETA_IMAGENES_TALLERES = os.path.join(os.path.dirname(__file__), '..', 'assets', 'imagenes_talleres')
LOGO_SVG = os.path.join(os.path.dirname(__file__), '..', 'assets', 'logos', 'logo_calidad.svg')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'catalogos_output')


def preparar_logo():
    if not os.path.exists(LOGO_SVG):
        return None
    try:
        import cairosvg
        ruta = '/tmp/logo_catalogo_comercial.png'
        cairosvg.svg2png(url=LOGO_SVG, write_to=ruta, output_width=600)
        return ruta
    except ImportError:
        return None


def slug_periodo(periodo: Periodo) -> str:
    base = f"{periodo.tipo}_{periodo.valor}_{periodo.anio}"
    return base.lower().replace(' ', '_').replace('º', '')


def parse_args():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--tipo', choices=['mes', 'trimestre', 'campaña'], help="Tipo de periodo")
    ap.add_argument('--valor', help="Valor del periodo (ej. 'septiembre', 'Q4', 'navidad')")
    ap.add_argument('--anio', type=int, help="Año del periodo")
    ap.add_argument('--payload', help="JSON con {periodo:{...}, productos:[...]} (Fase 2)")
    ap.add_argument('--productos', help="JSON alternativo solo con la lista de productos")
    ap.add_argument('--carpeta-imagenes', default=CARPETA_IMAGENES_TALLERES)
    ap.add_argument('--salida', help="Ruta del PDF de salida")
    ap.add_argument('--motor', choices=['v2', 'v3'], default='v3',
                     help="v3 (por defecto): composición editorial nueva. v2: maqueta anterior de fichas, para comparar.")
    ap.add_argument('--cajas', action='store_true',
                     help="Solo con --motor v3: envuelve los productos en bloques de esquinas redondeadas (prueba de comparación).")
    return ap.parse_args()


def main():
    args = parse_args()

    productos_raw = None
    periodo = None

    if args.payload:
        with open(args.payload, 'r', encoding='utf-8') as f:
            payload = json.load(f)
        p = payload.get('periodo', {})
        periodo = Periodo(tipo=p.get('tipo', 'mes'), valor=p.get('valor', 'septiembre'),
                           anio=int(p.get('anio', 2026)))
        productos_raw = payload.get('productos')

    if periodo is None:
        periodo = Periodo(tipo=args.tipo or 'mes', valor=args.valor or 'septiembre',
                           anio=args.anio or 2026)

    if productos_raw is None and args.productos:
        with open(args.productos, 'r', encoding='utf-8') as f:
            productos_raw = json.load(f)

    modo_prueba = False
    if productos_raw is None:
        modo_prueba = True
        with open(RUTA_PROTOTIPO, 'r', encoding='utf-8') as f:
            productos_raw = json.load(f)['productos']
        print(f"⚡ Sin --productos/--payload: usando el set de PRUEBA estático "
              f"({len(productos_raw)} productos reales con imagen).")

    print(f"\n▶ Periodo: {periodo.etiqueta}  (tipo={periodo.tipo}, valor={periodo.valor})")

    # 1. Validación
    resultado = validar_catalogo(productos_raw, carpeta_imagenes=args.carpeta_imagenes)
    print(f"\n▶ Validación: {len(resultado.productos)} productos válidos, "
          f"{len(resultado.warnings)} avisos, {len(resultado.errores)} errores")
    for w in resultado.warnings:
        print(f"  ⚠ WARNING: {w}")
    for e in resultado.errores:
        print(f"  ✗ ERROR:   {e}")

    if not resultado.productos:
        print("\n✗ No hay productos válidos — no se genera ningún PDF.")
        sys.exit(1)

    # 2. Precios y ofertas
    calcular_precios_catalogo(resultado.productos)

    # 3. Tema de campaña
    tema = resolver_tema(periodo)
    print(f"\n▶ Tema aplicado: '{tema.id}' (color principal {tema.color_principal})")

    # 4. Composición editorial
    bloques = componer(resultado.productos)
    niveles = {}
    for p in resultado.productos:
        niveles[p.protagonismo] = niveles.get(p.protagonismo, 0) + 1
    print(f"▶ Familias: {len(bloques)} · Niveles de protagonismo: "
          f"{ {k: niveles[k] for k in sorted(niveles)} }")

    # 5. Render
    logo_png = preparar_logo()
    salida = args.salida or os.path.join(OUTPUT_DIR, f"catalogo_comercial_{slug_periodo(periodo)}.pdf")
    if args.motor == 'v3':
        info = generar_pdf_v3(periodo, tema, bloques, logo_png, salida, resultado, redondeado=args.cajas)
    else:
        info = generar_pdf(periodo, tema, bloques, logo_png, salida, resultado)

    print(f"\n✓ PDF generado: {salida}")
    print(f"  {info.get('paginas', '?')} páginas · {info.get('productos', 0)} productos")
    if modo_prueba:
        print("\n  ⚠ Recuerda: esto es un catálogo de PRUEBA con precios/ofertas de ejemplo "
              "sobre productos reales del catálogo Zaphiro/Besa — no enviar a clientes tal cual.")


if __name__ == '__main__':
    main()
