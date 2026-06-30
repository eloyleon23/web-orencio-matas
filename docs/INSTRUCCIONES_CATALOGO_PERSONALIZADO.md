# Instrucciones para configurar el envío de catálogos personalizados

## Resumen

El buscador de productos ahora puede enviar catálogos personalizados vía email usando Brevo. El flujo es:

1. Usuario filtra productos en el buscador
2. Introduce su email en el modal
3. El sistema dispara un workflow de GitHub Actions
4. El workflow genera un PDF con los productos filtrados
5. Brevo envía el email con el PDF adjunto al usuario

## Configuración necesaria

### 1. Configurar API key de Brevo en GitHub Actions

1. Ve a tu cuenta de Brevo (https://app.brevo.com/)
2. Copia tu API key (Settings → API Keys)
3. En el repositorio de GitHub:
   - Ve a Settings → Secrets and variables → Actions
   - Crea un nuevo secret llamado `BREVO_API_KEY`
   - Pega tu API key de Brevo

### 2. Configurar token de GitHub para disparar workflows

Opción A: Token de GitHub Personal Access Token (PAT)

1. Ve a https://github.com/settings/tokens
2. Crea un nuevo token (Personal Access Token → Tokens (classic))
3. Selecciona los permisos:
   - `repo` (control total de repositorios privados)
   - `workflow` (actualizar workflows de GitHub Actions)
4. Copia el token generado
5. En el archivo `src/js/config-buscador.js`:
   ```javascript
   window.GITHUB_WORKFLOW_TOKEN = 'TU_TOKEN_AQUI';
   ```

**IMPORTANTE:** En producción, considera usar un servidor backend para no exponer el token en el frontend.

Opción B: Usar un servidor backend (recomendado para producción)

Para mayor seguridad, puedes crear un endpoint intermedio:
- Vercel Functions
- Netlify Functions
- Cloudflare Workers
- Lambda de AWS

Este endpoint recibiría la solicitud del buscador y dispararía el workflow usando un token seguro.

### 3. Verificar el workflow

1. Ve al repositorio en GitHub
2. Ve a la pestaña "Actions"
3. Busca el workflow "Enviar Catálogo Personalizado"
4. Puedes probarlo manualmente usando el botón "Run workflow"

## Archivos creados/modificados

- `scripts/generar_catalogo_personalizado.py` - Script Python para generar el PDF
- `.github/workflows/enviar_catalogo_personalizado.yml` - Workflow de GitHub Actions
- `src/js/config-buscador.js` - Configuración del token de GitHub
- `buscador.html` - Modal actualizado para enviar solicitud al workflow

## Flujo del sistema

```
Usuario (buscador.html)
    ↓
Introduce email y filtros
    ↓
Dispara workflow de GitHub Actions (via API de GitHub)
    ↓
Workflow se ejecuta en GitHub Actions
    ↓
Script Python genera PDF personalizado
    ↓
Workflow envía email vía Brevo API
    ↓
Usuario recibe email con PDF adjunto
```

## Solución de problemas

### Error: "No se ha configurado el token de GitHub"

- Verifica que `window.GITHUB_WORKFLOW_TOKEN` esté configurado en `src/js/config-buscador.js`
- Asegúrate de que el token tenga los permisos necesarios

### El workflow no se ejecuta

- Verifica que el token tenga permiso `workflow`
- Revisa los logs del workflow en GitHub Actions
- Comprueba que los filtros se estén enviando correctamente

### El email no llega

- Verifica que la API key de Brevo sea correcta
- Revisa los logs del workflow para ver errores de la API de Brevo
- Comprueba la carpeta de spam del email del usuario
- Verifica que el dominio de envío (correo@orenciomatas.es) esté verificado en Brevo

### El PDF no se genera correctamente

- Verifica que `data/productos.json` exista en el repositorio
- Revisa los logs del workflow para ver errores del script Python
- Asegúrate de que las dependencias (reportlab, pillow, requests) estén instaladas

## Consideraciones de seguridad

- **Nunca** commits el token de GitHub o la API key de Brevo en el repositorio
- Usa secrets de GitHub Actions para almacenar credenciales
- Considera usar un servidor backend para producción en lugar de exponer tokens en el frontend
- Limita los permisos del token de GitHub al mínimo necesario
- Rota las credenciales periódicamente
