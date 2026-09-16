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
    try {
      await cargarTodas();
      limpiarEditor();
    } catch (err) {
      $('#cs-gestion-lista').innerHTML = `<p class="cs-gestion-lista-vacio">No se ha podido cargar: ${err.message}</p>`;
    }
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
