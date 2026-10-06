/**
 * Gestión de guías del Centro de Soluciones — editor manual (SIN IA a
 * propósito, petición explícita de Eloy). Vive aparte de
 * centro-soluciones.js porque solo tiene sentido en preproducción (ver
 * window.MOSTRAR_GESTION_SOLUCIONES) y no debería cargarse nunca en una
 * copia de release, igual que el patrón ya usado para el resto de
 * gestión del proyecto (imágenes del buscador, campañas de Escaparate OM).
 *
 * A diferencia de D.soluciones (que solo trae las guías ACTIVAS, para la
 * parte pública), este archivo pide su propia copia sin filtrar —
 * gestionar de verdad implica poder ver y reactivar una guía
 * desactivada, no solo las que ya se enseñan.
 */
(function () {
  'use strict';
  if (!window.MOSTRAR_GESTION_SOLUCIONES) return;

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);

  let TODAS = []; // todas las guías tal cual las devuelve obtener_soluciones, activas e inactivas
  let slugSeleccionado = null; // null = "+ Nueva guía"

  async function cargarTodas() {
    const url = window.GOOGLE_APPS_SCRIPT_URL;
    if (!url) throw new Error('GOOGLE_APPS_SCRIPT_URL no está definida.');
    const controller = new AbortController();
    const aviso = setTimeout(() => controller.abort(), 12000);
    try {
      const resp = await fetch(url + '?accion=obtener_soluciones&_ts=' + Date.now(), { cache: 'no-store', signal: controller.signal });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const datos = await resp.json();
      if (datos.error) throw new Error(datos.error);
      TODAS = Array.isArray(datos.soluciones) ? datos.soluciones : [];
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('La respuesta ha tardado demasiado (más de 12 segundos) y se ha cancelado.');
      throw err;
    } finally {
      clearTimeout(aviso);
    }
  }

  function encontrar(slug) {
    return TODAS.find((s) => s.slug === slug) || null;
  }

  // ── Candidatas de IA (consultas repetidas) ──────────────────────────
  // A petición de Eloy: cerrar el círculo "la IA detecta un hueco -> se
  // convierte en guía permanente" (sección 13 del documento de
  // analítica). Lee las vistas de Fase 4/5 (mismo proyecto Supabase, MISMA
  // clave "anon" de solo lectura sobre agregados — ver
  // supabase/04_fase4_vistas_centro_soluciones.sql y
  // supabase/05_fase5_candidatas_ia_json.sql) y ofrece un borrador
  // PREllenado, nunca un guardado automático: el admin siempre revisa y
  // completa (categoría, productos reales con ref...) antes de pulsar
  // "Guardar guía", exactamente el mismo botón y la misma validación que
  // ya existían.
  function supabaseGet_(ruta) {
    const url = window.SUPABASE_URL, key = window.SUPABASE_ANON_KEY;
    if (!url || !key) return Promise.resolve([]);
    return fetch(url.replace(/\/$/, '') + '/rest/v1/' + ruta, {
      headers: { apikey: key, Authorization: 'Bearer ' + key },
    }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  }

  // ── Evitar candidatas duplicadas o que no tienen sentido ─────────────
  // A petición expresa de Eloy: "que esto no llene el Centro de
  // Soluciones con muchas soluciones parecidas, sino que las que se
  // añadan tengan sentido". Dos problemas reales que esto soluciona:
  // (1) la misma necesidad escrita de formas distintas ("quitar pintura
  // de aluminio", "cómo quitar pintura aluminio", "decapar aluminio")
  // aparecía como 2-3 candidatas SUELTAS y débiles en vez de una sola
  // con todas sus sesiones sumadas — aquí se agrupan por palabras clave
  // compartidas (sin necesidad de clustering semántico con IA, sección
  // 13 del documento: "no es necesario implementarlo ahora, pero la
  // estructura debe permitir hacerlo"); (2) una candidata podía solaparse
  // de hecho con una guía YA EXISTENTE (p. ej. la IA generó una
  // respuesta dinámica para un caso que en realidad ya cubre otra guía
  // con otras palabras) — se avisa de eso ANTES de ofrecer crear una
  // guía nueva, y se ofrece abrir la existente en su lugar.
  const PALABRAS_VACIAS_ES = new Set([
    'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'en', 'para',
    'por', 'con', 'sin', 'del', 'al', 'a', 'que', 'como', 'cómo', 'es', 'son', 'su', 'sus',
    'mi', 'tu', 'se', 'lo', 'le', 'les', 'muy', 'más', 'esta', 'este', 'esa', 'ese',
  ]);

  function normalizarPalabra_(p) {
    return p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Palabras "con peso" de un texto — las de 4+ letras, sin vacías de
  // relleno, recortadas a sus primeros 4 caracteres ("raíz" aproximada,
  // sin diccionario ni librería de stemming real: suficiente para que
  // "metal" y "metálicas", o "pintura" y "pintar", cuenten como la
  // misma palabra clave — bug real detectado en pruebas: sin este
  // recorte, "óxido de verjas metálicas" NO se reconocía como parecido a
  // una guía de "óxido del metal" porque "metal" y "metálicas" son
  // cadenas distintas). Deliberadamente simple (sin IA ni librerías
  // nuevas): basta para detectar que dos frases hablan de lo mismo con
  // palabras parecidas, que es todo lo que hace falta aquí.
  function palabrasClave_(texto) {
    return new Set(
      (texto || '')
        .split(/[^a-zA-ZÀ-ÿ0-9]+/)
        .map(normalizarPalabra_)
        .filter((p) => p.length >= 4 && !PALABRAS_VACIAS_ES.has(p))
        .map((p) => p.slice(0, 4)),
    );
  }

  function interseccion_(a, b) {
    let n = 0;
    a.forEach((x) => { if (b.has(x)) n++; });
    return n;
  }

  // Agrupa candidatas cuyas consultas comparten 2+ palabras clave — así
  // "quitar pintura aluminio" y "cómo quitar pintura de aluminio" se
  // convierten en UNA sola candidata (sesiones sumadas), no en dos
  // débiles por separado.
  function agruparCandidatasPorPalabrasClave_(candidatas) {
    const grupos = [];
    candidatas.forEach((c) => {
      const claves = palabrasClave_(c.query_normalized);
      let grupo = grupos.find((g) => interseccion_(g.claves, claves) >= 2);
      if (!grupo) {
        grupo = { claves: new Set(), items: [], sesiones_unicas: 0, total_consultas: 0 };
        grupos.push(grupo);
      }
      claves.forEach((k) => grupo.claves.add(k));
      grupo.items.push(c);
      grupo.sesiones_unicas += c.sesiones_unicas;
      grupo.total_consultas += c.total_consultas;
    });
    // Dentro de cada grupo, la variante con más sesiones representa al
    // grupo (texto más "típico" de lo que se está preguntando).
    grupos.forEach((g) => {
      g.items.sort((a, b) => b.sesiones_unicas - a.sesiones_unicas);
      g.representante = g.items[0];
    });
    return grupos;
  }

  // ¿Alguna guía YA EXISTENTE (activa) habla de lo mismo que este grupo
  // de consultas? Compara contra título + categoría + subcategoría +
  // breadcrumb de cada guía — mismo criterio de "2+ palabras clave
  // compartidas" que el agrupado de arriba.
  function buscarGuiaParecida_(grupo) {
    let mejor = null, mejorPuntuacion = 0;
    TODAS.forEach((s) => {
      if (s.activa === false) return; // una guía desactivada no cuenta como "ya cubierto"
      const clavesGuia = palabrasClave_([s.title, s.category, s.subcategory, (s.breadcrumb || []).join(' ')].join(' '));
      const puntuacion = interseccion_(grupo.claves, clavesGuia);
      if (puntuacion > mejorPuntuacion) { mejorPuntuacion = puntuacion; mejor = s; }
    });
    return mejorPuntuacion >= 2 ? mejor : null;
  }

  function slugificar_(texto) {
    const base = (texto || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || 'nueva-solucion';
  }

  // Construye un borrador de guía a partir del JSON que generó la IA
  // (campos: titulo, respuesta, pasos[], dificultad, tiempo, resultado,
  // terminos[], familias[] — ver buscarSolucionIA en soluciones-data.js)
  // en el MISMO formato que usan las guías escritas a mano (slug, title,
  // description, category...). Deliberadamente deja category/
  // subcategory/problem/objective/surface/recommendedProducts vacíos
  // cuando no hay una pista fiable — mejor en blanco y que el admin lo
  // rellene a sabiendas, que adivinar algo que podría ser incorrecto.
  function construirBorradorDesdeJsonIA_(query, json) {
    const pasos = Array.isArray(json.pasos) ? json.pasos : [];
    return {
      slug: slugificar_(query),
      title: json.titulo || `Cómo resolver: ${query}`,
      description: json.respuesta || '',
      category: '', subcategory: '',
      problem: '', objective: '', surface: '',
      difficulty: json.dificultad || 'Media',
      estimatedTime: json.tiempo || '',
      result: json.resultado || '',
      breadcrumb: ['Centro de Soluciones', json.titulo || query],
      materials: [],
      steps: pasos.map((p, i) => ({ n: i + 1, title: p.titulo || `Paso ${i + 1}`, text: p.texto || '', productos: [] })),
      professionalTips: [],
      commonMistakes: [],
      recommendedProducts: [],
      alternativeProducts: [],
      relatedSolutions: [],
      seo: {
        title: (json.titulo || query) + ' | Guía — Orencio Matas',
        description: json.respuesta || '',
      },
    };
  }

  function usarCandidataComoBorrador_(query, json) {
    if (!window.confirm(`Esto reemplaza lo que haya ahora mismo en el editor con un borrador para "${query}". ¿Continuar?`)) return;
    limpiarEditor();
    const borrador = construirBorradorDesdeJsonIA_(query, json);
    $('#cs-gestion-slug').value = borrador.slug;
    $('#cs-gestion-json').value = JSON.stringify(borrador, null, 2);
    mostrarMsg('Borrador cargado desde una consulta repetida a la IA — revisa categoría, pasos y añade productos reales (con "ref") antes de guardar.', false);
  }

  function renderCandidatasIA_(grupos) {
    const cont = $('#cs-gestion-candidatas-lista');
    if (!cont) return;
    if (!grupos.length) {
      cont.innerHTML = '<p class="cs-gestion-lista-vacio">Sin candidatas todavía (hace falta más tráfico real, o volver a ejecutar el refresco de las vistas).</p>';
      return;
    }
    // Las candidatas que de verdad son nuevas van primero — las que ya
    // tienen una guía parecida se ven, pero no invitan a duplicar.
    const ordenados = grupos.slice().sort((a, b) => {
      if (!!a.guiaParecida !== !!b.guiaParecida) return a.guiaParecida ? 1 : -1;
      return b.sesiones_unicas - a.sesiones_unicas;
    });
    cont.innerHTML = ordenados.map((g, i) => {
      const variantes = g.items.length > 1
        ? `<span class="cs-gestion-candidata-variantes">También: ${g.items.slice(1).map((it) => `"${it.query_normalized}"`).join(', ')}</span>`
        : '';
      if (g.guiaParecida) {
        return `
          <div class="cs-gestion-candidata-item cs-gestion-candidata-item--parecida">
            <div class="cs-gestion-candidata-texto">
              <span class="cs-gestion-candidata-query">${g.representante.query_normalized}</span>
              <span class="cs-gestion-candidata-meta">${g.sesiones_unicas} sesiones distintas · ${g.total_consultas} consultas</span>
              ${variantes}
              <span class="cs-gestion-candidata-aviso">⚠️ Ya existe una guía parecida: «${g.guiaParecida.title}» — probablemente no haga falta otra, revisa esa primero.</span>
            </div>
            <button type="button" class="cs-gestion-candidata-usar cs-gestion-candidata-usar--secundario" data-idx="${i}" data-accion="revisar">Revisar guía existente</button>
          </div>
        `;
      }
      return `
        <div class="cs-gestion-candidata-item">
          <div class="cs-gestion-candidata-texto">
            <span class="cs-gestion-candidata-query">${g.representante.query_normalized}</span>
            <span class="cs-gestion-candidata-meta">${g.sesiones_unicas} sesiones distintas · ${g.total_consultas} consultas</span>
            ${variantes}
          </div>
          <button type="button" class="cs-gestion-candidata-usar" data-idx="${i}" data-accion="borrador">Usar como borrador</button>
        </div>
      `;
    }).join('');
    cont.querySelectorAll('[data-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const g = ordenados[Number(btn.dataset.idx)];
        if (!g) return;
        if (btn.dataset.accion === 'revisar' && g.guiaParecida) {
          cerrarCandidatasIA_();
          cargarEnEditor(g.guiaParecida.slug);
          return;
        }
        if (g.representante && g.representante.ai_generated_json) {
          usarCandidataComoBorrador_(g.representante.query_normalized, g.representante.ai_generated_json);
        }
      });
    });
  }

  function cerrarCandidatasIA_() {
    const detalles = document.querySelector('.cs-gestion-candidatas');
    if (detalles) detalles.open = false;
  }

  function cargarCandidatasIA() {
    const cont = $('#cs-gestion-candidatas-lista');
    if (cont) cont.innerHTML = '<p class="cs-gestion-lista-vacio">Cargando…</p>';
    Promise.all([
      supabaseGet_('mv_cs_ia_consultas_repetidas_30d?select=query_normalized,total_consultas,sesiones_unicas,veces_generada_dinamicamente&order=sesiones_unicas.desc&limit=30'),
      supabaseGet_('mv_cs_ia_candidatas_json_30d?select=query_normalized,ai_generated_json'),
    ]).then(([repetidas, jsons]) => {
      const jsonPorConsulta = new Map((jsons || []).map((j) => [j.query_normalized, j.ai_generated_json]));
      // Solo las que de verdad generaron una respuesta dinámica (sin
      // guía existente) Y de las que todavía se conserva una muestra de
      // JSON — las que solo encajaron con una guía ya existente no
      // necesitan convertirse en nada nuevo.
      const candidatas = (repetidas || [])
        .filter((r) => r.veces_generada_dinamicamente > 0 && jsonPorConsulta.has(r.query_normalized))
        .map((r) => Object.assign({ ai_generated_json: jsonPorConsulta.get(r.query_normalized) }, r));
      // Agrupa variantes de la misma necesidad y comprueba, para cada
      // grupo, si ya existe una guía parecida — ver el porqué completo
      // junto a agruparCandidatasPorPalabrasClave_/buscarGuiaParecida_.
      const grupos = agruparCandidatasPorPalabrasClave_(candidatas);
      grupos.forEach((g) => { g.guiaParecida = buscarGuiaParecida_(g); });
      renderCandidatasIA_(grupos);
    }).catch(() => {
      if (cont) cont.innerHTML = '<p class="cs-gestion-lista-vacio">Error al cargar las candidatas.</p>';
    });
  }

  function renderLista(filtro) {
    const cont = $('#cs-gestion-lista');
    const texto = (filtro || '').trim().toLowerCase();
    const filtradas = !texto ? TODAS : TODAS.filter((s) =>
      (s.slug || '').toLowerCase().includes(texto) || (s.title || '').toLowerCase().includes(texto));

    if (!filtradas.length) {
      cont.innerHTML = '<p class="cs-gestion-lista-vacio">Sin resultados.</p>';
      return;
    }
    // Orden alfabético por título — más fácil de encontrar algo entre 80
    // guías que el orden en que las devuelva el Sheet.
    const ordenadas = filtradas.slice().sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es'));
    cont.innerHTML = ordenadas.map((s) => `
      <button type="button" class="cs-gestion-lista-item${s.slug === slugSeleccionado ? ' is-activa' : ''}" data-slug="${s.slug}">
        <span class="cs-gestion-item-titulo">${s.activa === false ? '<span class="cs-gestion-item-inactiva">[Inactiva] </span>' : ''}${s.title || '(sin título)'}</span>
        <span class="cs-gestion-item-slug">${s.slug}</span>
      </button>
    `).join('');
    cont.querySelectorAll('[data-slug]').forEach((btn) => {
      btn.addEventListener('click', () => cargarEnEditor(btn.dataset.slug));
    });
  }

  function limpiarEditor() {
    slugSeleccionado = null;
    $('#cs-gestion-slug').value = '';
    $('#cs-gestion-slug').disabled = false;
    $('#cs-gestion-activa').checked = true;
    $('#cs-gestion-json').value = '';
    $('#cs-gestion-eliminar').disabled = true;
    mostrarMsg('', false);
    renderLista($('#cs-gestion-buscar').value);
  }

  function cargarEnEditor(slug) {
    const s = encontrar(slug);
    if (!s) return;
    slugSeleccionado = slug;
    $('#cs-gestion-slug').value = slug;
    $('#cs-gestion-slug').disabled = true; // el slug de una guía existente no se cambia aquí — cambiarlo rompería enlaces/relatedSolutions que ya la referencian
    $('#cs-gestion-activa').checked = s.activa !== false;
    $('#cs-gestion-json').value = JSON.stringify(s, null, 2);
    $('#cs-gestion-eliminar').disabled = false;
    mostrarMsg('', false);
    renderLista($('#cs-gestion-buscar').value);
  }

  function mostrarMsg(texto, esError) {
    const el = $('#cs-gestion-msg');
    el.textContent = texto;
    el.classList.toggle('is-error', !!esError);
    el.classList.toggle('is-ok', !esError && !!texto);
  }

  async function abrirModal() {
    const overlay = $('#cs-gestion-modal');
    overlay.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    $('#cs-gestion-lista').innerHTML = '<p class="cs-gestion-lista-vacio">Cargando…</p>';
    const cont = $('#cs-gestion-candidatas-lista');
    if (cont) cont.innerHTML = '<p class="cs-gestion-lista-vacio">Cargando…</p>';
    try {
      await cargarTodas();
      limpiarEditor();
    } catch (err) {
      $('#cs-gestion-lista').innerHTML = `<p class="cs-gestion-lista-vacio">No se ha podido cargar: ${err.message}</p>`;
    }
    // Después de tener TODAS las guías (para poder comparar y avisar si
    // una candidata ya tiene una guía parecida) — ver cargarCandidatasIA.
    cargarCandidatasIA();
  }
  function cerrarModal() {
    $('#cs-gestion-modal').classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  async function guardar() {
    const slugInput = $('#cs-gestion-slug').value.trim();
    const jsonInput = $('#cs-gestion-json').value;
    const activa = $('#cs-gestion-activa').checked;
    const btn = $('#cs-gestion-guardar');

    if (!slugInput) { mostrarMsg('Falta el slug.', true); return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slugInput)) {
      mostrarMsg('El slug solo puede tener minúsculas, números y guiones (p. ej. "pintar-pared-interior").', true);
      return;
    }
    let datos;
    try {
      datos = JSON.parse(jsonInput);
    } catch (err) {
      mostrarMsg('El JSON no es válido: ' + err.message, true);
      return;
    }
    if (!slugSeleccionado && encontrar(slugInput)) {
      mostrarMsg('Ya existe una guía con ese slug — edítala desde la lista en vez de crear una nueva.', true);
      return;
    }
    datos.slug = slugInput; // el slug de la columna manda, igual que hace leerSoluciones_() en Apps Script

    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      const resp = await fetch(window.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion: 'guardar_solucion', slug: slugInput, datos, activa }),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Error desconocido');
      await cargarTodas();
      cargarEnEditor(slugInput);
      mostrarMsg('Guardado correctamente.', false);
    } catch (err) {
      mostrarMsg('No se pudo guardar: ' + err.message, true);
    } finally {
      btn.disabled = false; btn.textContent = original;
    }
  }

  async function eliminar() {
    if (!slugSeleccionado) return;
    const s = encontrar(slugSeleccionado);
    if (!confirm(`¿Eliminar la guía «${s ? s.title : slugSeleccionado}»? Esta acción no se puede deshacer.`)) return;
    const btn = $('#cs-gestion-eliminar');
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Eliminando…';
    try {
      const resp = await fetch(window.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion: 'eliminar_solucion', slug: slugSeleccionado }),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Error desconocido');
      await cargarTodas();
      limpiarEditor();
      mostrarMsg('Guía eliminada.', false);
    } catch (err) {
      mostrarMsg('No se pudo eliminar: ' + err.message, true);
      btn.disabled = false;
    } finally {
      btn.textContent = original;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const dock = $('#cs-gestion-dock');
    if (dock) dock.hidden = false;

    const btnAbrir = $('#cs-btn-gestionar-soluciones');
    if (btnAbrir) btnAbrir.addEventListener('click', abrirModal);

    const cerrar = $('#cs-gestion-cerrar');
    if (cerrar) cerrar.addEventListener('click', cerrarModal);
    const overlay = $('#cs-gestion-modal');
    if (overlay) overlay.addEventListener('click', (ev) => { if (ev.target === overlay) cerrarModal(); });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && overlay && overlay.classList.contains('is-open')) cerrarModal();
    });

    const buscar = $('#cs-gestion-buscar');
    if (buscar) buscar.addEventListener('input', () => renderLista(buscar.value));

    const nueva = $('#cs-gestion-nueva');
    if (nueva) nueva.addEventListener('click', limpiarEditor);

    const guardarBtn = $('#cs-gestion-guardar');
    if (guardarBtn) guardarBtn.addEventListener('click', guardar);
    const eliminarBtn = $('#cs-gestion-eliminar');
    if (eliminarBtn) eliminarBtn.addEventListener('click', eliminar);
  });
})();
