"""
Pipeline de imágenes del catálogo comercial.

Reutiliza DELIBERADAMENTE el mismo tratamiento visual que ya usa y tiene
validado `scripts/generar_catalogos.py` (recorte de margen blanco +
lienzo cuadrado uniforme) — no se reinventa un sistema de imágenes
paralelo, tal como pide el punto 11 del encargo. Las funciones
`recortar_margen_blanco` y `componer_lienzo_cuadrado` son una copia
literal de ese archivo.

Fase 1 (esta implementación): las imágenes se leen de disco local
(`assets/imagenes_talleres/`, ya en el repo). Fase 2 (Sheet): cuando el
producto venga de la hoja Productos con imagen en Drive, añadir aquí
`descargar_imagen_drive()` calcado del de generar_catalogos.py — el
resto del pipeline (recorte, lienzo, badge de oferta) es el mismo y no
necesita cambios.
"""
from __future__ import annotations

import io
import os
from typing import Optional

from PIL import Image as PILImage, ImageDraw, ImageFont

PLACEHOLDER_COLOR = (238, 238, 238)


def recortar_margen_blanco(pil_img, umbral=245, margen_seguridad=6):
    from PIL import ImageChops  # noqa: F401 (mantenido por paridad con el original)
    gris = pil_img.convert('L')
    mascara = gris.point(lambda px: 255 if px < umbral else 0)
    bbox = mascara.getbbox()
    if not bbox:
        return pil_img
    x0, y0, x1, y1 = bbox
    w, h = pil_img.size
    x0 = max(0, x0 - margen_seguridad)
    y0 = max(0, y0 - margen_seguridad)
    x1 = min(w, x1 + margen_seguridad)
    y1 = min(h, y1 + margen_seguridad)
    if (x1 - x0) < 20 or (y1 - y0) < 20:
        return pil_img
    return pil_img.crop((x0, y0, x1, y1))


def componer_lienzo_cuadrado(pil_img, tamano=400, fondo='white'):
    img = recortar_margen_blanco(pil_img.copy())
    img.thumbnail((tamano, tamano), PILImage.LANCZOS)
    lienzo = PILImage.new('RGB', (tamano, tamano), fondo)
    x = (tamano - img.width) // 2
    y = (tamano - img.height) // 2
    lienzo.paste(img, (x, y))
    return lienzo


_cache: dict = {}


def cargar_imagen_local(ruta: Optional[str], tamano=400, cuadrado=True) -> Optional[PILImage.Image]:
    if not ruta:
        return None
    clave = (ruta, tamano, cuadrado)
    if clave in _cache:
        return _cache[clave]
    if not os.path.exists(ruta):
        _cache[clave] = None
        return None
    try:
        img = PILImage.open(ruta).convert('RGB')
        if cuadrado:
            img = componer_lienzo_cuadrado(img, tamano=tamano)
        else:
            # Sin forzar lienzo cuadrado: solo recorta el margen blanco y
            # escala manteniendo la proporción real de la foto. Se usa
            # para productos anchos (protagonismo 3+), donde forzar un
            # cuadrado dejaba mucho margen blanco inútil alrededor del
            # producto y lo hacía parecer más pequeño de lo que la celda
            # realmente permite.
            img = recortar_margen_blanco(img)
            img.thumbnail((tamano, tamano), PILImage.LANCZOS)
        _cache[clave] = img
        return img
    except Exception:
        _cache[clave] = None
        return None


def generar_placeholder(nombre: str, tamano=400) -> PILImage.Image:
    """Producto sin imagen: en vez de un hueco vacío, un cuadro neutro
    con el nombre — nunca se inventa una foto ni se deja un hueco roto."""
    img = PILImage.new('RGB', (tamano, tamano), PLACEHOLDER_COLOR)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
    except Exception:
        font = ImageFont.load_default()
    texto = (nombre or 'Sin imagen')[:40]
    # Envolver texto en varias líneas simples
    import textwrap
    lineas = textwrap.wrap(texto, width=18)[:4]
    total_h = len(lineas) * 24
    y = (tamano - total_h) // 2
    for linea in lineas:
        bbox = draw.textbbox((0, 0), linea, font=font)
        w = bbox[2] - bbox[0]
        draw.text(((tamano - w) // 2, y), linea, fill=(120, 120, 120), font=font)
        y += 24
    return img


def añadir_badge_descuento(img: PILImage.Image, descuento_pct) -> PILImage.Image:
    """Banderín rojo '-XX%' pegado a la esquina superior izquierda,
    mismo estilo/técnica que `añadir_etiqueta_oferta` de
    generar_catalogos.py pero mostrando el porcentaje real en vez de un
    genérico '★ OFERTA' — más útil en un catálogo estrictamente
    comercial donde el % es el argumento de venta."""
    img = img.copy()
    w, h = img.size
    draw = ImageDraw.Draw(img)

    tag_w = int(w * 0.36)
    tag_h = int(h * 0.16)
    pts = [(0, 0), (tag_w, 0), (tag_w - int(tag_h * 0.55), tag_h), (0, tag_h)]
    shadow = [(x + 3, y + 3) for x, y in pts]
    draw.polygon(shadow, fill=(80, 0, 0))
    draw.polygon(pts, fill=(217, 27, 27))

    texto = f'-{int(descuento_pct)}%'
    area_texto_w = int(tag_w * 0.78)
    font_size = max(12, tag_h // 2)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
        while font_size > 9:
            bbox = draw.textbbox((0, 0), texto, font=font)
            if bbox[2] - bbox[0] <= area_texto_w:
                break
            font_size -= 1
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), texto, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (area_texto_w - tw) // 2
    ty = (tag_h - th) // 2
    draw.text((tx + 1, ty + 1), texto, fill=(100, 0, 0), font=font)
    draw.text((tx, ty), texto, fill='white', font=font)
    return img


RUTA_PROVEEDORES = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                                 'assets', 'proveedores')
# Solo se listan aquí las marcas de las que Eloy confirmó que se dispone
# de logo real en la web/assets del proyecto — nunca se inventa ni se
# usa un logo genérico para una marca sin archivo propio.
LOGOS_FABRICANTE = {
    'zaphiro': 'zaphiro_logo_oscuro.png',
    'besa': 'besa_logo_recortado.png',
    'glasurit': 'Glaurit_recortado.png',
    'baslac': 'Logo_baslac.jpg',
    'titantech': 'logo-titantech.jpg',
    'titanpro': 'LOGO-TITANPRO.png',
}


def añadir_logo_fabricante(img: PILImage.Image, fabricante) -> PILImage.Image:
    """Insignia con el logo real del fabricante, pegada a la esquina
    inferior derecha de la foto de producto (la cinta de descuento ya
    ocupa la superior izquierda — ver `añadir_badge_descuento`). Fondo
    blanco semitransparente detrás del logo para que se lea sobre
    cualquier foto, clara u oscura. A petición de Eloy: "que aparezca
    el logo de los productos que ofertamos... de las que disponemos en
    la web (Zaphiro, Besa, etc)"."""
    if not fabricante:
        return img
    archivo = LOGOS_FABRICANTE.get(fabricante.strip().lower())
    if not archivo:
        return img
    ruta = os.path.join(RUTA_PROVEEDORES, archivo)
    if not os.path.exists(ruta):
        return img
    img = img.copy().convert('RGBA')
    w, h = img.size
    logo = PILImage.open(ruta).convert('RGBA')
    lw, lh = logo.size
    ancho_destino = int(w * 0.34)
    alto_destino = max(1, int(ancho_destino * lh / lw))
    alto_max = int(h * 0.17)
    if alto_destino > alto_max:
        alto_destino = alto_max
        ancho_destino = max(1, int(alto_destino * lw / lh))
    logo_r = logo.resize((ancho_destino, alto_destino), PILImage.LANCZOS)
    pad = max(2, int(alto_destino * 0.22))
    badge = PILImage.new('RGBA', (ancho_destino + pad * 2, alto_destino + pad * 2), (255, 255, 255, 230))
    badge.paste(logo_r, (pad, pad), logo_r)
    x = w - badge.width - max(2, int(w * 0.02))
    y = h - badge.height - max(2, int(h * 0.02))
    img.alpha_composite(badge, (x, y))
    return img.convert('RGB')


def pil_to_bytes(img: PILImage.Image, calidad=92) -> bytes:
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=calidad, optimize=True)
    return buf.getvalue()


def preparar_para_incrustar(pil_img: PILImage.Image, ancho_pt: float, alto_pt: float, dpi_objetivo: int = 220) -> PILImage.Image:
    """Antes de incrustar una imagen en el PDF, la escala nosotros
    mismos (con LANCZOS, mejor que el reescalado que aplicaría el lector
    de PDF por su cuenta) hasta el tamaño real en píxeles que le
    corresponde a `dpi_objetivo` en el tamaño final de impresión, y le
    aplica un enfoque suave (unsharp mask) para compensar el
    ablandamiento típico de agrandar una foto.

    IMPORTANTE — límite real, no solo de código: las fotos originales
    de los catálogos de proveedor (Zaphiro/Besa) son de resolución muy
    baja (algunas de apenas 80-250 px de lado, extraídas de PDFs de
    catálogo). Esta función mejora la nitidez PERCIBIDA al máximo que
    da de sí el software, pero no puede inventar detalle que la foto
    original no tiene — para una nitidez realmente profesional en
    tamaño grande hace falta una foto de origen de mayor resolución
    (ver `contexto_catalogo_comercial_talleres.md`)."""
    from PIL import ImageFilter
    ancho_px_obj = max(1, int(round(ancho_pt / 72 * dpi_objetivo)))
    alto_px_obj = max(1, int(round(alto_pt / 72 * dpi_objetivo)))
    if pil_img.width < ancho_px_obj or pil_img.height < alto_px_obj:
        pil_img = pil_img.resize((ancho_px_obj, alto_px_obj), PILImage.LANCZOS)
        pil_img = pil_img.filter(ImageFilter.UnsharpMask(radius=1.3, percent=65, threshold=2))
    return pil_img


def imagen_para_producto(producto, tamano=400, cuadrado=True) -> PILImage.Image:
    """Punto de entrada único: resuelve imagen real o placeholder, y
    aplica el badge de descuento si corresponde. Usado tanto por el
    grid normal como por el layout de producto estrella.

    `cuadrado=False` mantiene la proporción real de la foto (sin
    lienzo cuadrado con margen blanco) — se usa para productos con
    protagonismo 3+ para aprovechar mejor el espacio ancho asignado."""
    img = cargar_imagen_local(producto.imagen_ruta, tamano=tamano, cuadrado=cuadrado)
    if img is None:
        img = generar_placeholder(producto.nombre, tamano=tamano)
    if producto.oferta and producto.descuento_pct and producto.descuento_pct > 0:
        img = añadir_badge_descuento(img, producto.descuento_pct)
    img = añadir_logo_fabricante(img, producto.fabricante)
    return img
