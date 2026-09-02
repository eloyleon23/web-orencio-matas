"""
Validación de productos de entrada, ANTES de componer/renderizar nada.

Distingue (punto 13 del encargo):
  - ERRORES → bloquean ESE producto (no todo el catálogo). Si un producto
    tiene un error, se descarta y se registra, pero el resto del catálogo
    se genera igualmente. Un catálogo comercial no debe fallar entero
    por una fila mal rellenada en la Sheet.
  - WARNINGS → el producto se incluye igualmente, con el warning
    registrado (ej. imagen no encontrada → placeholder).
"""
from __future__ import annotations

import os
from decimal import Decimal
from typing import List

from .modelo import Producto, ResultadoValidacion
from .reglas_comerciales import to_decimal, descuento_pct_valido, protagonismo_valido

VALORES_SI = {'sí', 'si', 'yes', 'true', '1', 1, True}


def _es_si(valor) -> bool:
    if isinstance(valor, bool):
        return valor
    if valor is None:
        return False
    return str(valor).strip().lower() in VALORES_SI


def validar_catalogo(productos_raw: List[dict], carpeta_imagenes: str) -> ResultadoValidacion:
    productos_ok: List[Producto] = []
    warnings: List[str] = []
    errores: List[str] = []

    for i, raw in enumerate(productos_raw):
        ref = str(raw.get('referencia') or raw.get('ref') or '').strip()
        etiqueta = ref or f'(fila {i+1} sin referencia)'

        nombre = str(raw.get('nombre') or '').strip()
        if not nombre:
            errores.append(f"{etiqueta}: sin nombre — producto descartado del catálogo.")
            continue

        if not ref:
            errores.append(f"{etiqueta}: sin referencia — producto descartado del catálogo.")
            continue

        precio_con_iva = to_decimal(raw.get('precio_con_iva') or raw.get('precio_con'))
        if precio_con_iva is None or precio_con_iva <= 0:
            errores.append(f"{ref}: precio con IVA inválido ('{raw.get('precio_con_iva')}') — producto descartado.")
            continue

        precio_sin_iva = to_decimal(raw.get('precio_sin_iva') or raw.get('precio_sin'))
        if (raw.get('precio_sin_iva') or raw.get('precio_sin')) and precio_sin_iva is None:
            warnings.append(f"{ref}: precio sin IVA no interpretable, se omitirá ese dato.")

        oferta_raw = raw.get('oferta')
        oferta = _es_si(oferta_raw)
        if oferta_raw not in (None, '') and not isinstance(oferta_raw, bool) and str(oferta_raw).strip().lower() not in VALORES_SI | {'no', 'false', '0'}:
            errores.append(f"{ref}: valor de 'oferta' no reconocido ('{oferta_raw}') — debe ser sí/no. Producto descartado.")
            continue

        descuento_pct = to_decimal(raw.get('descuento_pct')) or Decimal('0')
        if not descuento_pct_valido(descuento_pct):
            errores.append(f"{ref}: descuento fuera de rango (0-90%): {descuento_pct}. Producto descartado.")
            continue
        if oferta and descuento_pct == 0:
            warnings.append(f"{ref}: marcado como oferta pero sin % de descuento — se mostrará solo como destacado 'oferta' sin precio tachado.")
        if not oferta and descuento_pct > 0:
            warnings.append(f"{ref}: tiene % de descuento pero oferta=no — se ignora el descuento (no se aplicará).")
            descuento_pct = Decimal('0')

        protagonismo_raw = raw.get('protagonismo', 1)
        if not protagonismo_valido(protagonismo_raw):
            errores.append(f"{ref}: nivel de protagonismo fuera de 1-5 ('{protagonismo_raw}'). Producto descartado.")
            continue
        protagonismo = int(protagonismo_raw)

        familia = str(raw.get('familia') or '').strip()
        if not familia:
            warnings.append(f"{ref}: sin familia — se agrupará en 'Sin clasificar'.")
            familia = 'Sin clasificar'

        imagen_ruta = None
        img_nombre = raw.get('imagen') or raw.get('img')
        if img_nombre:
            posible = os.path.join(carpeta_imagenes, img_nombre)
            if os.path.exists(posible):
                imagen_ruta = posible
            else:
                warnings.append(f"{ref}: imagen '{img_nombre}' no encontrada en {carpeta_imagenes} — se usará placeholder.")
        else:
            warnings.append(f"{ref}: sin imagen asociada — se usará placeholder.")

        productos_ok.append(Producto(
            orden=i,
            referencia=ref,
            nombre=nombre,
            familia=familia,
            precio_con_iva=precio_con_iva,
            precio_sin_iva=precio_sin_iva,
            oferta=oferta,
            descuento_pct=descuento_pct,
            protagonismo=protagonismo,
            imagen_ruta=imagen_ruta,
            fabricante=(raw.get('fabricante') or None),
            subfamilia=(raw.get('subfamilia') or None),
        ))

    return ResultadoValidacion(productos=productos_ok, warnings=warnings, errores=errores)
