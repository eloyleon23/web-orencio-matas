"""
Renderizador PDF — capa final del pipeline. Solo sabe pintar lo que le
entrega composicion.py con los colores/textos de campanas.py; no conoce
reglas de negocio ni de dónde vienen los productos.

v4 (tercera revisión visual con Eloy):
  - Las cajas de familia ahora se REPARTEN entre columnas con un
    algoritmo de balanceo real (`planificar_columnas`), no con el
    relleno secuencial "primero-que-cabe" de ReportLab — así el final
    de la columna izquierda y el de la derecha quedan alineados de
    verdad en cada página. Sigue respetando la limitación real de los
    `Frame` (solo avanzan hacia delante: izq → der → página nueva);
    lo que cambia es que ahora YO decido el punto de corte óptimo
    dentro de esa restricción, en vez de dejar que ReportLab pare en
    el primer sitio que no cabe.
  - Familias con un único producto: layout horizontal (imagen a un
    lado, precio/info al otro) en vez de vertical — la imagen ocupa
    mucho más y no queda medio bloque en blanco.
  - Esquinas redondeadas de verdad (`CajaRedondeada`, un Flowable que
    dibuja el borde con `roundRect` porque `TableStyle` no soporta
    esquinas redondeadas).
  - Icono/logo pequeño en la esquina de cada caja de familia (badge
    circular con el logo de la empresa).
  - Cabecera de página 1 más grande (logo y titular con más presencia).
  - Página de cierre a página completa: dirección + una tarjeta de
    ubicación ilustrativa (no es un mapa real — este entorno no tiene
    acceso a proveedores de mapas; ver nota en el código).
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
                                 Image as RLImage, Flowable)
from PIL import Image as PILImage, ImageDraw

from .composicion import ElementoGrid, espacios_de
from .imagenes import imagen_para_producto, pil_to_bytes

W, H = A4
MARGIN = 10 * mm
GAP = 5 * mm
CW = W - 2 * MARGIN
COL_W = (CW - GAP) / 2

TOP_BAR_H = 12 * mm
BOTTOM_BAR_H = 7 * mm
HEADER_BOX_H = 46 * mm
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
        'titulo_campana': ParagraphStyle('tc', fontName='Helvetica-Bold', fontSize=20,
                                          textColor=texto_sobre_principal, alignment=TA_LEFT, leading=23),
        'claim_campana': ParagraphStyle('clc', fontName='Helvetica', fontSize=11,
                                         textColor=texto_sobre_principal, alignment=TA_LEFT, spaceBefore=3, leading=14),
        'banner_familia': ParagraphStyle('bf', fontName='Helvetica-Bold', fontSize=10.3,
                                          textColor=texto_sobre_principal, alignment=TA_LEFT, leading=12.5),
        'nombre_prod': ParagraphStyle('nom', fontName='Helvetica-Bold', fontSize=7.6, textColor=COLOR_NEGRO,
                                       alignment=TA_CENTER, leading=9.2),
        'nombre_prod_h': ParagraphStyle('nomh', fontName='Helvetica-Bold', fontSize=10.5, textColor=COLOR_NEGRO,
                                         alignment=TA_LEFT, leading=13),
        'ref_prod': ParagraphStyle('ref', fontName='Helvetica', fontSize=5.6, textColor=COLOR_GRIS,
                                    alignment=TA_CENTER, spaceBefore=1, leading=7),
        'ref_prod_h': ParagraphStyle('refh', fontName='Helvetica', fontSize=7, textColor=COLOR_GRIS,
                                      alignment=TA_LEFT, spaceBefore=2, leading=9),
        'etiqueta_nivel': ParagraphStyle('etn', fontName='Helvetica-Bold', fontSize=5.8, textColor=acento,
                                          alignment=TA_CENTER, spaceBefore=1, leading=7),
        'etiqueta_nivel_h': ParagraphStyle('etnh', fontName='Helvetica-Bold', fontSize=7, textColor=acento,
                                            alignment=TA_LEFT, spaceBefore=0, leading=9),
        'sticker_tachado': ParagraphStyle('stt', fontName='Helvetica-Bold', fontSize=6.3, textColor=colors.white,
                                           alignment=TA_CENTER, leading=8),
        'sticker_precio': ParagraphStyle('stp', fontName='Helvetica-Bold', fontSize=11.5, textColor=colors.white,
                                          alignment=TA_CENTER, leading=13.5),
        'sticker_tachado_h': ParagraphStyle('stth', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white,
                                             alignment=TA_LEFT, leading=10),
        'sticker_precio_h': ParagraphStyle('stph', fontName='Helvetica-Bold', fontSize=16, textColor=colors.white,
                                            alignment=TA_LEFT, leading=19),
        'sin_iva': ParagraphStyle('si', fontName='Helvetica', fontSize=5.3, textColor=COLOR_GRIS,
                                   alignment=TA_CENTER, spaceBefore=1, leading=6.5),
        'sin_iva_h': ParagraphStyle('sih', fontName='Helvetica', fontSize=7, textColor=COLOR_GRIS,
                                     alignment=TA_LEFT, spaceBefore=2, leading=9),
        'nota': ParagraphStyle('nt', fontName='Helvetica', fontSize=7, textColor=COLOR_GRIS, alignment=TA_CENTER),
        'cierre_titulo': ParagraphStyle('ct', fontName='Helvetica-Bold', fontSize=16, textColor=COLOR_NEGRO,
                                         alignment=TA_LEFT, spaceAfter=3, leading=19),
        'cierre_texto': ParagraphStyle('ctx', fontName='Helvetica', fontSize=9.5, textColor=COLOR_GRIS,
                                        alignment=TA_LEFT, leading=14),
        'cierre_direccion': ParagraphStyle('cd', fontName='Helvetica-Bold', fontSize=11, textColor=COLOR_NEGRO,
                                            alignment=TA_LEFT, leading=15),
    }


# ── Encabezado de campaña (frame propio, solo en página 1) ──────────────
def encabezado_campana(story, periodo, tema, logo_png, st):
    titulo = tema.titulo_portada_template.format(etiqueta_mayus=periodo.etiqueta.upper())
    hay_logo = bool(logo_png and os.path.exists(logo_png))
    texto = Table([
        [Paragraph(titulo, st['titulo_campana'])],
        [Paragraph(tema.claim_portada, st['claim_campana'])],
    ], colWidths=[CW - 38 * mm if hay_logo else CW])
    texto.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    if hay_logo:
        with PILImage.open(logo_png) as im:
            ratio = im.height / im.width
        # Ancho de logo limitado también por altura máxima segura dentro
        # de HEADER_BOX_H (algunos logos son más altos que anchos —
        # fijar solo el ancho podía desbordar la cabecera por un pelo).
        alto_maximo_logo = HEADER_BOX_H - 15 * mm
        ancho_logo = min(26 * mm, alto_maximo_logo / ratio)
        img = RLImage(logo_png, width=ancho_logo, height=ancho_logo * ratio)
        fila = Table([[img, texto]], colWidths=[34 * mm, CW - 34 * mm])
    else:
        fila = Table([[texto]], colWidths=[CW])

    fila.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_principal)),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(CajaRedondeada(fila, _c(tema.color_principal), radio=7, grosor=0))


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


# ── Flowable con esquinas redondeadas ────────────────────────────────────
class CajaRedondeada(Flowable):
    """Envuelve un flowable (normalmente una Table) y le dibuja un borde
    con esquinas redondeadas — `TableStyle` no soporta esto de forma
    nativa, así que se dibuja aparte con `roundRect` sobre el mismo
    rectángulo que ocupa el contenido."""

    def __init__(self, contenido, color_borde, radio=6, grosor=1.1, relleno=None):
        Flowable.__init__(self)
        self.contenido = contenido
        self.color_borde = color_borde
        self.radio = radio
        self.grosor = grosor
        self.relleno = relleno
        self.width = 0
        self.height = 0

    def wrap(self, availWidth, availHeight):
        w, h = self.contenido.wrap(availWidth, availHeight)
        self.width, self.height = w, h
        return w, h

    def draw(self):
        c = self.canv
        c.saveState()
        if self.relleno is not None:
            c.setFillColor(self.relleno)
            c.roundRect(0, 0, self.width, self.height, self.radio, stroke=0, fill=1)
        # Recorta TODO el contenido interior (incluidos los fondos de
        # color de cabecera, que TableStyle dibuja siempre como
        # rectángulos de esquina viva) a la silueta redondeada — si no
        # se recorta así, solo se veía redondeado donde no había ningún
        # relleno de color encima (la parte blanca inferior), y la
        # banda de color de la cabecera "asomaba" con esquinas rectas.
        path = c.beginPath()
        path.roundRect(0, 0, self.width, self.height, self.radio)
        c.clipPath(path, stroke=0, fill=0)
        self.contenido.drawOn(self.canv, 0, 0)
        c.restoreState()

        if self.grosor:
            c.saveState()
            c.setStrokeColor(self.color_borde)
            c.setLineWidth(self.grosor)
            c.roundRect(0.5, 0.5, max(self.width - 1, 0), max(self.height - 1, 0), self.radio, stroke=1, fill=0)
            c.restoreState()

    def split(self, availWidth, availHeight):
        piezas = self.contenido.split(availWidth, availHeight)
        if not piezas:
            return []
        return [CajaRedondeada(p, self.color_borde, self.radio, self.grosor, self.relleno) for p in piezas]


_cache_badge = {}


def _badge_logo(logo_png, diametro_px=64):
    """Logo recortado a círculo, para el badge de esquina de cada caja."""
    if logo_png in _cache_badge:
        return _cache_badge[logo_png]
    if not logo_png or not os.path.exists(logo_png):
        _cache_badge[logo_png] = None
        return None
    im = PILImage.open(logo_png).convert('RGBA')
    im.thumbnail((diametro_px, diametro_px), PILImage.LANCZOS)
    lienzo = PILImage.new('RGBA', (diametro_px, diametro_px), (255, 255, 255, 255))
    x = (diametro_px - im.width) // 2
    y = (diametro_px - im.height) // 2
    lienzo.paste(im, (x, y), im)
    mascara = PILImage.new('L', (diametro_px, diametro_px), 0)
    ImageDraw.Draw(mascara).ellipse((0, 0, diametro_px, diametro_px), fill=255)
    salida = PILImage.new('RGBA', (diametro_px, diametro_px))
    salida.paste(lienzo, (0, 0), mascara)
    buf = io.BytesIO()
    salida.save(buf, 'PNG')
    resultado = buf.getvalue()
    _cache_badge[logo_png] = resultado
    return resultado


# ── Sticker de precio compacto ───────────────────────────────────────────
def sticker_precio(p, st, tema, ancho=30 * mm, horizontal=False):
    fondo = _c(tema.color_acento) if p.oferta else _c(tema.color_principal)
    est_tachado = st['sticker_tachado_h'] if horizontal else st['sticker_tachado']
    est_precio = st['sticker_precio_h'] if horizontal else st['sticker_precio']
    filas = []
    if p.oferta and p.descuento_pct and p.descuento_pct > 0:
        filas.append([Paragraph(f'<strike>{_fmt(p.precio_con_iva)} €</strike> -{int(p.descuento_pct)}%', est_tachado)])
        filas.append([Paragraph(f'{_fmt(p.precio_final_con_iva)} €', est_precio)])
    elif p.oferta:
        filas.append([Paragraph('¡OFERTA!', est_tachado)])
        filas.append([Paragraph(f'{_fmt(p.precio_con_iva)} €', est_precio)])
    else:
        filas.append([Paragraph(f'{_fmt(p.precio_con_iva)} €', est_precio)])

    t = Table(filas, colWidths=[ancho])
    pad_v = 3 if horizontal else 1.5
    pad_h = 6 if horizontal else 3
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), fondo),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT' if horizontal else 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), pad_v), ('BOTTOMPADDING', (0, 0), (-1, -1), pad_v),
        ('LEFTPADDING', (0, 0), (-1, -1), pad_h), ('RIGHTPADDING', (0, 0), (-1, -1), pad_h),
    ]))
    if not horizontal:
        t.hAlign = 'CENTER'
    return t


# ── Contenido de una celda de producto (rejilla normal) ──────────────────
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


# ── Layout horizontal (familias de UN solo producto: imagen grande) ─────
def _fila_producto_horizontal(p, tema, st, ancho_total):
    pil = imagen_para_producto(p, tamano=560, cuadrado=False)
    img_bytes = pil_to_bytes(pil, calidad=88)
    iw, ih = pil.size

    img_w = ancho_total * 0.46
    img_h = img_w * (ih / iw)
    max_h = 52 * mm
    if img_h > max_h:
        img_h = max_h
        img_w = img_h * (iw / ih)
    rl_img = RLImage(io.BytesIO(img_bytes), width=img_w, height=img_h)

    ancho_ficha = ancho_total - img_w - 6 * mm
    ficha = []
    etiqueta = ETIQUETA_NIVEL.get(p.protagonismo)
    if etiqueta:
        ficha.append(Paragraph(etiqueta, st['etiqueta_nivel_h']))
    ficha.append(Paragraph(p.nombre, st['nombre_prod_h']))
    ficha.append(Paragraph(f'Ref: {p.referencia}', st['ref_prod_h']))
    ficha.append(Spacer(1, 2.5 * mm))
    ficha.append(sticker_precio(p, st, tema, ancho=min(ancho_ficha - 4 * mm, 42 * mm), horizontal=True))
    if not p.oferta and p.precio_sin_iva:
        ficha.append(Paragraph(f'{_fmt(p.precio_sin_iva)} € sin IVA', st['sin_iva_h']))
    elif p.oferta and p.descuento_pct and p.precio_final_sin_iva:
        ficha.append(Paragraph(f'{_fmt(p.precio_final_sin_iva)} € sin IVA', st['sin_iva_h']))

    fila = Table([[rl_img, ficha]], colWidths=[img_w + 4 * mm, ancho_ficha])
    fila.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (0, 0), 0), ('RIGHTPADDING', (0, 0), (0, 0), 2),
    ]))
    return fila


# ── Tabla única por familia, dimensionada al ancho de UNA columna ───────
def construir_tabla_familia(bloque, tema, st, cols, ancho, logo_png=None):
    todos_productos = [p for e in bloque.elementos if isinstance(e, ElementoGrid) for p in e.productos]
    style_cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]

    badge = _badge_logo(logo_png)
    if badge:
        icono = RLImage(io.BytesIO(badge), width=6.5 * mm, height=6.5 * mm)
        celda_banner = Table([[icono, Paragraph(bloque.familia, st['banner_familia'])]],
                              colWidths=[8.5 * mm, None])
        celda_banner.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('LEFTPADDING', (0, 0), (0, 0), 0), ('RIGHTPADDING', (0, 0), (0, 0), 3),
            ('LEFTPADDING', (1, 0), (1, 0), 0),
        ]))
        banner_contenido = celda_banner
    else:
        banner_contenido = Paragraph('■ ' + bloque.familia, st['banner_familia'])

    data = [[banner_contenido] + [''] * (cols - 1)]
    style_cmds += [
        ('SPAN', (0, 0), (cols - 1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), _c(tema.color_principal)),
        ('TOPPADDING', (0, 0), (-1, 0), 3.2), ('BOTTOMPADDING', (0, 0), (-1, 0), 3.2),
        ('LEFTPADDING', (0, 0), (0, 0), 6),
    ]

    if len(todos_productos) == 1:
        # Familia con un único producto: fila horizontal a toda anchura,
        # imagen grande a un lado y precio/info al otro — mucho mejor
        # aprovechamiento que una celda de rejilla vertical de 1 columna.
        data.append([_fila_producto_horizontal(todos_productos[0], tema, st, ancho)] + [''] * (cols - 1))
        style_cmds += [
            ('SPAN', (0, 1), (cols - 1, 1)),
            ('TOPPADDING', (0, 1), (-1, 1), 5), ('BOTTOMPADDING', (0, 1), (-1, 1), 5),
            ('LEFTPADDING', (0, 1), (-1, 1), 5), ('RIGHTPADDING', (0, 1), (-1, 1), 5),
        ]
    else:
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

        for p in todos_productos:
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
    return CajaRedondeada(t, _c(tema.color_acento), radio=5, grosor=1)


# ── Reparto balanceado de cajas entre las dos columnas de cada página ───
def planificar_columnas(items, capacidad_pagina1, capacidad_normal):
    """`items`: lista de (flowable, alto). Devuelve una lista de páginas
    [(lista_izq, lista_der), ...]. Decide en qué punto de la secuencia
    cortar entre columna izquierda y derecha para que ambas queden lo
    más igualadas posible en altura, SIN reordenar nada — solo decide
    dónde cae el corte. Respeta que un `Frame` de ReportLab solo avanza
    hacia delante (no se puede "volver" a la izquierda de la misma
    página), así que cada página consume un tramo contiguo de la
    secuencia total."""
    paginas = []
    i = 0
    n = len(items)
    primera = True
    while i < n:
        capacidad = capacidad_pagina1 if primera else capacidad_normal
        mejor_fin = i  # exclusivo
        mejor_split = 0
        j = i
        while j < n:
            ventana = items[i:j + 1]
            alturas = [h for _, h in ventana]
            prefijos = [0.0]
            for h in alturas:
                prefijos.append(prefijos[-1] + h)
            total = prefijos[-1]
            if total > 2 * capacidad and j > i:
                break
            mejor_diff = None
            mejor_k = None
            for k in range(0, len(ventana) + 1):
                izq, der = prefijos[k], total - prefijos[k]
                if izq <= capacidad and der <= capacidad:
                    diff = abs(izq - der)
                    if mejor_diff is None or diff < mejor_diff:
                        mejor_diff, mejor_k = diff, k
            if mejor_k is None:
                break
            mejor_fin = j + 1
            mejor_split = mejor_k
            j += 1
        if mejor_fin == i:
            # Ni un solo elemento cabe en una columna (caso raro, caja
            # más alta que la página entera) — se coloca igualmente en
            # la izquierda y que ReportLab la parta si hace falta.
            mejor_fin = i + 1
            mejor_split = 1
        izq = [items[k][0] for k in range(i, i + mejor_split)]
        der = [items[k][0] for k in range(i + mejor_split, mejor_fin)]
        paginas.append((izq, der))
        i = mejor_fin
        primera = False
    return paginas


# ── Gráfico ilustrativo de ubicación (NO es un mapa real, ver nota) ─────
def generar_grafico_ubicacion(tema, ancho_px=640, alto_px=420):
    """Genera una tarjeta ilustrativa de "encuéntranos" con un pin de
    localización, en los colores del tema. No es una captura de mapa
    real: este entorno de generación no tiene acceso de red a ningún
    proveedor de mapas (Google/OSM/etc.), así que en vez de simularlo
    con datos falsos se opta por un gráfico decorativo honesto. Si en
    el futuro se quiere un mapa real, la vía más sencilla es una Google
    Static Maps API key como secreto de GitHub Actions (con red sí
    disponible) que sustituya esta función."""
    principal = colors.HexColor(tema.color_principal)
    acento = colors.HexColor(tema.color_acento)
    r, g, b = [int(v * 255) for v in (principal.red, principal.green, principal.blue)]
    claro = (min(255, int(r + (255 - r) * 0.82)), min(255, int(g + (255 - g) * 0.82)), min(255, int(b + (255 - b) * 0.82)))
    ra, ga, ba = [int(v * 255) for v in (acento.red, acento.green, acento.blue)]

    img = PILImage.new('RGB', (ancho_px, alto_px), claro)
    draw = ImageDraw.Draw(img)

    paso = 46
    linea = tuple(min(255, c + 14) if c < 235 else c - 10 for c in claro)
    for x in range(0, ancho_px, paso):
        draw.line([(x, 0), (x, alto_px)], fill=linea, width=1)
    for y in range(0, alto_px, paso):
        draw.line([(0, y), (ancho_px, y)], fill=linea, width=1)
    for x in range(0, ancho_px, paso * 3):
        draw.line([(x, 0), (x, alto_px)], fill=linea, width=3)
    for y in range(0, alto_px, paso * 3):
        draw.line([(0, y), (ancho_px, y)], fill=linea, width=3)

    cx, cy = ancho_px // 2, int(alto_px * 0.44)
    radio = 30
    for i in range(3):
        rr = radio + i * 22
        alpha_col = tuple(min(255, c + (255 - c) * (i + 1) / 4) for c in (ra, ga, ba))
        draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=tuple(int(c) for c in alpha_col), width=2)

    punta_y = cy + int(radio * 2.5)
    draw.polygon([(cx - radio, cy), (cx + radio, cy), (cx, punta_y)], fill=(ra, ga, ba))
    draw.ellipse((cx - radio, cy - radio, cx + radio, cy + radio), fill=(ra, ga, ba))
    r_int = int(radio * 0.45)
    draw.ellipse((cx - r_int, cy - r_int, cx + r_int, cy + r_int), fill=(255, 255, 255))

    sombra_w = radio
    draw.ellipse((cx - sombra_w, punta_y - 6, cx + sombra_w, punta_y + 6),
                 fill=tuple(min(255, c + (255 - c) // 2) for c in claro))

    buf = io.BytesIO()
    img.save(buf, 'PNG')
    return buf.getvalue()


# ── Cierre: se trata como una caja más dentro del reparto de columnas ───
def construir_caja_cierre(tema, st, logo_png, ancho):
    """Devuelve una CajaRedondeada con la info de contacto + gráfico de
    ubicación, dimensionada al ancho de UNA columna — se añade como una
    caja más a la lista que reparte `planificar_columnas()`, así ocupa
    el hueco que quede libre en la última página de productos en vez de
    forzar una página nueva dedicada solo a esto."""
    contenido = []
    if logo_png and os.path.exists(logo_png):
        with PILImage.open(logo_png) as im:
            ratio = im.height / im.width
        contenido.append(RLImage(logo_png, width=16 * mm, height=16 * mm * ratio))
        contenido.append(Spacer(1, 3 * mm))

    contenido.append(Paragraph('¿Necesitas más información?', st['cierre_titulo']))
    contenido.append(Paragraph(tema.texto_cierre, st['cierre_texto']))
    contenido.append(Spacer(1, 4 * mm))
    contenido.append(Paragraph('ORENCIO MATAS Y HERMANOS, S.L.', st['cierre_direccion']))
    contenido.append(Paragraph('Av. Alfred Nobel, 2 · 13005 Ciudad Real', st['cierre_texto']))
    contenido.append(Spacer(1, 2 * mm))
    contenido.append(Paragraph('Tel. 926 221 217', st['cierre_texto']))
    contenido.append(Paragraph('correo@orenciomatas.es · orenciomatas.es', st['cierre_texto']))
    contenido.append(Spacer(1, 5 * mm))
    contenido.append(Paragraph('ENCUÉNTRANOS', ParagraphStyle(
        'encnos', fontName='Helvetica-Bold', fontSize=9.5, textColor=_c(tema.color_acento),
        alignment=TA_LEFT, spaceAfter=3)))

    grafico = generar_grafico_ubicacion(tema)
    ancho_grafico = ancho - 6 * mm
    contenido.append(RLImage(io.BytesIO(grafico), width=ancho_grafico, height=ancho_grafico * 420 / 640))
    contenido.append(Spacer(1, 2 * mm))
    contenido.append(Paragraph(
        'Ilustración orientativa — mapa real pendiente de sustituir por una captura.', st['nota']))

    tabla = Table([[contenido]], colWidths=[ancho])
    tabla.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return CajaRedondeada(tabla, _c(tema.color_acento), radio=5, grosor=1)


# ── Orquestación: documento a dos columnas con cabecera en página 1 ─────
def generar_pdf(periodo, tema, bloques, logo_png, out_path, resultado_validacion=None):
    """
    Nota de diseño importante (para quien retome esto): los `Frame` de
    ReportLab solo avanzan HACIA DELANTE dentro de una página (columna
    izquierda → columna derecha → página nueva); nunca vuelven atrás.
    `planificar_columnas()` respeta esa restricción — solo decide EN
    QUÉ PUNTO de la secuencia (ya ordenada) cae el corte entre columna
    izquierda y derecha de cada página, para que ambas terminen a una
    altura lo más parecida posible. No reordena cajas de familia entre
    sí (eso rompería el orden documentado del catálogo).
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

    tablas = []
    for bloque in bloques:
        caja = construir_tabla_familia(bloque, tema, st, cols=tema.cols_grid, ancho=COL_W, logo_png=logo_png)
        _, alto = caja.wrap(COL_W, 100000)
        tablas.append((caja, alto + 2.5 * mm))

    # El cierre (dirección/contacto/ubicación) se trata como una caja
    # más de la secuencia — así el algoritmo de reparto la coloca donde
    # quede hueco en la última página de productos, en vez de forzar
    # una página nueva dedicada solo a esto.
    caja_cierre = construir_caja_cierre(tema, st, logo_png, COL_W)
    _, alto_cierre = caja_cierre.wrap(COL_W, 100000)
    tablas.append((caja_cierre, alto_cierre + 2.5 * mm))

    alto_pagina1 = (FRAME_TOP - HEADER_BOX_H) - FRAME_BOTTOM
    alto_normal = FRAME_TOP - FRAME_BOTTOM
    paginas = planificar_columnas(tablas, alto_pagina1, alto_normal)

    story = []
    encabezado_campana(story, periodo, tema, logo_png, st)
    story.append(FrameBreak())
    story.append(NextPageTemplate('siguientes'))

    for idx, (izq, der) in enumerate(paginas):
        for t in izq:
            story.append(t)
            story.append(Spacer(1, 2.5 * mm))
        story.append(FrameBreak())
        for t in der:
            story.append(t)
            story.append(Spacer(1, 2.5 * mm))
        if idx < len(paginas) - 1:
            story.append(FrameBreak())

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
