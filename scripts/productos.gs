// ── Script de Google Apps Script para la hoja Productos ──
//
// Este script maneja las operaciones sobre la hoja Productos:
// - Validación de imágenes
// - Actualización de campos de validación
//
// Este script debe desplegarse como Web App en Google Apps Script
// Configuración del despliegue:
// - Ejecutar como: Yo
// - Quién tiene acceso: Cualquier persona

const SHEET_ID = '1T-MZUPPmhh_t4miezHVCfRCxVpWcxQgdZGNVvFeA_cw';
const SHEET_NAME_PRODUCTOS = 'Productos';

function doPost(e) {
  try {
    console.log('doPost recibido en productos.gs');
    console.log('e:', e);

    if (!e || !e.postData) {
      console.log('Error: No hay postData');
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'No se recibieron datos' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    console.log('Datos recibidos:', data);
    console.log('Tipo de acción:', data.accion);

    // Enrutador según el tipo de acción
    if (data.accion === 'validar_imagen') {
      return procesarValidarImagen(data);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Acción no reconocida' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    console.error('Error en doPost:', error);
    console.error('Stack:', error.stack);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Procesar validación de imagen ──
function procesarValidarImagen(data) {
  const referencia = data.referencia;

  if (!referencia) {
    console.log('Error: Falta referencia en validar_imagen');
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'Falta la referencia del producto' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  console.log('Procesando validación de imagen para referencia:', referencia);

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_PRODUCTOS);

  if (!sheet) {
    console.log('Error: Hoja Productos no encontrada');
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'Hoja Productos no encontrada' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Obtener headers para encontrar columnas
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  console.log('Headers de Productos:', headers);

  const colReferencia = headers.indexOf('referencia');
  const colImagenValidada = headers.indexOf('imagen_validada');
  const colFechaActualizacion = headers.indexOf('fecha_actualizacion_imagen');

  if (colReferencia === -1) {
    console.log('Error: Columna referencia no encontrada');
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'Columna referencia no encontrada' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Buscar producto por referencia
  const lastRow = sheet.getLastRow();
  console.log('Última fila en Productos:', lastRow);

  if (lastRow <= 1) {
    console.log('Error: No hay productos en la hoja');
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'No hay productos en la hoja' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  const dataValues = dataRange.getValues();
  console.log('Productos a buscar:', dataValues.length);

  let encontrado = false;
  let filaEncontrada = -1;

  for (let i = 0; i < dataValues.length; i++) {
    if (String(dataValues[i][colReferencia]) === String(referencia)) {
      encontrado = true;
      filaEncontrada = i + 2; // +2 porque empieza en fila 2 (headers en fila 1)
      console.log('Producto encontrado en fila:', filaEncontrada);
      break;
    }
  }

  if (!encontrado) {
    console.log('Error: Producto no encontrado con referencia:', referencia);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'Producto no encontrado' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Actualizar imagen_validada y fecha_actualizacion_imagen
  const fechaActual = Utilities.formatDate(
    new Date(),
    'Europe/Madrid',
    'dd/MM/yyyy HH:mm'
  );

  if (colImagenValidada !== -1) {
    sheet.getRange(filaEncontrada, colImagenValidada + 1).setValue('Sí');
    console.log('Actualizado imagen_validada a Sí');
  }

  if (colFechaActualizacion !== -1) {
    sheet.getRange(filaEncontrada, colFechaActualizacion + 1).setValue(fechaActual);
    console.log('Actualizado fecha_actualizacion_imagen:', fechaActual);
  }

  console.log('Imagen validada correctamente');

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, message: 'Imagen validada correctamente' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ── Función de prueba para validar imagen ──
function testValidarImagen() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        accion: 'validar_imagen',
        referencia: '3033103001'
      })
    }
  };
  const result = doPost(testData);
  console.log(result.getContent());
}
