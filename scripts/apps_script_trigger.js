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
    .addItem('� Actualizar precios de productos', 'actualizarPreciosProductos')
    .addItem('�🚫 Procesar bajas de BajaProductos', 'darDeBajaProductos')
    .addItem('🖼️ Actualizar IDs de imagen desde Drive', 'actualizarImagenesDrive')
    .addItem('🔓 Compartir imágenes Drive públicamente', 'compartirImagenesDrive')
    .addItem('✅ Validar imagen de producto', 'validarImagenManual')
    .addSeparator()
    .addItem('🗂️ Reevaluar áreas de todos los productos', 'reevaluarAreasProductos')
    .addItem('🤖 Clasificar subfamilias con IA', 'clasificarSubfamiliasConIA')
    .addItem('⛔ Deshabilitar productos con foto incorrecta', 'deshabilitarProductosSinFoto')
    .addItem('🔄 Actualizar imágenes corregidas desde Drive', 'actualizarImagenesCorregidas')
    .addItem('📦 Mover imágenes nuevas a carpeta principal', 'moverImagenesNuevasACarpetaPrincipal')
    .addSeparator()
    .addItem('🔄 Actualizar catálogo Zaphiro', 'actualizarZaphiro')
    .addSeparator()
    .addItem('📖 Ver guía de uso', 'abrirAyuda')
    .addToUi();
}

// ── Trigger de edición ─────────────────────────────────────────────────────
// La generación de catálogos es MANUAL — usar el menú "Generar catálogos ahora"
// Se mantiene el trigger para posibles usos futuros pero no dispara el workflow
function onEdit(e) {
  // Generación desactivada por volumen de productos — lanzar manualmente
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

// ── SINCRONIZACIÓN RegistroProductos → Productos ───────────────────────────
function sincronizarRegistroProductos() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetReg  = ss.getSheetByName('RegistroProductos');
  const sheetProd = ss.getSheetByName('Productos');

  if (!sheetReg)  { SpreadsheetApp.getUi().alert('No existe la hoja "RegistroProductos". Créala y pega los datos del Excel primero.'); return; }
  if (!sheetProd) { SpreadsheetApp.getUi().alert('No existe la hoja "Productos".'); return; }

  const regHeaderRow = sheetReg.getRange(1, 1, 1, sheetReg.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim());

  if (!regHeaderRow.includes('Procesado')) {
    sheetReg.getRange(1, regHeaderRow.length + 1).setValue('Procesado');
    regHeaderRow.push('Procesado');
  }
  if (!regHeaderRow.includes('Error')) {
    sheetReg.getRange(1, regHeaderRow.length + 1).setValue('Error');
    regHeaderRow.push('Error');
  }

  const COL = {};
  regHeaderRow.forEach((h, i) => { COL[h] = i; });

  const prodHeaderRow = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim());

  if (!prodHeaderRow.includes('fecha_registro')) {
    sheetProd.getRange(1, prodHeaderRow.length + 1).setValue('fecha_registro');
    prodHeaderRow.push('fecha_registro');
  }

  const PROD = {};
  prodHeaderRow.forEach((h, i) => { PROD[h] = i; });

  const prodData  = sheetProd.getRange(2, 1, Math.max(sheetProd.getLastRow() - 1, 1), sheetProd.getLastColumn()).getValues();
  const prodIndex = {};
  prodData.forEach((row, i) => {
    const ref = row[PROD['referencia']];
    if (ref) prodIndex[ref.toString().trim()] = i;
  });

  const imagenesCache = cargarCacheImagenes_();

  const lastRow = sheetReg.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('RegistroProductos no tiene datos. Pega primero el contenido del Excel.'); return; }

  const regData = sheetReg.getRange(2, 1, lastRow - 1, regHeaderRow.length).getValues();
  let nuevos = 0, actualizados = 0, saltados = 0, errores = 0;
  const hoy = new Date();

  for (let i = 0; i < regData.length; i++) {
    const fila   = regData[i];
    const rowNum = i + 2;
    const procesado = COL['Procesado'] !== undefined ? fila[COL['Procesado']].toString().trim() : '';
    const errorPrev = COL['Error']     !== undefined ? fila[COL['Error']].toString().trim()     : '';

    if (procesado === 'si') { saltados++; continue; }
    if (errorPrev && errorPrev !== '') { saltados++; continue; }

    const ean          = fila[COL['CodigoEAN']]          ? fila[COL['CodigoEAN']].toString().trim()          : '';
    const desc         = fila[COL['DescripcionArticulo']] ? fila[COL['DescripcionArticulo']].toString().trim() : '';
    const precioSinIva = parseFloat(fila[COL['PrecioPublicoSinIVA']]) || 0;
    const iva          = parseFloat(fila[COL['IVA']])               || 21;
    const precioConIva = Math.round(precioSinIva * (1 + iva / 100) * 100) / 100;
    const familia      = fila[COL['Familia']] ? fila[COL['Familia']].toString().trim() : '';

    if (!ean) { marcarRegistro_(sheetReg, rowNum, COL, 'no', 'EAN vacío'); errores++; continue; }

    try {
      if (prodIndex.hasOwnProperty(ean)) {
        const prodRowIdx = prodIndex[ean];
        const prodRow    = prodData[prodRowIdx];
        const prodRowNum = prodRowIdx + 2;
        let cambios = false;

        const checks = [
          ['precio_sin_iva', formatPrecio_(precioSinIva)],
          ['iva',            iva],
          ['precio_con_iva', formatPrecio_(precioConIva)],
          ['nombre',         desc],
          ['tipologia',      familia],
        ];
        checks.forEach(([col, val]) => {
          if (PROD[col] !== undefined && val && prodRow[PROD[col]].toString().trim() != val.toString()) {
            sheetProd.getRange(prodRowNum, PROD[col] + 1).setValue(val);
            cambios = true;
          }
        });
        if (cambios && PROD['fecha_registro'] !== undefined)
          sheetProd.getRange(prodRowNum, PROD['fecha_registro'] + 1).setValue(hoy);

        actualizados++;
        marcarRegistro_(sheetReg, rowNum, COL, 'si', '');

      } else {
        const area     = inferirArea_(desc, familia);
        const imagenId = imagenesCache[ean] || '';
        const nuevaFila = new Array(prodHeaderRow.length).fill('');
        const set = (col, val) => { if (PROD[col] !== undefined) nuevaFila[PROD[col]] = val; };

        set('referencia',          ean);
        set('nombre',              desc);
        set('marca',               desc);
        set('area',                area);
        set('tipologia',           familia);
        set('precio_sin_iva',      formatPrecio_(precioSinIva));
        set('iva',                 iva);
        set('precio_con_iva',      formatPrecio_(precioConIva));
        set('mostrar_precio',      'si');
        set('incluir_en_catalogo', 'si');
        set('oferta',              'no');
        set('espacios_a_ocupar',   1);
        set('imagen_drive_id',     imagenId || 'NO_TIENE_FOTO');
        set('fecha_registro',      hoy);

        sheetProd.appendRow(nuevaFila);
        prodData.push(nuevaFila);
        prodIndex[ean] = prodData.length - 1;

        nuevos++;
        marcarRegistro_(sheetReg, rowNum, COL, 'si', '');
      }
    } catch (err) {
      marcarRegistro_(sheetReg, rowNum, COL, 'no', err.message);
      errores++;
    }
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✓ Nuevos: ${nuevos} | Actualizados: ${actualizados} | Saltados: ${saltados} | Errores: ${errores}`,
    '📥 Sincronización completada', 8
  );
}

// ── ACTUALIZAR PRECIOS DE PRODUCTOS ───────────────────────────────────────────
function actualizarPreciosProductos() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetReg  = ss.getSheetByName('RegistroProductos');
  const sheetProd = ss.getSheetByName('Productos');

  if (!sheetReg)  { SpreadsheetApp.getUi().alert('No existe la hoja "RegistroProductos".'); return; }
  if (!sheetProd) { SpreadsheetApp.getUi().alert('No existe la hoja "Productos".'); return; }

  const regHeaderRow = sheetReg.getRange(1, 1, 1, sheetReg.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim());

  if (!regHeaderRow.includes('ActualizarPrecio')) {
    SpreadsheetApp.getUi().alert('No existe la columna "ActualizarPrecio" en RegistroProductos.');
    return;
  }

  const COL = {};
  regHeaderRow.forEach((h, i) => { COL[h] = i; });

  const prodHeaderRow = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim());

  const PROD = {};
  prodHeaderRow.forEach((h, i) => { PROD[h] = i; });

  const prodData  = sheetProd.getRange(2, 1, Math.max(sheetProd.getLastRow() - 1, 1), sheetProd.getLastColumn()).getValues();
  const prodIndex = {};
  prodData.forEach((row, i) => {
    const ref = row[PROD['referencia']];
    if (ref) prodIndex[ref.toString().trim()] = i;
  });

  const lastRow = sheetReg.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('RegistroProductos no tiene datos.'); return; }

  const regData = sheetReg.getRange(2, 1, lastRow - 1, regHeaderRow.length).getValues();
  let actualizados = 0, saltados = 0, errores = 0;
  const hoy = new Date();

  for (let i = 0; i < regData.length; i++) {
    const fila   = regData[i];
    const rowNum = i + 2;
    const actualizarPrecio = COL['ActualizarPrecio'] !== undefined ? fila[COL['ActualizarPrecio']].toString().trim().toLowerCase() : '';

    if (actualizarPrecio !== 'si') { saltados++; continue; }

    const ean = fila[COL['CodigoEAN']] ? fila[COL['CodigoEAN']].toString().trim() : '';

    if (!ean) {
      sheetReg.getRange(rowNum, COL['ActualizarPrecio'] + 1).setValue('no');
      saltados++;
      continue;
    }

    try {
      if (prodIndex.hasOwnProperty(ean)) {
        const prodRowIdx = prodIndex[ean];
        const prodRow    = prodData[prodRowIdx];
        const prodRowNum = prodRowIdx + 2;

        const precioSinIva = parseFloat(fila[COL['PrecioPublicoSinIVA']]) || 0;
        const iva          = parseFloat(fila[COL['IVA']]) || 21;
        const precioConIva = Math.round(precioSinIva * (1 + iva / 100) * 100) / 100;

        // Actualizar precio sin IVA
        if (PROD['precio_sin_iva'] !== undefined) {
          sheetProd.getRange(prodRowNum, PROD['precio_sin_iva'] + 1).setValue(formatPrecio_(precioSinIva));
        }

        // Actualizar IVA
        if (PROD['iva'] !== undefined) {
          sheetProd.getRange(prodRowNum, PROD['iva'] + 1).setValue(iva);
        }

        // Actualizar precio con IVA
        if (PROD['precio_con_iva'] !== undefined) {
          sheetProd.getRange(prodRowNum, PROD['precio_con_iva'] + 1).setValue(formatPrecio_(precioConIva));
        }

        // Actualizar fecha_registro
        if (PROD['fecha_registro'] !== undefined) {
          sheetProd.getRange(prodRowNum, PROD['fecha_registro'] + 1).setValue(hoy);
        }

        // Marcar ActualizarPrecio como "no"
        sheetReg.getRange(rowNum, COL['ActualizarPrecio'] + 1).setValue('no');

        actualizados++;

      } else {
        // Producto no existe en hoja Productos
        sheetReg.getRange(rowNum, COL['ActualizarPrecio'] + 1).setValue('no');
        saltados++;
      }
    } catch (err) {
      sheetReg.getRange(rowNum, COL['ActualizarPrecio'] + 1).setValue('no');
      errores++;
    }
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✓ Precios actualizados: ${actualizados} | Saltados: ${saltados} | Errores: ${errores}`,
    '💰 Actualización de precios completada', 8
  );
}

function marcarRegistro_(sheet, rowNum, COL, procesado, error) {
  if (COL['Procesado'] !== undefined) sheet.getRange(rowNum, COL['Procesado'] + 1).setValue(procesado);
  if (COL['Error']     !== undefined) sheet.getRange(rowNum, COL['Error']     + 1).setValue(error);
}

function formatPrecio_(num) {
  return num.toString().replace('.', ',');
}

function inferirArea_(nombre, familia) {
  const txt = (nombre + ' ' + familia).toLowerCase();

  // ── Pinturas: keywords + marcas conocidas ──────────────────────────────
  const pinturas = [
    // Genéricos
    'pintura','barniz','esmalte','laca','aguarras','disolvente','brocha','rodillo',
    'masilla','silicona','sellador','imprimacion','imprimación','anticorrosivo',
    'pincel','espátula','espatula','fijador','estuco','revoque','pintar',
    'lija','lija ','lijado','pintura plástica','pintura esmalte','barnizado',
    'decapante','quitapintura','cinta de enmascarar','krepp','cinta adhesiva',
    'cubeta','cubeta pintura','rodillo pintura','alargador','palo telescópico',
    'imprimador','aparejos','spray pintura','aerosol pintura',
    'pintura al agua','pintura al aceite','esmalte sintético','esmalte acrilico',
    // Marcas
    'titanlux','titankote','titan ','oxiron','bruguer','xyladecor','xylamon',
    'valentí','valenti','hempel','jotun','montó','monto','isaval','lepanto',
    'beissier','sinteplast','polycell','rustoleum','rust-oleum','hammerite',
    'rücker','rucker','cetabever','sikkens','dyrup','bondex','comex',
    'revetón','reveton','ceys','pattex','loctite','bostik',
  ];

  // ── Talleres: keywords + marcas ────────────────────────────────────────
  const talleres = [
    // Genéricos
    'aceite motor','lubricante','grasa ','anticongelante','limpiametales',
    'desengrasante industrial','herramienta','tornillo','tuerca','arandela',
    'llave inglesa','taladro','soldadura','spray taller','mechero','encendedor',
    'carrocería','carroceria','lija carrocería','masilla poliéster','aparejo',
    'pintura carrocería','fondo aparejo','imprimación carrocería',
    'laca carrocería','barniz carrocería','disolvente nitro','diluyente',
    'silicona taller','desengrasante taller','limpia frenos','limpia contactos',
    'grasa litio','aceite cadena','pasta pulidora','pulimento','abrillantador',
    'cristalizado','cera carrocería','espuma limpiadora',
    // Marcas
    'wurth','würth','motul','castrol','total oil','repsol','mobil','shell',
    'bardahl','liqui moly','valvoline','eni oil','mannol','dynamo',
    '3m taller','norton abrasivos','mirka','indasa','sia abrasives',
  ];

  // ── Perfumería: keywords + marcas ─────────────────────────────────────
  const perfumeria = [
    // Genéricos
    'perfume','colonia','eau de','edt','edp','desodorante','deo ',
    'gel de ducha','gel ducha','champú','champu','acondicionador',
    'crema corporal','crema facial','loción','locion','serum','sérum',
    'maquillaje','cosmética','cosmetica','after shave','afeitado',
    'espuma afeitar','cera cabello','mascarilla capilar','tinte cabello',
    'laca cabello','suavizante cabello','higiene intima','higiene íntima',
    'compresas','tampones','pañales','pañal','colonia infantil',
    'crema manos','crema hidratante','leche corporal','aceite corporal',
    'jabón pastilla','jabón líquido','gel íntimo','toallitas húmedas',
    'papel higiénico','pañuelos','algodón','bastoncillos','esponjas baño',
    'maquinilla','cuchilla afeitar','espuma afeitado','after shave',
    'fijador cabello','gomina','laca pelo','tinte pelo','decoloración',
    'quitaesmalte','esmalte uñas','laca uñas','pintalabios','rimmel',
    // Marcas
    'nivea','dove','fa ','rexona','sanex','axe ','gillette','venus ',
    'oral-b','colgate','sensodyne','listerine','elmex','vademecum',
    'pantene','head shoulders','elvive','fructis','herbal essences',
    'palmolive','johnson','neutrogena','garnier','l\'oreal','loreal',
    'maybelline','max factor','bourjois','revlon','rimmel london',
    'tulipán negro','tulipan negro','heno de pravia','la toja',
    'floid','williams','legrain','puig ','myrurgia','parera',
    'instituto español','interapothek','mercadona','deliplus',
  ];

  for (const kw of pinturas)   if (txt.includes(kw)) return 'pinturas';
  for (const kw of talleres)   if (txt.includes(kw)) return 'talleres';
  for (const kw of perfumeria) if (txt.includes(kw)) return 'perfumeria';
  return 'drogueria';
}

// ── REEVALUAR ÁREAS DE TODOS LOS PRODUCTOS ────────────────────────────────
//
// Recorre todos los productos y recalcula el campo "area" usando inferirArea_.
// Muestra un resumen de cuántos cambios se han realizado por área.
// Solo actualiza el campo "area" — no toca ningún otro campo.

function reevaluarAreasProductos() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetProd = ss.getSheetByName('Productos');
  const sheetFam  = ss.getSheetByName('FamiliaProductos');

  if (!sheetProd) { SpreadsheetApp.getUi().alert('No existe la hoja "Productos".'); return; }
  if (!sheetFam)  { SpreadsheetApp.getUi().alert('No existe la hoja "FamiliaProductos".'); return; }

  // ── Construir mapa Familia → Área desde FamiliaProductos ──────────────────
  const famHeaders = sheetFam.getRange(1, 1, 1, sheetFam.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase());
  const colFamFamilia = famHeaders.indexOf('familia');
  const colFamArea    = famHeaders.indexOf('area');

  if (colFamFamilia === -1 || colFamArea === -1) {
    SpreadsheetApp.getUi().alert('La hoja "FamiliaProductos" debe tener columnas "Familia" y "Area".');
    return;
  }

  const famLastRow = sheetFam.getLastRow();
  if (famLastRow < 2) { SpreadsheetApp.getUi().alert('La hoja "FamiliaProductos" está vacía.'); return; }

  const famData = sheetFam.getRange(2, 1, famLastRow - 1, sheetFam.getLastColumn()).getValues();
  const mapaFamiliaArea = {};
  famData.forEach(row => {
    const familia = row[colFamFamilia].toString().trim().toUpperCase();
    const area    = row[colFamArea].toString().trim().toLowerCase();
    if (familia && area) mapaFamiliaArea[familia] = area;
  });

  if (Object.keys(mapaFamiliaArea).length === 0) {
    SpreadsheetApp.getUi().alert('No se encontraron familias con área asignada en "FamiliaProductos".');
    return;
  }

  // ── Recorrer Productos y actualizar área según su tipología/familia ──────
  const headers = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/ /g,'_'));

  const colTipologia = headers.indexOf('tipologia');
  const colArea       = headers.indexOf('area');

  if (colArea === -1)      { SpreadsheetApp.getUi().alert('No existe la columna "area" en Productos.'); return; }
  if (colTipologia === -1) { SpreadsheetApp.getUi().alert('No existe la columna "tipologia" en Productos.'); return; }

  const lastRow = sheetProd.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('No hay productos.'); return; }

  const data = sheetProd.getRange(2, 1, lastRow - 1, sheetProd.getLastColumn()).getValues();

  const cambios = {};
  let totalCambios = 0, sinFamiliaCoincidente = 0;
  const updates = [];

  for (let i = 0; i < data.length; i++) {
    const row        = data[i];
    const tipologia  = row[colTipologia].toString().trim().toUpperCase();
    const areaActual = row[colArea].toString().trim().toLowerCase();

    if (!tipologia) continue;

    const areaNueva = mapaFamiliaArea[tipologia];

    if (!areaNueva) {
      sinFamiliaCoincidente++;
      continue; // Familia no encontrada en FamiliaProductos — no tocar el área
    }

    if (areaNueva !== areaActual) {
      updates.push({ row: i + 2, area: areaNueva });
      cambios[areaNueva] = (cambios[areaNueva] || 0) + 1;
      totalCambios++;
    }

    if ((i + 1) % 1000 === 0) {
      SpreadsheetApp.getActiveSpreadsheet()
        .toast(`Analizando... ${i+1}/${data.length}`, '🔄 Reevaluando áreas', 5);
    }
  }

  // Aplicar cambios en lote
  if (updates.length > 0) {
    SpreadsheetApp.getActiveSpreadsheet()
      .toast(`Aplicando ${updates.length} cambios...`, '🔄 Guardando', 5);
    for (const u of updates) {
      sheetProd.getRange(u.row, colArea + 1).setValue(u.area);
    }
    SpreadsheetApp.flush();
  }

  const resumenAreas = Object.entries(cambios)
    .map(([area, n]) => `${area}: ${n}`)
    .join(' | ') || 'ninguno';

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✓ ${totalCambios} productos reclasificados (${resumenAreas})\n` +
    `⚠ ${sinFamiliaCoincidente} sin familia coincidente en FamiliaProductos`,
    '✓ Reevaluación completada', 12
  );
}

function cargarCacheImagenes_() {
  const cache = {};
  try {
    const folder = DriveApp.getFolderById(DRIVE_IMAGENES_ID);
    const files  = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const ean  = file.getName().replace(/\.[^.]+$/, '');
      cache[ean] = file.getId();
    }
  } catch (err) {
    console.warn('No se pudo cargar caché de imágenes: ' + err.message);
  }
  return cache;
}

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

  <div class="seccion" id="seccion-imagen">Imagen <span id="badge-img" style="display:none" class="badge badge-img"></span></div>

  <div class="field" id="campo-imagen">
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
      const { producto, imagen } = r;

      const seccionImg = document.getElementById('seccion-imagen');
      const campoImg   = document.getElementById('campo-imagen');
      const badgeImg   = document.getElementById('badge-img');
      const inputImg   = document.getElementById('imagen_drive_id');
      const hintImg    = document.getElementById('hint-imagen');

      if (producto) {
        // ── Modo EDICIÓN ──
        _filaExistente = producto._fila;
        document.getElementById('badge-modo').textContent = 'EDITAR';
        document.getElementById('badge-modo').className   = 'badge badge-editar';
        document.getElementById('btn-guardar').textContent = 'Actualizar producto';
        mostrarEstado('Producto encontrado — editando fila ' + producto._fila, 'warn');
        rellenarCampos(producto);

        // Ocultar completamente la sección de imagen — no editable en modo edición
        seccionImg.style.display = 'none';
        campoImg.style.display   = 'none';
        inputImg.value           = producto.imagen_drive_id || '';
        _imagenBloqueada         = true;

      } else {
        // ── Modo NUEVO ──
        _filaExistente = null;
        document.getElementById('badge-modo').textContent = 'NUEVO';
        document.getElementById('badge-modo').className   = 'badge badge-nuevo';
        document.getElementById('btn-guardar').textContent = 'Guardar producto';
        mostrarEstado('Referencia no encontrada — se registrará como nuevo', 'info');

        // Mostrar sección de imagen para producto nuevo
        seccionImg.style.display = '';
        campoImg.style.display   = '';
        _imagenBloqueada         = false;

        if (imagen.encontrada) {
          inputImg.value           = imagen.id;
          badgeImg.textContent     = '✓ Imagen encontrada en Drive';
          badgeImg.style.display   = 'inline-block';
          inputImg.disabled        = false;
          hintImg.textContent      = '✓ Imagen encontrada automáticamente en Drive';
        } else {
          inputImg.value         = '';
          inputImg.disabled      = false;
          badgeImg.style.display = 'none';
          hintImg.textContent    = 'No se encontró imagen en Drive para esta referencia';
        }
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
      document.getElementById('iva').value  = '';
      document.getElementById('badge-modo').textContent  = 'NUEVO';
      document.getElementById('badge-modo').className    = 'badge badge-nuevo';
      document.getElementById('badge-img').style.display = 'none';
      document.getElementById('btn-guardar').textContent = 'Guardar producto';
      document.getElementById('hint-imagen').textContent = 'Se busca automáticamente al introducir la referencia';
      document.getElementById('seccion-imagen').style.display = '';
      document.getElementById('campo-imagen').style.display   = '';
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
    ['También alimenta el buscador de productos de la web (buscador.html) con un JSON de todo el catálogo.', ''],
    ['', ''],
    ['FLUJO COMPLETO', ''],
    ['1.', 'Rellenas o editas un producto en la hoja "Productos"'],
    ['2.', 'Lanzas la generación manualmente (menú → "Generar catálogos ahora")'],
    ['3.', 'GitHub Actions genera los 4 PDFs, el manifiesto y el productos.json (tarda varios minutos según volumen)'],
    ['4.', 'Los archivos se publican en GitHub Releases / carpeta data/ con URL estable'],
    ['5.', 'La web detecta los catálogos y activa el botón "Ver Catálogo"; el buscador se actualiza con los productos nuevos'],
    ['', ''],
    ['GENERACIÓN MANUAL', ''],
    ['', 'Menú "📦 Catálogos Orencio Matas" → "Generar catálogos ahora"'],
    ['', 'La generación ya NO es automática al editar la hoja — siempre se lanza manualmente desde aquí'],
    ['', ''],
    ['AÑADIR O EDITAR UN PRODUCTO', ''],
    ['', 'Menú → "Añadir / Editar producto" — abre un formulario lateral'],
    ['', '1. Escribe la referencia del producto'],
    ['', '2. El sistema busca automáticamente si ya existe en el listado'],
    ['', '3. También busca la imagen en Drive por el nombre de la referencia'],
    ['', '4. Si el producto existe, carga sus datos para editar. La imagen queda bloqueada si ya existe'],
    ['', '5. Si no existe, se registrará como nuevo al guardar'],
    ['', '6. Si no hay imagen en Drive, el campo quedará como NO_TIENE_FOTO'],
    ['', '7. La fecha_registro se actualiza automáticamente en cada alta o modificación'],
    ['', ''],
    ['SINCRONIZACIÓN MASIVA DESDE REGISTRO DE PRODUCTOS', ''],
    ['', 'Menú → "📥 Sincronizar RegistroProductos → Productos"'],
    ['', 'Procesa todas las filas de la hoja RegistroProductos:'],
    ['', '  · EAN existente → actualiza precios, nombre y familia si han cambiado'],
    ['', '  · EAN nuevo → registra el producto con imagen de Drive asignada automáticamente'],
    ['', '  · El área se infiere por keywords/marcas SOLO para productos nuevos sin familia conocida'],
    ['Reanudación', 'La columna "Procesado" permite reanudar si el proceso se interrumpe sin repetir filas ya completadas'],
    ['Errores', 'La columna "Error" recoge los problemas para revisión manual'],
    ['', ''],
    ['REEVALUAR ÁREAS DE TODOS LOS PRODUCTOS', ''],
    ['', 'Menú → "🗂️ Reevaluar áreas de todos los productos"'],
    ['', 'Lee la columna "Area" de la hoja "FamiliaProductos" (NO infiere por palabras clave)'],
    ['', 'Para cada producto, busca su "tipologia" en FamiliaProductos y aplica el área correspondiente'],
    ['', 'Si la tipología de un producto no existe en FamiliaProductos, su área NO se modifica'],
    ['', 'El resumen final indica cuántos productos se reclasificaron por área y cuántos quedaron sin coincidencia'],
    ['Importante', 'Mantén la columna "Area" de FamiliaProductos actualizada — es la fuente de verdad para el área de cada producto'],
    ['', ''],
    ['BAJA DE PRODUCTOS', ''],
    ['', 'Menú → "🚫 Procesar bajas de BajaProductos"'],
    ['', 'Lee la hoja "BajaProductos" y por cada referencia:'],
    ['', '  · Marca "no" en la columna incluir_en_catalogo de la hoja Productos'],
    ['', '  · Registra la fecha y hora de baja en la columna fecha_baja'],
    ['', '  · Marca "si" en la columna Procesado de BajaProductos al completar'],
    ['', '  · Si la referencia no existe en Productos lo indica en la columna Error'],
    ['Reanudación', 'Las filas con Procesado = "si" se saltan automáticamente. Si el proceso se interrumpe, al relanzarlo continúa desde donde lo dejó'],
    ['', ''],
    ['ESTRUCTURA HOJA BajaProductos', ''],
    ['Referencia', 'EAN o código del producto a dar de baja — único campo que debes rellenar'],
    ['Procesado', 'Gestionado automáticamente: "si" = completado, "no encontrado" = referencia no existe en Productos'],
    ['Error', 'Gestionado automáticamente: describe el problema si falla el proceso'],
    ['', ''],
    ['IMÁGENES — FLUJO COMPLETO DE GESTIÓN', ''],
    ['🖼️ Actualizar IDs de imagen', 'Busca en Drive por referencia y vincula imagen_drive_id a productos sin imagen asignada'],
    ['🔓 Compartir imágenes Drive', 'Aplica permisos públicos de lectura a todas las imágenes en lotes (necesario para que GitHub Actions las descargue)'],
    ['⛔ Deshabilitar con foto incorrecta', 'Marca TieneFoto=no en RegistroProductos como no visibles en el catálogo (incluir_en_catalogo=no)'],
    ['🔄 Actualizar imágenes corregidas', 'Aplica nuevas fotos subidas a la carpeta de Drive específica y reactiva el producto'],
    ['📦 Mover imágenes nuevas a carpeta principal', 'Mueve físicamente las imágenes de "imagenes_nuevas_pendientes_procesar" a "imagenes_catalogo", reemplazando la antigua si existe, y sincroniza el nuevo ID en Productos'],
    ['', ''],
    ['DESCRIPCIÓN DE COLUMNAS — HOJA PRODUCTOS', ''],
    ['referencia', 'Código EAN del producto. Clave única de identificación'],
    ['nombre', 'Nombre comercial del producto'],
    ['marca', 'Marca del producto (uso interno, no aparece en el catálogo)'],
    ['area', 'Área: drogueria / perfumeria / pinturas / talleres. Se asigna desde FamiliaProductos (ver "Reevaluar áreas")'],
    ['tipologia', 'Subcategoría/familia. Debe coincidir EXACTAMENTE con la columna Familia de FamiliaProductos'],
    ['precio_sin_iva', 'Precio base sin impuestos (coma decimal). Ej: 2,45'],
    ['iva', 'Tipo de IVA: 4, 10 o 21'],
    ['precio_con_iva', 'Precio con IVA (coma decimal). Se calcula automáticamente en el formulario'],
    ['mostrar_precio', 'si / no — si el precio aparece en el PDF del catálogo y en el buscador web'],
    ['incluir_en_catalogo', 'si / no — si el producto aparece en el catálogo. El proceso de bajas lo pone a "no" automáticamente'],
    ['oferta', 'si / no — muestra banderín rojo "★ OFERTA" sobre la imagen, y prioriza el producto en el buscador'],
    ['espacios_a_ocupar', 'Espacio que ocupa en el catálogo — ver tabla abajo'],
    ['imagen_drive_id', 'ID del archivo en Drive. Se asigna automáticamente. NO_TIENE_FOTO si no existe imagen'],
    ['fecha_registro', 'Fecha y hora de alta o última modificación (Madrid). Gestionada automáticamente. Determina el orden de "más recientes" en el buscador'],
    ['fecha_baja', 'Fecha y hora en que se dio de baja el producto. Gestionada automáticamente por el proceso de bajas'],
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
    ['', 'El nombre del archivo debe ser exactamente la referencia del producto (sin extensión)'],
    ['', 'Ej: referencia 8410104022 → archivo llamado 8410104022 en Drive'],
    ['', 'El formulario busca la imagen automáticamente al introducir la referencia'],
    ['', ''],
    ['FAMILIAS Y ÁREAS — HOJA FamiliaProductos', ''],
    ['', 'Columnas: Orden | CodigoFamilia | Familia | Area'],
    ['Orden', 'Define en qué posición aparece cada familia dentro de su área en el catálogo PDF y en el buscador'],
    ['Familia', 'Debe coincidir EXACTAMENTE (mayúsculas/minúsculas no importan) con la columna tipologia de Productos'],
    ['Area', 'Área a la que pertenece la familia: drogueria / perfumeria / pinturas / talleres. Fuente de verdad usada por "Reevaluar áreas"'],
    ['', 'Si una tipología de Productos no está en esta hoja, no aparece ordenada y su área no se actualiza automáticamente'],
    ['', ''],
    ['CATÁLOGO ZAPHIRO', ''],
    ['', 'Menú → "Actualizar catálogo Zaphiro" para forzar la actualización'],
    ['', 'La URL se gestiona en la hoja "Configuracion". Actualizar cada año cuando Zaphiro publique el nuevo catálogo'],
    ['', ''],
    ['BUSCADOR WEB DE PRODUCTOS', ''],
    ['', 'Página buscador.html — accesible desde productos.html'],
    ['', 'Lee productos.json (generado junto a los catálogos) con todos los productos visibles'],
    ['', 'Filtros: texto libre (nombre/referencia con tolerancia a errores), área, familia, rango de precio, solo ofertas'],
    ['', 'Resultados agrupados por familia respetando el Orden de FamiliaProductos; ofertas primero dentro de cada familia'],
    ['', 'Sin búsqueda activa, prioriza los productos más recientes según fecha_registro'],
    ['', 'Permite solicitar un catálogo PDF personalizado con los resultados filtrados (se envía por email vía Brevo)'],
    ['', ''],
    ['CATÁLOGOS PERSONALIZADOS (desde el buscador)', ''],
    ['', 'El usuario filtra productos en el buscador y solicita un catálogo con esos resultados'],
    ['', 'Dispara un workflow de GitHub Actions independiente (enviar_catalogo_personalizado.yml)'],
    ['', 'Genera un PDF solo con los productos filtrados y lo envía por correo automáticamente vía Brevo'],
    ['', ''],
    ['REPORTAR IMAGEN INCORRECTA (fase de evaluación)', ''],
    ['', 'Botón opcional en el modal de producto del buscador, activable/desactivable desde config-buscador.js'],
    ['', 'Usa un Web App de Apps Script independiente (scripts/reportar_imagen_incorrecta.gs) con su propio Sheet de control'],
    ['', 'Registra en una hoja "ProductosPendientesEvaluarImagen" las referencias reportadas con foto incorrecta'],
    ['', 'Ver docs/INSTRUCCIONES_REPORTAR_IMAGEN.md para activarlo o desactivarlo'],
    ['', ''],
    ['DÓNDE SE ALOJAN LOS CATÁLOGOS', ''],
    ['', 'PDFs y productos.json en GitHub Releases / carpeta data/: github.com/eloyleon23/web-orencio-matas'],
    ['', 'No están "sucios" en el código principal — se actualizan sin tocar el resto de la web'],
    ['', ''],
    ['SOPORTE TÉCNICO', ''],
    ['', 'Para cambios en diseño del PDF, buscador o comportamiento de la web, contactar con el equipo de desarrollo.'],
  ];

  const seccionFilas = [3, 9, 16, 20, 30, 39, 47, 56, 61, 68, 85, 96, 102, 109, 113, 121, 126, 132, 136];

  sheet.getRange(1, 1, datos.length, 2).setValues(datos);
  sheet.getRange(1, 1, 1, 2).merge()
    .setFontSize(13).setFontWeight('bold').setFontColor('#d91b1b');

  seccionFilas.forEach(row => {
    if (row <= datos.length)
      sheet.getRange(row, 1, 1, 2).merge()
        .setBackground('#1a1a1a').setFontColor('white').setFontWeight('bold').setFontSize(10);
  });

  sheet.getRange(1, 1, datos.length, 1).setFontWeight('bold');
  sheet.setColumnWidth(1, 240);
  sheet.setColumnWidth(2, 520);
  sheet.setRowHeightsForced(1, datos.length, 21);
  sheet.protect().setDescription('Hoja de ayuda').setWarningOnly(true);
  SpreadsheetApp.getActiveSpreadsheet().toast('✓ Hoja de Ayuda actualizada', 'Listo', 4);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
}

// ── COMPARTIR TODAS LAS IMÁGENES DE DRIVE PÚBLICAMENTE ────────────────────
//
// Aplica permisos "cualquiera con el enlace puede ver" a todos los archivos
// de la carpeta de imágenes. Necesario para que el script Python pueda
// descargarlas desde GitHub Actions.
// Procesa en lotes y puede relanzarse si se interrumpe — usa PropertiesService
// para guardar el cursor de progreso entre ejecuciones.

function compartirImagenesDrive() {
  const props       = PropertiesService.getScriptProperties();
  const folder      = DriveApp.getFolderById(DRIVE_IMAGENES_ID);
  const files       = folder.getFiles();
  const continuationToken = props.getProperty('compartir_token');

  let iterator;
  if (continuationToken) {
    iterator = DriveApp.continueFileIterator(continuationToken);
    SpreadsheetApp.getActiveSpreadsheet()
      .toast('Reanudando desde donde se dejó...', '🔓 Compartiendo imágenes', 5);
  } else {
    iterator = folder.getFiles();
    SpreadsheetApp.getActiveSpreadsheet()
      .toast('Iniciando — puede tardar varios minutos con 9500 archivos...', '🔓 Compartiendo imágenes', 8);
  }

  let procesados = parseInt(props.getProperty('compartir_count') || '0');
  let errores    = 0;
  const START    = Date.now();
  const MAX_MS   = 5 * 60 * 1000; // 5 minutos máximo por ejecución

  while (iterator.hasNext()) {
    // Parar antes de agotar el tiempo y guardar progreso
    if (Date.now() - START > MAX_MS) {
      props.setProperty('compartir_token', iterator.getContinuationToken());
      props.setProperty('compartir_count', procesados.toString());
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Pausado en ${procesados} archivos. Vuelve a ejecutar para continuar.`,
        '⏸️ Progreso guardado', 10
      );
      return;
    }

    try {
      const file = iterator.next();
      // Aplicar permiso público de lectura
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      procesados++;
    } catch(e) {
      errores++;
      console.warn('Error en archivo: ' + e.message);
    }
  }

  // Proceso completado — limpiar estado
  props.deleteProperty('compartir_token');
  props.deleteProperty('compartir_count');

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✓ ${procesados} imágenes compartidas públicamente. Errores: ${errores}`,
    '🔓 Completado', 10
  );
}

// ── ACTUALIZAR IDs DE IMAGEN DESDE DRIVE ──────────────────────────────────
//
// Recorre todos los productos de la hoja Productos y para cada uno busca
// en la carpeta Drive si existe un archivo con el mismo nombre que la referencia.
// Si lo encuentra, actualiza imagen_drive_id. Si no, pone NO_TIENE_FOTO.
// Solo actualiza filas donde imagen_drive_id esté vacío o sea NO_TIENE_FOTO,
// respetando las que ya tienen un ID válido.

function actualizarImagenesDrive() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetProd = ss.getSheetByName('Productos');

  if (!sheetProd) {
    SpreadsheetApp.getUi().alert('No existe la hoja "Productos".');
    return;
  }

  // ── Cabeceras ─────────────────────────────────────────────────────────────
  const headers = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/ /g, '_'));

  const colRef = headers.indexOf('referencia');
  const colImg = headers.indexOf('imagen_drive_id');

  if (colRef === -1 || colImg === -1) {
    SpreadsheetApp.getUi().alert('La hoja Productos debe tener las columnas "referencia" e "imagen_drive_id".');
    return;
  }

  // ── Cargar caché de imágenes de Drive ────────────────────────────────────
  SpreadsheetApp.getActiveSpreadsheet()
    .toast('Cargando imágenes de Drive...', '🖼️ Actualizando', 5);

  const cache = cargarCacheImagenes_();
  const totalEnDrive = Object.keys(cache).length;
  console.log(`Imágenes en Drive: ${totalEnDrive}`);

  if (totalEnDrive === 0) {
    SpreadsheetApp.getUi().alert('No se encontraron imágenes en la carpeta de Drive. Verifica el ID de carpeta.');
    return;
  }

  // ── Leer productos ────────────────────────────────────────────────────────
  const lastRow  = sheetProd.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('No hay productos en la hoja.'); return; }

  const data = sheetProd.getRange(2, 1, lastRow - 1, sheetProd.getLastColumn()).getValues();

  let actualizados = 0, sinImagen = 0, yaTenian = 0, procesados = 0;
  const BATCH = 50; // escribir en lotes para evitar timeout

  for (let i = 0; i < data.length; i++) {
    const row        = data[i];
    const ref        = row[colRef] ? row[colRef].toString().trim() : '';
    const imgActual  = row[colImg] ? row[colImg].toString().trim() : '';
    const rowNum     = i + 2;

    // Saltar filas sin referencia
    if (!ref) continue;

    // Saltar si ya tiene un ID válido (no vacío y no NO_TIENE_FOTO)
    if (imgActual && imgActual !== 'NO_TIENE_FOTO' && imgActual !== '') {
      yaTenian++;
      procesados++;
      continue;
    }

    // Buscar imagen por referencia en la caché de Drive
    const driveId = cache[ref] || cache[ref.toUpperCase()] || cache[ref.toLowerCase()] || '';

    if (driveId) {
      sheetProd.getRange(rowNum, colImg + 1).setValue(driveId);
      actualizados++;
    } else {
      sheetProd.getRange(rowNum, colImg + 1).setValue('NO_TIENE_FOTO');
      sinImagen++;
    }

    procesados++;

    // Flush cada BATCH filas para no perder progreso si hay timeout
    if (procesados % BATCH === 0) {
      SpreadsheetApp.flush();
      SpreadsheetApp.getActiveSpreadsheet()
        .toast(`Procesados: ${procesados}/${data.length}...`, '🖼️ Actualizando', 10);
    }
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✓ Con imagen: ${actualizados} | Sin imagen: ${sinImagen} | Ya tenían ID: ${yaTenian}`,
    '🖼️ Actualización completada', 10
  );
}

// ── DESHABILITAR PRODUCTOS CON FOTO INCORRECTA ────────────────────────────
//
// Lee RegistroProductos donde TieneFoto = "no" Y Procesado = "no"
// y pone incluir_en_catalogo = "no" en la hoja Productos.
// Marca la fila en RegistroProductos con Procesado = "deshabilitado"
// para distinguirla de las pendientes de sincronizar.

function deshabilitarProductosSinFoto() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetReg  = ss.getSheetByName('RegistroProductos');
  const sheetProd = ss.getSheetByName('Productos');

  if (!sheetReg)  { SpreadsheetApp.getUi().alert('No existe la hoja "RegistroProductos".'); return; }
  if (!sheetProd) { SpreadsheetApp.getUi().alert('No existe la hoja "Productos".'); return; }

  // Cabeceras RegistroProductos
  const regHeaders = sheetReg.getRange(1, 1, 1, sheetReg.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim());
  const REGCOL = {};
  regHeaders.forEach((h, i) => { REGCOL[h] = i; });

  // Cabeceras Productos
  const prodHeaders = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/ /g,'_'));
  const PROD = {};
  prodHeaders.forEach((h, i) => { PROD[h] = i; });

  const colRef      = PROD['referencia'];
  const colIncluir  = PROD['incluir_en_catalogo'];
  if (colRef === undefined || colIncluir === undefined) {
    SpreadsheetApp.getUi().alert('Faltan columnas "referencia" o "incluir_en_catalogo" en Productos.');
    return;
  }

  // Índice de productos por EAN
  const prodData  = sheetProd.getRange(2, 1, Math.max(sheetProd.getLastRow()-1,1), sheetProd.getLastColumn()).getValues();
  const prodIndex = {};
  prodData.forEach((row, i) => {
    const ref = row[colRef];
    if (ref) prodIndex[ref.toString().trim()] = i;
  });

  // Leer RegistroProductos
  const lastRow = sheetReg.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('RegistroProductos está vacío.'); return; }
  const regData = sheetReg.getRange(2, 1, lastRow-1, regHeaders.length).getValues();

  let deshabilitados = 0, noEncontrados = 0, saltados = 0;

  for (let i = 0; i < regData.length; i++) {
    const fila   = regData[i];
    const rowNum = i + 2;

    const tieneFoto = REGCOL['TieneFoto']  !== undefined ? fila[REGCOL['TieneFoto']].toString().trim().toLowerCase()  : '';
    const procesado = REGCOL['Procesado']  !== undefined ? fila[REGCOL['Procesado']].toString().trim().toLowerCase()  : '';
    const ean       = REGCOL['CodigoEAN']  !== undefined ? fila[REGCOL['CodigoEAN']].toString().trim()                : '';

    // Solo procesar: TieneFoto = no Y Procesado = no (o vacío)
    if (tieneFoto !== 'no') { saltados++; continue; }
    if (procesado !== 'no' && procesado !== '') { saltados++; continue; }
    if (!ean) { saltados++; continue; }

    const idx = prodIndex[ean];
    if (idx === undefined) {
      noEncontrados++;
      if (REGCOL['Error'] !== undefined)
        sheetReg.getRange(rowNum, REGCOL['Error']+1).setValue('No encontrado en Productos');
      continue;
    }

    // Deshabilitar en Productos
    sheetProd.getRange(idx+2, colIncluir+1).setValue('no');

    // Marcar en RegistroProductos como deshabilitado
    if (REGCOL['Procesado'] !== undefined)
      sheetReg.getRange(rowNum, REGCOL['Procesado']+1).setValue('deshabilitado');

    deshabilitados++;

    if (deshabilitados % 100 === 0) {
      SpreadsheetApp.flush();
      SpreadsheetApp.getActiveSpreadsheet()
        .toast(`Deshabilitando... ${deshabilitados} productos`, '⛔ En proceso', 5);
    }
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `⛔ Deshabilitados: ${deshabilitados} | No encontrados: ${noEncontrados} | Saltados: ${saltados}`,
    '✓ Completado', 10
  );
}

// ── ACTUALIZAR IMÁGENES CORREGIDAS DESDE DRIVE ────────────────────────────
//
// Lee RegistroProductos donde Procesado = "deshabilitado" (foto incorrecta)
// Busca en la carpeta "imagenes_nuevas_pendientes_procesar" un archivo con
// el nombre del EAN. Si lo encuentra:
//   - Comparte el archivo públicamente
//   - Actualiza imagen_drive_id en Productos
//   - Reactiva incluir_en_catalogo = "si"
//   - Marca Procesado = "imagen_actualizada" en RegistroProductos
// Si no encuentra la imagen nueva, deja el producto deshabilitado.

const DRIVE_IMAGENES_NUEVAS_ID = '1DL_2XvpR4IyOjRNyqAZvav5uy2WV3d7n';

function actualizarImagenesCorregidas() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetReg  = ss.getSheetByName('RegistroProductos');
  const sheetProd = ss.getSheetByName('Productos');

  if (!sheetReg)  { SpreadsheetApp.getUi().alert('No existe la hoja "RegistroProductos".'); return; }
  if (!sheetProd) { SpreadsheetApp.getUi().alert('No existe la hoja "Productos".'); return; }

  // Cabeceras
  const regHeaders = sheetReg.getRange(1, 1, 1, sheetReg.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim());
  const REGCOL = {};
  regHeaders.forEach((h, i) => { REGCOL[h] = i; });

  const prodHeaders = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/ /g,'_'));
  const PROD = {};
  prodHeaders.forEach((h, i) => { PROD[h] = i; });

  const colRef     = PROD['referencia'];
  const colIncluir = PROD['incluir_en_catalogo'];
  const colImg     = PROD['imagen_drive_id'];
  const colFecha   = PROD['fecha_registro'];

  if (colRef === undefined || colIncluir === undefined || colImg === undefined) {
    SpreadsheetApp.getUi().alert('Faltan columnas necesarias en Productos.');
    return;
  }

  // Cargar caché de imágenes nuevas
  SpreadsheetApp.getActiveSpreadsheet()
    .toast('Cargando imágenes nuevas de Drive...', '🔄 Actualizando', 5);

  const cacheNuevas = {};
  try {
    const folder = DriveApp.getFolderById(DRIVE_IMAGENES_NUEVAS_ID);
    const files  = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const ean  = file.getName().replace(/\.[^.]+$/, '').trim();
      cacheNuevas[ean] = file;  // guardar el objeto File para compartirlo
    }
  } catch(e) {
    SpreadsheetApp.getUi().alert('Error accediendo a la carpeta de imágenes nuevas: ' + e.message);
    return;
  }

  const totalNuevas = Object.keys(cacheNuevas).length;
  if (totalNuevas === 0) {
    SpreadsheetApp.getUi().alert('No hay imágenes en la carpeta "imagenes_nuevas_pendientes_procesar".');
    return;
  }

  SpreadsheetApp.getActiveSpreadsheet()
    .toast(`${totalNuevas} imágenes nuevas encontradas. Procesando...`, '🔄 Actualizando', 5);

  // Índice de productos
  const prodData  = sheetProd.getRange(2, 1, Math.max(sheetProd.getLastRow()-1,1), sheetProd.getLastColumn()).getValues();
  const prodIndex = {};
  prodData.forEach((row, i) => {
    const ref = row[colRef];
    if (ref) prodIndex[ref.toString().trim()] = i;
  });

  // Leer RegistroProductos
  const lastRow = sheetReg.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('RegistroProductos está vacío.'); return; }
  const regData = sheetReg.getRange(2, 1, lastRow-1, regHeaders.length).getValues();

  let actualizados = 0, sinImagenNueva = 0, noEncontrados = 0, saltados = 0;
  const ahora = Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM/yyyy HH:mm');

  for (let i = 0; i < regData.length; i++) {
    const fila   = regData[i];
    const rowNum = i + 2;

    const procesado = REGCOL['Procesado'] !== undefined ? fila[REGCOL['Procesado']].toString().trim().toLowerCase() : '';
    const ean       = REGCOL['CodigoEAN'] !== undefined ? fila[REGCOL['CodigoEAN']].toString().trim()               : '';

    // Solo procesar los marcados como "deshabilitado"
    if (procesado !== 'deshabilitado') { saltados++; continue; }
    if (!ean) { saltados++; continue; }

    // Buscar imagen nueva en Drive
    const fileNuevo = cacheNuevas[ean] || cacheNuevas[ean.toUpperCase()] || cacheNuevas[ean.toLowerCase()];

    if (!fileNuevo) {
      sinImagenNueva++;
      continue; // Sin imagen nueva — mantener deshabilitado
    }

    // Buscar producto en Productos
    const idx = prodIndex[ean];
    if (idx === undefined) {
      noEncontrados++;
      if (REGCOL['Error'] !== undefined)
        sheetReg.getRange(rowNum, REGCOL['Error']+1).setValue('No encontrado en Productos');
      continue;
    }

    try {
      // Compartir imagen nueva públicamente
      fileNuevo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      const nuevoId  = fileNuevo.getId();
      const prodRowNum = idx + 2;

      // Actualizar imagen_drive_id, reactivar y actualizar fecha
      sheetProd.getRange(prodRowNum, colImg+1).setValue(nuevoId);
      sheetProd.getRange(prodRowNum, colIncluir+1).setValue('si');
      if (colFecha !== undefined)
        sheetProd.getRange(prodRowNum, colFecha+1).setValue(ahora);

      // Marcar en RegistroProductos
      if (REGCOL['Procesado'] !== undefined)
        sheetReg.getRange(rowNum, REGCOL['Procesado']+1).setValue('imagen_actualizada');
      if (REGCOL['TieneFoto'] !== undefined)
        sheetReg.getRange(rowNum, REGCOL['TieneFoto']+1).setValue('si');
      if (REGCOL['Error'] !== undefined)
        sheetReg.getRange(rowNum, REGCOL['Error']+1).setValue('');

      actualizados++;

      if (actualizados % 50 === 0) {
        SpreadsheetApp.flush();
        SpreadsheetApp.getActiveSpreadsheet()
          .toast(`Actualizando... ${actualizados} imágenes`, '🔄 En proceso', 5);
      }
    } catch(e) {
      if (REGCOL['Error'] !== undefined)
        sheetReg.getRange(rowNum, REGCOL['Error']+1).setValue(e.message);
    }
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✓ Actualizados: ${actualizados} | Sin imagen nueva: ${sinImagenNueva} | No encontrados: ${noEncontrados} | Saltados: ${saltados}`,
    '✓ Actualización completada', 12
  );
}

// ── MOVER IMÁGENES NUEVAS A LA CARPETA PRINCIPAL ──────────────────────────
//
// Recorre "imagenes_nuevas_pendientes_procesar" y, para cada archivo:
//   1. Si ya existe un archivo con el mismo nombre (EAN) en "imagenes_catalogo",
//      lo elimina (lo manda a la papelera de Drive)
//   2. Mueve el archivo nuevo a "imagenes_catalogo"
//   3. Lo comparte públicamente
//   4. Actualiza imagen_drive_id en Productos con el ID (el ID cambia al mover)
//   5. Si el producto estaba deshabilitado por foto incorrecta, lo reactiva
//   6. Marca la fila correspondiente en RegistroProductos como "imagen_actualizada"
//
// Tras ejecutar esta función, la carpeta "imagenes_nuevas_pendientes_procesar"
// debería quedar vacía — todo el contenido pasa a "imagenes_catalogo".
// Es seguro relanzarla: solo procesa lo que quede en la carpeta de pendientes.

function moverImagenesNuevasACarpetaPrincipal() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetProd = ss.getSheetByName('Productos');
  const sheetReg  = ss.getSheetByName('RegistroProductos');

  if (!sheetProd) { SpreadsheetApp.getUi().alert('No existe la hoja "Productos".'); return; }

  // Cabeceras Productos
  const prodHeaders = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/ /g,'_'));
  const PROD = {};
  prodHeaders.forEach((h, i) => { PROD[h] = i; });

  const colRef     = PROD['referencia'];
  const colImg     = PROD['imagen_drive_id'];
  const colIncluir = PROD['incluir_en_catalogo'];
  const colFecha   = PROD['fecha_registro'];

  if (colRef === undefined || colImg === undefined) {
    SpreadsheetApp.getUi().alert('Faltan columnas "referencia" o "imagen_drive_id" en Productos.');
    return;
  }

  // Cabeceras RegistroProductos (opcional, solo si existe)
  let REGCOL = {};
  let regHeaders = [];
  if (sheetReg) {
    regHeaders = sheetReg.getRange(1, 1, 1, sheetReg.getLastColumn()).getValues()[0]
      .map(h => h.toString().trim());
    regHeaders.forEach((h, i) => { REGCOL[h] = i; });
  }

  // Índice de productos por referencia (EAN), incluyendo número de fila real
  const prodData = sheetProd.getRange(2, 1, Math.max(sheetProd.getLastRow()-1,1), sheetProd.getLastColumn()).getValues();
  const prodIndex = {};
  prodData.forEach((row, i) => {
    const ref = row[colRef];
    if (ref) prodIndex[ref.toString().trim().toUpperCase()] = i;
  });

  // Índice de RegistroProductos por EAN (para marcar imagen_actualizada)
  let regIndex = {};
  let regData = [];
  if (sheetReg && REGCOL['CodigoEAN'] !== undefined) {
    const regLastRow = sheetReg.getLastRow();
    if (regLastRow >= 2) {
      regData = sheetReg.getRange(2, 1, regLastRow - 1, regHeaders.length).getValues();
      regData.forEach((row, i) => {
        const ean = row[REGCOL['CodigoEAN']];
        if (ean) regIndex[ean.toString().trim().toUpperCase()] = i;
      });
    }
  }

  const carpetaPrincipal = DriveApp.getFolderById(DRIVE_IMAGENES_ID);
  const carpetaPendientes = DriveApp.getFolderById(DRIVE_IMAGENES_NUEVAS_ID);

  SpreadsheetApp.getActiveSpreadsheet()
    .toast('Leyendo imágenes pendientes...', '📦 Moviendo imágenes', 5);

  const archivosPendientes = [];
  const iter = carpetaPendientes.getFiles();
  while (iter.hasNext()) archivosPendientes.push(iter.next());

  if (archivosPendientes.length === 0) {
    SpreadsheetApp.getUi().alert('No hay imágenes en "imagenes_nuevas_pendientes_procesar".');
    return;
  }

  const ahora = Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM/yyyy HH:mm');
  let movidas = 0, reemplazadas = 0, sinProducto = 0, errores = 0;

  archivosPendientes.forEach((archivo, idx) => {
    const ean = archivo.getName().replace(/\.[^.]+$/, '').trim();
    if (!ean) { errores++; return; }

    try {
      // 1. Eliminar imagen antigua en la carpeta principal si existe con el mismo nombre
      const existentes = carpetaPrincipal.getFilesByName(ean);
      let huboReemplazo = false;
      while (existentes.hasNext()) {
        const antiguo = existentes.next();
        antiguo.setTrashed(true);
        huboReemplazo = true;
      }
      if (huboReemplazo) reemplazadas++;

      // 2. Mover el archivo nuevo a la carpeta principal
      carpetaPrincipal.addFile(archivo);
      carpetaPendientes.removeFile(archivo);

      // 3. Compartir públicamente
      archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const nuevoId = archivo.getId();

      // 4. Actualizar imagen_drive_id en Productos (y reactivar si estaba deshabilitado)
      const prodIdx = prodIndex[ean.toUpperCase()];
      if (prodIdx !== undefined) {
        const prodRowNum = prodIdx + 2;
        sheetProd.getRange(prodRowNum, colImg + 1).setValue(nuevoId);
        if (colIncluir !== undefined) {
          sheetProd.getRange(prodRowNum, colIncluir + 1).setValue('si');
        }
        if (colFecha !== undefined) {
          sheetProd.getRange(prodRowNum, colFecha + 1).setValue(ahora);
        }
        movidas++;
      } else {
        sinProducto++;
      }

      // 5. Marcar en RegistroProductos si existe la fila correspondiente
      const regIdx = regIndex[ean.toUpperCase()];
      if (regIdx !== undefined && REGCOL['Procesado'] !== undefined) {
        const regRowNum = regIdx + 2;
        sheetReg.getRange(regRowNum, REGCOL['Procesado'] + 1).setValue('imagen_actualizada');
        if (REGCOL['TieneFoto'] !== undefined)
          sheetReg.getRange(regRowNum, REGCOL['TieneFoto'] + 1).setValue('si');
        if (REGCOL['Error'] !== undefined)
          sheetReg.getRange(regRowNum, REGCOL['Error'] + 1).setValue('');
      }

      if ((idx + 1) % 20 === 0) {
        SpreadsheetApp.flush();
        SpreadsheetApp.getActiveSpreadsheet()
          .toast(`Procesadas ${idx + 1}/${archivosPendientes.length}...`, '📦 Moviendo imágenes', 5);
      }
    } catch (e) {
      errores++;
      console.error(`Error procesando ${ean}: ${e.message}`);
    }
  });

  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✓ Movidas: ${movidas} (${reemplazadas} reemplazaron una antigua) | ` +
    `Sin producto en Productos: ${sinProducto} | Errores: ${errores}`,
    '📦 Proceso completado', 12
  );
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

// ── CLASIFICACIÓN AUTOMÁTICA DE SUBFAMILIAS CON IA ───────────────────────
//
// Usa la API de Claude (Anthropic) para analizar el nombre de cada producto
// y asignarle automáticamente una subfamilia dentro de su familia.
//
// CONFIGURACIÓN PREVIA (una sola vez):
//   En Apps Script → Configuración del proyecto → Propiedades de script → Añadir:
//   Clave: ANTHROPIC_API_KEY  |  Valor: tu clave API de Anthropic (sk-ant-...)
//
// ── CLASIFICACIÓN AUTOMÁTICA DE SUBFAMILIAS (por keywords, sin coste) ────
//
// Analiza el nombre de cada producto y le asigna una subfamilia dentro de
// su familia usando reglas de palabras clave predefinidas.
// Sin coste adicional — funciona totalmente offline.
//
// REANUDACIÓN: Los productos que ya tienen subfamilia se saltan.
// Para reclasificar todo, borra la columna subfamilia antes de ejecutar.

function clasificarSubfamiliasConIA() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetProd = ss.getSheetByName('Productos');
  if (!sheetProd) { SpreadsheetApp.getUi().alert('No existe la hoja "Productos".'); return; }

  const REGLAS = obtenerReglasSubfamilias_();

  const headers = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/ /g,'_'));
  if (!headers.includes('subfamilia')) {
    sheetProd.getRange(1, headers.length + 1).setValue('subfamilia');
    headers.push('subfamilia');
  }
  const PROD = {};
  headers.forEach((h, i) => { PROD[h] = i; });

  const colNombre  = PROD['nombre'];
  const colFamilia = PROD['tipologia'];
  const colSubfam  = PROD['subfamilia'];

  if (colNombre === undefined || colFamilia === undefined) {
    SpreadsheetApp.getUi().alert('Faltan columnas necesarias (nombre, tipologia) en Productos.');
    return;
  }

  const lastRow = sheetProd.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('No hay productos.'); return; }

  SpreadsheetApp.getActiveSpreadsheet()
    .toast('Clasificando subfamilias por keywords...', '🗂️ Procesando', 10);

  const data = sheetProd.getRange(2, 1, lastRow - 1, sheetProd.getLastColumn()).getValues();

  let clasificados = 0, saltados = 0;
  const updates = [];

  data.forEach((row, i) => {
    const subfamActual = colSubfam !== undefined ? row[colSubfam].toString().trim() : '';
    if (subfamActual) { saltados++; return; }

    const nombre  = row[colNombre]  ? row[colNombre].toString().trim().toLowerCase()  : '';
    const familia = row[colFamilia] ? row[colFamilia].toString().trim().toUpperCase() : '';
    if (!nombre || !familia) return;

    const reglas = REGLAS[familia] || [['General', []]];
    const subfam = inferirSubfamilia_(nombre, reglas);
    updates.push({ row: i + 2, val: subfam });
    clasificados++;
  });

  updates.forEach(u => sheetProd.getRange(u.row, colSubfam + 1).setValue(u.val));
  SpreadsheetApp.flush();
  generarHojaSubfamilias_();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✓ Clasificados: ${clasificados} | Ya tenían subfamilia: ${saltados}\nHoja "SubfamiliaProductos" actualizada.`,
    '✓ Clasificación completada', 12
  );
}

function inferirSubfamilia_(nombre, reglas) {
  const n = nombre.toLowerCase();
  for (const [subfam, keywords] of reglas) {
    if (keywords.length === 0) return subfam;
    for (const kw of keywords) {
      if (n.includes(kw.toLowerCase())) return subfam;
    }
  }
  return reglas[reglas.length - 1][0];
}

function obtenerReglasSubfamilias_() {
  return {
    'PINTURAS Y BARNICES': [
      ['Spray / Aerosol',           ['spray', 'aerosol']],
      ['Imprimaciones y aparejos',  ['imprim', 'aparejo', 'fondo anticor', 'sellador', 'tapaporos']],
      ['Lacas',                     ['laca ']],
      ['Barnices y lasures',        ['barniz', 'lasur', 'saturador']],
      ['Pinturas anticorrosión',    ['anticorr', 'oxido', 'óxido', 'oxiron']],
      ['Pinturas para suelos',      ['suelo', 'pavimento', 'tráfico', 'trafico', 'garaje']],
      ['Pinturas para exterior',    ['exterior', 'fachada', 'siloxan', 'monocapa']],
      ['Esmaltes sintéticos',       ['esmalte', 'sintet']],
      ['Pinturas al agua',          ['plastica', 'plástica', 'acrilica', 'acrílica', 'al agua', 'latex', 'látex']],
      ['Otros pinturas',            []],
    ],
    'AKZONOBEL': [
      ['Spray AkzoNobel',           ['spray']],
      ['Xyladecor / Xylamon',       ['xyladecor', 'xylamon']],
      ['Sikkens',                   ['sikkens', 'cetol', 'rubbol']],
      ['Bondex',                    ['bondex']],
      ['Hammerite',                 ['hammerite']],
      ['Bruguer Renovación',        ['renov']],
      ['Bruguer exterior',          ['exterior', 'fachada', 'siloxan']],
      ['Imprimaciones AkzoNobel',   ['imprim', 'aparejo', 'fondo']],
      ['Bruguer interior',          []],
    ],
    'PINTURAS TITAN': [
      ['Spray Titan',               ['spray']],
      ['Oxiron anticorrosión',      ['oxiron', 'anticorr']],
      ['Imprimaciones Titan',       ['imprim', 'aparejo', 'fondo']],
      ['Titan madera',              ['madera', 'lasur', 'barniz']],
      ['Titanlux esmalte',          ['titanlux', 'esmalte', 'sintet']],
      ['Titan Plástico al agua',    []],
    ],
    'PINTURAS DURAVAL': [
      ['Imprimaciones Duraval',     ['imprim', 'aparejo', 'fondo']],
      ['Esmaltes Duraval',          ['esmalte']],
      ['Pinturas plásticas Duraval',[]],
    ],
    'BROCHAS Y UTILES DE APLICACION': [
      ['Cintas de enmascarar',      ['cinta', 'krepp', 'enmascarar', 'masking']],
      ['Espátulas y rasquetas',     ['espátula', 'espatula', 'rasquet']],
      ['Cubetas y bandejas',        ['cubeta', 'bandeja']],
      ['Rodillos y accesorios',     ['rodillo', 'mango', 'alargador', 'telesc']],
      ['Plásticos y protección',    ['plástico', 'plastico', 'lona', 'protec']],
      ['Brochas y pinceles',        []],
    ],
    'LIJAS': [
      ['Lijas al agua',             ['agua', 'wet']],
      ['Esponjas abrasivas',        ['esponja', 'fibra abras', 'scotch']],
      ['Lijas en rollo',            ['rollo']],
      ['Lijas en hoja',             []],
    ],
    'PEGAMENTOS Y COLA CONTACTO': [
      ['Espumas de poliuretano',    ['espuma', 'poliuret', 'foam']],
      ['Siliconas y selladores',    ['silicona', 'sellador', 'mastic']],
      ['Adhesivos de montaje',      ['montaje', 'construcc', 'panel']],
      ['Pegamentos instantáneos',   ['instant', 'cianoacr', 'super glue', 'loctite']],
      ['Cinta adhesiva doble cara', ['cinta']],
      ['Colas de contacto',         []],
    ],
    'AGUARRAS Y DISOLVENTES': [
      ['Quitapinturas y decapantes',['quitapint', 'decapant']],
      ['Diluyentes al agua',        ['al agua', 'acrilico', 'acrílico']],
      ['Disolvente nitro',          ['nitro']],
      ['Aguarrás mineral',          ['aguarras', 'aguarrás', 'mineral', 'esencia trementina']],
      ['Disolventes universales',   []],
    ],
    'PRODUCTOS QUIMICOS': [
      ['Ácidos',                    ['acido', 'ácido', 'nitric', 'sulfur', 'muriatic']],
      ['Agua destilada',            ['destilada', 'desmineral', 'metanol']],
      ['Alcoholes',                 ['alcohol', 'etanol', 'isoprop']],
      ['Otros productos químicos',  []],
    ],
    'DETERGENTES ROPA': [
      ['Detergente industrial/profesional', ['prof', 'saco ', 'industri']],
      ['Detergente bebé/delicado',  ['bebé', 'bebe', 'delicado', 'infantil']],
      ['Detergente en cápsulas',    ['cápsula', 'capsula', 'pods', 'bolita']],
      ['Detergente en polvo',       ['polvo', 'saco']],
      ['Detergente ecológico',      ['eco', 'ecológico', 'vegetal']],
      ['Detergente color',          ['color', 'negro', 'oscuro']],
      ['Detergente líquido',        []],
    ],
    'LAVAVAJILLAS AUTOMATICOS': [
      ['Abrillantador lavavajillas',['abrillant']],
      ['Sal lavavajillas',          ['sal ']],
      ['Pastillas lavavajillas',    ['pastill', 'tableta']],
      ['Gel / líquido máquina',     []],
    ],
    'LAVAVAJILLAS A MANO': [
      ['Concentrado',               ['concentr', 'ultra']],
      ['Ecológico',                 ['eco', 'vegetal', 'natural']],
      ['Lavavajillas mano',         []],
    ],
    'LEJIAS': [
      ['Lejía con detergente',      ['detergente', 'limpiadora', 'multiusos']],
      ['Lejía concentrada',         ['concentr', 'fuerte', 'reforzada']],
      ['Lejía perfumada',           ['colonia', 'pino', 'lavanda', 'floral', 'perfum']],
      ['Lejía en pastillas',        ['pastill']],
      ['Lejía normal',              []],
    ],
    'SUAVIZANTES ROPA': [
      ['Suavizante profesional',    ['prof', '10 l', '20 l']],
      ['Suavizante para bebé',      ['bebé', 'bebe', 'infantil']],
      ['Suavizante concentrado',    ['concentr']],
      ['Suavizante normal',         []],
    ],
    'LIMPIACRISTALES Y MULTIUSOS': [
      ['Limpiacristales',           ['cristal', 'vidrio', 'glass', 'ventana']],
      ['Spray multiusos',           ['spray', 'pistola']],
      ['Multiusos hogar',           []],
    ],
    'LIMPIADORES LIQUIDOS': [
      ['Limpiadores baño / WC',     ['baño', 'wc', 'inodoro', 'sanit', 'antical', 'desincrustante']],
      ['Limpiadores cocina',        ['cocina', 'horno', 'campana', 'grill']],
      ['Desengrasantes',            ['desengras', 'grasa', 'kh-7']],
      ['Limpiadores industriales',  ['industri', 'prof', 'garrafa', '5 l', '20 l']],
      ['Limpiadores suelos',        ['suelo', 'fregasuelos', 'parquet', 'terrazo', 'mármol', 'marmol']],
      ['Otros limpiadores',         []],
    ],
    'DESINFECTANTES': [
      ['Desinfectantes de manos',   ['manos', 'gel', 'hidroalcohol', 'bactericida']],
      ['Desinfectantes alimentarios',['aliment', 'hostelería', 'hosteleria']],
      ['Desinfectantes superficies',[]],
    ],
    'AMBIENTADORES': [
      ['Eléctricos',                ['eléctric', 'electrico', 'enchufe', 'aparato']],
      ['Varillas difusoras',        ['varilla', 'mikado', 'difusor']],
      ['Para ropa y textil',        ['ropa', 'tela', 'textil', 'armario']],
      ['Spray',                     ['spray', 'aerosol']],
      ['Otros ambientadores',       []],
    ],
    'INSECTICIDAS': [
      ['Antiparasitarios mascotas', ['mascota', 'perro', 'gato', 'pulgas', 'garrapatac']],
      ['Trampas insectos',          ['trampa', 'cebo gel']],
      ['Insecticidas jardín',       ['jardín', 'jardin', 'planta', 'pulgón']],
      ['Insecticidas rastreros',    ['rast', 'cucarach', 'hormiga', 'jeringa']],
      ['Antimosquitos',             ['mosquito', 'tigre']],
      ['Insecticidas voladores',    ['mosca', 'avispa', 'volad']],
      ['Otros insecticidas',        []],
    ],
    'PAPELES Y CELULOSAS': [
      ['Papel higiénico industrial',['industri', 'jumbo', 'maxi']],
      ['Papel de cocina',           ['cocina', 'multiusos']],
      ['Pañuelos faciales',         ['facial', 'pañuelos', 'pañuelo']],
      ['Servilletas',               ['servilleta']],
      ['Papel higiénico doméstico', []],
    ],
    'UTILES DE LIMPIEZA PROFESIONAL': [
      ['Carros de limpieza',        ['carro ']],
      ['Contenedores y papeleras',  ['contenedor', 'papelera', 'cubo basura']],
      ['Cubos y accesorios',        ['cubo ', 'prensa', 'rueda', 'saco tela', 'pinza']],
      ['Secadores de manos',        ['secador', 'secamanos']],
      ['Dispensadores papel',       ['dispensador papel', 'portarrollos']],
      ['Dosificadores jabón',       ['dosificador', 'dispensador']],
      ['Limpiacristales prof.',     ['lavavidrios', 'haragan', 'haragán', 'goma repuesto', 'vellon']],
      ['Señalización',              ['señal', 'señaliz']],
      ['Otros útiles profesional',  []],
    ],
    'PRODUCTOS LIMPIEZA INDUSTRIALES': [
      ['Lavavajillas industrial',   ['lavavajillas', 'sumadish', 'rinse', 'abrillant', 'scale', 'special l4']],
      ['Detergentes ropa industrial',['detergente', 'suaviz', 'mimosin', 'flor suav']],
      ['Desengrasantes industriales',['desengras', 'kh-7']],
      ['Limpiadores suelos industr.',['suelos', 'ceras', 'decapante', 'abrillantad', 'jontec', 'sprint', 'emerel']],
      ['Productos higiene manos',   ['jabón manos', 'jabon manos', 'gel manos', 'silk', 'klint']],
      ['Desinfectantes industriales',[]],
    ],
    'BAYETAS, GAMUZAS Y PAÑOS': [
      ['Bayetas microfibra',        ['microfibra']],
      ['Gamuzas',                   ['gamuza']],
      ['Bayetas desechables',       ['desechable']],
      ['Bayetas y paños',           []],
    ],
    'ESTROPAJOS': [
      ['Con esponja',               ['esponja']],
      ['Fibra metálica',            ['acero', 'metal', 'inox']],
      ['Estropajos',                []],
    ],
    'GELES Y JABONES BAÑO': [
      ['Formato profesional',       ['5 l', '5l', 'garrafa', 'prof', '10 l']],
      ['Gel íntimo',                ['íntimo', 'intimo', 'femenino']],
      ['Exfoliante corporal',       ['exfoli', 'scrub', 'peeling']],
      ['Baño de burbujas',          ['burbujas']],
      ['Gel de ducha',              []],
    ],
    'CHAMPUS': [
      ['Gran formato profesional',  ['5 l', '10 l', 'prof', 'garrafa', 'granel']],
      ['Champú 2 en 1',             ['2en1', '2 en 1', '2&1']],
      ['Champú infantil',           ['infantil', 'bebé', 'bebe', 'niño', 'kids']],
      ['Champú anticaspa',          ['anticaspa', 'caspa']],
      ['Champú cabello teñido',     ['color', 'teñido', 'tinte', 'rubio']],
      ['Champú cabello seco/dañado',['seco', 'dañado', 'reparad', 'nutriti']],
      ['Champú cabello graso',      ['graso', 'grasa', 'purific']],
      ['Champú uso frecuente',      []],
    ],
    'DESODORANTES': [
      ['Antitranspirante',          ['antitransp', 'anti-transp', 'sudor']],
      ['Stick',                     ['stick', 'barra']],
      ['Roll-on',                   ['roll', 'bola']],
      ['Spray',                     ['spray', 'aerosol']],
      ['Otros desodorantes',        []],
    ],
    'CREMAS DE BELLEZA': [
      ['Protector solar facial',    ['solar', 'spf', 'uv', 'sun']],
      ['Sérum y tratamientos',      ['serum', 'sérum', 'tratami', 'ampolla']],
      ['Contorno de ojos',          ['ojos', 'contorno']],
      ['Crema anti-edad',           ['anti-edad', 'antiedad', 'reafirm', 'lifting']],
      ['Crema facial noche',        ['noche']],
      ['Limpieza facial',           ['limpiadora', 'desmaquill', 'tónico', 'espuma limpiadora']],
      ['Crema facial día',          []],
    ],
    'ACEITES Y LECHES CORPORALES': [
      ['Productos bebé cuerpo',     ['bebé', 'bebe', 'baby', 'infantil', 'nenuco', 'johnsons']],
      ['Loción con urea',           ['urea']],
      ['Aceite corporal',           ['aceite']],
      ['Crema nutritiva corporal',  ['nutritiv', 'mantequilla', 'karité', 'karite']],
      ['Leche corporal hidratante', []],
    ],
    'COLONIAS MUJER': [
      ['Eau de parfum mujer',       ['edp', 'eau de parfum', 'eau parfum']],
      ['Set / Pack mujer',          ['set', 'pack', 'estuche', 'lote']],
      ['Eau de toilette mujer',     []],
    ],
    'COLONIAS HOMBRE': [
      ['Eau de parfum hombre',      ['edp', 'eau de parfum']],
      ['After shave',               ['after', 'afeitado']],
      ['Set / Pack hombre',         ['set', 'pack', 'estuche']],
      ['Eau de toilette hombre',    []],
    ],
    'PASTA DE DIENTES Y ELIXIR': [
      ['Enjuague bucal / Elixir',   ['enjuague', 'elixir', 'colutorio', 'listerine']],
      ['Pasta blanqueadora',        ['blanquead', 'white']],
      ['Pasta infantil',            ['infantil', 'bebé', 'bebe', 'niño', 'kids']],
      ['Pasta sensible',            ['sensib']],
      ['Pasta dental',              []],
    ],
    'TINTES PELO': [
      ['Decoloración',              ['decolor']],
      ['Matizador',                 ['matiz', 'tonaliz']],
      ['Tinte semipermanente',      ['semi', 'temporal']],
      ['Tinte permanente',          []],
    ],
    'CREMAS Y MASCARILLAS PELO': [
      ['Mascarilla capilar',        ['mascarilla']],
      ['Sin aclarado / Leave-in',   ['sin aclarado', 'leave-in']],
      ['Acondicionador',            ['acondicionador']],
      ['Tratamiento reparador',     ['tratami', 'repar', 'reconstruc']],
      ['Otros cuidado capilar',     []],
    ],
    'LACAS, ESPUMAS Y GOMINAS': [
      ['Laca para el pelo',         ['laca']],
      ['Cera y pomada',             ['cera', 'pomada', 'wax']],
      ['Espuma / Mousse',           ['espuma', 'mousse']],
      ['Gomina y gel',              []],
    ],
    'MAQUILLAJES': [
      ['Ojos',                      ['ojos', 'máscara', 'mascara', 'sombra', 'delineador']],
      ['Labios',                    ['labios', 'barra labios', 'pintalabios', 'gloss']],
      ['Base y corrector',          ['base', 'corrector', 'bb cream']],
      ['Maquillaje otros',          []],
    ],
    'CREMAS DE MANOS': [
      ['Crema manos urea',          ['urea']],
      ['Crema manos reparadora',    ['reparad', 'intens', 'barrier']],
      ['Crema manos hidratante',    []],
    ],
    'ANEXOS Y VARIOS DE PERFUMERIA': [
      ['Mascarillas protección FFP',['ffp', 'mascarilla ffp']],
      ['Botiquines y primeros auxilios', ['botiquín', 'botiquin', 'maletin']],
      ['Accesorios manicura/pedicura', ['cortauñas', 'lima', 'cortapieles', 'alicate', 'cortacallos']],
      ['Espejos',                   ['espejo']],
      ['Algodones y desmaquillantes',['algodón', 'algodon', 'disco', 'desmaquill']],
      ['Material desechable higiene',['desechable', 'bata', 'calzas', 'gorros']],
      ['Estuches y sets manicura',  ['estuche', 'manicura']],
      ['Otros accesorios',          []],
    ],
  };
}

// ── Generar/actualizar hoja SubfamiliaProductos ───────────────────────────
function generarHojaSubfamilias_() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetProd = ss.getSheetByName('Productos');
  if (!sheetProd) return;

  const headers = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase().replace(/ /g,'_'));
  const PROD = {};
  headers.forEach((h, i) => { PROD[h] = i; });
  if (PROD['tipologia'] === undefined || PROD['subfamilia'] === undefined) return;

  const data = sheetProd.getRange(2, 1, Math.max(sheetProd.getLastRow()-1,1), sheetProd.getLastColumn()).getValues();

  const mapa = {};
  data.forEach(row => {
    const familia = row[PROD['tipologia']] ? row[PROD['tipologia']].toString().trim().toUpperCase() : '';
    const subfam  = row[PROD['subfamilia']] ? row[PROD['subfamilia']].toString().trim() : '';
    if (!familia || !subfam) return;
    if (!mapa[familia]) mapa[familia] = {};
    mapa[familia][subfam] = (mapa[familia][subfam] || 0) + 1;
  });

  const filas = [['Familia', 'Subfamilia', 'Orden', 'NumProductos']];
  Object.keys(mapa).sort().forEach(familia => {
    Object.entries(mapa[familia]).sort((a,b) => b[1]-a[1]).forEach(([subfam, count], idx) => {
      filas.push([familia, subfam, idx + 1, count]);
    });
  });

  let sheetSub = ss.getSheetByName('SubfamiliaProductos');
  if (sheetSub) { sheetSub.clearContents(); } else { sheetSub = ss.insertSheet('SubfamiliaProductos'); }
  sheetSub.getRange(1, 1, filas.length, 4).setValues(filas);
  sheetSub.getRange(1, 1, 1, 4).setBackground('#1a1a1a').setFontColor('white').setFontWeight('bold');
  sheetSub.setColumnWidth(1, 300);
  sheetSub.setColumnWidth(2, 280);
  sheetSub.setColumnWidth(3, 70);
  sheetSub.setColumnWidth(4, 120);
  ss.setActiveSheet(sheetSub);
}


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
}

// ── Web App: Manejar peticiones POST (actualizar imagen) ───────────────────
function doPost(e) {
  try {
    console.log('doPost ejecutado');
    console.log('e.postData:', e.postData);

    if (!e || !e.postData) {
      throw new Error('No se recibieron datos en la petición');
    }

    const data = JSON.parse(e.postData.contents);
    console.log('Datos recibidos:', data);
    const accion = data.accion;

    if (accion === 'actualizar_imagen') {
      console.log('Acción: actualizar_imagen');
      return procesarActualizarImagen(data);
    }

    if (accion === 'validar_imagen') {
      console.log('Acción: validar_imagen');
      return procesarValidarImagen(data);
    }

    console.log('Acción no reconocida:', accion);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Acción no reconocida: ' + accion }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error('Error en doPost:', err);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Procesar actualización de imagen ───────────────────────────────────────
function procesarActualizarImagen(data) {
  try {
    console.log('procesarActualizarImagen iniciado');
    console.log('data:', data);

    const referencia = data.referencia;
    const archivo = data.archivo;

    if (!referencia || !archivo) {
      throw new Error('Faltan datos requeridos: referencia o archivo');
    }

    console.log('Referencia:', referencia);
    console.log('Archivo:', archivo.nombre, 'Tipo:', archivo.tipo, 'Tamaño datos:', archivo.datos.length);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetProd = ss.getSheetByName('Productos');

    if (!sheetProd) {
      throw new Error('No existe la hoja Productos');
    }

    console.log('Hoja Productos encontrada');

    // Verificar si existe la columna fecha_actualizacion_imagen
    const headerRow = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
      .map(h => h.toString().trim());

    console.log('Cabeceras:', headerRow);

    if (!headerRow.includes('fecha_actualizacion_imagen')) {
      console.log('Añadiendo columna fecha_actualizacion_imagen');
      sheetProd.getRange(1, headerRow.length + 1).setValue('fecha_actualizacion_imagen');
      headerRow.push('fecha_actualizacion_imagen');
    }

    const PROD = {};
    headerRow.forEach((h, i) => { PROD[h] = i; });
    console.log('Índices de columnas:', PROD);

    // Buscar el producto por referencia
    const prodData = sheetProd.getRange(2, 1, Math.max(sheetProd.getLastRow() - 1, 1), sheetProd.getLastColumn()).getValues();
    let prodRowIdx = -1;

    console.log('Buscando producto con referencia:', referencia);
    for (let i = 0; i < prodData.length; i++) {
      const ref = prodData[i][PROD['referencia']] ? prodData[i][PROD['referencia']].toString().trim() : '';
      if (ref === referencia.toString().trim()) {
        prodRowIdx = i;
        console.log('Producto encontrado en fila:', i + 2);
        break;
      }
    }

    if (prodRowIdx === -1) {
      throw new Error('Producto no encontrado con referencia: ' + referencia);
    }

    // Obtener extensión del archivo original
    const extension = archivo.nombre.split('.').pop().toLowerCase();
    const nuevoNombre = referencia + '.' + extension;

    console.log('Nuevo nombre del archivo:', nuevoNombre);

    // Decodificar base64 y crear blob
    const decoded = Utilities.base64Decode(archivo.datos);
    const blob = Utilities.newBlob(decoded, archivo.tipo, nuevoNombre);

    console.log('Blob creado, tamaño:', blob.getBytes().length);

    // Guardar en Drive en la carpeta de imágenes
    const driveFolder = DriveApp.getFolderById(DRIVE_IMAGENES_ID);
    console.log('Carpeta Drive obtenida');

    const driveFile = driveFolder.createFile(blob);
    console.log('Archivo creado en Drive, ID:', driveFile.getId());

    // Intentar compartir el archivo públicamente (puede fallar por permisos)
    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      console.log('Archivo compartido públicamente');
    } catch (sharingError) {
      console.log('No se pudo compartir el archivo públicamente:', sharingError.message);
    }

    // Actualizar la hoja Productos
    const prodRowNum = prodRowIdx + 2;
    console.log('Actualizando fila', prodRowNum);

    sheetProd.getRange(prodRowNum, PROD['imagen_drive_id'] + 1).setValue(driveFile.getId());
    console.log('imagen_drive_id actualizado:', driveFile.getId());

    const ahora = new Date();
    sheetProd.getRange(prodRowNum, PROD['fecha_actualizacion_imagen'] + 1).setValue(Utilities.formatDate(ahora, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss'));
    console.log('fecha_actualizacion_imagen actualizada:', Utilities.formatDate(ahora, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss'));

    sheetProd.getRange(prodRowNum, PROD['imagen_validada'] + 1).setValue(Utilities.formatDate(ahora, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss'));
    console.log('imagen_validada actualizada:', Utilities.formatDate(ahora, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss'));

    // Disparar workflow de generar productos.json
    console.log('Disparando workflow generar_productos_json');
    dispararWorkflowProductosJson();

    console.log('procesarActualizarImagen completado exitosamente');
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Imagen actualizada correctamente' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('Error al procesar actualización de imagen:', err);
    console.error('Stack trace:', err.stack);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Test de actualización de imagen (ejecutar desde editor) ───────────────
function testActualizarImagen() {
  // Buscar un producto real existente
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetProd = ss.getSheetByName('Productos');
  const headerRow = sheetProd.getRange(1, 1, 1, sheetProd.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim());

  const PROD = {};
  headerRow.forEach((h, i) => { PROD[h] = i; });

  const prodData = sheetProd.getRange(2, 1, Math.max(sheetProd.getLastRow() - 1, 1), sheetProd.getLastColumn()).getValues();

  // Buscar el primer producto con imagen_drive_id
  let referenciaTest = null;
  let nombreTest = null;
  let areaTest = null;
  let familiaTest = null;

  for (let i = 0; i < prodData.length; i++) {
    const ref = prodData[i][PROD['referencia']] ? prodData[i][PROD['referencia']].toString().trim() : '';
    if (ref && prodData[i][PROD['imagen_drive_id']]) {
      referenciaTest = ref;
      nombreTest = prodData[i][PROD['nombre']];
      areaTest = prodData[i][PROD['area']];
      familiaTest = prodData[i][PROD['familia']];
      break;
    }
  }

  if (!referenciaTest) {
    console.log('No se encontró ningún producto con imagen para hacer el test');
    return;
  }

  console.log('Usando producto de prueba:', referenciaTest, nombreTest);

  const testData = {
    accion: 'actualizar_imagen',
    referencia: referenciaTest,
    nombre: nombreTest,
    area: areaTest,
    familia: familiaTest,
    archivo: {
      nombre: 'test.jpg',
      tipo: 'image/jpeg',
      datos: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////wAALCAACAgBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AT//Z' // Base64 de una imagen 1x1 roja
    }
  };

  const result = procesarActualizarImagen(testData);
  console.log('Resultado del test:', result);
}

// ── Procesar validación de imagen ─────────────────────────────────────────────
function procesarValidarImagen(data) {
  try {
    console.log('procesarValidarImagen iniciado');
    console.log('data:', data);

    const referencia = data.referencia;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetProd = ss.getSheetByName('Productos');
    const prodData = sheetProd.getDataRange().getValues();
    const prodHeaders = prodData[0];

    const PROD = {};
    prodHeaders.forEach((h, i) => {
      PROD[h.toString().toLowerCase().replace(/\s+/g, '_')] = i;
    });

    console.log('Cabeceras de Productos:', PROD);

    let prodRowIdx = -1;
    for (let i = 1; i < prodData.length; i++) {
      const ref = prodData[i][PROD['referencia']] ? prodData[i][PROD['referencia']].toString().trim() : '';
      if (ref === referencia) {
        prodRowIdx = i;
        break;
      }
    }

    if (prodRowIdx === -1) {
      console.log('Producto no encontrado:', referencia);
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Producto no encontrado' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    console.log('Producto encontrado en fila', prodRowIdx + 2);

    const prodRowNum = prodRowIdx + 2;

    const ahora = new Date();
    sheetProd.getRange(prodRowNum, PROD['imagen_validada'] + 1).setValue(Utilities.formatDate(ahora, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss'));
    console.log('imagen_validada actualizada:', Utilities.formatDate(ahora, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss'));

    console.log('procesarValidarImagen completado exitosamente');
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Imagen validada correctamente' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('Error al procesar validación de imagen:', err);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Validar imagen manualmente desde menú ────────────────────────────────────
function validarImagenManual() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Validar imagen de producto',
    'Introduce la referencia del producto:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const referencia = response.getResponseText().trim();
  if (!referencia) {
    ui.alert('La referencia no puede estar vacía.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetProd = ss.getSheetByName('Productos');

  if (!sheetProd) {
    ui.alert('No existe la hoja "Productos".');
    return;
  }

  const prodData = sheetProd.getDataRange().getValues();
  const prodHeaders = prodData[0];

  const PROD = {};
  prodHeaders.forEach((h, i) => {
    PROD[h.toString().toLowerCase().replace(/\s+/g, '_')] = i;
  });

  let prodRowIdx = -1;
  console.log('Buscando referencia:', referencia);
  console.log('Total de productos:', prodData.length);
  
  for (let i = 0; i < prodData.length; i++) {
    const ref = prodData[i][PROD['referencia']] ? prodData[i][PROD['referencia']].toString().trim() : '';
    if (ref === referencia.toString().trim()) {
      prodRowIdx = i;
      console.log('Producto encontrado en índice de datos:', i, 'con referencia:', ref);
      break;
    }
  }

  if (prodRowIdx === -1) {
    console.error('Producto no encontrado. Referencias encontradas en primeras 5 filas:');
    for (let i = 0; i < Math.min(5, prodData.length); i++) {
      const ref = prodData[i][PROD['referencia']] ? prodData[i][PROD['referencia']].toString().trim() : '';
      console.log(`Índice ${i}: ${ref}`);
    }
    ui.alert(`Producto no encontrado con referencia: ${referencia}`);
    return;
  }

  const prodRowNum = prodRowIdx + 2;

  // Verificar si existe la columna imagen_validada
  if (PROD['imagen_validada'] === undefined) {
    console.error('Columnas disponibles:', Object.keys(PROD));
    ui.alert('La hoja "Productos" no tiene la columna "imagen_validada". Añádela primero.\n\nColumnas disponibles: ' + Object.keys(prodHeaders).join(', '));
    return;
  }

  console.log('Columna imagen_validada encontrada en índice:', PROD['imagen_validada']);
  console.log('Fila a actualizar:', prodRowNum);

  // Actualizar imagen_validada
  const ahora = new Date();
  const fechaFormateada = Utilities.formatDate(ahora, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  console.log('Fecha formateada:', fechaFormateada);

  sheetProd.getRange(prodRowNum, PROD['imagen_validada'] + 1).setValue(fechaFormateada);
  console.log('Valor establecido en celda:', sheetProd.getRange(prodRowNum, PROD['imagen_validada'] + 1).getValue());

  // Actualizar fecha_actualizacion_imagen si existe
  if (PROD['fecha_actualizacion_imagen'] !== undefined) {
    sheetProd.getRange(prodRowNum, PROD['fecha_actualizacion_imagen'] + 1).setValue(
      Utilities.formatDate(ahora, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm:ss')
    );
  }

  SpreadsheetApp.flush();
  ui.alert(`✓ Imagen del producto ${referencia} validada correctamente.\n\nLa web se actualizará automáticamente en los próximos 10 minutos.`);
}

// ── Disparar workflow de generar productos.json ───────────────────────────
function dispararWorkflowProductosJson() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;
  const payload = JSON.stringify({
    event_type: 'generar_productos_json',
    client_payload: { triggered_by: 'actualizar_imagen', timestamp: new Date().toISOString() }
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
  const resp = UrlFetchApp.fetch(url, options);
  if (resp.getResponseCode() === 204) {
    console.log('Workflow generar_productos_json disparado correctamente');
  } else {
    console.error('Error al disparar workflow generar_productos_json:', resp.getContentText());
  }
}
