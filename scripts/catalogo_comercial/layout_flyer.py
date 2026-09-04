"""
Motor de layout "folleto denso" V4 — catálogo comercial de talleres.

A petición explícita de Eloy tras ver que la V3 (editorial, sin cajas,
mucho aire) no llegaba al objetivo real: replica de cerca el prototipo
de referencia (folleto de supermercado — Lidl/Aldi style) que se
compartió al principio del proyecto. Rejilla DENSA de tarjetas con
borde, cabeceras de categoría con corte diagonal, precio en pegatina
roja sólida y cinta de descuento en la esquina de cada foto.

Arquitectura: igual que V3 (una sola columna a todo el ancho, flujo
natural, ReportLab pagina solo) pero con tarjetas de tamaño UNIFORME
en vez de layouts asimétricos de héroe — con tarjetas del mismo
tamaño, las filas de la rejilla se autoalinean sin necesitar ningún
algoritmo de reparto ni balanceo (la lección más cara de las v1/v2).
"""
from __future__ import annotations

import io
import os
from decimal import Decimal

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, FrameBreak, PageBreak,
                                 Paragraph, Spacer, Table, TableStyle, Image as RLImage,
                                 Flowable, KeepTogether)

from .composicion import ElementoGrid
from .imagenes import imagen_para_producto, pil_to_bytes, preparar_para_incrustar
from .render_pdf import CajaRedondeada
from .layout_engine import generar_imagen_ubicacion  # mapa real + chincheta ya validados

W, H = A4
MARGIN = 7 * mm
CW = W - 2 * MARGIN
TOP_BAR_H = 15 * mm
BOTTOM_BAR_H = 10 * mm
FRAME_TOP = H - TOP_BAR_H - 1.5 * mm
FRAME_BOTTOM = BOTTOM_BAR_H + 1.5 * mm

COLOR_CABECERA = '#3E4A56'   # gris azulado oscuro — mismo tono que el prototipo
COLOR_PRECIO = '#D91B1B'
COLOR_DESCUENTO = '#F4B400'  # amarillo — resalta las tarjetas con oferta
COLOR_BORDE_TARJETA = '#D8DCE1'
COLOR_FONDO_OFERTA = '#FFF7E0'  # tinte cálido muy suave, solo para tarjetas con descuento


def _c(hexcolor):
    return colors.HexColor(hexcolor)


def _fmt(d) -> str:
    if d is None:
        return '0,00'
    return f'{Decimal(d):.2f}'.replace('.', ',')


# ── Banda de categoría con corte diagonal (chevron) ──────────────────────
class BandaCategoria(Flowable):
    """Cabecera de categoría con un corte diagonal al final (como una
    flecha/chevron) — el detalle que más distingue visualmente al
    prototipo de referencia de una banda de color plana y corriente."""

    def __init__(self, texto, ancho, alto=7.5 * mm, color_fondo=COLOR_CABECERA, color_texto=colors.white):
        Flowable.__init__(self)
        self.texto = texto
        self.width = ancho
        self.height = alto
        self.color_fondo = color_fondo
        self.color_texto = color_texto

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.saveState()
        corte = self.height * 0.85
        w_rect = self.width - corte
        c.setFillColor(_c(self.color_fondo))
        c.rect(0, 0, w_rect, self.height, fill=1, stroke=0)
        # Franja roja de acento a la izquierda + punta del chevron en
        # rojo — dos toques de color para que la banda no sea un único
        # tono plano de gris (petición de Eloy: "en general sigue
        # siendo muy plano").
        acento = 2.3 * mm
        c.setFillColor(_c(COLOR_PRECIO))
        c.rect(0, 0, acento, self.height, fill=1, stroke=0)
        p = c.beginPath()
        p.moveTo(w_rect, 0)
        p.lineTo(self.width, self.height / 2)
        p.lineTo(w_rect, self.height)
        p.close()
        c.setFillColor(_c(COLOR_PRECIO))
        c.drawPath(p, fill=1, stroke=0)
        c.setFillColor(self.color_texto)
        c.setFont('Helvetica-Bold', self.height * 0.46)
        c.drawString(3.5 * mm, self.height * 0.32, self.texto.upper())
        c.restoreState()


# ── Precio en pegatina roja sólida (igual estilo que el prototipo) ──────
def sticker_precio_flyer(p, ancho, alto=9 * mm):
    """El precio final va en la pegatina roja sólida. Si hay descuento,
    el precio tachado se muestra ENCIMA, sobre fondo blanco — dentro de
    la propia pegatina roja un tachado en gris apenas se leía (contraste
    insuficiente), y así además coincide con cómo lo hace el prototipo
    de referencia."""
    hay_oferta = bool(p.oferta and p.descuento_pct and p.descuento_pct > 0)
    precio_mostrar = p.precio_final_con_iva if hay_oferta else p.precio_con_iva
    est_precio = ParagraphStyle('spf', fontName='Helvetica-Bold', fontSize=alto * 0.34, textColor=colors.white,
                                 alignment=TA_CENTER, leading=alto * 0.38)
    piezas = []
    if hay_oferta:
        est_tach = ParagraphStyle('spft', fontName='Helvetica-Bold', fontSize=alto * 0.19, textColor=_c('#8A9099'),
                                   alignment=TA_CENTER, leading=alto * 0.24)
        piezas.append(Paragraph(f'<strike>{_fmt(p.precio_con_iva)} €</strike>', est_tach))
        piezas.append(Spacer(1, 0.6 * mm))
    t = Table([[Paragraph(f'{_fmt(precio_mostrar)} €', est_precio)]], colWidths=[ancho])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(COLOR_PRECIO)),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 2), ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))
    piezas.append(t)
    return piezas


# ── Tarjeta de producto — imagen (con cinta de descuento ya incrustada ──
# por imagenes.py) + nombre + precio, dentro de una caja con borde. ──────
# Todas las medidas internas (etiqueta, nombre, precio) son de ALTURA
# FIJA — así todas las tarjetas del catálogo miden exactamente lo
# mismo, tenga el producto un nombre corto o uno que ocupe 2 líneas.
# Antes cada tarjeta se ajustaba a su propio contenido y la fila entera
# se estiraba a la más alta, dejando aire suelto dentro de las tarjetas
# más cortas (bug real señalado por Eloy: "las cajas no tienen los
# mismos tamaños").
ALTO_ETIQUETA_FAM = 6.2 * mm
ALTO_NOMBRE = 8.4 * mm
ALTO_PRECIO = 9.5 * mm


def tarjeta_producto(p, ancho, alto_img=32 * mm, etiqueta_familia=None):
    hay_oferta = bool(p.oferta and p.descuento_pct and p.descuento_pct > 0)
    pil = imagen_para_producto(p, tamano=500, cuadrado=True)  # ya trae la cinta roja si hay oferta
    iw, ih = pil.size
    cel_w, cel_h = ancho - 4 * mm, alto_img
    ratio = min(cel_w / iw, cel_h / ih)
    aw, ah = iw * ratio, ih * ratio
    pil = preparar_para_incrustar(pil, aw, ah)
    img = RLImage(io.BytesIO(pil_to_bytes(pil)), width=aw, height=ah)
    celda_img = Table([[img]], colWidths=[ancho], rowHeights=[alto_img])
    celda_img.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                                    ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))

    est_nombre = ParagraphStyle('tn', fontName='Helvetica-Bold', fontSize=7, textColor=_c('#23262B'),
                                 alignment=TA_CENTER, leading=8.2)
    est_ref = ParagraphStyle('tr', fontName='Helvetica', fontSize=5.5, textColor=_c('#9AA0A6'),
                              alignment=TA_CENTER, leading=6.8)
    celda_nombre = Table([[[Paragraph(p.nombre, est_nombre), Paragraph(f'Ref: {p.referencia}', est_ref)]]],
                          colWidths=[ancho], rowHeights=[ALTO_NOMBRE])
    celda_nombre.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                                       ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))

    celda_precio = Table([[sticker_precio_flyer(p, ancho - 5 * mm)]], colWidths=[ancho], rowHeights=[ALTO_PRECIO])
    celda_precio.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
                                       ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))

    contenido = []
    if etiqueta_familia:
        # Tarjetas "sueltas" (familias con menos productos que columnas
        # tiene la rejilla, agrupadas juntas para no dejar huecos — ver
        # `agrupar_sueltos`): sin banda de categoría propia, así que el
        # nombre de familia va integrado como una etiqueta pequeña de
        # altura fija dentro de la tarjeta.
        est_fam = ParagraphStyle('tf', fontName='Helvetica-Bold', fontSize=5.8, textColor=_c(COLOR_CABECERA),
                                  alignment=TA_CENTER, leading=7)
        celda_etiq = Table([[Paragraph(etiqueta_familia.upper(), est_fam)]], colWidths=[ancho],
                            rowHeights=[ALTO_ETIQUETA_FAM])
        celda_etiq.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                                         ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
        contenido.append(celda_etiq)
    contenido += [celda_img, Spacer(1, 1 * mm), celda_nombre, Spacer(1, 1 * mm), celda_precio]
    tabla = Table([[contenido]], colWidths=[ancho])
    tabla.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2.5), ('RIGHTPADDING', (0, 0), (-1, -1), 2.5),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    # Las tarjetas con oferta real se resaltan con borde rojo más
    # grueso y un tinte de fondo cálido muy suave — a petición de
    # Eloy ("a los productos con descuento que esté más resaltado o
    # llamativo"), para que no queden con el mismo peso visual que un
    # producto sin ninguna oferta.
    if hay_oferta:
        return CajaRedondeada(tabla, _c(COLOR_PRECIO), radio=3, grosor=1.6, relleno=_c(COLOR_FONDO_OFERTA))
    return CajaRedondeada(tabla, _c(COLOR_BORDE_TARJETA), radio=3, grosor=0.8)


_contador_relleno_flyer = {'i': 0}


# Colores reales extraídos del logo corporativo (no inventados — medidos
# de los píxeles del propio archivo `assets/logos/logo_calidad.svg`) para
# que los bloques de relleno usen la paleta de marca real, no un genérico
# gris plano — petición de Eloy: "que tuvieran un color de los del logo
# corporativos... algo que enganche y sea llamativo".
COLOR_LOGO_ROJO = '#DC1414'
COLOR_LOGO_NARANJA = '#F0A000'
COLOR_LOGO_TEAL = '#0078A0'
COLOR_LOGO_VERDE = '#008C50'
PALETA_LOGO = [COLOR_LOGO_ROJO, COLOR_LOGO_TEAL, COLOR_LOGO_NARANJA, COLOR_LOGO_VERDE]


def tarjeta_relleno(ancho, alto_img=32 * mm, logo_png=None, con_etiqueta=False):
    """Tarjeta decorativa para rellenar huecos en filas incompletas —
    a petición de Eloy ("necesito llenar los espacios en blanco...
    en general no quiero que haya huecos en blanco"). Rota entre 3
    variantes deterministas (eslogan de gancho, icono grande de "%",
    logo de la empresa) y mide EXACTAMENTE lo mismo que una tarjeta de
    producto normal, para que la rejilla no se descuadre. Las tres
    variantes usan la paleta REAL del logo (`PALETA_LOGO`) y el propio
    logo aparece también en el eslogan, no solo en su propia variante
    — antes el eslogan era texto plano sobre un único gris, "muy
    plano" según Eloy."""
    _contador_relleno_flyer['i'] += 1
    tipo = ['eslogan', 'porcentaje', 'logo'][_contador_relleno_flyer['i'] % 3]
    color_rotativo = PALETA_LOGO[(_contador_relleno_flyer['i'] // 3) % len(PALETA_LOGO)]
    alto_hueco = ALTO_ETIQUETA_FAM + 1 * mm if con_etiqueta else 0
    alto_total = alto_hueco + alto_img + 1 * mm + ALTO_NOMBRE + 1 * mm + ALTO_PRECIO

    def _logo_flowable(ancho_logo):
        if not (logo_png and os.path.exists(logo_png)):
            return None
        with PILImage.open(logo_png) as im:
            ratio = im.height / im.width
        img_logo = RLImage(logo_png, width=ancho_logo, height=ancho_logo * ratio)
        img_logo.hAlign = 'CENTER'
        return img_logo

    if tipo == 'eslogan':
        frases = ['¡NO TE LO\nPIERDAS!', '¡APROVECHA\nAHORA!', 'CALIDAD Y\nBUEN PRECIO', '¡OFERTA\nESPECIAL!']
        frase = frases[(_contador_relleno_flyer['i'] // 3) % len(frases)].replace('\n', '<br/>')
        est = ParagraphStyle('trf', fontName='Helvetica-Bold', fontSize=12.5, textColor=colors.white,
                              alignment=TA_CENTER, leading=15)
        contenido = []
        logo_flow = _logo_flowable(14 * mm)
        if logo_flow:
            contenido += [logo_flow, Spacer(1, 2.5 * mm)]
        contenido.append(Paragraph(frase, est))
        fondo, borde = _c(color_rotativo), _c(color_rotativo)
    elif tipo == 'porcentaje':
        est_pct = ParagraphStyle('trp', fontName='Helvetica-Bold', fontSize=32, textColor=colors.white,
                                  alignment=TA_CENTER, leading=34)
        est_sub = ParagraphStyle('trs', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white,
                                  alignment=TA_CENTER, leading=11)
        contenido = [Paragraph('%', est_pct), Spacer(1, 1 * mm), Paragraph('OFERTAS<br/>DEL MES', est_sub)]
        fondo, borde = _c(COLOR_LOGO_NARANJA), _c(COLOR_LOGO_NARANJA)
    else:  # logo
        piezas = []
        logo_flow = _logo_flowable(min(22 * mm, ancho * 0.55))
        if logo_flow:
            piezas += [logo_flow, Spacer(1, 3 * mm)]
        est_web = ParagraphStyle('trw', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white,
                                  alignment=TA_CENTER, leading=11)
        piezas.append(Paragraph('orenciomatas.es', est_web))
        contenido = piezas
        fondo, borde = _c(COLOR_CABECERA), _c(COLOR_CABECERA)

    celda = Table([[contenido]], colWidths=[ancho], rowHeights=[alto_total])
    celda.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                                ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
    tabla = Table([[celda]], colWidths=[ancho])
    tabla.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 2.5), ('RIGHTPADDING', (0, 0), (-1, -1), 2.5),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    return CajaRedondeada(tabla, borde, radio=3, grosor=1.0, relleno=fondo)




def _fila_con_relleno(tarjetas, cols, ancho_col, alto_img=32 * mm, logo_png=None, con_etiqueta=False, centrar=True):
    faltan = cols - len(tarjetas)
    if faltan <= 0:
        return tarjetas
    rellenos = [tarjeta_relleno(ancho_col, alto_img, logo_png, con_etiqueta) for _ in range(faltan)]
    if centrar:
        izq = faltan // 2
    else:
        izq = 0
    return rellenos[:izq] + tarjetas + rellenos[izq:]


def grid_categoria(bloque, ancho, cols=4, alto_img=32 * mm, productos=None, logo_png=None):
    """Cabecera de categoría + rejilla de tarjetas — la cabecera va
    unida (KeepTogether) a la PRIMERA fila de tarjetas para que nunca
    quede huérfana al final de una página. Recibe `productos` ya
    filtrado (solo las filas COMPLETAS de esa familia — ver
    `preparar_grupos`); lo que sobre de esa familia sin llegar a llenar
    una fila entera se agrupa aparte con sobras de otras familias (ver
    `agrupar_sueltos`) para no dejar ninguna fila a medias."""
    if productos is None:
        productos = [p for e in bloque.elementos if isinstance(e, ElementoGrid) for p in e.productos]
    if not productos:
        return []
    ancho_col = ancho / cols
    filas = []
    fila_actual = []
    for p in productos:
        fila_actual.append(tarjeta_producto(p, ancho_col, alto_img))
        if len(fila_actual) == cols:
            filas.append(fila_actual)
            fila_actual = []
    if fila_actual:
        filas.append(_fila_con_relleno(fila_actual, cols, ancho_col, alto_img, logo_png))

    banda = BandaCategoria(bloque.familia, ancho)
    estilo_fila = TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 1), ('RIGHTPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ])
    primera_fila = Table([filas[0]], colWidths=[ancho_col] * cols)
    primera_fila.setStyle(estilo_fila)
    resultado = [KeepTogether([banda, Spacer(1, 1.2 * mm), primera_fila])]
    if len(filas) > 1:
        resto = Table(filas[1:], colWidths=[ancho_col] * cols)
        resto.setStyle(estilo_fila)
        resultado.append(resto)
    resultado.append(Spacer(1, 2 * mm))
    return resultado


def preparar_grupos(bloques, cols):
    """Separa las familias en (a) las que tienen 2 o más productos —
    se quedan con su banda de categoría propia, mostrando TODOS sus
    productos (aunque la última fila no llegue a llenar la rejilla
    entera, centrada) — y (b) las familias de UN SOLO producto, que se
    agrupan aparte sin banda propia (ver `agrupar_sueltos`) para no
    dejar 3 de 4 columnas en blanco al lado de una única tarjeta.

    Se probó antes a generalizar esto también a los RESTOS de familias
    grandes (p.ej. agrupar los 2 productos que sobran de una familia
    de 6 junto con otras familias pequeñas) — el resultado, con un
    catálogo real de muchas familias pequeñas, era que casi ninguna
    familia conservaba su propia banda (Eloy: "solo aparece Herramientas,
    el resto no aparecen") — la categoría dejaba de leerse como tal.
    Revertido: cada familia con 2+ productos SIEMPRE tiene su propia
    banda visible, aunque eso implique algo de espacio sin usar al
    final de su última fila — la identidad de cada categoría importa
    más que apurar el último milímetro."""
    completas = []
    pool = []
    for b in bloques:
        productos = [p for e in b.elementos if isinstance(e, ElementoGrid) for p in e.productos]
        if not productos:
            continue
        if len(productos) >= 2:
            completas.append((b, productos))
        else:
            for p in productos:
                pool.append((p, b.familia))
    return completas, pool


def agrupar_sueltos(pool, ancho, cols=4, alto_img=32 * mm, logo_png=None):
    """Reparte en una rejilla compartida todo lo que no llegó a llenar
    una fila completa de su propia familia (`pool`, lista de
    (producto, nombre_familia)) — sin banda de categoría propia, cada
    tarjeta lleva su nombre de familia como etiqueta interna. Justo lo
    que pidió Eloy: 'acopla productos que solo haya uno de la familia
    al lado de otros en su misma situación' — generalizado a CUALQUIER
    sobra de fila, no solo a familias enteras de un único producto."""
    if not pool:
        return []
    ancho_col = ancho / cols
    tarjetas = [tarjeta_producto(p, ancho_col, alto_img, etiqueta_familia=nombre_fam) for p, nombre_fam in pool]

    filas = []
    fila_actual = []
    for t in tarjetas:
        fila_actual.append(t)
        if len(fila_actual) == cols:
            filas.append(fila_actual)
            fila_actual = []
    if fila_actual:
        filas.append(_fila_con_relleno(fila_actual, cols, ancho_col, alto_img, logo_png,
                                        con_etiqueta=True, centrar=False))

    estilo_fila = TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 1), ('RIGHTPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ])
    tabla = Table(filas, colWidths=[ancho_col] * cols)
    tabla.setStyle(estilo_fila)
    return [tabla, Spacer(1, 2 * mm)]


# ── Cabecera / pie ────────────────────────────────────────────────────
def banner_eslogan(texto, ancho, alto=8 * mm):
    """Banda de eslogan llamativa — a petición de Eloy ("incluir algún
    texto... indicando que aproveche la oportunidad"), se inserta entre
    bloques de productos para romper la monotonía visual de la rejilla,
    no solo en el pie de página."""
    est = ParagraphStyle('be', fontName='Helvetica-Bold', fontSize=10, textColor=colors.white,
                          alignment=TA_CENTER, leading=alto * 0.85 / mm)
    t = Table([[Paragraph(texto, est)]], colWidths=[ancho], rowHeights=[alto])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(COLOR_PRECIO)),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return t


def make_header_footer(logo_png, tema, periodo):
    def hf(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(colors.white)
        canvas.rect(0, 0, W, H, fill=1, stroke=0)
        if logo_png and os.path.exists(logo_png):
            with PILImage.open(logo_png) as im:
                ratio = im.height / im.width
            ch = 9 * mm
            canvas.drawImage(logo_png, MARGIN, H - TOP_BAR_H + (TOP_BAR_H - ch) / 2 - 1.5 * mm,
                              height=ch, width=ch / ratio, preserveAspectRatio=True, mask='auto')
            tx = MARGIN + ch / ratio + 4 * mm
        else:
            tx = MARGIN
        canvas.setFillColor(_c(COLOR_CABECERA))
        canvas.setFont('Helvetica-Bold', 10.5)
        canvas.drawString(tx, H - 10 * mm, 'ORENCIO MATAS Y HERMANOS')
        canvas.setFillColor(_c(COLOR_PRECIO))
        canvas.setFont('Helvetica-Bold', 8.5)
        canvas.drawRightString(W - MARGIN, H - 10 * mm, periodo.etiqueta.upper())
        canvas.setStrokeColor(_c(COLOR_CABECERA))
        canvas.setLineWidth(1.4)
        canvas.line(MARGIN, H - TOP_BAR_H + 1.5 * mm, W - MARGIN, H - TOP_BAR_H + 1.5 * mm)

        canvas.setFillColor(_c(COLOR_PRECIO))
        canvas.rect(0, 0, W, BOTTOM_BAR_H, fill=1, stroke=0)
        canvas.setFillColor(colors.white)
        canvas.setFont('Helvetica-Bold', 8.5)
        canvas.drawCentredString(W / 2, BOTTOM_BAR_H - 4.3 * mm,
                                  '¡OFERTAS POR TIEMPO LIMITADO — APROVÉCHALAS ANTES DE QUE SE AGOTEN!')
        canvas.setFont('Helvetica', 5.6)
        canvas.setFillColor(_c('#FFD9D9'))
        canvas.drawCentredString(W / 2, BOTTOM_BAR_H - 8 * mm,
                                  'Ofertas válidas hasta agotar existencias. Precios sujetos a cambios. · '
                                  'Orencio Matas y Hnos, S.L. · 926 221 217 · orenciomatas.es · '
                                  f'Pág. {doc.page}')
        canvas.restoreState()
    return hf


# ── Portada — banda de marca + titular + estallido de descuento ─────────
def construir_portada(periodo, tema, bloques, logo_png, ancho):
    from .layout_engine import generar_estallido, _rgb
    story = []
    todos = [p for b in bloques for e in b.elementos if isinstance(e, ElementoGrid) for p in e.productos]
    descuento_max = 0.0
    for p in todos:
        if p.oferta and p.descuento_pct and float(p.descuento_pct) > descuento_max:
            descuento_max = float(p.descuento_pct)

    est_titulo = ParagraphStyle('ft', fontName='Helvetica-Bold', fontSize=22, textColor=colors.white,
                                 alignment=TA_LEFT, leading=24)
    est_claim = ParagraphStyle('fc', fontName='Helvetica-Bold', fontSize=11, textColor=colors.white,
                                alignment=TA_LEFT, leading=13)
    bloque_titulo = [Paragraph('¡LAS MEJORES OFERTAS!', est_titulo), Spacer(1, 1 * mm),
                     Paragraph(periodo.etiqueta.upper(), est_claim)]
    if logo_png and os.path.exists(logo_png):
        with PILImage.open(logo_png) as im:
            ratio = im.height / im.width
        img_logo = RLImage(logo_png, width=17 * mm, height=17 * mm * ratio)
        ancho_interior = ancho - 12 * mm
        hueco = 34 * mm if descuento_max > 0 else 0
        celda = Table([[img_logo, bloque_titulo, '']] if hueco else [[img_logo, bloque_titulo]],
                      colWidths=[22 * mm, ancho_interior - 22 * mm - hueco, hueco] if hueco
                      else [22 * mm, ancho_interior - 22 * mm])
        celda.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                                    ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0)]))
        contenido = celda
    else:
        contenido = bloque_titulo
    banner = Table([[contenido]], colWidths=[ancho])
    banner.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(COLOR_CABECERA)),
        ('LEFTPADDING', (0, 0), (-1, -1), 6 * mm), ('RIGHTPADDING', (0, 0), (-1, -1), 6 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5 * mm), ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5 * mm),
    ]))
    story.append(banner)
    story.append(Spacer(1, 2.5 * mm))
    return story, descuento_max


def _dibujar_sticker_portada(descuento_max):
    from .layout_engine import generar_estallido, _rgb
    if descuento_max <= 0:
        return None
    img_bytes = generar_estallido(_rgb(COLOR_PRECIO), f'-{int(descuento_max)}%', texto_color_rgb=(255, 255, 255))

    def extra(canvas, doc):
        if doc.page != 1:
            return
        from reportlab.lib.utils import ImageReader
        lado = 34 * mm
        x = W - lado - 5 * mm
        y = H - TOP_BAR_H - 2 * mm - lado
        canvas.drawImage(ImageReader(io.BytesIO(img_bytes)), x, y, width=lado, height=lado, mask='auto')
    return extra


class _DocConExtras(BaseDocTemplate):
    def __init__(self, *args, dibujar_despues_pagina=None, **kwargs):
        super().__init__(*args, **kwargs)
        self._dibujar_despues_pagina = dibujar_despues_pagina

    def afterPage(self):
        if self._dibujar_despues_pagina:
            self._dibujar_despues_pagina(self.canv, self)


# ── Cierre ────────────────────────────────────────────────────────────
def construir_cierre(tema, logo_png, ancho):
    ancho_texto = ancho * 0.46
    ancho_mapa = ancho - ancho_texto - 6 * mm
    texto = []
    est_tit = ParagraphStyle('ct', fontName='Helvetica-Bold', fontSize=14, textColor=_c(COLOR_CABECERA),
                              alignment=TA_LEFT, leading=17)
    est_p = ParagraphStyle('cp', fontName='Helvetica', fontSize=9, textColor=_c('#4B5563'), alignment=TA_LEFT, leading=12)
    est_dir = ParagraphStyle('cd', fontName='Helvetica-Bold', fontSize=10, textColor=_c(COLOR_CABECERA),
                              alignment=TA_LEFT, leading=12)
    texto += [Paragraph('¿Necesitas más información?', est_tit), Spacer(1, 2.5 * mm),
              Paragraph('Oferta válida durante el periodo indicado en portada o hasta fin de existencias. '
                        'Precios con IVA incluido salvo indicación contraria.', est_p), Spacer(1, 4 * mm),
              Paragraph('ORENCIO MATAS Y HERMANOS, S.L.', est_dir),
              Paragraph('Av. Alfred Nobel, 2 · 13005 Ciudad Real', est_p), Spacer(1, 1.5 * mm),
              Paragraph('Tel. 926 221 217 · correo@orenciomatas.es', est_p)]
    grafico = generar_imagen_ubicacion(_TemaColorAdapter(), ancho_px=640, alto_px=int(640 * 0.62))
    mapa = [RLImage(io.BytesIO(grafico), width=ancho_mapa, height=ancho_mapa * 0.62)]
    fila = Table([[texto, mapa]], colWidths=[ancho_texto, ancho_mapa])
    fila.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'),
                               ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (0, 0), 3 * mm),
                               ('LEFTPADDING', (1, 0), (1, 0), 3 * mm)]))
    return [fila]


class _TemaColorAdapter:
    """generar_imagen_ubicacion() espera un objeto Tema con color_precio
    — aquí no se usa el sistema de Tema completo de V3, así que se
    envuelve el color en un adaptador mínimo compatible."""
    color_precio = COLOR_PRECIO


# ── Orquestador ───────────────────────────────────────────────────────
def generar_pdf_flyer(periodo, tema, bloques, logo_png, out_path, resultado=None, cols=4):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    frame = Frame(MARGIN, FRAME_BOTTOM, CW, FRAME_TOP - FRAME_BOTTOM,
                   leftPadding=0, rightPadding=0, topPadding=2, bottomPadding=0, id='unica')
    tpl = PageTemplate(id='contenido', frames=[frame], onPage=make_header_footer(logo_png, tema, periodo))

    story_portada, descuento_max = construir_portada(periodo, tema, bloques, logo_png, CW)

    def dibujar_despues_pagina(canvas, doc):
        sticker = _dibujar_sticker_portada(descuento_max)
        if sticker:
            sticker(canvas, doc)

    doc = _DocConExtras(out_path, pagesize=A4, pageTemplates=[tpl], dibujar_despues_pagina=dibujar_despues_pagina)

    story = list(story_portada)
    completas, pool = preparar_grupos(bloques, cols)
    eslogans = [
        '🔧 ¡APROVECHA ESTAS OFERTAS ANTES DE QUE SE AGOTEN! 🔧',
        '⚡ PRECIOS ESPECIALES POR TIEMPO LIMITADO ⚡',
        '✔ CALIDAD PROFESIONAL AL MEJOR PRECIO ✔',
    ]
    for i, (bloque, productos) in enumerate(completas):
        story += grid_categoria(bloque, CW, cols=cols, productos=productos, logo_png=logo_png)
        # Cada pocas categorías se intercala un eslogan llamativo — a
        # petición de Eloy, para romper la monotonía visual entre
        # bloques de productos, no solo en el pie de página.
        if (i + 1) % 4 == 0 and i + 1 < len(completas):
            story += [banner_eslogan(eslogans[(i // 4) % len(eslogans)], CW), Spacer(1, 3 * mm)]
    story += agrupar_sueltos(pool, CW, cols=cols, logo_png=logo_png)
    story += construir_cierre(tema, logo_png, CW)

    doc.build(story)

    total_productos = sum(len(e.productos) for b in bloques for e in b.elementos if isinstance(e, ElementoGrid))
    return {'paginas': doc.page, 'productos': total_productos}
