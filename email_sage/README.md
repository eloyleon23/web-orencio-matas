# Automatización: Excel de Sage por correo → RegistroProductos → Productos

Automatiza el proceso manual actual: en vez de que alguien exporte de Sage
y pegue el Excel en `RegistroProductos` a mano, un trigger de Apps Script
revisa el correo cada 30 minutos, vuelca el adjunto en la hoja y dispara
la sincronización — reutilizando las funciones que ya existen
(`sincronizarRegistroProductos`, `deshabilitarProductosSinFoto`).

## Qué NO cambia

- El origen de los datos sigue siendo el mismo Excel con la misma
  estructura de columnas que `RegistroProductos` ya tiene.
- La lógica de actualizar precios y dar de alta productos nuevos es la
  misma función `sincronizarRegistroProductos` que ya usáis desde el menú
  — no se reescribe, solo se dispara sola.
- Los productos nuevos sin imagen se ocultan del catálogo exactamente
  igual que ahora (`incluir_en_catalogo = "no"`), con `deshabilitarProductosSinFoto`.

## Qué es nuevo

- Ya no hace falta que nadie entre a Sheets a pegar el Excel a mano.
- Un email de resumen tras cada sincronización, con la lista exacta de
  productos nuevos que se han quedado sin imagen — para saber sobre qué
  ejecutar `imagenes_tool` sin tener que revisar el Sheet entero.

## Activación (una sola vez)

1. Abre el editor de Apps Script del Sheet (Extensiones → Apps Script).
2. Pega el contenido de `apps_script_email_registro_productos.js` en un
   archivo nuevo del proyecto (o al final de `apps_script_trigger.js`, como
   prefieras organizarlo).
3. Rellena `CONFIG_EMAIL_SAGE` al principio del archivo:
   ```js
   const CONFIG_EMAIL_SAGE = {
     remitente: 'email-real-del-administrador-de-sage@ejemplo.com',
     emailResumen: 'tu-email@ejemplo.com',
     etiquetaProcesado: 'RegistroProductos-Procesado',
     maxHilosPorEjecucion: 20,
   };
   ```
4. Habilita el servicio avanzado de **Drive API** (necesario para leer el
   adjunto .xlsx): en el editor, icono **Servicios (+)** → busca "Drive
   API" → Añadir.
5. Ejecuta manualmente `crearTriggerRevisionCorreoSage` una vez (botón
   ▶ en el editor, seleccionando esa función). Te pedirá autorizar permisos
   de Gmail/Drive/Sheets la primera vez — es normal, acéptalo.
6. Listo. A partir de ahí, cada 30 minutos revisa solo el correo del
   remitente configurado.

## Cómo probarlo antes de confiar en el trigger automático

1. Pide al administrador de Sage que te mande un correo de prueba con un
   Excel pequeño (2-3 filas) con la estructura de `RegistroProductos`.
2. En el editor de Apps Script, ejecuta manualmente `probarProcesarCorreoAhora`.
3. Revisa el registro de ejecución (`Ver` → `Registros`) y comprueba en
   `RegistroProductos` que las filas se añadieron correctamente.
4. Si todo está bien, ya puedes esperar a que el trigger lo haga solo.

## Sobre el reto de las imágenes

Los productos nuevos entran en el catálogo pero **ocultos**
(`incluir_en_catalogo = "no"`) hasta que tengan imagen — esto ya lo hacía
vuestro sistema, no es nuevo. Lo que añade esta automatización es el
**aviso automático por email** con la lista exacta de qué productos
nuevos necesitan imagen, para que sepas inmediatamente sobre qué ejecutar
`imagenes_tool/` (ya construido):

- Droguería/Perfumería → `buscar_imagenes_api.py` o `buscar_imagenes_gratis.py`
- Pinturas → `titan_buscar_imagenes.py`

Tras revisar y aprobar en la galería (`generar_revision_html.py`) y
sincronizar con `sincronizar_drive_sheet.py`, el producto queda con imagen
en el Sheet — pero **hay un cabo suelto que conviene resolver**: ahora
mismo `sincronizar_drive_sheet.py` actualiza `imagen_drive_id` pero no
reactiva `incluir_en_catalogo`. Habría que:
- **Opción A** (recomendada, más simple): ampliar `sincronizar_drive_sheet.py`
  para que, al asignar una imagen a un producto que no tenía, ponga también
  `incluir_en_catalogo = "si"` automáticamente.
- **Opción B**: seguir usando el mecanismo antiguo
  (`moverImagenesNuevasACarpetaPrincipal`, que ya reactiva el producto) para
  este flujo en concreto.

Pendiente de que decidas cuál prefieres — no lo he tocado todavía para no
mezclar cambios sin tu confirmación.

## Seguridad

- Solo procesa correos del remitente exacto configurado — cualquier otro
  correo con adjunto .xlsx que llegue a la misma bandeja se ignora.
- Solo AÑADE filas a `RegistroProductos`, nunca borra ni sobrescribe nada.
- El Sheet temporal usado para leer el Excel se borra siempre al terminar,
  incluso si algo falla a medias.
- Las credenciales/permisos son los mismos que ya usa vuestro Apps Script
  (no se añade ninguna credencial nueva ni servicio externo).
