# Contexto — Centro de Soluciones (orenciomatas.es)

Soy Eloy (GitHub: `eloyleon23`), desarrollador web del proyecto orenciomatas.es. Este documento es continuación específica sobre el **Centro de Soluciones**, una sección del sitio construida en una sesión muy larga con Claude, con trabajo intercalado de Devin (otro asistente de IA) en varios tramos. Congela el estado tal y como lo dejó Claude en el commit `0daeff0` — **puede haber cambios posteriores de Devin no reflejados aquí**; revisar el historial de `main` para verlo.

Para contexto general del resto del proyecto (buscador, catálogos, Apps Script, etc.), ver `contexto_proyecto_om_20082026.md` en la raíz del repo. Este documento se centra solo en el Centro de Soluciones.

---

## ⚠️ SOBRE EL TOKEN DE GITHUB

**Este documento NO incluye el token de GitHub a propósito** — es una credencial viva con permiso de escritura sobre un repositorio **público**; si acabara en un archivo del propio repo (como pasa con estos documentos de contexto, que normalmente se commitean), quedaría expuesta para cualquiera. Es exactamente el mismo tipo de problema que el aviso de seguridad pendiente sobre `src/js/config-buscador.js` (ver sección de pendientes). Pide el token de nuevo al usuario al empezar el chat siguiente; no lo persistas en ningún archivo del repo.

Patrón de uso del token en esta sesión (repetir en la siguiente):
```bash
git fetch "https://x-access-token:TOKEN_AQUI@github.com/eloyleon23/web-orencio-matas.git" +refs/heads/main:refs/remotes/origin/main
git reset --hard origin/main   # o git rebase origin/main si hay commits locales sin subir
# ... cambios ...
git add <archivos>
git commit -m "..."
git rebase origin/main   # por si ha habido commits nuevos (automaticos o de Devin) mientras se trabajaba
git push "https://x-access-token:TOKEN_AQUI@github.com/eloyleon23/web-orencio-matas.git" main
```
Siempre enmascarar el token en la salida de terminal con `sed 's/github_pat_[A-Za-z0-9_]*/[TOKEN OCULTO]/g'` al mostrar comandos de git al usuario.

---

## QUÉ ES

Una segunda puerta de entrada al catálogo, orientada a problema/objetivo en vez de a producto: en vez de PRODUCTO → FAMILIA → PRODUCTO, el usuario dice qué quiere conseguir o qué problema tiene, y la web lo lleva a PROBLEMA → DIAGNÓSTICO → PASOS → PRODUCTOS → COMPRA. Complementa al buscador existente (`buscador.html`), no lo sustituye. Enlazado desde el navbar real (submenú de "Productos", junto a "Buscador").

---

## ARCHIVOS

```
centro-soluciones.html          ← home de la sección (hero, wizard, chips, areas)
soluciones/solucion.html        ← plantilla de detalle (?slug=), incluye el modal de producto
assets/js/soluciones-data.js    ← TODOS los datos (39 soluciones) + motores de diagnóstico + utilidades compartidas de catálogo real
assets/js/centro-soluciones.js  ← lógica de la home
assets/js/solucion-detalle.js   ← lógica de la página de detalle
assets/css/soluciones.css       ← todo el CSS de la sección (reutiliza variables de src/css/estilos.css)
```

Sin backend propio — todo estático, JS puro, sin build step. Los datos de las 39 soluciones viven hardcodeados en `soluciones-data.js` (no en el Sheet). **El usuario decidió explícitamente NO montar todavía un sistema de Google Sheets + script de exportación para gestionar soluciones** (se preguntó, respondió "todavía no, sigamos así un tiempo más") — seguir añadiendo/editando soluciones a mano en el JS por ahora, salvo que el usuario indique lo contrario en el nuevo chat.

---

## ESTADO ACTUAL (39 soluciones)

**Slugs** (agrupados informalmente por temática):

- **Coche/carrocería:** `pintar-plastico-coche`, `eliminar-oxido-metal`, `recuperar-brillo-carroceria`, `corregir-marcas-lijado`, `corregir-descuelgues-pintura`, `restaurar-faros-coche`, `pintar-llantas-coche`, `proteger-bajos-antigravilla`, `sellar-luna-parabrisas`
- **Madera:** `restaurar-mueble-madera`, `decapar-pintura-mueble`, `proteger-madera-exterior`, `barnizar-suelo-madera`, `lacado-profesional-muebles`
- **Pintura/pared/fachada:** `pintar-pared-interior`, `pintar-fachada-exterior`, `pintar-azulejos`, `impermeabilizar-terraza-goteras`
- **Metal profesional:** `proteger-estructura-metalica-corrosion`, `proteger-estructura-acero-fuego`
- **Herramientas de pintor (Werku):** `elegir-pistola-pintar`, `elegir-lijadora-superficie`
- **Suelos/garaje:** `suelo-epoxi-garaje`
- **Pegado/sellado:** `sellar-juntas-bano`, `quitar-restos-pegamento`, `elegir-pegamento-material`
- **Limpieza/droguería:** `desatascar-tuberia`, `abrillantar-suelo-marmol`, `eliminar-manchas-ropa`, `limpiar-plata-metales`, `usar-lejia-segura`, `desinfectar-casa`
- **Piscinas:** `mantenimiento-piscina`
- **Plagas:** `control-plagas-cocina`, `control-roedores`, `proteger-ropa-polillas`, `eliminar-mosquitos`
- **Jardín:** `cuidado-plantas-jardin`

**Taxonomía:** 9 acciones, 10 superficies, 42 chips de "problemas frecuentes", 10 áreas de exploración, 14 destacadas en portada.

**Con calculadora de cantidad (m² → litros):** `eliminar-oxido-metal`, `restaurar-mueble-madera`, `suelo-epoxi-garaje`, `pintar-pared-interior`, `pintar-fachada-exterior`.

**Con enlace a carta de colores (con logo real de la marca):** `restaurar-mueble-madera`, `pintar-pared-interior`, `cuidado-plantas-jardin` → Titanlux; `suelo-epoxi-garaje`, `pintar-fachada-exterior` → TitanTech. *(La entrada de `cuidado-plantas-jardin` parece añadida por Devin — verificar si tiene sentido o es un error de asignación).*

---

## MODELO DE DATOS DE UNA SOLUCIÓN

Cada entrada en `soluciones` (objeto `soluciones-data.js`) tiene: `slug, title, description, category, subcategory, problem, objective, surface, difficulty, estimatedTime, result, breadcrumb, materials[], receta[], steps[], professionalTips[], commonMistakes[], recommendedProducts[], alternativeProducts[], relatedSolutions[], seo{}`. Opcionales: `colorChart{label,url,logo}`, `calculadoraCantidad{rendimiento,etiqueta}`.

`recommendedProducts[]` tiene `{nombre, categoria, formato?, precio}` — algunos ya con nombres reales copiados del catálogo, otros todavía con formato "mock" heredado de las primeras 4 soluciones (ver sección de pendientes).

---

## CONEXIÓN CON EL CATÁLOGO REAL (pieza clave, entender bien antes de tocar)

`soluciones-data.js` expone utilidades compartidas usadas tanto por la home como por el detalle:

- `cargarCatalogoReal()` — fetch + caché de `data/productos.json` (ruta relativa calculada según si la URL actual contiene `/soluciones/` o no).
- `normalizarTexto()`, `palabrasSignificativas()`, `contienePalabra()` (coincidencia por **palabra completa**, no subcadena — cuidado: ya se corrigieron varios bugs de colisión tipo "olor" dentro de "incolora", "cola" dentro de "descolado", "brillo"/"suelo"/"salon"/"jardin"/"mueble"/"pegamento" demasiado genéricos colisionando entre distintos problemas).
- `buscarProductosEnCatalogo(texto)` — ranking de productos reales por palabras coincidentes en el nombre.
- `resolverProductoReal(nombreMock)` — intenta encontrar el producto real más probable para un nombre de `recommendedProducts`: coincidencia exacta → inclusión → ranking con mínimo 2 palabras coincidentes. Devuelve `null` si no hay nada razonable (no fuerza relaciones dudosas). A veces resuelve a un producto real distinto pero igualmente coherente al que se pretendía (ej. una imprimación sintética distinta a la especificada) — es un comportamiento aceptado del diseño, no un bug.

En `solucion-detalle.js`, `renderProductosRecomendados()` resuelve TODOS los productos de la guía contra el catálogo real en paralelo (`Promise.all`), y `construirEntradaProducto(mock, real)` combina ambos: si hay match real, usa imagen/ref/precio_con/precio_sin/familia/área reales; si no, cae a los datos mock de la guía (sin inventar ref/imagen).

**Estado de resolución real:** la gran mayoría de las 39 soluciones (las creadas después de las 4 primeras) ya usan nombres reales copiados directamente del catálogo, por lo que resuelven ~100%. Las 3 primeras (`pintar-plastico-coche`, `restaurar-mueble-madera`, `recuperar-brillo-carroceria`) siguen teniendo algunos productos parcialmente ficticios que no resuelven contra una referencia real (última auditoría: 2/6, 4/5 y 2/5 con referencia respectivamente) — pendiente de revisar/reescribir si se quiere el 100%.

**Fuente de productos reales usada:** `data/productos.json` (drogería/perfumería/pinturas, ~12.858 productos + ahora también gama TitanTech completa verificada, 108 productos). **No incluye** el catálogo de talleres/proveedores externos (Zaphiro, Besa, Glasurit, Baslac) que sí vive en `productos_talleres.json` y similares — algunas soluciones (`proteger-bajos-antigravilla`, `sellar-luna-parabrisas`) usan nombres de esos catálogos por coincidencia de la sesión donde se escribieron, pero `resolverProductoReal()` no los busca ahí, así que esos productos concretos siempre caerán al fallback mock en esas 2 soluciones. No se ha corregido — anotado para quien continúe.

---

## MODAL DE DETALLE DE PRODUCTO (en las páginas de solución)

Al pinchar un producto propuesto **no navega** a `buscador.html` — abre un modal en la propia página. Es un **port fiel** del modal real de `buscador.html` (mismas clases CSS: `modal-overlay`, `modal-producto-box`, `modal-producto-content`, `modal-producto-imagen`, `modal-producto-info`, `modal-producto-precio-con/sin`, `modal-producto-detalles`, `modal-producto-disclaimer`, `modal-producto-compartir`, `modal-producto-ficha`), no una versión con nombres de clase propios. El usuario pidió esto explícitamente tras rechazar una primera versión simplificada.

Se omiten a propósito las partes de administración del modal real que requieren el backend de Apps Script: actualizar/buscar/validar imagen, dar de baja/reactivar, gestionar relacionados, calculadora de rendimiento por producto, complementarios, badge de logo de fabricante.

Botón "Compartir" funcional: copia al portapapeles (nombre + precio + enlace), con el mismo estado visual `.copiado` en verde que el original. Se cierra con: botón X, tecla ESC, o clic en el fondo oscuro.

---

## OTRAS FUNCIONALIDADES YA IMPLEMENTADAS

- **Asistente de diagnóstico (wizard de 4 pasos):** acción → superficie → estado → resultado → solución. Si no hay una guía que encaje con confianza, lo dice honestamente en vez de inventar, y busca en el catálogo real con la combinación acción+superficie como consulta aproximada.
- **"Tengo un problema" (texto libre + 42 chips):** motor de diagnóstico por palabras clave; si no coincide con ninguna guía, busca en el catálogo real y propone productos, con enlace a "ver todos los resultados en el buscador" (`?q=`).
- **Buscador rápido dentro de "Explora soluciones":** filtra en vivo los ejemplos de las 10 áreas por texto (sin acentos), resalta coincidencias, oculta áreas sin resultado.
- **Exportar como lista de la compra:** 4 formas — 📄 PDF (usa la función "Imprimir" del navegador con hoja `@media print` dedicada), 📋 copiar al portapapeles, ⬇️ descargar `.txt`, 💬 WhatsApp (navega en la misma pestaña).
- **Calculadora de cantidad** (m² × manos ÷ rendimiento = litros), en 5 soluciones de pintura/barniz/epoxi.
- **Botón "volver arriba"** flotante (aparece tras 500px de scroll), en home y en detalle.
- **Scroll de anclas con offset del header:** el header es `position:sticky`, así que los saltos a `#ancla` compensan la altura real del menú.
- **Rejillas de tarjetas en pares de 2 en móvil** (`¿Qué quieres hacer?`, `¿Sobre qué?`, soluciones destacadas) — antes cada una caía en su propia línea porque el ancho fijo (160px/240px) más el hueco no cabía dos veces en el ancho real disponible en móvil.

---

## LECCIONES Y BUGS YA CORREGIDOS (no reintroducir)

1. **Rutas relativas rotas:** `soluciones/solucion.html` vive un nivel por debajo de la raíz — cualquier enlace a `buscador.html`, `assets/...` etc. escrito dentro de `solucion-detalle.js` o `soluciones/solucion.html` necesita el prefijo `../`. Ya causó 404 real dos veces: una en los enlaces a productos, y otra en el propio enlace "Buscador" del menú de navegación estático de `solucion.html` (`href="buscador.html"` en vez de `href="../buscador.html"`).
2. **Colisiones de palabra en buscadores de texto:** usar coincidencia por **palabra completa** (con límites de palabra), nunca `.includes()` a secas — ya mordió muchas veces: "sata" en "desatascador" (Apps Script histórico), "cola" en "descolado", "olor" en "incolora", "brillo"/"suelo"/"salon"/"jardin"/"mueble"/"pegamento" demasiado genéricos causando falsos positivos cruzados entre problemas distintos. Cada vez que se añade un chip/problema nuevo, comprobar con un test de "autodiagnóstico" (cada etiqueta de chip contra `diagnosticarPorTexto(etiqueta)` debe devolver su propio slug) para detectar colisiones nuevas.
3. **Nunca declarar una solución/coincidencia con falsa confianza:** si no hay un match razonable, decirlo honestamente en vez de caer en un fallback fijo que parece un acierto real (aplicado tanto al wizard como al texto libre).
4. **`.hero::before` (textura oscura del fondo animado) se pinta por encima del contenido si el contenedor no tiene `position:relative + z-index`** — y aun con eso, el contraste puede seguir dependiendo del color exacto del degradado en cada instante. La solución final que quedó fue una tarjeta con fondo oscuro casi opaco (`rgba(8,12,20,0.6)`), no solo z-index.
5. **CSS Grid/Flex con ancho FIJO puede no caber 2 elementos por fila en móvil** si el ancho de columna + gap supera el ancho real disponible del contenedor — cae en 1 por fila silenciosamente. En móvil usar ancho relativo (`calc(50% - Xpx)`) en vez de fijo para grids de N columnas.
6. **`window.open(url, '_blank')` para enlaces `wa.me` deja una pestaña en blanco** — usar `window.location.href`.
7. **El submenú móvil "Productos" (en `src/css/estilos.css`, compartido por todo el sitio) forzaba `visibility:visible` de forma incondicional para mostrarse siempre expandido bajo "Productos" cuando el menú móvil está abierto — pero esa regla se aplicaba TAMBIÉN con el menú cerrado**, dejando enlaces invisibles pero clicables ("fantasma") flotando sobre el contenido de cualquier página, interceptando toques a botones de más abajo. Corregido forzando la visibilidad solo dentro de `.navbar__nav.is-open`. Bug real, no relacionado con caché — si vuelve a reportarse algo parecido en móvil, revisar primero esto antes de asumir que es caché del navegador.
8. **Brandfetch (agregador de logos) prohíbe en sus términos el hotlinking/scraping** de sus imágenes fuera de su API oficial — no usar. Los logos de marca reales ya estaban como assets propios en `assets/proveedores/` (Titanlux se resolvió con el logo oficial en su propio dominio, `static.titanlux.es/web/logo.png`).
9. **Registrar listeners de clic dentro de una función que se re-ejecuta en cada tecleo** (ej. un filtro en vivo) acumula listeners duplicados — el delegado de clic debe registrarse una sola vez fuera de la función de renderizado repetido.
10. **Antes de escribir una solución nueva con productos de una marca/catálogo externo (Werku, TitanTech, etc.), comprobar primero que existen de verdad en `data/productos.json`** con `grep`/búsqueda por nombre de marca — ya ha compensado hacerlo siempre así (108 TitanTech confirmados reales antes de las últimas 3 soluciones), evita construir sobre productos inventados.

---

## PENDIENTE / ABIERTO

1. **Resolución de productos reales incompleta** en `pintar-plastico-coche`, `restaurar-mueble-madera`, `recuperar-brillo-carroceria` — decidir si reescribir esos `recommendedProducts` con nombres reales del catálogo, o aceptar el fallback de búsqueda por texto.
2. **`resolverProductoReal()` no busca en los catálogos de talleres/proveedores externos** (Zaphiro, Besa, Glasurit, Baslac) — afecta a `proteger-bajos-antigravilla` y `sellar-luna-parabrisas`, que usan nombres de esos catálogos pero nunca resolverán contra referencia real con el mecanismo actual.
3. **TitanPro y Titán general (titanpinturas.com)** no tienen todavía ningún enlace de carta de colores en ninguna solución.
4. **Sistema de gestión de soluciones vía Google Sheets** — evaluado y explícitamente aparcado por el usuario por ahora (preguntar de nuevo si ha cambiado de opinión).
5. **Áreas del catálogo real aún por explorar** si se pide seguir añadiendo soluciones: más gama TitanTech (esquemas de pavimentos por tipo de espacio, protección de tuberías por código de color UNE EN ISO 1063, sistemas R-M/URKI-SYSTEM de talleres — más orientado a profesionales), Werku (espátulas, mazas, cintas, escaleras — quedó ofrecido y no continuado), Camping (114 productos sin subfamilias, nunca revisado en detalle), Protección personal/EPIs (más transversal que una solución propia).
6. **Aviso de seguridad histórico sin resolver** (del contexto general del proyecto, no específico de Centro de Soluciones): token de GitHub expuesto en texto plano en `src/js/config-buscador.js`, carpeta `src/` probablemente un prototipo abandonado — pendiente confirmar si se usa y revocar el token.

---

## DEPLOYMENT

Todo el trabajo de esta sesión está en `main` (GitHub Pages / desarrollo). Commit más reciente de Claude: `0daeff0`. **Recordatorio permanente del proyecto: nunca desplegar a IONOS/`release` sin permiso explícito del usuario**, aunque `main` tenga cambios — el Centro de Soluciones sigue sin pasar a producción real todavía.

## FLUJO DE TRABAJO GIT USADO EN ESTA SESIÓN (repetir en la siguiente)

Como Devin también trabaja sobre el mismo repo en paralelo, y hay un workflow automático que commitea `data/productos.json` periódicamente, **siempre**:
1. `git fetch` + `git reset --hard origin/main` (o `git rebase origin/main` si hay cambios locales) **antes** de empezar a editar, para partir del estado más reciente.
2. Hacer los cambios, `git add`, `git commit` con mensaje descriptivo largo (explicando el porqué, no solo el qué — así lo ha pedido implícitamente el patrón de todo el proyecto).
3. `git rebase origin/main` otra vez **antes de subir** (por si algo cambió mientras se trabajaba).
4. `git push`.
5. Validar siempre con Playwright (copiar el repo completo a `/home/claude/test_site`, servidor HTTP local, tests de humo + regresión) antes de cada commit — nunca subir sin probar.
