#!/usr/bin/env python3
"""
Prepara una copia "pública parcial" del sitio para subir a IONOS, sin el
buscador ni el acceso a los catálogos (aún no listos para publicarse).

No toca los archivos originales del repositorio — todo se hace sobre una
copia en un directorio de salida aparte. Pensado para ejecutarse desde el
workflow de despliegue a IONOS, pero también se puede lanzar en local para
comprobar el resultado antes de subir nada:

    python3 scripts/preparar_build_ionos.py --origen . --salida ionos_build

Cuando llegue el momento de publicar el buscador y los catálogos, este
script deja de usarse (o se ajusta la lista de EXCLUSIONES) — la fuente de
verdad del sitio completo sigue siendo el propio repositorio, esto es solo
una transformación de salida para esta fase concreta.
"""
import argparse
import re
import shutil
from pathlib import Path

# Archivos/carpetas que no se publican en absoluto en esta fase — ni el
# buscador ni el acceso a catálogos, ni nada de uso interno/desarrollo.
EXCLUSIONES = {
    '.git', '.github', '.nojekyll',
    'data',            # productos.json, manifiesto.json, PDFs de catálogo — no hace falta sin buscador/catálogos
    'imagenes_tool', 'email_sage', 'sage_sync', 'scripts', 'scripts_ci',
    'docs',            # documentación interna (PRD, informes...)
    'prompts',         # prompts de agentes usados en el diseño, no contenido del sitio
    'components',      # borradores .md de secciones, no las páginas reales servidas
    'design',          # design-system.md, documentación interna
    'buscador.html', 'visor_catalogo.html',
    'catalogo_drogueria.html', 'catalogo_perfumeria.html',
    'catalogo_pinturas.html', 'catalogo_talleres.html',
    'homepage-tailwind.html',  # borrador sin enlazar desde la navegación real
    'zaphiro_config.json', 'marcas_dominios.json',
    'requirements.txt', 'CLAUDE.md',
    'generar_informe_pdf.py', 'generate_informe_pdf_v3.ps1',  # herramientas internas de informes de horas
}

# El menú "Productos" es un desplegable cuyo ÚNICO elemento del submenú
# es "Buscador" (idéntico en las 9 páginas, solo cambia la indentación) —
# si solo se quita la línea del enlace interior, queda la ESTRUCTURA del
# desplegable (flecha + <ul> vacío), y al pasar el ratón por encima en
# escritorio se despliega un submenú vacío. Se sustituye el bloque
# COMPLETO por un enlace simple, sin desplegable.
PATRON_DROPDOWN_PRODUCTOS = re.compile(
    r'<li class="navbar__item--dropdown">\s*'
    r'<a href="productos\.html">Productos\s*<span class="navbar__caret">[^<]*</span></a>\s*'
    r'<ul class="navbar__submenu">\s*'
    r'<li><a href="buscador\.html">Buscador</a></li>\s*'
    r'</ul>\s*'
    r'</li>',
    re.DOTALL
)

PATRON_ENLACE_BUSCADOR = re.compile(
    r'\s*<li><a href="buscador\.html">Buscador</a></li>\s*\n'
)


def limpiar_enlace_buscador(html: str) -> str:
    # Primero el desplegable completo de "Productos" (caso principal en
    # las 9 páginas). Si por lo que sea no coincidiera en alguna página
    # (estructura distinta), el patrón de línea suelta de abajo actúa
    # como red de seguridad para no dejar el enlace colgando de todos
    # modos — aunque en ese caso podría quedar la estructura vacía del
    # desplegable, de ahí el aviso de referencias sueltas al final.
    html = PATRON_DROPDOWN_PRODUCTOS.sub('<li><a href="productos.html">Productos</a></li>', html)
    return PATRON_ENLACE_BUSCADOR.sub('\n', html)


def limpiar_productos_html(html: str) -> str:
    """productos.html tiene dos piezas propias además del enlace del menú:
    el banner promocional que enlaza al buscador, y el script que detecta
    catálogos publicados en GitHub Releases y reconecta los botones — si
    se deja ese script, en IONOS intentaría enlazar a páginas de catálogo
    que no van a existir todavía, dejando botones rotos."""
    html = limpiar_enlace_buscador(html)

    # Banner "Buscador de productos" — sección autocontenida completa.
    html = re.sub(
        r'\s*<section class="section" style="padding-top:0;">\s*'
        r'<div class="section-inner">\s*'
        r'<a href="buscador\.html".*?</a>\s*'
        r'</div>\s*</section>\s*\n',
        '\n', html, flags=re.DOTALL
    )

    # Script de detección dinámica de catálogos (el IIFE completo que
    # consulta la API de GitHub y reescribe los botones de cada área).
    html = re.sub(
        r'\s*<script>\s*/\*\*[^<]*?y actualiza los botones dinámicamente\.\s*'
        r'\*/\s*\(function\(\) \{.*?\}\)\(\);\s*</script>\s*\n',
        '\n', html, flags=re.DOTALL
    )

    return html


def limpiar_sitemap(xml: str) -> str:
    """Quita del sitemap las URLs de catálogo — no tiene sentido que los
    buscadores intenten indexar páginas que en esta fase no van a existir."""
    return re.sub(
        r'\s*<url>\s*<loc>https://orenciomatas\.es/catalogo_\w+\.html</loc>.*?</url>\s*\n',
        '\n', xml, flags=re.DOTALL
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--origen', default='.', help='Raíz del repositorio')
    ap.add_argument('--salida', required=True, help='Directorio de salida (se crea si no existe)')
    args = ap.parse_args()

    origen = Path(args.origen).resolve()
    salida = Path(args.salida).resolve()

    if salida.exists():
        shutil.rmtree(salida)
    salida.mkdir(parents=True)

    copiados, excluidos = 0, 0
    for item in origen.iterdir():
        if item.name in EXCLUSIONES or item.name == salida.name:
            excluidos += 1
            continue
        destino = salida / item.name
        if item.is_dir():
            shutil.copytree(item, destino)
        else:
            shutil.copy2(item, destino)
        copiados += 1

    print(f'Copiados {copiados} elementos, excluidos {excluidos} (buscador/catálogos/uso interno).')

    # Transformar las páginas HTML restantes
    transformadas = 0
    for html_file in salida.glob('*.html'):
        contenido = html_file.read_text(encoding='utf-8')
        if html_file.name == 'productos.html':
            nuevo = limpiar_productos_html(contenido)
        else:
            nuevo = limpiar_enlace_buscador(contenido)
        if nuevo != contenido:
            html_file.write_text(nuevo, encoding='utf-8')
            transformadas += 1

    print(f'Transformadas {transformadas} páginas (enlace de Buscador quitado del menú).')

    # Limpiar sitemap.xml de las URLs de catálogo que aún no existen
    sitemap = salida / 'sitemap.xml'
    if sitemap.exists():
        contenido_sitemap = sitemap.read_text(encoding='utf-8')
        nuevo_sitemap = limpiar_sitemap(contenido_sitemap)
        if nuevo_sitemap != contenido_sitemap:
            sitemap.write_text(nuevo_sitemap, encoding='utf-8')
            print('✓ sitemap.xml: quitadas las URLs de catálogo que aún no existen.')

    # Añadir .htaccess para IONOS: redirigir /defaultsite a raíz,
    # forzar index.html como documento por defecto y evitar listado
    # de directorios.
    htaccess = salida / '.htaccess'
    htaccess.write_text(
        'Options -Indexes\n'
        'DirectoryIndex index.html\n\n'
        '# Redirigir /defaultsite (y subpáginas antiguas indexadas) a la raíz\n'
        'RedirectMatch 301 ^/defaultsite(/?.*)$ /$1\n',
        encoding='utf-8'
    )
    print('✓ .htaccess: redirección de /defaultsite a raíz añadida.')

    # Fallback por si .htaccess no se lee o /defaultsite pide
    # explícitamente una página de índice: redirigir con meta-refresh
    # al raíz. Sobrescribe cualquier index.html del directorio
    # "defaultsite" que IONOS mantenga por defecto.
    defaultsite_dir = salida / 'defaultsite'
    defaultsite_dir.mkdir(exist_ok=True)
    (defaultsite_dir / 'index.html').write_text(
        '<!DOCTYPE html>\n'
        '<html lang="es">\n'
        '<head>\n'
        '  <meta charset="utf-8">\n'
        '  <meta http-equiv="refresh" content="0; url=/">\n'
        '  <title>Redirigiendo...</title>\n'
        '</head>\n'
        '<body>\n'
        '  <p>Redirigiendo a <a href="/">www.orenciomatas.es</a>...</p>\n'
        '</body>\n'
        '</html>\n',
        encoding='utf-8'
    )
    print('✓ defaultsite/index.html: redirección por meta-refresh añadida.')

    # Comprobación de seguridad: que no quede ninguna referencia colgante
    # a buscador.html o a los catálogos en lo que sí se va a publicar, ni
    # ningún desplegable de navegación vacío (el caso real que motivó
    # esta comprobación: "Productos" se quedó con la flecha y un <ul>
    # vacío tras quitar su único elemento, "Buscador").
    referencias_sueltas = []
    for html_file in salida.rglob('*.html'):
        contenido = html_file.read_text(encoding='utf-8')
        if 'buscador.html' in contenido or re.search(r'catalogo_\w+\.html', contenido):
            referencias_sueltas.append(html_file.name)
        if re.search(r'<ul class="navbar__submenu">\s*</ul>', contenido):
            referencias_sueltas.append(f'{html_file.name} (desplegable de navegación vacío)')

    if referencias_sueltas:
        print(f'⚠ AVISO: quedan referencias a buscador/catálogos sin limpiar en: {referencias_sueltas}')
        print('  Revisa manualmente antes de publicar — puede haber un enlace nuevo no contemplado por este script.')
    else:
        print('✓ Sin referencias colgantes a buscador/catálogos en el contenido a publicar.')


if __name__ == '__main__':
    main()
