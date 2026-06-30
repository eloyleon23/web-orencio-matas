// ── Script de Google Apps Script para registrar productos con imágenes incorrectas ──
// 
// Este script debe desplegarse como Web App en Google Apps Script
// Configuración del despliegue:
// - Ejecutar como: Yo
// - Quién tiene acceso: Cualquier persona
//
// La hoja debe tener el nombre: "ProductosPendientesEvaluarImagen"
// Columnas: Referencia | FechaRevision

// ID de la hoja de Google Sheets
const SHEET_ID = '1T-MZUPPmhh_t4miezHVCfRCxVpWcxQgdZGNVvFeA_cw';
const SHEET_NAME = 'ProductosPendientesEvaluarImagen';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const referencia = data.referencia;
    const fecha = data.fecha;

    if (!referencia) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Falta la referencia del producto' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Crear la hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Referencia', 'FechaRevision']);
    }

    // Verificar columnas
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (!headers.includes('Referencia') || !headers.includes('FechaRevision')) {
      sheet.clear();
      sheet.appendRow(['Referencia', 'FechaRevision']);
    }

    // Verificar si el producto ya está registrado
    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    const dataValues = dataRange.getValues();
    
    for (let i = 0; i < dataValues.length; i++) {
      if (dataValues[i][0] === referencia) {
        // Producto ya registrado, actualizar fecha
        const fechaFormateada = Utilities.formatDate(
          new Date(fecha), 
          'Europe/Madrid', 
          'dd/MM/yyyy HH:mm'
        );
        sheet.getRange(i + 2, 2).setValue(fechaFormateada);
        
        return ContentService.createTextOutput(
          JSON.stringify({ success: true, message: 'Producto actualizado' })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Producto no registrado, añadir nueva fila
    const fechaFormateada = Utilities.formatDate(
      new Date(fecha), 
      'Europe/Madrid', 
      'dd/MM/yyyy HH:mm'
    );
    sheet.appendRow([referencia, fechaFormateada]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'Producto registrado' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Función de prueba para ejecutar desde el editor de scripts ──
function testDoPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        referencia: 'TEST001',
        fecha: new Date().toISOString()
      })
    }
  };
  const result = doPost(testData);
  console.log(result.getContent());
}
