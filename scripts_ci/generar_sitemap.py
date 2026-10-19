"""Regenera sitemap.xml a partir de las páginas reales del sitio.

Antes, sitemap.xml se mantenía a mano: con cada página nueva había que
acordarse de añadirla, y nadie reescribía las ~70 fichas del Centro de
Soluciones cuando se creaba o eliminaba una guía desde su propio editor
con PIN (son contenido dinámico, viven en una hoja de Sheet y una caché
en Drive — nunca han sido ficheros de este repo). Resultado: el sitemap
llevaba desde 2026-09-25 sin tocarse y le faltaban páginas reales
(ver anuncios.html).

Este script reconstruye el fichero entero cada vez que se ejecuta, para
no volver a quedarse desactualizado:

  - Páginas estáticas: cualquier *.html de la raíz del repo que tenga
    <link rel="canonical" href="https://orenciomatas.es/..."> y NO lleve
    <meta name="robots" content="noindex..."> — exactamente el mismo
    criterio que ya separa a mano las páginas públicas (actualidad.html,
    buscador.html...) de las internas (panel_admin.html,
    visor_catalogo.html, acceso-profesional.html) o huérfanas sin
    canonical (homepage-tailwind.html, un boceto no enlazado desde
    ningún sitio).
  - Fichas del Centro de Soluciones: se leen en vivo desde el mismo
    endpoint público que usa la web (obtener_soluciones), así que
    cualquier guía añadida o retirada desde el editor con PIN se refleja
    aquí sola, sin tocar código.

changefreq/priority para las páginas estáticas conocidas se mantienen
con los mismos valores curados a mano que ya tenía sitemap.xml (algunas
páginas merecen más peso que otras); una página nueva que no esté en
ese mapa recibe un valor por defecto razonable.
"""

import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from urllib.request import urlopen

RAIZ = Path(__file__).resolve().parent.parent
BASE_URL = 'https://orenciomatas.es'
GOOGLE_APPS_SCRIPT_URL = (
    'https://script.google.com/macros/s/'
    'AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec'
)

# (changefreq, priority) curados a mano para cada página estática conocida
# — se conservan tal cual estaban en el sitemap anterior. Cualquier .html
# nuevo que cumpla el criterio de inclusión y no esté aquí recibe
# CONFIG_POR_DEFECTO.
CONFIG_PAGINAS = {
    'index.html': ('monthly', '1.0'),
    'empresa.html': ('monthly', '0.8'),
    'servicios.html': ('monthly', '0.8'),
    'productos.html': ('monthly', '0.9'),
    'historia.html': ('monthly', '0.7'),
    'actualidad.html': ('weekly', '0.6'),
    'profesionales.html': ('monthly', '0.8'),
    'buscador.html': ('weekly', '0.8'),
    'centro-soluciones.html': ('weekly', '0.9'),
    'catalogo_drogueria.html': ('monthly', '0.7'),
    'catalogo_perfumeria.html': ('monthly', '0.7'),
    'catalogo_pinturas.html': ('monthly', '0.7'),
    'catalogo_talleres.html': ('monthly', '0.7'),
    'escaparate.html': ('weekly', '0.6'),
    'escaparate-campanas.html': ('weekly', '0.6'),
    'anuncios.html': ('weekly', '0.6'),
    'aviso-legal.html': ('yearly', '0.3'),
    'politica-privacidad.html': ('yearly', '0.3'),
    'politica-cookies.html': ('yearly', '0.3'),
}
CONFIG_POR_DEFECTO = ('monthly', '0.6')
CONFIG_SOLUCION = ('monthly', '0.6')


def tiene_noindex(contenido):
    return bool(re.search(r'<meta\s+name="robots"[^>]*content="[^"]*noindex', contenido, re.IGNORECASE))


def canonical_publico(contenido):
    m = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', contenido)
    if not m:
        return None
    href = m.group(1)
    return href if href.startswith(BASE_URL) else None


def fecha_ultimo_commit(ruta_relativa):
    try:
        salida = subprocess.run(
            ['git', 'log', '-1', '--format=%cd', '--date=short', '--', ruta_relativa],
            cwd=RAIZ, capture_output=True, text=True, check=True, timeout=10,
        ).stdout.strip()
        if salida:
            return salida
    except Exception as e:
        print(f'  aviso: no se pudo obtener la fecha de commit de {ruta_relativa}: {e}', file=sys.stderr)
    return date.today().isoformat()


def paginas_estaticas():
    paginas = []
    for ruta in sorted(RAIZ.glob('*.html')):
        contenido = ruta.read_text(encoding='utf-8', errors='ignore')
        if tiene_noindex(contenido):
            continue
        loc = canonical_publico(contenido)
        if not loc:
            continue
        nombre = ruta.name
        changefreq, priority = CONFIG_PAGINAS.get(nombre, CONFIG_POR_DEFECTO)
        lastmod = fecha_ultimo_commit(nombre)
        paginas.append((loc, lastmod, changefreq, priority))
    return paginas


def slugs_soluciones_activas():
    try:
        with urlopen(GOOGLE_APPS_SCRIPT_URL + '?accion=obtener_soluciones', timeout=20) as resp:
            import json
            datos = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f'  aviso: no se pudieron leer las soluciones desde Apps Script, se mantienen las del sitemap anterior si las hay: {e}', file=sys.stderr)
        return None
    soluciones = datos.get('soluciones', [])
    activos = [s.get('slug') for s in soluciones if s.get('activo', True) and s.get('slug')]
    return activos


def paginas_soluciones(slugs):
    hoy = date.today().isoformat()
    changefreq, priority = CONFIG_SOLUCION
    return [
        (f'{BASE_URL}/soluciones/solucion.html?slug={slug}', hoy, changefreq, priority)
        for slug in slugs
    ]


def generar_xml(paginas):
    partes = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod, changefreq, priority in paginas:
        partes.append('   <url>')
        partes.append(f'      <loc>{loc}</loc>')
        partes.append(f'      <lastmod>{lastmod}</lastmod>')
        partes.append(f'      <changefreq>{changefreq}</changefreq>')
        partes.append(f'      <priority>{priority}</priority>')
        partes.append('   </url>')
    partes.append('</urlset>')
    partes.append('')
    return '\n'.join(partes)


def main():
    estaticas = paginas_estaticas()
    print(f'Páginas estáticas públicas encontradas: {len(estaticas)}')

    slugs = slugs_soluciones_activas()
    if slugs is None:
        soluciones = []
        sitemap_actual = (RAIZ / 'sitemap.xml').read_text(encoding='utf-8') if (RAIZ / 'sitemap.xml').exists() else ''
        hoy = date.today().isoformat()
        for m in re.finditer(r'<loc>(https://orenciomatas\.es/soluciones/solucion\.html\?slug=[^<]+)</loc>', sitemap_actual):
            soluciones.append((m.group(1), hoy, *CONFIG_SOLUCION))
        print(f'Fichas de soluciones conservadas del sitemap anterior (no se pudo contactar con Apps Script): {len(soluciones)}')
    else:
        soluciones = paginas_soluciones(slugs)
        print(f'Fichas de soluciones activas leídas desde Apps Script: {len(soluciones)}')

    todas = estaticas + soluciones
    xml = generar_xml(todas)
    (RAIZ / 'sitemap.xml').write_text(xml, encoding='utf-8')
    print(f'sitemap.xml regenerado con {len(todas)} URLs en total.')


if __name__ == '__main__':
    main()
