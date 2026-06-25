#!/usr/bin/env python3
"""
Generador de catálogos PDF para Orencio Matas y Hermanos, S.L.
Lee productos de Google Sheets, descarga imágenes de Drive y genera PDFs por área.
"""

import os, io, json, requests
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, Image as RLImage, PageBreak, HRFlowable)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from PIL import Image as PILImage

# ── Configuración ───────────────────────────────────────────────────────────
SHEET_ID   = os.environ.get('SHEET_ID', '')
API_KEY    = os.environ.get('DRIVE_API_KEY', '')
OUTPUT_DIR = 'catalogos_output'
LOGO_PATH  = 'assets/logos/logo_calidad.svg'

AREAS = {
    'drogueria':  {'titulo': 'DROGUERÍA Y LIMPIEZA DEL HOGAR',
                   'subtitulo': 'Detergentes · Lavavajillas · Quitagrasas · Higiene · Ambientadores',
                   'color': '#1a1a1a', 'filename': 'catalogo_drogueria.pdf'},
    'perfumeria': {'titulo': 'PERFUMERÍA E HIGIENE PERSONAL',
                   'subtitulo': 'Fragancias · Desodorantes · Champús · Geles · Cremas · Maquinillas',
                   'color': '#d91b1b', 'filename': 'catalogo_perfumeria.pdf'},
    'pinturas':   {'titulo': 'PINTURAS, BARNICES Y HERRAMIENTAS',
                   'subtitulo': 'Esmaltes · Barnices · Brochas · Rodillos · Lijas · Disolventes',
                   'color': '#1a5e20', 'filename': 'catalogo_pinturas.pdf'},
    'talleres':   {'titulo': 'SUMINISTROS PARA TALLERES',
                   'subtitulo': 'Productos técnicos · Carrocería · Mantenimiento profesional',
                   'color': '#1a3a6e', 'filename': 'catalogo_talleres.pdf'},
}

COLOR_ROJO  = colors.HexColor('#d91b1b')
COLOR_NEGRO = colors.HexColor('#1a1a1a')
COLOR_GRIS  = colors.HexColor('#64748b')
COLOR_FONDO = colors.HexColor('#f8fafc')
COLOR_BORDE = colors.HexColor('#e2e8f0')

W, H   = A4
MARGIN = 18 * mm
CW     = W - 2 * MARGIN

# ── Leer productos del Sheet ────────────────────────────────────────────────
def leer_productos():
    """Lee la hoja 'Productos' del Google Sheet exportada como CSV."""
    url = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
           f"/gviz/tq?tqx=out:csv&sheet=Productos")
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    
    import csv, io as sio
    reader = csv.DictReader(sio.StringIO(resp.text))
    productos = []
    for row in reader:
        # Limpiar claves (strip espacios)
        clean = {k.strip().lower().replace(' ', '_'): v.strip() for k, v in row.items()}
        productos.append(clean)
    
    print(f"✓ {len(productos)} productos leídos del Sheet")
    return productos

# ── Descargar imagen de Google Drive ───────────────────────────────────────
def descargar_imagen(drive_id, max_px=800):
    """Descarga una imagen de Drive por su ID y la devuelve como objeto PIL."""
    if not drive_id:
        return None
    try:
        # URL de descarga directa de Drive
        url = f"https://drive.google.com/uc?export=download&id={drive_id}"
        resp = requests.get(url, timeout=20)
        if resp.status_code != 200:
            return None
        img = PILImage.open(io.BytesIO(resp.content)).convert('RGB')
        w, h = img.size
        if max(w, h) > max_px:
            ratio = max_px / max(w, h)
            img = img.resize((int(w*ratio), int(h*ratio)), PILImage.LANCZOS)
        return img
    except Exception as e:
        print(f"  ⚠ Error descargando {drive_id}: {e}")
        return None

# ── Convertir PIL a bytes JPEG ──────────────────────────────────────────────
def pil_to_bytes(img):
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=82)
    return buf.getvalue()

# ── Estilos ReportLab ───────────────────────────────────────────────────────
def estilos():
    return {
        'titulo_cat':  ParagraphStyle('tc', fontName='Helvetica-Bold', fontSize=17,
                                      textColor=colors.white, alignment=TA_CENTER, leading=21),
        'sub_cat':     ParagraphStyle('sc', fontName='Helvetica', fontSize=9,
                                      textColor=colors.white, alignment=TA_CENTER),
        'titulo_port': ParagraphStyle('tp', fontName='Helvetica-Bold', fontSize=26,
                                      textColor=COLOR_NEGRO, alignment=TA_CENTER, leading=32),
        'sub_port':    ParagraphStyle('sp', fontName='Helvetica', fontSize=13,
                                      textColor=COLOR_GRIS, alignment=TA_CENTER, spaceBefore=6),
        'año':         ParagraphStyle('ap', fontName='Helvetica-Bold', fontSize=15,
                                      textColor=COLOR_ROJO, alignment=TA_CENTER, spaceBefore=4),
        'intro':       ParagraphStyle('ip', fontName='Helvetica', fontSize=10,
                                      textColor=COLOR_GRIS, alignment=TA_CENTER, leading=16),
        'nota':        ParagraphStyle('np', fontName='Helvetica', fontSize=7,
                                      textColor=COLOR_GRIS, alignment=TA_CENTER),
        'contacto':    ParagraphStyle('cp', fontName='Helvetica', fontSize=9,
                                      textColor=COLOR_NEGRO, alignment=TA_CENTER, leading=14),
        'nombre_prod': ParagraphStyle('nom', fontName='Helvetica-Bold', fontSize=8,
                                      textColor=COLOR_NEGRO, alignment=TA_CENTER, leading=10),
        'marca_prod':  ParagraphStyle('mar', fontName='Helvetica', fontSize=7,
                                      textColor=COLOR_GRIS, alignment=TA_CENTER),
        'tipo_prod':   ParagraphStyle('tip', fontName='Helvetica', fontSize=6,
                                      textColor=COLOR_GRIS, alignment=TA_CENTER, spaceBefore=2),
    }

# ── Header y footer de página ───────────────────────────────────────────────
def make_header_footer(logo_png_path):
    def hf(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(COLOR_NEGRO)
        canvas.rect(0, H-16*mm, W, 16*mm, fill=1, stroke=0)
        canvas.setFillColor(COLOR_ROJO)
        canvas.rect(0, H-17*mm, W, 1*mm, fill=1, stroke=0)
        if logo_png_path and os.path.exists(logo_png_path):
            ch = 12*mm
            cw = ch * (600/740)
            canvas.drawImage(logo_png_path, MARGIN, H-14.5*mm,
                             height=ch, width=cw, preserveAspectRatio=True, mask='auto')
        canvas.setFillColor(colors.white)
        canvas.setFont('Helvetica-Bold', 9)
        canvas.drawString(MARGIN+14*mm, H-10*mm, 'ORENCIO MATAS Y HERMANOS, S.L.')
        canvas.setFont('Helvetica', 7.5)
        canvas.drawRightString(W-MARGIN, H-9.5*mm, 'Catálogo de Productos 2025-2026')
        canvas.setFillColor(COLOR_FONDO)
        canvas.rect(0, 0, W, 10*mm, fill=1, stroke=0)
        canvas.setStrokeColor(COLOR_BORDE)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, 10*mm, W-MARGIN, 10*mm)
        canvas.setFillColor(COLOR_GRIS)
        canvas.setFont('Helvetica', 6.5)
        canvas.drawString(MARGIN, 4*mm,
            'ORENCIO MATAS Y HERMANOS, S.L. · Av. Alfred Nobel, 2 · 13005 Ciudad Real · '
            '926 221 217 · correo@orenciomatas.es')
        canvas.drawRightString(W-MARGIN, 4*mm, f'Pág. {doc.page}')
        canvas.restoreState()
    return hf

# ── Banner de sección ───────────────────────────────────────────────────────
def banner(titulo, sub, color_hex, st):
    c = colors.HexColor(color_hex)
    t = Table([[Paragraph(titulo, st['titulo_cat'])],
               [Paragraph(sub,    st['sub_cat'])]],
              colWidths=[CW])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0),(-1,-1), c),
        ('TOPPADDING', (0,0),(-1,-1), 10), ('BOTTOMPADDING',(0,0),(-1,-1), 10),
        ('LEFTPADDING',(0,0),(-1,-1), 14), ('RIGHTPADDING', (0,0),(-1,-1), 14),
    ]))
    return t

# ── Grid de productos ───────────────────────────────────────────────────────
def grid_productos(productos_area, st, cols=3, img_h=60*mm, mostrar_precio=False):
    """Genera un grid de N columnas con imagen, nombre, marca y tipología."""
    cel_w = (CW - (cols-1)*4*mm) / cols
    cells = []
    
    for p in productos_area:
        img_id = p.get('imagen_drive_id', '').strip()
        pil = descargar_imagen(img_id) if img_id else None
        
        if pil:
            img_bytes = pil_to_bytes(pil)
            iw, ih = pil.size
            ratio = min(cel_w/iw, img_h/ih)
            rl_img = RLImage(io.BytesIO(img_bytes), width=iw*ratio, height=ih*ratio)
            rl_img.hAlign = 'CENTER'
        else:
            rl_img = Paragraph('[ sin imagen ]', st['nota'])
        
        nombre = p.get('nombre', '')
        marca  = p.get('marca', '')
        tipo   = p.get('tipologia', '')
        
        contenido = [rl_img,
                     Paragraph(nombre, st['nombre_prod']),
                     Paragraph(marca,  st['marca_prod'])]
        if tipo:
            contenido.append(Paragraph(tipo, st['tipo_prod']))
        
        # Precio opcional
        if mostrar_precio and p.get('mostrar_precio','').lower() in ('sí','si','yes','true','1'):
            precio = p.get('precio_con _iva', p.get('precio_con_iva',''))
            if precio:
                contenido.append(Paragraph(f'{precio} €', st['nota']))
        
        cells.append(contenido)
    
    # Rellenar hasta múltiplo de cols
    while len(cells) % cols:
        cells.append([Paragraph('', st['nota'])])
    
    rows = [cells[i:i+cols] for i in range(0, len(cells), cols)]
    t = Table(rows, colWidths=[cel_w]*cols)
    t.setStyle(TableStyle([
        ('ALIGN',        (0,0),(-1,-1), 'CENTER'),
        ('VALIGN',       (0,0),(-1,-1), 'TOP'),
        ('TOPPADDING',   (0,0),(-1,-1), 8),
        ('BOTTOMPADDING',(0,0),(-1,-1), 8),
        ('LEFTPADDING',  (0,0),(-1,-1), 3),
        ('RIGHTPADDING', (0,0),(-1,-1), 3),
        ('LINEBELOW',    (0,0),(-1,-2), 0.4, COLOR_BORDE),
    ]))
    return t

# ── Portada ─────────────────────────────────────────────────────────────────
def portada(story, area_cfg, logo_png, st):
    from reportlab.platypus import Image as RLImg
    import datetime
    ahora = datetime.datetime.utcnow()
    año_actual = ahora.year
    fecha_generacion = ahora.strftime('%d/%m/%Y a las %H:%M UTC')

    story.append(Spacer(1, 18*mm))
    if logo_png and os.path.exists(logo_png):
        lh = 70*mm
        lw = lh * (600/740)
        lg = RLImg(logo_png, width=lw, height=lh)
        lg.hAlign = 'CENTER'
        story.append(lg)
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph(area_cfg['titulo'], st['titulo_port']))
    story.append(Paragraph(area_cfg['subtitulo'], st['sub_port']))
    story.append(Paragraph(f'{año_actual}', st['año']))
    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width=60*mm, thickness=2, color=COLOR_ROJO, hAlign='CENTER'))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph(
        'Distribución profesional al Sector Profesional.<br/>'
        'Más de un siglo al servicio de nuestros clientes.', st['intro']))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        'Precios orientativos sujetos a variación. Consulte con nuestro equipo comercial.',
        st['nota']))
    story.append(Spacer(1, 12*mm))
    ct = Table([[
        Paragraph('<b>Dirección</b><br/>Av. Alfred Nobel, 2<br/>13005 Ciudad Real', st['contacto']),
        Paragraph('<b>Teléfono</b><br/>926 221 217', st['contacto']),
        Paragraph('<b>Email</b><br/>correo@orenciomatas.es', st['contacto']),
        Paragraph('<b>Web</b><br/>orenciomatas.es', st['contacto']),
    ]], colWidths=[CW/4]*4)
    ct.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),(-1,-1), COLOR_FONDO),
        ('BOX',           (0,0),(-1,-1), 0.5, COLOR_BORDE),
        ('INNERGRID',     (0,0),(-1,-1), 0.5, COLOR_BORDE),
        ('TOPPADDING',    (0,0),(-1,-1), 10),
        ('BOTTOMPADDING', (0,0),(-1,-1), 10),
        ('ALIGN',         (0,0),(-1,-1), 'CENTER'),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ]))
    story.append(ct)
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph(f'Catálogo generado el {fecha_generacion}', st['nota']))
    story.append(PageBreak())

# ── Generar un catálogo ─────────────────────────────────────────────────────
def generar_catalogo(area, productos, logo_png):
    cfg = AREAS[area]
    out_path = os.path.join(OUTPUT_DIR, cfg['filename'])
    st = estilos()
    
    # Filtrar productos: incluir_en_catalogo = sí/si/yes/true/1 y área correcta
    productos_area = [
        p for p in productos
        if p.get('area','').lower().strip() == area
        and p.get('incluir_en_catalogo','').lower().strip() in ('sí','si','yes','true','1','✓')
    ]
    
    if not productos_area:
        print(f"  ⚠ Sin productos para área '{area}', saltando")
        return False
    
    print(f"  → {len(productos_area)} productos en '{area}'")
    
    doc = SimpleDocTemplate(out_path, pagesize=A4,
                            topMargin=20*mm, bottomMargin=14*mm,
                            leftMargin=MARGIN, rightMargin=MARGIN)
    hf = make_header_footer(logo_png)
    story = []
    
    # Portada
    portada(story, cfg, logo_png, st)
    
    # Agrupar por tipología
    tipologias = {}
    for p in productos_area:
        t = p.get('tipologia', 'General').strip() or 'General'
        tipologias.setdefault(t, []).append(p)
    
    for i, (tipo, prods) in enumerate(sorted(tipologias.items())):
        if i > 0:
            story.append(PageBreak())
        story.append(banner(cfg['titulo'], tipo, cfg['color'], st))
        story.append(Spacer(1, 5*mm))
        story.append(grid_productos(prods, st, cols=3))
    
    doc.build(story, onFirstPage=hf, onLaterPages=hf)
    print(f"  ✓ Generado: {out_path}")
    return True

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Logo: convertir SVG a PNG si existe
    logo_png = None
    if os.path.exists(LOGO_PATH):
        try:
            import cairosvg
            logo_png = '/tmp/logo_cat.png'
            cairosvg.svg2png(url=LOGO_PATH, write_to=logo_png, output_width=600)
        except ImportError:
            logo_png = None
    
    productos = leer_productos()
    
    generados = []
    for area in AREAS:
        print(f"\n▶ Área: {area}")
        ok = generar_catalogo(area, productos, logo_png)
        if ok:
            generados.append(area)
    
    # Escribir manifiesto JSON con las áreas disponibles
    manifiesto = {
        'generado': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'catalogos': {
            area: AREAS[area]['filename'] for area in generados
        }
    }
    with open(os.path.join(OUTPUT_DIR, 'manifiesto.json'), 'w') as f:
        json.dump(manifiesto, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Completado: {len(generados)} catálogos generados → {OUTPUT_DIR}/")

if __name__ == '__main__':
    main()
