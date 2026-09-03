"""
Renderizador PDF — capa final del pipeline. Solo sabe pintar lo que le
entrega composicion.py con los colores/textos de campanas.py; no conoce
reglas de negocio ni de dónde vienen los productos.

v3 (tras la segunda revisión visual con Eloy — "no se parece nada al
prototipo, mal estructurado, mucho hueco en blanco"):

El cambio de fondo es que la PÁGINA ENTERA pasa a maquetarse a DOS
COLUMNAS de verdad, usando `Frame`/`PageTemplate` de ReportLab (el
mecanismo pensado exactamente para esto — folletos/boletines a
columnas), en vez de una única tabla a todo el ancho por familia. Eso
es lo que hace que el prototipo real se vea denso y sin huecos: varias
cajas de familia pequeñas, una debajo de otra DENTRO de cada columna,
en vez de una caja gigante ocupando todo el ancho de la página.

- Página 1: plantilla con 3 frames — cabecera (logo + banner de
  campaña, ancho completo) y debajo dos columnas.
- Resto de páginas: plantilla con solo las dos columnas.
- ReportLab reparte el flujo de cajas de familia solo entre columnas
  automáticamente (llena la izquierda, sigue por la derecha, pasa de
  página cuando hace falta) — así no hay que calcular a mano qué cae
  en cada columna.
- Cada familia sigue siendo UNA sola Table (banner + rejilla interna a
  `tema.cols_grid` columnas, con SPAN para el ancho por protagonismo),
  pero ahora encajada en el ancho de una columna (~90mm), no de toda
  la página — así se parece de verdad al prototipo.
"""
from __future__ import annotations

import io
import os
from decimal import Decimal

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, FrameBreak,
                                 NextPageTemplate, Paragraph, Spacer, Table, TableStyle,
                                 Image as RLImage, KeepTogether)
from PIL import Image as PILImage

from .composicion import ElementoGrid, espacios_de
from .imagenes import imagen_para_producto, pil_to_bytes

W, H = A4
MARGIN = 10 * mm
GAP = 5 * mm
CW = W - 2 * MARGIN
COL_W = (CW - GAP) / 2

TOP_BAR_H = 12 * mm
BOTTOM_BAR_H = 7 * mm
HEADER_BOX_H = 30 * mm
FRAME_TOP = H - TOP_BAR_H - 1.5 * mm
FRAME_BOTTOM = BOTTOM_BAR_H + 1.5 * mm

COLOR_GRIS = colors.HexColor('#64748b')
COLOR_NEGRO = colors.HexColor('#1a1a1a')
COLOR_BORDE = colors.HexColor('#d7dce3')
COLOR_FONDO = colors.HexColor('#f8fafc')

# nivel de protagonismo → factor de tamaño de imagen (independiente del
# ancho de celda, que ya regula composicion.py) — así 3/4/5 se
# diferencian entre sí aunque los tres ocupen la columna completa.
FACTOR_IMG = {1: 1.0, 2: 1.05, 3: 1.35, 4: 1.6, 5: 1.9}
ETIQUETA_NIVEL = {2: '★ RECOMENDADO', 5: '★ DESTACADO'}


def _c(hexcolor: str):
    return colors.HexColor(hexcolor)


def estilos(tema):
    acento = _c(tema.color_acento)
    texto_sobre_principal = _c(tema.color_texto_sobre_principal)
    return {
        'titulo_campana': ParagraphStyle('tc', fontName='Helvetica-Bold', fontSize=15.5,
                                          textColor=texto_sobre_principal, alignment=TA_LEFT, leading=18),
        'claim_campana': ParagraphStyle('clc', fontName='Helvetica', fontSize=9,
                                         textColor=texto_sobre_principal, alignment=TA_LEFT, spaceBefore=2, leading=11),
        'banner_familia': ParagraphStyle('bf', fontName='Helvetica-Bold', fontSize=10.5,
                                          textColor=texto_sobre_principal, alignment=TA_LEFT, leading=13),
        'nombre_prod': ParagraphStyle('nom', fontName='Helvetica-Bold', fontSize=7.6, textColor=COLOR_NEGRO,
                                       alignment=TA_CENTER, leading=9.2),
        'ref_prod': ParagraphStyle('ref', fontName='Helvetica', fontSize=5.6, textColor=COLOR_GRIS,
                                    alignment=TA_CENTER, spaceBefore=1, leading=7),
        'etiqueta_nivel': ParagraphStyle('etn', fontName='Helvetica-Bold', fontSize=5.8, textColor=acento,
                                          alignment=TA_CENTER, spaceBefore=1, leading=7),
        'sticker_tachado': ParagraphStyle('stt', fontName='Helvetica-Bold', fontSize=6.3, textColor=colors.white,
                                           alignment=TA_CENTER, leading=8),
        'sticker_precio': ParagraphStyle('stp', fontName='Helvetica-Bold', fontSize=11.5, textColor=colors.white,
                                          alignment=TA_CENTER, leading=13.5),
        'sin_iva': ParagraphStyle('si', fontName='Helvetica', fontSize=5.3, textColor=COLOR_GRIS,
                                   alignment=TA_CENTER, spaceBefore=1, leading=6.5),
        'nota': ParagraphStyle('nt', fontName='Helvetica', fontSize=7, textColor=COLOR_GRIS, alignment=TA_CENTER),
        'cierre_titulo': ParagraphStyle('ct', fontName='Helvetica-Bold', fontSize=12, textColor=COLOR_NEGRO,
                                         alignment=TA_CENTER, spaceAfter=6, leading=15),
        'cierre_texto': ParagraphStyle('ctx', fontName='Helvetica', fontSize=8, textColor=COLOR_GRIS,
                                        alignment=TA_CENTER, leading=11),
    }


# ── Encabezado de campaña (frame propio, solo en página 1) ──────────────
def encabezado_campana(story, periodo, tema, logo_png, st):
    titulo = tema.titulo_portada_template.format(etiqueta_mayus=periodo.etiqueta.upper())
    hay_logo = bool(logo_png and os.path.exists(logo_png))
    texto = Table([
        [Paragraph(titulo, st['titulo_campana'])],
        [Paragraph(tema.claim_portada, st['claim_campana'])],
    ], colWidths=[CW - 24 * mm if hay_logo else CW])
    texto.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    if hay_logo:
        with PILImage.open(logo_png) as im:
            ratio = im.height / im.width
        img = RLImage(logo_png, width=18 * mm, height=18 * mm * ratio)
        fila = Table([[img, texto]], colWidths=[24 * mm, CW - 24 * mm])
    else:
        fila = Table([[texto]], colWidths=[CW])

    fila.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_principal)),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(fila)


# ── Franjas fijas de página (header/footer, dibujadas en el canvas) ─────
def make_header_footer(logo_png, tema, periodo):
    color = _c(tema.color_principal)
    color_texto = _c(tema.color_texto_sobre_principal)

    def hf(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(color)
        canvas.rect(0, H - TOP_BAR_H, W, TOP_BAR_H, fill=1, stroke=0)
        if logo_png and os.path.exists(logo_png):
            with PILImage.open(logo_png) as im:
                ratio = im.height / im.width
            ch = 7.5 * mm
            cw = ch / ratio
            canvas.drawImage(logo_png, MARGIN, H - TOP_BAR_H + 2.2 * mm, height=ch, width=cw,
                              preserveAspectRatio=True, mask='auto')
            tx = MARGIN + cw + 3 * mm
        else:
            tx = MARGIN
        canvas.setFillColor(color_texto)
        canvas.setFont('Helvetica-Bold', 8)
        canvas.drawString(tx, H - 7.3 * mm, 'ORENCIO MATAS Y HERMANOS, S.L.')
        canvas.setFont('Helvetica', 7)
        canvas.drawRightString(W - MARGIN, H - 7.3 * mm, periodo.etiqueta)
        canvas.setFillColor(COLOR_FONDO)
        canvas.rect(0, 0, W, BOTTOM_BAR_H, fill=1, stroke=0)
        canvas.setStrokeColor(COLOR_BORDE)
        canvas.line(MARGIN, BOTTOM_BAR_H, W - MARGIN, BOTTOM_BAR_H)
        canvas.setFillColor(COLOR_GRIS)
        canvas.setFont('Helvetica', 6)
        canvas.drawString(MARGIN, 2.6 * mm,
                           'Orencio Matas y Hnos, S.L. · 926 221 217 · correo@orenciomatas.es · orenciomatas.es')
        canvas.drawRightString(W - MARGIN, 2.6 * mm, f'Pág. {doc.page}')
        canvas.restoreState()
    return hf


def _fmt(d: Decimal) -> str:
    return f'{d:.2f}'.replace('.', ',')


# ── Sticker de precio compacto ───────────────────────────────────────────
def sticker_precio(p, st, tema, ancho=30 * mm):
    fondo = _c(tema.color_acento) if p.oferta else _c(tema.color_principal)
    filas = []
    if p.oferta and p.descuento_pct and p.descuento_pct > 0:
        filas.append([Paragraph(f'<strike>{_fmt(p.precio_con_iva)} €</strike> -{int(p.descuento_pct)}%',
                                 st['sticker_tachado'])])
        filas.append([Paragraph(f'{_fmt(p.precio_final_con_iva)} €', st['sticker_precio'])])
    elif p.oferta:
        filas.append([Paragraph('¡OFERTA!', st['sticker_tachado'])])
        filas.append([Paragraph(f'{_fmt(p.precio_con_iva)} €', st['sticker_precio'])])
    else:
        filas.append([Paragraph(f'{_fmt(p.precio_con_iva)} €', st['sticker_precio'])])

    t = Table(filas, colWidths=[ancho])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), fondo),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 3), ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    t.hAlign = 'CENTER'
    return t


# ── Contenido de una celda de producto ───────────────────────────────────
def _celda_producto(p, tema, st, ancho_celda):
    factor = FACTOR_IMG.get(p.protagonismo, 1.0)
    tamano_img = int(280 * factor)
    cuadrado = p.protagonismo <= 2
    pil = imagen_para_producto(p, tamano=min(tamano_img, 620), cuadrado=cuadrado)
    img_bytes = pil_to_bytes(pil)

    cel_w = ancho_celda - 3 * mm
    cel_h = 26 * mm * factor
    iw, ih = pil.size
    ratio = min(cel_w / iw, cel_h / ih)
    rl_img = RLImage(io.BytesIO(img_bytes), width=iw * ratio, height=ih * ratio)
    rl_img.hAlign = 'CENTER'

    contenido = [rl_img, Spacer(1, 1 * mm)]
    etiqueta = ETIQUETA_NIVEL.get(p.protagonismo)
    if etiqueta:
        contenido.append(Paragraph(etiqueta, st['etiqueta_nivel']))
    contenido.append(Paragraph(p.nombre, st['nombre_prod']))
    contenido.append(Paragraph(f'Ref: {p.referencia}', st['ref_prod']))
    contenido.append(Spacer(1, 1 * mm))
    contenido.append(sticker_precio(p, st, tema, ancho=min(ancho_celda - 4 * mm, 34 * mm)))
    if not p.oferta and p.precio_sin_iva:
        contenido.append(Paragraph(f'{_fmt(p.precio_sin_iva)} € sin IVA', st['sin_iva']))
    elif p.oferta and p.descuento_pct and p.precio_final_sin_iva:
        contenido.append(Paragraph(f'{_fmt(p.precio_final_sin_iva)} € sin IVA', st['sin_iva']))
    return contenido


# ── Tabla única por familia, dimensionada al ancho de UNA columna ───────
def construir_tabla_familia(bloque, tema, st, cols, ancho):
    data = []
    style_cmds = [
        ('BOX', (0, 0), (-1, -1), 1, _c(tema.color_acento)),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]

    data.append([Paragraph('■ ' + bloque.familia, st['banner_familia'])] + [''] * (cols - 1))
    style_cmds += [
        ('SPAN', (0, 0), (cols - 1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), _c(tema.color_principal)),
        ('TOPPADDING', (0, 0), (-1, 0), 3.5), ('BOTTOMPADDING', (0, 0), (-1, 0), 3.5),
        ('LEFTPADDING', (0, 0), (0, 0), 6),
    ]

    fila_actual = []
    suma_actual = 0
    row_idx = 1
    ancho_col_interna = ancho / cols

    def cerrar_fila():
        nonlocal fila_actual, suma_actual, row_idx
        if not fila_actual:
            return
        while suma_actual < cols:
            fila_actual.append('')
            suma_actual += 1
        data.append(fila_actual)
        style_cmds.append(('TOPPADDING', (0, row_idx), (-1, row_idx), 4))
        style_cmds.append(('BOTTOMPADDING', (0, row_idx), (-1, row_idx), 4))
        style_cmds.append(('LEFTPADDING', (0, row_idx), (-1, row_idx), 2))
        style_cmds.append(('RIGHTPADDING', (0, row_idx), (-1, row_idx), 2))
        style_cmds.append(('LINEBELOW', (0, row_idx), (-1, row_idx), 0.3, COLOR_BORDE))
        fila_actual = []
        suma_actual = 0
        row_idx += 1

    for elemento in bloque.elementos:
        if not isinstance(elemento, ElementoGrid):
            continue
        for p in elemento.productos:
            span = max(1, min(cols, espacios_de(p)))
            if suma_actual + span > cols:
                cerrar_fila()
            col_inicio = suma_actual
            fila_actual.append(_celda_producto(p, tema, st, ancho_col_interna * span))
            for _ in range(span - 1):
                fila_actual.append('')
            if span > 1:
                style_cmds.append(('SPAN', (col_inicio, row_idx), (col_inicio + span - 1, row_idx)))
            suma_actual += span
    cerrar_fila()

    if len(data) == 1:
        data.append([''] * cols)

    t = Table(data, colWidths=[ancho / cols] * cols)
    t.setStyle(TableStyle(style_cmds))
    t.repeatRows = 1
    return t


# ── Cierre ───────────────────────────────────────────────────────────────
def cierre(story, tema, st):
    bloque_cierre = [
        Spacer(1, 6 * mm),
        Paragraph('¿Necesitas más información?', st['cierre_titulo']),
        Paragraph(tema.texto_cierre, st['cierre_texto']),
        Spacer(1, 4 * mm),
        Paragraph(
            '<b>Orencio Matas y Hermanos, S.L.</b><br/>Av. Alfred Nobel, 2 · 13005 Ciudad Real<br/>'
            'Tel. 926 221 217<br/>correo@orenciomatas.es', st['cierre_texto']),
    ]
    story.append(KeepTogether(bloque_cierre))


# ── Orquestación: documento a dos columnas con cabecera en página 1 ─────
def generar_pdf(periodo, tema, bloques, logo_png, out_path, resultado_validacion=None):
    """
    Nota de diseño importante (para quien retome esto): los `Frame` de
    ReportLab solo avanzan HACIA DELANTE dentro de una página (columna
    izquierda → columna derecha → página nueva). Un `FrameBreak()` desde
    la columna derecha SIEMPRE salta a la izquierda de una página nueva,
    nunca vuelve a la izquierda de la página actual. Por eso NO se
    intenta repartir las cajas de familia "a mano" eligiendo columna por
    altura acumulada (se probó y descoloca todo el documento en cuanto
    la estimación de altura no coincide al milímetro con el resultado
    real). En vez de eso, se deja que ReportLab haga el relleno
    secuencial nativo: coloca cada caja de familia, en orden, en la
    columna actual; si no cabe, la seguiría automáticamente en la
    siguiente columna/página. Es el comportamiento correcto y estable
    para este tipo de maquetación a columnas.
    """
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    st = estilos(tema)
    hf = make_header_footer(logo_png, tema, periodo)

    frame_header = Frame(MARGIN, FRAME_TOP - HEADER_BOX_H, CW, HEADER_BOX_H,
                          leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id='header')
    frame_izq_p1 = Frame(MARGIN, FRAME_BOTTOM, COL_W, (FRAME_TOP - HEADER_BOX_H) - FRAME_BOTTOM,
                          leftPadding=0, rightPadding=0, topPadding=2, bottomPadding=0, id='izq1')
    frame_der_p1 = Frame(MARGIN + COL_W + GAP, FRAME_BOTTOM, COL_W, (FRAME_TOP - HEADER_BOX_H) - FRAME_BOTTOM,
                          leftPadding=0, rightPadding=0, topPadding=2, bottomPadding=0, id='der1')
    frame_izq = Frame(MARGIN, FRAME_BOTTOM, COL_W, FRAME_TOP - FRAME_BOTTOM,
                       leftPadding=0, rightPadding=0, topPadding=2, bottomPadding=0, id='izq')
    frame_der = Frame(MARGIN + COL_W + GAP, FRAME_BOTTOM, COL_W, FRAME_TOP - FRAME_BOTTOM,
                       leftPadding=0, rightPadding=0, topPadding=2, bottomPadding=0, id='der')

    tpl_pagina1 = PageTemplate(id='pagina1', frames=[frame_header, frame_izq_p1, frame_der_p1], onPage=hf)
    tpl_siguientes = PageTemplate(id='siguientes', frames=[frame_izq, frame_der], onPage=hf)

    doc = BaseDocTemplate(out_path, pagesize=A4, pageTemplates=[tpl_pagina1, tpl_siguientes])

    story = []
    encabezado_campana(story, periodo, tema, logo_png, st)
    story.append(FrameBreak())
    story.append(NextPageTemplate('siguientes'))

    for bloque in bloques:
        story.append(construir_tabla_familia(bloque, tema, st, cols=tema.cols_grid, ancho=COL_W))
        story.append(Spacer(1, 2.5 * mm))

    cierre(story, tema, st)
    doc.build(story)

    num_paginas = 0
    try:
        import fitz
        pdf_doc = fitz.open(out_path)
        num_paginas = len(pdf_doc)
        pdf_doc.close()
    except Exception:
        pass
    return {'paginas': num_paginas, 'productos': sum(
        len(e.productos) for b in bloques for e in b.elementos)}
