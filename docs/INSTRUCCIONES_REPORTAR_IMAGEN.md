# Instrucciones para activar el botón de reportar imagen incorrecta

## Resumen

El buscador de productos incluye un botón temporal para registrar productos con imágenes incorrectas en Google Sheets. Este botón está oculto por defecto y solo debe activarse durante la fase de desarrollo y evaluación de imágenes.

## Configuración necesaria

### 1. Desplegar el script de Google Apps Script

1. Abre tu Google Sheet: https://docs.google.com/spreadsheets/d/1T-MZUPPmhh_t4miezHVCfRCxVpWcxQgdZGNVvFeA_cw
2. Ve a Extensiones → Apps Script
3. Crea un nuevo script
4. Copia el contenido del archivo `scripts/reportar_imagen_incorrecta.gs`
5. Pégalo en el editor de Apps Script
6. Guarda el script (Ctrl+S o Cmd+S)
7. Haz clic en "Implementar" → "Nueva implementación"
8. Configura:
   - **Descripción**: "Web app para reportar imágenes incorrectas"
   - **Ejecutar como**: "Yo"
   - **Quién tiene acceso**: "Cualquier persona"
9. Haz clic en "Implementar"
10. Copia la URL del web app (termina en `/exec`)

### 2. Configurar el buscador

1. Abre el archivo `src/js/config-buscador.js`
2. Cambia `window.MOSTRAR_BOTON_REPORTAR_IMAGEN` a `true`:
   ```javascript
   window.MOSTRAR_BOTON_REPORTAR_IMAGEN = true;
   ```
3. Pega la URL del web app en `window.GOOGLE_APPS_SCRIPT_URL`:
   ```javascript
   window.GOOGLE_APPS_SCRIPT_URL = 'TU_WEB_APP_URL_AQUI';
   ```
4. Guarda los cambios

### 3. Verificar la hoja de Google Sheets

La hoja debe llamarse "ProductosPendientesEvaluarImagen" y tener las siguientes columnas:
- Referencia (columna A)
- FechaRevision (columna B)

Si la hoja no existe, el script la creará automáticamente con las columnas correctas.

## Uso del botón

1. Abre el buscador de productos (buscador.html)
2. Haz clic en cualquier producto para abrir el modal de detalle
3. Si la imagen es incorrecta, haz clic en el botón "Reportar imagen incorrecta"
4. El producto se registrará en la hoja de Google Sheets con:
   - Referencia del producto
   - Fecha y hora de la revisión

## Comportamiento del script

- Si el producto ya está registrado, el script actualizará la fecha de revisión
- Si el producto no está registrado, el script añadirá una nueva fila
- El script maneja errores y devuelve mensajes de éxito/error

## Desactivar el botón

Cuando la fase de evaluación de imágenes termine:

1. Abre `src/js/config-buscador.js`
2. Cambia `window.MOSTRAR_BOTON_REPORTAR_IMAGEN` a `false`:
   ```javascript
   window.MOSTRAR_BOTON_REPORTAR_IMAGEN = false;
   ```
3. Opcionalmente, puedes eliminar la URL del web app:
   ```javascript
   window.GOOGLE_APPS_SCRIPT_URL = '';
   ```
4. Guarda los cambios

El botón dejará de aparecer en el modal de producto.

## Solución de problemas

### Error: "No se ha configurado la URL del web app"
- Verifica que `window.GOOGLE_APPS_SCRIPT_URL` esté configurado en `config-buscador.js`
- Asegúrate de que la URL del web app sea correcta (termina en `/exec`)

### Error: "Producto no registrado"
- Verifica que el script de Apps Script esté desplegado como web app
- Asegúrate de que la configuración "Quién tiene acceso" sea "Cualquier persona"
- Revisa los logs de ejecución en el editor de Apps Script

### Error: "Hoja no encontrada"
- Verifica que el ID de la hoja en el script sea correcto: `1T-MZUPPmhh_t4miezHVCfRCxVpWcxQgdZGNVvFeA_cw`
- Asegúrate de que tengas acceso a la hoja de Google Sheets

## Consideraciones de seguridad

- El web app de Google Apps Script está configurado con acceso "Cualquier persona"
- Esto es aceptable para una fase temporal de desarrollo
- Cuando la fase termine, considera:
  - Revocar el web app
  - Cambiar el acceso a "Solo yo"
  - Eliminar el script de Apps Script
