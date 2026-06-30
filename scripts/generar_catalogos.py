#!/usr/bin/env python3
"""
Generador de catálogos PDF para Orencio Matas y Hermanos, S.L.
Lee productos de Google Sheets, descarga imágenes de Drive y genera PDFs por área.
"""

import os, io, json, requests, datetime
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

# ── Leer familias del Sheet ─────────────────────────────────────────────────
def leer_familias():
    """Lee la hoja 'FamiliasProductos' y devuelve un dict {familia: orden}."""
    url = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
           f"/gviz/tq?tqx=out:csv&sheet=FamiliaProductos")
    try:
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        import csv, io as sio
        reader = csv.DictReader(sio.StringIO(resp.text))
        # Normalizar cabeceras
        raw_headers = reader.fieldnames or []
        print(f"  FamiliasProductos cabeceras: {raw_headers}")
        familias = {}
        for row in reader:
            # Buscar columnas de forma flexible (case-insensitive)
            clean = {k.strip().lower(): v.strip() for k, v in row.items()}
            familia = (clean.get('familia') or clean.get('family') or '').strip().upper()
            orden_raw = (clean.get('orden') or clean.get('order') or '999').strip()
            try:
                orden = int(float(orden_raw))
            except:
                orden = 999
            if familia:
                familias[familia] = orden
        print(f"✓ {len(familias)} familias leídas")
        return familias
    except Exception as e:
        print(f"⚠ No se pudo leer FamiliasProductos: {e}")
        return {}

# ── Leer subfamilias del Sheet ─────────────────────────────────────────────────
def leer_subfamilias():
    """Lee la hoja 'SubfamiliaProductos' y devuelve un dict {(familia, subfamilia): orden}."""
    url = (f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
           f"/gviz/tq?tqx=out:csv&sheet=SubfamiliaProductos")
    try:
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        import csv, io as sio
        reader = csv.DictReader(sio.StringIO(resp.text))
        raw_headers = reader.fieldnames or []
        print(f"  SubfamiliaProductos cabeceras: {raw_headers}")
        subfamilias = {}
        for row in reader:
            # Buscar columnas de forma flexible (case-insensitive)
            clean = {k.strip().lower(): v.strip() for k, v in row.items()}
            familia = (clean.get('familia') or clean.get('family') or '').strip().upper()
            subfamilia = (clean.get('subfamilia') or clean.get('subcategory') or '').strip()
            orden_raw = (clean.get('orden') or clean.get('order') or '999').strip()
            try:
                orden = int(float(orden_raw))
            except:
                orden = 999
            if familia and subfamilia:
                subfamilias[(familia, subfamilia)] = orden
        print(f"✓ {len(subfamilias)} subfamilias leídas")
        return subfamilias
    except Exception as e:
        print(f"⚠ No se pudo leer SubfamiliaProductos: {e}")
        return {}

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
        clean = {k.strip().lower().replace(' ', '_'): v.strip() for k, v in row.items()}
        productos.append(clean)

    print(f"✓ {len(productos)} productos leídos del Sheet")
    return productos

# ── Caché local de imágenes ─────────────────────────────────────────────────
_img_cache = {}

# Sesión reutilizable con retry automático
_session = None
def get_session():
    global _session
    if _session is None:
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry
        _session = requests.Session()
        retry = Retry(total=2, backoff_factor=0.5,
                      status_forcelist=[429, 500, 502, 503, 504])
        _session.mount('https://', HTTPAdapter(max_retries=retry))
    return _session

# ── Descargar imagen de Google Drive ───────────────────────────────────────
def descargar_imagen(drive_id, max_px=400):
    """Descarga una imagen de Drive por su ID y la devuelve como objeto PIL."""
    if not drive_id or drive_id == 'NO_TIENE_FOTO':
        return None
    if drive_id in _img_cache:
        return _img_cache[drive_id]
    try:
        session = get_session()
        url = f"https://drive.google.com/uc?export=download&id={drive_id}"
        resp = session.get(url, timeout=(5, 10), allow_redirects=True)
        if resp.status_code != 200:
            _img_cache[drive_id] = None
            return None
        content_type = resp.headers.get('Content-Type', '')
        if 'text/html' in content_type:
            url2 = f"https://lh3.googleusercontent.com/d/{drive_id}"
            resp = session.get(url2, timeout=(5, 10), allow_redirects=True)
            if resp.status_code != 200 or 'text/html' in resp.headers.get('Content-Type',''):
                _img_cache[drive_id] = None
                return None
        img = PILImage.open(io.BytesIO(resp.content)).convert('RGB')
        w, h = img.size
        if max(w, h) > max_px:
            ratio = max_px / max(w, h)
            img = img.resize((int(w*ratio), int(h*ratio)), PILImage.LANCZOS)
        _img_cache[drive_id] = img
        return img
    except Exception as e:
        _img_cache[drive_id] = None
        return None

def precargar_imagenes(productos_area, max_workers=8):
    """Descarga en paralelo todas las imágenes de un área antes de generar el PDF."""
    ids = list({p.get('imagen_drive_id','').strip() for p in productos_area
                if p.get('imagen_drive_id','').strip() and
                   p.get('imagen_drive_id','') != 'NO_TIENE_FOTO' and
                   p.get('imagen_drive_id','') not in _img_cache})
    if not ids:
        return
    print(f"  Descargando {len(ids)} imágenes en paralelo ({max_workers} hilos)...")
    from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
    ok = 0
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futuros = {ex.submit(descargar_imagen, id_): id_ for id_ in ids}
        try:
            for f in as_completed(futuros, timeout=480):  # 8 min por área
                try:
                    if f.result() is not None:
                        ok += 1
                except Exception:
                    pass
        except TimeoutError:
            # Continuar con las imágenes ya descargadas — no abortar
            ok = sum(1 for id_ in ids if _img_cache.get(id_) is not None)
            print(f"  ⚠ Timeout — continuando con {ok}/{len(ids)} imágenes descargadas")
    print(f"  ✓ {ok}/{len(ids)} imágenes disponibles")

def añadir_etiqueta_oferta(img):
    """Superpone una etiqueta en forma de banderín rojo pegada al borde sup-izq."""
    from PIL import ImageDraw, ImageFont
    img = img.copy()
    w, h = img.size
    draw = ImageDraw.Draw(img)

    tag_w = int(w * 0.34)   # algo más ancho para que quepa el texto
    tag_h = int(h * 0.13)

    # Polígono en banderín
    pts    = [(0, 0), (tag_w, 0), (tag_w - int(tag_h * 0.55), tag_h), (0, tag_h)]
    shadow = [(x+3, y+3) for x, y in pts]
    draw.polygon(shadow, fill=(80, 0, 0))
    draw.polygon(pts, fill=(211, 27, 27))
    # Franja inferior oscura
    franja = [(0, tag_h - int(tag_h*0.18)),
              (tag_w - int(tag_h*0.55), tag_h - int(tag_h*0.18)),
              (tag_w - int(tag_h*0.55), tag_h),
              (0, tag_h)]
    draw.polygon(franja, fill=(160, 10, 10))

    # Texto: reducir font_size hasta que quepa con margen
    texto = '★ OFERTA'
    area_texto_w = int(tag_w * 0.78)   # zona segura sin llegar a la punta
    font_size = max(10, tag_h // 2)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
        # Reducir hasta que quepa
        while font_size > 8:
            bbox = draw.textbbox((0, 0), texto, font=font)
            if bbox[2] - bbox[0] <= area_texto_w:
                break
            font_size -= 1
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), texto, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (area_texto_w - tw) // 2
    ty = (tag_h - th) // 2
    draw.text((tx+1, ty+1), texto, fill=(100, 0, 0), font=font)
    draw.text((tx, ty), texto, fill='white', font=font)

    return img

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
        'ref_prod':    ParagraphStyle('ref', fontName='Helvetica', fontSize=6,
                                      textColor=COLOR_GRIS, alignment=TA_CENTER, spaceBefore=1),
        'precio_con':  ParagraphStyle('pc', fontName='Helvetica-Bold', fontSize=11,
                                      textColor=COLOR_ROJO, alignment=TA_CENTER, spaceBefore=3),
        'precio_sin':  ParagraphStyle('ps', fontName='Helvetica', fontSize=6,
                                      textColor=COLOR_GRIS, alignment=TA_CENTER, spaceBefore=1),
    }

# ── Header y footer de página ───────────────────────────────────────────────
def make_header_footer(logo_png_path):
    año = datetime.datetime.now().year
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
        canvas.drawRightString(W-MARGIN, H-9.5*mm, f'Catálogo de Productos {año}')
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
def grid_productos(productos_area, st, cols=4, img_h=55*mm):
    """Genera un grid respetando espacios_a_ocupar (1-6) por producto.
    1-3: ocupan columnas en la fila actual.
    4-6: ocupan columnas adicionales desbordando a la fila siguiente (imagen más alta).
    """
    MAX_SPAN = cols * 2  # 8 = página completa (4 cols × 2 filas)
    cel_w_unit = (CW - (cols-1)*4*mm) / cols
    base_h = img_h

    items = []
    for p in productos_area:
        img_id = p.get('imagen_drive_id', '').strip()
        pil = descargar_imagen(img_id) if img_id else None

        es_oferta = p.get('oferta', '').lower().strip() in ('sí','si','yes','true','1','✓')
        if pil and es_oferta:
            pil = añadir_etiqueta_oferta(pil)

        try:
            span = max(1, min(MAX_SPAN, int(p.get('espacios_a_ocupar', 1) or 1)))
        except:
            span = 1

        # Span en columnas y filas
        col_span = min(span, cols)          # columnas que ocupa (1-3)
        row_span = (span - 1) // cols + 1  # filas de altura (1 o 2)

        cel_w    = cel_w_unit * col_span + (col_span - 1) * 4 * mm
        cel_img_h = base_h * row_span * (1 + (col_span - 1) * 0.2)

        if pil:
            img_bytes = pil_to_bytes(pil)
            iw, ih = pil.size
            ratio = min(cel_w / iw, cel_img_h / ih)
            rl_img = RLImage(io.BytesIO(img_bytes), width=iw*ratio, height=ih*ratio)
            rl_img.hAlign = 'CENTER'
        else:
            rl_img = Paragraph('[ sin imagen ]', st['nota'])

        nombre = p.get('nombre', '')
        tipologia = p.get('tipologia', '').strip()
        subfamilia = p.get('subfamilia', '').strip()
        ref    = p.get('referencia', '').strip()
        precio_sin = p.get('precio_sin_iva', '').strip().replace(',', '.')
        precio_con = p.get('precio_con_iva', '').strip().replace(',', '.')
        ver_precio = p.get('mostrar_precio','').lower().strip() in ('sí','si','yes','true','1')

        contenido = [rl_img, Paragraph(nombre, st['nombre_prod'])]
        # Mostrar familia y subfamilia (ej: "Familia (Subfamilia)")
        if tipologia:
            familia_texto = tipologia
            if subfamilia:
                familia_texto += f' ({subfamilia})'
            contenido.append(Paragraph(familia_texto, st['tipo_prod']))
        if ref:
            contenido.append(Paragraph(f'Ref: {ref}', st['ref_prod']))
        if ver_precio:
            if precio_con:
                try:
                    contenido.append(Paragraph(f'{float(precio_con):.2f} € <font size="5">(IVA inc.)</font>', st['precio_con']))
                except:
                    contenido.append(Paragraph(f'{precio_con} €', st['precio_con']))
            if precio_sin:
                try:
                    contenido.append(Paragraph(f'{float(precio_sin):.2f} € sin IVA', st['precio_sin']))
                except:
                    contenido.append(Paragraph(f'{precio_sin} € sin IVA', st['precio_sin']))

        items.append((contenido, col_span, cel_w))

    # Distribuir en filas respetando col_spans
    rows, widths_rows = [], []
    cur_row, cur_widths, cur_sum = [], [], 0

    for (contenido, col_span, cel_w) in items:
        if cur_sum + col_span > cols:
            while cur_sum < cols:
                cur_row.append(Paragraph('', st['nota']))
                cur_widths.append(cel_w_unit)
                cur_sum += 1
            rows.append(cur_row)
            widths_rows.append(cur_widths)
            cur_row, cur_widths, cur_sum = [], [], 0

        cur_row.append(contenido)
        cur_widths.append(cel_w)
        cur_sum += col_span

    if cur_row:
        while cur_sum < cols:
            cur_row.append(Paragraph('', st['nota']))
            cur_widths.append(cel_w_unit)
            cur_sum += 1
        rows.append(cur_row)
        widths_rows.append(cur_widths)

    if not rows:
        return Spacer(1, 1*mm)

    tablas = []
    for row, widths in zip(rows, widths_rows):
        t = Table([row], colWidths=widths)
        t.setStyle(TableStyle([
            ('ALIGN',        (0,0),(-1,-1), 'CENTER'),
            ('VALIGN',       (0,0),(-1,-1), 'TOP'),
            ('TOPPADDING',   (0,0),(-1,-1), 8),
            ('BOTTOMPADDING',(0,0),(-1,-1), 8),
            ('LEFTPADDING',  (0,0),(-1,-1), 3),
            ('RIGHTPADDING', (0,0),(-1,-1), 3),
            ('LINEBELOW',    (0,0),(-1,-1), 0.4, COLOR_BORDE),
        ]))
        tablas.append(t)
    return tablas

# ── Portada ─────────────────────────────────────────────────────────────────
def portada(story, area_cfg, logo_png, st):
    from reportlab.platypus import Image as RLImg
    import datetime
    ahora = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=2)))
    año_actual = ahora.year
    fecha_generacion = ahora.strftime('%d/%m/%Y a las %H:%M (hora Madrid)')

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
def generar_catalogo(area, productos, logo_png, familias={}):
    cfg = AREAS[area]
    out_path = os.path.join(OUTPUT_DIR, cfg['filename'])
    st = estilos()
    
    # Filtrar productos: solo por área correcta (sin filtro incluir_en_catalogo)
    productos_area = [
        p for p in productos
        if p.get('area','').lower().strip() == area
    ]
    
    if not productos_area:
        print(f"  ⚠ Sin productos para área '{area}', saltando")
        return False
    
    print(f"  → {len(productos_area)} productos en '{area}'")

    # Precargar todas las imágenes en paralelo antes de generar el PDF
    precargar_imagenes(productos_area)
    
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

    def orden_tipologia(nombre):
        """Devuelve el orden según FamiliasProductos, o 9999 si no está."""
        return familias.get(nombre.upper(), 9999)

    for i, (tipo, prods) in enumerate(sorted(tipologias.items(), key=lambda x: (orden_tipologia(x[0]), x[0]))):
        if i > 0:
            story.append(PageBreak())
        story.append(banner(cfg['titulo'], tipo, cfg['color'], st))
        story.append(Spacer(1, 5*mm))
        resultado = grid_productos(prods, st, cols=4)
        if isinstance(resultado, list):
            story.extend(resultado)
        else:
            story.append(resultado)
    
    doc.build(story, onFirstPage=hf, onLaterPages=hf)
    print(f"  ✓ Generado: {out_path}")

    num_paginas = 0
    try:
        import fitz  # PyMuPDF
        pdf_doc = fitz.open(out_path)
        num_paginas = len(pdf_doc)
        pdf_doc.close()
        print(f"  ✓ {num_paginas} páginas")
    except Exception as e:
        print(f"  ⚠ No se pudo contar páginas: {e}")

    return {'paginas': num_paginas, 'productos': len(productos_area)}

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
    familias  = leer_familias()
    subfamilias = leer_subfamilias()

    generados = []
    info_catalogos = {}
    for area in AREAS:
        print(f"\n▶ Área: {area}")
        resultado = generar_catalogo(area, productos, logo_png, familias)
        if resultado and resultado.get('paginas', 0) > 0:
            generados.append(area)
            info_catalogos[area] = resultado
        # Liberar caché de imágenes entre áreas para no agotar RAM
        _img_cache.clear()
        import gc
        gc.collect()
        print(f"  Memoria liberada.")
    
    # Escribir manifiesto JSON con las áreas disponibles
    import datetime as _dt
    manifiesto = {
        'generado': _dt.datetime.utcnow().isoformat() + 'Z',
        'catalogos': {
            area: {
                'archivo':  AREAS[area]['filename'],
                'paginas':  info_catalogos[area]['paginas'],
                'productos': info_catalogos[area]['productos'],
            } for area in generados
        }
    }
    with open(os.path.join(OUTPUT_DIR, 'manifiesto.json'), 'w') as f:
        json.dump(manifiesto, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Completado: {len(generados)} catálogos generados → {OUTPUT_DIR}/")

if __name__ == '__main__':
    main()
