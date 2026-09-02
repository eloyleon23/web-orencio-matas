"""
Reglas comerciales — precio, descuento y oferta.

DECISIÓN DE DISEÑO (documentada explícitamente, ver punto 6 del encargo):
El descuento se aplica siempre sobre el PRECIO CON IVA (precio_con_iva),
no sobre el precio sin IVA. Motivo: este catálogo lo lee el responsable
del taller para decidir una compra a precio final de venta — es el
número que realmente paga, y es el que tiene sentido tachar/rebajar en
un documento comercial (igual que hace cualquier folleto de oferta). El
precio sin IVA final, si se muestra, se recalcula a partir del precio
con IVA final usando el mismo IVA implícito del precio original (no se
aplica el descuento dos veces).

Todo el cálculo usa Decimal (nunca float) para evitar errores de
redondeo, con ROUND_HALF_UP a 2 decimales — es el redondeo comercial
habitual en tickets/precios en España.
"""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from typing import Optional

DOS_DECIMALES = Decimal('0.01')


def _redondear(valor: Decimal) -> Decimal:
    return valor.quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)


def to_decimal(valor) -> Optional[Decimal]:
    """Convierte strings tipo '12,50' / '12.50' / 12.5 a Decimal. None si no es parseable."""
    if valor is None or valor == '':
        return None
    try:
        if isinstance(valor, str):
            valor = valor.strip().replace('€', '').replace(' ', '').replace(',', '.')
        return Decimal(str(valor))
    except (InvalidOperation, ValueError):
        return None


def aplicar_reglas_precio(precio_con_iva: Decimal, precio_sin_iva: Optional[Decimal],
                           oferta: bool, descuento_pct: Decimal) -> dict:
    """Devuelve dict con precio_final_con_iva, precio_final_sin_iva, ahorro.

    - Si oferta=False o descuento_pct=0: precio final = precio original, ahorro=0.
    - Si oferta=True y descuento_pct>0: aplica el % sobre precio_con_iva.
    """
    precio_con_iva = _redondear(precio_con_iva)

    if not oferta or descuento_pct <= 0:
        return {
            'precio_final_con_iva': precio_con_iva,
            'precio_final_sin_iva': _redondear(precio_sin_iva) if precio_sin_iva is not None else None,
            'ahorro': Decimal('0.00'),
        }

    factor = (Decimal('100') - descuento_pct) / Decimal('100')
    final_con_iva = _redondear(precio_con_iva * factor)
    ahorro = _redondear(precio_con_iva - final_con_iva)

    final_sin_iva = None
    if precio_sin_iva is not None and precio_sin_iva > 0:
        # Mismo % de IVA implícito que el producto original, aplicado
        # sobre el nuevo precio con IVA — evita aplicar el descuento
        # dos veces (una al con-IVA y otra por separado al sin-IVA).
        iva_implicito = precio_con_iva / precio_sin_iva  # p.ej. 1.21
        if iva_implicito > 0:
            final_sin_iva = _redondear(final_con_iva / iva_implicito)

    return {
        'precio_final_con_iva': final_con_iva,
        'precio_final_sin_iva': final_sin_iva,
        'ahorro': ahorro,
    }


def descuento_pct_valido(pct: Decimal) -> bool:
    """Rango comercial razonable: 1-90%. 0 es válido pero significa 'sin descuento'."""
    return Decimal('0') <= pct <= Decimal('90')


def protagonismo_valido(nivel) -> bool:
    try:
        n = int(nivel)
    except (TypeError, ValueError):
        return False
    return 1 <= n <= 5


def calcular_precios_catalogo(productos) -> None:
    """Aplica aplicar_reglas_precio() a cada Producto ya validado,
    rellenando precio_final_con_iva / precio_final_sin_iva / ahorro.
    Paso separado de la validación a propósito: la validación solo
    comprueba que los DATOS de entrada son correctos; el cálculo de
    precios es una regla de negocio aparte y así queda testeable de
    forma independiente."""
    for p in productos:
        resultado = aplicar_reglas_precio(p.precio_con_iva, p.precio_sin_iva, p.oferta, p.descuento_pct)
        p.precio_final_con_iva = resultado['precio_final_con_iva']
        p.precio_final_sin_iva = resultado['precio_final_sin_iva']
        p.ahorro = resultado['ahorro']
