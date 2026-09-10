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

Las sugerencias viven directamente en la hoja Productos, como una
columna más — nada de mantener un archivo aparte ni cruzar referencias
a mano.

1. Abre el Excel generado. Cada fila trae `referencia`,
   `relacionados_sugeridos` (ya en el formato listo para copiar) y
   `relacionados_nombres` (los nombres, para poder juzgar sin tener que
   buscar cada referencia a mano).
2. Pega el contenido completo (con cabeceras) en una pestaña **nueva**
   del Sheet, llamada exactamente **`Sugerencias_Temp`**.
3. Menú **"📦 Catálogos Orencio Matas" → "🔗 Importar sugerencias de
   relacionados"** — crea (la primera vez) o reutiliza una columna
   `relacionados_sugeridos` en Productos, y la rellena emparejando por
   referencia automáticamente.
4. Revisa fila a fila en la propia hoja Productos: la columna nueva
   queda justo al lado de todo el resto de contexto del producto,
   comparable directamente con la columna `relacionados` ya existente
   en la misma fila.
5. Para lo que apruebes, copia el valor de `relacionados_sugeridos`
   (como **valor**, no fórmula) a la columna `relacionados` — es la
   única que se lee al generar productos.json; `relacionados_sugeridos`
   se ignora siempre, se puede dejar o borrar sin ningún efecto.
6. Cuando termines, borra la columna `relacionados_sugeridos` y la
   pestaña `Sugerencias_Temp` si quieres dejarlo limpio — no hacen
   falta para nada más.
7. Regenera la caché del buscador (menú "🔄 Regenerar caché completa
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

---

# Herramienta con IA — generar_sugerencias_relacionados_ia.py

Complementa a la de reglas fijas: cubre el resto del catálogo con
criterio de la IA (Gemini), reutilizando **exactamente** el mismo
mecanismo ya afinado y probado en producción el 10/09/2026 en el
propio buscador (botón "Ver sugerencias con IA" en la ficha de cada
producto) — mismo muestreo de candidatos, mismo prompt, misma
validación anti-alucinación, con el bug de parseo (que descartaba
sugerencias buenas por quitar puntos finales del nombre) ya corregido.

## Alcance

Solo **droguería, perfumería y pinturas** — Talleres queda excluido a
propósito, por el mismo motivo que ya se explica arriba para la
herramienta de reglas (riesgo de mezclar sistemas químicos
incompatibles sin poder juzgarlo con fiabilidad solo por el nombre,
ni siquiera con IA).

A día de hoy (10/09/2026) hay **4.801 productos** de esas tres áreas
sin `relacionados` informado ni `relacionados_gestionado` (los que ya
se decidió a propósito dejar sin ninguno se respetan, no se sugiere
encima).

## Uso

```bash
pip install openpyxl requests
export GEMINI_API_KEY="la-misma-clave-que-usa-apps-script"

# Prueba rápida primero, SIEMPRE — para revisar que la calidad
# convence antes de lanzar el catálogo completo:
python3 generar_sugerencias_relacionados_ia.py --entrada productos.json --limite 20

# Ejecución completa. Con los ~4.800 productos actuales y la pausa por
# defecto (1,2 s entre peticiones, para no saturar la cuota de la API),
# puede tardar del orden de 2 a 4 horas reales (la pausa configurada
# más el tiempo de red/respuesta de cada petición) — se puede dejar
# corriendo en segundo plano.
python3 generar_sugerencias_relacionados_ia.py --entrada productos.json --salida sugerencias_ia.xlsx
```

## Se puede interrumpir y reanudar sin perder nada

Guarda el progreso cada 20 productos en `checkpoint_relacionados_ia.json`
(ruta configurable con `--checkpoint`). Si se corta por lo que sea
(Ctrl+C, se cierra la terminal, se cae la conexión), basta con volver a
lanzar **el mismo comando** — retoma justo donde se quedó, sin repetir
peticiones ya hechas ni gastar cuota de más.

## Cómo revisar y aplicar las sugerencias

**Exactamente el mismo procedimiento** que la herramienta de reglas
(ver arriba) — mismas columnas en el Excel de salida
(`referencia, relacionados_sugeridos, relacionados_nombres, regla`),
con `regla` siempre a `"ia"` para poder distinguir el origen si se
mezclan ambos Excel en la misma pestaña `Sugerencias_Temp` antes de
importar. Recuerda siempre escribir con espacio tras la coma
(`"ref1, ref2"`) al copiar a la columna `relacionados` real — una
lista sin espacios se interpreta como número decimal con la
configuración regional española del Sheet.

## Por qué el mismo mecanismo que ya usa el buscador, no algo nuevo

Se probó y afinó en pruebas reales de Eloy sobre productos concretos
antes de generalizarlo en lote:

- **Candidatos siempre reales**: la IA nunca inventa un producto, solo
  puede elegir (copiando el nombre exacto) entre una muestra
  ESTRATIFICADA por familia dentro de la misma área — nunca de su
  propia familia (eso serían variantes del mismo producto, no un
  complemento).
- **Criterio "misma tarea, no mismo tema"**: el prompt incluye el
  ejemplo real de error ya detectado (para un abono líquido, no
  sugerir césped artificial — ambos "de jardín", pero el césped
  artificial no se abona) para anclar el criterio y evitar
  asociaciones temáticas superficiales.
- **Cada candidato lleva su familia real** junto al nombre en el
  prompt, no solo el nombre a secas — para que la IA pueda descartar
  con más criterio.
- **Validación estricta**: cada sugerencia se comprueba letra por letra
  contra la lista real de candidatos antes de aceptarla.
