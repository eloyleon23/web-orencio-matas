ORENCIO MATAS Y HERMANOS, S.L.
Informe de Desarrollo Web · Confidencial
Av. Alfred Nobel, 2 · 13005 Ciudad Real · 926 221 217 · correo@orenciomatas.es

INFORME DE DESARROLLO WEB
FASE 3 — Centro de Soluciones y refinamiento del buscador
ORENCIO MATAS Y HERMANOS, S.L.

Continuación del informe de desarrollo Fase 2, cerrado el 04/07/2026. Este informe cubre el trabajo realizado desde entonces en el repositorio web-orencio-matas, centrado en el buscador de productos, la gestión de imágenes y el prototipo del Centro de Soluciones.

Fecha de generación: 23/08/2026

1. LISTADO GENERAL DE TRABAJOS REALIZADOS — FASE 3

· Mejora de la carga inicial del buscador: consumo local de data/productos.json con actualización remota en segundo plano.
· Corrección del icono de borrado (X) en la barra de búsqueda de escritorio.
· Validación de todos los ejemplos de "Explora soluciones" contra el catálogo real; 0 ejemplos sin resultados.
· Ajuste de términos de búsqueda en coche, madera, metal, limpieza, pegado, suelos, piscinas, plagas y jardín.
· Desarrollo del prototipo inicial del Centro de Soluciones con asistente paso a paso y exploración por áreas.
· Nuevas guías de solución: pintar plástico de coche, reparar arañazos, eliminar óxido, restaurar muebles, sellar juntas, pintar suelos con epoxi, mantenimiento de piscinas, control de plagas, cuidado de plantas, proteger bajos del coche, pintar paredes, pintar fachadas, impermeabilizar terrazas y sellar lunas.
· Exportación de soluciones a PDF con cabecera de empresa y pie de página con dirección y horario comercial.
· Integración de compartir solución vía Web Share API y WhatsApp con enlace a la guía.
· Navegación principal: "Centro de Soluciones" como elemento principal junto a los catálogos de Droguería, Perfumería, Pinturas y Talleres.
· Nuevas vistas de catálogo para Droguería, Perfumería, Pinturas y Talleres conectadas con el buscador.
· Continuación del registro y mantenimiento de imágenes de productos actuales y nuevos (en curso).
· Preparación del despliegue en producción en el servidor IONOS para el dominio orenciomatas.es.
· Ajustes técnicos de responsive, menús, submenu, footer y estilos de chips de dificultad.

2. BUSCADOR DE PRODUCTOS

2.1 Rendimiento de carga inicial

El buscador dejó de depender del endpoint remoto de Google Apps Script para la primera carga. Ahora lee el archivo local data/productos.json, lo que reduce drásticamente el tiempo de inicio. El catálogo remoto se sigue consultando periódicamente para detectar cambios y actualizar los datos en segundo plano sin interrumpir la sesión del usuario.

2.2 UX de búsqueda

· Icono de borrado visible en la barra de escritorio.
· Sugerencias de búsqueda con debounce.
· Escáner de códigos de barras.
· Filtros por área, familia, subfamilia, precio, ofertas y stock.
· Modal de detalle de producto con ficha técnica y productos relacionados.
· Paginación y scroll infinito según vista.

2.3 Estructura de catálogo

El catálogo principal se carga desde data/productos.json. En segundo plano se cargan catálogos adicionales de talleres propios, Glasurit, Besa y Baslac, que se integran sin bloquear la interfaz.

3. GESTIÓN DE IMÁGENES

3.1 Vista detalle de producto

El buscador y la ficha de soluciones muestran la imagen registrada de cada producto. Si el producto no está resuelto contra el catálogo, se omite el precio y el enlace a la ficha técnica, mostrando un mensaje de disponibilidad no vinculante.

3.2 Asistente de imágenes

Se dispone de la carpeta de herramientas imagenes_tool/ con utilidades para:

· Búsqueda de imágenes por API gratuitas (Pexels, Pixabay, Unsplash).
· Búsqueda de imágenes por código de barras.
· Búsqueda de imágenes por descripción.
· Generación de vistas HTML de revisión.
· Subida de imágenes validadas.
· Sincronización entre Drive y hoja de cálculo.
· Registro de productos sin imagen y productos nuevos en archivos Excel.

3.3 Registro y mantenimiento de imágenes (en curso)

El proceso de registro, validación y corrección de imágenes de productos actuales y nuevos continúa activo. Los archivos de seguimiento actuales son productos_sin_imagen.xlsx y productos_nuevos.xlsx. Se espera completar la cobertura en la siguiente fase.

4. ACTUALIZACIÓN AUTOMATIZADA DE PRODUCTOS DESDE CORREO ELECTRÓNICO

El flujo de actualización mantiene Google Apps Script como puente:

· El almacén envía actualizaciones por correo electrónico.
· Apps Script procesa el contenido y expone un endpoint de productos.
· El buscador consulta el endpoint en segundo plano.
· Si el contenido cambia, se recarga el catálogo conservando los filtros activos del usuario.
· Se mantiene el archivo data/productos_version.json para el control de versiones local.

5. CENTRO DE SOLUCIONES (PROTOTIPO INICIAL)

5.1 Asistente paso a paso

· Paso 1: ¿Qué quieres hacer? (pintar, reparar, limpiar, pulir, restaurar, proteger, preparar, pegar, acabado).
· Paso 2: ¿Sobre qué superficie? (coche, madera, metal, pared, hogar, plástico, suelo, jardín, piscina, otro).
· Paso 3: ¿Cómo está actualmente? (sin pintar, pintada, barnizada, oxidada, deteriorada).
· Paso 4: ¿Qué resultado quieres?.
· Si no hay una guía concreta, el asistente muestra productos del catálogo relacionados con la combinación elegida.

5.2 Explora soluciones

Cada área de trabajo incluye ejemplos validados contra el catálogo. Si un ejemplo tiene guía, enlaza a ella; si no, realiza una búsqueda concreta y coherente. Todos los ejemplos devuelven al menos un producto.

5.3 Fichas de solución

· Descripción, dificultad, tiempo estimado, superficie y resultado.
· Lista de materiales por fases.
· Receta de trabajo con emojis.
· Pasos detallados con productos recomendados.
· Productos resueltos contra el catálogo real.
· Calculadora de cantidad para pinturas, barnices y epoxi.
· Consejos y errores comunes.
· Productos alternativos.
· Enlaces a cartas de colores de proveedores (Titanpro, Titanlux, TitanTech, Compo).

5.4 Exportación e impresión

· Botón "Descargar como PDF" que usa la función Imprimir del navegador.
· Cabecera del informe con el logo de Orencio Matas.
· Pie de página con dirección y horario comercial.
· Botón "Compartir solución" vía Web Share API o copia de enlace.
· Botón "Enviar por WhatsApp" con enlace a la guía, no con texto plano.

6. CATÁLOGOS POR ÁREAS DE NEGOCIO

Se han consolidado las vistas de catálogo para las cuatro áreas principales:

· Droguería
· Perfumería
· Pinturas
· Talleres

Cada vista conecta con el buscador y con las soluciones del Centro de Soluciones cuando aplica.

7. DESPLIEGUE EN PRODUCCIÓN

La nueva web está preparada para su despliegue en el servidor de IONOS bajo el dominio orenciomatas.es. El repositorio está sincronizado con origin/main y contiene los catálogos, soluciones y buscador listos para publicación.

Pendiente: ejecución final del despliegue en el servidor y verificación de DNS, SSL y redirecciones.

8. OBSERVACIONES Y ESTADO ACTUAL

· El buscador carga de forma inmediata con el catálogo local.
· El Centro de Soluciones está operativo como prototipo inicial y continuará ampliándose con nuevas guías.
· La validación de búsquedas del asistente es diaria contra el catálogo real.
· El registro de imágenes sigue en curso.
· El despliegue en IONOS está pendiente de ejecución final.

ORENCIO MATAS Y HERMANOS, S.L.
Av. Alfred Nobel, 2 · 13005 Ciudad Real · 926 221 217 · correo@orenciomatas.es
