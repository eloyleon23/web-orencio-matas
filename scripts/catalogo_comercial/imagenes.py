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


def cargar_imagen_local(ruta: Optional[str], tamano=400) -> Optional[PILImage.Image]:
    if not ruta:
        return None
    if ruta in _cache:
        return _cache[ruta]
    if not os.path.exists(ruta):
        _cache[ruta] = None
        return None
    try:
        img = PILImage.open(ruta).convert('RGB')
        img = componer_lienzo_cuadrado(img, tamano=tamano)
        _cache[ruta] = img
        return img
    except Exception:
        _cache[ruta] = None
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


def pil_to_bytes(img: PILImage.Image, calidad=82) -> bytes:
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=calidad, optimize=True)
    return buf.getvalue()


def imagen_para_producto(producto, tamano=400) -> PILImage.Image:
    """Punto de entrada único: resuelve imagen real o placeholder, y
    aplica el badge de descuento si corresponde. Usado tanto por el
    grid normal como por el layout de producto estrella."""
    img = cargar_imagen_local(producto.imagen_ruta, tamano=tamano)
    if img is None:
        img = generar_placeholder(producto.nombre, tamano=tamano)
    if producto.oferta and producto.descuento_pct and producto.descuento_pct > 0:
        img = añadir_badge_descuento(img, producto.descuento_pct)
    return img
