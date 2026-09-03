"""
Motor de layout editorial V3 — catálogo comercial de talleres.

Sustituye por completo la maqueta "ficha de producto repetida" de v1/v2
(ver `render_pdf.py`, que se mantiene intacto para comparación) por una
composición editorial de folleto comercial B2B: patrones de layout
dependientes del nivel de protagonismo (1-5), identidad corporativa
clara (blanco/gris claro + antracita + turquesa + rojo + amarillo, ver
`campanas.Tema`), y menos "caja dentro de caja".

Cambio arquitectónico deliberado respecto a v1/v2: la página deja de
ser un sistema de DOS COLUMNAS que hay que balancear entre sí (la
fuente de casi todos los dolores de cabeza de alineación de la v1) y
pasa a ser un flujo A COLUMNA ÚNICA a todo el ancho, con patrones de
layout que internamente pueden partirse en 2-3 columnas cuando aporta
algo (p.ej. imagen grande + ficha al lado). ReportLab pagina ese flujo
de forma automática — ya no hace falta ningún algoritmo de reparto ni
"estirado" para llegar al final de página.

Reutiliza sin tocar: modelo.py, reglas_comerciales.py, composicion.py,
imagenes.py — la separación DATOS/REGLAS/CAMPAÑA de esas capas ya
encaja con lo que pide el punto 22 del brief V3, no había que romper
nada ahí.
"""
from __future__ import annotations

import io
import os
from decimal import Decimal

from PIL import Image as PILImage, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, FrameBreak,
                                 NextPageTemplate, Paragraph, Spacer, Table, TableStyle,
                                 Image as RLImage, KeepTogether, Flowable)

from .composicion import ElementoGrid
from .imagenes import imagen_para_producto, pil_to_bytes, preparar_para_incrustar
from .render_pdf import CajaRedondeada

W, H = A4
MARGIN = 14 * mm
CW = W - 2 * MARGIN
TOP_BAR_H = 22 * mm
BOTTOM_BAR_H = 16 * mm
FRAME_TOP = H - TOP_BAR_H - 2 * mm
FRAME_BOTTOM = BOTTOM_BAR_H + 2 * mm

# Interruptor de la variante "bloques redondeados" (prueba a petición
# de Eloy, para comparar contra la composición sin cajas del brief) —
# lo activa `generar_pdf_v3(..., redondeado=True)`. Vive en un dict a
# nivel de módulo (no como parámetro en cada función de layout) para no
# tener que ensuciar la firma de toda la cadena de llamadas por una
# prueba puntual.
_config = {'redondeado': False}


def _quizas_redondear(contenido, ancho, tema, color_borde=None, radio=6, relleno=None):
    """Si la variante de bloques redondeados está activa, envuelve el
    contenido (una lista de flowables, o ya una Table) en una caja con
    esquinas redondeadas — si no, lo devuelve tal cual."""
    if not _config['redondeado']:
        return contenido
    if isinstance(contenido, list):
        t = Table([[contenido]], colWidths=[ancho])
        t.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        contenido = t
    color = color_borde or _c(tema.color_identidad)
    return CajaRedondeada(contenido, color, radio=radio, grosor=1, relleno=relleno)

RUTA_MAPA_REAL = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                               'assets', 'mapa', 'ubicacion_orencio_matas.png')
MARCADOR_FX, MARCADOR_FY = 0.526, 0.429


def _c(hexcolor: str):
    return colors.HexColor(hexcolor)


def _fmt(d) -> str:
    if d is None:
        return '0,00'
    return f'{Decimal(d):.2f}'.replace('.', ',')


# ── Componentes base reutilizados por todos los patrones de layout ──────
def chip(texto, bg, fg, fontsize=8.5, padding=3.6, bold=True, ancho=None):
    """Una "píldora" de color — bloque OFERTA/DESTACADO/RECOMENDADO,
    badge de descuento, etc. Nunca texto rojo suelto encima de una
    imagen: siempre un bloque de color con intención gráfica propia."""
    estilo = ParagraphStyle('chip', fontName='Helvetica-Bold' if bold else 'Helvetica',
                             fontSize=fontsize, textColor=fg, alignment=TA_CENTER, leading=fontsize + 1)
    t = Table([[Paragraph(texto, estilo)]], colWidths=[ancho] if ancho else None)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('LEFTPADDING', (0, 0), (-1, -1), padding * 2.4), ('RIGHTPADDING', (0, 0), (-1, -1), padding * 2.4),
        ('TOPPADDING', (0, 0), (-1, -1), padding), ('BOTTOMPADDING', (0, 0), (-1, -1), padding),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    t.hAlign = 'LEFT'
    return t


def badge_nivel(producto, tema):
    """DESTACADO (niveles altos) / RECOMENDADO (nivel 2) / nada (nivel 1).
    OFERTA se muestra aparte, siempre que haya descuento real."""
    if producto.protagonismo >= 4:
        return chip('DESTACADO', _c(tema.color_identidad), colors.white, fontsize=8)
    if producto.protagonismo == 2:
        estilo = ParagraphStyle('reco', fontName='Helvetica-Bold', fontSize=8, textColor=_c(tema.color_identidad),
                                 alignment=TA_LEFT)
        return Paragraph('★ RECOMENDADO', estilo)
    return None


TAM_PRECIO = {
    'chico': (9, 15, 8),
    'normal': (10.5, 19, 8.5),
    'grande': (12, 26, 9.5),
    'hero': (14, 40, 11),
}


def bloque_precio(producto, tema, tam='normal', alinear='left'):
    """Precio + tachado + badge de descuento, ver punto 8 del brief:
    rojo = precio final (color comercial principal), amarillo = ahorro/
    descuento (elemento de atención) — nunca al revés."""
    fs_tachado, fs_precio, fs_pct = TAM_PRECIO.get(tam, TAM_PRECIO['normal'])
    align = {'left': TA_LEFT, 'center': TA_CENTER, 'right': TA_RIGHT}[alinear]
    hay_oferta = bool(producto.oferta and producto.descuento_pct and producto.descuento_pct > 0)

    filas = []
    if hay_oferta:
        est_t = ParagraphStyle('pt', fontName='Helvetica', fontSize=fs_tachado, textColor=_c('#8A9099'),
                                alignment=align, leading=fs_tachado + 2)
        filas.append(Paragraph(f'<strike>{_fmt(producto.precio_con_iva)} €</strike>', est_t))
    precio_mostrar = producto.precio_final_con_iva if hay_oferta else producto.precio_con_iva
    est_p = ParagraphStyle('pp', fontName='Helvetica-Bold', fontSize=fs_precio, textColor=_c(tema.color_precio),
                            alignment=align, leading=fs_precio * 1.02)
    fila_precio = Paragraph(f'{_fmt(precio_mostrar)} €', est_p)

    if hay_oferta:
        badge = chip(f'-{int(producto.descuento_pct)}%', _c(tema.color_descuento), _c(tema.color_estructura),
                     fontsize=fs_pct)
        if tam == 'hero':
            # A tamaño HERO el precio ya es muy grande — poner la
            # insignia al lado (no debajo) hacía que "€" se cortara a
            # otra línea por falta de ancho. Se apila debajo en su
            # lugar, sigue siendo llamativa sin romper el número.
            filas.append(fila_precio)
            filas.append(Spacer(1, 2 * mm))
            filas.append(badge)
        else:
            tabla_precio = Table([[fila_precio, badge]], colWidths=[None, None])
            tabla_precio.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (0, 0), 6), ('RIGHTPADDING', (1, 0), (1, 0), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            tabla_precio.hAlign = alinear.upper() if alinear != 'left' else 'LEFT'
            filas.append(tabla_precio)
    else:
        filas.append(fila_precio)
    return filas


def _imagen_fit(producto, ancho_pt, alto_pt, cuadrado=False):
    """Carga la imagen del producto y la ajusta (sin deformar) dentro de
    una caja de ancho_pt x alto_pt, devolviendo un Image ya al tamaño
    final de impresión (preparar_para_incrustar — nitidez máxima)."""
    pil = imagen_para_producto(producto, tamano=900, cuadrado=cuadrado)
    iw, ih = pil.size
    ratio = min(ancho_pt / iw, alto_pt / ih)
    aw, ah = iw * ratio, ih * ratio
    pil = preparar_para_incrustar(pil, aw, ah)
    img = RLImage(io.BytesIO(pil_to_bytes(pil)), width=aw, height=ah)
    img.hAlign = 'CENTER'
    return img, aw, ah


def banda_familia(nombre_familia, tema, ancho, claim=None):
    """Cabecera de familia — banda antracita a todo el ancho, tal como
    pide el punto 11 del brief: presencia visual clara, no solo un
    '■ NOMBRE' discreto."""
    est_nombre = ParagraphStyle('bf_n', fontName='Helvetica-Bold', fontSize=15.5, textColor=colors.white,
                                 alignment=TA_LEFT, leading=18)
    contenido = [Paragraph(nombre_familia.upper(), est_nombre)]
    if claim:
        est_claim = ParagraphStyle('bf_c', fontName='Helvetica', fontSize=9.5,
                                    textColor=_c(tema.color_identidad if tema.color_identidad != tema.color_estructura
                                                 else '#B8BEC7'),
                                    alignment=TA_LEFT, leading=12)
        contenido.append(Paragraph(claim, est_claim))
    t = Table([[contenido]], colWidths=[ancho])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_estructura)),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    return t


# ── Patrones de layout — el nivel de protagonismo decide el LENGUAJE ────
# de composición, no solo el tamaño (punto 4 del brief). ─────────────────
def _ficha_texto_producto(producto, tema, tam_nombre=12, tam_ref=8):
    est_nombre = ParagraphStyle('fn', fontName='Helvetica-Bold', fontSize=tam_nombre, textColor=_c(tema.color_texto),
                                 alignment=TA_LEFT, leading=tam_nombre * 1.18)
    est_ref = ParagraphStyle('fr', fontName='Helvetica', fontSize=tam_ref, textColor=_c('#8A9099'),
                              alignment=TA_LEFT, leading=tam_ref + 2)
    return [Paragraph(producto.nombre, est_nombre), Paragraph(f'Ref: {producto.referencia}', est_ref)]


def layout_hero_absoluto(producto, tema, ancho, alto_img=82 * mm):
    """Nivel 5 dominando la composición: imagen enorme a un lado, ficha
    y precio HERO al otro — debe notarse en menos de un segundo que es
    el producto estrella (regla del punto 4 del brief)."""
    ancho_img = ancho * 0.56
    ancho_info = ancho - ancho_img - 8 * mm
    img, aw, ah = _imagen_fit(producto, ancho_img, alto_img, cuadrado=False)

    info = []
    b = badge_nivel(producto, tema)
    if b:
        info.append(b)
        info.append(Spacer(1, 3 * mm))
    info += _ficha_texto_producto(producto, tema, tam_nombre=16, tam_ref=9)
    info.append(Spacer(1, 4 * mm))
    info += bloque_precio(producto, tema, tam='hero')

    fila = Table([[img, info]], colWidths=[ancho_img + 4 * mm, ancho_info])
    pad_h = 9 if _config['redondeado'] else 0
    fila.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), pad_h), ('RIGHTPADDING', (0, 0), (0, 0), 4 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    if _config['redondeado']:
        fila = CajaRedondeada(fila, _c(tema.color_identidad), radio=8, grosor=1.2)
    return [fila]


def _tarjeta_secundaria(producto, tema, ancho, alto_img=22 * mm):
    """Producto pequeño usado como acompañante (columna de secundarios,
    grid comercial): imagen discreta + nombre + precio, sin caja ni
    borde propio — solo una fina línea inferior de separación."""
    img, aw, ah = _imagen_fit(producto, ancho * 0.95, alto_img, cuadrado=False)
    contenido = [img, Spacer(1, 1.5 * mm)] + _ficha_texto_producto(producto, tema, tam_nombre=9, tam_ref=6.5)
    contenido.append(Spacer(1, 1.5 * mm))
    contenido += bloque_precio(producto, tema, tam='chico')
    t = Table([[contenido]], colWidths=[ancho])
    pad = 6 if _config['redondeado'] else 2
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), pad), ('RIGHTPADDING', (0, 0), (-1, -1), pad),
        ('TOPPADDING', (0, 0), (-1, -1), pad), ('BOTTOMPADDING', (0, 0), (-1, -1), 5 if not _config['redondeado'] else pad),
        ('LINEBELOW', (0, 0), (-1, -1), 0 if _config['redondeado'] else 0.6, _c('#E1E4E8')),
    ]))
    if _config['redondeado']:
        return CajaRedondeada(t, _c(tema.color_identidad), radio=5, grosor=1)
    return t


def layout_hero_secundarios(hero, secundarios, tema, ancho, alto_hero=56 * mm):
    """Un producto protagonista (nivel 4-5) + 2-4 productos secundarios
    en columna estrecha al lado — asimetría deliberada, no un grid
    uniforme (punto 5 del brief). Si no hay secundarios, cae en
    `layout_hero_absoluto` (a todo el ancho) en vez de dejar el 40%
    derecho de la página en blanco."""
    if not secundarios:
        return layout_hero_absoluto(hero, tema, ancho, alto_img=alto_hero)
    ancho_hero = ancho * 0.6
    ancho_sec = ancho - ancho_hero - 6 * mm
    img, aw, ah = _imagen_fit(hero, ancho_hero, alto_hero, cuadrado=False)

    info = []
    b = badge_nivel(hero, tema)
    if b:
        info.append(b)
        info.append(Spacer(1, 2.5 * mm))
    info += _ficha_texto_producto(hero, tema, tam_nombre=14, tam_ref=8.5)
    info.append(Spacer(1, 3 * mm))
    info += bloque_precio(hero, tema, tam='grande')

    columna_hero = Table([[img], [Spacer(1, 3 * mm)], [info]], colWidths=[ancho_hero])
    pad_hero = 9 if _config['redondeado'] else 0
    columna_hero.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), pad_hero), ('RIGHTPADDING', (0, 0), (-1, -1), pad_hero),
        ('TOPPADDING', (0, 0), (-1, -1), pad_hero), ('BOTTOMPADDING', (0, 0), (-1, -1), pad_hero),
    ]))
    if _config['redondeado']:
        columna_hero = CajaRedondeada(columna_hero, _c(tema.color_identidad), radio=8, grosor=1.2)

    filas_sec = [[_tarjeta_secundaria(p, tema, ancho_sec)] for p in secundarios]
    columna_sec = Table(filas_sec, colWidths=[ancho_sec]) if filas_sec else None

    celdas = [columna_hero, columna_sec] if columna_sec else [columna_hero]
    anchos = [ancho_hero, ancho_sec] if columna_sec else [ancho_hero]
    fila = Table([celdas], colWidths=anchos)
    fila.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (0, 0), 3 * mm),
        ('RIGHTPADDING', (1, 0), (1, 0), 0), ('LEFTPADDING', (1, 0), (1, 0), 3 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return [fila]


def layout_doble_protagonista(p1, p2, tema, ancho):
    """Dos productos nivel 4 a partes iguales — dos bloques con peso
    visual equivalente, cada uno con imagen grande y precio propio."""
    ancho_col = (ancho - 8 * mm) / 2

    def bloque(p):
        img, aw, ah = _imagen_fit(p, ancho_col, 48 * mm, cuadrado=False)
        info = []
        b = badge_nivel(p, tema)
        if b:
            info.append(b)
            info.append(Spacer(1, 2 * mm))
        info += _ficha_texto_producto(p, tema, tam_nombre=12.5, tam_ref=8)
        info.append(Spacer(1, 2.5 * mm))
        info += bloque_precio(p, tema, tam='normal')
        contenido = [img, Spacer(1, 3 * mm)] + info
        if _config['redondeado']:
            return _quizas_redondear(contenido, ancho_col, tema, radio=7)
        return contenido

    fila = Table([[bloque(p1), bloque(p2)]], colWidths=[ancho_col, ancho_col])
    pad_lat = 0 if _config['redondeado'] else 4 * mm
    fila.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (0, 0), 0), ('RIGHTPADDING', (0, 0), (0, 0), pad_lat),
        ('LEFTPADDING', (1, 0), (1, 0), pad_lat), ('RIGHTPADDING', (1, 0), (1, 0), 0),
        ('LINEAFTER', (0, 0), (0, 0), 0 if _config['redondeado'] else 0.6, _c('#E1E4E8')),
        ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return [fila]


def layout_grid_comercial(productos, tema, ancho, cols=3):
    """Productos secundarios (nivel 1-2) — grid compacto, poco peso
    visual, para no competir con los productos protagonistas de la
    misma familia. Sin cajas: solo una línea fina bajo cada fila.
    El número de columnas se adapta al número real de productos (nunca
    más columnas que productos) para no dejar huecos en blanco cuando
    la familia solo tiene 1-2 productos secundarios."""
    cols = max(1, min(cols, len(productos)))
    ancho_col = ancho / cols
    alto_img = 21 * mm if cols >= 3 else 30 * mm
    filas = []
    fila_actual = []
    for i, p in enumerate(productos):
        fila_actual.append(_tarjeta_secundaria(p, tema, ancho_col, alto_img=alto_img))
        if len(fila_actual) == cols:
            filas.append(fila_actual)
            fila_actual = []
    if fila_actual:
        while len(fila_actual) < cols:
            fila_actual.append('')
        filas.append(fila_actual)
    t = Table(filas, colWidths=[ancho_col] * cols)
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3), ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    return [t]


def disenar_familia(bloque, tema, ancho):
    """Dispatcher: decide qué patrón de layout usar según la mezcla real
    de niveles de protagonismo presentes en la familia — el punto 4 del
    brief pide que el nivel cambie el LENGUAJE de composición, así que
    esta función es la pieza central de todo el motor V3."""
    productos = [p for e in bloque.elementos if isinstance(e, ElementoGrid) for p in e.productos]
    if not productos:
        return []

    heroes5 = [p for p in productos if p.protagonismo == 5]
    heroes4 = [p for p in productos if p.protagonismo == 4]
    resto = [p for p in productos if p.protagonismo <= 3]

    bloques_layout = []
    if heroes5:
        principal, extra5 = heroes5[0], heroes5[1:]
        secundarios = extra5 + heroes4 + [p for p in resto if p.protagonismo == 3]
        if secundarios:
            bloques_layout.append(layout_hero_secundarios(principal, secundarios[:4], tema, ancho))
            resto_final = [p for p in resto if p.protagonismo <= 2] + secundarios[4:]
        else:
            bloques_layout.append(layout_hero_absoluto(principal, tema, ancho))
            resto_final = [p for p in resto if p.protagonismo <= 2]
    elif len(heroes4) >= 2:
        bloques_layout.append(layout_doble_protagonista(heroes4[0], heroes4[1], tema, ancho))
        resto_final = heroes4[2:] + resto
    elif heroes4:
        nivel3 = [p for p in resto if p.protagonismo == 3]
        secundarios = nivel3 + [p for p in resto if p.protagonismo <= 2]
        if secundarios:
            bloques_layout.append(layout_hero_secundarios(heroes4[0], secundarios[:4], tema, ancho))
            resto_final = secundarios[4:]
        else:
            bloques_layout.append(layout_hero_absoluto(heroes4[0], tema, ancho))
            resto_final = []
    else:
        nivel3 = [p for p in resto if p.protagonismo == 3]
        resto_final = resto
        if nivel3:
            otros = [x for x in resto if x is not nivel3[0]]
            bloques_layout.append(layout_hero_secundarios(nivel3[0], otros[:4], tema, ancho, alto_hero=48 * mm))
            usados = {id(nivel3[0])} | {id(p) for p in otros[:4]}
            resto_final = [p for p in resto if id(p) not in usados]

    # Construye la lista de "bloques" de contenido (cada uno una lista
    # de flowables) SIN mezclarlos aún con la cabecera — así se puede
    # mantener la cabecera unida solo al PRIMER bloque real (con
    # KeepTogether) y dejar que el resto de la familia pagine con
    # normalidad. Antes solo se mantenía unida la cabecera con el
    # espaciador que la sigue, así que si el primer producto no cabía
    # en lo que quedaba de página, la cabecera se quedaba sola al final
    # de una página y el contenido empezaba solo en la siguiente —
    # bug real señalado por Eloy ("las cabeceras no están correctamente
    # en la hoja de los productos").
    todos_bloques = list(bloques_layout)
    if resto_final:
        if not bloques_layout and len(resto_final) == 1:
            # Familia con un único producto y sin protagonismo alto: en
            # vez de una rejilla pequeña con mucho hueco alrededor, se
            # le da presencia real a todo el ancho (imagen más modesta
            # que un HERO de verdad, pero sin dejar huecos en blanco).
            todos_bloques.append(layout_hero_absoluto(resto_final[0], tema, ancho, alto_img=40 * mm))
        else:
            todos_bloques.append(layout_grid_comercial(resto_final, tema, ancho))

    if not todos_bloques:
        return []

    cabecera = [banda_familia(bloque.familia, tema, ancho), Spacer(1, 3.5 * mm)]
    primer_bloque = cabecera + todos_bloques[0]

    resto_cuerpo = []
    for b in todos_bloques[1:]:
        resto_cuerpo.append(Spacer(1, 3 * mm))
        resto_cuerpo += b
    resto_cuerpo.append(Spacer(1, 5 * mm))

    return [KeepTogether(primer_bloque)] + resto_cuerpo


# ── Cabecera / pie — deliberadamente LIGEROS (el brief pide "clara, ─────
# luminosa", nada de bandas oscuras pesadas en cada página; el antracita
# se reserva para bandas de familia, badges y el bloque de portada). ────
def make_header_footer(logo_png, tema, periodo):
    def hf(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(_c(tema.color_fondo))
        canvas.rect(0, 0, W, H, fill=1, stroke=0)

        # Cabecera: fina, blanca, con logo + nombre + periodo.
        if logo_png and os.path.exists(logo_png):
            with PILImage.open(logo_png) as im:
                ratio = im.height / im.width
            ch = 9 * mm
            canvas.drawImage(logo_png, MARGIN, H - TOP_BAR_H + (TOP_BAR_H - ch) / 2 - 2 * mm,
                              height=ch, width=ch / ratio, preserveAspectRatio=True, mask='auto')
            tx = MARGIN + ch / ratio + 4 * mm
        else:
            tx = MARGIN
        canvas.setFillColor(_c(tema.color_estructura))
        canvas.setFont('Helvetica-Bold', 10.5)
        canvas.drawString(tx, H - 10.5 * mm, 'ORENCIO MATAS Y HERMANOS')
        canvas.setFillColor(_c(tema.color_identidad))
        canvas.setFont('Helvetica-Bold', 8.5)
        canvas.drawRightString(W - MARGIN, H - 10.5 * mm, periodo.etiqueta.upper())
        canvas.setStrokeColor(_c(tema.color_identidad))
        canvas.setLineWidth(1.4)
        canvas.line(MARGIN, H - TOP_BAR_H + 2 * mm, W - MARGIN, H - TOP_BAR_H + 2 * mm)

        # Pie: banda gris muy clara con disclaimer + logo + página.
        canvas.setFillColor(_c(tema.color_fondo_alterno))
        canvas.rect(0, 0, W, BOTTOM_BAR_H, fill=1, stroke=0)
        if logo_png and os.path.exists(logo_png):
            with PILImage.open(logo_png) as im:
                ratio = im.height / im.width
            ch2 = 8 * mm
            canvas.drawImage(logo_png, MARGIN, (BOTTOM_BAR_H - ch2) / 2, height=ch2, width=ch2 / ratio,
                              preserveAspectRatio=True, mask='auto')
            tx2 = MARGIN + ch2 / ratio + 4 * mm
        else:
            tx2 = MARGIN
        canvas.setFillColor(_c(tema.color_texto))
        canvas.setFont('Helvetica-BoldOblique', 8.5)
        canvas.drawString(tx2, BOTTOM_BAR_H - 6.5 * mm,
                           'Ofertas válidas hasta agotar existencias. Precios sujetos a cambios.')
        canvas.setFont('Helvetica', 7)
        canvas.setFillColor(_c('#6B7280'))
        canvas.drawString(tx2, BOTTOM_BAR_H - 11.5 * mm,
                           'Orencio Matas y Hnos, S.L. · 926 221 217 · correo@orenciomatas.es · orenciomatas.es')
        canvas.drawRightString(W - MARGIN, BOTTOM_BAR_H - 11.5 * mm, f'Pág. {doc.page}')
        canvas.restoreState()
    return hf


class _DocConExtras(BaseDocTemplate):
    """BaseDocTemplate con un hook para dibujar ENCIMA del contenido de
    una página concreta (no debajo, como hace `onPage` normalmente) —
    necesario para que la pegatina de estallido de la portada quede
    POR DELANTE de la banda de título, no tapada por ella. `onPage` se
    ejecuta antes de que el contenido de la página se dibuje (pensado
    para fondos/decoración); `afterPage()` se ejecuta después — aquí es
    donde hace falta engancharse para un elemento que debe superponerse."""

    def __init__(self, *args, dibujar_despues_pagina=None, **kwargs):
        super().__init__(*args, **kwargs)
        self._dibujar_despues_pagina = dibujar_despues_pagina

    def afterPage(self):
        if self._dibujar_despues_pagina:
            self._dibujar_despues_pagina(self.canv, self)


# ── Portada — verdadera portada de campaña, no un título suelto ─────────
def generar_estallido(color_rgb, texto_pct, texto_color_rgb=(255, 255, 255), lado_px=340, puntas=13, angulo=-8):
    """Pegatina de "estallido" (silueta de estrella irregular) con el
    % de descuento dentro, dibujada con PIL — el elemento gráfico más
    reconocible de un folleto de ofertas real (Lidl, Aldi...) y que
    faltaba por completo en la portada anterior: un bloque de color
    plano con texto no se lee como "oferta", una pegatina sí."""
    import math
    img = PILImage.new('RGBA', (lado_px, lado_px), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = lado_px // 2, lado_px // 2
    r_out, r_in = lado_px * 0.49, lado_px * 0.35
    ang0 = math.radians(angulo)
    puntos = []
    for i in range(puntas * 2):
        ang = ang0 + math.pi * i / puntas
        r = r_out if i % 2 == 0 else r_in
        puntos.append((cx + r * math.sin(ang), cy - r * math.cos(ang)))
    draw.polygon(puntos, fill=color_rgb)

    # Texto grande centrado ("-20%" en dos líneas: número grande + "%")
    numero = texto_pct.replace('%', '').strip()
    fs_num = int(lado_px * 0.30)
    fs_sub = int(lado_px * 0.135)
    try:
        font_num = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', fs_num)
        font_sub = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', fs_sub)
    except Exception:
        font_num = ImageFont.load_default()
        font_sub = font_num
    bbox_n = draw.textbbox((0, 0), numero, font=font_num)
    bbox_s = draw.textbbox((0, 0), 'DTO.', font=font_sub)
    alto_total = (bbox_n[3] - bbox_n[1]) + (bbox_s[3] - bbox_s[1]) + 6
    y0 = cy - alto_total / 2 - bbox_n[1]
    draw.text((cx - (bbox_n[2] - bbox_n[0]) / 2, y0), numero, font=font_num, fill=texto_color_rgb)
    y1 = y0 + (bbox_n[3] - bbox_n[1]) + 8
    draw.text((cx - (bbox_s[2] - bbox_s[0]) / 2, y1), 'DTO.', font=font_sub, fill=texto_color_rgb)

    buf = io.BytesIO()
    img.save(buf, 'PNG')
    return buf.getvalue()


def construir_portada(periodo, tema, bloques, logo_png, ancho):
    """Portada de campaña con impacto visual real (punto 10 del brief):
    debe quedar claro en un vistazo que esto es un folleto de ofertas,
    no solo un título con espacio en blanco alrededor. Bloque de color
    a todo el ancho para el titular, aviso de descuento grande cuando
    hay ofertas reales en el catálogo, e imágenes de producto más
    grandes que en la primera versión de la portada."""
    story = []

    todos = [p for b in bloques for e in b.elementos if isinstance(e, ElementoGrid) for p in e.productos]
    descuento_max = 0.0
    for p in todos:
        if p.oferta and p.descuento_pct and float(p.descuento_pct) > descuento_max:
            descuento_max = float(p.descuento_pct)
    # Ancho que la pegatina de estallido ocupa sobre la esquina derecha
    # de la banda (ver `_dibujar_sticker_portada`) — se reserva como
    # hueco en blanco a la derecha del texto del título para que un
    # nombre de campaña largo (p.ej. "CAMPAÑA DE NAVIDAD 2026") nunca
    # quede tapado por la pegatina, sea cual sea su longitud real.
    hueco_estallido = 42 * mm if descuento_max > 0 else 0

    titulo = periodo.etiqueta.upper()
    est_titulo = ParagraphStyle('pt', fontName='Helvetica-Bold', fontSize=32, textColor=colors.white,
                                 alignment=TA_LEFT, leading=34)
    est_claim = ParagraphStyle('pc', fontName='Helvetica-Bold', fontSize=15, textColor=colors.white,
                                alignment=TA_LEFT, leading=18)
    bloque_titulo = [Paragraph(titulo, est_titulo), Spacer(1, 2 * mm), Paragraph(tema.claim_portada.upper(), est_claim)]
    if logo_png and os.path.exists(logo_png):
        with PILImage.open(logo_png) as im:
            ratio = im.height / im.width
        img_logo = RLImage(logo_png, width=20 * mm, height=20 * mm * ratio)
        ancho_interior = ancho - 18 * mm  # descuenta el padding de 9mm a cada lado de `banner`
        ancho_texto = ancho_interior - 26 * mm - hueco_estallido
        filas_banner = [[img_logo, bloque_titulo, '']] if hueco_estallido else [[img_logo, bloque_titulo]]
        anchos_banner = [26 * mm, ancho_texto, hueco_estallido] if hueco_estallido else [26 * mm, ancho_texto]
        celda_banner = Table(filas_banner, colWidths=anchos_banner)
        celda_banner.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        contenido_banner = celda_banner
    else:
        contenido_banner = bloque_titulo
    banner = Table([[contenido_banner]], colWidths=[ancho])
    banner.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_estructura)),
        ('LEFTPADDING', (0, 0), (-1, -1), 9 * mm), ('RIGHTPADDING', (0, 0), (-1, -1), 9 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 8 * mm), ('BOTTOMPADDING', (0, 0), (-1, -1), 8 * mm),
    ]))
    story.append(banner)

    # Aviso de descuento — el titular textual se acompaña con una
    # pegatina de "estallido" superpuesta sobre la esquina de la banda
    # (dibujada aparte, ver `_dibujar_sticker_portada` / generar_pdf_v3)
    # con el mayor descuento REAL del catálogo, nunca inventado. Aquí
    # solo queda una línea de texto breve para no duplicar el mensaje.
    story.append(Spacer(1, 5 * mm))
    if descuento_max > 0:
        est_ahorro = ParagraphStyle('pa', fontName='Helvetica-Bold', fontSize=13, textColor=_c(tema.color_precio),
                                     alignment=TA_LEFT, leading=16)
        story.append(Paragraph('Descuentos activos en productos seleccionados de este catálogo — ¡no te los pierdas!',
                                est_ahorro))
        story.append(Spacer(1, 3 * mm))
    est_sub = ParagraphStyle('ps', fontName='Helvetica', fontSize=10.5, textColor=_c('#4B5563'),
                              alignment=TA_LEFT, leading=14)
    story.append(Paragraph(tema.texto_intro, est_sub))
    story.append(Spacer(1, 4 * mm))

    # 2-4 productos protagonistas de portada: los de mayor protagonismo
    # de todo el catálogo, en el orden en que aparecen (nunca inventados
    # ni reordenados por precio) — punto 10 del brief.
    destacados = sorted([p for p in todos if p.protagonismo >= 4], key=lambda p: (-p.protagonismo, p.orden))[:4]
    if not destacados:
        destacados = sorted(todos, key=lambda p: -p.protagonismo)[:3]

    if destacados:
        est_int = ParagraphStyle('pi', fontName='Helvetica-Bold', fontSize=12, textColor=_c(tema.color_estructura),
                                  alignment=TA_LEFT, leading=14)
        story.append(Paragraph('LOS PROTAGONISTAS DE ESTE CATÁLOGO', est_int))
        story.append(Spacer(1, 4.5 * mm))
        n = min(len(destacados), 3)
        ancho_col = (ancho - (n - 1) * 6 * mm) / n

        def tarjeta_portada(p):
            img, aw, ah = _imagen_fit(p, ancho_col * 0.96, 52 * mm, cuadrado=False)
            # Reservar SIEMPRE los mismos 62mm de alto para la imagen
            # (centrada dentro), aunque la foto real ocupe menos por su
            # proporción — si no, las insignias DESTACADO/precio de
            # cada tarjeta quedan a alturas distintas según la forma de
            # cada foto y la fila se ve descuadrada.
            celda_img = Table([[img]], colWidths=[ancho_col], rowHeights=[52 * mm])
            celda_img.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                                            ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
            contenido = [celda_img, Spacer(1, 3 * mm)]
            b = badge_nivel(p, tema)
            if b:
                contenido.append(b)
                contenido.append(Spacer(1, 2 * mm))
            contenido += _ficha_texto_producto(p, tema, tam_nombre=11, tam_ref=7.5)
            contenido.append(Spacer(1, 2.5 * mm))
            contenido += bloque_precio(p, tema, tam='grande')
            t = Table([[contenido]], colWidths=[ancho_col])
            t.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                                    ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
            return t

        fila = Table([[tarjeta_portada(p) for p in destacados[:n]]], colWidths=[ancho_col] * n)
        fila.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_fondo_alterno)),
            ('LEFTPADDING', (0, 0), (-1, -1), 4 * mm), ('RIGHTPADDING', (0, 0), (-1, -1), 4 * mm),
            ('TOPPADDING', (0, 0), (-1, -1), 4 * mm), ('BOTTOMPADDING', (0, 0), (-1, -1), 4 * mm),
        ]))
        story.append(fila)
        story.append(Spacer(1, 5 * mm))

    familias = [b.familia for b in bloques]
    est_fam_tit = ParagraphStyle('ft', fontName='Helvetica-Bold', fontSize=10, textColor=_c(tema.color_estructura),
                                  alignment=TA_LEFT)
    story.append(Paragraph('EN ESTE CATÁLOGO ENCONTRARÁS', est_fam_tit))
    story.append(Spacer(1, 2.5 * mm))
    est_familias = ParagraphStyle('fl', fontName='Helvetica-Bold', fontSize=9.5, textColor=_c(tema.color_identidad),
                                   alignment=TA_LEFT, leading=15)
    story.append(Paragraph('   ·   '.join(f.upper() for f in familias), est_familias))

    story.append(Spacer(1, 6 * mm))
    return story


# ── Cierre — reutiliza el mapa real + chincheta ya validados en v2 ──────
def _dibujar_pin(draw, cx, punta_y, radio, color_rgb, color_sombra_rgb):
    cy = punta_y - int(radio * 2.5)
    for i in range(3):
        rr = radio + i * int(radio * 0.75)
        alpha_col = tuple(min(255, c + (255 - c) * (i + 1) / 4) for c in color_rgb)
        draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=tuple(int(c) for c in alpha_col), width=2)
    draw.polygon([(cx - radio, cy), (cx + radio, cy), (cx, punta_y)], fill=color_rgb)
    draw.ellipse((cx - radio, cy - radio, cx + radio, cy + radio), fill=color_rgb)
    r_int = int(radio * 0.45)
    draw.ellipse((cx - r_int, cy - r_int, cx + r_int, cy + r_int), fill=(255, 255, 255))
    draw.ellipse((cx - radio, punta_y - 6, cx + radio, punta_y + 6), fill=color_sombra_rgb)


def generar_imagen_ubicacion(tema, ancho_px=640, alto_px=420):
    acento_rgb = [int(v * 255) for v in (_c(tema.color_precio).red, _c(tema.color_precio).green, _c(tema.color_precio).blue)]
    if not os.path.exists(RUTA_MAPA_REAL):
        fondo = (243, 244, 246)
        img = PILImage.new('RGB', (ancho_px, alto_px), fondo)
        draw = ImageDraw.Draw(img)
        _dibujar_pin(draw, ancho_px // 2, int(alto_px * 0.55), max(18, int(min(ancho_px, alto_px) * 0.11)),
                     tuple(acento_rgb), fondo)
        buf = io.BytesIO()
        img.save(buf, 'PNG')
        return buf.getvalue()

    base = PILImage.open(RUTA_MAPA_REAL).convert('RGB')
    bw, bh = base.size
    fondo = (245, 242, 235)
    lienzo = PILImage.new('RGB', (ancho_px, alto_px), fondo)
    escala = min(ancho_px / bw, alto_px / bh)
    nueva_w, nueva_h = max(1, int(bw * escala)), max(1, int(bh * escala))
    base_r = base.resize((nueva_w, nueva_h), PILImage.LANCZOS)
    off_x, off_y = (ancho_px - nueva_w) // 2, (alto_px - nueva_h) // 2
    lienzo.paste(base_r, (off_x, off_y))
    draw = ImageDraw.Draw(lienzo)
    mx, my = off_x + MARCADOR_FX * nueva_w, off_y + MARCADOR_FY * nueva_h
    radio = max(10, min(34, int(min(ancho_px, alto_px) * 0.06)))
    _dibujar_pin(draw, int(mx), int(my), radio, tuple(acento_rgb), fondo)
    buf = io.BytesIO()
    lienzo.save(buf, 'PNG')
    return buf.getvalue()


def construir_cierre(tema, logo_png, ancho):
    ancho_texto = ancho * 0.46
    ancho_mapa = ancho - ancho_texto - 8 * mm

    texto = []
    est_tit = ParagraphStyle('ct', fontName='Helvetica-Bold', fontSize=17, textColor=_c(tema.color_estructura),
                              alignment=TA_LEFT, leading=20)
    est_p = ParagraphStyle('cp', fontName='Helvetica', fontSize=10, textColor=_c('#4B5563'),
                            alignment=TA_LEFT, leading=14)
    est_dir = ParagraphStyle('cd', fontName='Helvetica-Bold', fontSize=11.5, textColor=_c(tema.color_estructura),
                              alignment=TA_LEFT, leading=14)
    texto.append(Paragraph('¿Necesitas más información?', est_tit))
    texto.append(Spacer(1, 3 * mm))
    texto.append(Paragraph(tema.texto_cierre, est_p))
    texto.append(Spacer(1, 5 * mm))
    texto.append(Paragraph('ORENCIO MATAS Y HERMANOS, S.L.', est_dir))
    texto.append(Paragraph('Av. Alfred Nobel, 2 · 13005 Ciudad Real', est_p))
    texto.append(Spacer(1, 2 * mm))
    texto.append(Paragraph('Tel. 926 221 217', est_p))
    texto.append(Paragraph('correo@orenciomatas.es · orenciomatas.es', est_p))

    grafico = generar_imagen_ubicacion(tema, ancho_px=640, alto_px=int(640 * 0.66))
    est_enc = ParagraphStyle('ce', fontName='Helvetica-Bold', fontSize=10, textColor=_c(tema.color_identidad),
                              alignment=TA_LEFT, spaceAfter=3)
    mapa = [Paragraph('ENCUÉNTRANOS', est_enc),
            RLImage(io.BytesIO(grafico), width=ancho_mapa, height=ancho_mapa * 0.66)]

    fila = Table([[texto, mapa]], colWidths=[ancho_texto, ancho_mapa])
    fila.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (0, 0), 4 * mm),
        ('LEFTPADDING', (1, 0), (1, 0), 4 * mm), ('RIGHTPADDING', (1, 0), (1, 0), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    linea = Table([['']], colWidths=[ancho], rowHeights=[1.6])
    linea.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_identidad))]))
    return [linea, Spacer(1, 6 * mm), fila]


# ── Orquestador ───────────────────────────────────────────────────────
# ── Orden de familias que mejor aprovecha cada página ────────────────────
def _ordenar_familias_para_paginar(bloques, tema, ancho, capacidad_pagina):
    """Decide en qué ORDEN colocar las familias para aprovechar mejor
    cada página — nunca reordena PRODUCTOS dentro de una familia (eso
    sigue siendo siempre el orden de la Sheet), solo decide qué familia
    completa viene primero cuando la siguiente en el orden original no
    cabe entera en el hueco que quede en la página actual.

    Por qué hace falta: cada familia se mantiene unida a su cabecera
    con `KeepTogether` (para no dejar una cabecera huérfana al final de
    una página sin nada debajo, bug real señalado por Eloy) — pero eso
    significa que si la familia entera no cabe en lo que queda de
    página, se desborda COMPLETA a la siguiente, dejando la página
    actual con un hueco que ninguna familia posterior llega a rellenar
    porque el orden ya las descarta a todas. Adelantar una familia más
    pequeña que SÍ quepa (y retomar la salteada después) evita ese
    hueco. Mucho más simple que el reparto de v2 porque aquí solo hay
    que decidir UN orden lineal, no balancear dos columnas."""
    MARGEN = 3 * mm
    alturas_cabecera, alturas_totales = {}, {}
    for b in bloques:
        flowables = disenar_familia(b, tema, ancho)
        if not flowables:
            alturas_cabecera[id(b)] = 0
            alturas_totales[id(b)] = 0
            continue
        primer = Table([[flowables[0]._content]], colWidths=[ancho])
        h_cab = primer.wrap(ancho, 100000)[1]
        resto = Table([[flowables[1:]]], colWidths=[ancho]) if len(flowables) > 1 else None
        h_resto = resto.wrap(ancho, 100000)[1] if resto else 0
        alturas_cabecera[id(b)] = h_cab
        alturas_totales[id(b)] = h_cab + h_resto

    cola = list(bloques)
    orden_final = []
    espacio_restante = capacidad_pagina
    while cola:
        candidato = cola[0]
        if alturas_cabecera[id(candidato)] <= espacio_restante - MARGEN:
            elegido = cola.pop(0)
        else:
            # No cabe la siguiente en orden — se busca, de entre TODAS
            # las que quedan, la que MEJOR aproveche el hueco (la más
            # grande que aún quepa), no solo la primera que encaje. Así
            # se apura el hueco al máximo en vez de conformarse con la
            # primera candidata pequeña que aparezca.
            mejor_i, mejor_h = None, -1
            for i in range(1, len(cola)):
                h = alturas_cabecera[id(cola[i])]
                if h <= espacio_restante - MARGEN and h > mejor_h:
                    mejor_i, mejor_h = i, h
            elegido = cola.pop(mejor_i) if mejor_i is not None else None
            if elegido is None:
                espacio_restante = capacidad_pagina
                continue
        orden_final.append(elegido)
        h_total = alturas_totales[id(elegido)]
        espacio_restante = max(0.0, espacio_restante - h_total) if h_total <= espacio_restante else 0.0
    return orden_final


def _rgb(hexcolor):
    c = _c(hexcolor)
    return tuple(int(v * 255) for v in (c.red, c.green, c.blue))


def _dibujar_sticker_portada(descuento_max, tema):
    """Callback de dibujo (para el `onPage` de la plantilla de portada)
    que superpone la pegatina de estallido sobre la esquina de la
    banda del título — solo en la página 1, y solo si hay algún
    descuento real que anunciar."""
    if descuento_max <= 0:
        return None
    img_bytes = generar_estallido(_rgb(tema.color_descuento), f'-{int(descuento_max)}%',
                                   texto_color_rgb=_rgb(tema.color_estructura))

    def extra(canvas, doc):
        if doc.page != 1:
            return
        from reportlab.lib.utils import ImageReader
        lado = 52 * mm
        x = W - lado - 7 * mm
        y = H - TOP_BAR_H - 3 * mm - lado
        canvas.drawImage(ImageReader(io.BytesIO(img_bytes)), x, y, width=lado, height=lado, mask='auto')
    return extra


def generar_pdf_v3(periodo, tema, bloques, logo_png, out_path, resultado=None, redondeado=False):
    """Punto de entrada equivalente a `render_pdf.generar_pdf()` (misma
    firma, + `redondeado`) pero con el motor editorial V3 — flujo a una
    sola columna, sin necesidad de balancear nada entre izquierda/
    derecha. `redondeado=True` activa la variante de prueba con los
    productos envueltos en bloques de esquinas redondeadas (a petición
    de Eloy, para comparar contra la composición sin cajas del brief
    original)."""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    _config['redondeado'] = redondeado

    todos = [p for b in bloques for e in b.elementos if isinstance(e, ElementoGrid) for p in e.productos]
    descuento_max = 0.0
    for p in todos:
        if p.oferta and p.descuento_pct and float(p.descuento_pct) > descuento_max:
            descuento_max = float(p.descuento_pct)

    frame = Frame(MARGIN, FRAME_BOTTOM, CW, FRAME_TOP - FRAME_BOTTOM,
                   leftPadding=0, rightPadding=0, topPadding=2, bottomPadding=0, id='unica')
    tpl = PageTemplate(id='contenido', frames=[frame], onPage=make_header_footer(logo_png, tema, periodo))

    def dibujar_despues_pagina(canvas, doc):
        sticker = _dibujar_sticker_portada(descuento_max, tema)
        if sticker:
            sticker(canvas, doc)

    doc = _DocConExtras(out_path, pagesize=A4, pageTemplates=[tpl], dibujar_despues_pagina=dibujar_despues_pagina)

    capacidad_pagina = FRAME_TOP - FRAME_BOTTOM
    bloques_ordenados = _ordenar_familias_para_paginar(bloques, tema, CW, capacidad_pagina)

    story = construir_portada(periodo, tema, bloques, logo_png, CW)
    from reportlab.platypus import PageBreak
    story.append(PageBreak())
    for bloque in bloques_ordenados:
        story += disenar_familia(bloque, tema, CW)
    story += construir_cierre(tema, logo_png, CW)

    doc.build(story)

    total_productos = sum(len(e.productos) for b in bloques for e in b.elementos if isinstance(e, ElementoGrid))
    return {'paginas': doc.page, 'productos': total_productos}
