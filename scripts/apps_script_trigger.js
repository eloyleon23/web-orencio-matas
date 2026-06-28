// ── Configuración ──────────────────────────────────────────────────────────
const GITHUB_TOKEN        = 'TU_GITHUB_TOKEN_AQUI';
const REPO_OWNER          = 'eloyleon23';
const REPO_NAME           = 'web-orencio-matas';
const COOLDOWN_MINUTOS    = 5;
const DRIVE_IMAGENES_ID   = '13O7N_q6IisAhsvSoXogKJ2PUDVQfUKRe';

// ── Menú personalizado ─────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📦 Catálogos Orencio Matas')
    .addItem('🔄 Generar catálogos ahora', 'generarAhora')
    .addSeparator()
    .addItem('➕ Añadir / Editar producto', 'mostrarFormularioProducto')
    .addSeparator()
    .addItem('📥 Sincronizar RegistroProductos → Productos', 'sincronizarRegistroProductos')
    .addItem('🚫 Procesar bajas de BajaProductos', 'darDeBajaProductos')
    .addSeparator()
    .addItem('🔄 Actualizar catálogo Zaphiro', 'actualizarZaphiro')
    .addSeparator()
    .addItem('📖 Ver guía de uso', 'abrirAyuda')
    .addToUi();
}

// ── Trigger de edición ─────────────────────────────────────────────────────
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== 'Productos') return;
  const props = PropertiesService.getScriptProperties();
  const ultima = props.getProperty('ultima_ejecucion');
  const ahora  = Date.now();
  if (ultima && (ahora - parseInt(ultima)) < COOLDOWN_MINUTOS * 60 * 1000) return;
  props.setProperty('ultima_ejecucion', ahora.toString());
  dispararWorkflow();
}

// ── Disparar GitHub Actions ─────────────────────────────────────────────────
function dispararWorkflow() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;
  const payload = JSON.stringify({
    event_type: 'generar_catalogos',
    client_payload: { triggered_by: 'google_sheets', timestamp: new Date().toISOString() }
  });
  const options = {
    method: 'post', contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: payload, muteHttpExceptions: true
  };
  const resp = UrlFetchApp.fetch(url, options);
  if (resp.getResponseCode() === 204) {
    SpreadsheetApp.getActiveSpreadsheet()
      .toast('Los catálogos se están generando. En 1-2 minutos estarán disponibles en la web.', '✓ Generación iniciada', 6);
  } else {
    SpreadsheetApp.getActiveSpreadsheet()
      .toast('Error al conectar con GitHub. Revisa el token.', '⚠ Error', 5);
    console.error(resp.getContentText());
  }
}

function generarAhora() { dispararWorkflow(); }

// ── Actualizar Zaphiro ─────────────────────────────────────────────────────
function actualizarZaphiro() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;
  const options = {
    method: 'post', contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: JSON.stringify({ event_type: 'actualizar_zaphiro' }),
    muteHttpExceptions: true
  };
  const resp = UrlFetchApp.fetch(url, options);
  if (resp.getResponseCode() === 204)
    SpreadsheetApp.getActiveSpreadsheet().toast('Actualizando catálogo Zaphiro...', '✓ Enviado', 5);
}

// ── Buscar producto por referencia ─────────────────────────────────────────
function buscarProductoPorReferencia(referencia) {
  if (!referencia) return null;
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Productos');
  const data    = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim().toLowerCase().replace(/ /g,'_'));
  const colRef  = headers.indexOf('referencia');
  if (colRef === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][colRef].toString().trim().toUpperCase() === referencia.trim().toUpperCase()) {
      const producto = {};
      headers.forEach((h, j) => { producto[h] = data[i][j] !== undefined ? data[i][j].toString() : ''; });
      producto._fila = i + 1; // fila real en el sheet (1-indexed)
      return producto;
    }
  }
  return null;
}

// ── Buscar imagen en Drive por referencia ──────────────────────────────────
function buscarImagenEnDrive(referencia) {
  if (!referencia) return { id: '', encontrada: false };
  try {
    const carpeta = DriveApp.getFolderById(DRIVE_IMAGENES_ID);
    const archivos = carpeta.getFilesByName(referencia.trim());
    if (archivos.hasNext()) {
      const archivo = archivos.next();
      return { id: archivo.getId(), encontrada: true };
    }
    return { id: '', encontrada: false };
  } catch(e) {
    console.error('Error buscando imagen:', e);
    return { id: '', encontrada: false, error: e.toString() };
  }
}

// ── Guardar producto (nuevo o actualización) ───────────────────────────────
function guardarProducto(datos, filaExistente) {
  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Productos');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/ /g,'_'));

  const ahora = Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM/yyyy HH:mm');

  const fila = headers.map(h => {
    if (h === 'fecha_registro') return ahora;
    const val = datos[h] !== undefined ? datos[h] : '';
    if (['precio_sin_iva','precio_con_iva'].includes(h) && val !== '')
      return val.toString().replace('.', ',');
    return val;
  });

  if (filaExistente) {
    // Actualización: escribir fila existente
    sheet.getRange(filaExistente, 1, 1, fila.length).setValues([fila]);
    sheet.getRange(filaExistente, 1, 1, fila.length).setBackground('#fef9c3');
  } else {
    // Alta nueva
    sheet.appendRow(fila);
    sheet.getRange(sheet.getLastRow(), 1, 1, fila.length).setBackground('#d1fae5');
  }
  SpreadsheetApp.flush();
}

// ── Formulario ─────────────────────────────────────────────────────────────
function mostrarFormularioProducto() {
  const html = HtmlService.createHtmlOutput(`
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    * { box-sizing:border-box; font-family:'Google Sans',Arial,sans-serif; margin:0; padding:0; }
    body { padding:16px; background:#f8fafc; color:#1a1a1a; font-size:13px; }
    h2 { font-size:15px; font-weight:700; margin-bottom:14px; color:#d91b1b; }
    .field { margin-bottom:10px; }
    label { display:block; font-size:11px; font-weight:600; margin-bottom:3px; color:#374151; }
    input,select { width:100%; padding:7px 9px; border:1px solid #d1d5db; border-radius:6px; font-size:12px; background:white; }
    input:focus,select:focus { outline:none; border-color:#d91b1b; }
    input:disabled,select:disabled { background:#f1f5f9; color:#94a3b8; }
    .row { display:flex; gap:8px; }
    .row .field { flex:1; }
    .hint { font-size:10px; color:#6b7280; margin-top:2px; }
    .btn-group { display:flex; gap:8px; margin-top:14px; }
    button { flex:1; padding:9px; border:none; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; }
    .btn-primary { background:#d91b1b; color:white; }
    .btn-secondary { background:#e5e7eb; color:#374151; }
    .btn-primary:hover { background:#b91c1c; }
    .btn-primary:disabled { background:#fca5a5; cursor:not-allowed; }
    #status { margin-top:8px; padding:7px 10px; border-radius:6px; font-size:11px; display:none; }
    .ok  { background:#d1fae5; color:#065f46; }
    .err { background:#fee2e2; color:#991b1b; }
    .warn { background:#fef9c3; color:#92400e; }
    .info { background:#e0f2fe; color:#0369a1; }
    .required { color:#d91b1b; }
    .badge { display:inline-block; padding:2px 7px; border-radius:10px; font-size:10px; font-weight:700; margin-left:6px; }
    .badge-nuevo { background:#d1fae5; color:#065f46; }
    .badge-editar { background:#fef9c3; color:#92400e; }
    .badge-img { background:#e0f2fe; color:#0369a1; }
    .seccion { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; margin:12px 0 6px; border-bottom:1px solid #e2e8f0; padding-bottom:3px; }
    #buscando { font-size:11px; color:#6b7280; display:none; margin-top:3px; }
  </style>
</head>
<body>
  <h2>➕ Añadir / Editar Producto <span id="badge-modo" class="badge badge-nuevo">NUEVO</span></h2>

  <div class="field">
    <label>Referencia <span class="required">*</span></label>
    <input id="referencia" type="text" placeholder="Ej: DRO001" autocomplete="off">
    <div id="buscando">🔍 Buscando producto e imagen...</div>
  </div>

  <div class="seccion">Identificación</div>

  <div class="row">
    <div class="field">
      <label>Nombre <span class="required">*</span></label>
      <input id="nombre" type="text" placeholder="Ej: Fairy Ultra Poder">
    </div>
    <div class="field">
      <label>Marca <span class="required">*</span></label>
      <input id="marca" type="text" placeholder="Ej: Fairy">
    </div>
  </div>

  <div class="row">
    <div class="field">
      <label>Área <span class="required">*</span></label>
      <select id="area">
        <option value="">-- Seleccionar --</option>
        <option value="drogueria">Droguería</option>
        <option value="perfumeria">Perfumería</option>
        <option value="pinturas">Pinturas</option>
        <option value="talleres">Talleres</option>
      </select>
    </div>
    <div class="field">
      <label>Tipología</label>
      <input id="tipologia" type="text" placeholder="Ej: Lavavajillas">
    </div>
  </div>

  <div class="seccion">Precio</div>

  <div class="row">
    <div class="field">
      <label>Sin IVA (€)</label>
      <input id="precio_sin_iva" type="number" step="0.01" placeholder="0.00">
    </div>
    <div class="field">
      <label>IVA (%)</label>
      <select id="iva">
        <option value="">--</option>
        <option value="4">4%</option>
        <option value="10">10%</option>
        <option value="21">21%</option>
      </select>
    </div>
    <div class="field">
      <label>Con IVA (€)</label>
      <input id="precio_con_iva" type="number" step="0.01" placeholder="0.00">
    </div>
  </div>

  <div class="seccion">Catálogo</div>

  <div class="row">
    <div class="field">
      <label>Mostrar precio</label>
      <select id="mostrar_precio">
        <option value="no">No</option>
        <option value="si">Sí</option>
      </select>
    </div>
    <div class="field">
      <label>Incluir en catálogo</label>
      <select id="incluir_en_catalogo">
        <option value="si">Sí</option>
        <option value="no">No</option>
      </select>
    </div>
  </div>

  <div class="row">
    <div class="field">
      <label>Oferta</label>
      <select id="oferta">
        <option value="no">No</option>
        <option value="si">Sí — etiqueta roja</option>
      </select>
    </div>
    <div class="field">
      <label>Espacios a ocupar</label>
      <select id="espacios_a_ocupar">
        <option value="1">1 — Normal (1/4)</option>
        <option value="2">2 — Medio (2/4)</option>
        <option value="3">3 — Grande (3/4)</option>
        <option value="4">4 — Fila completa</option>
        <option value="5">5 — 1/4 doble alto</option>
        <option value="6">6 — 2/4 doble alto</option>
        <option value="7">7 — 3/4 doble alto</option>
        <option value="8">8 — Página completa</option>
      </select>
    </div>
  </div>

  <div class="seccion">Imagen <span id="badge-img" style="display:none" class="badge badge-img"></span></div>

  <div class="field">
    <input id="imagen_drive_id" type="text" placeholder="ID de imagen en Drive (se busca automáticamente)">
    <p class="hint" id="hint-imagen">Se busca automáticamente al introducir la referencia</p>
  </div>

  <div id="status"></div>

  <div class="btn-group">
    <button class="btn-secondary" onclick="google.script.host.close()">Cancelar</button>
    <button class="btn-primary" id="btn-guardar" onclick="guardar()">Guardar producto</button>
  </div>

  <script>
    let _filaExistente = null;
    let _imagenBloqueada = false;
    let _busquedaTimer = null;

    // Auto-calcular precio con IVA
    document.getElementById('precio_sin_iva').addEventListener('input', calcularPrecio);
    document.getElementById('iva').addEventListener('change', calcularPrecio);
    function calcularPrecio() {
      const base = parseFloat(document.getElementById('precio_sin_iva').value) || 0;
      const iva  = parseFloat(document.getElementById('iva').value) || 0;
      if (base > 0 && iva > 0)
        document.getElementById('precio_con_iva').value = (base * (1 + iva/100)).toFixed(2);
    }

    // Buscar al cambiar referencia (con debounce 600ms)
    document.getElementById('referencia').addEventListener('input', function() {
      clearTimeout(_busquedaTimer);
      const ref = this.value.trim();
      if (!ref) { resetFormulario(); return; }
      _busquedaTimer = setTimeout(() => buscarPorReferencia(ref), 600);
    });

    function buscarPorReferencia(ref) {
      document.getElementById('buscando').style.display = 'block';
      mostrarEstado('', '');

      google.script.run
        .withSuccessHandler(resultado => {
          document.getElementById('buscando').style.display = 'none';
          aplicarResultado(resultado);
        })
        .withFailureHandler(err => {
          document.getElementById('buscando').style.display = 'none';
          mostrarEstado('Error en la búsqueda: ' + err.message, 'err');
        })
        .buscarProductoCompleto(ref);
    }

    function aplicarResultado(r) {
      // r = { producto: {...} | null, imagen: { id, encontrada } }
      const { producto, imagen } = r;

      // Actualizar badge e indicador de modo
      if (producto) {
        _filaExistente = producto._fila;
        document.getElementById('badge-modo').textContent = 'EDITAR';
        document.getElementById('badge-modo').className = 'badge badge-editar';
        document.getElementById('btn-guardar').textContent = 'Actualizar producto';
        mostrarEstado('Producto encontrado — editando fila ' + producto._fila, 'warn');
        rellenarCampos(producto);
      } else {
        _filaExistente = null;
        document.getElementById('badge-modo').textContent = 'NUEVO';
        document.getElementById('badge-modo').className = 'badge badge-nuevo';
        document.getElementById('btn-guardar').textContent = 'Guardar producto';
        mostrarEstado('Referencia no encontrada — se registrará como nuevo', 'info');
      }

      // Imagen
      const badgeImg = document.getElementById('badge-img');
      const campoImg = document.getElementById('imagen_drive_id');
      const hintImg  = document.getElementById('hint-imagen');

      if (imagen.encontrada) {
        campoImg.value    = imagen.id;
        badgeImg.textContent = '✓ Imagen encontrada en Drive';
        badgeImg.style.display = 'inline-block';
        // Bloquear edición si ya tiene imagen y es producto existente
        if (producto) {
          campoImg.disabled = true;
          _imagenBloqueada  = true;
          hintImg.textContent = 'Imagen vinculada automáticamente. Para cambiarla edita directamente en Drive.';
        } else {
          campoImg.disabled = false;
          _imagenBloqueada  = false;
          hintImg.textContent = '✓ Imagen encontrada automáticamente en Drive';
        }
      } else {
        campoImg.value    = '';
        campoImg.disabled = false;
        _imagenBloqueada  = false;
        badgeImg.style.display = 'none';
        hintImg.textContent = 'No se encontró imagen en Drive para esta referencia';
      }
    }

    function rellenarCampos(p) {
      const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
      set('nombre',              p.nombre);
      set('marca',               p.marca);
      set('tipologia',           p.tipologia);
      set('precio_sin_iva',      p.precio_sin_iva ? p.precio_sin_iva.replace(',','.') : '');
      set('precio_con_iva',      p.precio_con_iva ? p.precio_con_iva.replace(',','.') : '');
      set('mostrar_precio',      p.mostrar_precio || 'no');
      set('incluir_en_catalogo', p.incluir_en_catalogo || 'si');
      set('oferta',              p.oferta || 'no');
      set('espacios_a_ocupar',   p.espacios_a_ocupar || '1');
      // Área (select)
      const sel = document.getElementById('area');
      if (p.area) sel.value = p.area;
      // IVA
      const selIva = document.getElementById('iva');
      if (p.iva) selIva.value = p.iva;
    }

    function resetFormulario() {
      _filaExistente = null;
      _imagenBloqueada = false;
      ['nombre','marca','tipologia','precio_sin_iva','precio_con_iva','imagen_drive_id'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.disabled = false; }
      });
      document.getElementById('area').value = '';
      document.getElementById('iva').value = '';
      document.getElementById('badge-modo').textContent = 'NUEVO';
      document.getElementById('badge-modo').className = 'badge badge-nuevo';
      document.getElementById('badge-img').style.display = 'none';
      document.getElementById('btn-guardar').textContent = 'Guardar producto';
      document.getElementById('hint-imagen').textContent = 'Se busca automáticamente al introducir la referencia';
      mostrarEstado('', '');
    }

    function guardar() {
      const ref    = document.getElementById('referencia').value.trim();
      const nombre = document.getElementById('nombre').value.trim();
      const marca  = document.getElementById('marca').value.trim();
      const area   = document.getElementById('area').value;
      if (!ref || !nombre || !marca || !area) {
        mostrarEstado('Referencia, nombre, marca y área son obligatorios.', 'err');
        return;
      }

      // Si no tiene imagen, marcar NO_TIENE_FOTO
      const imgCampo = document.getElementById('imagen_drive_id');
      const imgVal   = _imagenBloqueada ? imgCampo.value : (imgCampo.value.trim() || 'NO_TIENE_FOTO');

      const datos = {
        referencia:          ref,
        nombre, marca, area,
        tipologia:           document.getElementById('tipologia').value.trim(),
        precio_sin_iva:      document.getElementById('precio_sin_iva').value,
        iva:                 document.getElementById('iva').value,
        precio_con_iva:      document.getElementById('precio_con_iva').value,
        mostrar_precio:      document.getElementById('mostrar_precio').value,
        incluir_en_catalogo: document.getElementById('incluir_en_catalogo').value,
        oferta:              document.getElementById('oferta').value,
        espacios_a_ocupar:   document.getElementById('espacios_a_ocupar').value,
        imagen_drive_id:     imgVal,
      };

      document.getElementById('btn-guardar').disabled = true;
      mostrarEstado('Guardando...', 'ok');

      google.script.run
        .withSuccessHandler(() => {
          const accion = _filaExistente ? 'actualizado' : 'registrado';
          mostrarEstado('✓ Producto ' + accion + ' correctamente.', 'ok');
          setTimeout(() => google.script.host.close(), 1500);
        })
        .withFailureHandler(err => {
          document.getElementById('btn-guardar').disabled = false;
          mostrarEstado('Error: ' + err.message, 'err');
        })
        .guardarProducto(datos, _filaExistente);
    }

    function mostrarEstado(msg, tipo) {
      const el = document.getElementById('status');
      if (!msg) { el.style.display = 'none'; return; }
      el.textContent = msg;
      el.className = tipo;
      el.style.display = 'block';
    }
  </script>
</body>
</html>
  `)
  .setTitle('Añadir / Editar Producto')
  .setWidth(500)
  .setHeight(700);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ── Búsqueda combinada producto + imagen (llamada desde el formulario) ─────
function buscarProductoCompleto(referencia) {
  return {
    producto: buscarProductoPorReferencia(referencia),
    imagen:   buscarImagenEnDrive(referencia)
  };
}

// ── Abrir hoja de ayuda ────────────────────────────────────────────────────
function abrirAyuda() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ayuda = ss.getSheetByName('Ayuda');
  if (ayuda) ss.setActiveSheet(ayuda);
  else SpreadsheetApp.getUi().alert('La hoja "Ayuda" no existe. Ejecuta crearHojaAyuda() desde el editor de scripts.');
}

// ── Crear hoja de ayuda ────────────────────────────────────────────────────
function crearHojaAyuda() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Ayuda');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Ayuda');

  const datos = [
    ['GUÍA DE USO — CATÁLOGOS ORENCIO MATAS Y HERMANOS, S.L.', ''],
    ['', ''],
    ['¿CÓMO FUNCIONA EL SISTEMA?', ''],
    ['', ''],
    ['Este sistema genera automáticamente los catálogos PDF por área (Droguería, Perfumería, Pinturas, Talleres)', ''],
    ['a partir de los productos registrados en esta hoja. Los PDFs se publican y la web los detecta sola.', ''],
    ['', ''],
    ['FLUJO COMPLETO', ''],
    ['1.', 'Rellenas o editas un producto en la hoja "Productos"'],
    ['2.', 'Tras 5 minutos sin cambios, el sistema lanza la generación automáticamente'],
    ['3.', 'GitHub Actions genera los PDFs (tarda ~1-2 minutos)'],
    ['4.', 'Los PDFs se publican en GitHub Releases con URL estable'],
    ['5.', 'La web detecta los catálogos y activa el botón "Ver Catálogo" automáticamente'],
    ['', ''],
    ['GENERACIÓN MANUAL', ''],
    ['', 'Menú "📦 Catálogos Orencio Matas" → "Generar catálogos ahora"'],
    ['', 'Útil cuando quieres publicar sin esperar los 5 minutos de cooldown'],
    ['', ''],
    ['AÑADIR O EDITAR UN PRODUCTO', ''],
    ['', 'Menú → "Añadir / Editar producto" — abre un formulario lateral'],
    ['', '1. Escribe la referencia del producto'],
    ['', '2. El sistema busca automáticamente si ya existe en el listado'],
    ['', '3. También busca la imagen en Drive por el nombre de la referencia'],
    ['', '4. Si el producto existe, carga sus datos para editar'],
    ['', '5. Si no existe, se registrará como nuevo al guardar'],
    ['', '6. Si no hay imagen en Drive, el campo quedará como NO_TIENE_FOTO'],
    ['', ''],
    ['DESCRIPCIÓN DE COLUMNAS', ''],
    ['referencia', 'Código interno del producto. Ej: DRO001. Debe coincidir con el nombre del archivo de imagen en Drive'],
    ['nombre', 'Nombre comercial del producto'],
    ['marca', 'Marca del producto'],
    ['area', 'Área: drogueria / perfumeria / pinturas / talleres (sin tildes, minúsculas)'],
    ['tipologia', 'Subcategoría. Debe coincidir con la columna Familia de la hoja FamiliasProductos para respetar el orden'],
    ['precio_sin_iva', 'Precio base sin impuestos (coma decimal). Ej: 2,45'],
    ['iva', 'Tipo de IVA: 4, 10 o 21'],
    ['precio_con_iva', 'Precio con IVA (coma decimal). Se calcula automáticamente en el formulario'],
    ['mostrar_precio', 'si / no — si el precio aparece en el PDF'],
    ['incluir_en_catalogo', 'si / no — si el producto aparece en el catálogo generado'],
    ['oferta', 'si / no — muestra banderín rojo "★ OFERTA" sobre la imagen'],
    ['espacios_a_ocupar', 'Espacio que ocupa en el catálogo (ver tabla abajo)'],
    ['imagen_drive_id', 'ID del archivo en Drive. Se asigna automáticamente. NO_TIENE_FOTO si no existe imagen'],
    ['fecha_registro', 'Fecha y hora de alta o última modificación (zona horaria Madrid). Se rellena automáticamente'],
    ['', ''],
    ['VALORES DE ESPACIOS A OCUPAR', ''],
    ['', 'El catálogo usa 4 columnas por fila. Máximo 8 (4 cols × 2 filas = página completa)'],
    ['1', 'Normal — 1/4 del ancho, altura estándar'],
    ['2', 'Medio — 2/4 del ancho, altura estándar'],
    ['3', 'Grande — 3/4 del ancho, altura estándar'],
    ['4', 'Fila completa — todo el ancho, altura estándar'],
    ['5', 'Destacado — 1/4 del ancho, doble altura'],
    ['6', 'Destacado medio — 2/4 del ancho, doble altura'],
    ['7', 'Destacado grande — 3/4 del ancho, doble altura'],
    ['8', 'Página completa — máximo protagonismo'],
    ['', ''],
    ['IMÁGENES DE PRODUCTOS', ''],
    ['', 'Carpeta Drive: Catalogos/imagenes_catalogo (ID: 13O7N_q6IisAhsvSoXogKJ2PUDVQfUKRe)'],
    ['', 'El nombre del archivo debe ser exactamente igual a la referencia del producto (sin extensión)'],
    ['', 'Ej: referencia DRO001 → archivo llamado DRO001 en Drive'],
    ['', 'El formulario busca la imagen automáticamente al escribir la referencia'],
    ['', ''],
    ['FAMILIAS DE PRODUCTOS Y ORDEN EN CATÁLOGO', ''],
    ['', 'La hoja "FamiliasProductos" define el orden en que aparecen las secciones en el catálogo'],
    ['', 'La columna "Familia" debe coincidir con la columna "tipologia" de la hoja Productos'],
    ['', 'Si una tipología no está en FamiliasProductos aparecerá al final del catálogo'],
    ['', ''],
    ['CATÁLOGO ZAPHIRO', ''],
    ['', 'Menú → "Actualizar catálogo Zaphiro" para forzar la actualización'],
    ['', 'La URL se gestiona en la hoja "Configuracion". Actualizar cada año cuando Zaphiro publique el nuevo catálogo'],
    ['', ''],
    ['DÓNDE SE ALOJAN LOS CATÁLOGOS', ''],
    ['', 'PDFs en GitHub Releases: https://github.com/eloyleon23/web-orencio-matas/releases'],
    ['', 'No están en el código de la web — se actualizan sin tocar el repositorio'],
    ['', ''],
    ['SOPORTE TÉCNICO', ''],
    ['', 'Para cambios en diseño del PDF o comportamiento de la web, contactar con el equipo de desarrollo.'],
  ];

  sheet.getRange(1, 1, datos.length, 2).setValues(datos);
  sheet.getRange(1, 1, 1, 2).merge()
    .setFontSize(13).setFontWeight('bold').setFontColor('#d91b1b');

  [3, 8, 15, 19, 28, 44, 51, 57, 63, 67, 71, 75].forEach(row => {
    if (row <= datos.length)
      sheet.getRange(row, 1, 1, 2).merge()
        .setBackground('#1a1a1a').setFontColor('white').setFontWeight('bold').setFontSize(10);
  });

  sheet.getRange(1, 1, datos.length, 1).setFontWeight('bold');
  sheet.setColumnWidth(1, 240);
  sheet.setColumnWidth(2, 500);
  sheet.protect().setDescription('Hoja de ayuda').setWarningOnly(true);
  SpreadsheetApp.getActiveSpreadsheet().toast('✓ Hoja de Ayuda actualizada', 'Listo', 4);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
}

// ── BAJA DE PRODUCTOS desde BajaProductos ─────────────────────────────────
//
// La hoja "BajaProductos" contiene:
//   A: Referencia (EAN) — obligatorio
//   B: Procesado        — gestionado por el script (si / vacío)
//   C: Error            — gestionado por el script
//
// El script marca en Productos: incluir_en_catalogo = "no" y fecha_baja = ahora
// Solo procesa filas sin "si" en Procesado, permitiendo reanudar si se interrumpe.

function darDeBajaProductos() {
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const sheetBaja  = ss.getSheetByName('BajaProductos');
  const sheetProd  = ss.getSheetByName('Productos');

  if (!sheetBaja) {
    SpreadsheetApp.getUi().alert('No existe la hoja "BajaProductos". Créala con las referencias a dar de baja.');
    return;
  }
  if (!sheetProd) {
    SpreadsheetApp.getUi().alert('No existe la hoja "Productos".');
    return;
  }

  // ── Asegurar columnas Procesado y Error en BajaProductos ─────────────────
  let bajaHeaders = sheetBaja.getRange(1, 1, 1, sheetBaja.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim());

  // Si la hoja está vacía o solo tiene datos sin cabecera, inicializar cabeceras
  if (!bajaHeaders[0] || bajaHeaders[0].toLowerCase() === '') {
    sheetBaja.getRange(1, 1, 1, 3).setValues([['Referencia', 'Procesado', 'Error']]);
    bajaHeaders = ['Referencia', 'Procesado', 'Error'];
  } else {
    if (!bajaHeaders.includes('Procesado')) {
      sheetBaja.getRange(1, bajaHeaders.length + 1).setValue('Procesado');
      bajaHeaders.push('Procesado');
    }
    if (!bajaHeaders.includes('Error')) {
      sheetBaja.getRange(1, bajaHeaders.length + 1).setValue('Error');
      bajaHeaders.push('Error');
    }
  }

  const BAJA = {};
  bajaHeaders.forEach((h, i) => { BAJA[h] = i; });

  // ── Cabeceras de Productos ────────────────────────────────────────────────
  const prodHeaders = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim());

  // Añadir columna fecha_baja si no existe
  if (!prodHeaders.includes('fecha_baja')) {
    sheetProd.getRange(1, prodHeaders.length + 1).setValue('fecha_baja');
    prodHeaders.push('fecha_baja');
  }

  const PROD = {};
  prodHeaders.forEach((h, i) => { PROD[h] = i; });

  const colIncluir   = PROD['incluir_en_catalogo'];
  const colFechaBaja = PROD['fecha_baja'];
  const colRef       = PROD['referencia'];

  if (colRef === undefined || colIncluir === undefined) {
    SpreadsheetApp.getUi().alert('La hoja Productos no tiene las columnas "referencia" o "incluir_en_catalogo".');
    return;
  }

  // ── Índice de Productos por referencia ───────────────────────────────────
  const prodData  = sheetProd.getRange(2, 1, Math.max(sheetProd.getLastRow() - 1, 1), sheetProd.getLastColumn()).getValues();
  const prodIndex = {};
  prodData.forEach((row, i) => {
    const ref = row[colRef];
    if (ref) prodIndex[ref.toString().trim().toUpperCase()] = i;
  });

  // ── Procesar bajas ────────────────────────────────────────────────────────
  const lastRow = sheetBaja.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('La hoja BajaProductos no tiene referencias. Añade EANs en la columna Referencia.');
    return;
  }

  const bajaData = sheetBaja.getRange(2, 1, lastRow - 1, bajaHeaders.length).getValues();
  const ahora    = Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM/yyyy HH:mm');
  let bajas = 0, noEncontrados = 0, saltados = 0, errores = 0;

  for (let i = 0; i < bajaData.length; i++) {
    const fila   = bajaData[i];
    const rowNum = i + 2;

    const ref       = fila[BAJA['Referencia']] ? fila[BAJA['Referencia']].toString().trim() : '';
    const procesado = BAJA['Procesado'] !== undefined ? fila[BAJA['Procesado']].toString().trim() : '';

    // Saltar filas ya procesadas o sin referencia
    if (procesado === 'si') { saltados++; continue; }
    if (!ref) {
      sheetBaja.getRange(rowNum, BAJA['Error'] + 1).setValue('Referencia vacía');
      errores++;
      continue;
    }

    try {
      const idx = prodIndex[ref.toUpperCase()];

      if (idx === undefined) {
        // No encontrado en Productos
        sheetBaja.getRange(rowNum, BAJA['Procesado'] + 1).setValue('no encontrado');
        sheetBaja.getRange(rowNum, BAJA['Error'] + 1).setValue('Referencia no existe en Productos');
        noEncontrados++;
        continue;
      }

      const prodRowNum = idx + 2; // fila real en Productos (1-based + cabecera)

      // Marcar como baja
      sheetProd.getRange(prodRowNum, colIncluir + 1).setValue('no');
      if (colFechaBaja !== undefined)
        sheetProd.getRange(prodRowNum, colFechaBaja + 1).setValue(ahora);

      // Marcar como procesado en BajaProductos
      sheetBaja.getRange(rowNum, BAJA['Procesado'] + 1).setValue('si');
      sheetBaja.getRange(rowNum, BAJA['Error'] + 1).setValue('');
      bajas++;

    } catch (err) {
      sheetBaja.getRange(rowNum, BAJA['Procesado'] + 1).setValue('no');
      sheetBaja.getRange(rowNum, BAJA['Error'] + 1).setValue(err.message);
      errores++;
    }
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `🚫 Bajas: ${bajas} | No encontrados: ${noEncontrados} | Saltados: ${saltados} | Errores: ${errores}`,
    '✓ Proceso de bajas completado', 8
  );
}

// ── Crear hoja de configuración ────────────────────────────────────────────
function crearHojaConfiguracion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Configuracion');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Configuracion');

  const datos = [
    ['clave',          'valor',                                                                        'descripcion'],
    ['zaphiro_url',    'https://www.zaphirogroup.com/wp-content/uploads/2026/05/CATALOGO-ZAPHIRO-2026_web.pdf', 'URL directa al PDF del catálogo Zaphiro. Actualizar cada año.'],
    ['zaphiro_año',    '2026',                                                                         'Año del catálogo vigente'],
    ['zaphiro_activo', 'si',                                                                           'si / no — si se muestra el catálogo Zaphiro en la web'],
  ];

  sheet.getRange(1, 1, datos.length, 3).setValues(datos);
  sheet.getRange(1, 1, 1, 3).setBackground('#1a1a1a').setFontColor('white').setFontWeight('bold');
  sheet.getRange(2, 2).setFontWeight('bold');
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 420);
  sheet.setColumnWidth(3, 380);
  SpreadsheetApp.getActiveSpreadsheet().toast('✓ Hoja Configuracion creada', 'Listo', 4);
  ss.setActiveSheet(sheet);
}

// ── Activar triggers (ejecutar UNA VEZ) ───────────────────────────────────
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (['onEdit','onOpen'].includes(t.getHandlerFunction()))
      ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onEdit').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onEdit().create();
  ScriptApp.newTrigger('onOpen').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onOpen().create();
  SpreadsheetApp.getActiveSpreadsheet().toast('✓ Triggers activados', 'Configurado', 4);
}
