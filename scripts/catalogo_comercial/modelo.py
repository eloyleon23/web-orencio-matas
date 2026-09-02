"""
Modelo de datos del catálogo comercial de talleres/carrocería.

Separación deliberada (ver contexto_catalogo_comercial.md):
  DATOS (este módulo) │ REGLAS COMERCIALES (reglas_comerciales.py) │
  CAMPAÑA (campanas.py) │ COMPOSICIÓN (composicion.py) │ RENDER (render_pdf.py)

Esto permite cambiar cómo se ve el catálogo (campanas.py, render_pdf.py)
sin tocar cómo se calculan precios/ofertas, y viceversa.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional


@dataclass
class Producto:
    """Un producto ya validado y listo para componer/renderizar.

    `orden` conserva la posición original en la fuente de datos (fila de
    la Sheet en la fase 2; índice en el JSON estático en la fase 1). Es
    OBLIGATORIO respetarlo al componer el catálogo — ver sección 5 del
    encargo: "la Sheet será la fuente de verdad" del orden.
    """
    orden: int
    referencia: str
    nombre: str
    familia: str
    precio_con_iva: Decimal          # precio final IVA incluido, ANTES de descuento
    precio_sin_iva: Optional[Decimal]
    oferta: bool
    descuento_pct: Decimal           # 0 si no hay descuento
    protagonismo: int                # 1-5
    imagen_ruta: Optional[str]       # ruta local absoluta/relativa ya resuelta, o None
    fabricante: Optional[str] = None
    subfamilia: Optional[str] = None

    # Calculados por reglas_comerciales.aplicar_reglas_precio() — no se
    # rellenan a mano nunca desde fuera de ese módulo.
    precio_final_con_iva: Optional[Decimal] = field(default=None)
    precio_final_sin_iva: Optional[Decimal] = field(default=None)
    ahorro: Optional[Decimal] = field(default=None)


@dataclass
class Periodo:
    """Periodo/campaña del catálogo. Es la entrada que determina qué
    'tema' visual se aplica (ver campanas.py) — nunca condiciona la
    lógica de productos/precios, que es agnóstica al periodo.
    """
    tipo: str      # 'mes' | 'trimestre' | 'campaña'
    valor: str     # 'septiembre' | 'Q4' | 'navidad' ...
    anio: int

    @property
    def etiqueta(self) -> str:
        MESES = {
            'enero': 'Enero', 'febrero': 'Febrero', 'marzo': 'Marzo', 'abril': 'Abril',
            'mayo': 'Mayo', 'junio': 'Junio', 'julio': 'Julio', 'agosto': 'Agosto',
            'septiembre': 'Septiembre', 'octubre': 'Octubre', 'noviembre': 'Noviembre',
            'diciembre': 'Diciembre',
        }
        CAMPANAS = {
            'navidad': 'Campaña de Navidad', 'primavera': 'Campaña de Primavera',
            'verano': 'Campaña de Verano', 'vuelta_taller': 'Campaña de Vuelta al Taller',
        }
        if self.tipo == 'mes':
            nombre = MESES.get(self.valor.lower(), self.valor.capitalize())
            return f"{nombre} {self.anio}"
        if self.tipo == 'trimestre':
            return f"{self.valor.upper()} {self.anio}"
        if self.tipo == 'campaña':
            nombre = CAMPANAS.get(self.valor.lower(), f"Campaña de {self.valor.capitalize()}")
            return f"{nombre} {self.anio}"
        return f"{self.valor} {self.anio}"


@dataclass
class ResultadoValidacion:
    productos: list  # List[Producto], solo los válidos
    warnings: list   # List[str]
    errores: list    # List[str]

    @property
    def es_valido(self) -> bool:
        return len(self.errores) == 0 and len(self.productos) > 0
