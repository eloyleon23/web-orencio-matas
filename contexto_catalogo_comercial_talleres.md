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
### Revisión visual v3 (segunda vuelta — "no se parece nada al prototipo")
Tras la v2, Eloy fue tajante: seguía sin parecerse al prototipo real, mal
estructurado, con mucho hueco en blanco. La causa de fondo era de
**arquitectura**, no de estilo: v2 maquetaba cada familia como una caja a
todo el ancho de página (una debajo de otra) — el prototipo real es un
cartel A4 a **dos columnas** con secciones pequeñas y densas, como un
folleto de supermercado.

Cambio de fondo en v3:
- **Página a dos columnas de verdad**, usando `BaseDocTemplate` +
  `Frame`/`PageTemplate` de ReportLab (el mecanismo pensado para
  folletos/boletines a columnas) — no una tabla a todo el ancho. Página 1
  tiene una plantilla especial con 3 frames (cabecera ancho completo +
  dos columnas debajo); el resto de páginas solo tiene las dos columnas.
- `composicion.py` se simplificó: el nivel 5 ya no es un "bloque de
  página propia" (no tenía sentido en una columna de ~90mm) — ahora es,
  como los demás niveles, una celda de la rejilla de su familia, solo
  que ocupa la columna completa con la imagen más grande.
- Tarjetas de producto mucho más compactas (fuentes más pequeñas, menos
  padding, sticker de precio más pequeño) para que quepan varias por
  columna, como en el prototipo.
- **Bug real encontrado y corregido — importante para quien retome
  esto**: se intentó primero un reparto "inteligente" de las cajas de
  familia entre columnas por altura acumulada (bin-packing manual,
  colocando cada caja en la columna con menos contenido usado). Este
  enfoque **rompía el documento**: los `Frame` de ReportLab solo avanzan
  hacia delante dentro de una página (izquierda → derecha → página
  nueva) — un `FrameBreak()` desde la columna derecha NUNCA vuelve a la
  izquierda de la misma página, siempre salta a la izquierda de una
  página nueva. El algoritmo asumía que podía "volver" a la izquierda
  libremente, lo que desincronizaba el `story` real de ReportLab con el
  seguimiento manual de qué columna tocaba, produciendo páginas con una
  sola familia y muchísimo hueco (justo lo contrario de lo que se
  buscaba). Se eliminó ese código y se dejó que ReportLab haga el
  relleno secuencial nativo (coloca cada caja en la columna actual; si
  no cabe, la sigue automáticamente en la siguiente columna/página) —
  es el comportamiento correcto y estable para este tipo de
  maquetación. Documentado también como comentario largo en
  `generar_pdf()` para que no se repita el mismo intento.
- **Resultado**: el catálogo de prueba pasó de 9 páginas (v2, muy poco
  denso) a **3 páginas** (v3), con aspecto mucho más parecido al
  cartel de oferta real de referencia.
- **Limitación conocida y aceptada**: al preservar el orden de familias
  (primera aparición en la Sheet) y no poder "volver atrás" de columna,
  puede quedar algo de hueco al final de una columna cuando la familia
  siguiente no cabe en el resto de esa columna pero sí cabría si se
  reordenara — es inherente al relleno secuencial de columnas
  respetando el orden, igual que en cualquier maquetación de folleto
  real. No se ha intentado reordenar familias para rellenar huecos
  porque cambiaría el orden documentado como principio del proyecto
  (aunque, a diferencia del orden de PRODUCTOS dentro de una familia,
  el encargo original no exige explícitamente mantener el orden de
  FAMILIAS — si se quiere apurar más el aprovechamiento del espacio,
  ahí hay margen a explorar en el futuro).


---

### Revisión visual v4 (tercera vuelta)
Eloy pidió, con el PDF de v3 delante: (1) que las cajas de la columna
izquierda y derecha terminen alineadas al final, (2) que las familias
de un solo producto aprovechen mejor el hueco poniendo la imagen más
grande con el precio al lado (no debajo), (3) esquinas redondeadas en
las cajas como el prototipo, (4) un icono/logo pequeño en la esquina de
cada caja, (5) cabecera de página 1 más grande, y (6) una página de
cierre a página completa con dirección + mapa en miniatura.

- **Alineación real de columnas (`planificar_columnas`)**: se sustituyó
  el relleno secuencial "primero que cabe" (que dejaba a la izquierda
  todo lo que cupiera y el resto a la derecha, sin más criterio) por un
  algoritmo que mide la altura real de cada caja (`Table.wrap()`) y
  decide el PUNTO DE CORTE entre columna izquierda y derecha que
  minimiza la diferencia de altura entre ambas, para cada página. Sigue
  sin reordenar familias — solo decide dónde cae el corte dentro del
  mismo orden. Resultado: columnas visiblemente igualadas al final,
  frente al desnivel claro de v3.
- **Familias de un solo producto → layout horizontal**: `construir_tabla_familia`
  detecta cuándo una familia tiene un único producto y usa
  `_fila_producto_horizontal()` (imagen grande a un lado, nombre/precio
  al otro) en vez de la celda de rejilla vertical — mismo patrón que ya
  se usaba para el nivel 5 en v2/v3, generalizado a cualquier familia
  de 1 producto independientemente de su protagonismo.
- **Esquinas redondeadas**: nuevo Flowable `CajaRedondeada` que envuelve
  cada caja de familia (y la cabecera de campaña) y dibuja el borde con
  `canvas.roundRect()` — `TableStyle` no soporta esquinas redondeadas de
  forma nativa, así que el borde se dibuja aparte, encima del contenido
  de la tabla interior. Implementa también `split()` (delega en la
  tabla interior) para que las cajas que no quepan enteras en una
  columna se sigan partiendo correctamente entre página/columna.
- **Icono en cada caja**: badge circular con el logo de la empresa
  (recortado a círculo con PIL) incrustado en la esquina izquierda del
  banner de cada familia, junto al nombre.
- **Cabecera de página 1 más grande**: logo más grande y tipografía de
  titular mayor. **Bug real encontrado y corregido**: con el logo a
  30mm de ancho, su altura real (proporción 1.23) se iba a 37mm — 1,8pt
  más que la caja de cabecera reservada (`HEADER_BOX_H`), lo justo para
  que ReportLab considerase que el bloque entero "no cabía" en el frame
  de cabecera y lo empujase COMPLETO al frame de la columna izquierda
  (el titular de campaña aparecía descolocado, encajado y cortado en la
  columna izquierda en vez de arriba a todo lo ancho). Se corrigió
  limitando el ancho del logo también por la altura máxima seguro
  disponible, no solo fijándolo a un valor fijo — lección para
  cualquier imagen de proporción desconocida colocada en un frame de
  altura ajustada: limitar SIEMPRE por el eje que pueda desbordar, no
  solo por uno de los dos.
- **Página de cierre a página completa**: nueva plantilla de página
  (`tpl_cierre`, un único frame a todo el ancho) usada solo para la
  última página — dirección, contacto y una tarjeta "ENCUÉNTRANOS" con
  gráfico ilustrativo de ubicación (no es un mapa real, ver pendiente
  arriba). **Sustituido en v5** (ver abajo) — se quitó la página
  dedicada.

---

### Revisión visual v5 (cuarta vuelta)
Con el PDF de v4 delante, Eloy pidió tres ajustes más: (1) las columnas
seguían sin quedar igualadas al final (la derecha más corta), (2) no
quería una página de cierre aparte — mejor aprovechar el hueco que
quedara en la última página de productos con la dirección, dejando el
mapa real pendiente de una captura que proporcionará más adelante, y
(3) los bordes redondeados solo se veían en la parte inferior de cada
caja, no en la banda de color de arriba.

- **Cierre integrado en el reparto de columnas**: se eliminó la
  plantilla de página dedicada (`tpl_cierre`) y la caja de cierre
  (`construir_caja_cierre()`, dimensionada al ancho de UNA columna, no
  de toda la página) se añade como una caja más al final de la lista
  que procesa `planificar_columnas()`. El propio algoritmo de balanceo
  la coloca donde haga falta para igualar las columnas de la última
  página — en la práctica, casi siempre encaja justo en el hueco que
  antes quedaba vacío. Efecto secundario bueno: como ya no hay página
  dedicada, el catálogo de prueba bajó de 4 a 3 páginas.
- **Esquinas redondeadas en todo el bloque, no solo abajo — bug real
  encontrado y corregido**: `TableStyle` siempre pinta los fondos de
  color de celda como rectángulos de esquina viva; la banda de color
  de la cabecera de cada caja "asomaba" por encima de la esquina
  redondeada del `CajaRedondeada`, así que solo se veía redondeado
  donde no había ningún relleno de color encima (la parte blanca
  inferior). Solución: `CajaRedondeada.draw()` ahora usa
  `canvas.clipPath()` con la silueta redondeada ANTES de dibujar el
  contenido interior — así cualquier fondo de color que dibuje la
  tabla de dentro (incluida la cabecera) se recorta automáticamente a
  la forma redondeada, en vez de tener que tratar cada caso por
  separado. El borde se dibuja aparte, después, sin recorte, para que
  quede nítido.
- **Alineación de columnas — ya bastante mejor, con un límite real**:
  con el cierre integrado, la página final quedó prácticamente
  igualada (era el caso más visible). En las páginas de solo productos
  la diferencia real observada es de ~1cm o menos en la mayoría de
  casos — el límite lo pone la propia distribución de tamaños de las
  familias (si la primera familia de una página es muy grande, por
  ejemplo, el punto de corte óptimo puede no ser un empate perfecto).
  No es un bug, es la mejor solución posible dentro de la restricción
  de no reordenar familias ni partir una familia entre columnas de
  forma artificial.

---

### Revisión visual v6 (quinta vuelta — comparación directa con el prototipo)
Eloy compartió el prototipo de referencia otra vez señalando que casi
no tiene espacio en blanco, y dos quejas concretas: (1) las columnas
seguían sin terminar a la misma altura (la izquierda más larga que la
derecha en todas las páginas), y (2) la última página seguía con mucho
hueco sin cubrir.

**Diagnóstico con datos reales, no a ojo**: se midió con `Table.wrap()`
cuánto ocupaba realmente cada caja y cuánta capacidad de columna había.
La caja de cierre de v5 tenía una altura FIJA (~422pt) que en la
práctica solo llenaba ~54% de una columna completa (~780pt) — de ahí
el hueco grande en la última página. Además, decidir el reparto de
familias SIN saber que el cierre iría detrás producía un punto de
corte que luego no encajaba bien con el cierre (ej.: familias
repartidas 197pt/383pt, y el cierre de 422pt sumándose al lado que ya
era más grande, empeorando el desequilibrio en vez de arreglarlo).

- **Cierre de altura elástica**: `construir_caja_cierre()` acepta ahora
  un `alto_objetivo` opcional — mide primero el contenido de texto fijo
  (título, dirección, contacto) y estira el gráfico de ubicación
  (que es decorativo, así que estirarlo no rompe nada) para que la
  caja entera ocupe exactamente esa altura.
- **El cierre SÍ participa en la decisión de dónde cortar entre
  columnas, pero con tamaño de marcador de posición**: se añade un
  cierre "de mentira" (altura por defecto) a la lista que procesa
  `planificar_columnas()`, para que el punto de corte de las familias
  ya cuente con que el cierre irá detrás. Una vez decidido el corte,
  se descarta ese marcador, se mide cuánto ocupan REALMENTE las
  familias que quedaron en cada columna de la última página (izq=hi,
  der=hd), y se reconstruye el cierre de verdad con
  `alto_objetivo = hi - hd` (acotado a la capacidad real que quede) —
  así el cierre iguala exactamente la columna más corta con la más
  larga, en vez de tener un tamaño fijo que a veces sobra y a veces
  falta.
- **Resultado medido**: la página de cierre pasó de columnas a
  55%/74% de la capacidad (mucho hueco) a terminar prácticamente
  igualadas, con el gráfico de ubicación creciendo para ocupar el
  espacio extra en vez de dejarlo en blanco. Probado también con un
  caso límite de solo 2 productos (1 familia) — el cierre se ajusta
  igual de bien sin romperse.
- **Límite real que queda, y por qué NO es un bug**: en páginas de
  solo productos (sin el cierre, que es el único elemento "elástico"
  disponible), el hueco que pueda quedar depende de si existe algún
  punto de corte entre familias, en el orden dado, que se acerque a
  partir la página justo por la mitad. Se comprobó a mano con los
  números reales del set de prueba: en la página 1, por ejemplo,
  después del mejor corte posible (`HERRAMIENTAS` sola a la izquierda,
  3 familias a la derecha) el siguiente elemento de la secuencia
  (`SPRAY MAX`) NO cabe en el hueco que queda en ninguna de las dos
  columnas — no es que el algoritmo no lo intente, es que
  matemáticamente no cabe dado el tamaño real de esa familia y el hueco
  disponible. Con datos reales de la Sheet (más familias, tamaños más
  variados) hay muchas más combinaciones posibles y este límite se
  nota mucho menos. La alternativa para apurarlo del todo sería
  permitir reordenar FAMILIAS (no productos) para buscar mejores
  combinaciones — ver pendiente más abajo.

---

### Revisión visual v7 (sexta vuelta — color y reordenación de familias autorizada)
Eloy aprobó explícitamente reordenar familias para aprovechar mejor el
espacio ("me parece bien la propuesta, adelante"), insistió en que la
alineación entre columnas es un punto muy importante, y pidió cambiar
el amarillo mostaza del tema mensual por un gris claro.

- **Color del tema mensual**: `TEMA_MENSUAL.color_principal` pasó de
  `#F9B101` (amarillo mostaza) a `#E4E7EB` (gris claro neutro). El
  acento (rojo, ofertas/precios) no se tocó.
  **Ajuste necesario derivado**: el sticker de precio normal (sin
  oferta) usaba SIEMPRE texto blanco sobre el color principal — con un
  amarillo fuerte eso se leía bien, pero sobre gris claro el texto
  blanco desaparece. Se añadieron variantes de estilo
  (`sticker_precio_normal`, `sticker_precio_h_normal`) que usan
  `tema.color_texto_sobre_principal` en vez de blanco fijo, y
  `sticker_precio()` elige el estilo correcto según si el producto
  está en oferta (fondo acento, texto blanco) o no (fondo principal,
  texto del tema). Los temas de campaña (fondos oscuros) no se ven
  afectados porque su `color_texto_sobre_principal` ya era blanco.
- **`planificar_columnas()` ahora puede reordenar familias entre
  columnas para rellenar huecos** (con permiso explícito): tras decidir
  el corte de cada página con el mismo mecanismo de ventana que ya
  había, se añadió un paso adicional que mira las próximas familias en
  la secuencia (hasta 6 de margen) y, si alguna encaja en el hueco que
  quede en la columna más corta, la "adelanta" a esa página — quitándola
  de su posición original. Se repite varias veces por página mientras
  el hueco siga siendo significativo (>12pt) y haya candidatas. El
  orden de PRODUCTOS dentro de cada familia nunca se toca, solo el
  orden en que aparecen las CAJAS de familia completas.
- **Bug potencial encontrado y evitado antes de que llegara a
  producirse**: el marcador de posición del cierre (ver v6) es, por
  construcción, el último elemento de la secuencia — si se le hubiera
  dejado participar en el nuevo mecanismo de "adelantar", podría haber
  rellenado el hueco de una página intermedia y dejar la página final
  (la que de verdad necesita el cierre) sin él. Se añadió el parámetro
  `no_adelantar` a `planificar_columnas()` específicamente para excluir
  el marcador de cierre de ese mecanismo — sigue pudiendo aparecer por
  la vía normal (la ventana), solo no se le adelanta artificialmente.
- Probado con ambos temas, con productos inválidos a propósito, y con
  el caso límite de 2 productos — todo sin romperse.

---

### Revisión visual v8 (séptima vuelta — alineación real + mapa deformado)
Eloy insistió de nuevo en la alineación ("te reitero... es un punto muy
importante para cerrar la primera versión") y señaló que el mapa con
el pin se veía estirado/deformado.

Esta vuelta encontró y corrigió **tres bugs reales encadenados**, cada
uno enmascarando al siguiente hasta aislarlos con una reproducción
mínima (sin contenido real, solo cajas de colores del tamaño exacto):

1. **Mapa deformado — causa y arreglo**: `generar_grafico_ubicacion()`
   siempre generaba la imagen a una proporción fija (640×420) y luego
   el cierre elástico la ESTIRABA a la altura que hiciera falta,
   deformando el pin (círculo) en una elipse. Arreglado generando el
   gráfico ya con las proporciones exactas que necesita cada vez (el
   radio del pin se calcula proporcional al lado menor del lienzo, no
   a un valor fijo en píxeles) — así nunca hay que estirar nada.

2. **Reordenación de familias — sustituida por un algoritmo mejor**: el
   mecanismo de v7 (mirar unas pocas familias por delante) se cambió
   por un balanceo GLOBAL tipo "longest processing time first"
   (procesar las familias de mayor a menor altura, asignar cada una a
   la columna con menos carga acumulada de TODAS las abiertas) — y
   luego se añadió una segunda pasada de MEJORA LOCAL: probar
   intercambios de una familia entre dos columnas CUALESQUIERA del
   documento (no solo las de la misma página), aplicando el que más
   reduzca la diferencia total entre columnas, hasta que no quede
   ninguno que mejore. Fue necesario tras comprobar que los intercambios
   limitados a la misma página no bastaban: a veces la familia que más
   desequilibra una página en realidad encaja mucho mejor en otra
   página distinta (verificado con datos reales: mover "PRODUCTOS DE
   PULIR" de la página 2 a la 3 mejoraba las dos a la vez).

3. **Bug real — desbordamiento por margen insuficiente**: con el reparto
   ajustándose cada vez más al límite exacto de cada columna, alguna
   página quedaba con menos de 2pt de margen entre lo medido
   (`Table.wrap()`) y la capacidad real — cualquier mínima diferencia
   de redondeo entre esa medición y lo que ReportLab renderiza de
   verdad bastaba para desbordar una familia entera a la
   columna/página siguiente, descolocando todo lo que venía detrás
   (síntoma: una familia entera desaparecía de donde debía estar y
   aparecía en el lado opuesto de la página siguiente). Se reprodujo
   con un caso mínimo (cajas de colores sin contenido real) para
   aislarlo del ruido del catálogo completo. Arreglado restando un
   margen de seguridad fijo (`MARGEN_SEGURIDAD = 15pt`) a la capacidad
   usada SOLO al planificar (no al tamaño real de los frames).

4. **Bug real — el cierre "se pasaba" cuando el hueco natural era
   pequeño**: el cierre tiene una altura mínima real (~122mm, todo su
   texto fijo más el gráfico más pequeño posible) — si el hueco natural
   entre columnas de la última página era MENOR que ese mínimo, forzar
   el cierre igualmente lo hacía "pasarse" y dejaba la OTRA columna con
   un hueco nuevo en vez de arreglar el que había (verificado: un hueco
   natural de 41pt con un mínimo de 346pt producía un desequilibrio
   final de 305pt, peor que sin tocar nada). Arreglado repartiendo la
   ÚLTIMA página de forma distinta a las demás: se reserva desde el
   principio el hueco mínimo del cierre en la columna derecha (columna
   izquierda con capacidad completa, columna derecha con
   `capacidad − altura_mínima_del_cierre`) y se reparten las familias
   de esa página dentro de esas dos capacidades ya asimétricas, en vez
   de repartir primero e intentar encajar el cierre después.

**Resultado medido** (antes → después de esta vuelta, con el mismo
catálogo de prueba): página 1 sin cambios (ya estaba bien, ~7mm),
página 2 de 47mm a 23mm de diferencia entre columnas, página 3
(con cierre) de 110mm a 2,4mm. El mapa ya no se ve deformado en ningún
caso probado (incluido el límite de 2 productos).

---

### Revisión visual v9 (octava vuelta — insistencia en la alineación exacta)
Eloy volvió a insistir: "no puede ser que los bloques de la izquierda
tengan un margen de 1cm al final de la página y los de la derecha 2cm
— tienen que tener el mismo margen".

- **Búsqueda local ampliada**: la mejora local de v8 solo probaba
  INTERCAMBIAR una familia de una columna por otra. Se amplió para
  probar también MOVER una familia sin intercambiar nada (si a la
  columna destino le queda hueco libre) — hay reordenaciones que
  mejoran el equilibrio y que un intercambio 1-por-1 nunca puede
  encontrar porque no existe una familia "de vuelta" del tamaño justo.
- **Varios puntos de partida (reinicios aleatorios)**: la búsqueda
  local (por muy potente que sea) puede quedarse en un óptimo que no es
  el mejor posible según por dónde empiece. Se añadieron 12 intentos
  con pequeñas variaciones aleatorias en el orden de asignación inicial
  (con semilla fija, para que el resultado sea siempre el mismo para el
  mismo catálogo), quedándose con el que menor diferencia total consiga
  tras aplicarle la mejora local. Determinista y rápido (<0,3s para 13
  familias).
- **Resultado medido** (mismo catálogo de prueba): página 1 de 6,7mm a
  5,2mm, página 2 de 23mm a 17,5mm, página 3 se mantiene en ~2,5mm.
- **Límite matemático verificado para el set de prueba concreto**: se
  comprobó a mano que, del conjunto de familias que caen en las
  páginas 2-3, la familia "PRODUCTOS DE PULIR" (335pt) es bastante más
  grande que el resto (que ronda 170-200pt cada una) — no existe
  ninguna combinación de las demás familias que la compense con más
  precisión que ~50pt de diferencia, por simple aritmética de los
  tamaños concretos disponibles. No es una limitación del algoritmo de
  búsqueda (ya prueba intercambios, movimientos y varios puntos de
  partida): es que, con estas 13 familias concretas y estos tamaños
  concretos, ~17mm de diferencia en la página 2 puede ser cercano al
  mínimo matemático alcanzable sin partir una familia en dos columnas
  (lo que rompería la caja como bloque visual único) o sin reducir
  artificialmente su contenido. **Con datos reales de la Sheet (muchas
  más familias, tamaños más variados y graduales) hay muchas más
  combinaciones posibles y este límite debería notarse mucho menos o
  desaparecer** — pendiente de confirmar con un catálogo de prueba más
  grande si Eloy lo considera necesario antes de cerrar la Fase 1.

---

### Revisión visual v10 (novena vuelta — disclaimer fijo como solución práctica)
Eloy propuso una solución práctica al problema de alineación: añadir
un pie de página fijo con el texto "Ofertas válidas hasta agotar
existencias. Precios sujetos a cambios" (igual que lleva el prototipo
de referencia en sus tres hojas) — así la parte final de la página
nunca queda visualmente en blanco del todo, y la alineación exacta
entre columnas deja de ser estrictamente necesaria (aunque se mantenga
como deseable).

- Se amplió la franja inferior fija (`BOTTOM_BAR_H`, de 7mm a 11mm)
  para poder mostrar DOS líneas: el disclaimer (centrado, cursiva, gris,
  arriba) y la línea de contacto + nº de página que ya existía (abajo),
  dibujadas ambas en el `onPage` callback (`make_header_footer`), así
  que aparecen automáticamente en TODAS las páginas sin tocar el
  contenido de las cajas de familia ni el algoritmo de reparto.
- No sustituye el trabajo de alineación de v8/v9 (se mantiene tal
  cual, sigue siendo la mejor alineación posible encontrada) — es un
  complemento que hace que el resultado final se vea bien rematado
  incluso en el peor caso.
- Se mantiene también el texto propio del bloque de cierre ("Oferta
  válida durante el periodo indicado en portada..."), con una
  redacción algo distinta y complementaria — no se ha visto necesario
  quitar ninguno de los dos, es habitual en folletos reales tener un
  disclaimer breve en cada página y uno más completo en el cierre.

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
2. **Sin probar aún con productos de imagen alojada en Drive** (los
   ~3.073 de la Sheet con precio real) por la restricción de red del
   entorno de desarrollo — debería funcionar igual en GitHub Actions
   (que sí tiene acceso a Drive), pero conviene una primera prueba real
   ahí antes de dar la Fase 2 por cerrada.
3. **Mapa real — ya resuelto (v11)**: la captura que proporcionó Eloy
   ya está integrada con chincheta sobre la ubicación exacta, ver
   sección de v11 más abajo.
4. **Calidad de imagen — límite real, no solo de código**: las fotos
   de origen de Zaphiro/Besa son de baja resolución (algunas de apenas
   81×248 px). v11 mejora la nitidez percibida al máximo posible por
   software (reescalado LANCZOS propio + enfoque), pero para una
   nitidez realmente profesional a tamaño grande hace falta pedir fotos
   de mayor resolución a los proveedores o al propio Eloy — no es algo
   que el código pueda resolver del todo por sí solo.
5. **Pulido visual**: v6 corrige el hueco en blanco de la última página
   (el cierre ahora es elástico y encaja exacto) — pendiente de una
   nueva revisión con Eloy para confirmar si las páginas de solo
   productos (sin margen para un elemento elástico) están ya lo
   bastante ajustadas o si hace falta seguir iterando.
5. **Reordenar familias — ya implementado (v7)**, ver sección anterior.
   Sigue habiendo un límite duro: si NINGUNA familia restante (dentro
   del horizonte de búsqueda) cabe en el hueco exacto que quede, el
   hueco se queda — no se fuerza a encoger ni recomponer una familia
   para que quepa a la fuerza.

---

### Revisión visual v11 (décima vuelta — relleno máximo, calidad de imagen, mapa real, pie con logo)
Cinco peticiones en una sola vuelta: pie de página más grande con logo
y color de cabecera; más relleno en los bloques (imagen más grande,
precio a la derecha cuando se pueda); calidad de imagen "mucho mejor,
ahora mismo muchas aparecen borrosas"; mapa real (captura proporcionada
por Eloy) con chincheta sobre la ubicación exacta; y máxima prioridad
(100%) a que cada columna llegue hasta abajo en TODAS las páginas.

- **Pie de página**: `BOTTOM_BAR_H` de 11mm a 18mm, fondo del mismo
  color que la cabecera (`tema.color_principal`), con el logo a la
  izquierda y el disclaimer en fuente más grande y en negrita — ya no
  es una nota discreta, tiene presencia real en la página.
- **Mapa real**: la captura que proporcionó Eloy se guardó como asset
  del proyecto (`assets/mapa/ubicacion_orencio_matas.png`). Se midió a
  mano la posición del marcador azul de Google Maps que ya trae la
  captura (`MARCADOR_FX=0.526, MARCADOR_FY=0.429`, fracción del ancho/
  alto de la imagen) y se dibuja encima una chincheta roja (mismo
  estilo que el gráfico ilustrativo) apuntando exactamente ahí. La foto
  se encaja ENTERA dentro del hueco disponible sin recortar ni
  deformar (si la proporción pedida no coincide, se añade margen de
  color a los lados, nunca se estira) — el gráfico ilustrativo por PIL
  queda como respaldo automático si algún día no existe la imagen real.
- **Calidad de imagen — límite real explicado, no solo arreglado por
  código**: se comprobó que las fotos originales de Zaphiro/Besa son
  de resolución muy baja de origen (algunas de 81×248 px, extraídas de
  PDFs de catálogo de proveedor) — mostrarlas más grandes (como pedía
  el punto de "más relleno") las hace VERSE MÁS borrosas, no menos, si
  no se hace nada más. Se añadió `preparar_para_incrustar()`: en vez de
  dejar que el lector de PDF reescale la imagen a su manera al
  mostrarla más grande, se reescala con LANCZOS (mejor algoritmo) al
  tamaño real en píxeles que le corresponde por resolución de
  impresión, y se aplica un enfoque suave (`UnsharpMask`) para
  compensar el ablandamiento típico de agrandar una foto. Mejora la
  nitidez PERCIBIDA al máximo que da de sí el software, pero no puede
  inventar detalle que la foto original no tiene — para nitidez
  realmente profesional en tamaño grande hace falta una foto de origen
  de mayor resolución (pendiente real para Fase 2, ver más abajo).
- **Más relleno — imágenes más grandes por defecto**: aumentados los
  tamaños base tanto en la rejilla (`_celda_producto`) como en el
  layout horizontal (`_fila_producto_horizontal`), con calidad JPEG
  subida de 82 a 92.
- **Prioridad 100% a llegar hasta abajo — nuevo mecanismo, aplicado a
  TODAS las páginas, no solo la última**: `construir_tabla_familia()`
  acepta ahora `factor_extra` (agranda la imagen del ÚLTIMO producto de
  la familia) y `relleno_extra` (añade aire dentro de la caja como
  último recurso). `construir_tabla_familia_ajustada()` hace una
  búsqueda binaria sobre `factor_extra` para acercarse a un
  `alto_objetivo` sin pasarse; si ni agrandando la imagen al máximo
  razonable se llega (una foto no puede alargarse sin perder su
  proporción real — límite matemático, no un fallo del código), el
  resto se rellena como `relleno_extra` para que al menos el BORDE de
  la caja llegue hasta abajo. En `generar_pdf()`, tras planificar las
  familias, se estira la ÚLTIMA familia de CADA columna de CADA página
  (la columna derecha de la última página se deja tal cual, porque ya
  la rellena el cierre elástico justo detrás).
- **Dos bugs reales encontrados y corregidos durante esta vuelta**:
  1. El primer intento de ensanchar la imagen en el layout horizontal
     (hasta el 78% del ancho de columna) rompía el texto del precio —
     "24,90 €" se envolvía carácter a carácter en una columna de texto
     aplastada a unos pocos milímetros. Corregido protegiendo un ancho
     mínimo fijo para la ficha de texto (34mm) — la imagen crece hasta
     ese límite, nunca más.
  2. El límite de ensanchado (antes 62% del ancho) hacía que la
     búsqueda binaria de `factor_extra` "se estancara" (el ancho de
     imagen dejaba de crecer mucho antes de llegar al objetivo, así que
     subir `factor_extra` más allá de cierto punto no cambiaba nada) —
     verificado numéricamente forzando distintos objetivos y viendo que
     el resultado se quedaba plano en ~80mm pasara lo que pasara.
- **Resultado**: en el catálogo de prueba (22 productos), las tres
  páginas ahora llegan de verdad hasta muy cerca del final en ambas
  columnas — el que no llegan del todo exacto lo remata el pie de
  página fijo (disclaimer) documentado en v10.
- **Límite conocido, no resuelto en esta vuelta**: en familias con
  MÁS de un producto (rejilla, no layout horizontal), el estirado de
  imagen del último producto está limitado por el ancho FIJO de su
  celda (no crece más allá de lo que permite su columna interna) —
  solo el layout horizontal (familias de 1 producto) puede crecer en
  ancho también. Para familias de rejilla con poco margen de maniobra,
  el mecanismo cae antes al relleno de aire (`relleno_extra`), lo cual
  cumple el objetivo de "llegar hasta abajo" pero dejando más espacio
  en blanco DENTRO de la caja que si la imagen hubiera podido crecer
  más. Aceptable dado el límite de tiempo de esta vuelta; posible
  mejora futura si hace falta.

---

### Revisión visual v12 (undécima vuelta — alineación real de páginas 1/3 y relleno llamativo tipo folleto)
Eloy señaló que la página 2 estaba perfecta pero la 1 y la 3 no
terminaban de cuadrar, y pidió una idea concreta para aprovechar
huecos: banners tipo folleto de supermercado (Lidl) — "Ahorra hasta
X%", invitación a visitar la web, o el logo en grande — en vez de
dejar espacio en blanco, tanto dentro de las cajas como fuera.

- **Bug real de medición encontrado y corregido primero**: el script
  de comprobación de alineación por píxeles daba diferencias de 22-72mm
  que parecían enormes — pero el propio pie de página nuevo de v11
  (con el logo de la empresa, que tiene tonos rojos en su diseño)
  estaba siendo detectado por error como si fuera el borde rojo de una
  caja de producto, falseando la medición. Corregido excluyendo la
  franja del pie del análisis — con eso, páginas 1 y 2 ya medían
  2,0mm y 0,4mm de diferencia (muy bien), y solo la página 3 tenía un
  problema real (47,9mm).
- **Bug real de la página 3 — orden de cálculo**: el tamaño del cierre
  elástico se calculaba ANTES de estirar la imagen de la familia de la
  columna izquierda — así que el cierre quedaba dimensionado para una
  izquierda que LUEGO crecía (por el nuevo mecanismo de "estirar la
  última familia de cada columna" de v11), y las dos columnas volvían
  a quedar descuadradas. Corregido invirtiendo el orden: ahora se
  estira primero la columna izquierda de la última página, se mide su
  altura YA estirada, y el cierre se dimensiona para igualar ESA
  altura real. Resultado: página 3 de 47,9mm a 2,5mm de diferencia.
- **Relleno decorativo tipo folleto** (`construir_relleno_decorativo`):
  cuando ni agrandar la imagen del último producto ni el aire dentro
  de su caja (tope de 25mm, antes sin tope) bastan para llegar al
  final de la columna, se añade un banner llamativo adicional, con 3
  variantes que rotan (no aleatorias, deterministas):
    - **"¡AHORRA HASTA -X%!"** — con el mayor descuento real presente
      en el catálogo (calculado una vez, escaneando todos los
      productos), fondo del color de acento.
    - **"Descubre todo nuestro catálogo en orenciomatas.es"** — con el
      logo, fondo del color principal del tema.
    - **Logo grande** — con el eslogan "Suministros para talleres y
      carrocerías", fondo neutro — el recurso de última instancia
      cuando no hay descuentos que anunciar.
  Cada variante es tan elástica como el resto de bloques: se mide su
  altura natural y se reparte el hueco sobrante como padding arriba y
  abajo del contenido (centrado), no solo abajo.
- **Bug real de regresión encontrado y corregido durante esta misma
  vuelta**: aplicar el relleno decorativo también en la columna
  IZQUIERDA de la ÚLTIMA página interfería con el cálculo del cierre
  (la izquierda podía crecer con un relleno completo, inflando el
  objetivo del cierre más allá de lo razonable) y llegó a provocar una
  página extra innecesaria en un catálogo de prueba de solo 2
  productos. Se desactivó el relleno decorativo específicamente ahí
  (`permitir_relleno_decorativo=False`) — en esa columna concreta el
  hueco ya lo resuelve el cierre elástico justo después, no hace falta
  duplicar el mecanismo.
- Probado con el catálogo de 22 productos (ambos temas) y con el caso
  límite de 2 productos — confirmado que ya no se genera ninguna
  página extra de más.

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

---

## V3 — PIVOTE DE DIRECCIÓN VISUAL (tras brief `brief_claude_catalogo_v3_colores_corporativos.md`)

Tras varias vueltas puliendo alineación de la maqueta v1/v2 (2 columnas
de "fichas" con caja/borde por familia), Eloy compartió un brief
completo pidiendo un cambio de dirección: no repintar colores sobre la
maqueta anterior, sino **replantear la composición desde cero** como un
folleto comercial B2B editorial (identidad corporativa clara, menos
cajas, jerarquía real por nivel de protagonismo, layouts asimétricos).

**Decisión importante**: v2 (`render_pdf.py`, con motor de dos columnas
+ balanceo + estirado) **se mantiene intacto**, no se ha borrado ni
modificado su lógica de reparto — sirve como referencia de comparación
y sigue siendo accesible con `--motor v2`. Todo el trabajo nuevo vive
en `layout_engine.py` (`--motor v3`, por defecto).

### Qué se reutilizó tal cual (sin tocar)
`modelo.py`, `reglas_comerciales.py`, `composicion.py`, `imagenes.py`
— la separación DATOS/REGLAS/CAMPAÑA que ya existía encajaba
directamente con la arquitectura que pide el brief (punto 22). Solo se
amplió `campanas.Tema` con los nuevos roles de color corporativos
(ver abajo), sin quitar los campos antiguos que sigue usando v2.

### Cambio arquitectónico clave: de 2 columnas balanceadas a 1 columna de flujo libre
La v1/v2 tenía que resolver un problema muy difícil (balancear dos
columnas para que terminen a la misma altura) que generó una cascada
de bugs reales a lo largo de varias sesiones (ver historial de
versiones v4-v12 más arriba). La V3 evita ese problema de raíz: la
página es un ÚNICO frame a todo el ancho, y ReportLab pagina el
contenido de forma automática — ya no hace falta ningún algoritmo de
reparto, "estirado" de imágenes para llegar al final, relleno de aire
ni relleno decorativo. Dentro de un patrón de layout SÍ se usan 2-3
columnas internas (imagen grande + ficha al lado), pero es una
composición fija de ESE bloque, no algo que haya que balancear con
nada más de la página.

### Paleta corporativa (`Tema`, campos nuevos)
```
color_fondo            '#FFFFFF'   base de la página
color_fondo_alterno     '#F3F4F6'  gris muy claro, pie de página
color_estructura        '#23262B'  antracita — bandas de familia, cabecera, texto
color_identidad         '#0E7490'  turquesa/azul — badges DESTACADO, acentos, enlaces
color_precio            '#D91B1B'  rojo — SIEMPRE el precio final
color_descuento         '#F4B400'  amarillo — SIEMPRE el % de descuento/ahorro
```
Regla del brief (punto 15) aplicada literalmente: `color_estructura` y
`color_precio` NO cambian entre campañas (nunca se pierde la marca);
solo `color_identidad` varía por campaña (turquesa en mensual, verde en
Navidad, manteniendo antracita+rojo constantes — verificado
visualmente, ver captura de portada de Navidad).

### Sistema de layouts (`layout_engine.py`)
- `disenar_familia(bloque, tema, ancho)` — dispatcher central: mira la
  mezcla REAL de niveles de protagonismo presentes en la familia y
  elige el patrón, tal como pide el punto 4 del brief ("el nivel debe
  cambiar el lenguaje de composición, no ser una variable que cambia
  el tamaño de una tarjeta"):
  - nivel 5 presente + secundarios → `layout_hero_secundarios` (imagen
    gigante 60% + hasta 4 secundarios en columna estrecha)
  - nivel 5 solo → `layout_hero_absoluto` (imagen+ficha a toda anchura)
  - 2+ productos nivel 4 → `layout_doble_protagonista` (dos bloques
    iguales, imagen grande cada uno)
  - nivel 4 solo + secundarios → `layout_hero_secundarios` (hero más
    modesto que el de nivel 5)
  - solo niveles 1-3 → nivel 3 como hero pequeño + `layout_grid_comercial`
    (grid compacto de 3 columnas, sin cajas) para el resto
- Todos los patrones comparten: `banda_familia()` (cabecera antracita a
  todo el ancho), `bloque_precio()` (rojo/amarillo consistente en las 4
  variantes de tamaño: chico/normal/grande/hero), `badge_nivel()`
  (DESTACADO turquesa para nivel≥4, ★ RECOMENDADO para nivel 2).
- Portada de campaña real (`construir_portada`): titular + claim +
  intro + 2-4 productos protagonistas del catálogo completo (los de
  mayor `protagonismo`, nunca inventados) + lista de familias en texto
  corrido — cumple los 4 puntos del punto 10 del brief (quién somos /
  qué campaña / qué productos / que hay ofertas) en una sola pantalla.
- Cierre (`construir_cierre`): reutiliza el mapa real + chincheta ya
  validados en v2 (misma imagen, mismo cálculo de posición del
  marcador), con estética actualizada a la paleta V3.

### Bugs reales encontrados y corregidos durante la construcción de V3
1. **Chips de familia apilados uno por línea**: el primer intento de
   "en este catálogo encontrarás" usaba píldoras de color con envoltura
   manual (medir ancho de cada chip y decidir saltos de línea a mano)
   — la medición fallaba y cada chip ocupaba una fila entera. Sustituido
   por un único `Paragraph` con los nombres de familia separados por
   " · ", dejando que ReportLab envuelva el texto de forma nativa (más
   simple y sin ese bug posible).
2. **Tarjetas secundarias con imagen minúscula**: `_tarjeta_secundaria()`
   forzaba lienzo cuadrado (`cuadrado=True`) sobre fotos de producto muy
   apaisadas (p.ej. un banco de trabajo 368×230) — el margen blanco
   añadido para cuadrar la foto dejaba el producto visible diminuto
   dentro de su propio recuadro. Corregido usando `cuadrado=False`
   (mantiene la proporción real, sin lienzo cuadrado forzado) también
   para las tarjetas secundarias, no solo para el hero — mismo ajuste
   que ya se había aplicado en v2 para protagonismo≥3.
3. **Banda de familia huérfana al final de la portada**: sin salto de
   página explícito entre la portada y el contenido, ReportLab a veces
   colocaba la banda de la primera familia sola al final de la página 1
   sin nada debajo. Corregido con un `PageBreak()` explícito tras la
   portada.

### Pendiente / próximos pasos de V3
- **Validar con Eloy** que esta dirección es la correcta antes de
  seguir puliendo — es una primera pasada funcional, no un pulido
  final (quedan matices: el badge de descuento que ya trae la propia
  foto del producto, en rojo fijo desde `imagenes.py`, no se ha
  recoloreado a la paleta V3 — es cosmético y menor, pendiente si se
  quiere unificar del todo).
- El repertorio de layouts implementado (4 patrones + dispatcher) es
  un subconjunto deliberadamente más pequeño que los 6-10 patrones que
  sugiere el brief (punto 6) — suficiente para demostrar el sistema
  con el catálogo de prueba; se puede ampliar con más variantes
  (Layout Oferta específico, Layout Cierre comercial con selección de
  productos) si tras validar la dirección se pide más variedad.
- Sin tocar todavía: integración con Google Sheets + Apps Script +
  email (explícitamente pospuesto por el propio brief, punto 26, hasta
  validar el modelo visual).

### Cómo generar
```bash
# V3 (nuevo motor editorial, por defecto)
python scripts/generar_catalogo_comercial.py --tipo mes --valor septiembre --anio 2026

# V2 (maqueta anterior, para comparar)
python scripts/generar_catalogo_comercial.py --tipo mes --valor septiembre --anio 2026 --motor v2
```

---

## V3 — segunda vuelta (menos espacio en blanco + prueba de bloques redondeados)
Eloy validó la dirección ("no tiene mala pinta") pero señaló que
seguía habiendo mucho espacio en blanco, y pidió una prueba
incorporando bloques redondeados alrededor de los productos para
comparar visualmente.

### Bug real encontrado y corregido — huecos en familias de un solo producto
El espacio en blanco más llamativo venía de una causa muy concreta:
las familias con UN SOLO producto de nivel bajo/medio (sin nivel 4-5)
caían en `layout_hero_secundarios` con la lista de secundarios VACÍA
(la columna "hero" solo ocupa el 60% del ancho, dejando el 40% derecho
en blanco) o en `layout_grid_comercial` con `cols=3` fijos aunque solo
hubiera 1 producto (2 columnas completas en blanco al lado). Con 13
familias y varias de ellas de un solo producto en el catálogo de
prueba, este patrón se repetía varias veces por página.

Tres arreglos:
1. `layout_hero_secundarios()` ahora detecta cuándo `secundarios` está
   vacío y cae directamente en `layout_hero_absoluto()` (a todo el
   ancho) en vez de dejar una columna fantasma sin usar.
2. `layout_grid_comercial()` adapta el número de columnas al número
   real de productos (`cols = min(cols, len(productos))`) — nunca más
   columnas vacías que las que hacen falta.
3. En `disenar_familia()`, cuando una familia queda con un único
   producto sin protagonismo alto y sin ningún otro bloque de layout,
   se le da presencia completa vía `layout_hero_absoluto()` (con una
   imagen algo más modesta, 55mm) en vez de la tarjeta pequeña del
   grid comercial — un producto solo en su familia merece ocupar el
   ancho de la página, no quedar como una miniatura con hueco al lado.

### Bug real encontrado y corregido — precio HERO con descuento se cortaba
Al ensanchar los layouts de un solo producto, apareció un caso real:
un precio a tamaño "hero" (fontSize 40) con insignia de descuento al
lado partía el símbolo "€" a otra línea por falta de ancho en la fila.
Corregido: a tamaño `hero` específicamente, la insignia de descuento
se apila DEBAJO del precio en vez de al lado (a los demás tamaños
sigue yendo al lado, ahí sí cabe con margen).

### Prueba de bloques redondeados (`--cajas`)
A petición explícita de Eloy, se implementó como VARIANTE de
comparación (no sustituye la composición sin cajas que pedía el brief
original): `generar_pdf_v3(..., redondeado=True)` / CLI `--cajas`.
Reutiliza `CajaRedondeada` de `render_pdf.py` (v2) sin duplicar
código. Activado con un interruptor a nivel de módulo
(`layout_engine._config['redondeado']`) que envuelve cada bloque de
producto — hero, doble protagonista, tarjetas secundarias y grid — en
una caja de esquinas redondeadas con el color de identidad de la
campaña como borde. Requirió ajustar el padding interno de varias
piezas (por defecto muy ceñido, pensado para composición sin bordes)
para que el texto no quedara pegado al borde de la caja.

### Cómo generar
```bash
# V3 sin cajas (composición del brief original)
python scripts/generar_catalogo_comercial.py --tipo mes --valor septiembre --anio 2026

# V3 con bloques redondeados (variante de comparación)
python scripts/generar_catalogo_comercial.py --tipo mes --valor septiembre --anio 2026 --cajas
```

### Pendiente
Con estos arreglos y ambas variantes generadas, queda pendiente que
Eloy elija cuál de las dos (con o sin cajas) prefiere como base
definitiva antes de seguir ampliando el repertorio de layouts.

---

## V3 — tercera vuelta (cabeceras huérfanas + reordenamiento de familias para rellenar huecos)
Eloy rechazó la variante con cajas ("no está ordenado") — se descarta
como base, aunque el código de la variante (`--cajas`) se deja
disponible por si se quiere retomar más adelante. Sobre la versión sin
cajas, señaló dos problemas reales: cabeceras de familia que no
estaban en la misma página que sus productos, y espacio en blanco
todavía abundante.

### Bug real — cabecera de familia huérfana
`disenar_familia()` solo mantenía unida (`KeepTogether`) la banda de
familia con el `Spacer` que la sigue, NO con el primer bloque de
contenido real. Si el primer producto no cabía en lo que quedaba de
página, la banda se quedaba sola al final de una página y el
contenido empezaba solo, sin cabecera visible, al principio de la
siguiente. Confirmado visualmente: "ABRASIVOS" aparecía sola al final
de la página 2, sin ningún producto debajo.

Corregido reestructurando la función para separar explícitamente
"cabecera + primer bloque de contenido" (ahora sí en un único
`KeepTogether`) del resto de la familia (que sigue paginando con
normalidad, sin necesidad de mantenerse unido a nada).

### Espacio en blanco — causa real medida, no solo "hay hueco"
Con la cabecera ya arreglada, se midió (con `Table.wrap()`, no a ojo)
por qué la página 2 seguía con ~90mm de hueco tras "HERRAMIENTAS":
quedaban 68mm libres, pero la familia MÁS COMPACTA del catálogo de
prueba necesitaba 76mm para su cabecera+primer bloque — ninguna
familia cabía, así que la siguiente familia completa se iba entera a
la página siguiente sin usar ese hueco.

Dos arreglos combinados:
1. **Tamaños de imagen por defecto reducidos** en los distintos
   patrones de layout (hero absoluto 100mm→82mm, hero+secundarios
   78mm→56mm, doble protagonista 58mm→48mm, tarjeta secundaria en
   columna de hero 58mm→48mm) — bloques algo más compactos sin perder
   la jerarquía visual entre niveles.
2. **Reordenamiento de FAMILIAS para paginar mejor**
   (`_ordenar_familias_para_paginar()`, nueva función): simula el
   avance página a página con las alturas reales medidas de cada
   familia y, cuando la siguiente familia en el orden original no cabe
   en el hueco que queda, busca más adelante en la cola una familia
   más pequeña que SÍ quepa y la adelanta — la familia salteada sigue
   procesándose después, en cuanto haya hueco para ella. Mucho más
   simple que el reparto de v2 porque aquí solo hace falta decidir UN
   orden lineal, no balancear dos columnas.
   **Importante, y hay que ser explícito sobre esto**: esto reordena
   en qué PÁGINA aparece cada familia completa, nunca los PRODUCTOS
   dentro de una familia (que siguen siempre en el orden de la Sheet).
   Es una interpretación deliberadamente flexible del punto 16 del
   brief ("el orden de la Sheet es la fuente de verdad... salvo que la
   propia arquitectura requiera una agrupación por familia") — si Eloy
   prefiere el orden de familias estrictamente literal aunque eso
   implique más espacio en blanco, hay que desactivar esta función
   (queda aislada y es trivial de quitar sin tocar nada más).

### Resultado medido
Con el mismo catálogo de prueba: 8 páginas → 7 páginas, y visualmente
2-3 familias por página en la mayoría de los casos donde antes solo
cabía 1 con mucho hueco debajo (confirmado en las páginas 2, 3 y 4).
Rendimiento: ~1,1s para todo el catálogo (la medición de alturas
llama a `disenar_familia()` dos veces por familia — una para medir,
otra para el render final — pero las imágenes están cacheadas en
`imagenes.py` así que no se reprocesan desde disco).

### Pendiente
La página de cierre sigue con bastante espacio en blanco al final —
no se ha tocado en esta vuelta (el cierre no pasa por
`_ordenar_familias_para_paginar`, va siempre al final). Si hace falta
apurarlo más, la vía más simple sería dejar que la ÚLTIMA familia del
catálogo (la que quede justo antes del cierre) se calcule sabiendo
cuánto hueco le va a quedar al cierre detrás, similar a como se hacía
en v2 — no implementado todavía, pendiente de que Eloy confirme si
merece la pena antes de seguir.

---

## V3 — cuarta vuelta (apurar más el espacio para reducir páginas)
Eloy confirmó que la mejora anterior iba en buena dirección pero pidió
apurar más el espacio para reducir el número de páginas.

Dos ajustes más sobre el mismo mecanismo ya construido (no hizo falta
nada nuevo, solo afinar lo que ya había):

1. **Reordenamiento de familias — de "primera que quepa" a "la que
   mejor aproveche el hueco"**: `_ordenar_familias_para_paginar()`
   antes se conformaba con la PRIMERA familia posterior que cupiera en
   el hueco restante; ahora busca, entre TODAS las que quedan, la más
   GRANDE que aún quepa (mejor ajuste, no el primero que encaja) — así
   se apura el hueco al máximo en vez de dejarse margen de sobra con
   una familia pequeña cuando cabría una más grande.
2. **Espaciadores y tamaños de imagen reducidos un poco más en varios
   sitios**: el margen de seguridad de la simulación (6mm→3mm), los
   espaciadores entre cabecera/bloques dentro de una familia (5mm→
   3,5mm, 4mm→3mm, 8mm→5mm al final), y sobre todo el tamaño de las
   tarjetas secundarias que se apilan junto a un producto HERO
   (28mm→22mm de imagen) y las de la rejilla comercial (24mm→21mm /
   34mm→30mm) — estas tarjetas pequeñas se repiten mucho y eran las
   que más "peso muerto" acumulaban en las familias con varios
   productos.

### Resultado medido
Mismo catálogo de prueba (22 productos, 13 familias): **8 páginas →
6 páginas** (el punto de partida de esta sesión) sin perder legibilidad
ni la jerarquía visual entre niveles — verificado visualmente en
varias páginas, los bloques siguen leyéndose con holgura, no
apretados. La reducción se nota igual en el tema de Navidad (7→6) y en
la variante `--cajas` (8→7).

---

## V3 — quinta vuelta (portada más llamativa)
Eloy pidió que la portada fuera más llamativa — "hay mucho espacio en
blanco y no hay nada que determine que sea un folleto de descuentos".
Rediseño completo de `construir_portada()`:

- **Banda de titular a todo el ancho** con fondo antracita (color de
  estructura) y texto en blanco — logo + título + claim dentro del
  bloque, en vez de texto suelto sobre fondo blanco.
- **Aviso de descuento grande** ("¡AHORRA HASTA UN -X% EN PRODUCTOS
  SELECCIONADOS!"), fondo amarillo (color de descuento), calculado del
  MAYOR descuento real presente en el catálogo (nunca inventado) —
  aparece justo debajo del titular, lo primero que se lee tras el
  título. Si no hay ningún producto en oferta ese mes, el aviso
  desaparece sin más (probado, no deja hueco raro).
- **Productos protagonistas con imágenes más grandes** (antes 46mm,
  ahora con altura fija de imagen reservada — ver bug de abajo) sobre
  un fondo gris muy claro que agrupa visualmente la sección.

### Dos bugs reales encontrados y corregidos
1. **Texto del claim cortado** ("...CARROCERÍA" sin la S final): el
   ancho interior de la tabla anidada (logo + texto) no descontaba el
   padding de la tabla exterior (9mm a cada lado) — el texto se
   clipaba en vez de envolver. Corregido calculando el ancho interior
   real (`ancho - 18mm`) antes de repartir columnas.
2. **Insignias DESTACADO/precio a distinta altura entre las 3 tarjetas
   de producto**: cada imagen se ajustaba a su propia proporción real
   (una foto apaisada queda más baja que una alargada dentro del mismo
   límite máximo), así que el contenido de debajo (insignia, nombre,
   precio) arrancaba en una altura distinta en cada columna, dando
   sensación de fila descuadrada. Corregido reservando SIEMPRE la
   misma altura fija para la imagen (con la foto centrada dentro),
   independientemente de su proporción real — mismo principio que ya
   se aplicaba en otras partes del motor.

### Ajuste de espaciado tras el rediseño
El primer rediseño (con altura de imagen fija a 62mm) desbordaba a una
página 2 casi vacía (confirmado visualmente: la página 2 solo tenía
cabecera/pie, sin contenido). Se recortaron varios paddings/spacers
del bloque de portada (banda de titular 11→8mm, aviso 5→3.5mm,
espaciadores intermedios 6→4mm, imagen de producto 62→52mm) hasta que
volvió a caber entera en una sola página.

### Resultado
6 páginas (igual que antes del rediseño, sin coste adicional de
páginas), portada con presencia real de folleto de ofertas desde el
primer vistazo. Verificado con ambos temas (el de Navidad ajusta
colores correctamente: verde en vez de turquesa, antracita y rojo
constantes) y con el caso límite sin descuentos.

---

## V3 — sexta vuelta (pegatina de "estallido" real, no solo bloques de color)
Eloy insistió tras la vuelta anterior: "sigo sin verlo como un folleto
publicitario". El diagnóstico real: bloques de color planos y bien
ordenados leen como "diseño corporativo pulido", no como "folleto de
ofertas" — a un folleto de ofertas real (Lidl, Aldi...) le falta el
elemento gráfico más reconocible del género: una PEGATINA de estallido
(silueta de estrella irregular) con el descuento dentro, superpuesta
físicamente sobre el diseño, no un rectángulo de color más.

### Elemento nuevo: `generar_estallido()`
Genera con PIL una silueta de estrella irregular (13 puntas, ángulo
ligeramente rotado para dar sensación de dinamismo, no una estrella
perfectamente simétrica) rellena del color de descuento, con el "-X%"
grande y "DTO." debajo, en fuente `DejaVuSans-Bold` de sistema. Se
coloca superpuesta sobre la esquina de la banda del título — con el
mayor descuento REAL del catálogo, igual que en la vuelta anterior,
nunca inventado, y desaparece igual de limpio si no hay ofertas ese
mes (probado).

### Bug real de arquitectura encontrado y corregido — el `onPage` dibuja DEBAJO del contenido, no encima
Primer intento: pasar la pegatina como parte del `onPage` de la
plantilla de página (igual mecanismo que cabecera/pie). Resultado: la
pegatina quedaba TAPADA casi por completo por la banda oscura del
título — confirmado visualmente y con análisis de píxeles. La causa
es de arquitectura de ReportLab: `onPage` se dibuja ANTES de que el
contenido normal (flowables) de esa página se pinte encima —
pensado para fondos/decoración, no para overlays. Corregido con una
subclase de `BaseDocTemplate` que engancha `afterPage()` (se ejecuta
DESPUÉS de que el contenido de la página ya está dibujado) — ahí sí
queda por delante, como una pegatina real superpuesta al diseño.

### Bug real de posicionamiento — coordenadas mal calculadas (dos veces)
El primer intento de posición (`H - TOP_BAR_H - lado + 24mm`) sacaba
la pegatina por el borde SUPERIOR de la página (se dibujaba con la
parte de arriba fuera del área imprimible). El segundo intento
quedaba correcto en altura pero se salía por el borde DERECHO.
Corregido calculando la posición directamente desde las esquinas de
la página (`W - lado - margen`, `H - TOP_BAR_H - margen - lado`) en
vez de arrastrar una fórmula relativa a la banda que no tenía en
cuenta bien el sistema de coordenadas de `canvas.drawImage()` (esquina
inferior izquierda de la imagen, no la superior).

### Bug real — el texto del título largo quedaba tapado por la pegatina
Con nombres de campaña más largos ("CAMPAÑA DE NAVIDAD 2026" + claim
en 2 líneas), el texto se extendía hasta pisar visualmente la
pegatina, que es un elemento de canvas ajeno al flujo de texto
(reportlab no sabe que ahí hay algo y deja que el párrafo ocupe todo
su ancho asignado). Corregido reservando un hueco fijo (42mm) a la
derecha del título — como una tercera columna vacía en la tabla del
banner — sólo cuando hay pegatina que mostrar, para que el texto
NUNCA invada esa zona sea cual sea su longitud real.

### Resultado
Portada con una pegatina de descuento real superpuesta sobre la banda
de título, en vez de un rectángulo de color plano — el elemento que
más caracteriza visualmente a un folleto de ofertas de supermercado.
6 páginas, sin coste adicional. Probado con ambos temas (incluido el
caso de título largo que reveló el bug de solapamiento) y con el
caso sin descuentos.

---

## V4 — PIVOTE FINAL: folleto denso fiel al prototipo original

Eloy compartió de nuevo la imagen del prototipo de referencia con un
ultimátum claro: "si no llegamos a un modelo como el prototipo
prefiero que lo dejemos porque el diseño conseguido actualmente no es
el objetivo al que queremos llegar".

### Diagnóstico honesto, dicho así de claro
El brief que dio origen a V3 pedía explícitamente alejarse de una
rejilla densa de tarjetas con borde ("menos cajas", "editorial",
"asimétrico") — pero el prototipo de referencia ES precisamente eso:
una rejilla densa de tarjetas con borde, precio en pegatina roja
sólida, cinta de descuento diagonal en la esquina de cada foto, y
cabeceras de categoría con corte en chevron. Son dos objetivos
contrapuestos, y varias vueltas de V3 se dedicaron a perseguir el
objetivo equivocado (el del brief) en vez del que Eloy tenía realmente
en mente (el del prototipo). Reconocido explícitamente antes de seguir
invirtiendo tiempo en la misma dirección.

### Nuevo módulo: `layout_flyer.py` (`--motor v4`, ahora por defecto)
Arquitectura: igual que V3 (una sola columna a todo el ancho, flujo
natural, sin balanceo de columnas) pero con tarjetas de tamaño
UNIFORME en vez de layouts asimétricos de héroe — con tarjetas
uniformes, las filas de la rejilla se autoalinean sin necesitar ningún
algoritmo de reparto, la lección más cara de las v1/v2.

- **`BandaCategoria`**: cabecera con corte diagonal en chevron al
  final de la banda (`Flowable` que dibuja un rectángulo + un
  triángulo con `canvas.drawPath()`) — el detalle que más distingue al
  prototipo de una banda de color plana y corriente.
- **Cinta de descuento en la esquina de la foto**: no hubo que
  construir nada nuevo — `imagen_para_producto()` de `imagenes.py` YA
  compone esta cinta roja con sombra (`añadir_badge_descuento()`,
  construida en v1/v2) sobre la imagen del producto si tiene oferta.
  Coincide casi exactamente con el estilo del prototipo, reutilizado
  tal cual.
- **`sticker_precio_flyer()`**: precio en pegatina roja sólida, texto
  blanco grande y en negrita — igual que el prototipo.
- **`tarjeta_producto()`**: imagen + nombre + referencia + precio,
  envuelta en `CajaRedondeada` (reutilizada de v2) con borde fino gris.
- **Pegatina de estallido en portada**: reutilizada de V3
  (`generar_estallido()`, `_DocConExtras.afterPage()`) sin cambios —
  ya funcionaba bien ahí.
- **Mapa real + chincheta del cierre**: reutilizado de V3
  (`generar_imagen_ubicacion()`) a través de un adaptador mínimo
  (`_TemaColorAdapter`, solo expone `color_precio`) para no tener que
  duplicar esa función ni acoplar `layout_flyer.py` al sistema de
  `Tema` completo de V3, que aquí no hace falta (V4 usa una paleta
  fija: gris azulado + rojo, igual que el prototipo, no varía por
  campaña).

### Bug real encontrado y corregido durante la construcción
**Precio tachado ilegible dentro de la pegatina roja**: el primer
intento ponía el precio tachado (color gris `#8A9099`) DENTRO de la
misma pegatina roja, encima del precio final — contraste insuficiente,
casi invisible. Corregido sacándolo FUERA de la pegatina, en una línea
aparte encima, sobre fondo blanco — coincide además con cómo lo hace
el propio prototipo (tachado sobre fondo blanco, precio final ya
dentro de la pegatina roja).

### Decisión de diseño validada visualmente antes de fijarla
Se probó primero adaptar el número de columnas al número de productos
de cada familia (igual que se hizo en V3 para huecos similares) —
resultado: una tarjeta única estirada a todo el ancho con la imagen
pequeña perdida en el centro, mucho PEOR que dejar el hueco en blanco.
Descartado tras verlo, y sustituido por CENTRAR la fila incompleta
(huecos repartidos a los dos lados en vez de solo a la derecha) — se
ve intencionado, no un resto abandonado.

### Resultado
5 páginas para el catálogo de 22 productos (menos que las 6 de V3, más
denso). Visualmente mucho más cercano al prototipo de referencia:
rejilla de tarjetas con borde, chevron en las cabeceras, precio en
rojo sólido, cinta de descuento diagonal en cada foto con oferta.
Probado con ambos temas, caso límite de 2 productos, y catálogo con
errores forzados — sin errores.

### Pendiente
- Confirmar con Eloy si esta dirección (V4) sí es la que se buscaba,
  antes de seguir puliendo detalles.
- V4 usa una paleta FIJA (gris azulado + rojo) que no varía por
  campaña, a diferencia de V3 — decisión deliberada por fidelidad al
  prototipo, pero pendiente de confirmar si se quiere alguna variación
  estacional más adelante (p.ej. un acento verde en Navidad).
- Los iconos de categoría del prototipo (llave inglesa, spray,
  mascarilla...) no se han implementado — la banda de categoría v4
  solo tiene el corte en chevron, sin icono. Pendiente si se considera
  necesario.

---

## V4 — segunda vuelta (cabecera más pequeña, 4 columnas)
Eloy confirmó que V4 va en la dirección correcta ("está mejor") y
pidió aprovechar mejor el espacio: cabecera de familia más pequeña y
más productos por fila.

- `BandaCategoria`: altura de 10,5mm a 7,5mm (fuente ajustada
  proporcionalmente para que siga siendo legible).
- `grid_categoria()` / `generar_pdf_flyer()`: de 3 a 4 columnas por
  fila (`alto_img` de 30mm a 26mm para que las tarjetas más estrechas
  sigan teniendo buenas proporciones).

### Resultado
22 productos / 13 familias: de 5 a **4 páginas**. Confirmado
visualmente que con 4 columnas una familia como HERRAMIENTAS (4
productos) entra ahora en una sola fila, y varias páginas ya combinan
3-5 categorías completas sin apenas espacio perdido. Misma mejora en
el tema de Navidad (5→4 páginas). Sin regresiones en el caso límite de
2 productos ni en el catálogo con errores forzados.

---

## V4 — tercera vuelta (agrupar familias de un solo producto + súper reducido)
Eloy pidió el ajuste final: "quiero que esté todo junto evitando
espacios en blanco. Reduce, acopla productos que solo haya uno de la
familia al lado de otros en su misma situación. Tiene que ser súper
reducido."

### Nuevo mecanismo: `agrupar_sueltos()`
Las familias con UN SOLO producto ya no abren su propia banda de
categoría (que dejaba 3 de 4 columnas en blanco al lado, visto en la
vuelta anterior). Ahora se separan en dos grupos antes de renderizar:
- **Multi-producto** (2+): tratamiento normal, banda de categoría
  propia + rejilla (`grid_categoria`, sin cambios de fondo).
- **Un solo producto**: se agrupan TODAS juntas en una única rejilla
  compartida al final del catálogo (`agrupar_sueltos`) — sin banda de
  categoría propia; cada tarjeta lleva su nombre de familia como una
  etiqueta pequeña integrada arriba, para no perder la información de
  a qué categoría pertenece.

Exactamente lo pedido: "acopla productos que solo haya uno de la
familia al lado de otros en su misma situación" — verificado
visualmente, `PRODUCTOS CHAPISTA`, `PROTECCIÓN LABORAL`, `SPRAY MAX` y
`CINTAS DE ENMASCARAR` (4 familias de 1 producto) ahora comparten una
misma fila de 4 columnas en vez de 4 bandas con hueco cada una.

### "Súper reducido" — recortes generales
- Márgenes de página: 10mm → 7mm.
- Cabecera/pie de página: 20mm/14mm → 15mm/10mm (con un bug real
  corregido de paso: con el pie más bajo, la segunda línea de texto
  del pie quedaba en coordenada Y NEGATIVA, es decir, fuera de la
  página — detectado antes de generar el PDF final, corregido
  recalculando los desplazamientos).
- Banda de portada: relleno interno 7mm → 4,5mm, título 26pt → 22pt.
- Pegatina de estallido: 48mm → 34mm (proporcional a la banda más
  pequeña — si no, sobresalía demasiado de una banda ya más baja).
- Tarjeta de producto: relleno interno, tamaños de fuente y
  espaciadores entre elementos reducidos en general.

### Resultado
Mismo catálogo de prueba (22 productos, 13 familias): de **4 a 3
páginas**. La página 1 llega a encajar 5 categorías completas. Misma
mejora en el tema de Navidad (verificado que el título más largo
"CAMPAÑA DE NAVIDAD 2026" sigue sin chocar con la pegatina de
estallido, pese a la banda más pequeña). Sin regresiones en el caso
límite de 2 productos ni en el catálogo con errores forzados.

---

## V4 — cuarta vuelta (tarjetas de altura uniforme + agrupación generalizada de restos)
Eloy señaló dos problemas reales muy concretos: "las cajas de los
productos no tienen los mismos tamaños, hay algunos que son más
grandes que otros siendo la imagen pequeña" y "hay familias con dos
productos por fila. En esa fila habría que introducir otra familia con
dos productos o bien dos familias con un producto cada una".

### Bug real — tarjetas de distinto tamaño con la misma imagen
Causa real: dentro de una fila, `Table` estira la ALTURA de la fila a
la más alta (por ejemplo, un producto con nombre de 3 líneas), pero
cada tarjeta es su propia `CajaRedondeada` con el borde ajustado a SU
PROPIA altura de contenido — así que las tarjetas con nombres más
cortos quedaban con su caja más pequeña, flotando dentro de una fila
más alta, dando la sensación de tamaños distintos con la misma imagen
pequeña. Corregido reservando una altura FIJA para cada bloque interno
de la tarjeta (etiqueta de familia, nombre+referencia, precio) en vez
de dejar que el texto determine la altura — ahora todas las tarjetas
del catálogo miden EXACTAMENTE lo mismo, no solo dentro de una fila
sino en todo el documento. Como efecto añadido, la pegatina de precio
(roja) queda siempre a la misma altura entre tarjetas de la misma fila
aunque unas tengan descuento (con tachado encima) y otras no.

### Generalización de la agrupación — de "familias de 1" a "cualquier resto de fila"
`agrupar_sueltos()` (de la vuelta anterior) solo agrupaba familias
ENTERAS de un único producto. Nueva función `preparar_grupos()`:
separa cada familia en (a) sus filas COMPLETAS (múltiplos de columnas,
que sí se quedan con banda de categoría propia) y (b) lo que sobra sin
llegar a llenar una fila — tanto si sobran 1-3 productos de una
familia grande como si la familia entera es más pequeña que una fila.
TODO lo que sobra de TODAS las familias se junta en un único mazo
(cada producto etiquetado con su familia) y se reparte después en
filas compartidas. Verificado visualmente: una fila de la rejilla de
"sueltos" combina ahora 2 productos de ABRASIVOS (el resto de una
familia de 6) + 1 de PRODUCTOS CHAPISTA + 1 de PROTECCIÓN LABORAL,
exactamente el ejemplo que puso Eloy.

### Bug real encontrado y corregido durante la implementación
La altura fija reservada para la etiqueta de familia dentro de las
tarjetas "sueltas" (3,6mm) no era suficiente para nombres largos como
"PREPARACIÓN DE PINTURAS COMPLEMENTOS" — la segunda línea se recortaba
visualmente. Corregido a 6,2mm (dos líneas completas) tras comprobar
la longitud real de todos los nombres de familia del catálogo de
prueba, no solo a ojo.

### Resultado
Mismo catálogo de prueba: de **3 a 2 páginas**. Todas las tarjetas
miden exactamente lo mismo en todo el documento. Sin regresiones en
ambos temas, el caso límite de 2 productos (ahora tratado como "resto"
y agrupado igualmente, ya que 2 < 4 columnas) ni el catálogo con
errores forzados.
