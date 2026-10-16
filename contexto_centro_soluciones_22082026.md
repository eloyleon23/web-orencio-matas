# Contexto — Centro de Soluciones (orenciomatas.es)

Soy Eloy (GitHub: `eloyleon23`), desarrollador web del proyecto orenciomatas.es. Este documento es continuación específica sobre el **Centro de Soluciones**, una sección nueva del sitio construida en una sesión larga con Claude. **Nota importante: a partir de aquí he continuado el trabajo con Devin** (otro asistente de IA) — este documento congela el estado tal y como lo dejó Claude, pero puede haber cambios posteriores de Devin no reflejados aquí. Revisar el historial de commits de `main` para ver qué ha pasado después de `7415414`.

Para contexto general del resto del proyecto (buscador, catálogos, Apps Script, etc.), ver `contexto_proyecto_om_20082026.md`. Este documento se centra solo en el Centro de Soluciones.

---

## QUÉ ES

Una segunda puerta de entrada al catálogo, orientada a problema/objetivo en vez de a producto: en vez de PRODUCTO → FAMILIA → PRODUCTO, el usuario dice qué quiere conseguir o qué problema tiene, y la web lo lleva a PROBLEMA → DIAGNÓSTICO → PASOS → PRODUCTOS → COMPRA. Complementa al buscador existente (`buscador.html`), no lo sustituye. Enlazado desde el navbar real (submenú de "Productos", junto a "Buscador").

---

## ARCHIVOS

```
centro-soluciones.html          ← home de la sección (hero, wizard, chips, areas)
soluciones/solucion.html        ← plantilla de detalle (?slug=), incluye el modal de producto
assets/js/soluciones-data.js    ← TODOS los datos (19 soluciones) + motores de diagnóstico + utilidades compartidas de catálogo real
assets/js/centro-soluciones.js  ← lógica de la home
assets/js/solucion-detalle.js   ← lógica de la página de detalle
assets/css/soluciones.css       ← todo el CSS de la sección (reutiliza variables de src/css/estilos.css)
```

Sin backend propio — todo estático, JS puro, sin build step. Los datos de las 19 soluciones viven hardcodeados en `soluciones-data.js` (no en el Sheet). **El usuario decidió explícitamente NO montar todavía un sistema de Google Sheets + script de exportación para gestionar soluciones** (se preguntó, respondió "todavía no, sigamos así un tiempo más") — seguir añadiendo/editando soluciones a mano en el JS por ahora.

---

## ESTADO ACTUAL (19 soluciones)

**Slugs:** `pintar-plastico-coche`, `eliminar-oxido-metal`, `restaurar-mueble-madera`, `recuperar-brillo-carroceria`, `sellar-juntas-bano`, `suelo-epoxi-garaje`, `mantenimiento-piscina`, `control-plagas-cocina`, `pintar-pared-interior`, `desatascar-tuberia`, `abrillantar-suelo-marmol`, `eliminar-manchas-ropa`, `control-roedores`, `cuidado-plantas-jardin`, `proteger-ropa-polillas`, `proteger-bajos-antigravilla`, `sellar-luna-parabrisas`, `pintar-fachada-exterior`, `impermeabilizar-terraza-goteras`

**Taxonomía:** 9 acciones, 10 superficies, 26 chips de "problemas frecuentes", 10 áreas de exploración, 14 destacadas en portada.

**Con calculadora de cantidad (m² → litros):** `eliminar-oxido-metal`, `restaurar-mueble-madera`, `suelo-epoxi-garaje`, `pintar-pared-interior`, `pintar-fachada-exterior`.

**Con enlace a carta de colores (con logo real de la marca):** `restaurar-mueble-madera` y `pintar-pared-interior` → Titanlux; `suelo-epoxi-garaje` y `pintar-fachada-exterior` → TitanTech.

---

## MODELO DE DATOS DE UNA SOLUCIÓN

Cada entrada en `soluciones` (objeto `soluciones-data.js`) tiene: `slug, title, description, category, subcategory, problem, objective, surface, difficulty, estimatedTime, result, breadcrumb, materials[], receta[], steps[], professionalTips[], commonMistakes[], recommendedProducts[], alternativeProducts[], relatedSolutions[], seo{}`. Opcionales: `colorChart{label,url,logo}`, `calculadoraCantidad{rendimiento,etiqueta}`.

`recommendedProducts[]` tiene `{nombre, categoria, formato?, precio}` — son los datos "mock" originales de cada guía (algunos ya con nombres reales copiados del catálogo, otros todavía inventados, ver más abajo).

---

## CONEXIÓN CON EL CATÁLOGO REAL (pieza clave, entender bien antes de tocar)

`soluciones-data.js` expone utilidades compartidas usadas tanto por la home como por el detalle:

- `cargarCatalogoReal()` — fetch + caché de `data/productos.json` (ruta relativa calculada según si la URL actual contiene `/soluciones/` o no).
- `normalizarTexto()`, `palabrasSignificativas()`, `contienePalabra()` (coincidencia por **palabra completa**, no subcadena — cuidado: ya se corrigieron varios bugs de colisión tipo "olor" dentro de "incolora", "cola" dentro de "descolado", "brillo"/"suelo"/"salon" demasiado genéricos).
- `buscarProductosEnCatalogo(texto)` — ranking de productos reales por palabras coincidentes en el nombre.
- `resolverProductoReal(nombreMock)` — intenta encontrar el producto real más probable para un nombre de `recommendedProducts`: coincidencia exacta → inclusión → ranking con mínimo 2 palabras coincidentes. Devuelve `null` si no hay nada razonable (no fuerza relaciones dudosas).

En `solucion-detalle.js`, `renderProductosRecomendados()` resuelve TODOS los productos de la guía contra el catálogo real en paralelo (`Promise.all`), y `construirEntradaProducto(mock, real)` combina ambos: si hay match real, usa imagen/ref/precio_con/precio_sin/familia/área reales; si no, cae a los datos mock de la guía (sin inventar ref/imagen).

**Estado de resolución real por solución (auditado el 22/08, puede haber cambiado):**
- La mayoría de soluciones (las que ya usaban nombres reales copiados del catálogo al redactarlas) resuelven ~100%.
- **Pendiente de mejorar:** `pintar-plastico-coche` (2/6 con ref real), `restaurar-mueble-madera` (4/5), `recuperar-brillo-carroceria` (2/5) — estas 3 fueron las primeras que se escribieron con productos parcialmente ficticios, antes de que se conectara la resolución real. Los que no resuelven caen a un enlace de búsqueda por texto (`?q=nombre`) en vez de por referencia (`?ref=`) en el botón "Ver ficha completa en el buscador" del modal.

**⚠️ Pendiente sin resolver (última petición del usuario antes de pausar):** el usuario pidió que el botón "Ver ficha completa en el buscador" busque siempre por referencia en vez de por nombre, "para que abra directamente una vez cargue el buscador". Esto ya es así cuando hay una referencia real resuelta (`esReal: true` → usa `?ref=`). El caso sin resolver es que **no existe una referencia que buscar** para los productos puramente mock de esas 3 soluciones — no se llegó a decidir con el usuario si la solución es (a) mejorar la resolución/redactar esos productos con nombres reales del catálogo, o (b) aceptar el fallback por texto (que en `buscador.html` sí auto-abre el producto si el texto da un resultado único — función `abrirProductoUnicoTrasBusqueda`). **Quedé a media investigación cuando el usuario pidió parar** — no se tocó código de este punto todavía.

---

## MODAL DE DETALLE DE PRODUCTO (en las páginas de solución)

Al pinchar un producto propuesto **ya no navega** a `buscador.html` — abre un modal en la propia página. Tras varias iteraciones, el usuario pidió explícitamente que fuera **el mismo modal que usa `buscador.html`** (mismas clases CSS: `modal-overlay`, `modal-producto-box`, `modal-producto-content`, `modal-producto-imagen`, `modal-producto-info`, `modal-producto-precio-con/sin`, `modal-producto-detalles`, `modal-producto-disclaimer`, `modal-producto-compartir`, `modal-producto-ficha`), portado tal cual (no una versión con nombres de clase propios `cs-*`).

Se omiten a propósito las partes de administración del modal real que requieren el backend de Apps Script (no aplican en esta vista de solo lectura): actualizar/buscar/validar imagen, dar de baja/reactivar, gestionar relacionados, calculadora de rendimiento por producto individual, complementarios, badge de logo de fabricante.

Botón "Compartir" funcional: copia al portapapeles (nombre + precio + enlace), con el mismo estado visual `.copiado` en verde que el original.

Se cierra con: botón X, tecla ESC, o clic en el fondo oscuro (fuera de la caja).

---

## OTRAS FUNCIONALIDADES YA IMPLEMENTADAS

- **Asistente de diagnóstico (wizard de 4 pasos):** acción → superficie → estado → resultado → solución. Si no hay una guía que encaje con confianza (principalmente superficie "Otro"), lo dice honestamente en vez de inventar una recomendación, y además intenta una **búsqueda real en el catálogo** con la combinación acción+superficie como consulta aproximada.
- **"Tengo un problema" (texto libre + 26 chips):** motor de diagnóstico por palabras clave; si no coincide con ninguna guía, hace lo mismo — busca en el catálogo real y propone productos, con enlace a "ver todos los resultados en el buscador" (`?q=`).
- **Buscador rápido dentro de "Explora soluciones":** filtra en vivo los ejemplos de las 10 áreas por texto (sin acentos), resalta coincidencias, oculta áreas sin resultado.
- **Exportar como lista de la compra** (sustituye a un antiguo carrito simulado, que se quitó a petición del usuario porque no existe carrito real todavía): 4 formas — 📄 PDF (usa la función "Imprimir" nativa del navegador con una hoja `@media print` dedicada que oculta menú/pie/breadcrumb/alternativas y deja visible todo el contenido + productos con imagen), 📋 copiar al portapapeles, ⬇️ descargar `.txt`, 💬 WhatsApp (navega en la misma pestaña, no abre una nueva — se corrigió porque dejaba una pestaña en blanco).
- **Calculadora de cantidad** (m² × manos ÷ rendimiento = litros), en las 5 soluciones de pintura/barniz/epoxi listadas arriba.
- **Botón "volver arriba"** flotante (aparece tras 500px de scroll), en home y en detalle.
- **Scroll de anclas con offset del header:** el header es `position:sticky`, así que los saltos a `#ancla` (ej. el botón "Tengo un problema" del hero) compensan la altura real del menú para no quedar tapados.

---

## LECCIONES Y BUGS YA CORREGIDOS (no reintroducir)

1. **Rutas relativas rotas:** `soluciones/solucion.html` vive un nivel por debajo de la raíz — cualquier enlace a `buscador.html`, `assets/...` etc. escrito dentro de `solucion-detalle.js` o `soluciones/solucion.html` necesita el prefijo `../`. Ya causó un 404 real al enlazar productos sin el prefijo.
2. **Colisiones de palabra en buscadores de texto:** usar coincidencia por **palabra completa** (con límites de palabra), nunca `.includes()` a secas — ya mordió varias veces ("sata" en "desatascador" en Apps Script histórico; "cola" en "descolado"; "olor" en "incolora"; "brillo"/"suelo"/"salon" demasiado genéricos causando falsos positivos cruzados entre problemas).
3. **Nunca declarar una solución/coincidencia con falsa confianza:** si no hay un match razonable, hay que decirlo honestamente (aplicado tanto al wizard como al texto libre) en vez de caer en un fallback fijo que parece un acierto real.
4. **`.hero::before` (textura oscura del fondo animado) se pinta por encima del contenido si el contenedor no tiene `position:relative + z-index`** — la home usa `.hero-container` para esto, el Centro de Soluciones necesitó su propio `.cs-hero__contenido` con el mismo tratamiento. Incluso así, el contraste seguía dependiendo del color exacto del degradado en cada instante — la solución final fue una tarjeta con fondo oscuro casi opaco (`rgba(8,12,20,0.6)`), no solo z-index.
5. **CSS Grid con `1fr 1fr` sin `min-width:0` en los hijos puede desbordar la página** si el contenido (listas largas) no puede encogerse — causó scroll horizontal real en móvil (hasta 140px a 320px de ancho). Cualquier grid nuevo de 2+ columnas necesita `min-width:0` en los hijos y un `@media` que colapse a 1 columna en móvil.
6. **`window.open(url, '_blank')` para enlaces `wa.me` deja una pestaña en blanco** tras el salto a la app — usar `window.location.href` en su lugar.
7. **Brandfetch (agregador de logos) prohíbe en sus términos el hotlinking/scraping de sus imágenes fuera de su API oficial** — no usar. Los logos de marca ya estaban como assets propios en `assets/proveedores/` (Titanlux se resolvió con el logo oficial en su propio dominio, `static.titanlux.es/web/logo.png`).
8. **Registrar listeners de clic dentro de una función que se re-ejecuta en cada tecleo** (ej. un filtro en vivo) acumula listeners duplicados — el delegado de clic debe registrarse una sola vez fuera de la función de renderizado repetido.

---

## PENDIENTE / ABIERTO

1. **Resolución de productos reales incompleta** en `pintar-plastico-coche`, `restaurar-mueble-madera`, `recuperar-brillo-carroceria` (ver sección de arriba) — decidir si reescribir esos `recommendedProducts` con nombres reales del catálogo, o aceptar el fallback de búsqueda por texto.
2. **TitanPro y Titán general (titanpinturas.com)** no tienen todavía ningún enlace de carta de colores en ninguna solución — sus logos no se han buscado/añadido porque no hacían falta aún.
3. **Sistema de gestión de soluciones vía Google Sheets** — evaluado y explícitamente aparcado por el usuario por ahora.
4. **Sesión de repaso general pendiente** — el usuario mencionó querer hacer un repaso general del prototipo en algún momento; no se sabe si ya ocurrió con Devin.
5. Áreas del catálogo real no exploradas todavía para nuevas soluciones (mencionadas como de menor prioridad en su momento): línea Titán completa (1.314 productos, solo se ha tocado epoxi/suelos/pared/fachada), sistemas R-M/URKI-SYSTEM (repintado profesional de talleres, más orientado a profesionales), productos químicos/limpieza industrial (B2B).

---

## DEPLOYMENT

Todo el trabajo de esta sesión está en `main` (GitHub Pages / desarrollo), commits `fb62f52` → `7415414`. **Recordatorio permanente del proyecto: nunca desplegar a IONOS/`release` sin permiso explícito del usuario**, aunque `main` tenga cambios — el Centro de Soluciones sigue sin pasar a producción real todavía.
