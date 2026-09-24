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
# panel de administración interno, ni nada de uso interno/desarrollo. El
# buscador (y los catálogos, la exposición, el Centro de Soluciones y
# profesionales) ya se publican — todas priorizan la fuente en vivo y
# tienen su administración correctamente oculta tras OM_PREPRODUCCION.
EXCLUSIONES = {
    '.git', '.github', '.nojekyll',
    'imagenes_tool', 'email_sage', 'sage_sync', 'scripts', 'scripts_ci',
    'docs',            # documentación interna (PRD, informes...)
    'prompts',         # prompts de agentes usados en el diseño, no contenido del sitio
    'components',      # borradores .md de secciones, no las páginas reales servidas
    'design',          # design-system.md, documentación interna
    'panel_admin.html', # panel de administración por PIN — solo accesible desde preproducción, a petición explícita de Eloy
    'homepage-tailwind.html',  # borrador sin enlazar desde la navegación real
    'zaphiro_config.json', 'marcas_dominios.json',
    'requirements.txt', 'CLAUDE.md',
    'generar_informe_pdf.py', 'generate_informe_pdf_v3.ps1',  # herramientas internas de informes de horas
}

# Dentro de data/ (que SÍ se publica ahora, para el respaldo estático de
# catalogo_*.html/catalogo-preview.js) se excluye solo la subcarpeta de
# PDFs — pesan varios MB por área y ya no hace falta servirlos desde
# aquí, el visor/descarga van directos a Drive. El resto de data/ (los
# JSON de productos, incluidos los 4 catálogos de proveedor de Talleres)
# sí se necesita.
EXCLUSIONES_DATA = {'catalogos'}


def desactivar_entorno_preproduccion(salida: Path) -> None:
    """Cambia a false el ÚNICO flag central (assets/js/entorno.js) del
    que derivan todos los window.MOSTRAR_X de administración (gestión de
    imágenes, asistente de imágenes, precio mayor, actualizar/validar/
    buscar imagen, gestionar relacionados, dar de baja, gestión de
    campañas/escaparates, gestión de soluciones) — un único cambio de
    texto en un único archivo desactiva toda la administración a la vez
    en la copia que se sube a IONOS, sin tener que tocar cada página por
    separado. El repositorio (rama main) se queda siempre con `true`;
    esta función solo modifica la COPIA de salida, nunca el original.

    Falla de forma ruidosa (no en silencio) si el archivo no existe o si
    el patrón esperado no aparece exactamente como se espera — mejor que
    el workflow falle a que una release termine en IONOS con la
    administración accesible por un cambio de redacción no contemplado
    aquí.
    """
    entorno_js = salida / 'assets' / 'js' / 'entorno.js'
    if not entorno_js.exists():
        raise SystemExit(
            f'✗ ERROR: no se encuentra {entorno_js} en la copia de salida — '
            'no se puede desactivar la administración para IONOS. Aborta el build.'
        )

    contenido = entorno_js.read_text(encoding='utf-8')
    patron = re.compile(r'^window\.OM_PREPRODUCCION = true;$', re.MULTILINE)
    if not patron.search(contenido):
        raise SystemExit(
            f'✗ ERROR: {entorno_js} no contiene la línea esperada '
            '"window.OM_PREPRODUCCION = true;" — puede que se haya reescrito '
            'con otra redacción. Ajusta este script antes de publicar, o la '
            'administración podría quedar accesible en IONOS. Aborta el build.'
        )

    nuevo_contenido = patron.sub('window.OM_PREPRODUCCION = false;', contenido)
    entorno_js.write_text(nuevo_contenido, encoding='utf-8')
    print('✓ assets/js/entorno.js: administración desactivada para esta copia (OM_PREPRODUCCION = false).')


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

    print(f'Copiados {copiados} elementos, excluidos {excluidos} (panel admin/uso interno).')

    # Dentro de data/ (si se copió), quitar las subcarpetas de
    # EXCLUSIONES_DATA (los PDFs de catálogo — ver el comentario junto a
    # su definición) — más preciso que excluir toda la carpeta data/,
    # que ahora hace falta para el respaldo estático de los catálogos.
    carpeta_data = salida / 'data'
    if carpeta_data.is_dir():
        for nombre in EXCLUSIONES_DATA:
            subcarpeta = carpeta_data / nombre
            if subcarpeta.exists():
                shutil.rmtree(subcarpeta)
                print(f'✓ data/{nombre}: quitado de la copia de salida (se sirve directo desde Drive).')

    # Desactivar TODA la administración (gestión de imágenes, asistente de
    # imágenes, precio mayor, actualizar/validar/buscar imagen, gestionar
    # relacionados, dar de baja, gestión de campañas/escaparates, gestión
    # de soluciones) con un único cambio de texto — ver la función para
    # el detalle. Debe ir DESPUÉS de la copia de archivos (para que
    # assets/js/entorno.js ya exista en la salida) y ANTES de dar la
    # release por lista.
    desactivar_entorno_preproduccion(salida)

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

    # Comprobación de seguridad general: que no quede ningún desplegable
    # de navegación vacío — históricamente pasó con "Productos" al
    # quitar su único elemento del submenú (cuando buscador.html seguía
    # excluido); ya no debería darse ahora que buscador.html se publica,
    # pero se deja como red de seguridad genérica ante cualquier cambio
    # futuro que deje un <ul> de submenú sin contenido.
    referencias_sueltas = []
    for html_file in salida.rglob('*.html'):
        contenido = html_file.read_text(encoding='utf-8')
        if re.search(r'<ul class="navbar__submenu">\s*</ul>', contenido):
            referencias_sueltas.append(f'{html_file.name} (desplegable de navegación vacío)')

    if referencias_sueltas:
        print(f'⚠ AVISO: {referencias_sueltas}')
        print('  Revisa manualmente antes de publicar.')
    else:
        print('✓ Sin desplegables de navegación vacíos en el contenido a publicar.')


if __name__ == '__main__':
    main()
