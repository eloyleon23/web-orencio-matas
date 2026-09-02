"""
Renderizador PDF — capa final del pipeline. Solo sabe pintar lo que le
entrega composicion.py con los colores/textos de campanas.py; no conoce
reglas de negocio ni de dónde vienen los productos.
"""
from __future__ import annotations

import io
import os
import datetime
from decimal import Decimal

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, Image as RLImage, PageBreak, KeepTogether)
from PIL import Image as PILImage

from .composicion import ElementoGrid, ElementoDestacado, espacios_de
from .imagenes import imagen_para_producto, pil_to_bytes

W, H = A4
MARGIN = 14 * mm
CW = W - 2 * MARGIN

COLOR_GRIS = colors.HexColor('#64748b')
COLOR_NEGRO = colors.HexColor('#1a1a1a')
COLOR_BORDE = colors.HexColor('#e2e8f0')
COLOR_FONDO = colors.HexColor('#f8fafc')


def _c(hexcolor: str):
    return colors.HexColor(hexcolor)


def estilos(tema):
    acento = _c(tema.color_acento)
    return {
        'titulo_portada': ParagraphStyle('tp', fontName='Helvetica-Bold', fontSize=27,
                                          textColor=colors.white, alignment=TA_CENTER, leading=32),
        'claim_portada': ParagraphStyle('cp', fontName='Helvetica', fontSize=13,
                                         textColor=colors.white, alignment=TA_CENTER, spaceBefore=8),
        'intro': ParagraphStyle('ip', fontName='Helvetica', fontSize=10, textColor=COLOR_GRIS,
                                 alignment=TA_CENTER, leading=15),
        'banner_familia': ParagraphStyle('bf', fontName='Helvetica-Bold', fontSize=13,
                                          textColor=_c(tema.color_texto_sobre_principal), alignment=TA_LEFT),
        'nombre_prod': ParagraphStyle('nom', fontName='Helvetica-Bold', fontSize=8.3,
                                       textColor=COLOR_NEGRO, alignment=TA_CENTER, leading=10.5),
        'nombre_prod_grande': ParagraphStyle('nomg', fontName='Helvetica-Bold', fontSize=15,
                                              textColor=COLOR_NEGRO, alignment=TA_LEFT, leading=19),
        'ref_prod': ParagraphStyle('ref', fontName='Helvetica', fontSize=6, textColor=COLOR_GRIS,
                                    alignment=TA_CENTER, spaceBefore=1),
        'ref_prod_grande': ParagraphStyle('refg', fontName='Helvetica', fontSize=8.5, textColor=COLOR_GRIS,
                                           alignment=TA_LEFT, spaceBefore=2),
        'recomendado': ParagraphStyle('rec', fontName='Helvetica-Bold', fontSize=6, textColor=acento,
                                       alignment=TA_CENTER, spaceBefore=1),
        'precio_tachado': ParagraphStyle('pt', fontName='Helvetica', fontSize=6.5, textColor=COLOR_GRIS,
                                          alignment=TA_CENTER, spaceBefore=2),
        'precio_final': ParagraphStyle('pf', fontName='Helvetica-Bold', fontSize=11.5, textColor=acento,
                                        alignment=TA_CENTER, spaceBefore=1),
        'precio_normal': ParagraphStyle('pn', fontName='Helvetica-Bold', fontSize=10.5, textColor=COLOR_NEGRO,
                                         alignment=TA_CENTER, spaceBefore=2),
        'precio_sin': ParagraphStyle('ps', fontName='Helvetica', fontSize=6, textColor=COLOR_GRIS,
                                      alignment=TA_CENTER, spaceBefore=1),
        'precio_tachado_g': ParagraphStyle('ptg', fontName='Helvetica', fontSize=10, textColor=COLOR_GRIS,
                                            alignment=TA_LEFT, spaceBefore=6),
        'precio_final_g': ParagraphStyle('pfg', fontName='Helvetica-Bold', fontSize=22, textColor=acento,
                                          alignment=TA_LEFT, spaceBefore=2),
        'precio_normal_g': ParagraphStyle('png', fontName='Helvetica-Bold', fontSize=20, textColor=COLOR_NEGRO,
                                           alignment=TA_LEFT, spaceBefore=6),
        'badge_destacado': ParagraphStyle('bd', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white,
                                           alignment=TA_LEFT),
        'nota': ParagraphStyle('nt', fontName='Helvetica', fontSize=7, textColor=COLOR_GRIS, alignment=TA_CENTER),
        'cierre_titulo': ParagraphStyle('ct', fontName='Helvetica-Bold', fontSize=14, textColor=COLOR_NEGRO,
                                         alignment=TA_CENTER, spaceAfter=8),
        'cierre_texto': ParagraphStyle('ctx', fontName='Helvetica', fontSize=9, textColor=COLOR_GRIS,
                                        alignment=TA_CENTER, leading=13),
    }


# ── Portada ──────────────────────────────────────────────────────────────
def portada(story, periodo, tema, logo_png, st):
    color_fondo = _c(tema.color_principal)
    if logo_png and os.path.exists(logo_png):
        story.append(Spacer(1, 14 * mm))
        with PILImage.open(logo_png) as im:
            ratio = im.height / im.width
        img = RLImage(logo_png, width=40 * mm, height=40 * mm * ratio)
        img.hAlign = 'CENTER'
        story.append(img)
        story.append(Spacer(1, 10 * mm))
    else:
        story.append(Spacer(1, 30 * mm))

    titulo = tema.titulo_portada_template.format(etiqueta_mayus=periodo.etiqueta.upper())
    caja = Table([[Paragraph(titulo, st['titulo_portada'])],
                  [Paragraph(tema.claim_portada, st['claim_portada'])]], colWidths=[CW])
    caja.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), color_fondo),
        ('TOPPADDING', (0, 0), (-1, 0), 14), ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
        ('TOPPADDING', (0, 1), (-1, 1), 2), ('BOTTOMPADDING', (0, 1), (-1, 1), 16),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(caja)
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(tema.texto_intro, st['intro']))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph('SUMINISTROS PARA TALLERES Y CARROCERÍAS', st['nota']))
    story.append(PageBreak())


# ── Header/footer ───────────────────────────────────────────────────────
def make_header_footer(logo_png, tema, periodo):
    color = _c(tema.color_principal)
    color_texto = _c(tema.color_texto_sobre_principal)

    def hf(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(color)
        canvas.rect(0, H - 15 * mm, W, 15 * mm, fill=1, stroke=0)
        if logo_png and os.path.exists(logo_png):
            with PILImage.open(logo_png) as im:
                ratio = im.height / im.width
            ch = 10 * mm
            cw = ch / ratio
            canvas.drawImage(logo_png, MARGIN, H - 13 * mm, height=ch, width=cw,
                              preserveAspectRatio=True, mask='auto')
        canvas.setFillColor(color_texto)
        canvas.setFont('Helvetica-Bold', 9)
        canvas.drawString(MARGIN + 13 * mm, H - 9.5 * mm, 'ORENCIO MATAS Y HERMANOS, S.L.')
        canvas.setFont('Helvetica', 7.5)
        canvas.drawRightString(W - MARGIN, H - 9.5 * mm, periodo.etiqueta)
        canvas.setFillColor(COLOR_FONDO)
        canvas.rect(0, 0, W, 9 * mm, fill=1, stroke=0)
        canvas.setStrokeColor(COLOR_BORDE)
        canvas.line(MARGIN, 9 * mm, W - MARGIN, 9 * mm)
        canvas.setFillColor(COLOR_GRIS)
        canvas.setFont('Helvetica', 6.5)
        canvas.drawString(MARGIN, 3.5 * mm,
                           'Orencio Matas y Hnos, S.L. · 926 221 217 · correo@orenciomatas.es · orenciomatas.es')
        canvas.drawRightString(W - MARGIN, 3.5 * mm, f'Pág. {doc.page}')
        canvas.restoreState()
    return hf


# ── Banner de familia ───────────────────────────────────────────────────
def banner_familia(nombre_familia, tema, st):
    t = Table([[Paragraph(nombre_familia, st['banner_familia'])]], colWidths=[CW])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_principal)),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t


# ── Bloque de precio (reutilizado en celda normal y en destacado) ───────
def _fmt(d: Decimal) -> str:
    return f'{d:.2f}'.replace('.', ',')


def bloque_precio(p, st, grande=False):
    sufijo_tachado = st['precio_tachado_g'] if grande else st['precio_tachado']
    sufijo_final = st['precio_final_g'] if grande else st['precio_final']
    sufijo_normal = st['precio_normal_g'] if grande else st['precio_normal']
    sufijo_sin = st['precio_sin']

    elementos = []
    if p.oferta and p.descuento_pct and p.descuento_pct > 0:
        elementos.append(Paragraph(f'<strike>{_fmt(p.precio_con_iva)} €</strike>  -{int(p.descuento_pct)}%',
                                    sufijo_tachado))
        elementos.append(Paragraph(f'{_fmt(p.precio_final_con_iva)} € <font size="6">(IVA inc.)</font>',
                                    sufijo_final))
        if p.precio_final_sin_iva and not grande:
            elementos.append(Paragraph(f'{_fmt(p.precio_final_sin_iva)} € sin IVA', sufijo_sin))
    elif p.oferta:
        # oferta=sí pero sin % de descuento informado: se destaca como
        # oferta igualmente (aviso registrado en validación), pero sin
        # tachar un precio que en realidad no ha bajado.
        elementos.append(Paragraph('OFERTA', sufijo_tachado))
        elementos.append(Paragraph(f'{_fmt(p.precio_con_iva)} € <font size="6">(IVA inc.)</font>', sufijo_final))
        if p.precio_sin_iva and not grande:
            elementos.append(Paragraph(f'{_fmt(p.precio_sin_iva)} € sin IVA', sufijo_sin))
    else:
        elementos.append(Paragraph(f'{_fmt(p.precio_con_iva)} € <font size="6">(IVA inc.)</font>', sufijo_normal))
        if p.precio_sin_iva and not grande:
            elementos.append(Paragraph(f'{_fmt(p.precio_sin_iva)} € sin IVA', sufijo_sin))
    return elementos


# ── Rejilla de productos (nivel 1-4) ─────────────────────────────────────
def render_grid(elemento: ElementoGrid, tema, st, cols):
    MAX_SPAN = cols
    cel_w_unit = (CW - (cols - 1) * 4 * mm) / cols
    base_h = 34 * mm

    items = []
    for p in elemento.productos:
        pil = imagen_para_producto(p)
        img_bytes = pil_to_bytes(pil)
        span = max(1, min(MAX_SPAN, espacios_de(p)))
        cel_w = cel_w_unit * span + (span - 1) * 4 * mm
        cel_h = base_h * (1 + (span - 1) * 0.22)

        iw, ih = pil.size
        ratio = min(cel_w / iw, cel_h / ih)
        rl_img = RLImage(io.BytesIO(img_bytes), width=iw * ratio, height=ih * ratio)
        rl_img.hAlign = 'CENTER'

        contenido = [rl_img]
        if p.protagonismo == 2:
            contenido.append(Paragraph('★ RECOMENDADO', st['recomendado']))
        contenido.append(Paragraph(p.nombre, st['nombre_prod']))
        contenido.append(Paragraph(f'Ref: {p.referencia}', st['ref_prod']))
        contenido.extend(bloque_precio(p, st))

        items.append((contenido, span, cel_w))

    rows, widths_rows = [], []
    cur_row, cur_widths, cur_sum = [], [], 0
    for contenido, span, cel_w in items:
        if cur_sum + span > cols:
            while cur_sum < cols:
                cur_row.append(Paragraph('', st['nota']))
                cur_widths.append(cel_w_unit)
                cur_sum += 1
            rows.append(cur_row); widths_rows.append(cur_widths)
            cur_row, cur_widths, cur_sum = [], [], 0
        cur_row.append(contenido); cur_widths.append(cel_w); cur_sum += span
    if cur_row:
        while cur_sum < cols:
            cur_row.append(Paragraph('', st['nota']))
            cur_widths.append(cel_w_unit)
            cur_sum += 1
        rows.append(cur_row); widths_rows.append(cur_widths)

    tablas = []
    for row, widths in zip(rows, widths_rows):
        t = Table([row], colWidths=widths)
        t.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 4), ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('LINEBELOW', (0, 0), (-1, -1), 0.4, COLOR_BORDE),
        ]))
        tablas.append(t)
    return tablas


# ── Producto estrella (nivel 5) ──────────────────────────────────────────
def render_destacado(elemento: ElementoDestacado, tema, st):
    p = elemento.producto
    pil = imagen_para_producto(p, tamano=700)
    img_bytes = pil_to_bytes(pil, calidad=88)
    iw, ih = pil.size

    img_w = CW * 0.46
    img_h = img_w * (ih / iw)
    max_h = 95 * mm
    if img_h > max_h:
        img_h = max_h
        img_w = img_h * (iw / ih)
    rl_img = RLImage(io.BytesIO(img_bytes), width=img_w, height=img_h)

    badge = Table([[Paragraph('PRODUCTO DESTACADO', st['badge_destacado'])]], colWidths=[45 * mm])
    badge.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), _c(tema.color_acento)),
        ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    ficha = [badge, Spacer(1, 6 * mm), Paragraph(p.nombre, st['nombre_prod_grande']),
             Paragraph(f'Ref: {p.referencia}' + (f' · {p.fabricante}' if p.fabricante else ''),
                       st['ref_prod_grande']),
             Spacer(1, 4 * mm)]
    ficha.extend(bloque_precio(p, st, grande=True))

    tabla = Table([[rl_img, ficha]], colWidths=[img_w + 6 * mm, CW - img_w - 6 * mm])
    tabla.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (0, 0), 0), ('RIGHTPADDING', (1, 0), (1, 0), 4),
        ('BOX', (0, 0), (-1, -1), 1, _c(tema.color_principal)),
        ('LINEBELOW', (0, 0), (-1, -1), 3, _c(tema.color_acento)),
    ]))
    return KeepTogether([Spacer(1, 3 * mm), tabla, Spacer(1, 3 * mm)])


# ── Cierre ───────────────────────────────────────────────────────────────
def cierre(story, tema, st):
    """A propósito NO fuerza salto de página (PageBreak): si el último
    bloque de familia deja hueco libre al final de su página, el cierre
    lo aprovecha; si no cabe, ReportLab lo pasa a una página nueva de
    forma natural. Forzar un salto aquí siempre generaba una página de
    cierre casi vacía cuando el catálogo terminaba pronto en una hoja
    (ver punto 9 del encargo — evitar páginas prácticamente vacías)."""
    bloque_cierre = [
        Spacer(1, 12 * mm),
        Paragraph('¿Necesitas más información?', st['cierre_titulo']),
        Paragraph(tema.texto_cierre, st['cierre_texto']),
        Spacer(1, 8 * mm),
        Paragraph(
            '<b>Orencio Matas y Hermanos, S.L.</b> · Av. Alfred Nobel, 2 · 13005 Ciudad Real<br/>'
            'Tel. 926 221 217 · correo@orenciomatas.es · orenciomatas.es', st['cierre_texto']),
    ]
    story.append(KeepTogether(bloque_cierre))


# ── Orquestación ─────────────────────────────────────────────────────────
def generar_pdf(periodo, tema, bloques, logo_png, out_path, resultado_validacion=None):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    st = estilos(tema)
    doc = SimpleDocTemplate(out_path, pagesize=A4, topMargin=20 * mm, bottomMargin=13 * mm,
                             leftMargin=MARGIN, rightMargin=MARGIN)
    hf = make_header_footer(logo_png, tema, periodo)
    story = []
    portada(story, periodo, tema, logo_png, st)

    for bloque in bloques:
        cabecera = [banner_familia(bloque.familia, tema, st), Spacer(1, 3 * mm)]
        primer_elemento_pintado = False
        for elemento in bloque.elementos:
            if isinstance(elemento, ElementoGrid):
                tablas = render_grid(elemento, tema, st, cols=tema.cols_grid)
                if not tablas:
                    continue
                if not primer_elemento_pintado:
                    story.append(KeepTogether(cabecera + [tablas[0]]))
                    story.extend(tablas[1:])
                    primer_elemento_pintado = True
                else:
                    story.extend(tablas)
            elif isinstance(elemento, ElementoDestacado):
                bloque_destacado = render_destacado(elemento, tema, st)
                if not primer_elemento_pintado:
                    story.append(KeepTogether(cabecera + [bloque_destacado]))
                    primer_elemento_pintado = True
                else:
                    story.append(bloque_destacado)
        story.append(Spacer(1, 2 * mm))

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
