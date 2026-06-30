/**
 * Configuración para el buscador de productos
 *
 * IMPORTANTE: Para activar el envío de catálogos personalizados vía email:
 *
 * 1. Crear un Personal Access Token (PAT) en GitHub:
 *    - Ir a https://github.com/settings/tokens
 *    - Crear un nuevo token con permisos: repo (workflow)
 *    - Copiar el token generado
 *
 * 2. Configurar el token en el buscador:
 *    - Descomentar la línea de abajo y reemplazar TU_TOKEN_AQUI con el token
 *    - NOTA: En producción, esto debería configurarse como variable de entorno
 *      o a través de un servidor backend para mayor seguridad
 *
 * 3. Configurar la API key de Brevo en GitHub Actions:
 *    - Ir al repositorio en GitHub
 *    - Settings → Secrets and variables → Actions
 *    - Añadir un nuevo secret: BREVO_API_KEY
 *    - Pegar la API key de Brevo
 *
 * IMPORTANTE: Botón temporal para reportar imágenes incorrectas (fase desarrollo)
 *
 * 1. Para mostrar el botón "Reportar imagen incorrecta" en el modal de producto:
 *    - Cambiar MOSTRAR_BOTON_REPORTAR_IMAGEN a true
 *    - Esto registrará productos con imágenes incorrectas en Google Sheets
 *
 * 2. Configurar el web app de Google Apps Script:
 *    - El script debe estar desplegado como web app con acceso "Cualquier persona"
 *    - Pegar la URL del web app en GOOGLE_APPS_SCRIPT_URL
 *
 * 3. La hoja de Google Sheets debe ser:
 *    - Nombre: "ProductosPendientesEvaluarImagen"
 *    - Columnas: Referencia | FechaRevision
 */

console.log('config-buscador.js cargado');

// Descomentar y configurar para activar el envío de catálogos
// window.GITHUB_WORKFLOW_TOKEN = 'TU_TOKEN_AQUI';

// Por ahora, mantener desactivado para evitar exponer credenciales
window.GITHUB_WORKFLOW_TOKEN = '';

console.log('Token configurado:', window.GITHUB_WORKFLOW_TOKEN ? 'Sí' : 'No');
console.log('Longitud del token:', window.GITHUB_WORKFLOW_TOKEN.length);

// Botón temporal para reportar imágenes incorrectas (fase de desarrollo)
window.MOSTRAR_BOTON_REPORTAR_IMAGEN = true; // Cambiar a true para activar

// URL del web app de Google Apps Script para registrar productos
// window.GOOGLE_APPS_SCRIPT_URL = 'TU_WEB_APP_URL_AQUI';
window.GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzDHfP6N2n_nBqhBWOP9dGy9IP9e0Sit7JgitMm-lrLxRGrxJE2RLfLN46rqjJkzsXN/exec';
