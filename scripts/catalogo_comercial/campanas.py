"""
Sistema de campañas/temas visuales.

Un `Tema` agrupa TODO lo que cambia según el periodo/campaña: colores,
textos de portada/cierre, y parámetros de composición (nº de columnas,
si se usa página de portada ilustrada, etc.). El motor de composición y
el renderizador PDF son siempre los mismos — solo consumen el Tema que
les entrega este módulo. Añadir una campaña nueva es añadir una entrada
al registro TEMAS, no tocar el motor (ver punto 7-8 del encargo).

`resolver_tema(periodo)` es el único punto de entrada: recibe un
Periodo y devuelve el Tema aplicable, con reglas de resolución
explícitas y sin condicionales dispersos por el resto del código.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .modelo import Periodo


@dataclass
class Tema:
    id: str
    # ── Paleta corporativa V3 (folleto claro/comercial, ver brief) ──────
    # Cada color tiene un ROL FIJO, no es intercambiable entre sí:
    #   estructura → antracita: cabeceras, navegación, títulos de familia
    #   identidad  → turquesa/azul corporativo: destacados, badges suaves
    #   precio     → rojo: precio final, la llamada comercial principal
    #   descuento  → amarillo: % de ahorro, elemento de atención
    #   fondo      → blanco/gris muy claro: base de la página, "aire"
    # La campaña puede variar `identidad` (para dar variedad estacional)
    # pero NUNCA `estructura`/`precio`/`descuento` — así la marca no se
    # disuelve entre campañas (ver punto 15 del brief).
    color_fondo: str = '#FFFFFF'
    color_fondo_alterno: str = '#F3F4F6'
    color_estructura: str = '#23262B'
    color_identidad: str = '#0E7490'
    color_precio: str = '#D91B1B'
    color_descuento: str = '#F4B400'
    color_texto: str = '#23262B'
    color_texto_claro: str = '#FFFFFF'
    # ── Campos heredados (v2, aún usados por render_pdf.py) ─────────────
    color_principal: str = '#E4E7EB'
    color_acento: str = '#d91b1b'
    color_texto_sobre_principal: str = '#2B2A29'
    titulo_portada_template: str = 'CATÁLOGO DE {etiqueta_mayus}'
    claim_portada: str = 'Selección de productos para tu taller'
    texto_intro: str = (
        'Una selección de productos pensada para tu día a día en el taller, '
        'con condiciones especiales durante este periodo.'
    )
    texto_cierre: str = (
        'Oferta válida durante el periodo indicado en portada o hasta fin de existencias. '
        'Precios con IVA incluido salvo indicación contraria. Consulta disponibilidad con nuestro equipo.'
    )
    decorativo: Optional[str] = None   # ruta a asset gráfico opcional (esquinas, cintas, etc.)
    cols_grid: int = 2                  # columnas internas DENTRO de cada caja de familia (la página en sí va a 2 columnas — ver render_pdf.py)


# ── Registro de temas ───────────────────────────────────────────────────────
# Tema mensual: gris claro neutro (antes amarillo mostaza — cambiado a
# petición de Eloy, no encajaba). El acento (rojo, para ofertas y
# precios) se mantiene igual.

TEMA_MENSUAL = Tema(
    id='mensual',
    color_principal='#E4E7EB',
    color_acento='#d91b1b',
    color_texto_sobre_principal='#2B2A29',
    color_identidad='#0E7490',
    titulo_portada_template='OFERTAS DEL MES · {etiqueta_mayus}',
    claim_portada='Selección mensual para talleres y carrocerías',
)

TEMA_TRIMESTRAL = Tema(
    id='trimestral',
    color_principal='#2B2A29',
    color_acento='#F9B101',
    color_texto_sobre_principal='#FFFFFF',
    color_identidad='#0E7490',
    titulo_portada_template='CATÁLOGO {etiqueta_mayus}',
    claim_portada='Lo mejor del trimestre para tu taller',
    texto_intro=(
        'Un resumen trimestral con los productos más demandados y las mejores '
        'condiciones para equipar tu taller.'
    ),
)

TEMA_NAVIDAD = Tema(
    id='navidad',
    color_principal='#8C1D22',
    color_acento='#1E7A4C',
    color_texto_sobre_principal='#FFFFFF',
    color_identidad='#1E7A4C',
    titulo_portada_template='{etiqueta_mayus}',
    claim_portada='Regala herramientas, regala productividad',
    texto_intro=(
        'Cierra el año equipando tu taller con condiciones especiales de campaña. '
        'Oferta por tiempo limitado.'
    ),
)

TEMA_PRIMAVERA = Tema(
    id='primavera',
    color_principal='#1E7A4C',
    color_acento='#d91b1b',
    color_texto_sobre_principal='#FFFFFF',
    color_identidad='#1E7A4C',
    titulo_portada_template='{etiqueta_mayus}',
    claim_portada='Renueva tu taller para la nueva temporada',
)

TEMA_VERANO = Tema(
    id='verano',
    color_principal='#0081A9',
    color_acento='#F9B101',
    color_texto_sobre_principal='#FFFFFF',
    color_identidad='#0081A9',
    titulo_portada_template='{etiqueta_mayus}',
    claim_portada='Prepara tu taller para la temporada alta',
)

# Campañas sin tema propio caen aquí — genérico pero identificado por
# nombre real de campaña (nunca "campaña sin definir" ni un tema falso).
TEMA_CAMPANA_GENERICO = Tema(
    id='campaña_generica',
    color_principal='#2B2A29',
    color_acento='#F9B101',
    color_texto_sobre_principal='#FFFFFF',
    color_identidad='#0E7490',
    titulo_portada_template='{etiqueta_mayus}',
    claim_portada='Condiciones especiales de campaña',
)

TEMAS = {
    'mensual': TEMA_MENSUAL,
    'trimestral': TEMA_TRIMESTRAL,
    'navidad': TEMA_NAVIDAD,
    'primavera': TEMA_PRIMAVERA,
    'verano': TEMA_VERANO,
}


def resolver_tema(periodo: Periodo) -> Tema:
    """Reglas de resolución, explícitas y en un único sitio:
    1. tipo='mes'       → TEMA_MENSUAL (el mes concreto solo cambia el texto, vía Periodo.etiqueta)
    2. tipo='trimestre' → TEMA_TRIMESTRAL
    3. tipo='campaña'   → busca el nombre de campaña en TEMAS; si no existe
                           todavía un tema propio, usa TEMA_CAMPANA_GENERICO
                           (nunca falla ni inventa un tema al azar).
    """
    if periodo.tipo == 'mes':
        return TEMA_MENSUAL
    if periodo.tipo == 'trimestre':
        return TEMA_TRIMESTRAL
    if periodo.tipo == 'campaña':
        clave = periodo.valor.strip().lower()
        return TEMAS.get(clave, TEMA_CAMPANA_GENERICO)
    # Periodo con tipo no reconocido: no debe romper el workflow, cae al
    # tema más neutro posible.
    return TEMA_MENSUAL
