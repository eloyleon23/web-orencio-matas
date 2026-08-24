# Informe de Desarrollo Web — Fase 3

**Proyecto:** Orencio Matas y Hermanos, S.L.  
**Dominio:** https://www.orenciomatas.es  
**Repositorio:** https://github.com/eloyleon23/web-orencio-matas  
**Fase:** 3  
**Fecha:** agosto 2026

---

## 1. Resumen ejecutivo

Durante la Fase 3 se ha consolidado el buscador de productos, se ha iniciado el **Centro de Soluciones** como experiencia de asesoramiento y se ha preparado la infraestructura para el **despliegue en producción en IONOS** bajo el dominio `orenciomatas.es`.

Los principales logros de la fase son:

- Buscador casi instantáneo en la carga inicial gracias al consumo local de `data/productos.json`.
- Wizard de soluciones, exploración por áreas y validación de búsquedas contra el catálogo real.
- Gestión de imágenes de productos con herramientas de apoyo, revisión y reporte.
- Flujo automatizado de actualización de productos mediante correo electrónico y Apps Script.
- Nuevas páginas de catálogo por áreas de negocio.
- Preparación del despliegue en el servidor de IONOS.

---

## 2. Buscador de productos

### 2.1 Carga inicial prácticamente instantánea

El buscador (`buscador.html`) ha dejado de depender del endpoint remoto de Google Apps Script para la carga inicial. Ahora consume el archivo local `data/productos.json`, de modo que la primera pintura de resultados es inmediata. Las actualizaciones del catálogo remoto siguen consultándose en segundo plano para mantener los datos sincronizados sin penalizar la experiencia inicial.

Archivos involucrados: `buscador.html`.

### 2.2 Icono de borrado visible en escritorio

Se ha corregido el botón de limpiar texto (X) del buscador para que sea visible en el toolbar de escritorio, con color claro sobre el fondo oscuro y posicionamiento correcto.

Archivos involucrados: `buscador.html`, `assets/css/soluciones.css`.

### 2.3 Filtros, sugerencias y catálogo

- Búsqueda normalizada por nombre, referencia, familia, área y precio.
- Filtros laterales de área, fabricante, precio, stock y formato.
- Sugerencias de búsqueda con debounce.
- Escáner de códigos de barras.
- Carga en segundo plano de catálogos adicionales: talleres, Glasurit, Besa y Baslac.

---

## 3. Gestión de imágenes

### 3.1 Vista detalle de producto

El modal y la ficha de producto muestran la imagen registrada, referencia, precio y, cuando procede, el enlace a la ficha técnica real. Si un producto no tiene imagen validada, se indica explícitamente para evitar suposiciones.

### 3.2 Asistente de imágenes y catálogo

Se dispone de un conjunto de herramientas en `imagenes_tool/` que permiten:

- Buscar imágenes por API (Pexels, Pixabay, Unsplash) y por descripción de producto.
- Buscar imágenes por código de barras.
- Generar vistas HTML de revisión de imágenes pendientes.
- Subir imágenes validadas al entorno correspondiente.
- Sincronizar Google Drive con la hoja de cálculo de productos.
- Registrar productos nuevos y productos sin imagen en archivos Excel.

Herramientas principales: `buscar_imagenes_*.py`, `generar_revision_html.py`, `subir_imagenes_validadas.py`, `sincronizar_drive_sheet.py`.

### 3.3 Registro y mantenimiento de imágenes (en curso)

El proceso de registro, validación y mantenimiento de imágenes de productos actuales y nuevos sigue activo. Actualmente se dispone de:

- Hojas de seguimiento: `productos_sin_imagen.xlsx`, `productos_nuevos.xlsx`.
- Guía de búsqueda de imágenes: `imagenes_tool/GUIA_BUSQUEDA_IMAGENES.md`.
- Instrucciones para reportar una imagen: `docs/INSTRUCCIONES_REPORTAR_IMAGEN.md`.

Esta línea de trabajo continuará en la siguiente fase hasta alcanzar una cobertura completa del catálogo.

---

## 4. Actualización automatizada de productos desde correo electrónico

El flujo de actualización de catálogo utiliza Google Apps Script como puente:

1. El almacén envía actualizaciones por correo electrónico.
2. Apps Script procesa el contenido y expone un endpoint (`PRODUCTOS_REMOTO_URL`).
3. El buscador consulta ese endpoint en segundo plano para detectar cambios.
4. Si hay novedades, se recarga el catálogo preservando los filtros del usuario.

Se mantiene también un control de versiones local (`data/productos_version.json`) para evitar recargas innecesarias.

---

## 5. Despliegue en producción (IONOS)

La nueva web está preparada para su despliegue en el servidor de IONOS bajo el dominio `orenciomatas.es`. El repositorio está listo para ser publicado como sitio estático o servido desde el hosting configurado.

Pendiente: ejecución final del despliegue y verificación de DNS/certificado SSL si aún no están activos.

---

## 6. Nuevas vistas de catálogo

Se han desarrollado o consolidado las vistas de catálogo para las cuatro áreas principales del negocio:

- **Droguería**
- **Perfumería**
- **Pinturas**
- **Talleres**

Cada una muestra los productos del catálogo filtrados por su área correspondiente, con enlaces al buscador y a la ficha de producto.

---

## 7. Centro de Soluciones (prototipo inicial)

Se ha implementado la primera versión del **Centro de Soluciones**, orientada a que el usuario describa qué quiere hacer y reciba una guía o una búsqueda de productos coherentes.

### Funcionalidades incluidas

- **Asistente paso a paso:** acción → superficie → estado → resultado → solución.
- **Explora soluciones:** áreas con ejemplos, validados contra el catálogo.
- **Tengo un problema:** búsqueda por palabras clave y chips rápidos.
- **Soluciones destacadas:** tarjetas populares con dificultad y tiempo estimado.
- **Fichas de solución:** pasos, materiales, productos recomendados, calculadora de cantidad y exportación a PDF.
- **Mejoras de PDF:** cabecera con logo de Orencio Matas y pie con dirección y horario comercial.
- **Compartir solución:** botón de compartir enlace y envío por WhatsApp con enlace a la guía.

### Validación de búsquedas

Todos los ejemplos de "Explora soluciones" han sido validados contra el catálogo real para que ninguno quede sin resultados. Los términos se han ajustado en coche, madera, metal, limpieza, pegado, suelos, piscinas, plagas y jardín.

Archivos involucrados: `centro-soluciones.html`, `assets/js/centro-soluciones.js`, `assets/js/soluciones-data.js`, `assets/js/solucion-detalle.js`, `assets/css/soluciones.css`.

---

## 8. Otros detalles reseñables

- **Titanpro:** logotipo local en soluciones de pintura interior y fachada, con fallback visual si la imagen no carga.
- **Menús y navegación:** integración de "Centro de Soluciones" en la navegación principal; estructura de catálogos desplegable.
- **Diseño responsive:** grids de dos columnas en móvil para opciones y soluciones.
- **Historial de cambios:** el trabajo ha sido versionado y subido continuamente a `main` en GitHub, con pull previo para evitar conflictos con el trabajo paralelo.

---

## 9. Estado y próximos pasos

- **Completado:** buscador, Centro de Soluciones, flujo de catálogo, preparación de despliegue.
- **En curso:** registro y validación de imágenes de productos; actualización masiva de fotografías.
- **Pendiente:** despliegue final en IONOS y verificación post-publicación; ampliación de guías de soluciones.

---

*Informe generado automáticamente a partir del estado del repositorio y el histórico de cambios de la Fase 3.*
