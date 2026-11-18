ORENCIO MATAS Y HERMANOS, S.L.
Informe de Desarrollo Web · Confidencial
Av. Alfred Nobel, 2 · 13005 Ciudad Real · 926 221 217 · correo@orenciomatas.es

INFORME DE DESARROLLO WEB
FASE 5 — Espacio Creativo (suite de minijuegos), etiquetas de precio con QR, gestión de temporadas y consolidación del buscador
ORENCIO MATAS Y HERMANOS, S.L.

Continuación del informe de desarrollo Fase 4, cerrado el 14/10/2026. Este informe cubre el trabajo realizado desde entonces en el repositorio web-orencio-matas: el nuevo "Espacio Creativo" con una suite completa de minijuegos de marca, la nueva funcionalidad de etiquetas de precio físicas con código QR, la gestión de temporadas de producto desde el buscador, una revisión a fondo del acceso y las ventajas del perfil profesional, numerosas mejoras del buscador (rendimiento, diccionario de sinónimos y productos de temporada), la reestructuración del sitio con el buscador como página de inicio, la corrección de dos fallos críticos en la sincronización con el CRM, y la actualización continuada de imágenes de producto, con especial dedicación al área de perfumería y, en concreto, a las colonias.

Fecha de generación: 18/11/2026

1. LISTADO GENERAL DE TRABAJOS REALIZADOS — FASE 5

· Nuevo "Espacio Creativo": suite completa de minijuegos de marca (más de 15 juegos distintos) pensada para captar y entretener a clientes en tienda y en la web, con hub propio, pantalla completa, estadísticas de uso y llamadas a la acción hacia el Centro de Soluciones.
· Nueva funcionalidad de etiquetas de precio físicas: generación de etiquetas listas para imprimir con código de barras, QR a la ficha del producto, imagen del producto y tamaño de papel configurable, con impresión por lotes desde la Lista de la compra.
· Nueva gestión de temporadas de producto desde el buscador: creación y edición de temporadas, alta y exclusión masiva de productos, emoticono personalizable, folleto PDF propio y corrección de varios fallos de rendimiento y de guardado de datos.
· Reestructuración del sitio (Fase 3 interna): el buscador pasa a ser la página de inicio del sitio y se reorganiza el menú principal, eliminando duplicidades (Empresa, Servicios, Contacto).
· Unificación visual: pie de página igual en todas las páginas, botones y acentos antes en rojo pasan a azul corporativo (menos alarmista), precio del producto en negro salvo oferta activa, y texto "Volver a Catálogos" en los catálogos de área.
· Acceso profesional ágil directamente desde el buscador, sin salir de la página, con su distintivo visual y la indicación de "precio al por mayor" junto a cualquier precio mostrado a profesionales.
· Carrito / Lista de la compra: compra por cajas o unidades sueltas según el formato de envase del producto, avisos de variación de precio, estadísticas de uso, y folleto PDF propio también para la lista.
· Buscador: diccionario de sinónimos y abreviaturas ampliado en varias rondas con casos reales del catálogo, nuevo bloque "Productos de temporada", chips de filtros activos persistentes, y una ronda extensa de optimización de rendimiento (peticiones duplicadas, memorización de funciones de búsqueda, pintado por tandas).
· Corrección de dos fallos críticos en la sincronización de productos con el CRM: una marca de "sincronización en curso" que podía quedar bloqueada para siempre tras un corte por tiempo, y una comparación de fechas que inflaba artificialmente el contador de productos "actualizados" en cada sincronización.
· Refuerzo de la sincronización con el CRM: bloqueo contra ejecuciones solapadas, continuación en vez de reinicio si se corta por tiempo en listados grandes, y alerta inmediata solo para el responsable si falla un paso crítico.
· Icono de copiar al portapapeles junto a la referencia del producto en la ficha de detalle.
· Rendimiento del buscador: activación de compresión gzip en IONOS (el catálogo completo se descargaba sin comprimir) y eliminación de peticiones duplicadas en la carga inicial.
· Gestión de imágenes de producto: actualización, búsqueda y validación continuada de fotografías de producto, con especial dedicación al área de perfumería y, dentro de ella, a las colonias.
· Numerosos ajustes menores de SEO, anuncios/recursos (vídeos y PDFs externos), panel de administración y corrección de errores detectados en el uso real del sitio.

2. ESPACIO CREATIVO — SUITE DE MINIJUEGOS (NUEVA FUNCIONALIDAD)

Se ha diseñado y construido desde cero una suite de minijuegos de marca, pensada como herramienta de entretenimiento y captación tanto en la web como en pantallas de tienda, con enlaces contextuales hacia el Centro de Soluciones y el buscador de productos.

2.1 Catálogo de juegos

· El Pintor de Carrocería: juego de precisión con varios modelos de vehículo e ilustraciones vectoriales reales, con selector de vehículo y ranking de sesión.
· Pinta tu Estancia: juego de "colorear" estancias con ilustraciones profesionales, rodillo y brocha diferenciados, y más de 10 estancias disponibles.
· Mezcla de Colores: juego de mezcla con cambio de objetivo y tres niveles de dificultad.
· Quita la Mancha y Fuera Bichos: dos minijuegos de droguería (limpieza de manchas y control de plagas), con dificultad progresiva.
· Organiza el Almacén, Despacha el Pedido, Clasifica por Pasillos y Apila el Pedido: cuatro minijuegos de gestión/orden ambientados en el almacén y el punto de venta.
· Encuentra la Pareja: memoria de marcas con el logo de la empresa siempre presente entre las parejas.
· Atrapa la Fragancia y La Estela de Color: dos minijuegos ambientados en perfumería y pintura, con controles simples pensados para pantalla táctil.
· Salta y Reparte: plataformas con selector de avatar, objetos bonus, hitos de altura y cielo dinámico.
· Combina el Surtido (match-3) y Dobla el Almacén (estilo "2048"): dos minijuegos de puzzle con modo meta y productos dinámicos del catálogo real.
· A Toda Cinta, Ordena los Frascos y Comecocos de Droguería: tres minijuegos añadidos en las últimas rondas, el segundo con marcas reales de perfumería y pinturas representadas en cada nivel.

2.2 Experiencia y pulido

· Botón de pantalla completa en todos los juegos, con ajuste de tablero/zona/torre al tamaño real de la pantalla, corrección del comportamiento al girar el dispositivo y ocultación de la barra de direcciones en móvil.
· Botón de "compartir el juego" y de "cambiar de juego" desde la propia pantalla de resultado, disponibles en los más de 15 juegos de la suite.
· Guardado en el navegador del mejor resultado, la última partida y la fecha de cada juego, y ordenación del hub por frecuencia y por última vez jugada.
· CTA contextual hacia el Centro de Soluciones y la Exposición añadida en todos los juegos, y promoción de la sección completa a producción tras su validación.

2.3 Estadísticas de uso

Panel propio de estadísticas de Espacio Creativo (tiempo jugado y conversión hacia el buscador), con gráficas nativas integradas en el sitio sin depender de herramientas externas, backend compartido con el panel de administración y el mismo PIN de acceso, y filtro por rango de fechas.

3. ETIQUETAS DE PRECIO FÍSICAS CON QR (NUEVA FUNCIONALIDAD)

Nueva herramienta para generar etiquetas de precio listas para imprimir y colocar en tienda:

· Código QR que enlaza directamente a la ficha del producto en la web (siempre contra producción, aunque se genere desde preproducción).
· Tamaño de nombre, precio y texto libre configurable, e imagen del propio producto, con posición y tamaño ajustables sin tapar el precio ni el código de barras.
· Tamaño de papel estándar, márgenes, logo y QR configurables para adaptarse a distintas impresoras de tienda.
· Corrección de un fallo por el que la etiqueta mostraba el precio público (PVP) en lugar del precio al por mayor cuando correspondía.
· Impresión por lotes de varias etiquetas a la vez directamente desde la Lista de la compra, sin tener que generarlas una a una.

4. GESTIÓN DE TEMPORADAS DE PRODUCTO (NUEVA FUNCIONALIDAD)

Nueva sección dentro del buscador para crear y mantener "temporadas" de producto (Navidad, Verano, Vuelta al cole, etc.), cada una con su propio bloque destacado en la web.

4.1 Gestión desde la modal de administración

· Alta y exclusión masiva de productos por temporada, buscando por nombre, referencia, familia o subfamilia con los mismos criterios de diccionario de sinónimos que el buscador general, y seleccionando varios productos a la vez (o todos los resultados filtrados) en una sola operación, en vez de una petición por producto.
· Selector de emoticono con cobertura prácticamente completa (1.332 emojis agrupados por categoría) y buscador de emoticonos por texto, sustituyendo la introducción manual del emoji.
· Spinner de carga al entrar con el PIN recordado, y spinners también al reordenar temporadas y al quitar productos (individuales o excluidos), para que ninguna acción quede sin confirmación visual.
· Corrección de un fallo por el que reordenar una temporada perdía su emoticono, y de otro por el que se sobrescribían cambios hechos a mano en la hoja mientras la modal estaba abierta.
· Corrección de un problema grave de rendimiento: reordenar una temporada tardaba del orden de minutos; ahora solo se actualizan los dos elementos afectados por el cambio de orden, en paralelo, dejando la operación en el orden de uno o dos segundos.

4.2 Experiencia en el buscador

· Cada temporada vigente se muestra como su propio bloque independiente, con filtros, orden y destacados propios para ayudar a elegir, y enlace para compartir cada temporada por separado.
· Folleto PDF propio por temporada (y también a partir de una selección manual de productos), con precio sin IVA, familia, código QR y nueve productos por página.
· Ronda extensa de corrección del scroll dentro de la modal de "ver todos" de una temporada (quedaba bloqueado o "a trompicones" en catálogos grandes), resuelta repartiendo mejor el trabajo pesado de cálculo y memorizando las funciones de normalización y comparación de texto.

5. PERFIL PROFESIONAL

· Acceso profesional ágil directamente desde el propio buscador, sin necesidad de salir de la página, con corrección de un fallo por el que el botón no respondía al pulsarlo en móvil.
· Ajuste del ancho de la modal de introducción del código de acceso en vista de escritorio: se corrigió un problema de especificidad de estilos que la hacía ocupar casi toda la pantalla, fijándola finalmente en un ancho medio (460 px) tras una ronda de ajuste con el cliente.
· Distintivo visual propio para el perfil profesional, con un efecto de "gota" animado sobre el logotipo (con los colores reales de la marca) extendido a todas las páginas del sitio.
· Indicación de "Precio al por mayor" junto a cualquier precio mostrado a un usuario con sesión profesional activa, incluyendo destacados, escaparates, folletos PDF y etiquetas de precio físicas.
· Revalidación de la sesión profesional al volver a una pestaña ya abierta, y reintento automático de la confirmación del precio al por mayor si la primera petición en vivo falla, evitando mostrar el precio incorrecto por un fallo puntual de red.
· Formulario de contacto añadido a la propia página de acceso profesional.

6. BUSCADOR DE PRODUCTOS

6.1 Diccionario y resultados

· Varias rondas de ampliación del diccionario de sinónimos y abreviaturas con casos reales detectados en el catálogo (por ejemplo, "EST." para estuche, o "edc" para encontrar también productos de colonia), además de un fallback de resultados aproximados cuando una búsqueda no encuentra coincidencia exacta.
· Nuevo bloque "Productos de temporada", que prioriza los resultados según la época del año.
· Chips de filtros activos con persistencia durante la sesión y pintado por tandas para no bloquear la interfaz con catálogos grandes.

6.2 Rendimiento

· Activación de compresión gzip en el servidor de IONOS: el catálogo completo (productos.json) se estaba descargando sin comprimir, pesando 4,4 MB en cada visita.
· Eliminación de peticiones duplicadas en la carga inicial del buscador y en los bloques de Destacados y Campañas de escaparate.
· Memorización de las funciones de normalización de texto y de comparación aproximada (Levenshtein), y aplazamiento de los bloques menos prioritarios ("Más buscados", "Marcas más buscadas") a un hueco libre del navegador, tras detectar e investigar a fondo una ronda de lentitud general del buscador.

7. REESTRUCTURACIÓN DEL SITIO Y UNIFICACIÓN VISUAL

· El buscador pasa a ser la página de inicio del sitio, con el menú reorganizado: se elimina la duplicidad de "Empresa" y se mueve "Servicios" dentro de ella, se renombra el enlace "Buscador" a "Productos", y se quita el enlace "Contacto" duplicado del menú (sustituido por el botón "CONTACTAR").
· Pie de página unificado en todas las páginas del sitio (antes variaba entre secciones), con la dirección y el horario de contacto rápido en columnas propias.
· Estandarización de color: los botones y acentos que quedaban en rojo (percibido como alarmista) pasan a azul corporativo en todo el sitio.
· El precio del producto se muestra en negro por defecto, y solo en rojo cuando hay una oferta o descuento activo.
· En los catálogos de área, el texto "Volver a Productos" pasa a "Volver a Catálogos" para reflejar mejor dónde lleva el enlace.

8. SINCRONIZACIÓN CON EL CRM

8.1 Dos fallos críticos corregidos

Tras una sincronización real que informó de "0 productos nuevos, 0 actualizados" sobre más de 7.000 productos leídos —resultado que generó sospecha fundada por parte del cliente—, se realizó una revisión completa del flujo de sincronización contrastando el Excel real recibido del CRM contra el catálogo publicado. Se confirmaron y corrigieron dos fallos independientes, verificados cada uno con pruebas aisladas antes de aplicarlos:

· La marca que detecta si una sincronización anterior se cortó por el límite de tiempo de ejecución podía quedar activada para siempre si esa sincronización se interrumpía sin pasar por su gestión de errores; como el CRM reutiliza el mismo asunto de correo cada día (y Gmail agrupa esos correos en una misma conversación), un correo genuinamente nuevo de un día posterior se trataba por error como la continuación de un intento ya cortado, saltándose por completo la recarga del Excel. Se añadió una caducidad de 3 horas a esa marca para que esto ya no pueda volver a bloquear una sincronización futura.
· La fecha de alta del producto se recibe del Excel como una fecha real, pero se comparaba sin formatear contra el texto guardado en la hoja, por lo que nunca coincidía aunque fuera la misma fecha; esto forzaba un "cambio" en prácticamente todos los productos de cada sincronización, inflando artificialmente el contador de "Actualizados". Se corrigió formateando la fecha del Excel antes de compararla, y además se dejó de contar como "actualizado" un producto cuando en realidad no tenía ningún cambio real (se añadió un nuevo contador "Sin cambios" para esos casos).

Ambas correcciones se probaron en pruebas de sincronización real solicitadas por el cliente tras aplicarlas, confirmando resultados coherentes (incluida la correcta continuación de una sincronización cortada por el límite de 6 minutos de Apps Script).

8.2 Refuerzo general

· Bloqueo contra ejecuciones solapadas de la sincronización y aislamiento del disparo de la generación de catálogos, para que un fallo en una parte no afecte a la otra.
· La sincronización ya no se reinicia desde el principio si se corta por tiempo en listados grandes: continúa desde donde se quedó.
· Alerta inmediata y exclusiva para el responsable de la web si falla un paso crítico de la sincronización, además del correo de resultado habitual.
· Corrección de que la sincronización manual de productos no actualizaba la fecha de última sincronización del CRM, y de un fallo de publicación por conflicto binario al generar catálogos.

9. GESTIÓN DE IMÁGENES DE PRODUCTO

Continuación del registro, búsqueda y validación de imágenes de producto, con el apoyo de las herramientas ya existentes de imagenes_tool/ y del asistente de imágenes integrado en el panel de administración (que en esta fase unificó en una sola modal la búsqueda y la actualización de imagen desde la propia vista de detalle del producto). Dentro de esta tarea continua, se ha dedicado un bloque específico de 4 horas a revisar y actualizar imágenes del área de perfumería, haciendo especial hincapié en la familia de colonias, dada su rotación comercial y la frecuencia con la que llegan referencias nuevas o reenvasadas desde el CRM.

10. OTRAS MEJORAS

· Carrito / Lista de la compra: compra por cajas o paquetes según el formato de envase del producto (con selector de sueltas/cajas siempre disponible), avisos de precio por unidades y de variación de precio, y estadísticas de uso, exportaciones y compartidos.
· Ficha de detalle de producto: icono de copiar al portapapeles junto a la referencia, spinner mientras carga la fotografía, y corrección de dos fallos (la imagen no cargaba correctamente y, al abrir una ficha tras otra, se veía durante un instante la foto del producto anterior).
· Anuncios/recursos: nuevo tipo de recurso "vídeo" (YouTube, TikTok, Instagram), vista previa en el visor para PDFs externos, y bloqueo de "Ver" para un PDF externo servido por http:// (contenido mixto) en una web ya servida por https.
· SEO: eliminación de referencias al dominio de preproducción en los correos HTML, medición de acceso profesional, meta descripciones de catálogos y datos estructurados de tipo BreadcrumbList; exportación del campo "marca" del Sheet como "fabricante" en el catálogo publicado.
· Fix urgente de redirección HTTP → HTTPS en IONOS, y de imágenes rotas en productos con marca (fabricante) tras un cambio de formato del catálogo.
· Panel de administración: alta de "deshabilitar/habilitar producto en el catálogo" sin tener que borrarlo, y edición de subfamilia disponible también en preproducción.

11. DESGLOSE DE HORAS — FASE 5

Epica / Tarea                                                     | Horas
-------------------------------------------------------------------|------
Espacio Creativo: suite de minijuegos, hub y estadísticas de uso    | 9 h
Buscador: diccionario de sinónimos, productos de temporada y rendimiento | 2 h
Gestión de temporadas de producto (modal, folleto PDF y rendimiento) | 5 h
Perfil profesional: acceso ágil, distintivo y precio al por mayor   | 11 h
Sincronización con el CRM: corrección de fallos críticos y refuerzo | 2 h
Reestructuración del sitio y unificación visual                      | 7 h
Etiquetas de precio físicas con código QR (nueva funcionalidad)      | 4 h
Carrito / Lista de la compra: formatos, estadísticas y folleto       | 4 h
Gestión de imágenes de producto (perfumería, especial atención a colonias) | 3 h
Otras mejoras (SEO, anuncios/recursos, ficha de producto, panel)     | 2 h
-------------------------------------------------------------------|------
TOTAL                                                                 | 49 h

12. OBSERVACIONES Y ESTADO ACTUAL

· El Espacio Creativo está en producción con toda su suite de minijuegos, hub propio y estadísticas de uso operativas.
· Las etiquetas de precio físicas con QR están operativas y pueden imprimirse en lote desde la Lista de la compra.
· La gestión de temporadas de producto está operativa, con rendimiento corregido y spinners en todas las acciones que lo necesitaban.
· El buscador es ya la página de inicio del sitio, con el menú y el pie de página unificados en todas las páginas.
· Los dos fallos críticos detectados en la sincronización con el CRM están corregidos y verificados con pruebas de sincronización real; queda, sin acción prevista por el momento, un caso aislado de calidad de datos del CRM (una referencia de BARBIE con y sin cero delante) que el cliente ha decidido descartar conscientemente.
· El registro y validación de imágenes de producto sigue en curso, con especial dedicación reciente al área de perfumería y, dentro de ella, a las colonias.
· Todos los cambios de esta fase están desplegados en producción (IONOS) tras su validación en preproducción.

ORENCIO MATAS Y HERMANOS, S.L.
Av. Alfred Nobel, 2 · 13005 Ciudad Real · 926 221 217 · correo@orenciomatas.es
