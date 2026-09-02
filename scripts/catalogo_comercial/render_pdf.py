"""
Renderizador PDF — capa final del pipeline. Solo sabe pintar lo que le
entrega composicion.py con los colores/textos de campanas.py; no conoce
reglas de negocio ni de dónde vienen los productos.

v2 (tras la primera revisión visual con Eloy):
  - Sin página de portada suelta: el logo y el titular de campaña van
    incrustados arriba de la primera página, que ya tiene productos
    debajo, como en el prototipo real de referencia.
  - Cada familia es UNA sola Table (banner + filas de producto, con
    SPAN para los anchos de protagonismo) en vez de varios flowables
    sueltos — así ReportLab puede partirla entre páginas de forma
    natural y aprovecha el hueco de página en vez de dejarlo en blanco.
  - Rejilla a 3 columnas (antes 4): celdas e imágenes más grandes.
  - Precio como "sticker" de color sólido (antes texto suelto) — mucho
    más parecido a una etiqueta de oferta real de folleto.
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
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, Image as RLImage, KeepTogether)
from PIL import Image as PILImage

from .composicion import ElementoGrid, ElementoDestacado, espacios_de
from .imagenes import imagen_para_producto, pil_to_bytes

W, H = A4
MARGIN = 12 * mm
CW = W - 2 * MARGIN

COLOR_GRIS = colors.HexColor('#64748b')
COLOR_NEGRO = colors.HexColor('#1a1a1a')
COLOR_BORDE = colors.HexColor('#d7dce3')
COLOR_FONDO = colors.HexColor('#f8fafc')


def _c(hexcolor: str):
    return colors.HexColor(hexcolor)


def estilos(tema):
    acento = _c(tema.color_acento)
    texto_sobre_principal = _c(tema.color_texto_sobre_principal)
    return {
        'titulo_campana': ParagraphStyle('tc', fontName='Helvetica-Bold', fontSize=21,
                                          textColor=texto_sobre_principal, alignment=TA_LEFT, leading=24),
        'claim_campana': ParagraphStyle('clc', fontName='Helvetica', fontSize=11.5,
                                         textColor=texto_sobre_principal, alignment=TA_LEFT, spaceBefore=3, leading=14),
        'intro': ParagraphStyle('ip', fontName='Helvetica', fontSize=8.5, textColor=COLOR_GRIS,
                                 alignment=TA_LEFT, leading=12),
        'banner_familia': ParagraphStyle('bf', fontName='Helvetica-Bold', fontSize=13.5,
                                          textColor=texto_sobre_principal, alignment=TA_LEFT, leading=16),
        'nombre_prod': ParagraphStyle('nom', fontName='Helvetica-Bold', fontSize=9, textColor=COLOR_NEGRO,
                                       alignment=TA_CENTER, leading=11),
        'nombre_prod_grande': ParagraphStyle('nomg', fontName='Helvetica-Bold', fontSize=16,
                                              textColor=COLOR_NEGRO, alignment=TA_LEFT, leading=20),
        'ref_prod': ParagraphStyle('ref', fontName='Helvetica', fontSize=6.3, textColor=COLOR_GRIS,
                                    alignment=TA_CENTER, spaceBefore=1),
        'ref_prod_grande': ParagraphStyle('refg', fontName='Helvetica', fontSize=9, textColor=COLOR_GRIS,
                                           alignment=TA_LEFT, spaceBefore=2, leading=12),
        'recomendado': ParagraphStyle('rec', fontName='Helvetica-Bold', fontSize=6.5, textColor=acento,
                                       alignment=TA_CENTER, spaceBefore=2),
        'sticker_tachado': ParagraphStyle('stt', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white,
                                           alignment=TA_CENTER, leading=10),
        'sticker_precio': ParagraphStyle('stp', fontName='Helvetica-Bold', fontSize=13, textColor=colors.white,
                                          alignment=TA_CENTER, leading=16),
        'sticker_precio_g': ParagraphStyle('stpg', fontName='Helvetica-Bold', fontSize=19, textColor=colors.white,
                                            alignment=TA_LEFT, leading=23),
        'sticker_tachado_g': ParagraphStyle('sttg', fontName='Helvetica-Bold', fontSize=10, textColor=colors.white,
                                             alignment=TA_LEFT, leading=13),
        'sin_iva': ParagraphStyle('si', fontName='Helvetica', fontSize=6, textColor=COLOR_GRIS,
                                   alignment=TA_CENTER, spaceBefore=1),
        'sin_iva_g': ParagraphStyle('sig', fontName='Helvetica', fontSize=8.5, textColor=COLOR_GRIS,
                                     alignment=TA_LEFT, spaceBefore=3, leading=11),
        'badge_destacado': ParagraphStyle('bd', fontName='Helvetica-Bold', fontSize=9.5, textColor=colors.white,
                                           alignment=TA_LEFT, leading=12),
        'nota': ParagraphStyle('nt', fontName='Helvetica', fontSize=7, textColor=COLOR_GRIS, alignment=TA_CENTER),
        'cierre_titulo': ParagraphStyle('ct', fontName='Helvetica-Bold', fontSize=14, textColor=COLOR_NEGRO,
                                         alignment=TA_CENTER, spaceAfter=8, leading=17),
        'cierre_texto': ParagraphStyle('ctx', fontName='Helvetica', fontSize=9, textColor=COLOR_GRIS,
                                        alignment=TA_CENTER, leading=13),
    }


# ── Encabezado de campaña (incrustado en la página 1, sin portada suelta) ──
def encabezado_campana(story, periodo, tema, logo_png, st):
    titulo = tema.titulo_portada_template.format(etiqueta_mayus=periodo.etiqueta.upper())
    hay_logo = bool(logo_png and os.path.exists(logo_png))
    texto = Table([
        [Paragraph(titulo, st['titulo_campana'])],
        [Paragraph(tema.claim_portada, st['claim_campana'])],
    ], colWidths=[CW - 30 * mm if hay_logo else CW])
    texto.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    if hay_logo:
        with PILImage.open(logo_png) as im:
            ratio = im.height / im.width
        img = RLImage(logo_png, width=24 * mm, height=24 * mm * ratio)
        fila = Table([[img, texto]], colWidths=[30 * mm, CW - 30 * mm])
    else:
        fila = Table([[texto]], colWidths=[CW])

    fila.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_principal)),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(fila)
    story.append(Spacer(1, 2.5 * mm))
    story.append(Paragraph(tema.texto_intro, st['intro']))
    story.append(Spacer(1, 4 * mm))


# ── Header/footer de página (franja superior fija + pie) ────────────────
def make_header_footer(logo_png, tema, periodo):
    color = _c(tema.color_principal)
    color_texto = _c(tema.color_texto_sobre_principal)

    def hf(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(color)
        canvas.rect(0, H - 13 * mm, W, 13 * mm, fill=1, stroke=0)
        if logo_png and os.path.exists(logo_png):
            with PILImage.open(logo_png) as im:
                ratio = im.height / im.width
            ch = 8.5 * mm
            cw = ch / ratio
            canvas.drawImage(logo_png, MARGIN, H - 11 * mm, height=ch, width=cw,
                              preserveAspectRatio=True, mask='auto')
        canvas.setFillColor(color_texto)
        canvas.setFont('Helvetica-Bold', 8.5)
        canvas.drawString(MARGIN + 11 * mm, H - 8 * mm, 'ORENCIO MATAS Y HERMANOS, S.L.')
        canvas.setFont('Helvetica', 7.5)
        canvas.drawRightString(W - MARGIN, H - 8 * mm, periodo.etiqueta)
        canvas.setFillColor(COLOR_FONDO)
        canvas.rect(0, 0, W, 8 * mm, fill=1, stroke=0)
        canvas.setStrokeColor(COLOR_BORDE)
        canvas.line(MARGIN, 8 * mm, W - MARGIN, 8 * mm)
        canvas.setFillColor(COLOR_GRIS)
        canvas.setFont('Helvetica', 6.5)
        canvas.drawString(MARGIN, 3 * mm,
                           'Orencio Matas y Hnos, S.L. · 926 221 217 · correo@orenciomatas.es · orenciomatas.es')
        canvas.drawRightString(W - MARGIN, 3 * mm, f'Pág. {doc.page}')
        canvas.restoreState()
    return hf


def _fmt(d: Decimal) -> str:
    return f'{d:.2f}'.replace('.', ',')


# ── Sticker de precio (bloque de color sólido, no texto suelto) ─────────
def sticker_precio(p, st, tema, grande=False, ancho=None):
    fondo = _c(tema.color_acento) if p.oferta else _c(tema.color_principal)
    filas = []
    if p.oferta and p.descuento_pct and p.descuento_pct > 0:
        filas.append([Paragraph(f'<strike>{_fmt(p.precio_con_iva)} €</strike>&nbsp;&nbsp;-{int(p.descuento_pct)}%',
                                 st['sticker_tachado_g'] if grande else st['sticker_tachado'])])
        filas.append([Paragraph(f'{_fmt(p.precio_final_con_iva)} € <font size="{9 if grande else 6}">IVA inc.</font>',
                                 st['sticker_precio_g'] if grande else st['sticker_precio'])])
    elif p.oferta:
        filas.append([Paragraph('¡OFERTA!', st['sticker_tachado_g'] if grande else st['sticker_tachado'])])
        filas.append([Paragraph(f'{_fmt(p.precio_con_iva)} € <font size="{9 if grande else 6}">IVA inc.</font>',
                                 st['sticker_precio_g'] if grande else st['sticker_precio'])])
    else:
        filas.append([Paragraph(f'{_fmt(p.precio_con_iva)} € <font size="{9 if grande else 6}">IVA inc.</font>',
                                 st['sticker_precio_g'] if grande else st['sticker_precio'])])

    ancho_final = ancho if grande else 32 * mm
    t = Table(filas, colWidths=[ancho_final] if ancho_final else None)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), fondo),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT' if grande else 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 3 if grande else 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3 if grande else 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 8 if grande else 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8 if grande else 4),
    ]))
    if not grande:
        t.hAlign = 'CENTER'
    return t


# ── Contenido de una celda de producto (nivel 1-4) ───────────────────────
def _celda_producto(p, tema, st, cols, span):
    factor = 1 + (span - 1) * 0.35
    tamano_img = int(340 * (cols / 3.0) * factor)
    # Cuadrado solo para celdas de 1 columna (uniformidad del grid);
    # a partir de span 2 se aprovecha la proporción real de la foto.
    pil = imagen_para_producto(p, tamano=min(tamano_img, 900), cuadrado=(span == 1))
    img_bytes = pil_to_bytes(pil)

    cel_w = (CW / cols) * span - 6 * mm
    cel_h = 44 * mm * factor
    iw, ih = pil.size
    ratio = min(cel_w / iw, cel_h / ih)
    rl_img = RLImage(io.BytesIO(img_bytes), width=iw * ratio, height=ih * ratio)
    rl_img.hAlign = 'CENTER'

    contenido = [rl_img, Spacer(1, 1.5 * mm)]
    if p.protagonismo == 2:
        contenido.append(Paragraph('★ RECOMENDADO', st['recomendado']))
    contenido.append(Paragraph(p.nombre, st['nombre_prod']))
    contenido.append(Paragraph(f'Ref: {p.referencia}', st['ref_prod']))
    contenido.append(Spacer(1, 1.5 * mm))
    contenido.append(sticker_precio(p, st, tema))
    if not p.oferta and p.precio_sin_iva:
        contenido.append(Paragraph(f'{_fmt(p.precio_sin_iva)} € sin IVA', st['sin_iva']))
    elif p.oferta and p.descuento_pct and p.precio_final_sin_iva:
        contenido.append(Paragraph(f'{_fmt(p.precio_final_sin_iva)} € sin IVA', st['sin_iva']))
    return contenido


# ── Contenido de un producto destacado (nivel 5) — imagen grande + ficha ──
def _contenido_destacado(p, tema, st):
    pil = imagen_para_producto(p, tamano=750, cuadrado=False)
    img_bytes = pil_to_bytes(pil, calidad=88)
    iw, ih = pil.size

    img_w = CW * 0.46
    img_h = img_w * (ih / iw)
    max_h = 92 * mm
    if img_h > max_h:
        img_h = max_h
        img_w = img_h * (iw / ih)
    rl_img = RLImage(io.BytesIO(img_bytes), width=img_w, height=img_h)
    ancho_ficha = CW - img_w - 6 * mm - 8 * mm

    badge = Table([[Paragraph('PRODUCTO DESTACADO', st['badge_destacado'])]], colWidths=[45 * mm])
    badge.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_acento)),
        ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    ficha = [badge, Spacer(1, 5 * mm), Paragraph(p.nombre, st['nombre_prod_grande']),
             Paragraph(f'Ref: {p.referencia}' + (f' · {p.fabricante}' if p.fabricante else ''),
                       st['ref_prod_grande']),
             Spacer(1, 5 * mm), sticker_precio(p, st, tema, grande=True, ancho=ancho_ficha)]
    if not p.oferta and p.precio_sin_iva:
        ficha.append(Paragraph(f'{_fmt(p.precio_sin_iva)} € sin IVA', st['sin_iva_g']))
    elif p.oferta and p.descuento_pct and p.precio_final_sin_iva:
        ficha.append(Paragraph(f'{_fmt(p.precio_final_sin_iva)} € sin IVA', st['sin_iva_g']))

    tabla = Table([[rl_img, ficha]], colWidths=[img_w + 6 * mm, CW - img_w - 6 * mm - 8 * mm])
    tabla.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (0, 0), 0),
    ]))
    return tabla


# ── Tabla única por familia (banner + productos, con borde) ─────────────
def construir_tabla_familia(bloque, tema, st, cols):
    data = []
    style_cmds = [
        ('BOX', (0, 0), (-1, -1), 1.2, _c(tema.color_acento)),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]

    # Fila 0: banner de familia, ocupa todas las columnas
    data.append([Paragraph('▸  ' + bloque.familia, st['banner_familia'])] + [''] * (cols - 1))
    style_cmds += [
        ('SPAN', (0, 0), (cols - 1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), _c(tema.color_principal)),
        ('TOPPADDING', (0, 0), (-1, 0), 5.5), ('BOTTOMPADDING', (0, 0), (-1, 0), 5.5),
        ('LEFTPADDING', (0, 0), (0, 0), 9),
    ]

    fila_actual = []
    suma_actual = 0
    row_idx = 1

    def cerrar_fila():
        nonlocal fila_actual, suma_actual, row_idx
        if not fila_actual:
            return
        while suma_actual < cols:
            fila_actual.append('')
            suma_actual += 1
        data.append(fila_actual)
        style_cmds.append(('TOPPADDING', (0, row_idx), (-1, row_idx), 8))
        style_cmds.append(('BOTTOMPADDING', (0, row_idx), (-1, row_idx), 8))
        style_cmds.append(('LEFTPADDING', (0, row_idx), (-1, row_idx), 5))
        style_cmds.append(('RIGHTPADDING', (0, row_idx), (-1, row_idx), 5))
        style_cmds.append(('LINEBELOW', (0, row_idx), (-1, row_idx), 0.4, COLOR_BORDE))
        fila_actual = []
        suma_actual = 0
        row_idx += 1

    for elemento in bloque.elementos:
        if isinstance(elemento, ElementoGrid):
            for p in elemento.productos:
                span = max(1, min(cols, espacios_de(p)))
                if suma_actual + span > cols:
                    cerrar_fila()
                col_inicio = suma_actual
                fila_actual.append(_celda_producto(p, tema, st, cols, span))
                for _ in range(span - 1):
                    fila_actual.append('')
                if span > 1:
                    style_cmds.append(('SPAN', (col_inicio, row_idx), (col_inicio + span - 1, row_idx)))
                suma_actual += span
        elif isinstance(elemento, ElementoDestacado):
            cerrar_fila()
            data.append([_contenido_destacado(elemento.producto, tema, st)] + [''] * (cols - 1))
            style_cmds += [
                ('SPAN', (0, row_idx), (cols - 1, row_idx)),
                ('BACKGROUND', (0, row_idx), (-1, row_idx), colors.white),
                ('TOPPADDING', (0, row_idx), (-1, row_idx), 8), ('BOTTOMPADDING', (0, row_idx), (-1, row_idx), 8),
                ('LEFTPADDING', (0, row_idx), (-1, row_idx), 8), ('RIGHTPADDING', (0, row_idx), (-1, row_idx), 8),
                ('LINEBELOW', (0, row_idx), (-1, row_idx), 0.6, _c(tema.color_acento)),
            ]
            row_idx += 1
    cerrar_fila()

    if len(data) == 1:
        # Familia sin productos válidos que renderizar (no debería pasar,
        # pero por seguridad no se genera una tabla vacía sin contenido).
        data.append([''] * cols)

    t = Table(data, colWidths=[CW / cols] * cols)
    t.setStyle(TableStyle(style_cmds))
    t.repeatRows = 1  # si la familia se parte entre páginas, repite el banner arriba —
                       # evita que el banner quede "huérfano" solo al final de una página
    return t


# ── Cierre ───────────────────────────────────────────────────────────────
def cierre(story, tema, st):
    """No fuerza salto de página: aprovecha el hueco que deje la última
    familia en su página; si no cabe, pasa a la siguiente de forma
    natural (ver contexto_catalogo_comercial_talleres.md)."""
    bloque_cierre = [
        Spacer(1, 10 * mm),
        Paragraph('¿Necesitas más información?', st['cierre_titulo']),
        Paragraph(tema.texto_cierre, st['cierre_texto']),
        Spacer(1, 6 * mm),
        Paragraph(
            '<b>Orencio Matas y Hermanos, S.L.</b> · Av. Alfred Nobel, 2 · 13005 Ciudad Real<br/>'
            'Tel. 926 221 217 · correo@orenciomatas.es · orenciomatas.es', st['cierre_texto']),
    ]
    story.append(KeepTogether(bloque_cierre))


# ── Orquestación ─────────────────────────────────────────────────────────
def generar_pdf(periodo, tema, bloques, logo_png, out_path, resultado_validacion=None):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    st = estilos(tema)
    doc = SimpleDocTemplate(out_path, pagesize=A4, topMargin=17 * mm, bottomMargin=11 * mm,
                             leftMargin=MARGIN, rightMargin=MARGIN)
    hf = make_header_footer(logo_png, tema, periodo)
    story = []

    # Sin página de portada suelta: el titular de campaña va arriba de
    # esta misma página, que sigue directamente con productos reales.
    encabezado_campana(story, periodo, tema, logo_png, st)

    for bloque in bloques:
        tabla = construir_tabla_familia(bloque, tema, st, cols=tema.cols_grid)
        story.append(tabla)
        story.append(Spacer(1, 3 * mm))

    cierre(story, tema, st)
    doc.build(story, onFirstPage=hf, onLaterPages=hf)

    num_paginas = 0
    try:
        import fitz
        pdf_doc = fitz.open(out_path)
        num_paginas = len(pdf_doc)
        pdf_doc.close()
    except Exception:
        pass
    return {'paginas': num_paginas, 'productos': sum(
        len(e.productos) if isinstance(e, ElementoGrid) else 1
        for b in bloques for e in b.elementos)}
