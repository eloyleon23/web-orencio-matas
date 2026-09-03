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
from .imagenes import imagen_para_producto, pil_to_bytes, preparar_para_incrustar

W, H = A4
MARGIN = 10 * mm
GAP = 5 * mm
CW = W - 2 * MARGIN
COL_W = (CW - GAP) / 2

TOP_BAR_H = 12 * mm
BOTTOM_BAR_H = 18 * mm
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
        'sticker_precio_normal': ParagraphStyle('stpn', fontName='Helvetica-Bold', fontSize=11.5,
                                                 textColor=texto_sobre_principal, alignment=TA_CENTER, leading=13.5),
        'sticker_tachado_h': ParagraphStyle('stth', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white,
                                             alignment=TA_LEFT, leading=10),
        'sticker_precio_h': ParagraphStyle('stph', fontName='Helvetica-Bold', fontSize=16, textColor=colors.white,
                                            alignment=TA_LEFT, leading=19),
        'sticker_precio_h_normal': ParagraphStyle('stphn', fontName='Helvetica-Bold', fontSize=16,
                                                   textColor=texto_sobre_principal, alignment=TA_LEFT, leading=19),
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

        # Pie de página fijo, con el MISMO color que la cabecera (a
        # petición de Eloy) — grande de sobra para incluir el logo y
        # el disclaimer con presencia real, no como una nota al pie
        # discreta. Aparece igual en todas las páginas, así que
        # también ayuda a que el final de la página nunca se vea
        # "en blanco" aunque las dos columnas no terminen a la misma
        # altura exacta.
        canvas.setFillColor(color)
        canvas.rect(0, 0, W, BOTTOM_BAR_H, fill=1, stroke=0)
        if logo_png and os.path.exists(logo_png):
            with PILImage.open(logo_png) as im:
                ratio_logo = im.height / im.width
            ch2 = 11 * mm
            cw2 = ch2 / ratio_logo
            canvas.drawImage(logo_png, MARGIN, (BOTTOM_BAR_H - ch2) / 2, height=ch2, width=cw2,
                              preserveAspectRatio=True, mask='auto')
            tx2 = MARGIN + cw2 + 5 * mm
        else:
            tx2 = MARGIN
        canvas.setFillColor(color_texto)
        canvas.setFont('Helvetica-BoldOblique', 9)
        canvas.drawString(tx2, BOTTOM_BAR_H - 7 * mm,
                           'Ofertas válidas hasta agotar existencias. Precios sujetos a cambios.')
        canvas.setFont('Helvetica', 7)
        canvas.drawString(tx2, BOTTOM_BAR_H - 13 * mm,
                           'Orencio Matas y Hnos, S.L. · 926 221 217 · correo@orenciomatas.es · orenciomatas.es')
        canvas.drawRightString(W - MARGIN, BOTTOM_BAR_H - 13 * mm, f'Pág. {doc.page}')
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
    if p.oferta:
        est_precio = st['sticker_precio_h'] if horizontal else st['sticker_precio']
    else:
        est_precio = st['sticker_precio_h_normal'] if horizontal else st['sticker_precio_normal']
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
def _celda_producto(p, tema, st, ancho_celda, factor_extra=1.0):
    factor = FACTOR_IMG.get(p.protagonismo, 1.0) * factor_extra
    tamano_img = int(320 * factor)
    cuadrado = p.protagonismo <= 2
    pil = imagen_para_producto(p, tamano=min(tamano_img, 900), cuadrado=cuadrado)

    cel_w = ancho_celda - 3 * mm
    cel_h = 30 * mm * factor
    iw, ih = pil.size
    ratio = min(cel_w / iw, cel_h / ih)
    ancho_final, alto_final = iw * ratio, ih * ratio
    pil = preparar_para_incrustar(pil, ancho_final, alto_final)
    img_bytes = pil_to_bytes(pil)
    rl_img = RLImage(io.BytesIO(img_bytes), width=ancho_final, height=alto_final)
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
def _fila_producto_horizontal(p, tema, st, ancho_total, factor_extra=1.0):
    pil = imagen_para_producto(p, tamano=min(int(650 * factor_extra), 1100), cuadrado=False)
    iw, ih = pil.size

    MIN_FICHA = 34 * mm  # nunca dejar la columna de texto/precio más estrecha que esto
    img_w_max = max(ancho_total * 0.30, ancho_total - 6 * mm - MIN_FICHA)
    img_w = min(ancho_total * 0.46 * factor_extra, img_w_max)
    img_h = img_w * (ih / iw)
    max_h = min(52 * mm * factor_extra, 260 * mm)
    if img_h > max_h:
        img_h = max_h
        img_w = img_h * (iw / ih)
    pil = preparar_para_incrustar(pil, img_w, img_h)
    img_bytes = pil_to_bytes(pil)
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
def construir_tabla_familia(bloque, tema, st, cols, ancho, logo_png=None, factor_extra=1.0, relleno_extra=0.0):
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
        data.append([_fila_producto_horizontal(todos_productos[0], tema, st, ancho, factor_extra=factor_extra)]
                    + [''] * (cols - 1))
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

        num_productos = len(todos_productos)
        for i, p in enumerate(todos_productos):
            span = max(1, min(cols, espacios_de(p)))
            if suma_actual + span > cols:
                cerrar_fila()
            col_inicio = suma_actual
            # El "estirado" para llegar al final de página (factor_extra)
            # solo se aplica a la ÚLTIMA fila de la familia — así el
            # resto de productos mantiene su tamaño normal y solo crece
            # la imagen que de verdad tiene sitio libre debajo.
            es_ultimo = (i == num_productos - 1)
            fe = factor_extra if es_ultimo else 1.0
            fila_actual.append(_celda_producto(p, tema, st, ancho_col_interna * span, factor_extra=fe))
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
    if relleno_extra > 0:
        # Cuando ni siquiera agrandar la imagen al máximo razonable
        # basta para llegar a la altura pedida (una foto no se puede
        # alargar sin perder su proporción real), se rellena el resto
        # con aire dentro de la propia caja — así el BORDE de la caja
        # sigue llegando hasta abajo, aunque el contenido no crezca
        # más. Es el último recurso, después de intentar agrandar la
        # imagen todo lo posible.
        t.setStyle(TableStyle([('BOTTOMPADDING', (0, len(data) - 1), (-1, len(data) - 1), relleno_extra)]))
    t.repeatRows = 1
    return CajaRedondeada(t, _c(tema.color_acento), radio=5, grosor=1)


def construir_tabla_familia_ajustada(bloque, tema, st, cols, ancho, logo_png, alto_objetivo):
    """Como `construir_tabla_familia()`, pero agranda la imagen del
    ÚLTIMO producto de la familia (por búsqueda binaria sobre
    `factor_extra`) hasta que la caja completa llegue lo más cerca
    posible de `alto_objetivo` sin pasarse — así el bloque llega hasta
    el final de página en vez de dejar un hueco debajo. Es la misma
    idea que el cierre "elástico", aplicada ahora a cualquier familia,
    no solo a la caja de contacto.

    Una foto no se puede alargar sin límite sin perder su proporción
    real (una imagen ancha y baja no puede convertirse en alta y
    estrecha) — si tras agrandarla todo lo razonable la caja SIGUE sin
    llegar a `alto_objetivo`, el resto se rellena como aire dentro de
    la propia caja (`relleno_extra`), como último recurso, para que al
    menos el borde de la caja llegue hasta abajo."""
    caja = construir_tabla_familia(bloque, tema, st, cols, ancho, logo_png, factor_extra=1.0)
    _, alto_actual = caja.wrap(ancho, 100000)
    if alto_actual >= alto_objetivo - 3:
        return caja

    lo, hi = 1.0, 3.5
    mejor_caja, mejor_alto = caja, alto_actual
    for _ in range(7):
        mid = (lo + hi) / 2
        candidato = construir_tabla_familia(bloque, tema, st, cols, ancho, logo_png, factor_extra=mid)
        _, alto_c = candidato.wrap(ancho, 100000)
        if alto_c >= alto_objetivo:
            hi = mid
            if mejor_alto < alto_objetivo or alto_c < mejor_alto:
                mejor_caja, mejor_alto = candidato, alto_c
        else:
            lo = mid
            if mejor_alto < alto_objetivo and alto_c > mejor_alto:
                mejor_caja, mejor_alto = candidato, alto_c

    deficit = alto_objetivo - mejor_alto
    if deficit > 5:
        factor_maximo = hi if mejor_alto < alto_objetivo else lo
        mejor_caja = construir_tabla_familia(bloque, tema, st, cols, ancho, logo_png,
                                              factor_extra=factor_maximo,
                                              relleno_extra=min(deficit, 25 * mm))
    return mejor_caja


# ── Reparto balanceado de cajas entre las dos columnas de cada página ───
def _mejorar_localmente(columnas):
    """Ajusta `columnas` in-place probando, en cada ronda, todos los
    movimientos posibles entre DOS COLUMNAS CUALESQUIERA (tanto mover
    una familia sin más como intercambiar una de cada columna) y
    aplicando el que más reduzca la diferencia total entre columnas de
    todo el documento, hasta que no quede ninguno que mejore nada."""
    def diferencia_total():
        total = 0.0
        for k in range(0, len(columnas), 2):
            ci, cj = columnas[k], columnas[k + 1]
            total += abs(sum(a for _, _, a in ci['items']) - sum(a for _, _, a in cj['items']))
        return total

    cambiado = True
    intentos = 0
    while cambiado and intentos < 300:
        cambiado = False
        intentos += 1
        actual = diferencia_total()
        mejor_delta, mejor_mov = 0.0, None
        for i in range(len(columnas)):
            for j in range(len(columnas)):
                if i == j:
                    continue
                ci, cj = columnas[i], columnas[j]
                carga_i = sum(x[2] for x in ci['items'])
                carga_j = sum(x[2] for x in cj['items'])
                for a in ci['items']:
                    ha = a[2]
                    if carga_j + ha > cj['capacidad']:
                        continue
                    ci['items'].remove(a); cj['items'].append(a)
                    delta = actual - diferencia_total()
                    ci['items'].append(a); cj['items'].remove(a)
                    if delta > mejor_delta:
                        mejor_delta, mejor_mov = delta, ('mover', i, j, a)
                if i < j:
                    for a in ci['items']:
                        for b in cj['items']:
                            ha, hb = a[2], b[2]
                            if abs(ha - hb) < 0.01:
                                continue
                            nueva_i, nueva_j = carga_i - ha + hb, carga_j - hb + ha
                            if nueva_i > ci['capacidad'] or nueva_j > cj['capacidad']:
                                continue
                            ci['items'].remove(a); ci['items'].append(b)
                            cj['items'].remove(b); cj['items'].append(a)
                            delta = actual - diferencia_total()
                            ci['items'].remove(b); ci['items'].append(a)
                            cj['items'].remove(a); cj['items'].append(b)
                            if delta > mejor_delta:
                                mejor_delta, mejor_mov = delta, ('intercambiar', i, j, a, b)
        if mejor_mov:
            if mejor_mov[0] == 'mover':
                _, i, j, a = mejor_mov
                columnas[i]['items'].remove(a)
                columnas[j]['items'].append(a)
            else:
                _, i, j, a, b = mejor_mov
                columnas[i]['items'].remove(a); columnas[i]['items'].append(b)
                columnas[j]['items'].remove(b); columnas[j]['items'].append(a)
            cambiado = True
    return diferencia_total()


def planificar_columnas(items, capacidad_pagina1, capacidad_normal, no_adelantar=frozenset()):
    """`items`: lista de (flowable, alto). Devuelve una lista de páginas
    [(lista_izq, lista_der), ...].

    Reparte con un balanceo GLOBAL (todas las páginas a la vez), no
    página a página: procesa las familias de MAYOR a MENOR altura y
    asigna cada una a la columna que en ese momento tenga MENOS carga
    acumulada entre todas las ya abiertas (abriendo una página nueva
    solo cuando ninguna columna abierta tiene ya hueco). Es el mismo
    principio que el reparto de tareas entre trabajadores para acabar
    todos a la vez ("longest processing time first"), y evita el fallo
    real de una primera versión: repartir maximizando cada página por
    separado, sin mirar hacia delante, podía dejar la ÚLTIMA página con
    una sola familia huérfana sin nada que la acompañe (todo lo demás
    ya se había "gastado" en páginas anteriores).

    Esto significa que el orden de FAMILIAS puede cambiar respecto al
    original si así se consigue un mejor aprovechamiento del espacio
    (autorizado explícitamente por Eloy). El orden de PRODUCTOS dentro
    de cada familia nunca se toca. Dentro de cada columna, las familias
    elegidas se muestran después en su orden original relativo, para
    que la lectura no salte de forma caótica.

    `no_adelantar`: flowables que se excluyen de este reparto por
    tamaño (se gestionan aparte) — no se usa actualmente (el cierre ya
    no lo necesita, ver `generar_pdf`), se deja disponible por si hace
    falta en el futuro.
    """
    import random

    candidatos = [(idx, flow, alto) for idx, (flow, alto) in enumerate(items) if flow not in no_adelantar]

    def construir_y_mejorar(aleatorio):
        ordenados = sorted(candidatos, key=lambda t: -t[2])
        if aleatorio:
            # Reordena ligeramente los empates y bloques de tamaño
            # parecido antes de asignar — genera un punto de partida
            # distinto para que la mejora local pueda explorar otra
            # zona del espacio de soluciones y, a veces, encontrar un
            # reparto mejor que el de la asignación puramente greedy.
            ordenados = ordenados[:]
            for k in range(0, len(ordenados) - 1, 2):
                if random.random() < 0.5:
                    ordenados[k], ordenados[k + 1] = ordenados[k + 1], ordenados[k]

        columnas = []  # cada: {'capacidad': float, 'restante': float, 'items': [(idx, flow, alto)]}

        def abrir_pagina():
            cap = capacidad_pagina1 if not columnas else capacidad_normal
            columnas.append({'capacidad': cap, 'restante': cap, 'items': []})
            columnas.append({'capacidad': cap, 'restante': cap, 'items': []})

        for idx, flow, alto in ordenados:
            candidatas = [c for c in columnas if c['restante'] >= alto]
            if candidatas:
                columna = max(candidatas, key=lambda c: c['restante'])
            else:
                abrir_pagina()
                columna = max(columnas[-2:], key=lambda c: c['restante'])
            columna['items'].append((idx, flow, alto))
            columna['restante'] -= alto

        if not columnas:
            abrir_pagina()

        _mejorar_localmente(columnas)
        return columnas

    # Prueba varios puntos de partida (uno "greedy" puro + varios con
    # pequeñas variaciones aleatorias en el orden de asignación) y se
    # queda con el que, tras la mejora local, tenga menos diferencia
    # total entre columnas — la búsqueda local por sí sola puede
    # quedarse en un óptimo que no es el mejor posible; probar varios
    # puntos de partida distintos ayuda a escapar de eso.
    random.seed(12345)  # determinista: mismo catálogo -> mismo resultado siempre
    mejor_columnas, mejor_diff = None, None
    for intento in range(12):
        columnas = construir_y_mejorar(aleatorio=(intento > 0))
        diff = sum(
            abs(sum(a for _, _, a in columnas[k]['items']) - sum(a for _, _, a in columnas[k + 1]['items']))
            for k in range(0, len(columnas), 2)
        )
        if mejor_diff is None or diff < mejor_diff:
            mejor_diff, mejor_columnas = diff, columnas
    columnas = mejor_columnas

    for c in columnas:
        c['items'].sort(key=lambda t: t[0])

    paginas = []
    for i in range(0, len(columnas), 2):
        izq = [f for _, f, _ in columnas[i]['items']]
        der = [f for _, f, _ in columnas[i + 1]['items']]
        paginas.append((izq, der))
    return paginas


# ── Gráfico ilustrativo de ubicación (NO es un mapa real, ver nota) ─────
RUTA_MAPA_REAL = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                               'assets', 'mapa', 'ubicacion_orencio_matas.png')
# Posición de la nave dentro de esa captura, en fracción del ancho/alto
# de la imagen (0-1) — medida a mano sobre el marcador azul de Google
# Maps que ya trae la captura. Si se sustituye la imagen por otra
# captura distinta, hay que volver a medir este punto.
MARCADOR_FX, MARCADOR_FY = 0.526, 0.429


def _dibujar_pin(draw, cx, punta_y, radio, color_rgb, color_sombra_rgb):
    """Dibuja un pin de localización (con halo de círculos concéntricos)
    cuya PUNTA cae exactamente en (cx, punta_y) — reutilizado tanto por
    el gráfico ilustrativo como por el marcador sobre el mapa real."""
    cy = punta_y - int(radio * 2.5)
    for i in range(3):
        rr = radio + i * int(radio * 0.75)
        alpha_col = tuple(min(255, c + (255 - c) * (i + 1) / 4) for c in color_rgb)
        draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=tuple(int(c) for c in alpha_col), width=2)
    draw.polygon([(cx - radio, cy), (cx + radio, cy), (cx, punta_y)], fill=color_rgb)
    draw.ellipse((cx - radio, cy - radio, cx + radio, cy + radio), fill=color_rgb)
    r_int = int(radio * 0.45)
    draw.ellipse((cx - r_int, cy - r_int, cx + r_int, cy + r_int), fill=(255, 255, 255))
    sombra_w = radio
    draw.ellipse((cx - sombra_w, punta_y - 6, cx + sombra_w, punta_y + 6), fill=color_sombra_rgb)


def generar_grafico_ubicacion_ilustrativo(tema, ancho_px=640, alto_px=420):
    """Tarjeta ilustrativa de respaldo (pin + rejilla decorativa en los
    colores del tema) — se usa solo si no hay ninguna captura de mapa
    real disponible en `assets/mapa/`."""
    principal = colors.HexColor(tema.color_principal)
    acento = colors.HexColor(tema.color_acento)
    r, g, b = [int(v * 255) for v in (principal.red, principal.green, principal.blue)]
    claro = (min(255, int(r + (255 - r) * 0.82)), min(255, int(g + (255 - g) * 0.82)), min(255, int(b + (255 - b) * 0.82)))
    ra, ga, ba = [int(v * 255) for v in (acento.red, acento.green, acento.blue)]

    img = PILImage.new('RGB', (ancho_px, alto_px), claro)
    draw = ImageDraw.Draw(img)

    paso = max(28, min(ancho_px, alto_px) // 10)
    linea = tuple(min(255, c + 14) if c < 235 else c - 10 for c in claro)
    for x in range(0, ancho_px, paso):
        draw.line([(x, 0), (x, alto_px)], fill=linea, width=1)
    for y in range(0, alto_px, paso):
        draw.line([(0, y), (ancho_px, y)], fill=linea, width=1)
    for x in range(0, ancho_px, paso * 3):
        draw.line([(x, 0), (x, alto_px)], fill=linea, width=3)
    for y in range(0, alto_px, paso * 3):
        draw.line([(0, y), (ancho_px, y)], fill=linea, width=3)

    cx = ancho_px // 2
    radio = max(18, min(60, int(min(ancho_px, alto_px) * 0.11)))
    punta_y = int(alto_px * 0.44) + int(radio * 2.5)
    _dibujar_pin(draw, cx, punta_y, radio, (ra, ga, ba), claro)

    buf = io.BytesIO()
    img.save(buf, 'PNG')
    return buf.getvalue()


def generar_imagen_ubicacion(tema, ancho_px=640, alto_px=420):
    """Punto de entrada único para la imagen de "encuéntranos": usa la
    captura de mapa REAL si existe (`assets/mapa/ubicacion_orencio_matas.png`,
    con una chincheta dibujada encima justo sobre la nave, marcada con
    `MARCADOR_FX`/`MARCADOR_FY`), y si no cae al gráfico ilustrativo de
    respaldo. La foto se encaja ENTERA dentro del lienzo (sin recortar
    ni deformar) — si la proporción pedida no coincide con la de la
    foto, se añade un margen de color a los lados, nunca se estira."""
    if not os.path.exists(RUTA_MAPA_REAL):
        return generar_grafico_ubicacion_ilustrativo(tema, ancho_px, alto_px)

    acento = colors.HexColor(tema.color_acento)
    ra, ga, ba = [int(v * 255) for v in (acento.red, acento.green, acento.blue)]

    base = PILImage.open(RUTA_MAPA_REAL).convert('RGB')
    bw, bh = base.size
    fondo = (245, 242, 235)  # tono neutro parecido al del propio mapa
    lienzo = PILImage.new('RGB', (ancho_px, alto_px), fondo)
    escala = min(ancho_px / bw, alto_px / bh)
    nueva_w, nueva_h = max(1, int(bw * escala)), max(1, int(bh * escala))
    base_r = base.resize((nueva_w, nueva_h), PILImage.LANCZOS)
    off_x, off_y = (ancho_px - nueva_w) // 2, (alto_px - nueva_h) // 2
    lienzo.paste(base_r, (off_x, off_y))

    draw = ImageDraw.Draw(lienzo)
    mx = off_x + MARCADOR_FX * nueva_w
    my = off_y + MARCADOR_FY * nueva_h
    radio = max(10, min(34, int(min(ancho_px, alto_px) * 0.06)))
    _dibujar_pin(draw, int(mx), int(my), radio, (ra, ga, ba), fondo)

    buf = io.BytesIO()
    lienzo.save(buf, 'PNG')
    return buf.getvalue()




# ── Relleno decorativo (banners tipo folleto, cuando ni agrandar la ──────
# imagen ni el aire dentro de la caja bastan para llegar al final) ──────
_contador_relleno = {'i': 0}


def construir_relleno_decorativo(tema, st, logo_png, ancho, alto_objetivo, descuento_max=0):
    """Bloque decorativo "de folleto" (banner de ahorro, invitación a la
    web, o logo grande) dimensionado para ocupar aproximadamente
    `alto_objetivo` — se usa como ÚLTIMO recurso cuando ni agrandar la
    imagen del último producto ni el aire dentro de su caja bastan para
    llegar al final de la columna. Rota entre 3 variantes (con semilla
    determinista, no aleatoria) para que no se repita siempre la misma
    si hacen falta varias en el mismo catálogo."""
    _contador_relleno['i'] += 1
    variantes = ['ahorro', 'web', 'logo'] if descuento_max > 0 else ['web', 'logo']
    tipo = variantes[_contador_relleno['i'] % len(variantes)]

    contenido = []
    if tipo == 'ahorro':
        relleno_fondo = _c(tema.color_acento)
        borde = relleno_fondo
        est_tit = ParagraphStyle('reo_t', fontName='Helvetica-Bold', fontSize=13, textColor=colors.white,
                                  alignment=TA_CENTER, leading=16)
        est_pct = ParagraphStyle('reo_p', fontName='Helvetica-Bold', fontSize=40, textColor=colors.white,
                                  alignment=TA_CENTER, leading=44)
        est_sub = ParagraphStyle('reo_s', fontName='Helvetica', fontSize=9, textColor=colors.white,
                                  alignment=TA_CENTER, leading=12)
        contenido += [
            Paragraph('¡AHORRA HASTA!', est_tit),
            Paragraph(f'-{int(descuento_max)}%', est_pct),
            Paragraph('en productos seleccionados de este catálogo', est_sub),
        ]
    elif tipo == 'web':
        relleno_fondo = _c(tema.color_principal)
        borde = _c(tema.color_acento)
        color_txt = _c(tema.color_texto_sobre_principal)
        if logo_png and os.path.exists(logo_png):
            with PILImage.open(logo_png) as im:
                ratio = im.height / im.width
            img = RLImage(logo_png, width=18 * mm, height=18 * mm * ratio)
            img.hAlign = 'CENTER'
            contenido.append(img)
            contenido.append(Spacer(1, 4 * mm))
        est_tit = ParagraphStyle('reo_wt', fontName='Helvetica-Bold', fontSize=10, textColor=color_txt,
                                  alignment=TA_CENTER, leading=13)
        est_web = ParagraphStyle('reo_ww', fontName='Helvetica-Bold', fontSize=19, textColor=_c(tema.color_acento),
                                  alignment=TA_CENTER, leading=23)
        contenido += [
            Paragraph('DESCUBRE TODO NUESTRO CATÁLOGO EN', est_tit),
            Spacer(1, 2 * mm),
            Paragraph('orenciomatas.es', est_web),
        ]
    else:
        relleno_fondo = COLOR_FONDO
        borde = _c(tema.color_acento)
        if logo_png and os.path.exists(logo_png):
            with PILImage.open(logo_png) as im:
                ratio = im.height / im.width
            ancho_logo = min(34 * mm, ancho * 0.42)
            img = RLImage(logo_png, width=ancho_logo, height=ancho_logo * ratio)
            img.hAlign = 'CENTER'
            contenido.append(img)
            contenido.append(Spacer(1, 4 * mm))
        est_tag = ParagraphStyle('reo_lt', fontName='Helvetica-Bold', fontSize=9.5, textColor=COLOR_GRIS,
                                  alignment=TA_CENTER, leading=13)
        contenido.append(Paragraph('SUMINISTROS PARA TALLERES Y CARROCERÍAS', est_tag))

    tabla = Table([[contenido]], colWidths=[ancho])
    tabla.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    _, alto_natural = tabla.wrap(ancho, 100000)
    extra = max(0.0, alto_objetivo - alto_natural)
    if extra > 0:
        tabla.setStyle(TableStyle([
            ('TOPPADDING', (0, 0), (-1, -1), 6 + extra / 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6 + extra / 2),
        ]))
    return CajaRedondeada(tabla, borde, radio=5, grosor=1, relleno=relleno_fondo)


# ── Cierre: se trata como una caja más dentro del reparto de columnas ───
def construir_caja_cierre(tema, st, logo_png, ancho, alto_objetivo=None):
    """Devuelve una CajaRedondeada con la info de contacto + gráfico de
    ubicación, dimensionada al ancho de UNA columna.

    Si se indica `alto_objetivo`, el gráfico de ubicación se REGENERA
    con las proporciones exactas que necesite (no se estira una imagen
    ya hecha — eso deformaba el pin/círculos en una elipse) para que la
    caja entera ocupe esa altura exacta — así se puede hacer que el
    cierre rellene justo el hueco que quede libre en la última página,
    en vez de tener una altura fija que unas veces sobra y otras
    falta."""
    fijo = []
    if logo_png and os.path.exists(logo_png):
        with PILImage.open(logo_png) as im:
            ratio = im.height / im.width
        fijo.append(RLImage(logo_png, width=16 * mm, height=16 * mm * ratio))
        fijo.append(Spacer(1, 3 * mm))

    fijo.append(Paragraph('¿Necesitas más información?', st['cierre_titulo']))
    fijo.append(Paragraph(tema.texto_cierre, st['cierre_texto']))
    fijo.append(Spacer(1, 4 * mm))
    fijo.append(Paragraph('ORENCIO MATAS Y HERMANOS, S.L.', st['cierre_direccion']))
    fijo.append(Paragraph('Av. Alfred Nobel, 2 · 13005 Ciudad Real', st['cierre_texto']))
    fijo.append(Spacer(1, 2 * mm))
    fijo.append(Paragraph('Tel. 926 221 217', st['cierre_texto']))
    fijo.append(Paragraph('correo@orenciomatas.es · orenciomatas.es', st['cierre_texto']))
    fijo.append(Spacer(1, 5 * mm))
    fijo.append(Paragraph('ENCUÉNTRANOS', ParagraphStyle(
        'encnos', fontName='Helvetica-Bold', fontSize=9.5, textColor=_c(tema.color_acento),
        alignment=TA_LEFT, spaceAfter=3)))
    hay_mapa_real = os.path.exists(RUTA_MAPA_REAL)
    nota = Paragraph(
        'Chincheta orientativa sobre la ubicación de la nave.' if hay_mapa_real
        else 'Ilustración orientativa — mapa real pendiente de sustituir por una captura.',
        st['nota'])

    ancho_grafico = ancho - 6 * mm
    ratio_grafico = 420 / 640
    alto_grafico_normal = ancho_grafico * ratio_grafico

    if alto_objetivo:
        # Mide el bloque fijo (todo menos el gráfico) para saber cuánto
        # espacio le queda disponible al gráfico.
        tabla_fijo = Table([[fijo + [Spacer(1, 2 * mm), nota]]], colWidths=[ancho])
        tabla_fijo.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        _, alto_fijo_sin_grafico = tabla_fijo.wrap(ancho, 100000)
        alto_grafico = max(30 * mm, min(alto_objetivo - alto_fijo_sin_grafico, 180 * mm))
    else:
        alto_grafico = alto_grafico_normal

    grafico = generar_imagen_ubicacion(tema, ancho_px=640, alto_px=max(200, int(round(640 * alto_grafico / ancho_grafico))))
    contenido = fijo + [RLImage(io.BytesIO(grafico), width=ancho_grafico, height=alto_grafico),
                         Spacer(1, 2 * mm), nota]

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
    `planificar_columnas()` respeta esa restricción, pero SÍ puede
    reordenar en qué página/columna cae cada caja de familia (con
    permiso explícito de Eloy) para maximizar el aprovechamiento del
    espacio — busca por programación dinámica, entre TODAS las
    familias que queden por colocar, la combinación que mejor llene y
    mejor iguale cada columna.
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

    descuento_max_global = 0.0
    for bloque in bloques:
        for elemento in bloque.elementos:
            if not isinstance(elemento, ElementoGrid):
                continue
            for p in elemento.productos:
                if p.oferta and p.descuento_pct and float(p.descuento_pct) > descuento_max_global:
                    descuento_max_global = float(p.descuento_pct)

    alto_pagina1 = (FRAME_TOP - HEADER_BOX_H) - FRAME_BOTTOM
    alto_normal = FRAME_TOP - FRAME_BOTTOM

    # Margen de seguridad al PLANIFICAR (no al tamaño real de los
    # frames): sin él, el reparto podía calcular un ajuste casi exacto
    # al límite de la columna (a veces con menos de 2pt de margen) —
    # cualquier mínima diferencia entre lo medido (Table.wrap) y lo que
    # ReportLab renderiza de verdad al construir el documento final
    # bastaba para desbordar una familia a la columna/página
    # siguiente, descolocando todo lo que venía detrás. Restar unos
    # puntos de margen aquí evita ese problema sin cambiar el tamaño
    # real de página.
    MARGEN_SEGURIDAD = 15
    paginas = planificar_columnas(tablas, alto_pagina1 - MARGEN_SEGURIDAD, alto_normal - MARGEN_SEGURIDAD)

    cap_ultima = (alto_pagina1 if len(paginas) == 1 else alto_normal) - MARGEN_SEGURIDAD
    ALTURA_MINIMA_CIERRE = construir_caja_cierre(tema, st, logo_png, COL_W, alto_objetivo=1).wrap(COL_W, 100000)[1]

    # El cierre tiene un tamaño mínimo real (todo su texto fijo + un
    # gráfico mínimo) — si el hueco natural entre columnas de la última
    # página es MENOR que ese mínimo, añadir el cierre igualmente
    # "se pasa" y deja la otra columna con un hueco nuevo, en vez de
    # arreglar el que había. Por eso la última página se REPARTE
    # aparte, reservando de entrada el hueco mínimo del cierre en la
    # columna derecha, en vez de repartir las familias primero y
    # encajar el cierre después.
    alturas_por_id = {id(c): h for c, h in tablas}
    orden_por_id = {id(c): i for i, (c, _) in enumerate(tablas)}
    items_ultima = sorted(paginas[-1][0] + paginas[-1][1], key=lambda f: -alturas_por_id[id(f)])

    cap_izq = cap_ultima
    cap_der = max(cap_ultima - ALTURA_MINIMA_CIERRE - 2.5 * mm, ALTURA_MINIMA_CIERRE)
    bin_izq = {'restante': cap_izq, 'items': []}
    bin_der = {'restante': cap_der, 'items': []}
    for f in items_ultima:
        h = alturas_por_id[id(f)]
        candidatas = [b for b in (bin_izq, bin_der) if b['restante'] >= h]
        b = max(candidatas, key=lambda b: b['restante']) if candidatas else max((bin_izq, bin_der), key=lambda b: b['restante'])
        b['items'].append(f)
        b['restante'] -= h

    izq_ultima = sorted(bin_izq['items'], key=lambda f: orden_por_id[id(f)])
    der_ultima = sorted(bin_der['items'], key=lambda f: orden_por_id[id(f)])

    # Prioridad máxima: que cada columna llegue hasta abajo de página,
    # en TODAS las páginas (no solo en la última, que ya lo consigue
    # con el cierre elástico). Se hace estirando la imagen de la ÚLTIMA
    # familia de cada columna (búsqueda binaria sobre su tamaño, ver
    # `construir_tabla_familia_ajustada`) hasta que la columna entera
    # llegue lo más cerca posible del límite real de la página.
    bloque_por_caja_id = {id(caja): bloque for (caja, _), bloque in zip(tablas, bloques)}

    def estirar_ultima_de_columna(lista_cajas, capacidad, permitir_relleno_decorativo=True):
        if not lista_cajas:
            return lista_cajas
        resto, ultimo = lista_cajas[:-1], lista_cajas[-1]
        bloque_ultimo = bloque_por_caja_id.get(id(ultimo))
        if bloque_ultimo is None:
            return lista_cajas
        otras_alturas = sum(alturas_por_id.get(id(c), 0.0) for c in resto)
        objetivo_ultimo = capacidad - otras_alturas - (2.5 * mm if resto else 0.0)
        nueva = construir_tabla_familia_ajustada(bloque_ultimo, tema, st, tema.cols_grid, COL_W,
                                                  logo_png, objetivo_ultimo)
        resultado = resto + [nueva]

        # Si ni agrandar la imagen ni el aire dentro de la caja bastan
        # para llegar al objetivo (límite real de mantener la
        # proporción de una foto), el resto del hueco se rellena con
        # un banner llamativo tipo folleto (ahorro / web / logo) en vez
        # de dejarlo en blanco — "hay que aprovechar los espacios".
        # (No se aplica en la columna izquierda de la ÚLTIMA página:
        # ahí el hueco lo mide y lo llena el cierre elástico justo
        # después, y añadir aquí también un relleno descuadraba ese
        # cálculo — verificado con un catálogo de solo 2 productos.)
        if permitir_relleno_decorativo:
            _, alto_nueva = nueva.wrap(COL_W, 100000)
            hueco_restante = objetivo_ultimo - alto_nueva - 2.5 * mm
            if hueco_restante > 18 * mm:
                relleno = construir_relleno_decorativo(tema, st, logo_png, COL_W, hueco_restante,
                                                         descuento_max=descuento_max_global)
                resultado.append(relleno)
        return resultado

    # La columna IZQUIERDA de la última página se estira ANTES de medir
    # el hueco para el cierre — si se hiciera al revés (calcular el
    # tamaño del cierre primero y estirar la izquierda después, como en
    # una versión anterior), el cierre quedaba dimensionado para una
    # izquierda que luego crecía, y las dos columnas volvían a quedar
    # descuadradas.
    izq_ultima = estirar_ultima_de_columna(izq_ultima, cap_ultima, permitir_relleno_decorativo=False)
    hi = 0.0
    for c in izq_ultima:
        if id(c) in alturas_por_id:
            hi += alturas_por_id[id(c)]
        else:
            hi += c.wrap(COL_W, 100000)[1] + 2.5 * mm
    hd = sum(alturas_por_id[id(c)] for c in der_ultima)

    objetivo = max(hi - hd, ALTURA_MINIMA_CIERRE)
    objetivo = min(objetivo, max(cap_ultima - hd, ALTURA_MINIMA_CIERRE))
    caja_cierre = construir_caja_cierre(tema, st, logo_png, COL_W, alto_objetivo=objetivo)
    paginas[-1] = (izq_ultima, der_ultima)

    for idx in range(len(paginas) - 1):
        capacidad_pagina = (alto_pagina1 if idx == 0 else alto_normal) - MARGEN_SEGURIDAD
        izq_p, der_p = paginas[idx]
        izq_p = estirar_ultima_de_columna(izq_p, capacidad_pagina)
        der_p = estirar_ultima_de_columna(der_p, capacidad_pagina)
        paginas[idx] = (izq_p, der_p)

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
        if idx == len(paginas) - 1:
            story.append(caja_cierre)
        else:
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
