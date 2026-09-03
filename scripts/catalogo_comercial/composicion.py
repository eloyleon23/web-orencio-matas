"""
Motor de composición editorial.

v3 — tras la segunda revisión visual: el catálogo real de referencia es
un cartel A4 a DOS COLUMNAS con secciones pequeñas y densas (como un
folleto de supermercado), no páginas a todo lo ancho. Por eso el nivel
5 deja de ser un "bloque de página propia" (no tiene sentido en una
columna de ~90mm) y pasa a ser, como los demás niveles, una celda de la
rejilla de la familia — la única diferencia es que ocupa el ancho
completo de la columna y con una imagen más grande. La jerarquía visual
1→5 se consigue con tamaño de imagen y ancho de celda, nunca cambiando
de tipo de layout.

Reglas fijas (documentadas aquí, no dispersas por el renderizador):

1. Orden: se respeta SIEMPRE el orden original de los productos
   (`Producto.orden`). No se reordena por precio, nombre ni nada más.
2. Agrupación: por familia, en el orden de PRIMERA aparición de cada
   familia en la lista (no alfabético, no por tamaño de familia). Cada
   familia se maqueta como UNA caja compacta dentro de una columna.
3. Tamaño según protagonismo — regla real de composición:
     nivel 1 → celda normal (1 columna de la rejilla interna)
     nivel 2 → celda normal + distintivo "★ Recomendado"
     nivel 3 → celda ancha (rejilla interna completa) + imagen más grande
     nivel 4 → igual que 3, imagen aún más grande
     nivel 5 → igual que 3, imagen máxima + distintivo "★ Destacado"
   (el tamaño de imagen exacto por nivel vive en render_pdf.py, que es
   la capa que sabe de mm/puntos — aquí solo se decide cuántas
   "columnas internas" ocupa cada nivel).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from .modelo import Producto

# nivel de protagonismo → nº de columnas internas que ocupa dentro de
# la rejilla de su familia (rejilla interna = tema.cols_grid, 2 por
# defecto). 99 es centinela de "columna completa", se recorta a `cols`
# al renderizar — así funciona igual con cualquier cols_grid.
NIVEL_A_ESPACIOS = {1: 1, 2: 1, 3: 99, 4: 99, 5: 99}


@dataclass
class ElementoGrid:
    productos: List[Producto]  # todos los productos de la familia, en orden


@dataclass
class BloqueFamilia:
    familia: str
    elementos: List[ElementoGrid]  # siempre un único ElementoGrid en v3


def espacios_de(producto: Producto) -> int:
    return NIVEL_A_ESPACIOS.get(producto.protagonismo, 1)


def componer(productos: List[Producto]) -> List[BloqueFamilia]:
    """Agrupa por familia (orden de primera aparición), respetando
    siempre el orden original dentro de cada familia."""
    productos_ordenados = sorted(productos, key=lambda p: p.orden)

    orden_familias: List[str] = []
    por_familia: dict = {}
    for p in productos_ordenados:
        if p.familia not in por_familia:
            por_familia[p.familia] = []
            orden_familias.append(p.familia)
        por_familia[p.familia].append(p)

    return [BloqueFamilia(familia=familia, elementos=[ElementoGrid(por_familia[familia])])
            for familia in orden_familias]
