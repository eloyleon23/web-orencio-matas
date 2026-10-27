// ══════════════════════════════════════════════════════════════════════
// ANUNCIOS Y RECURSOS — página pública + gestor (PIN)
// ══════════════════════════════════════════════════════════════════════
// Mismo patrón arquitectónico que "Gestionar destacados" en buscador.html
// (ver ese archivo para el precedente completo): PIN compartido
// (panel_validar_pin / PANEL_PIN), caché de Drive servida por
// obtener_anuncios, reintento automático si Apps Script redirige un POST
// a doGet (ver anunciosFetchPost_).
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  function escapeHtml(s) {
    return (s || '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Mismas 4 áreas reales del catálogo (ver AREAS_NOMBRE en buscador.html)
  // — nunca inventadas, duplicadas aquí porque este proyecto no comparte
  // constantes entre páginas.
  // "general" es un área especial (no viene del catálogo): recursos que
  // no encajan en ninguna área real — a petición de Eloy, para no
  // obligar a elegir una que no le corresponde.
  const AREA_NOMBRES_ = { drogueria: 'Droguería', perfumeria: 'Perfumería', pinturas: 'Pinturas', talleres: 'Talleres', general: 'General' };
  const AREA_ICONOS_ = { drogueria: 'fa-pump-soap', perfumeria: 'fa-spray-can-sparkles', pinturas: 'fa-paint-roller', talleres: 'fa-car-side', general: 'fa-layer-group' };
  const AREA_COLORES_ = { drogueria: 'azul', perfumeria: 'amarillo', pinturas: 'rojo', talleres: 'verde', general: 'negro' };
  function nombreArea_(area) { return AREA_NOMBRES_[area] || area || 'Otros'; }
  function iconoArea_(area) { return AREA_ICONOS_[area] || 'fa-folder'; }
  function colorArea_(area) { return AREA_COLORES_[area] || 'negro'; }

  const TIPOLOGIA_ETIQUETAS_ = { manual: 'Manual', catalogo: 'Catálogo', folleto: 'Folleto', anuncio: 'Anuncio' };
  const TIPOLOGIA_ICONOS_ = { manual: 'fa-book', catalogo: 'fa-book-open', folleto: 'fa-file-lines', anuncio: 'fa-bullhorn', personalizado: 'fa-tag' };
  function etiquetaTipologia_(a) {
    if (a.tipologia === 'personalizado') return a.tipologiaPersonalizada || 'Personalizado';
    return TIPOLOGIA_ETIQUETAS_[a.tipologia] || a.tipologia;
  }
  function iconoTipologia_(a) { return TIPOLOGIA_ICONOS_[a.tipologia] || 'fa-file'; }

  function urlVerDrive_(id) { return `https://drive.google.com/file/d/${id}/view`; }
  // Mismo patrón ya usado en catalogo_drogueria.html para descargar PDFs
  // de Drive — no se inventa nada nuevo.
  function urlDescargarDrive_(id) { return `https://drive.google.com/uc?export=download&id=${id}`; }
  // Mismo patrón ya usado en buscador.html para miniaturas de producto.
  function urlMiniaturaDrive_(id, ancho) { return `https://drive.google.com/thumbnail?id=${id}&sz=w${ancho || 400}`; }
  // Vista previa embebible de Drive — a diferencia de /view (pensada para
  // abrirse como página propia), /preview es la URL que Google documenta
  // para incrustar en un <iframe> de un sitio de terceros, y funciona
  // para PDF, imágenes, Office (Docs/Sheets/Slides) y la mayoría de tipos
  // que Drive ya sabe previsualizar.
  function urlPreviewDrive_(id) { return `https://drive.google.com/file/d/${id}/preview`; }

  // ── Vídeo externo (YouTube/TikTok/Instagram) ─────────────────────────
  // "mimeType" de un recurso de vídeo no es un MIME real — el backend
  // reutiliza ese mismo campo como etiqueta de plataforma ("video/youtube"
  // | "video/tiktok" | "video/instagram" | "video/otro", ver
  // detectarPlataformaVideo_ en apps_script_trigger.js), para no añadir
  // una columna nueva a la hoja solo para esto.
  function plataformaVideo_(a) { return (a.mimeType || '').replace('video/', ''); }
  const VIDEO_ICONOS_ = { youtube: { clase: 'fa-brands', icono: 'fa-youtube' }, tiktok: { clase: 'fa-brands', icono: 'fa-tiktok' }, instagram: { clase: 'fa-brands', icono: 'fa-instagram' } };
  function iconoVideo_(a) { return VIDEO_ICONOS_[plataformaVideo_(a)] || { clase: 'fa-solid', icono: 'fa-video' }; }
  // Mismo regex que extraerIdYoutube_ en el backend — se necesita también
  // aquí para poder embeber el reproductor en la vista previa sin tener
  // que ir y volver al servidor solo para sacar el ID.
  function extraerIdYoutubeCliente_(url) {
    const m = (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{6,15})/);
    return m ? m[1] : '';
  }

  // ── Toast simple (independiente del de buscador.html, que no se carga aquí) ──
  function toast(msg, esError) {
    const cont = $('toast-container-anuncios');
    if (!cont) { console.log(msg); return; }
    const el = document.createElement('div');
    el.style.cssText = `background:${esError ? '#b91c1c' : '#1a1a1a'};color:#fff;padding:10px 16px;border-radius:8px;font-size:.85rem;box-shadow:0 6px 18px rgba(0,0,0,.25);max-width:320px;`;
    el.textContent = msg;
    cont.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  let ANUNCIOS_ = [];
  let TODOS_PRODUCTOS_ = []; // catálogo completo, cargado perezosamente solo para el gestor (áreas/familias reales)
  let anunciosPin_ = '';
  let anuncioEnEdicion_ = null; // id del anuncio que se está editando, o null = nuevo
  let archivoSeleccionado_ = null; // { nombre, tipo, datos(base64) } pendiente de subir
  let miniaturaGenerada_ = null;   // idem, para la miniatura (PDF renderizado o portada de imagen/URL)

  // ── Carga de datos públicos ──────────────────────────────────────────
  function anunciosVigentesYVisibles_() {
    return ANUNCIOS_.filter(a => a.visible && a.vigente);
  }

  async function cargarAnuncios_() {
    try {
      const resp = await fetch(window.GOOGLE_APPS_SCRIPT_URL + '?accion=obtener_anuncios&_ts=' + Date.now(), { cache: 'no-store' });
      const datos = await resp.json();
      ANUNCIOS_ = Array.isArray(datos.anuncios) ? datos.anuncios : [];
    } catch (e) {
      console.error('cargarAnuncios_: error cargando los anuncios', e);
      ANUNCIOS_ = [];
    }
    poblarFiltroTipologiaPublico_();
    renderPublico_();
    if ($('an-vista-principal') && $('an-vista-principal').style.display !== 'none') {
      renderGestionListado_();
    }
  }

  function poblarFiltroTipologiaPublico_() {
    const sel = $('an-filtro-tipologia');
    if (!sel) return;
    const usadas = new Set();
    ANUNCIOS_.forEach(a => usadas.add(etiquetaTipologia_(a)));
    const actual = sel.value;
    sel.innerHTML = '<option value="">Todas las tipologías</option>' +
      Array.from(usadas).sort((a, b) => a.localeCompare(b, 'es')).map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
    sel.value = actual;
  }

  // ── Tarjeta de recurso ───────────────────────────────────────────────
  function miniaturaHtml_(a) {
    let src = '';
    if (a.driveThumbnailId) src = urlMiniaturaDrive_(a.driveThumbnailId, 400);
    else if (a.tipoRecurso === 'archivo' && a.mimeType && a.mimeType.indexOf('image/') === 0 && a.driveFileId) src = urlMiniaturaDrive_(a.driveFileId, 400);
    const esVideo = a.tipoRecurso === 'video';
    if (src) return `<img src="${src}" alt="" loading="lazy">${esVideo ? '<span class="an-card__video-play"><i class="fa-solid fa-play"></i></span>' : ''}`;
    if (esVideo) { const ic = iconoVideo_(a); return `<span class="an-card__miniatura-generica"><i class="${ic.clase} ${ic.icono}"></i></span>`; }
    return `<span class="an-card__miniatura-generica"><i class="fa-solid ${iconoTipologia_(a)}"></i></span>`;
  }

  function construirTarjeta_(a) {
    const fecha = a.fechaCreacion ? new Date(a.fechaCreacion) : null;
    const fechaTexto = fecha && !isNaN(fecha.getTime()) ? fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const metaPartes = [nombreArea_(a.area)];
    if (a.familia) metaPartes.push(a.familia);
    if (fechaTexto) metaPartes.push(fechaTexto);

    let acciones = '';
    if (a.tipoRecurso === 'archivo' && a.driveFileId) {
      acciones = `
        <button type="button" data-accion="ver" data-id="${escapeHtml(a.id)}"><i class="fa-solid fa-eye"></i> Ver</button>
        <button type="button" data-accion="descargar" data-id="${escapeHtml(a.id)}"><i class="fa-solid fa-download"></i> Descargar</button>
        <button type="button" data-accion="compartir" data-id="${escapeHtml(a.id)}"><i class="fa-solid fa-share-nodes"></i></button>
      `;
    } else if (a.tipoRecurso === 'url' && a.urlExterna) {
      acciones = `
        <a href="${escapeHtml(a.urlExterna)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-up-right-from-square"></i> Abrir</a>
        <button type="button" data-accion="compartir" data-id="${escapeHtml(a.id)}"><i class="fa-solid fa-share-nodes"></i></button>
      `;
    } else if (a.tipoRecurso === 'video' && a.urlExterna) {
      acciones = `
        <button type="button" data-accion="ver-video" data-id="${escapeHtml(a.id)}"><i class="fa-solid fa-play"></i> Ver</button>
        <button type="button" data-accion="compartir" data-id="${escapeHtml(a.id)}"><i class="fa-solid fa-share-nodes"></i></button>
      `;
    }

    return `
      <article class="an-card" data-id="${escapeHtml(a.id)}">
        <div class="an-card__miniatura">
          <span class="an-card__tipo-chip"><i class="fa-solid ${iconoTipologia_(a)}"></i> ${escapeHtml(etiquetaTipologia_(a))}</span>
          ${miniaturaHtml_(a)}
        </div>
        <div class="an-card__cuerpo">
          <div class="an-card__titulo">${escapeHtml(a.titulo)}</div>
          ${a.descripcion ? `<div class="an-card__descripcion">${escapeHtml(a.descripcion)}</div>` : ''}
          <div class="an-card__meta">${metaPartes.map(escapeHtml).join(' · ')}</div>
        </div>
        <div class="an-card__acciones">${acciones}</div>
      </article>
    `;
  }

  function renderPublico_() {
    const cont = $('an-secciones');
    const sinResultados = $('an-sin-resultados');
    if (!cont) return;
    const texto = ($('an-buscar') ? $('an-buscar').value : '').trim().toLowerCase();
    const tipologiaFiltro = $('an-filtro-tipologia') ? $('an-filtro-tipologia').value : '';

    let visibles = anunciosVigentesYVisibles_();
    if (texto) visibles = visibles.filter(a => (a.titulo || '').toLowerCase().includes(texto) || (a.descripcion || '').toLowerCase().includes(texto));
    if (tipologiaFiltro) visibles = visibles.filter(a => etiquetaTipologia_(a) === tipologiaFiltro);

    if (!visibles.length) {
      cont.innerHTML = '';
      sinResultados.style.display = '';
      return;
    }
    sinResultados.style.display = 'none';

    // Agrupa por área — solo se generan secciones con contenido real
    // (nunca una sección vacía).
    const porArea = new Map();
    visibles.forEach(a => {
      const clave = a.area || 'otros';
      if (!porArea.has(clave)) porArea.set(clave, []);
      porArea.get(clave).push(a);
    });

    // Dentro de cada área: más recientes primero (fecha de creación);
    // criterio secundario estable (id) si coincide la fecha.
    porArea.forEach(lista => {
      lista.sort((a, b) => {
        const fa = new Date(a.fechaCreacion).getTime() || 0;
        const fb = new Date(b.fechaCreacion).getTime() || 0;
        if (fb !== fa) return fb - fa;
        return (a.id || '').localeCompare(b.id || '');
      });
    });

    // Orden de áreas estable: las 4 reales conocidas primero (en el
    // orden habitual del resto del sitio), cualquier otra al final.
    const ordenConocido = ['drogueria', 'perfumeria', 'pinturas', 'talleres', 'general'];
    const claves = Array.from(porArea.keys()).sort((a, b) => {
      const ia = ordenConocido.indexOf(a), ib = ordenConocido.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b, 'es');
    });

    cont.innerHTML = claves.map(clave => {
      const lista = porArea.get(clave);
      return `
        <div class="an-area-seccion an-area-seccion--${colorArea_(clave)}">
          <div class="an-area-seccion__cabecera">
            <span class="an-area-seccion__icono"><i class="fa-solid ${iconoArea_(clave)}"></i></span>
            <h2 class="an-area-seccion__titulo">${escapeHtml(nombreArea_(clave))}</h2>
            <span class="an-area-seccion__contador">${lista.length} recurso${lista.length === 1 ? '' : 's'}</span>
          </div>
          <div class="an-grid">${lista.map(construirTarjeta_).join('')}</div>
        </div>
      `;
    }).join('');

    cont.querySelectorAll('[data-accion="ver"]').forEach(btn => btn.addEventListener('click', () => accionVer_(btn.dataset.id)));
    cont.querySelectorAll('[data-accion="descargar"]').forEach(btn => btn.addEventListener('click', () => accionDescargar_(btn.dataset.id)));
    cont.querySelectorAll('[data-accion="ver-video"]').forEach(btn => btn.addEventListener('click', () => accionVerVideo_(btn.dataset.id)));
    cont.querySelectorAll('[data-accion="compartir"]').forEach(btn => btn.addEventListener('click', () => accionCompartir_(btn.dataset.id)));

    // Tarjeta clicable entera, a petición de Eloy: el usuario no tiene que
    // acertar en el botón "Ver"/"Abrir" para consultar el recurso — toda
    // la tarjeta funciona igual, SIEMPRE que el clic no caiga dentro de
    // .an-card__acciones (ahí cada botón/enlace mantiene su propio
    // comportamiento de siempre, incluido "Ver" abriendo en pestaña
    // nueva, sin que el clic de la tarjeta lo dispare una segunda vez).
    cont.querySelectorAll('.an-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.an-card__acciones')) return;
        abrirRecursoTarjeta_(card.dataset.id);
      });
    });
  }

  // Abre el recurso tal y como ya lo hace su acción principal (nunca una
  // acción nueva): "Ver" para un archivo de Drive (vista previa en la
  // ventana modal del propio sitio, ver accionVer_/abrirVisorRecurso_) o
  // el mismo enlace externo que el botón "Abrir" para un recurso de tipo
  // URL. A petición de Eloy ("que se abra todo lo que se pueda en la
  // ventana modal para que el usuario no tenga que salir de la web"), un
  // recurso de tipo URL sigue abriendo en pestaña nueva porque un sitio
  // de terceros no se puede embeber de forma fiable (X-Frame-Options,
  // CORS...) — ahí sí que no hay más remedio que salir de la web.
  function abrirRecursoTarjeta_(id) {
    const a = encontrarAnuncio_(id);
    if (!a) return;
    if (a.tipoRecurso === 'archivo' && a.driveFileId) {
      accionVer_(id);
    } else if (a.tipoRecurso === 'video' && a.urlExterna) {
      accionVerVideo_(id);
    } else if (a.tipoRecurso === 'url' && a.urlExterna) {
      window.open(a.urlExterna, '_blank', 'noopener');
    }
  }

  function encontrarAnuncio_(id) { return ANUNCIOS_.find(a => a.id === id); }

  // "Ver" — a petición de Eloy, ya no abre pestaña nueva: se previsualiza
  // en una ventana modal del propio sitio. Imagen (mimeType image/...) se
  // muestra directamente a tamaño grande; cualquier otro tipo de archivo
  // (PDF, Office...) usa la vista previa embebida de Drive, que cubre la
  // inmensa mayoría de lo que se sube aquí. El pie de la modal deja
  // siempre "Descargar" y "Abrir en pestaña nueva" por si la previsualización
  // no carga bien para un archivo concreto.
  function accionVer_(id) {
    const a = encontrarAnuncio_(id);
    if (!a || !a.driveFileId) return;
    abrirVisorRecurso_(a);
  }

  function abrirVisorRecurso_(a) {
    const esImagen = a.mimeType && a.mimeType.indexOf('image/') === 0;
    const contenido = $('an-visor-contenido');
    $('an-visor-titulo').textContent = a.titulo;
    $('an-visor-descargar').style.display = ''; // por si el visor anterior era un vídeo (ver abrirVisorVideo_, que lo oculta)
    $('an-visor-descargar').href = urlDescargarDrive_(a.driveFileId);
    $('an-visor-abrir-fuera').href = urlVerDrive_(a.driveFileId);
    contenido.innerHTML = esImagen
      ? `<img src="${urlMiniaturaDrive_(a.driveFileId, 1600)}" alt="${escapeHtml(a.titulo)}">`
      : `<iframe src="${urlPreviewDrive_(a.driveFileId)}" title="${escapeHtml(a.titulo)}" allow="autoplay"></iframe>`;
    $('an-visor-overlay').classList.add('activo');
  }

  // "Ver" de un recurso de vídeo: YouTube se embebe en la misma ventana
  // modal del sitio (igual que el resto de recursos, nunca sale de la
  // web) — TikTok e Instagram no ofrecen una URL de embebido fiable sin
  // su propio script externo, así que para esas dos plataformas se abre
  // el enlace tal cual, en pestaña nueva (mismo criterio ya aplicado a
  // un recurso de tipo "URL externa": un sitio de terceros no se puede
  // embeber de forma fiable).
  function accionVerVideo_(id) {
    const a = encontrarAnuncio_(id);
    if (!a || !a.urlExterna) return;
    if (plataformaVideo_(a) === 'youtube') {
      const ytId = extraerIdYoutubeCliente_(a.urlExterna);
      if (ytId) { abrirVisorVideo_(a, ytId); return; }
    }
    window.open(a.urlExterna, '_blank', 'noopener');
  }

  function abrirVisorVideo_(a, ytId) {
    $('an-visor-titulo').textContent = a.titulo;
    $('an-visor-descargar').style.display = 'none'; // no hay nada que descargar: es un enlace, no un archivo propio
    $('an-visor-abrir-fuera').href = a.urlExterna;
    $('an-visor-contenido').innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(ytId)}" title="${escapeHtml(a.titulo)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    $('an-visor-overlay').classList.add('activo');
  }

  function cerrarVisorRecurso_() {
    $('an-visor-overlay').classList.remove('activo');
    // Vacía el contenido al cerrar — para un iframe, esto detiene de
    // verdad cualquier carga/reproducción en curso (quitar solo la clase
    // "activo" la dejaría viva, aunque invisible, de fondo).
    $('an-visor-contenido').innerHTML = '';
  }
  function accionDescargar_(id) {
    const a = encontrarAnuncio_(id);
    if (!a || !a.driveFileId) return;
    window.open(urlDescargarDrive_(a.driveFileId), '_blank', 'noopener');
  }
  async function accionCompartir_(id) {
    const a = encontrarAnuncio_(id);
    if (!a) return;
    // El enlace compartido es siempre estable (esta misma página +
    // ?ref=id), nunca algo que dependa de datos guardados solo en este
    // navegador — si el recurso caduca o se oculta, dejará de aparecer
    // publicado al abrir ese enlace (se filtra igual que el resto).
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('ref', a.id);
    const datosCompartir = { title: a.titulo, text: a.descripcion || a.titulo, url: url.toString() };
    if (navigator.share) {
      try { await navigator.share(datosCompartir); return; } catch (e) { /* cancelado por el usuario, nada que hacer */ return; }
    }
    try {
      await navigator.clipboard.writeText(url.toString());
      toast('Enlace copiado al portapapeles.');
    } catch (e) {
      toast('No se pudo copiar el enlace.', true);
    }
  }

  // ── POST compartido con reintento (mismo motivo que destacadosFetchPost_
  // en buscador.html: un POST que Apps Script redirige puede acabar
  // ejecutando doGet, cuya respuesta no trae "success") ──────────────────
  async function anunciosFetchPost_(payload) {
    for (let intento = 0; intento < 2; intento++) {
      const resp = await fetch(window.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const d = await resp.json();
      if (d.success !== undefined || intento === 1) return d;
      console.warn('anunciosFetchPost_: respuesta sin "success" — reintentando...', d);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // GESTOR (PIN + CRUD) — solo preproducción
  // ══════════════════════════════════════════════════════════════════
  function anunciosGuardarPinLocal_(pin, recordar) {
    if (recordar) { try { localStorage.setItem('omAnunciosPin', pin); } catch (e) {} }
  }

  // Spinner compartido por todos los botones que disparan una petición al
  // backend — mismo patrón ya usado en "Gestionar destacados" de
  // buscador.html: icono animado + disabled mientras está en curso,
  // restaurado al terminar (éxito o error). Devuelve la función de
  // restauración, para poder llamarla también desde fuera de un
  // try/finally cuando el propio botón pueda haber desaparecido del DOM
  // (p. ej. tras recargar el listado).
  function mostrarSpinnerBoton_(btn, textoCargando) {
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = textoCargando
      ? `<i class="fa-solid fa-spinner fa-spin"></i> ${textoCargando}`
      : '<i class="fa-solid fa-spinner fa-spin"></i>';
    return () => { btn.disabled = false; btn.innerHTML = original; };
  }

  async function anunciosValidarPinYArrancar_(pin) {
    const error = $('an-pin-error');
    const btn = $('an-pin-entrar');
    error.textContent = '';
    const restaurarBoton = mostrarSpinnerBoton_(btn, 'Comprobando…');
    try {
      const resp = await fetch(window.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion: 'panel_validar_pin', pin: pin }),
      });
      const d = await resp.json();
      if (d.success) {
        anunciosPin_ = pin;
        $('an-vista-pin').style.display = 'none';
        $('an-vista-principal').style.display = '';
        await cargarCatalogoParaGestor_();
        poblarSelectoresAreaFamilia_();
        renderGestionListado_();
      } else {
        error.textContent = 'PIN incorrecto.';
        try { localStorage.removeItem('omAnunciosPin'); } catch (e) {}
      }
    } catch (e) {
      error.textContent = 'Error de conexión.';
    } finally {
      restaurarBoton();
    }
  }

  async function cargarCatalogoParaGestor_() {
    if (TODOS_PRODUCTOS_.length) return;
    try {
      const resp = await fetch('./data/productos.json', { cache: 'no-store' });
      const datos = await resp.json();
      TODOS_PRODUCTOS_ = Array.isArray(datos.productos) ? datos.productos : (Array.isArray(datos) ? datos : []);
    } catch (e) {
      console.error('No se pudo cargar el catálogo para el gestor de anuncios:', e);
      TODOS_PRODUCTOS_ = [];
    }
  }

  function poblarSelectoresAreaFamilia_() {
    const selArea = $('an-area');
    const areasPresentes = Array.from(new Set(TODOS_PRODUCTOS_.map(p => p.area).filter(Boolean)));
    const areasFinal = areasPresentes.length ? areasPresentes : ['drogueria', 'perfumeria', 'pinturas', 'talleres'];
    // "General" va primero y es el valor por defecto — a petición de
    // Eloy, un recurso no debe verse obligado a encajar en un área real.
    selArea.innerHTML = '<option value="general">General (sin área concreta)</option>' +
      areasFinal.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(nombreArea_(a))}</option>`).join('');
    selArea.addEventListener('change', actualizarSelectorFamilia_);
    actualizarSelectorFamilia_();
  }
  function actualizarSelectorFamilia_() {
    const area = $('an-area').value;
    const selFamilia = $('an-familia');
    if (area === 'general') {
      selFamilia.innerHTML = '<option value="">Sin familia</option>';
      selFamilia.disabled = true;
      return;
    }
    selFamilia.disabled = false;
    const base = area ? TODOS_PRODUCTOS_.filter(p => p.area === area) : TODOS_PRODUCTOS_;
    const familias = Array.from(new Set(base.map(p => p.familia).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
    const actual = selFamilia.value;
    selFamilia.innerHTML = '<option value="">Sin familia</option>' + familias.map(f => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join('');
    if (familias.indexOf(actual) !== -1) selFamilia.value = actual;
  }

  function poblarTipologiasUsadas_() {
    const datalist = $('an-tipologias-usadas');
    const usadas = Array.from(new Set(ANUNCIOS_.filter(a => a.tipologia === 'personalizado' && a.tipologiaPersonalizada).map(a => a.tipologiaPersonalizada)));
    datalist.innerHTML = usadas.map(t => `<option value="${escapeHtml(t)}">`).join('');
  }

  function renderGestionListado_() {
    const cont = $('an-listado');
    if (!cont) return;
    const texto = ($('an-gestion-buscar').value || '').trim().toLowerCase();
    const area = $('an-gestion-filtro-area').value;
    const tipologia = $('an-gestion-filtro-tipologia').value;
    const visibilidad = $('an-gestion-filtro-visibilidad').value;
    const vigencia = $('an-gestion-filtro-vigencia').value;

    let lista = ANUNCIOS_.slice().sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    if (texto) lista = lista.filter(a => (a.titulo || '').toLowerCase().includes(texto));
    if (area) lista = lista.filter(a => a.area === area);
    if (tipologia) lista = lista.filter(a => a.tipologia === tipologia);
    if (visibilidad === 'visible') lista = lista.filter(a => a.visible);
    if (visibilidad === 'oculto') lista = lista.filter(a => !a.visible);
    if (vigencia === 'vigente') lista = lista.filter(a => a.vigente);
    if (vigencia === 'caducado') lista = lista.filter(a => !a.vigente);

    // Filtro de área del listado de gestión (distinto del select de
    // "crear/editar"), poblado con las áreas realmente usadas por los
    // anuncios existentes — se rellena aquí porque depende de ANUNCIOS_,
    // no del catálogo.
    const selFiltroArea = $('an-gestion-filtro-area');
    if (selFiltroArea.options.length <= 1) {
      const areas = Array.from(new Set(ANUNCIOS_.map(a => a.area).filter(Boolean)));
      selFiltroArea.innerHTML = '<option value="">Todas las áreas</option>' + areas.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(nombreArea_(a))}</option>`).join('');
    }
    const selFiltroTipologia = $('an-gestion-filtro-tipologia');
    if (selFiltroTipologia.options.length <= 1) {
      const tipologias = Array.from(new Set(ANUNCIOS_.map(a => a.tipologia).filter(Boolean)));
      selFiltroTipologia.innerHTML = '<option value="">Todas las tipologías</option>' + tipologias.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(TIPOLOGIA_ETIQUETAS_[t] || t)}</option>`).join('');
    }

    if (!lista.length) { cont.innerHTML = '<p class="an-hint">Sin resultados.</p>'; return; }

    cont.innerHTML = lista.map(a => {
      const miniUrl = a.driveThumbnailId ? urlMiniaturaDrive_(a.driveThumbnailId, 80) : (a.driveFileId && a.mimeType && a.mimeType.indexOf('image/') === 0 ? urlMiniaturaDrive_(a.driveFileId, 80) : '');
      const detalles = [nombreArea_(a.area), etiquetaTipologia_(a)];
      if (!a.vigente) detalles.push('CADUCADO');
      if (!a.visible) detalles.push('OCULTO');
      return `
        <div class="an-item${!a.visible ? ' an-item--oculto' : ''}${!a.vigente ? ' an-item--caducado' : ''}" data-id="${escapeHtml(a.id)}">
          ${miniUrl ? `<img class="an-item__miniatura" src="${miniUrl}" alt="">` : `<span class="an-item__miniatura" style="display:flex;align-items:center;justify-content:center;"><i class="fa-solid ${iconoTipologia_(a)}"></i></span>`}
          <div class="an-item__info">
            <div class="an-item__titulo">${escapeHtml(a.titulo)}</div>
            <div class="an-item__detalle">${detalles.map(escapeHtml).join(' · ')}</div>
          </div>
          <div class="an-item__acciones">
            <button type="button" title="Editar" data-accion="editar"><i class="fa-solid fa-pen"></i></button>
            <button type="button" title="Eliminar" data-accion="eliminar"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');

    cont.querySelectorAll('[data-accion="editar"]').forEach(btn => btn.addEventListener('click', () => abrirEditor_(btn.closest('.an-item').dataset.id)));
    cont.querySelectorAll('[data-accion="eliminar"]').forEach(btn => btn.addEventListener('click', (e) => eliminarAnuncio_(btn.closest('.an-item').dataset.id, e.currentTarget)));
  }

  function limpiarFormulario_() {
    anuncioEnEdicion_ = null;
    archivoSeleccionado_ = null;
    miniaturaGenerada_ = null;
    $('an-id').value = '';
    $('an-form-titulo-seccion').textContent = 'Nuevo recurso';
    $('an-titulo').value = '';
    $('an-descripcion').value = '';
    $('an-producto-ref').value = '';
    $('an-visible').checked = true;
    $('an-permanente').checked = false;
    $('an-fecha-caducidad').value = '';
    $('an-tipologia').value = 'manual';
    $('an-tipologia-personalizada').value = '';
    $('an-tipologia-personalizada-wrap').style.display = 'none';
    $('an-area').value = 'general';
    actualizarSelectorFamilia_();
    $('an-url-externa').value = '';
    $('an-url-miniatura-input').value = '';
    $('an-video-url').value = '';
    $('an-video-miniatura-input').value = '';
    $('an-dropzone').classList.remove('con-archivo');
    $('an-dropzone').innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Arrastra un archivo aquí, pégalo (Ctrl+V) o haz clic para elegir (PDF, JPG, PNG o WebP — máx. <span id="an-tamano-max-mb">20</span> MB)`;
    $('an-archivo-input').value = '';
    $('an-archivo-estado').textContent = '';
    $('an-miniatura-preview').classList.remove('visible');
    $('an-eliminar').style.display = 'none';
    $('an-form-error').textContent = '';
    $('an-form-ok').textContent = '';
    cambiarTab_('archivo');
    actualizarContadores_();
    actualizarVisibilidadCaducidad_();
  }

  function abrirFormularioNuevo_() {
    limpiarFormulario_();
    $('an-form').classList.add('activo');
    poblarTipologiasUsadas_();
  }

  function abrirEditor_(id) {
    const a = encontrarAnuncio_(id);
    if (!a) return;
    limpiarFormulario_();
    anuncioEnEdicion_ = id;
    $('an-id').value = id;
    $('an-form-titulo-seccion').textContent = 'Editar recurso';
    $('an-titulo').value = a.titulo;
    $('an-descripcion').value = a.descripcion;
    $('an-producto-ref').value = a.productoRef || '';
    $('an-visible').checked = a.visible;
    $('an-permanente').checked = a.permanente;
    if (a.fechaCaducidad) {
      const d = new Date(a.fechaCaducidad);
      if (!isNaN(d.getTime())) $('an-fecha-caducidad').value = d.toISOString().slice(0, 16);
    }
    $('an-tipologia').value = ANUNCIOS_TIPOLOGIAS_SET_.has(a.tipologia) ? a.tipologia : 'personalizado';
    if (a.tipologia === 'personalizado') {
      $('an-tipologia-personalizada').value = a.tipologiaPersonalizada;
      $('an-tipologia-personalizada-wrap').style.display = '';
    }
    $('an-area').value = a.area;
    actualizarSelectorFamilia_();
    $('an-familia').value = a.familia || '';
    cambiarTab_(a.tipoRecurso === 'url' ? 'url' : (a.tipoRecurso === 'video' ? 'video' : 'archivo'));
    if (a.tipoRecurso === 'url') $('an-url-externa').value = a.urlExterna;
    else if (a.tipoRecurso === 'video') $('an-video-url').value = a.urlExterna;
    else if (a.nombreArchivo) {
      $('an-dropzone').classList.add('con-archivo');
      $('an-dropzone').innerHTML = `<i class="fa-solid fa-file-circle-check"></i> Archivo actual: ${escapeHtml(a.nombreArchivo)} — haz clic para sustituirlo`;
    }
    $('an-eliminar').style.display = '';
    $('an-form').classList.add('activo');
    actualizarContadores_();
    actualizarVisibilidadCaducidad_();
    poblarTipologiasUsadas_();
  }

  function cerrarFormulario_() {
    $('an-form').classList.remove('activo');
  }

  const ANUNCIOS_TIPOLOGIAS_SET_ = new Set(['manual', 'catalogo', 'folleto', 'anuncio']);

  function cambiarTab_(nombre) {
    $('an-tab-archivo').classList.toggle('activo', nombre === 'archivo');
    $('an-tab-url').classList.toggle('activo', nombre === 'url');
    $('an-tab-video').classList.toggle('activo', nombre === 'video');
    $('an-panel-archivo').classList.toggle('activo', nombre === 'archivo');
    $('an-panel-url').classList.toggle('activo', nombre === 'url');
    $('an-panel-video').classList.toggle('activo', nombre === 'video');
  }

  function actualizarContadores_() {
    $('an-titulo-contador').textContent = $('an-titulo').value.length + '/100';
    $('an-descripcion-contador').textContent = $('an-descripcion').value.length + '/500';
  }

  function actualizarVisibilidadCaducidad_() {
    const permanente = $('an-permanente').checked;
    $('an-caducidad-wrap').style.display = permanente ? 'none' : '';
    if (!permanente) {
      const max = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      $('an-fecha-caducidad').max = max.toISOString().slice(0, 16);
    }
  }

  // ── Generación de miniatura de PDF (primera página) EN EL NAVEGADOR —
  // nunca en el servidor (Apps Script no puede renderizar un PDF). Carga
  // pdf.js SOLO cuando hace falta (nunca en la página pública: esta
  // función solo se llama desde el gestor, tras elegir un PDF) ──────────
  let pdfjsCargando_ = null;
  function cargarPdfJs_() {
    if (window.pdfjsLib) return Promise.resolve();
    if (pdfjsCargando_) return pdfjsCargando_;
    pdfjsCargando_ = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      script.onerror = () => reject(new Error('No se pudo cargar el visor de PDF.'));
      document.head.appendChild(script);
    });
    return pdfjsCargando_;
  }

  async function generarMiniaturaPdf_(arrayBuffer) {
    await cargarPdfJs_();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pagina = await pdf.getPage(1);
    const viewport = pagina.getViewport({ scale: 1.4 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png', 0.9));
  }

  function blobABase64_(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsDataURL(blob);
    });
  }

  const ANUNCIOS_TAMANO_MAX_MB_ = 20;
  const ANUNCIOS_EXTENSIONES_VALIDAS_ = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  // MIME equivalentes, para filtrar lo que trae el portapapeles — un
  // archivo pegado no tiene "nombre" propio, así que aquí se identifica
  // por tipo MIME en vez de por extensión.
  const ANUNCIOS_MIME_PERMITIDOS_ = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const ANUNCIOS_MIME_A_EXTENSION_ = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

  // Un Blob leído del portapapeles no tiene nombre de archivo (hace
  // falta uno para que manejarArchivoSeleccionado_ pueda deducir la
  // extensión, igual que con un File normal elegido a mano).
  function blobAFile_(blob, mime) {
    const extension = ANUNCIOS_MIME_A_EXTENSION_[mime] || 'bin';
    return new File([blob], 'portapapeles.' + extension, { type: mime });
  }

  async function manejarArchivoSeleccionado_(file) {
    const estado = $('an-archivo-estado');
    estado.textContent = '';
    const extension = file.name.split('.').pop().toLowerCase();
    if (ANUNCIOS_EXTENSIONES_VALIDAS_.indexOf(extension) === -1) {
      estado.textContent = 'Formato no admitido. Usa PDF, JPG, PNG o WebP.';
      return;
    }
    if (file.size > ANUNCIOS_TAMANO_MAX_MB_ * 1024 * 1024) {
      estado.textContent = `El archivo supera el máximo de ${ANUNCIOS_TAMANO_MAX_MB_} MB.`;
      return;
    }
    estado.textContent = 'Procesando…';
    miniaturaGenerada_ = null;
    $('an-miniatura-preview').classList.remove('visible');

    // La lectura del archivo en sí (lo único imprescindible para poder
    // subirlo) se separa a propósito de la generación de la miniatura
    // (secundaria, solo para PDFs): un fallo generando la miniatura NO
    // debe impedir subir el archivo — se sube igual, sin miniatura, con
    // el icono genérico de su tipología hasta que se pueda regenerar.
    try {
      const datos = await blobABase64_(file);
      archivoSeleccionado_ = { nombre: file.name, tipo: file.type || ('application/' + extension), datos: datos };
      $('an-dropzone').classList.add('con-archivo');
      $('an-dropzone').innerHTML = `<i class="fa-solid fa-file-circle-check"></i> ${escapeHtml(file.name)} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
    } catch (e) {
      estado.textContent = 'Error al leer el archivo: ' + e.message;
      archivoSeleccionado_ = null;
      return;
    }

    if (extension === 'pdf') {
      try {
        const buffer = await file.arrayBuffer();
        const blobMini = await generarMiniaturaPdf_(buffer);
        if (blobMini) {
          const base64Mini = await blobABase64_(blobMini);
          miniaturaGenerada_ = { nombre: 'miniatura.png', tipo: 'image/png', datos: base64Mini };
          const previo = $('an-miniatura-preview');
          previo.src = 'data:image/png;base64,' + base64Mini;
          previo.classList.add('visible');
        }
        estado.textContent = 'Miniatura generada a partir de la primera página.';
      } catch (e) {
        console.error('No se pudo generar la miniatura del PDF:', e);
        estado.textContent = 'El archivo se subirá correctamente, pero no se ha podido generar una miniatura automática.';
      }
    } else {
      // Para imágenes, la propia imagen sirve de miniatura (igual que
      // las fotos de producto) — no hace falta generar una aparte.
      estado.textContent = '';
    }
  }

  async function guardarAnuncio_() {
    const error = $('an-form-error');
    const ok = $('an-form-ok');
    error.textContent = ''; ok.textContent = '';
    const btn = $('an-guardar');

    const tab = $('an-tab-url').classList.contains('activo') ? 'url' : ($('an-tab-video').classList.contains('activo') ? 'video' : 'archivo');
    const tipologia = $('an-tipologia').value;

    const payload = {
      accion: 'guardar_anuncio',
      pin: anunciosPin_,
      id: anuncioEnEdicion_ || undefined,
      titulo: $('an-titulo').value,
      descripcion: $('an-descripcion').value,
      tipologia: tipologia,
      tipologiaPersonalizada: $('an-tipologia-personalizada').value,
      area: $('an-area').value,
      familia: $('an-familia').value,
      productoRef: $('an-producto-ref').value,
      visible: $('an-visible').checked,
      permanente: $('an-permanente').checked,
      fechaCaducidad: $('an-permanente').checked ? '' : $('an-fecha-caducidad').value,
    };

    if (tab === 'archivo' && !anuncioEnEdicion_ && !archivoSeleccionado_) {
      error.textContent = 'Selecciona un archivo o cambia a "Añadir URL externa".';
      return;
    }
    if (tab === 'url' && !$('an-url-externa').value.trim()) {
      error.textContent = 'Introduce la URL externa.';
      return;
    }
    if (tab === 'video' && !$('an-video-url').value.trim()) {
      error.textContent = 'Introduce el enlace del vídeo.';
      return;
    }

    const restaurarBoton = mostrarSpinnerBoton_(btn, 'Guardando…');
    try {
      const d = await anunciosFetchPost_(payload);
      if (!d.success) { error.textContent = d.error || 'No se pudo guardar.'; return; }
      const id = d.id || anuncioEnEdicion_;

      // Archivo/URL: solo se envía si hay algo nuevo que subir — editar
      // solo metadatos no debe volver a subir ni tocar el archivo.
      if (tab === 'archivo' && archivoSeleccionado_) {
        const payloadArchivo = { accion: 'actualizar_archivo_anuncio', pin: anunciosPin_, id: id, tipoRecurso: 'archivo', archivo: archivoSeleccionado_ };
        if (miniaturaGenerada_) payloadArchivo.archivoMiniatura = miniaturaGenerada_;
        const dArchivo = await anunciosFetchPost_(payloadArchivo);
        if (!dArchivo.success) { error.textContent = 'Guardado, pero falló la subida del archivo: ' + (dArchivo.error || ''); return; }
      } else if (tab === 'url') {
        const payloadUrl = { accion: 'actualizar_archivo_anuncio', pin: anunciosPin_, id: id, tipoRecurso: 'url', urlExterna: $('an-url-externa').value.trim() };
        if (miniaturaGenerada_) payloadUrl.archivoMiniatura = miniaturaGenerada_;
        const dUrl = await anunciosFetchPost_(payloadUrl);
        if (!dUrl.success) { error.textContent = 'Guardado, pero falló el enlace externo: ' + (dUrl.error || ''); return; }
      } else if (tab === 'video') {
        const payloadVideo = { accion: 'actualizar_archivo_anuncio', pin: anunciosPin_, id: id, tipoRecurso: 'video', urlExterna: $('an-video-url').value.trim() };
        if (miniaturaGenerada_) payloadVideo.archivoMiniatura = miniaturaGenerada_;
        const dVideo = await anunciosFetchPost_(payloadVideo);
        if (!dVideo.success) { error.textContent = 'Guardado, pero falló el vídeo: ' + (dVideo.error || ''); return; }
      }

      ok.textContent = '✓ Guardado correctamente.';
      await cargarAnuncios_();
      cerrarFormulario_();
      toast('Recurso guardado.');
    } catch (e) {
      error.textContent = 'Error de conexión: ' + e.message;
    } finally {
      restaurarBoton();
    }
  }

  async function eliminarAnuncio_(id, btn) {
    const a = encontrarAnuncio_(id);
    if (!a) return;
    if (!window.confirm(`¿Eliminar «${a.titulo}»? Esta acción no se puede deshacer y borra también su archivo de Drive.`)) return;
    // El botón de la papelera del listado es solo icono (sin texto que
    // mantener); el de "Eliminar" del formulario sí lleva etiqueta.
    const restaurarBoton = btn ? mostrarSpinnerBoton_(btn, btn.textContent.trim() ? 'Eliminando…' : '') : null;
    try {
      const d = await anunciosFetchPost_({ accion: 'eliminar_anuncio', pin: anunciosPin_, id: id });
      if (!d.success) { toast('No se pudo eliminar: ' + (d.error || ''), true); return; }
      if (d.avisoParcial) toast(d.avisoParcial, true);
      cerrarFormulario_(); // por si se eliminaba el recurso que se estaba editando
      await cargarAnuncios_();
      toast('Recurso eliminado.');
    } catch (e) {
      toast('Error de conexión al eliminar.', true);
    } finally {
      // El botón del listado ya no existe tras recargarAnuncios_() en el
      // caso de éxito (el listado se repinta entero) — solo hace falta
      // restaurarlo de verdad en el camino de error, donde sigue en el DOM.
      if (restaurarBoton && document.body.contains(btn)) restaurarBoton();
    }
  }

  // ── Apertura/cierre del modal ────────────────────────────────────────
  function abrirModalGestion_() {
    $('an-modal-overlay').classList.add('activo');
    const pinGuardado = (() => { try { return localStorage.getItem('omAnunciosPin'); } catch (e) { return null; } })();
    if (pinGuardado) {
      anunciosValidarPinYArrancar_(pinGuardado);
    } else {
      $('an-vista-pin').style.display = '';
      $('an-vista-principal').style.display = 'none';
    }
  }
  function cerrarModalGestion_() {
    $('an-modal-overlay').classList.remove('activo');
  }

  // ── Inicialización ───────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    cargarAnuncios_();

    $('an-buscar').addEventListener('input', renderPublico_);
    $('an-filtro-tipologia').addEventListener('change', renderPublico_);

    // Visor de recurso — público, en cualquier entorno (a diferencia del
    // modal de gestión, que solo existe en preproducción).
    $('an-visor-cerrar').addEventListener('click', cerrarVisorRecurso_);
    $('an-visor-overlay').addEventListener('click', (e) => { if (e.target.id === 'an-visor-overlay') cerrarVisorRecurso_(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('an-visor-overlay').classList.contains('activo')) cerrarVisorRecurso_(); });

    // Deep-link ?ref=<id> — si el enlace compartido apunta a un recurso
    // que ya no está visible/vigente, no se fuerza a mostrarlo como si
    // siguiera publicado (ver accionCompartir_): simplemente no aparece.
    const refParam = new URLSearchParams(window.location.search).get('ref');
    if (refParam) {
      setTimeout(() => {
        const card = document.querySelector(`.an-card[data-id="${CSS.escape(refParam)}"]`);
        if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.style.outline = '3px solid var(--primary-blue)'; }
      }, 800);
    }

    if (!window.MOSTRAR_GESTION_ANUNCIOS) {
      const btnGestion = $('an-btn-gestionar');
      const modal = $('an-modal-overlay');
      if (btnGestion) btnGestion.remove();
      if (modal) modal.remove();
      return;
    }

    $('an-btn-gestionar').classList.add('visible');
    $('an-btn-gestionar').addEventListener('click', abrirModalGestion_);
    $('an-modal-cerrar').addEventListener('click', cerrarModalGestion_);
    $('an-modal-overlay').addEventListener('click', (e) => { if (e.target.id === 'an-modal-overlay') cerrarModalGestion_(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('an-modal-overlay').classList.contains('activo')) cerrarModalGestion_(); });

    $('an-pin-entrar').addEventListener('click', () => {
      const pin = $('an-pin-input').value.trim();
      anunciosGuardarPinLocal_(pin, $('an-pin-recordar').checked);
      anunciosValidarPinYArrancar_(pin);
    });
    $('an-pin-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('an-pin-entrar').click(); });

    $('an-gestion-buscar').addEventListener('input', renderGestionListado_);
    $('an-gestion-filtro-area').addEventListener('change', renderGestionListado_);
    $('an-gestion-filtro-tipologia').addEventListener('change', renderGestionListado_);
    $('an-gestion-filtro-visibilidad').addEventListener('change', renderGestionListado_);
    $('an-gestion-filtro-vigencia').addEventListener('change', renderGestionListado_);

    $('an-nuevo').addEventListener('click', abrirFormularioNuevo_);
    $('an-cancelar').addEventListener('click', cerrarFormulario_);
    $('an-eliminar').addEventListener('click', (e) => { if (anuncioEnEdicion_) eliminarAnuncio_(anuncioEnEdicion_, e.currentTarget); });
    $('an-guardar').addEventListener('click', guardarAnuncio_);

    $('an-tab-archivo').addEventListener('click', () => cambiarTab_('archivo'));
    $('an-tab-url').addEventListener('click', () => cambiarTab_('url'));
    $('an-tab-video').addEventListener('click', () => cambiarTab_('video'));
    $('an-dropzone').addEventListener('click', () => $('an-archivo-input').click());
    // Miniatura/portada manual de "URL externa" o "Vídeo" — a diferencia
    // de un PDF (ver manejarArchivoSeleccionado_), aquí NO hay nada que
    // generar: la imagen elegida ES la miniatura, solo hay que leerla
    // igual que cualquier otro archivo pendiente de subir.
    async function manejarMiniaturaManualSeleccionada_(file) {
      if (!file) { miniaturaGenerada_ = null; return; }
      try {
        const datos = await blobABase64_(file);
        miniaturaGenerada_ = { nombre: file.name, tipo: file.type || 'image/jpeg', datos: datos };
      } catch (e) {
        console.error('No se pudo leer la miniatura:', e);
        toast('No se pudo leer la miniatura elegida.', true);
        miniaturaGenerada_ = null;
      }
    }
    $('an-url-miniatura-input').addEventListener('change', (e) => manejarMiniaturaManualSeleccionada_(e.target.files[0]));
    $('an-video-miniatura-input').addEventListener('change', (e) => manejarMiniaturaManualSeleccionada_(e.target.files[0]));
    $('an-archivo-input').addEventListener('change', (e) => { if (e.target.files[0]) manejarArchivoSeleccionado_(e.target.files[0]); });

    // Arrastrar y soltar — mismo mecanismo ya usado en el resto del
    // proyecto (Asistente de imágenes, imagen de campaña).
    $('an-dropzone').addEventListener('dragover', (e) => { e.preventDefault(); $('an-dropzone').classList.add('arrastrando'); });
    $('an-dropzone').addEventListener('dragleave', () => $('an-dropzone').classList.remove('arrastrando'));
    $('an-dropzone').addEventListener('drop', (e) => {
      e.preventDefault();
      $('an-dropzone').classList.remove('arrastrando');
      const file = e.dataTransfer.files[0];
      if (file) manejarArchivoSeleccionado_(file);
    });

    // Pegar desde el portapapeles — dos vías, mismo patrón ya usado para
    // las imágenes de producto en buscador.html: un botón con la
    // Clipboard API moderna (gesto explícito, funciona también en
    // móvil) y, además, Ctrl+V en cualquier parte mientras el gestor
    // esté abierto en la pestaña de "Subir archivo".
    $('an-pegar-portapapeles').addEventListener('click', async () => {
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
          const tipo = clipboardItem.types.find((t) => ANUNCIOS_MIME_PERMITIDOS_.indexOf(t) !== -1);
          if (tipo) {
            const blob = await clipboardItem.getType(tipo);
            manejarArchivoSeleccionado_(blobAFile_(blob, tipo));
            return;
          }
        }
        toast('No hay ninguna imagen o PDF compatible en el portapapeles.', true);
      } catch (e) {
        console.error('Error al leer del portapapeles:', e);
        toast(e.name === 'NotAllowedError' ? 'Permiso denegado para leer el portapapeles.' : 'No se pudo pegar desde el portapapeles. Copia el archivo e inténtalo de nuevo.', true);
      }
    });
    document.addEventListener('paste', (e) => {
      if (!$('an-modal-overlay').classList.contains('activo')) return;
      if (!$('an-form').classList.contains('activo')) return;
      if ($('an-tab-url').classList.contains('activo') || $('an-tab-video').classList.contains('activo')) return; // en la pestaña de URL o de vídeo, un Ctrl+V normal debe pegar texto
      const item = Array.from(e.clipboardData?.items || []).find((i) => ANUNCIOS_MIME_PERMITIDOS_.indexOf(i.type) !== -1);
      if (!item) return;
      e.preventDefault();
      manejarArchivoSeleccionado_(item.getAsFile());
    });

    $('an-titulo').addEventListener('input', actualizarContadores_);
    $('an-descripcion').addEventListener('input', actualizarContadores_);
    $('an-permanente').addEventListener('change', actualizarVisibilidadCaducidad_);
    $('an-tipologia').addEventListener('change', () => {
      $('an-tipologia-personalizada-wrap').style.display = $('an-tipologia').value === 'personalizado' ? '' : 'none';
    });
  });
})();
