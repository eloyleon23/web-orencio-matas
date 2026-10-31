// ── Script de Google Apps Script para las estadísticas de Espacio Creativo ──
//
// Registra en una hoja de cálculo los eventos que envían los minijuegos de
// lab/ (ver lab/js/estadisticas-juegos.js) — inicio de partida, tiempo
// activo jugado y conversión al buscador — y sirve esas estadísticas ya
// agregadas por juego a la modal de administración de lab/index.html (ver
// lab/js/estadisticas-admin.js), para poder verlas con gráficas dentro del
// propio sitio, sin depender de ninguna herramienta externa.
//
// Este script debe desplegarse como Web App en Google Apps Script:
// 1. Crea un proyecto nuevo en https://script.google.com (o "Archivo" ▸
//    "Nuevo proyecto" si prefieres añadirlo al mismo proyecto que ya usa
//    panel_admin.html) y pega este archivo.
// 2. Crea una hoja de cálculo de Google en blanco (puede ser nueva o una
//    pestaña dentro de una ya existente) y copia su ID (la parte de la URL
//    entre /d/ y /edit) en SHEET_ID más abajo.
// 3. Despliega como Web App:
//    - Ejecutar como: Yo
//    - Quién tiene acceso: Cualquier persona
// 4. Copia la URL de despliegue (termina en /exec) y pégala como
//    URL_BACKEND_ESTADISTICAS en lab/js/estadisticas-juegos.js — o, más
//    cómodo, pégala directamente en la propia modal de estadísticas del
//    sitio (lab/index.html ▸ botón "📊 Estadísticas"), que la recuerda en
//    este navegador sin tener que tocar código.
//
// No hace falta ningún PIN nuevo: la validación del PIN para VER las
// estadísticas (acción "obtener_estadisticas_juegos") reutiliza, mediante
// una llamada HTTP a su propio endpoint público, el mismo PIN que ya usa
// panel_admin.html (acción "panel_validar_pin") — así es literalmente el
// mismo código, sin duplicarlo ni tener que conocer su valor aquí.
// REGISTRAR un evento ("registrar_evento_juego"), en cambio, no pide PIN
// — lo llaman automáticamente todos los visitantes mientras juegan, igual
// que un evento de analítica cualquiera.

const SHEET_ID = 'PEGA_AQUÍ_EL_ID_DE_TU_HOJA_DE_CÁLCULO';
const SHEET_NAME = 'EstadisticasJuegos';
const COLUMNAS = ['timestamp', 'tipo', 'juego', 'segundos', 'motivo'];

// URL del mismo backend que ya usa panel_admin.html — se reutiliza tal
// cual su acción "panel_validar_pin" para no duplicar el PIN en ningún
// sitio nuevo.
const URL_VALIDACION_PIN = 'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec';

function doPost(e) {
  try {
    if (!e || !e.postData) {
      return respuesta_({ success: false, error: 'No se recibieron datos' });
    }

    const data = JSON.parse(e.postData.contents);

    if (data.accion === 'registrar_evento_juego') {
      registrarEvento_(data);
      return respuesta_({ success: true });
    }

    if (data.accion === 'obtener_estadisticas_juegos') {
      if (!validarPin_(data.pin)) {
        return respuesta_({ success: false, error: 'PIN incorrecto.' });
      }
      return respuesta_({ success: true, datos: calcularEstadisticas_() });
    }

    return respuesta_({ success: false, error: 'Acción no reconocida' });
  } catch (error) {
    return respuesta_({ success: false, error: String(error) });
  }
}

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function hojaEstadisticas_() {
  const libro = SpreadsheetApp.openById(SHEET_ID);
  let hoja = libro.getSheetByName(SHEET_NAME);
  if (!hoja) {
    hoja = libro.insertSheet(SHEET_NAME);
    hoja.appendRow(COLUMNAS);
  }
  return hoja;
}

function registrarEvento_(data) {
  const hoja = hojaEstadisticas_();
  hoja.appendRow([
    new Date().toISOString(),
    String(data.tipo || ''),
    String(data.juego || ''),
    data.segundos != null ? Number(data.segundos) : '',
    String(data.motivo || ''),
  ]);
}

// Reutiliza el PIN de panel_admin.html llamando a su propio endpoint
// público, en vez de guardar/comprobar un PIN propio aquí.
function validarPin_(pin) {
  if (!pin) return false;
  try {
    const resp = UrlFetchApp.fetch(URL_VALIDACION_PIN, {
      method: 'post',
      contentType: 'text/plain;charset=utf-8',
      payload: JSON.stringify({ accion: 'panel_validar_pin', pin: pin }),
      muteHttpExceptions: true,
    });
    const d = JSON.parse(resp.getContentText());
    return !!d.success;
  } catch (err) {
    return false;
  }
}

function calcularEstadisticas_() {
  const hoja = hojaEstadisticas_();
  const filas = hoja.getDataRange().getValues();
  filas.shift(); // cabecera

  const porJuego = {}; // { juego: { partidas, sumaSegundos, muestrasSegundos, conversiones } }

  function entrada_(juego) {
    if (!porJuego[juego]) {
      porJuego[juego] = { partidas: 0, sumaSegundos: 0, muestrasSegundos: 0, conversiones: 0 };
    }
    return porJuego[juego];
  }

  filas.forEach((fila) => {
    const tipo = fila[1];
    const juego = fila[2] || '(desconocido)';
    const segundos = fila[3];

    if (tipo === 'inicio') {
      entrada_(juego).partidas += 1;
    } else if (tipo === 'tiempo') {
      const e = entrada_(juego);
      e.sumaSegundos += Number(segundos) || 0;
      e.muestrasSegundos += 1;
    } else if (tipo === 'conversion') {
      entrada_(juego).conversiones += 1;
    }
  });

  const juegos = Object.keys(porJuego).map((juego) => {
    const e = porJuego[juego];
    return {
      juego,
      partidas: e.partidas,
      tiempoMedioSegundos: e.muestrasSegundos > 0 ? Math.round(e.sumaSegundos / e.muestrasSegundos) : 0,
      conversiones: e.conversiones,
    };
  });

  const totalPartidas = juegos.reduce((acc, j) => acc + j.partidas, 0);
  const totalConversiones = juegos.reduce((acc, j) => acc + j.conversiones, 0);

  return {
    juegos,
    totalPartidas,
    totalConversiones,
    actualizado: new Date().toISOString(),
  };
}
