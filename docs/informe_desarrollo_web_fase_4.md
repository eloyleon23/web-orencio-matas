ORENCIO MATAS Y HERMANOS, S.L.
Informe de Desarrollo Web · Confidencial
Av. Alfred Nobel, 2 · 13005 Ciudad Real · 926 221 217 · correo@orenciomatas.es

INFORME DE DESARROLLO WEB
FASE 4 — Lista de la compra, Escaparate digital, analítica del Centro de Soluciones y copia de imágenes para OneDrive
ORENCIO MATAS Y HERMANOS, S.L.

Continuación del informe de desarrollo Fase 3, cerrado el 23/08/2026. Este informe cubre el trabajo realizado desde entonces en el repositorio web-orencio-matas: la publicación en producción del sitio en IONOS, la nueva funcionalidad "Lista de la compra", el folleto digital compartible de Escaparate, la capa de analítica y feedback del Centro de Soluciones, numerosas mejoras del buscador, y el nuevo flujo de copia de imágenes de producto hacia OneDrive para que estén disponibles en las tablets de los comerciales.

Fecha de generación: 14/10/2026

1. LISTADO GENERAL DE TRABAJOS REALIZADOS — FASE 4

· Publicación en producción del sitio en el servidor de IONOS (orenciomatas.es): flag central de preproducción/producción, panel y herramientas de administración excluidos del DOM en producción, y modo mantenimiento propio para páginas nuevas.
· Nueva funcionalidad "Lista de la compra": selección de productos, unidades por producto, exportación a PDF con precios, y compartir por WhatsApp o correo.
· Avisos de validez de la lista de la compra a los 5, 10 y 14 días, que permanecen visibles hasta que el usuario los acepta explícitamente (no basta con verlos y recargar).
· Nuevo folleto digital de Escaparate: generación de PDF compartible con la foto del propio escaparate, rejilla de productos y descuentos, ajustado tras varias rondas de prueba real.
· Centro de Soluciones: cuatro fases de analítica de aprendizaje (búsquedas, vistas agregadas, módulo "Novedades"/"Más buscados", eventos de interacción con filtros y vista de producto).
· Centro de Soluciones: modal de feedback proactiva, promoción automática de consultas repetidas de IA a guías fijas (evitando duplicados), y control de cuota de la IA (Gemini) para no bloquear el servicio cuando se agota.
· Centro de Soluciones: corrección de datos de varias guías de madera frente a ficha técnica real, eliminando productos y afirmaciones no verificadas.
· Buscador: bloques de descubrimiento (Novedades, Más buscados, Marcas más buscadas) con rotación en vivo, filtros por fecha de alta, ordenación múltiple, selector de área multi-selección, y numerosas correcciones de "Limpiar filtros" en móvil.
· Gestión de imágenes de producto: continuación del registro, validación y corrección de imágenes de productos actuales y nuevos — tarea sostenida a lo largo de toda la fase (ver sección 4).
· Nuevo flujo en Apps Script para generar copias en zip de las imágenes de productos validados, con enlaces de descarga para que el administrador del CRM las suba a OneDrive — origen real de las imágenes que ven los comerciales en sus tablets.
· SEO y Google Analytics: cierre de huecos de indexación y tracking en todo el sitio, banner propio para Open Graph.
· Página de Servicios: bloque de proveedores principales con enlaces reales a sus webs oficiales.
· Ajustes técnicos: navbar en portátiles de 15", tooltips de nombre de producto, corrección de productos duplicados, y campo de ficha técnica en el panel de administración.

2. DESPLIEGUE EN PRODUCCIÓN (IONOS)

El sitio se ha publicado en el servidor de IONOS bajo el dominio orenciomatas.es. Se introdujo un único flag central (OM_PREPRODUCCION) que controla toda la administración visible: en preproducción se mantienen activas las herramientas de gestión para seguir trabajando con comodidad, y al preparar cada release ese mismo flag las desactiva automáticamente. En producción, los botones y modales de administración se eliminan del DOM (no solo se ocultan con CSS), y se retira el precio mayorista de los datos cargados en memoria del navegador. Se añadió además un modo mantenimiento propio, con el estilo real del sitio, para las páginas nuevas mientras se completa su contenido.

3. LISTA DE LA COMPRA (NUEVA FUNCIONALIDAD)

3.1 Funcionalidad base

· Añadir productos a una lista personal desde el buscador, con unidades por producto (1 a 10).
· Límite ampliado de 20 a 24 productos por lista.
· Exportación a PDF con cabecera de empresa, columnas de unidades, precio unitario (con y sin IVA) y subtotal.
· Compartir la lista por WhatsApp o por correo electrónico.
· Validación de que los productos de la lista siguen activos en el catálogo.

3.2 Aviso de validez — persistente hasta aceptarlo

La lista tiene una validez limitada en el tiempo. Se muestran avisos a los 5, 10 y 14 días de creada. Tras detectar que el aviso solo se disparaba una vez al cargar el script y podía no llegar a verse si el usuario no tenía la pestaña abierta en ese momento exacto, se añadió una comprobación también al cambiar de pestaña y al volver a la página (eventos visibilitychange y pageshow), de modo que el aviso aparece en cuanto corresponde, haya pasado el tiempo que haya pasado con la pestaña en segundo plano.

Además, el aviso solo se considera "visto" si el usuario pulsa explícitamente "Ver mi lista" — cerrarlo con la X, con "Ahora no", haciendo clic fuera o con la tecla Escape se trata como un aplazamiento: el aviso debe volver a aparecer en la siguiente comprobación (recarga, cambio de pestaña), hasta que se acepte explícitamente o la lista caduque. Así se garantiza que el usuario no pueda perder de vista, sin querer, que su lista tiene fecha de caducidad.

4. GESTIÓN DE IMÁGENES DE PRODUCTO

4.1 Registro y validación continua

El trabajo de registro, búsqueda, corrección y validación de imágenes de productos actuales y nuevos se ha mantenido activo durante toda la Fase 4, con el apoyo de las herramientas de imagenes_tool/ (búsqueda por API gratuitas, por código de barras, por descripción, y generación de vistas HTML de revisión) y del asistente de imágenes integrado en el panel de administración, al que se le añadió la búsqueda también por referencia y la corrección de un fallo por el que repetía productos ya actualizados. Esta tarea ha supuesto, hasta la fecha de este informe, un mínimo de 10 horas dedicadas específicamente a actualizar y validar imágenes de producto, al margen del resto de desarrollo de la fase.

4.2 Copia de imágenes validadas para OneDrive (nuevo)

Se ha diseñado e implementado en Apps Script un flujo para que el administrador del CRM pueda disponer, en OneDrive, de una copia de las imágenes de los productos ya validados — origen real desde el que las tablets de los comerciales consumen las imágenes de producto en el día a día.

· Por cada producto validado se genera, dentro de un único archivo comprimido, un directorio con el nombre de su referencia y la imagen correspondiente dentro.
· El proceso es incremental: solo se procesan productos cuya imagen se ha validado después de la última vez que se generó la copia; puede relanzarse para reprocesar todo desde cero si así se indica.
· No consume espacio permanente de Google Drive: los comprimidos se generan en memoria a partir de las imágenes ya existentes, sin copias ni carpetas temporales — el único archivo que queda es el propio enlace de descarga.
· Si el volumen de imágenes supera el tamaño máximo admitido para un único archivo, se generan automáticamente varios enlaces, todos reunidos en un único correo.
· Se registra la fecha de sincronización por producto (nueva columna en la hoja de Productos) y cualquier imagen que no se haya podido incluir, sin afectar a ningún otro dato existente.
· Lanzable desde el panel de administración, con un modo de evaluación por número de imágenes y de lotes antes de ejecutar el proceso completo.
· Tras las primeras ejecuciones reales se corrigieron tres problemas: el límite de 6 minutos de ejecución de Apps Script (el proceso ahora se detiene de forma ordenada y se puede relanzar sin perder ni repetir trabajo), una conversión automática de fechas de Google Sheets que impedía que el recuento de pendientes avanzara, y lotes que superaban el tamaño máximo de archivo permitido (ahora se dividen también por tamaño, no solo por número de imágenes).

5. CENTRO DE SOLUCIONES

5.1 Analítica de aprendizaje (Fases 1 a 4)

· Fase 1: esquema de analítica en Supabase e ingesta mínima de búsquedas desde el buscador.
· Fase 2: vistas agregadas, módulo de "Más buscados" y detección de oportunidades de catálogo (búsquedas sin resultado).
· Fase 3: módulo "Novedades" y resumen numérico en el panel de administración.
· Fase 4: registro de eventos de interacción real — aplicación de filtros y visualización de producto —, además de vistas de análisis y un panel interno de seguimiento.

5.2 Calidad del contenido y de la IA

· Corrección de varias guías de madera con datos y productos no verificados, sustituidos por información contrastada contra ficha técnica real.
· Promoción automática de consultas repetidas de usuarios a la IA como guías fijas, evitando crear guías duplicadas.
· La IA deja de dispararse automáticamente al realizar una búsqueda; solo se ofrece cuando tiene sentido y hay cuota disponible, evitando bloquear el servicio cuando Gemini agota su cuota diaria.
· Modal de feedback proactiva y recogida de feedback también en las guías estructuradas (no solo en las generadas dinámicamente).

5.3 Ajustes de experiencia

· Selector de marca, tecnología y acabado en guías de madera, con aviso de compatibilidad.
· Corrección de solapes en móvil entre "Gestionar soluciones" y el botón de volver arriba.
· Resolución de productos del Centro de Soluciones por referencia, sin necesidad de descargar el catálogo completo.

6. ESCAPARATE — FOLLETO DIGITAL (NUEVO)

Prueba de concepto llevada a producción: generación de un folleto en PDF a partir de un escaparate de campaña, con la foto propia del escaparate en cabecera, rejilla de productos con su descuento, y botón de compartir. Tras varias rondas de prueba con folletos reales se ajustaron: el recorte de producto en fotos de proporción muy distinta a la tarjeta, la referencia que se salía de la tarjeta con descuento, el fondo estacional (hojas de otoño con forma real, no burbujas ni puntas redondeadas), el progreso granular mostrado en el propio botón de generación, y el rediseño de la rejilla tras el primer uso real.

7. BUSCADOR DE PRODUCTOS

7.1 Bloques de descubrimiento

Evolución continua de los bloques "Novedades", "Más buscados" y "Marcas más buscadas": rotación en vivo con fundido, pintado instantáneo sin esperar a Apps Script, iconografía más comercial, exclusión de productos de talleres en Novedades, corrección de imágenes desactualizadas, y ocultación mientras haya un filtro activo para no distraer de los resultados.

7.2 Filtros y ordenación

· Selector de área a multi-selección (todas activas por defecto) y filtro de rango de fechas de alta.
· Ordenación por fecha de alta, por precio y por área+familia.
· Numerosas correcciones de "Limpiar filtros" en móvil: no limpiaba Familia/Fabricante/atributos de Taller, no se reabría correctamente, un toque accidental de iOS lo disparaba solo, y por fin cierra también el panel.
· Corrección de un desbordamiento en Safari/WebKit al calcular fechas con catálogos grandes.

7.3 Otros ajustes

· Tooltip con el nombre completo del producto, extendido también a "Seguir comprando".
· Corrección de productos duplicados dentro de un mismo bloque "Seguir comprando".
· Corrección del fondo negro en imágenes con transparencia.
· Calculadora de piscinas y edición de ficha técnica en preproducción.
· Barra de búsqueda fija en escritorio, sin esconderse al hacer scroll.

8. PANEL DE ADMINISTRACIÓN Y SINCRONIZACIÓN CON EL CRM

· Campo de ficha técnica añadido al formulario de producto del panel y al formulario lateral de Apps Script.
· Corrección de un fallo por el que guardar un producto vaciaba columnas no incluidas en el formulario.
· Bloqueo de los botones de acción rápida mientras se ejecutan, para evitar lanzar la misma acción dos veces.
· Aviso automático y manual de sincronización pendiente desde el CRM, con correo en HTML y firma propia.
· Corrección de la validación de la ficha técnica (no exigir https, y arreglo de un fallo por el que Apps Script no soporta el objeto URL global y la rechazaba siempre).

9. SEO, ANALÍTICA Y PÁGINA DE SERVICIOS

· Cierre de huecos de indexación y tracking (Google Analytics) en todo el sitio.
· Banner propio 1200×630 para Open Graph, con fondo claro, en lugar del logo pequeño anterior.
· Página de Servicios: bloque de proveedores principales con enlaces reales a sus webs oficiales, con el mismo tratamiento visual que en la home.

10. DESGLOSE DE HORAS — FASE 4

Epica / Tarea                                                  | Horas
----------------------------------------------------------------|------
Despliegue en producción (IONOS) y modo mantenimiento            | 4 h
Lista de la compra: funcionalidad completa y avisos de validez   | 9 h
Gestión de imágenes: validación y registro continuo de productos | 10 h
Copia de imágenes validadas para OneDrive (tablets comerciales)   | 5 h
Centro de Soluciones: analítica, feedback, IA y calidad de guías | 12 h
Escaparate: folleto digital compartible                          | 7 h
Buscador: bloques de descubrimiento, filtros y ordenación         | 12 h
Panel de administración y sincronización con el CRM               | 3 h
SEO, analítica y página de Servicios                              | 2 h
Ajustes técnicos, responsive y documentación                      | 3 h
----------------------------------------------------------------|------
TOTAL                                                             | 67 h

11. OBSERVACIONES Y ESTADO ACTUAL

· El sitio está publicado en producción en IONOS, con el panel de administración excluido del entorno público.
· La Lista de la compra está operativa, con avisos de validez que ya no pueden perderse de vista sin aceptarlos.
· El Centro de Soluciones dispone de cuatro fases de analítica propia y mecanismos de mejora continua de sus guías.
· El Escaparate digital está en producción tras su validación con campañas reales.
· El registro y validación de imágenes de producto sigue en curso, ahora con un flujo adicional para mantener sincronizada la copia que consumen las tablets de los comerciales vía OneDrive.
· Pendiente de completar: cobertura total de imágenes de producto, y primeras sincronizaciones completas del flujo de OneDrive por parte del administrador del CRM.

ORENCIO MATAS Y HERMANOS, S.L.
Av. Alfred Nobel, 2 · 13005 Ciudad Real · 926 221 217 · correo@orenciomatas.es
