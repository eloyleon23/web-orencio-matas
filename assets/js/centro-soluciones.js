(function () {
  const D = window.SOLUCIONES_DATA;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $all = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function urlSolucion(slug) {
    return `soluciones/solucion.html?slug=${encodeURIComponent(slug)}`;
  }

  function badgeDificultad(dificultad) {
    const clase = dificultad === 'Fácil' ? 'facil' : dificultad === 'Difícil' ? 'dificil' : 'media';
    return `<span class="cs-badge-dificultad cs-badge-dificultad--${clase}">${dificultad}</span>`;
  }

  // ── "¿Qué quieres hacer?" y "¿Sobre qué?" — grids simples ──────────────
  function renderGridAcciones() {
    const cont = $('#cs-grid-acciones');
    if (!cont) return;
    cont.innerHTML = D.acciones.map((a) => `
      <button type="button" class="cs-tile cs-tile--${a.color}" data-accion="${a.id}">
        <span class="cs-tile__emoji">${a.emoji}</span>
        <span class="cs-tile__label">${a.label}</span>
      </button>
    `).join('');
    cont.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-accion]');
      if (!btn) return;
      abrirWizard({ accionInicial: btn.dataset.accion });
    });
  }

  function renderGridSuperficies() {
    const cont = $('#cs-grid-superficies');
    if (!cont) return;
    cont.innerHTML = D.superficies.map((s) => `
      <button type="button" class="cs-tile cs-tile--blue" data-superficie="${s.id}">
        <span class="cs-tile__emoji">${s.emoji}</span>
        <span class="cs-tile__label">${s.label}</span>
      </button>
    `).join('');
    cont.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-superficie]');
      if (!btn) return;
      abrirWizard({ superficieInicial: btn.dataset.superficie });
    });
  }

  // ── "Tengo un problema" ─────────────────────────────────────────────────
  function renderProblemas() {
    const chips = $('#cs-problem-chips');
    if (chips) {
      chips.innerHTML = D.problemasFrecuentes.map((p) => `
        <button type="button" class="cs-chip" data-problema="${p.id}">${p.label}</button>
      `).join('');
    }

    const textarea = $('#cs-problem-textarea');
    const btnAnalizar = $('#cs-btn-analizar');
    const resultado = $('#cs-diagnostico-resultado');

    if (chips) {
      chips.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-problema]');
        if (!chip) return;
        const problema = D.problemasFrecuentes.find((p) => p.id === chip.dataset.problema);
        if (textarea) textarea.value = problema.label + '.';
        mostrarDiagnosticoSimulado(problema.label, problema.solutionSlug);
      });
    }

    if (btnAnalizar) {
      btnAnalizar.addEventListener('click', () => {
        const texto = textarea ? textarea.value.trim() : '';
        if (!texto) {
          textarea && textarea.focus();
          return;
        }
        const { problemaDetectado, solutionSlug } = D.diagnosticarPorTexto(texto);
        mostrarDiagnosticoSimulado(problemaDetectado, solutionSlug);
      });
    }

    function mostrarDiagnosticoSimulado(problemaLabel, slug) {
      if (!resultado) return;
      const sol = D.soluciones[slug];
      resultado.innerHTML = `
        <p class="cs-diagnostico-resultado__titulo">✅ Hemos identificado tu problema</p>
        <p><strong>Problema:</strong> ${problemaLabel}</p>
        <p>Te recomendamos seguir la solución <strong>"${sol.title}"</strong> — incluye el diagnóstico completo, los pasos a seguir y los productos que necesitas.</p>
        <a class="btn-primary" href="${urlSolucion(slug)}">Ver la solución completa</a>
      `;
      resultado.style.display = 'block';
      resultado.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ── Soluciones destacadas ────────────────────────────────────────────────
  function renderSolucionesDestacadas() {
    const cont = $('#cs-solucionesdestacadas');
    if (!cont) return;
    cont.innerHTML = D.solucionesDestacadas.map((s) => `
      <a class="cs-solucion-card" href="${urlSolucion(s.slug)}">
        <div class="cs-solucion-card__media">${s.emoji}</div>
        <div class="cs-solucion-card__body">
          <div class="cs-solucion-card__title">${s.title}</div>
          <div class="cs-solucion-card__meta">
            ${badgeDificultad(s.difficulty)}
            <span>⏱ ${s.estimatedTime}</span>
          </div>
        </div>
      </a>
    `).join('');
  }

  // ── Explora por áreas (acordeón) ────────────────────────────────────────
  function renderAreas() {
    const cont = $('#cs-areas');
    if (!cont) return;
    cont.innerHTML = D.areas.map((area, i) => `
      <div class="cs-area-block${i === 0 ? ' is-open' : ''}" data-area="${area.id}">
        <button type="button" class="cs-area-block__header">
          <span class="emoji">${area.emoji}</span>
          <span>${area.label}</span>
          <span class="caret">▾</span>
        </button>
        <div class="cs-area-block__content">
          <div class="cs-area-list">
            ${area.ejemplos.map((ej) => (
              ej.solutionSlug
                ? `<a href="${urlSolucion(ej.solutionSlug)}">${ej.title}</a>`
                : `<span class="sin-enlace" title="Próximamente">${ej.title}</span>`
            )).join('')}
          </div>
        </div>
      </div>
    `).join('');

    cont.addEventListener('click', (e) => {
      const header = e.target.closest('.cs-area-block__header');
      if (!header) return;
      header.closest('.cs-area-block').classList.toggle('is-open');
    });
  }

  // ── Asistente de diagnóstico (wizard de 4 pasos) ────────────────────────
  const wizardState = { accion: null, superficie: null, estado: null, resultado: null, pasoActual: 0 };
  const wizardPasos = [
    { key: 'accion',    label: 'Paso 1', pregunta: '¿Qué quieres hacer?',          opciones: () => D.acciones.map((a) => ({ id: a.id, label: a.label, emoji: a.emoji })) },
    { key: 'superficie',label: 'Paso 2', pregunta: '¿Sobre qué superficie?',       opciones: () => D.superficies.map((s) => ({ id: s.id, label: s.label, emoji: s.emoji })) },
    { key: 'estado',    label: 'Paso 3', pregunta: '¿Cómo está actualmente?',      opciones: () => D.estados.map((e) => ({ id: e.id, label: e.label })) },
    { key: 'resultado', label: 'Paso 4', pregunta: '¿Qué resultado quieres?',      opciones: () => D.resultados.map((r) => ({ id: r.id, label: r.label })) },
  ];

  function abrirWizard(opts) {
    const modal = $('#cs-wizard-modal');
    if (!modal) return;
    wizardState.accion = (opts && opts.accionInicial) || null;
    wizardState.superficie = (opts && opts.superficieInicial) || null;
    wizardState.estado = null;
    wizardState.resultado = null;
    wizardState.pasoActual = wizardState.accion ? 1 : 0;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    renderPasoWizard();
  }

  function cerrarWizard() {
    const modal = $('#cs-wizard-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function renderPasoWizard() {
    const paso = wizardPasos[wizardState.pasoActual];
    const cont = $('#cs-wizard-contenido');
    if (!paso) {
      renderResultadoWizard();
      return;
    }

    const progreso = $('#cs-wizard-progress');
    if (progreso) {
      progreso.innerHTML = wizardPasos.map((_, i) => `<span class="${i <= wizardState.pasoActual ? 'is-done' : ''}"></span>`).join('');
    }

    const valorActual = wizardState[paso.key];
    cont.innerHTML = `
      <p class="cs-wizard__step-label">${paso.label} de ${wizardPasos.length}</p>
      <h3 class="cs-wizard__question">${paso.pregunta}</h3>
      <div class="cs-wizard__options">
        ${paso.opciones().map((op) => `
          <button type="button" class="cs-tile cs-tile--blue${valorActual === op.id ? ' is-selected' : ''}" data-opcion="${op.id}">
            ${op.emoji ? `<span class="cs-tile__emoji">${op.emoji}</span>` : ''}
            <span class="cs-tile__label">${op.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="cs-wizard__nav">
        <button type="button" class="cs-wizard__back" id="cs-wizard-atras" ${wizardState.pasoActual === 0 ? 'disabled' : ''}>← Atrás</button>
        <span></span>
      </div>
    `;

    $all('[data-opcion]', cont).forEach((btn) => {
      btn.addEventListener('click', () => {
        wizardState[paso.key] = btn.dataset.opcion;
        wizardState.pasoActual += 1;
        renderPasoWizard();
      });
    });

    const btnAtras = $('#cs-wizard-atras', cont);
    if (btnAtras) {
      btnAtras.addEventListener('click', () => {
        if (wizardState.pasoActual > 0) {
          wizardState.pasoActual -= 1;
          renderPasoWizard();
        }
      });
    }
  }

  function renderResultadoWizard() {
    const slug = D.encontrarSolucionPorDiagnostico(
      wizardState.accion, wizardState.superficie, wizardState.estado, wizardState.resultado
    );
    const sol = D.soluciones[slug];
    const cont = $('#cs-wizard-contenido');

    const progreso = $('#cs-wizard-progress');
    if (progreso) progreso.innerHTML = wizardPasos.map(() => '<span class="is-done"></span>').join('');

    cont.innerHTML = `
      <p class="cs-wizard__step-label">Tu solución</p>
      <h3 class="cs-wizard__question">${sol.title}</h3>
      <p style="margin-bottom:22px;color:var(--text-gray);line-height:1.6;">${sol.description}</p>
      <div class="cs-info-resumen" style="margin-bottom:26px;border-top:none;padding-top:0;">
        <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Dificultad</div><div class="cs-info-resumen__valor">${sol.difficulty}</div></div>
        <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Tiempo</div><div class="cs-info-resumen__valor">${sol.estimatedTime}</div></div>
        <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Resultado</div><div class="cs-info-resumen__valor">${sol.result}</div></div>
      </div>
      <div class="cs-wizard__nav">
        <button type="button" class="cs-wizard__back" id="cs-wizard-atras">← Volver a cambiar respuestas</button>
        <a class="btn-primary" href="${urlSolucion(slug)}">Ver la solución completa</a>
      </div>
    `;
    const btnAtras = $('#cs-wizard-atras', cont);
    if (btnAtras) {
      btnAtras.addEventListener('click', () => {
        wizardState.pasoActual = wizardPasos.length - 1;
        renderPasoWizard();
      });
    }
  }

  function wireWizardOpenClose() {
    $all('[data-open-wizard]').forEach((btn) => {
      btn.addEventListener('click', () => abrirWizard({}));
    });
    const cerrar = $('#cs-wizard-cerrar');
    if (cerrar) cerrar.addEventListener('click', cerrarWizard);
    const overlay = $('#cs-wizard-modal');
    if (overlay) {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrarWizard(); });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarWizard();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderGridAcciones();
    renderGridSuperficies();
    renderProblemas();
    renderSolucionesDestacadas();
    renderAreas();
    wireWizardOpenClose();
  });
})();
