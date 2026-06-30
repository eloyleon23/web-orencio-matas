// ── Script de Google Apps Script para registrar productos con imágenes incorrectas ──
// ── Y para procesar solicitudes de catálogos personalizados ──
//
// Este script debe desplegarse como Web App en Google Apps Script
// Configuración del despliegue:
// - Ejecutar como: Yo
// - Quién tiene acceso: Cualquier persona
//
// CONFIGURACIÓN:
// 1. En el editor de Google Apps Script, ve a Archivo → Propiedades del proyecto
// 2. Añade una propiedad llamada 'GITHUB_TOKEN' con tu token de GitHub
// 3. El token debe tener permisos: repo y workflow

// ID de la hoja de Google Sheets
const SHEET_ID = '1T-MZUPPmhh_t4miezHVCfRCxVpWcxQgdZGNVvFeA_cw';
const SHEET_NAME_IMAGENES = 'ProductosPendientesEvaluarImagen';
const SHEET_NAME_CATALOGOS = 'SolicitudesCatalogos';

// Configuración de GitHub
const GITHUB_REPO = 'eloyleon23/web-orencio-matas';
const GITHUB_WORKFLOW_EVENT = 'enviar_catalogo_personalizado';

function doPost(e) {
  try {
    console.log('doPost recibido');
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
    if (data.accion === 'reportar_imagen') {
      return procesarReportarImagen(data);
    } else if (data.accion === 'solicitar_catalogo') {
      return procesarSolicitarCatalogo(data);
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

// ── Procesar reporte de imagen incorrecta ──
function procesarReportarImagen(data) {
  const referencia = data.referencia;
  const fecha = data.fecha;

  if (!referencia) {
    console.log('Error: Falta referencia');
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'Falta la referencia del producto' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  console.log('Abriendo spreadsheet:', SHEET_ID);
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME_IMAGENES);

  // Crear la hoja si no existe
  if (!sheet) {
    console.log('Creando hoja:', SHEET_NAME_IMAGENES);
    sheet = ss.insertSheet(SHEET_NAME_IMAGENES);
    sheet.appendRow(['Referencia', 'FechaRevision']);
  }

  // Verificar columnas
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  console.log('Headers:', headers);
  if (!headers.includes('Referencia') || !headers.includes('FechaRevision')) {
    console.log('Reconfigurando headers');
    sheet.clear();
    sheet.appendRow(['Referencia', 'FechaRevision']);
  }

  // Verificar si el producto ya está registrado
  const lastRow = sheet.getLastRow();
  console.log('Última fila:', lastRow);

  if (lastRow > 1) {
    const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const dataValues = dataRange.getValues();
    console.log('Productos existentes:', dataValues.length);

    for (let i = 0; i < dataValues.length; i++) {
      if (dataValues[i][0] === referencia) {
        // Producto ya registrado, actualizar fecha
        console.log('Producto ya existe, actualizando fecha');
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
  }

  // Producto no registrado, añadir nueva fila
  console.log('Añadiendo nuevo producto');
  const fechaFormateada = Utilities.formatDate(
    new Date(fecha),
    'Europe/Madrid',
    'dd/MM/yyyy HH:mm'
  );
  sheet.appendRow([referencia, fechaFormateada]);
  console.log('Producto registrado correctamente');

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, message: 'Producto registrado' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ── Procesar solicitud de catálogo personalizado ──
function procesarSolicitarCatalogo(data) {
  const email = data.email;
  const filtros = data.filtros;
  const resumen_filtros = data.resumen_filtros;

  if (!email) {
    console.log('Error: Falta email');
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: 'Falta el email' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  console.log('Procesando solicitud de catálogo para:', email);

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME_CATALOGOS);

  // Crear la hoja si no existe
  if (!sheet) {
    console.log('Creando hoja:', SHEET_NAME_CATALOGOS);
    sheet = ss.insertSheet(SHEET_NAME_CATALOGOS);
    sheet.appendRow(['Email', 'Fecha', 'Filtros', 'ResumenFiltros', 'Estado']);
  }

  // Añadir nueva solicitud
  const fechaFormateada = Utilities.formatDate(
    new Date(),
    'Europe/Madrid',
    'dd/MM/yyyy HH:mm'
  );
  sheet.appendRow([
    email,
    fechaFormateada,
    JSON.stringify(filtros),
    resumen_filtros,
    'Procesando'
  ]);

  console.log('Solicitud de catálogo registrada');

  // Disparar workflow de GitHub Actions para generar y enviar el PDF
  const resultadoWorkflow = dispararWorkflowGitHub(email, filtros, resumen_filtros);

  if (resultadoWorkflow.success) {
    console.log('Workflow disparado correctamente');
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: 'Solicitud registrada. Recibirás el catálogo personalizado en tu correo en unos minutos.'
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } else {
    console.error('Error al disparar workflow:', resultadoWorkflow.error);
    // Actualizar estado a error
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 5).setValue('Error');

    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: 'Error al procesar la solicitud. Contacta con nosotros directamente.'
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Disparar workflow de GitHub Actions ──
function dispararWorkflowGitHub(email, filtros, resumen_filtros) {
  try {
    const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');

    if (!token) {
      console.error('Error: GITHUB_TOKEN no configurado en propiedades del script');
      return { success: false, error: 'Token de GitHub no configurado' };
    }

    const url = `https://api.github.com/repos/${GITHUB_REPO}/dispatches`;
    const payload = {
      event_type: GITHUB_WORKFLOW_EVENT,
      client_payload: {
        email: email,
        filtros: filtros,
        resumen_filtros: resumen_filtros
      }
    };

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    console.log('Disparando workflow de GitHub Actions...');
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log('Respuesta GitHub:', responseCode, responseText);

    if (responseCode === 204) {
      return { success: true };
    } else {
      console.error('Error en respuesta de GitHub:', responseText);
      return { success: false, error: responseText };
    }

  } catch (error) {
    console.error('Error al disparar workflow:', error);
    return { success: false, error: error.toString() };
  }
}

// ── Función de prueba para ejecutar desde el editor de scripts ──
function testDoPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        accion: 'solicitar_catalogo',
        email: 'test@example.com',
        filtros: { texto: 'test' },
        resumen_filtros: 'Filtros de prueba'
      })
    }
  };
  const result = doPost(testData);
  console.log(result.getContent());
}
