# Contexto del proyecto — orenciomatas.es (actualizado 02/09/2026)

Soy Eloy (GitHub: `eloyleon23`), desarrollador web del proyecto orenciomatas.es — la web corporativa de Orencio Matas y Hermanos, S.L. (Ciudad Real, España). Accedo habitualmente con un iPhone con Chrome (WebKit).

Este documento es continuación de una sesión larga centrada en el **buscador de productos** (`buscador.html`) y el **Centro de Soluciones**. Para el contexto general más antiguo del proyecto (arquitectura completa, Apps Script, catálogos PDF, sistema de relacionados) ver `contexto_proyecto_om_20082026.md`. Para el estado del Centro de Soluciones a fecha 23/08 (antes de esta sesión) ver `contexto_centro_soluciones_23082026.md`. Este documento nuevo cubre solo lo trabajado **desde entonces**.

**Nota de seguridad**: este documento NO contiene tokens, claves de API ni contraseñas a propósito. El token de GitHub se pide de nuevo al usuario al empezar el chat siguiente; no se persiste en ningún archivo del repo. Sigue pendiente el aviso de seguridad histórico: token expuesto en `src/js/config-buscador.js` (prototipo antiguo probablemente sin usar) — no abordado en esta sesión.

---

## REPOSITORIO

- **Repo:** github.com/eloyleon23/web-orencio-matas (público), rama `main`
- **Deploy desarrollo:** GitHub Pages, automático
- **Deploy producción:** IONOS por SFTP (rama `release`), manual — **nunca desplegar sin permiso explícito del usuario**, aunque `main` tenga cambios
- Commit más reciente de esta sesión: `192844b`

---

## RESUMEN DE LO TRABAJADO EN ESTA SESIÓN

### 1. Buscador (`buscador.html`) — varios bugs reales encontrados y corregidos

**Deduplicación de referencias duplicadas** (commit `4ad3745`): si dos filas del Sheet compartían referencia y se fusionaban, el JSON estático (cacheado, desactualizado) podía seguir mostrando ambas como si fueran productos distintos. Añadida una pasada de deduplicación tras la reconciliación con la fuente en vivo.

**Ancho responsive en pantallas grandes** (commit `90ae994`): el buscador se quedaba fijo a 1180px de ancho máximo, dejando mucho margen sin usar en monitores grandes. Cambiado a `min(96vw, 1760px)` con más columnas en el grid de productos según el ancho disponible (4→5→6 columnas).

**Bug real — productos NUEVOS nunca aparecían** (commit `da8bb1e`): la reconciliación con la fuente en vivo (`reconciliarConTextoEnVivo`) solo *actualizaba* productos que ya estaban cargados desde el JSON estático — nunca *añadía* productos completamente nuevos que no existieran ya en la carga inicial. Un producto recién sincronizado desde el CRM podía no aparecer nunca en el buscador aunque la caché en vivo ya lo tuviera correcto, porque cerrar/reabrir el navegador no vacía la caché HTTP de disco. Corregido añadiendo esos productos nuevos a `TODOS` y reconstruyendo el índice de sugerencias.

**Bug real — búsqueda de códigos cortos** (commit `f9082ce`): buscar `p60` o `p-60` no encontraba nada, ni `pxb-730`. Causas combinadas: (a) las palabras de 3 caracteres o menos no tenían tolerancia difusa (para evitar falsos positivos), así que un guion en medio del código bloqueaba la coincidencia; (b) sin ese guion, el propio texto sí incluía el código pero de forma literal. Añadida una comparación adicional que ignora guiones/puntos/espacios, con protección para que la coincidencia no quede "pegada" a otro dígito (evita que "p60" encuentre "hp600" de un código totalmente distinto). Mismo arreglo aplicado también al Centro de Soluciones.

**Ficha técnica de fabricante para productos Werku** (commit `192844b`): los productos Werku (herramientas) del catálogo real nunca mostraban botón de ficha técnica — caían en familias excluidas (brochas, lijas) o en droguería. Añadida una tabla de fichas técnicas verificadas a mano (ver sección Werku más abajo) y una función que extrae el código WK del nombre real del producto (SÍ aparece explícito en los nombres del Sheet, a diferencia de las descripciones de las soluciones) y muestra el botón si está en la lista.

### 2. Centro de Soluciones — buscador mucho más fino

**Unificación de los dos buscadores de texto + red de seguridad al catálogo real** (commit `a05dd0e`): había dos buscadores de texto con comportamiento muy distinto en la misma página — el del hero (arriba, coincidencia literal en título/descripción) y "¿Tienes un problema?" (usa el mapa curado de sinónimos, `diagnosticarPorTexto`). Buscar "cloro" no encontraba nada en el del hero pese a existir una guía de piscinas relacionada. Nueva función `buscarSolucionesCombinado()` que combina ambos motores; si ninguno encuentra nada, cae automáticamente al catálogo real de productos (mismo mecanismo que ya usaba "¿Tienes un problema?") en vez de mostrar un mensaje de "no encontrado".

**Búsqueda por código de producto + ficha técnica directa** (commit `f9082ce`, mismo que el punto del buscador): `palabrasSignificativas()` ahora permite tokens cortos si combinan letra+dígito. `buscarSolucionesPorTexto()` ahora también busca dentro de los nombres de `recommendedProducts` de cada guía, no solo en título/descripción. Nueva función `buscarFichaTecnicaPorTexto()`: reconoce "ficha técnica X", "ficha de X", o directamente el código X, y devuelve el enlace directo al PDF del fabricante si existe en el índice — el buscador del hero muestra esto en un bloque destacado con botón "Abrir PDF →", además de (no en vez de) las guías relacionadas que puedan encontrarse.

**Nueva guía: igualar el color de un mueble de madera nuevo** (commit `52c670f`): `igualar-color-madera-barniz` — caso real de un cliente que necesitaba que una silla nueva quedara del mismo color que el resto de su mobiliario. 5 pasos (lijado → sellado de poro con tapaporos → elegir línea de barniz → prueba en zona oculta → barnizado en manos finas), con **dos cartas de colores** (Barniz Titanlux sintético y Barniz Titan Eco al agua) — esto obligó a extender el modelo de datos, que solo soportaba una carta de colores por solución (campo nuevo opcional `colorCharts`, array, sin tocar las 15 soluciones existentes que usan el campo singular `colorChart`). De paso se encontró y corrigió un bug real heredado (no introducido en esta sesión): el `onerror` inline del logo de la carta de colores tenía comillas mal escapadas y rompía con "missing ) after argument list" en cualquier solución, no solo la nueva — corregido con una función compartida `window.cargarFallbackColorChart()`.

**Fichas técnicas de fabricante — TitanTech/TitanPro** (commit `d8ce818`): nuevo campo opcional `fichaTecnica` en `recommendedProducts`, con botón nuevo en el modal de producto ("📋 Ver ficha técnica del fabricante", distinto del ya existente "Ver ficha completa en el buscador"). Verificados navegando titantech.es/titanpro.es (no adivinados por patrón): **13 productos TitanTech/TitanPro** con ficha técnica en 8 soluciones (`suelo-epoxi-garaje`, `proteger-estructura-metalica-corrosion`, `proteger-estructura-acero-fuego`, `lacado-profesional-muebles`, `pintar-pared-interior`, `pintar-fachada-exterior`, `pintar-placas-pladur-yeso-laminado`, `eliminar-moho-pared-antes-pintar`, `cuanto-producto-necesito`). 9 de los 13 llevan el PDF directo real; los 3 de TitanPro (P-40, R-40, S-60) enlazan a la página del producto en vez del PDF porque esa web lo carga dinámicamente tras elegir color.

**Fichas técnicas — Werku** (commit `192844b`, ver también sección Werku): 4 productos confirmados de 8 usados en las soluciones de pistolas/lijadoras (`elegir-pistola-pintar`, `elegir-lijadora-superficie`).

**Pendiente sin resolver, encontrado durante la revisión de TitanTech**: hay otros ~19 productos con "Titan" en el nombre en el resto de soluciones del sitio, pero son **Titanlux/Titan decoración** (línea doméstica, web `titanlux.es`) — una marca y un sitio distintos de TitanTech/TitanPro, fuera del alcance de lo que pidió el usuario. Documentados pero no tocados.

---

## PRODUCTOS WERKU — DETALLE PARA CONTINUAR

Verificados navegando werku.com uno a uno (no por patrón — la ruta del PDF varía según cuándo se subió cada documento):

| Código | Producto | Ficha técnica |
|---|---|---|
| WK500470 | Pistola Gravedad 1.5HP-600ml (maletín) | `https://www.werku.com/wp-content/uploads/2022/05/WK500470_Techical_File_ESP.pdf` (nótese "Techical", typo real del propio Werku, no mío) |
| WK500600 | Pistola Airless 1/4"-250 bar | `https://www.werku.com/wp-content/uploads/2022/05/WK500600_Technical_File_ESP.pdf` |
| WK401200 | Pistola Pintar Succión HVLP-I 500W | `https://www.werku.com/Technical_File_ESP/WK401200_Technical_File_ESP.pdf` |
| WK400750 | Lijadora Circular Rotorbital 150mm | `https://www.werku.com/Technical_File_ESP/WK400750_Technical_File_ESP.pdf` |

Esta misma tabla vive **duplicada en dos sitios** (a propósito, son mecanismos distintos):
- `assets/js/soluciones-data.js`: campo `fichaTecnica` en las entradas de `recommendedProducts` de las soluciones.
- `buscador.html`: constante `FICHAS_TECNICAS_WERKU` (objeto JS, busca con `function fichaTecnicaWerku(p)` un patrón `/WK\d{6}/i` en el nombre real del producto del Sheet).

**No encontrados pese a búsqueda extensa** (posible tarea para continuar si el usuario quiere insistir, o si consigue el dato directamente del proveedor):
- Amoladora Werku 115-125mm 900W (código de referencia probable `WK400900`, aparece en muchos revendedores pero sin página localizable en werku.com — puede que esté descatalogada y retirada del sitio, o en una página de "Descatalogados" más allá de la primera que se revisó).
- Los 3 discos de lija abrasivos de grano 060/080/120 (225mm) — parecen venderse solo como accesorio incluido con las lijadoras "jirafa" circulares, sin ficha técnica propia como producto independiente en werku.com.

Estos 4 productos siguen sin botón de ficha técnica en ambos sitios (comportamiento normal de "no tiene ficha", no un error).

---

## LECCIONES Y PRINCIPIOS NUEVOS DE ESTA SESIÓN

- **Hay DOS cachés independientes en el buscador**: el JSON estático del repo (`data/productos.json`, regenerado por un workflow de GitHub con su propio horario) y la caché en vivo de Apps Script/Drive (regenerada al instante desde el menú o tras acciones del buscador). Si un producto no aparece recién sincronizado, puede ser solo cuestión de que el workflow de GitHub aún no se ha ejecutado — pero si el problema es que nunca llega a aparecer *en absoluto* pase el tiempo que pase, es la reconciliación en el propio JS la que puede tener un bug (como el corregido en `da8bb1e`).
- **Cerrar y reabrir el navegador NO vacía la caché HTTP de disco** — solo el modo incógnito o un borrado explícito lo hace. Relevante para diagnosticar "no veo el cambio aunque he refrescado".
- **La tolerancia difusa (Levenshtein) está desactivada a propósito para palabras de 3 caracteres o menos**, para evitar falsos positivos — pero eso bloqueaba también códigos de producto cortos y legítimos como "p60". La solución no fue relajar esa tolerancia (arriesgado) sino añadir una comparación aparte que ignora separadores, con protección adicional para no "morder" el principio de un número más largo de otro producto.
- **Al añadir un mecanismo de coincidencia de subcadena para códigos cortos, comprobar siempre que la coincidencia no quede pegada a otro dígito** — patrón de bug que ya ha aparecido dos veces en esta sesión (una vez con "60" suelto de "p-60" coincidiendo con "r-60"; otra con "p60" encontrado dentro de "hp600" de un producto totalmente distinto).
- **Antes de asociar una ficha técnica de fabricante a un producto, verificar navegando la página real del fabricante, nunca adivinar por patrón de URL** — confirmado con TitanTech (patrón muy consistente, pero aun así se verificó cada uno) y sobre todo con Werku (la ruta del PDF cambia según cuándo se subió cada documento, no hay fórmula fiable).
- **Los nombres de producto en el Sheet real y en las descripciones "mock" de las soluciones no siempre coinciden en cómo incluyen el código de fabricante** — los productos Werku del Sheet SÍ llevan el código WK explícito en el nombre; las descripciones de las soluciones a veces no. Esto obligó a dos mecanismos de lookup distintos (campo directo en datos vs. extracción por regex del nombre real).

---

## PENDIENTES ACTIVOS

1. **Amoladora Werku 900W y los 3 discos de lija** sin ficha técnica localizada — retomar si el usuario consigue el dato directo del proveedor, o si se quiere insistir en la búsqueda.
2. **~19 productos Titanlux/Titan decoración** en otras soluciones del Centro de Soluciones sin ficha técnica — fuera del alcance pedido (era específicamente TitanTech/TitanPro), pero documentado por si se quiere abordar como fase aparte, con su propio proceso de búsqueda en titanlux.es.
3. **Aviso de seguridad histórico sin resolver**: token de GitHub expuesto en `src/js/config-buscador.js`, prototipo antiguo probablemente sin usar — pendiente confirmar si se usa y revocar el token.
4. Todo lo demás pendiente ya documentado en `contexto_proyecto_om_20082026.md` y `contexto_centro_soluciones_23082026.md` sigue igual (relacionados, clasificación de área/subfamilia, etc.) salvo que se indique lo contrario.

---

## FLUJO DE TRABAJO GIT (repetir en la siguiente sesión)

Como el workflow automático de GitHub Actions commitea `data/productos.json` periódicamente y puede haber cambios en paralelo:

1. `git fetch` + `git reset --hard origin/main` (o `git rebase origin/main` si hay cambios locales sin subir) **antes** de empezar a editar.
2. Hacer los cambios, `git add`, `git commit` con mensaje descriptivo largo explicando el porqué, no solo el qué.
3. `git rebase origin/main` otra vez **antes de subir** (por si algo cambió mientras se trabajaba).
4. `git push`.
5. Validar con `node --check` en los archivos JS tocados, y con Playwright (servidor HTTP local + capturas/consultas reales) antes de cada commit — nunca subir sin probar.
6. Pedir el token de GitHub de nuevo al usuario al empezar — no se persiste entre sesiones. Enmascarar el token en toda salida de terminal visible al usuario.

**Recordatorio permanente del proyecto**: nunca desplegar a IONOS/`release` sin permiso explícito del usuario, aunque `main` tenga cambios.
