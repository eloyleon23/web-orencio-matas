# Contexto — Catálogo comercial de talleres (Fase 1, prototipo)

Continuación específica sobre el **nuevo workflow de catálogo comercial
de talleres/carrocería para público profesional**, encargado como pieza
aparte del resto del proyecto. Para contexto general ver
`contexto_proyecto_om_20082026.md` y `contexto_proyecto_om_02092026.md`.

---

## QUÉ ES

Un catálogo PDF **distinto** de los catálogos generales
(`generar_catalogos.py`, que listan miles de productos por área): este
es corto, cerrado a un periodo/campaña concreto, con una selección
curada de productos y una composición editorial (no un listado). Vive
completamente separado del resto — no toca `generar_catalogos.py` ni
`generar_catalogo_personalizado.py`, solo reutiliza piezas ya
validadas de ambos (pipeline de imágenes, estilo visual, patrón de
workflow con `repository_dispatch`).

**Estado: Fase 1 (prototipo funcional) terminada y probada.** Fase 2
(entrada real por Google Sheet + envío por email vía Apps Script) NO
implementada a propósito — la arquitectura ya está preparada para
conectarla sin rehacer nada (ver más abajo).

---

## ARCHIVOS NUEVOS

```
scripts/catalogo_comercial/
  modelo.py               ← Producto, Periodo, ResultadoValidacion (dataclasses)
  reglas_comerciales.py   ← precio/descuento/oferta, con Decimal, centralizado y testeable
  validacion.py           ← errores bloqueantes (por producto) vs warnings
  campanas.py             ← registro de Temas (mensual/trimestral/navidad/primavera/verano)
  composicion.py          ← agrupación por familia + reglas de tamaño por protagonismo 1-5
  imagenes.py             ← pipeline de imágenes (recorte+lienzo calcado de generar_catalogos.py) + placeholder + badge de descuento
  render_pdf.py           ← ReportLab: portada, banners, rejilla, producto destacado, cierre

scripts/generar_catalogo_comercial.py   ← CLI orquestador de todo el pipeline

data/catalogo_comercial_prueba/
  productos_prueba.json   ← 22 productos reales (Zaphiro/Besa) con imagen real del repo,
                             precios/ofertas/protagonismo ILUSTRATIVOS para probar el motor

.github/workflows/generar_catalogo_comercial.yml   ← workflow_dispatch (Fase 1) + repository_dispatch (Fase 2, preparado)
```

---

## ARQUITECTURA (separación de responsabilidades, punto 16 del encargo)

```
DATOS (modelo.py)
   │
REGLAS COMERCIALES (reglas_comerciales.py)  ← precio/descuento/oferta
   │
VALIDACIÓN (validacion.py)                  ← errores vs warnings
   │
CAMPAÑA/TEMA (campanas.py)                  ← qué periodo → qué colores/textos
   │
COMPOSICIÓN (composicion.py)                ← qué productos → qué tamaño/layout
   │
RENDER (render_pdf.py)                      ← ReportLab, solo pinta lo que le dan
```

Cada capa es independiente de las demás: cambiar el diseño (render_pdf,
campanas) no toca cómo se calculan precios; añadir una campaña nueva es
una entrada en el registro de `campanas.py`, no un `if` nuevo en ningún
otro sitio.

### Reutilización explícita de lo ya existente
- **Imágenes**: `recortar_margen_blanco()` / `componer_lienzo_cuadrado()` son copia literal de `generar_catalogos.py` — mismo tratamiento visual, no un sistema paralelo.
- **Estilo de catálogo**: banner de familia, header/footer con logo + franja de color, tal cual el patrón ya usado en `generar_catalogos.py` (`make_header_footer`, `banner`).
- **Patrón de workflow**: `repository_dispatch` + `client_payload` + `workflow_dispatch` como fallback manual, calcado de `enviar_catalogo_personalizado.yml` — mismo mecanismo que ya usa el proyecto para generación bajo demanda.
- **Concepto de "espacios"**: la traducción de protagonismo (1-5) a tamaño de celda reutiliza la misma idea de `espacios_a_ocupar` (1-8) que ya usa `grid_productos()` en el catálogo general.

### Motor de composición — regla real, no solo un dato guardado
```
nivel 1 → celda normal de rejilla (1 columna)
nivel 2 → celda normal + distintivo "★ RECOMENDADO"
nivel 3 → celda ancha (2 columnas)
nivel 4 → banda completa (todas las columnas, 1 fila)
nivel 5 → bloque/página propio, imagen grande + ficha editorial (NO es una celda de rejilla más grande)
```
Se agrupa por familia respetando el orden de PRIMERA aparición; dentro
de cada familia se respeta siempre `Producto.orden` (posición original
en la fuente de datos) — nunca se reordena por precio/nombre/nada más.

### Reglas de precio — decisión documentada
El % de descuento se aplica sobre el **precio CON IVA** (el que paga el
cliente), no sobre el precio sin IVA — es el número que tiene sentido
tachar/rebajar en un documento comercial. El precio sin IVA final (si
se muestra) se recalcula a partir del con-IVA final usando el IVA
implícito del producto, para no aplicar el descuento dos veces. Todo el
cálculo usa `Decimal` con `ROUND_HALF_UP` a 2 decimales — nunca float.

### Validación — errores vs warnings (probado con casos reales)
- Un producto con precio inválido o protagonismo fuera de 1-5 se
  **descarta ese producto concreto** (error bloqueante) — el resto del
  catálogo se genera igual. Probado con productos de prueba rotos
  a propósito: el catálogo se generó correctamente con 24/26 productos,
  los 2 inválidos quedaron fuera y reportados por consola.
- Sin imagen → placeholder neutro con el nombre del producto (nunca un
  hueco roto ni una foto inventada).
- Sin familia → cae en "Sin clasificar" (warning, no error).
- `oferta=sí` sin `descuento_pct` → se muestra como "OFERTA" sin tachar
  precio (no se inventa un descuento que no existe).
- `oferta=no` con `descuento_pct>0` → se ignora el descuento (warning).

---

## SET DE PRUEBA (Fase 1)

`data/catalogo_comercial_prueba/productos_prueba.json`: 22 productos
reales de los catálogos Zaphiro (18) y Besa (2 familias, Imprimaciones
y Esmaltes) ya integrados en el proyecto, elegidos para cubrir:
- 9 familias distintas (ABRASIVOS, HERRAMIENTAS, PROTECCIÓN LABORAL, SPRAY MAX, REPARACIÓN DE PLÁSTICOS, SELLADORES, CINTAS DE ENMASCARAR, ENMASCARADO, PRODUCTOS DE PULIR, PREPARACIÓN DE PINTURAS COMPLEMENTOS, Imprimaciones, Esmaltes)
- Los 5 niveles de protagonismo (incluido un nivel 5: pulidora RUPES)
- 3 productos en oferta con distinto % de descuento (15%, 20%, 12%)
- Imágenes con relaciones de aspecto muy distintas (de 0,26 a 2,0)
- Nombres de longitud muy variable

**Importante — por qué los precios son ilustrativos:** los catálogos
externos de proveedor (Zaphiro/Besa/Glasurit/Baslac) NO traen precio de
venta propio en este proyecto (ver `contexto_centro_soluciones_23082026.md`)
— solo los ~3.073 productos de talleres que vienen de la hoja Productos
del Sheet tienen precio real, pero esos usan imágenes alojadas en Drive
(no descargables desde este entorno de desarrollo sin acceso de red a
Google). Se priorizó poder generar y revisar un PDF real con fotos
reales frente a usar precios reales pero sin poder ver ninguna imagen.
En la Fase 2, con la Sheet como fuente real, este problema desaparece.

---

## PROBADO Y VERIFICADO (Playwright no aplica aquí — se verificó
## renderizando el PDF real a PNG con PyMuPDF e inspeccionando cada página)

- Catálogo completo con tema "mensual" (septiembre 2026): portada incrustada en página 1 + productos reales debajo + 13 familias + cierre.
- Mismo set de datos con tema "campaña navidad": colores/textos cambian correctamente sin tocar el motor.
- Producto nivel 5 (pulidora RUPES): bloque destacado a toda anchura, imagen grande, badge "PRODUCTO DESTACADO".
- Ofertas: badge "-15%"/"-20%"/"-12%" superpuesto a la imagen + precio tachado + precio final en el color de acento del tema.
- Validación con productos rotos a propósito: 2 errores bloqueantes correctamente excluidos, 4 warnings correctamente registrados y sin romper el resto del catálogo.
- **Bug real encontrado y corregido**: la página de cierre forzaba `PageBreak()`, dejando una página final casi vacía cuando el catálogo terminaba pronto en una hoja. Se quitó el salto forzado — ahora el cierre aprovecha el hueco que quede en la última página de contenido, y solo salta de página si de verdad no cabe.

### Revisión visual v2 (tras la primera ejecución real, tres cambios pedidos)
1. **Portada suelta eliminada**: el logo y el titular de campaña van ahora incrustados como un banner de color arriba de la página 1, que sigue directamente con productos reales debajo — como el prototipo de referencia. `portada()` se sustituyó por `encabezado_campana()`.
2. **Productos ocupando más espacio de página**:
   - Cada familia pasó de ser varios flowables sueltos a **una sola `Table`** (banner + filas, con `SPAN` para los anchos de protagonismo). Al ser una única tabla, ReportLab puede partirla entre páginas de forma natural — antes, un `KeepTogether` de banner+primera fila podía saltar entero a la página siguiente dejando el resto de la página anterior en blanco.
   - `t.repeatRows = 1`: si una familia se parte entre páginas, el banner se repite arriba en la página siguiente — evita que el banner quede huérfano solo al final de una página con nada debajo.
   - Rejilla a **3 columnas** (antes 4): celdas más grandes.
   - **Bug encontrado y corregido**: las imágenes de productos con protagonismo 3+ (celda ancha, banda completa, destacado) se veían pequeñas porque `componer_lienzo_cuadrado()` las forzaba a un lienzo cuadrado con mucho margen blanco alrededor, pensado para la uniformidad de una rejilla de celdas de 1 columna. Ahora `imagenes.py` acepta `cuadrado=False`: a partir de protagonismo 3 se usa la proporción real de la foto (solo recorte de margen blanco, sin lienzo cuadrado), aprovechando todo el ancho/alto de celda asignado.
3. **Estilo más llamativo**: precio como **sticker de color sólido** (bloque con fondo, no texto suelto) — amarillo/tema normal, color de acento + "¡OFERTA!"/tachado cuando hay descuento. Cada familia es una caja con borde de color de acento. Título de campaña en banner de color a toda anchura con logo incrustado.
- **Bug de `leading` encontrado y corregido**: varios `ParagraphStyle` con `fontSize` grande (19-21pt) sin `leading` explícito heredaban el `leading` por defecto de ReportLab (12pt, fijo, no relativo al tamaño de fuente) — el texto se salía por arriba de su caja/fondo de color. Se añadió `leading` explícito a todos los estilos con fuente ≥9pt.
- **Compromiso de páginas**: el nuevo diseño (imágenes más grandes, `repeatRows`, banners repetidos) usa algo más de página por familia — el catálogo de prueba pasó de 7 a 9 páginas. Con datos reales de Sheet (familias con más productos, no 1-4 como en el set de prueba) la densidad por página mejora sola.


---

## PENDIENTE / ABIERTO

1. **Fase 2 — Google Sheet + Apps Script**: no implementada a propósito
   (tal como pedía el encargo). Cuando se aborde:
   - Nueva hoja o pestaña en el Sheet con las columnas del punto 5 del
     encargo (familia, nombre, referencia, precio_sin/con_iva,
     descuento_pct, oferta, protagonismo, imagen).
   - Apps Script que lea esa hoja, valide mínimamente, y dispare este
     workflow vía `repository_dispatch` con `client_payload: {periodo, productos}` — mismo patrón que `enviar_catalogo_personalizado.yml`.
   - Añadir el paso de envío por email (Brevo) al final del workflow,
     calcado del que ya existe en ese otro workflow.
   - Cuando la imagen venga de Drive (no de `assets/imagenes_talleres/`
     local), añadir en `imagenes.py` un `descargar_imagen_drive()`
     calcado del de `generar_catalogos.py` — el resto del pipeline de
     imagen (recorte, lienzo, badge) no necesita cambios.
2. **Composición**: con familias muy pequeñas (1-4 productos, como en
   el set de prueba) puede quedar algo de hueco al final de la página
   cuando la familia siguiente no cabe entera — con datos reales de
   Sheet (familias con más productos) esto se compensa solo. Si se
   quiere afinar más, se podría añadir una heurística de "adelantar
   productos de la familia siguiente al hueco restante", pero no ha
   hecho falta para este prototipo.
3. **Sin probar aún con productos de imagen alojada en Drive** (los
   ~3.073 de la Sheet con precio real) por la restricción de red del
   entorno de desarrollo — debería funcionar igual en GitHub Actions
   (que sí tiene acceso a Drive), pero conviene una primera prueba real
   ahí antes de dar la Fase 2 por cerrada.
4. **Pulido visual pendiente de una segunda vuelta de revisión** con
   Eloy tras esta v2 (portada incrustada, tablas por familia con
   `repeatRows`, imágenes a proporción real desde protagonismo 3,
   precios en formato sticker) — quedó abierto si hacen falta más
   ajustes de estilo/densidad tras verlo de nuevo.

---

## CÓMO PROBARLO

```bash
# Set de prueba estático, tema mensual
python scripts/generar_catalogo_comercial.py --tipo mes --valor septiembre --anio 2026

# Campaña con tema propio
python scripts/generar_catalogo_comercial.py --tipo campaña --valor navidad --anio 2026

# Con productos propios (aún sin Sheet — cualquier JSON con la lista)
python scripts/generar_catalogo_comercial.py --tipo trimestre --valor Q4 --anio 2026 --productos mis_productos.json
```
También disponible como workflow manual en GitHub Actions → "Generar
Catálogo Comercial de Talleres" → Run workflow, con el periodo como
inputs. El PDF resultante se sube como artefacto del run (no se envía
a nadie en esta fase).
