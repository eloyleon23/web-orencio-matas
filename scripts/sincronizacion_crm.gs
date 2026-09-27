// ── Aviso automático de sincronización de productos desde el CRM ──
//
// Este archivo es una REFERENCIA para pegar en el MISMO proyecto de Apps
// Script que ya atiende panel_admin.html (el Web App detrás de
// URL_BASE) — ese proyecto no está en este repositorio, así que este
// código no se despliega solo. Pégalo en un archivo .gs nuevo de ese
// proyecto y sigue los 3 pasos de más abajo.
//
// Qué hace:
//   1) Guarda en una fila dedicada de la hoja de Configuración la fecha
//      y el resumen de cada sincronización real (la que ya lee el Excel
//      adjunto que manda el CRM por correo).
//   2) Un trigger diario a las 10:00 revisa esa fila y, si hace 7 días o
//      más que no se sincroniza Y el envío automático está habilitado,
//      manda un correo de aviso pidiendo el Excel actualizado.
//   3) Añade 3 acciones nuevas al panel: consultar estado, activar/
//      desactivar el envío automático, y forzar el envío bajo demanda
//      (este último manda el correo SIEMPRE, sin mirar fecha ni si el
//      automático está activado — tal cual se pidió).
//
// ─── PASO 1 — columnas en tu hoja de Configuración ───
// Ajusta SHEET_NAME_CONFIG_CRM abajo al nombre real de esa pestaña.
// Añade estas columnas en su fila de cabecera (no importa el orden, se
// buscan por nombre) — si falta alguna, el propio código la crea sola
// la primera vez que se ejecuta cualquier función de este archivo:
//   proceso | ultima_sincronizacion | resumen_ultima_sincronizacion |
//   envio_automatico_habilitado | emails_notificacion | ultimo_aviso_enviado
//
// La fila para este proceso concreto (proceso = "sync_crm_productos")
// también se crea sola la primera vez, con envío automático
// DESHABILITADO y tu email en emails_notificacion — así puedes probarlo
// entero sin riesgo de que salga un correo real al administrador del
// CRM todavía. Cuando quieras avisar también a esa persona, añade su
// email en la misma celda separado por coma (ej:
// "eloyleon23@gmail.com, admin@crm-proveedor.com").
//
// ─── PASO 2 — enlazar tu script de sincronización real ───
// Al final de tu flujo actual que lee el Excel del CRM y actualiza la
// hoja Productos, añade una llamada a esto (con los datos reales que
// ya calcules ahí):
//   registrarResultadoSincronizacionCRM({
//     exito: true,        // false si el proceso falló
//     nuevos: 12,          // productos nuevos añadidos
//     actualizados: 34,    // productos existentes actualizados
//     errores: 0,          // filas del Excel que no se pudieron procesar
//     detalle: 'texto libre opcional',
//   });
// No hace falta tocar nada más de ese script.
//
// ─── PASO 3 — trigger diario ───
// En el editor de Apps Script → Activadores (reloj, barra lateral) →
// Añadir activador:
//   Función a ejecutar: revisarSincronizacionCRMProgramada
//   Origen del evento: Basado en tiempo
//   Tipo: Temporizador diario, entre las 10:00 y las 11:00
//
// ─── PASO 4 — enrutar las 3 acciones nuevas en tu doPost real ───
// Tu Web App ya tiene un doPost con un enrutador de "accion" (así
// funcionan panel_validar_pin, panel_config, panel_ejecutar, etc.).
// Añádele estas tres líneas, junto a las que ya tengas:
//   if (data.accion === 'panel_crm_sync_estado')        return panelCrmSyncEstado(data);
//   if (data.accion === 'panel_crm_sync_toggle')         return panelCrmSyncToggle(data);
//   if (data.accion === 'panel_crm_sync_enviar_ahora')   return panelCrmSyncEnviarAhora(data);
// (se asume que el PIN ya se valida antes de esto, igual que con el
// resto de acciones "panel_*" existentes — si tu enrutador ya lo hace
// de forma centralizada, no hace falta repetirlo aquí).

const SHEET_NAME_CONFIG_CRM = 'Configuración'; // ajusta si tu pestaña se llama distinto
const PROCESO_SYNC_CRM = 'sync_crm_productos';
const DIAS_AVISO_SYNC_CRM = 7;
const CAMPOS_REQUERIDOS_CRM = [
  'referencia', 'nombre', 'marca', 'area', 'tipologia',
  'precio_sin_iva', 'iva', 'oferta',
];
const COLUMNAS_CONFIG_CRM = [
  'proceso', 'ultima_sincronizacion', 'resumen_ultima_sincronizacion',
  'envio_automatico_habilitado', 'emails_notificacion', 'ultimo_aviso_enviado',
];

function _obtenerHojaConfigCRM_() {
  // SHEET_ID ya está definido en productos.gs, en el mismo proyecto.
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_CONFIG_CRM);
  if (!sheet) throw new Error('No se encuentra la hoja "' + SHEET_NAME_CONFIG_CRM + '"');
  return sheet;
}

// Localiza (o crea, la primera vez) la fila de este proceso — nunca por
// número de fila fijo, siempre buscando la columna "proceso", para que
// no se rompa si se añaden o reordenan filas de configuración de otros
// procesos en la misma hoja.
function _filaConfigSyncCRM_() {
  const sheet = _obtenerHojaConfigCRM_();
  let headers = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0]
    : [];
  const colIndex = {};
  COLUMNAS_CONFIG_CRM.forEach(function (nombre) {
    let idx = headers.indexOf(nombre);
    if (idx === -1) {
      idx = headers.length;
      headers.push(nombre);
      sheet.getRange(1, idx + 1).setValue(nombre);
    }
    colIndex[nombre] = idx + 1; // 1-based, para getRange
  });

  const lastRow = sheet.getLastRow();
  let fila = -1;
  if (lastRow > 1) {
    const valoresProceso = sheet.getRange(2, colIndex['proceso'], lastRow - 1, 1).getValues();
    for (let i = 0; i < valoresProceso.length; i++) {
      if (String(valoresProceso[i][0]) === PROCESO_SYNC_CRM) { fila = i + 2; break; }
    }
  }
  if (fila === -1) {
    fila = Math.max(lastRow + 1, 2);
    sheet.getRange(fila, colIndex['proceso']).setValue(PROCESO_SYNC_CRM);
    sheet.getRange(fila, colIndex['envio_automatico_habilitado']).setValue('No');
    sheet.getRange(fila, colIndex['emails_notificacion']).setValue('eloyleon23@gmail.com');
  }
  return { sheet: sheet, fila: fila, colIndex: colIndex };
}

// ─── Llamar desde tu script de sincronización real, al terminar (PASO 2) ───
function registrarResultadoSincronizacionCRM(resultado) {
  const ctx = _filaConfigSyncCRM_();
  const ahora = Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM/yyyy HH:mm');
  const partes = [];
  if (resultado.nuevos !== undefined) partes.push(resultado.nuevos + ' nuevos');
  if (resultado.actualizados !== undefined) partes.push(resultado.actualizados + ' actualizados');
  if (resultado.errores) partes.push(resultado.errores + ' con error');
  let resumen = (resultado.exito === false ? '⚠️ Sincronización con errores' : '✓ Sincronización correcta')
    + (partes.length ? ' — ' + partes.join(', ') : '');
  if (resultado.detalle) resumen += ' · ' + resultado.detalle;

  ctx.sheet.getRange(ctx.fila, ctx.colIndex['ultima_sincronizacion']).setValue(ahora);
  ctx.sheet.getRange(ctx.fila, ctx.colIndex['resumen_ultima_sincronizacion']).setValue(resumen);
}

function _leerEstadoSyncCRM_() {
  const ctx = _filaConfigSyncCRM_();
  const fila = ctx.sheet.getRange(ctx.fila, 1, 1, ctx.sheet.getLastColumn()).getValues()[0];
  const get = function (nombre) { return fila[ctx.colIndex[nombre] - 1]; };
  const habilitadoTexto = String(get('envio_automatico_habilitado') || '').trim().toLowerCase();
  return {
    ultimaSincronizacion: get('ultima_sincronizacion') || '',
    resumen: get('resumen_ultima_sincronizacion') || '',
    habilitado: habilitadoTexto === 'sí' || habilitadoTexto === 'si',
    emails: String(get('emails_notificacion') || '').split(/[,;]/).map(function (e) { return e.trim(); }).filter(Boolean),
    ultimoAviso: get('ultimo_aviso_enviado') || '',
    ctx: ctx,
  };
}

// La fecha se guarda como texto "dd/MM/yyyy HH:mm" (Utilities.formatDate)
// — si la celda ya es una fecha real de Sheets, Apps Script la entrega
// directamente como Date y no hace falta parsear nada.
function _parsearFechaConfig_(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})[ T]?(\d{2})?:?(\d{2})?/.exec(String(valor));
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
}

function _enviarAvisoSincronizacionCRM_(estado, forzado) {
  if (!estado.emails.length) {
    throw new Error('No hay ningún email en "emails_notificacion" — no se puede enviar el aviso.');
  }
  const fechaUltima = _parsearFechaConfig_(estado.ultimaSincronizacion);
  const diasSinSincronizar = fechaUltima
    ? Math.floor((Date.now() - fechaUltima.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const asunto = 'Sincronización de productos pendiente — Orencio Matas y Hnos';
  const lineaFecha = fechaUltima
    ? 'Última sincronización: ' + estado.ultimaSincronizacion + ' (hace ' + diasSinSincronizar + ' día' + (diasSinSincronizar === 1 ? '' : 's') + ').'
    : 'No hay ninguna sincronización registrada todavía.';
  const cuerpo = [
    'Hola,',
    '',
    forzado
      ? 'Aviso solicitado manualmente desde el panel de administración.'
      : 'Aviso automático: hace ' + DIAS_AVISO_SYNC_CRM + ' días o más que no se sincronizan los productos desde el CRM.',
    '',
    lineaFecha,
    estado.resumen ? ('Resumen de la última sincronización: ' + estado.resumen) : '',
    '',
    'Por favor, envía el listado en Excel de productos a actualizar, con estos campos informados para cada producto:',
    CAMPOS_REQUERIDOS_CRM.map(function (c) { return '  - ' + c; }).join('\n'),
    '',
    'Un saludo,',
    'Orencio Matas y Hnos, S.L.',
  ].filter(function (l) { return l !== ''; }).join('\n');

  estado.emails.forEach(function (email) { MailApp.sendEmail(email, asunto, cuerpo); });

  const ahora = Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM/yyyy HH:mm');
  estado.ctx.sheet.getRange(estado.ctx.fila, estado.ctx.colIndex['ultimo_aviso_enviado']).setValue(ahora);
}

// ─── Trigger diario (PASO 3) ───
function revisarSincronizacionCRMProgramada() {
  const estado = _leerEstadoSyncCRM_();
  if (!estado.habilitado) {
    console.log('CRM sync: envío automático deshabilitado — no se hace nada.');
    return;
  }
  const fechaUltima = _parsearFechaConfig_(estado.ultimaSincronizacion);
  const diasSinSincronizar = fechaUltima
    ? Math.floor((Date.now() - fechaUltima.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity; // nunca se ha sincronizado -> avisar sí o sí
  if (diasSinSincronizar < DIAS_AVISO_SYNC_CRM) {
    console.log('CRM sync: hace ' + diasSinSincronizar + ' días de la última sincronización — todavía no toca avisar.');
    return;
  }
  _enviarAvisoSincronizacionCRM_(estado, false);
}

// ─── Acciones nuevas para el panel (PASO 4) ───
function panelCrmSyncEstado(data) {
  try {
    const estado = _leerEstadoSyncCRM_();
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      resultado: {
        ultimaSincronizacion: estado.ultimaSincronizacion,
        resumen: estado.resumen,
        habilitado: estado.habilitado,
        emails: estado.emails,
        ultimoAviso: estado.ultimoAviso,
      },
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function panelCrmSyncToggle(data) {
  try {
    const ctx = _filaConfigSyncCRM_();
    ctx.sheet.getRange(ctx.fila, ctx.colIndex['envio_automatico_habilitado']).setValue(data.habilitar ? 'Sí' : 'No');
    return ContentService.createTextOutput(JSON.stringify({
      success: true, resultado: { habilitado: !!data.habilitar },
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Envío bajo demanda — a propósito NO comprueba fecha ni si el envío
// automático está habilitado, tal cual se pidió: "esta sí o sí enviará
// sin validar si ha pasado una semana o si está habilitado el proceso
// automático".
function panelCrmSyncEnviarAhora(data) {
  try {
    const estado = _leerEstadoSyncCRM_();
    _enviarAvisoSincronizacionCRM_(estado, true);
    return ContentService.createTextOutput(JSON.stringify({
      success: true, resultado: { enviadoA: estado.emails },
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Prueba manual desde el editor de Apps Script (Ejecutar ▶) ───
function testEnviarAvisoSincronizacionCRMForzado() {
  panelCrmSyncEnviarAhora({});
}

function testRegistrarResultadoSincronizacionCRM() {
  registrarResultadoSincronizacionCRM({ exito: true, nuevos: 3, actualizados: 12, errores: 0 });
}
