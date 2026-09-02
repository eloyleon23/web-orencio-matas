"""
Motor de composición editorial.

Reglas fijas (documentadas aquí, no dispersas por el renderizador):

1. Orden: se respeta SIEMPRE el orden original de los productos
   (`Producto.orden`). No se reordena por precio, nombre ni nada más.
2. Agrupación: por familia, en el orden de PRIMERA aparición de cada
   familia en la lista (no alfabético, no por tamaño de familia).
3. Tamaño según protagonismo — regla real de composición, no solo un
   atributo guardado (punto 4 del encargo):
     nivel 1 → celda normal de rejilla (1 columna)
     nivel 2 → celda normal de rejilla + distintivo "Recomendado"
     nivel 3 → celda ancha (2 columnas) — protagonismo medio
     nivel 4 → banda completa (todas las columnas, 1 fila) — muy destacado
     nivel 5 → página/bloque propio a toda anchura con imagen grande y
               ficha editorial — producto protagonista, no es una celda
               de rejilla más grande, es un layout distinto.

Esta reutiliza el mismo concepto de "espacios_a_ocupar" (1-8) que ya usa
`grid_productos()` en generar_catalogos.py, para no inventar un segundo
sistema de maquetación: aquí se traduce protagonismo (1-5) → espacios,
con cols_grid del Tema activo como base.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Union

from .modelo import Producto

# nivel de protagonismo → nº de "espacios" de rejilla, en unidades
# LÓGICAS (no columnas físicas — eso lo resuelve render_pdf según
# cols_grid del tema activo). 99 es un centinela para "fila completa",
# se recorta automáticamente a `cols` al renderizar.
NIVEL_A_ESPACIOS = {1: 1, 2: 1, 3: 2, 4: 99}


@dataclass
class ElementoGrid:
    productos: List[Producto]  # productos a maquetar en rejilla, en orden


@dataclass
class ElementoDestacado:
    producto: Producto  # protagonismo 5 → página/bloque propio


@dataclass
class BloqueFamilia:
    familia: str
    elementos: List[Union[ElementoGrid, ElementoDestacado]]


def espacios_de(producto: Producto) -> int:
    return NIVEL_A_ESPACIOS.get(producto.protagonismo, 1)


def componer(productos: List[Producto]) -> List[BloqueFamilia]:
    """Agrupa por familia (orden de primera aparición) y, dentro de cada
    familia, separa los productos nivel 5 (bloque propio) del resto
    (que se agrupan en tandas consecutivas para la rejilla)."""
    productos_ordenados = sorted(productos, key=lambda p: p.orden)

    orden_familias: List[str] = []
    por_familia: dict = {}
    for p in productos_ordenados:
        if p.familia not in por_familia:
            por_familia[p.familia] = []
            orden_familias.append(p.familia)
        por_familia[p.familia].append(p)

    bloques: List[BloqueFamilia] = []
    for familia in orden_familias:
        elementos: List[Union[ElementoGrid, ElementoDestacado]] = []
        tanda_grid: List[Producto] = []

        def cerrar_tanda():
            if tanda_grid:
                elementos.append(ElementoGrid(list(tanda_grid)))
                tanda_grid.clear()

        for p in por_familia[familia]:
            if p.protagonismo == 5:
                cerrar_tanda()
                elementos.append(ElementoDestacado(p))
            else:
                tanda_grid.append(p)
        cerrar_tanda()

        bloques.append(BloqueFamilia(familia=familia, elementos=elementos))

    return bloques
