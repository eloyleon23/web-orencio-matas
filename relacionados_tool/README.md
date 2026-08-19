# Herramienta de sugerencias de productos relacionados

Genera sugerencias de "compra conjunta" / productos relacionados para
revisar y validar antes de pegarlas en la columna **`relacionados`**
de la hoja Productos del Sheet — nunca escribe nada directamente ahí.

## Cómo funciona

El buscador (`buscador.html`) muestra un bloque "Suele usarse junto a"
en el detalle de cada producto. Antes, esas sugerencias venían de 11
reglas fijas escritas en JavaScript (solo droguería/perfumería y
pinturas, con cobertura limitada). Ahora, el buscador prioriza lo que
encuentre en la columna `relacionados` del Sheet — una simple lista de
referencias separadas por comas, ej.:

```
8414227036230,8433295031008
```

Esta herramienta analiza el catálogo completo y **sugiere** qué poner
en esa columna, basándose en patrones por familia/subfamilia/palabra
clave (ej. "champú → mascarilla + cepillo del pelo"). No toca el Sheet
ni productos.json — solo genera un Excel para que decidas qué aceptar.

## Uso

```bash
pip install openpyxl

python3 generar_sugerencias_relacionados.py \
    --entrada productos.json \
    --salida sugerencias_relacionados.xlsx
```

`productos.json` es el mismo archivo que ya genera el proyecto —
descárgalo de `data/productos.json` en el repositorio, o pídeselo a
Claude en una sesión de chat (tiene acceso al repositorio).

## Revisar y aplicar

1. Abre el Excel generado. Cada fila es una sugerencia: `referencia`
   del producto, `relacionados_sugeridos` (las referencias propuestas,
   ya en el formato listo para pegar) y `relacionados_nombres` (los
   nombres, para poder juzgar si tiene sentido sin tener que buscar
   cada referencia a mano).
2. Marca `SI` en la columna `aprobado` para las filas que te parezcan
   bien tal cual (puedes editar `relacionados_sugeridos` primero si
   quieres cambiar algo antes de aprobar).
3. Para las filas aprobadas, copia `referencia` + `relacionados_sugeridos`
   y pégalas en la columna `relacionados` de la hoja Productos del
   Sheet (buscando cada referencia, o con una fórmula BUSCARV si
   prefieres automatizarlo).
4. Regenera la caché del buscador (menú "🔄 Regenerar caché completa
   del buscador", o espera al disparador programado) para que se vea
   reflejado.

## Qué áreas cubre esta versión

- **Droguería**: 12 reglas (lavavajillas, fregasuelos, limpiacristales,
  detergente de ropa, lejía/desinfectante, multiusos/desengrasante,
  insecticidas por tipo de insecto, cepillo de barrer, cubo de basura).
- **Perfumería**: 8 reglas (champú, gel de ducha, espuma de afeitar,
  pasta dental, tinte, crema facial, colonias, gomina/laca).
- **Pinturas**: 1 regla (base de pintura → disolvente + cinta de
  enmascarar + papel protector, simplificación de la lógica que ya
  había en el buscador).
- **Talleres**: 4 reglas, solo sobre los ~3.073 productos de esta área
  que SÍ vienen del Sheet (editables como cualquier otro, con familia
  bien informada aunque sin subfamilia) — lijado→mascarilla+guantes,
  masilla→espátula+disco de lijar, enmascarado→mascarilla,
  spray/aerosol→mascarilla+guantes. Deliberadamente conservadoras:
  se evita a propósito cualquier cruce entre familias específicas de
  sistema de pintura de marca (R-M, URKI-MIX, CAR, BASLAC...), donde
  sugerir mal podría significar mezclar productos de sistemas químicos
  incompatibles — algo que no se puede juzgar solo por el nombre del
  producto sin conocimiento experto real. Los ~825+ productos de los
  catálogos estáticos de proveedor (Zaphiro/Besa/Glasurit/Baslac)
  quedan fuera: no tienen columna del Excel que los respalde, vienen de
  un pipeline completamente distinto (extracción de PDF).

## Añadir más reglas

Cada regla vive en `reglas_drogueria()`, `reglas_perfumeria()` o
`reglas_pinturas()` dentro del script, con esta forma:

```python
def r_mi_condicion(p):
    return 'ALGO' in sin_acentos_mayus(p.get('nombre', ''))

def buscar_mis_sugerencias(p):
    return [
        buscar_por_subfamilia(cat, 'Nombre exacto de subfamilia'),
        buscar_por_keyword(cat, 'PALABRA1', 'PALABRA2'),
    ]

Regla('nombre_descriptivo', 'area', r_mi_condicion, buscar_mis_sugerencias)
```

Las reglas son deliberadamente conservadoras: si no encuentran un
candidato claro, no sugieren nada — mejor eso que una sugerencia sin
sentido. Vuelve a ejecutar el script tras añadir reglas nuevas para
ver el resultado.
