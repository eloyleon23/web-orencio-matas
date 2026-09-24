// ── Configuración de entorno ──
//
// ÚNICO punto de verdad para distinguir preproducción (GitHub Pages,
// administración siempre activa) de producción en IONOS (administración
// siempre desactivada). Todos los flags window.MOSTRAR_X de
// administración de buscador.html (gestión de imágenes, asistente de
// imágenes, precio mayor, actualizar/validar/buscar imagen, gestionar
// relacionados, dar de baja), escaparate.html y escaparate-campanas.html
// (gestión de campañas/escaparates) y centro-soluciones.html (gestión
// de soluciones) derivan de esta única variable — nunca se hardcodea
// "true" por separado en cada página.
//
// El script que prepara la copia del sitio para IONOS
// (scripts_ci/preparar_build_ionos.py) cambia el valor de ESTA línea a
// `false` en su copia de salida — nada más en todo el sitio necesita
// tocarse para desactivar toda la administración a la vez. El
// repositorio (rama main) se queda siempre con `true`.
//
// Cargar este script SIEMPRE antes que el bloque de configuración de
// cada página (el que hace window.MOSTRAR_X = window.OM_PREPRODUCCION),
// para que la variable ya exista cuando se lea.
window.OM_PREPRODUCCION = true;
