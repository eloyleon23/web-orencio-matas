/**
 * ============================================================
 * AUTOMATIZACIÓN: Email con Excel de Sage → RegistroProductos → Productos
 * ============================================================
 *
 * PEGAR EN EL EDITOR DE APPS SCRIPT DEL SHEET (no se despliega solo). Este
 * archivo es una copia de referencia versionada en el repositorio, igual
 * que apps_script_trigger.js.
 *
 * FLUJO:
 *  1. Un trigger de tiempo (cada 30 min) busca en Gmail correos nuevos del
 *     administrador de Sage, con adjunto .xlsx, sin procesar todavía.
 *  2. Convierte cada adjunto a una Google Sheet temporal para poder leerlo,
 *     y la borra en cuanto termina (no deja residuos en Drive).
 *  3. Añade esas filas al final de RegistroProductos, respetando el mismo
 *     orden de columnas que ya tiene esa hoja: CodigoEAN, DescripcionArticulo,
 *     PrecioMayorSinIVA, PrecioPublicoSinIVA, IVA, CodigoFamilia, Familia,
 *     FechaAlta, TieneFoto, Procesado, Error.
 *  4. Marca el correo como procesado (etiqueta Gmail) para no repetirlo en
 *     la siguiente pasada del trigger.
 *  5. Llama a sincronizarRegistroProductos() — YA EXISTE en vuestro Apps
 *     Script — que actualiza precios de productos existentes y da de alta
 *     los nuevos en la hoja Productos.
 *  6. Llama a deshabilitarProductosSinFoto() — YA EXISTE — que oculta del
 *     catálogo (incluir_en_catalogo = "no") los productos nuevos que no
 *     tengan imagen todavía.
 *  7. Manda un email de resumen con la lista exacta de productos nuevos
 *     sin imagen, para saber sobre qué ejecutar imagenes_tool.
 *
 * REQUISITO ÚNICO DE CONFIGURACIÓN (antes de activarlo):
 *  - Rellenar CONFIG_EMAIL_SAGE más abajo con el email real del
 *    administrador de Sage y tu email para recibir el resumen.
 *  - Habilitar el "Servicio avanzado de Drive API" en el editor de Apps
 *    Script (icono de servicios "+" → Drive API → Activar). Necesario
 *    para convertir el adjunto xlsx a Google Sheet.
 *  - Ejecutar UNA VEZ la función crearTriggerRevisionCorreoSage() para
 *    crear el disparador automático. No hace falta volver a ejecutarla.
 *
 * SEGURIDAD:
 *  - Solo procesa correos del remitente exacto configurado — cualquier
 *    otro correo con un adjunto .xlsx se ignora, aunque llegue a la
 *    misma bandeja de entrada.
 *  - No se ejecuta ninguna acción destructiva: solo AÑADE filas a
 *    RegistroProductos, nunca borra ni sobrescribe filas existentes.
 *  - El Sheet temporal usado para leer el Excel se borra siempre, incluso
 *    si algo falla a medias (bloque try/finally).
 */

const CONFIG_EMAIL_SAGE = {
  remitente: 'CONFIGURAR: email del administrador de Sage',
  emailResumen: 'CONFIGURAR: tu email, para recibir el resumen de cada sincronización',
  etiquetaProcesado: 'RegistroProductos-Procesado',
  maxHilosPorEjecucion: 20,
};

/**
 * Función principal: revisa el correo, procesa los adjuntos pendientes y
 * dispara la sincronización. Se ejecuta sola cada 30 min una vez creado
 * el trigger (ver crearTriggerRevisionCorreoSage).
 */
function procesarCorreoRegistroProductos() {
  asegurarEtiqueta_(CONFIG_EMAIL_SAGE.etiquetaProcesado);
  const etiqueta = GmailApp.getUserLabelByName(CONFIG_EMAIL_SAGE.etiquetaProcesado);

  const query = `from:${CONFIG_EMAIL_SAGE.remitente} has:attachment -label:${CONFIG_EMAIL_SAGE.etiquetaProcesado}`;
  const hilos = GmailApp.search(query, 0, CONFIG_EMAIL_SAGE.maxHilosPorEjecucion);

  if (hilos.length === 0) {
    Logger.log('No hay correos nuevos de Sage pendientes de procesar.');
    return;
  }

  let totalFilasAnadidas = 0;
  const erroresProceso = [];

  hilos.forEach(hilo => {
    hilo.getMessages().forEach(msg => {
      msg.getAttachments({ includeInlineImages: false }).forEach(adjunto => {
        const nombre = adjunto.getName().toLowerCase();
        if (!nombre.endsWith('.xlsx') && !nombre.endsWith('.xls')) return;

        try {
          const filas = leerExcelAdjunto_(adjunto);
          if (filas.length > 0) {
            anadirFilasARegistroProductos_(filas);
            totalFilasAnadidas += filas.length;
          }
        } catch (e) {
          erroresProceso.push(`${adjunto.getName()}: ${e.message}`);
        }
      });
    });
    hilo.addLabel(etiqueta);
    hilo.markRead();
  });

  Logger.log(`Filas añadidas a RegistroProductos: ${totalFilasAnadidas}`);
  if (erroresProceso.length) {
    Logger.log('Errores durante el procesado: ' + erroresProceso.join(' | '));
    MailApp.sendEmail(
      CONFIG_EMAIL_SAGE.emailResumen,
      '⚠️ Error procesando correo de Sage',
      'Hubo errores al leer alguno de los adjuntos:\n\n' + erroresProceso.join('\n')
    );
  }

  if (totalFilasAnadidas === 0) return;

  // Reutiliza las funciones ya existentes del menú de Apps Script — no se
  // duplica lógica de sincronización, solo se dispara automáticamente en
  // vez de hacerlo a mano desde el menú.
  sincronizarRegistroProductos();
  deshabilitarProductosSinFoto();
  notificarProductosSinImagen_(totalFilasAnadidas);
}

/**
 * Convierte el adjunto .xlsx a una Google Sheet temporal para poder leer
 * sus valores (Apps Script no lee xlsx directamente), y la borra al
 * terminar pase lo que pase.
 */
function leerExcelAdjunto_(adjunto) {
  const blob = adjunto.copyBlob();
  const archivoTemp = Drive.Files.create(
    { name: 'temp_registro_productos_' + new Date().getTime(), mimeType: MimeType.GOOGLE_SHEETS },
    blob,
    { convert: true }
  );

  try {
    const ss = SpreadsheetApp.openById(archivoTemp.id);
    const hoja = ss.getSheets()[0];
    const datos = hoja.getDataRange().getValues();
    if (datos.length <= 1) return []; // solo cabecera o vacío
    return datos.slice(1).filter(fila => fila.some(celda => celda !== '' && celda !== null));
  } finally {
    Drive.Files.remove(archivoTemp.id); // limpieza: nunca dejar el temporal en Drive
  }
}

/**
 * Añade las filas leídas al final de RegistroProductos, en el mismo orden
 * de columnas que ya tiene esa hoja:
 * CodigoEAN, DescripcionArticulo, PrecioMayorSinIVA, PrecioPublicoSinIVA,
 * IVA, CodigoFamilia, Familia, FechaAlta, TieneFoto, Procesado, Error
 *
 * IMPORTANTE: se asume que el Excel que envía Sage ya trae exactamente
 * estas columnas en este orden (tal como se ha acordado). Si el orden
 * real difiera, hay que ajustar este mapeo antes de activar el trigger.
 */
function anadirFilasARegistroProductos_(filas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('RegistroProductos');
  const numColumnas = hoja.getLastColumn();
  hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, numColumnas).setValues(
    filas.map(fila => fila.slice(0, numColumnas))
  );
}

/**
 * Revisa Productos en busca de altas sin imagen (imagen_drive_id vacío) y
 * manda un aviso con la lista exacta, para saber sobre qué ejecutar
 * imagenes_tool (buscar_imagenes_api.py / buscar_imagenes_gratis.py para
 * drogueria/perfumeria, titan_buscar_imagenes.py para pinturas).
 */
function notificarProductosSinImagen_(filasNuevasCargadas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('Productos');
  const datos = hoja.getDataRange().getValues();
  const cabecera = datos[0];

  const idxRef = cabecera.indexOf('referencia');
  const idxNombre = cabecera.indexOf('nombre');
  const idxArea = cabecera.indexOf('area');
  const idxImagen = cabecera.indexOf('imagen_drive_id');
  const idxCatalogo = cabecera.indexOf('incluir_en_catalogo');

  const pendientes = datos.slice(1).filter(fila =>
    !fila[idxImagen] && fila[idxCatalogo] === 'no'
  );

  const asunto = pendientes.length
    ? `Sincronización Sage: ${pendientes.length} productos nuevos sin imagen`
    : 'Sincronización Sage completada (sin pendientes de imagen)';

  let cuerpo = `Se han procesado ${filasNuevasCargadas} filas del Excel de Sage.\n\n`;

  if (pendientes.length === 0) {
    cuerpo += 'Todos los productos sincronizados ya tienen imagen. No hay nada pendiente.';
  } else {
    cuerpo += `${pendientes.length} productos nuevos están ocultos del catálogo por no tener imagen:\n\n`;
    pendientes.forEach(fila => {
      cuerpo += ` - [${fila[idxArea]}] ${fila[idxRef]}: ${fila[idxNombre]}\n`;
    });
    cuerpo += '\nEjecuta imagenes_tool sobre estos productos:\n' +
              ' - drogueria/perfumeria → buscar_imagenes_api.py o buscar_imagenes_gratis.py\n' +
              ' - pinturas → titan_buscar_imagenes.py\n' +
              '\nUna vez aprobada la imagen en la galería de revisión y sincronizada con ' +
              'sincronizar_drive_sheet.py, el producto reaparecerá automáticamente en el catálogo.';
  }

  MailApp.sendEmail(CONFIG_EMAIL_SAGE.emailResumen, asunto, cuerpo);
}

function asegurarEtiqueta_(nombre) {
  if (!GmailApp.getUserLabelByName(nombre)) {
    GmailApp.createLabel(nombre);
  }
}

/**
 * EJECUTAR UNA SOLA VEZ (manualmente, desde el editor) para crear el
 * disparador automático. No hace falta volver a ejecutarla después.
 */
function crearTriggerRevisionCorreoSage() {
  // Evita crear el trigger duplicado si ya existe
  const yaExiste = ScriptApp.getProjectTriggers()
    .some(t => t.getHandlerFunction() === 'procesarCorreoRegistroProductos');
  if (yaExiste) {
    Logger.log('El trigger ya existe, no se crea otro.');
    return;
  }
  ScriptApp.newTrigger('procesarCorreoRegistroProductos')
    .timeBased()
    .everyMinutes(30)
    .create();
  Logger.log('Trigger creado: revisión de correo de Sage cada 30 minutos.');
}

/**
 * Utilidad para probar el procesado sin esperar al trigger: revisa
 * inmediatamente si hay correos pendientes.
 */
function probarProcesarCorreoAhora() {
  procesarCorreoRegistroProductos();
}
