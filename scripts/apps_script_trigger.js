/**
 * APPS SCRIPT — Orencio Matas y Hermanos, S.L.
 * 
 * Instalación:
 * 1. Abre el Google Sheet "Productos"
 * 2. Extensiones → Apps Script
 * 3. Pega este código completo
 * 4. Configura las constantes GITHUB_TOKEN y REPO_OWNER/REPO_NAME
 * 5. Guarda y ejecuta setupTrigger() UNA VEZ para activar el trigger automático
 */

// ── Configuración ──────────────────────────────────────────────────────────
const GITHUB_TOKEN  = 'TU_GITHUB_TOKEN_AQUI';  // Personal Access Token con permisos repo+workflow
const REPO_OWNER    = 'eloyleon23';
const REPO_NAME     = 'web-orencio-matas';
const WORKFLOW_FILE = 'generar_catalogos.yml';

// Tiempo mínimo entre ejecuciones (evitar spam): 5 minutos
const COOLDOWN_MINUTOS = 5;

// ── Trigger principal: se ejecuta al editar el Sheet ───────────────────────
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  
  // Solo actuar si se edita la hoja "Productos"
  if (sheet.getName() !== 'Productos') return;
  
  // Solo actuar si se edita una columna relevante
  const col = e.range.getColumn();
  const COLS_RELEVANTES = [1,2,3,4,5,6,7,8,9,10]; // todas las columnas
  if (!COLS_RELEVANTES.includes(col)) return;
  
  // Control de cooldown para no disparar en cada pulsación de tecla
  const props = PropertiesService.getScriptProperties();
  const ultima = props.getProperty('ultima_ejecucion');
  const ahora  = Date.now();
  
  if (ultima && (ahora - parseInt(ultima)) < COOLDOWN_MINUTOS * 60 * 1000) {
    console.log('Cooldown activo, esperando...');
    return;
  }
  
  props.setProperty('ultima_ejecucion', ahora.toString());
  dispararWorkflow();
}

// ── Disparar GitHub Actions ─────────────────────────────────────────────────
function dispararWorkflow() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;
  
  const payload = JSON.stringify({
    event_type: 'generar_catalogos',
    client_payload: {
      triggered_by: 'google_sheets',
      timestamp: new Date().toISOString()
    }
  });
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: payload,
    muteHttpExceptions: true
  };
  
  try {
    const resp = UrlFetchApp.fetch(url, options);
    const code = resp.getResponseCode();
    
    if (code === 204) {
      console.log('✓ GitHub Actions disparado correctamente');
      mostrarToast('Catálogos en generación (tardará ~2 min)', 'Orencio Matas');
    } else {
      console.error(`Error ${code}: ${resp.getContentText()}`);
    }
  } catch (err) {
    console.error('Error al contactar GitHub:', err);
  }
}

// ── Mostrar notificación en el Sheet ───────────────────────────────────────
function mostrarToast(mensaje, titulo) {
  SpreadsheetApp.getActiveSpreadsheet().toast(mensaje, titulo, 5);
}

// ── Activar el trigger (ejecutar UNA VEZ manualmente) ─────────────────────
function setupTrigger() {
  // Eliminar triggers anteriores para evitar duplicados
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'onEdit') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // Crear trigger de edición instalable (más potente que el simple onEdit)
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  
  mostrarToast('Trigger activado. Los catálogos se generarán automáticamente al editar.', '✓ Configurado');
  console.log('✓ Trigger instalado correctamente');
}

// ── Forzar generación manual ────────────────────────────────────────────────
function generarAhora() {
  dispararWorkflow();
}
