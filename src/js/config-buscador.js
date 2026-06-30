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
 */

// Descomentar y configurar para activar el envío de catálogos
// window.GITHUB_WORKFLOW_TOKEN = 'TU_TOKEN_AQUI';

// Por ahora, mantener desactivado para evitar exponer credenciales
window.GITHUB_WORKFLOW_TOKEN = '';
