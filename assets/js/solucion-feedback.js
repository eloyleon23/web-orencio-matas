// ── Modal de feedback proactiva (Centro de Soluciones) ──────────────────
//
// A petición de Eloy: el feedback 👍/👎 que ya vivía pasivo al final de
// la página (solo en las soluciones generadas por IA, nunca en las ~80
// guías escritas a mano) se ignora con facilidad porque hay que
// desplazarse hasta el final para verlo. Esto añade una modal pequeña
// que se ofrece — nunca sustituye al widget de siempre, lo refuerza —
// en el momento en que interpretamos que el usuario ya ha terminado de
// analizar la solución: tras ver un producto, tras exportarla/
// compartirla, o justo al intentar volver al Centro de Soluciones si
// todavía no ha dado su opinión.
//
// Compartido entre solucion-detalle.js (guías escritas a mano) y
// solucion-ia.js (generadas por IA) — ambas páginas ya cargan
// centro-soluciones-analytics.js, así que añadir este segundo script
// pequeño sigue el mismo patrón, en vez de duplicar la lógica de la
// modal en cada archivo.
//
// REGLAS (todas a petición expresa de Eloy):
//   1. Nunca se abre si el usuario YA votó para esta misma solución —
//      "votó" incluye tanto el widget de siempre como esta modal, y se
//      recuerda entre visitas (localStorage), así que una vez dado el
//      feedback no se vuelve a pedir nunca más para esa guía/consulta.
//   2. Como mucho una vez por visita a la página (salvo el momento de
//      "volver al centro", que es la última oportunidad antes de
//      irse — ver ofrecerAntesDeSalir).
//   3. Nunca se abre justo al pulsar un botón que YA es en sí mismo una
//      señal negativa (p. ej. "No es lo que buscaba, prueba otra vez"
//      en las soluciones de IA) — eso lo garantiza quien llama, al no
//      enganchar esta modal a ese clic en absoluto (ver solucion-ia.js).
//   4. Siempre se puede cerrar sin votar (✕, clic fuera, Escape) — es
//      una invitación, nunca un muro que bloquee la página.
(function () {
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }

  const CLAVE_VOTADO_PREFIJO = 'cs_feedback_votado_'; // + id — localStorage, para siempre
  const CLAVE_MOSTRADO_PREFIJO = 'cs_feedback_mostrado_'; // + id — sessionStorage, solo esta visita

  function yaVotado(id) {
    try { return localStorage.getItem(CLAVE_VOTADO_PREFIJO + id) === '1'; } catch (e) { return false; }
  }
  function marcarVotado(id) {
    try { localStorage.setItem(CLAVE_VOTADO_PREFIJO + id, '1'); } catch (e) { /* sin persistencia, no es crítico */ }
  }
  function yaMostradoEstaVisita(id) {
    try { return sessionStorage.getItem(CLAVE_MOSTRADO_PREFIJO + id) === '1'; } catch (e) { return false; }
  }
  function marcarMostradoEstaVisita(id) {
    try { sessionStorage.setItem(CLAVE_MOSTRADO_PREFIJO + id, '1'); } catch (e) { /* no crítico */ }
  }

  // El DOM de la modal se crea una sola vez, perezosamente — nunca hace
  // falta tocar el HTML de cada página para usar esto.
  let overlay = null;
  function construirModal() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'cs-feedback-prompt-overlay';
    overlay.className = 'cs-ia-modal-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div class="cs-ia-modal-box">
        <button type="button" class="cs-ia-modal-cerrar" id="cs-feedback-prompt-cerrar" aria-label="Cerrar">✕</button>
        <p class="cs-ia-modal-texto" id="cs-feedback-prompt-titulo">¿Te está resultando útil esta solución?</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px;">
          <button type="button" class="cs-ia-feedback__btn" data-util="si">👍 Sí, me ha servido</button>
          <button type="button" class="cs-ia-feedback__btn" data-util="no">👎 No era lo que buscaba</button>
        </div>
        <p class="cs-ia-modal-texto" id="cs-feedback-prompt-gracias" style="display:none;margin-top:10px;"></p>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  // `alCerrar` se llama EXACTAMENTE una vez, se cierre como se cierre la
  // modal (votando, con la ✕, clic fuera o Escape) — lo usa
  // ofrecerAntesDeSalir() para completar la navegación pendiente una vez
  // que el usuario termina con la modal, sea cual sea el resultado.
  function abrir(id, onVotar, alCerrar) {
    const el = construirModal();
    const botones = el.querySelectorAll('.cs-ia-feedback__btn');
    const gracias = $('#cs-feedback-prompt-gracias', el);
    const titulo = $('#cs-feedback-prompt-titulo', el);
    const btnCerrar = $('#cs-feedback-prompt-cerrar', el);

    titulo.style.display = '';
    gracias.style.display = 'none';
    botones.forEach((b) => { b.disabled = false; b.classList.remove('is-selected'); b.style.display = ''; });

    let cerrado = false;
    function onEscape(e) { if (e.key === 'Escape') cerrarYContinuar(); }
    function cerrarYContinuar() {
      if (cerrado) return;
      cerrado = true;
      overlay.style.display = 'none';
      document.removeEventListener('keydown', onEscape);
      if (alCerrar) alCerrar();
    }

    btnCerrar.onclick = cerrarYContinuar;
    overlay.onclick = (e) => { if (e.target === overlay) cerrarYContinuar(); };
    document.addEventListener('keydown', onEscape);

    botones.forEach((b) => {
      b.onclick = () => {
        botones.forEach((btn) => { btn.disabled = true; });
        b.classList.add('is-selected');
        const feedback = b.dataset.util === 'si' ? 'positive' : 'negative';
        marcarVotado(id);
        if (onVotar) onVotar(feedback);
        titulo.style.display = 'none';
        gracias.textContent = feedback === 'positive'
          ? '¡Gracias! Nos alegra haberte ayudado.'
          : 'Gracias por avisarnos — prueba con el buscador completo o llámanos y te ayudamos directamente.';
        gracias.style.display = '';
        setTimeout(cerrarYContinuar, 1800);
      };
    });

    overlay.style.display = 'flex';
  }

  // Momentos "normales" (abrir un producto, exportar/compartir) — como
  // mucho una vez por visita, y nunca si ya votó alguna vez.
  function notificarInteraccion(id, onVotar) {
    if (!id || yaVotado(id) || yaMostradoEstaVisita(id)) return;
    marcarMostradoEstaVisita(id);
    // Pequeño respiro: que no se sienta como una reacción brusca e
    // inmediata al clic que la provoca.
    setTimeout(() => abrir(id, onVotar), 600);
  }

  // Momento de salida ("volver al centro de soluciones") — ignora el
  // límite de "una vez por visita" (es la última oportunidad antes de
  // irse) pero sigue respetando que, si ya votó, no se le vuelve a
  // preguntar. `continuar` se llama siempre exactamente una vez, para
  // completar la navegación que el usuario pidió en realidad.
  function ofrecerAntesDeSalir(id, onVotar, continuar) {
    if (!id || yaVotado(id)) { continuar(); return; }
    abrir(id, onVotar, continuar);
  }

  window.SolucionFeedbackModal = { notificarInteraccion, ofrecerAntesDeSalir, yaVotado, marcarVotado };
})();
