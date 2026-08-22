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
        mostrarDiagnosticoSimulado(problema.label, problema.solutionSlug, problema.label);
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
        mostrarDiagnosticoSimulado(problemaDetectado, solutionSlug, texto);
      });
    }

    function mostrarDiagnosticoSimulado(problemaLabel, slug, textoOriginal) {
      if (!resultado) return;

      if (slug && D.soluciones[slug]) {
        // Tenemos una guía completa preparada para esto — el caso ideal.
        const sol = D.soluciones[slug];
        resultado.innerHTML = `
          <p class="cs-diagnostico-resultado__titulo">✅ Hemos identificado tu problema</p>
          <p><strong>Problema:</strong> ${problemaLabel}</p>
          <p>Te recomendamos seguir la solución <strong>"${sol.title}"</strong> — incluye el diagnóstico completo, los pasos a seguir y los productos que necesitas.</p>
          <a class="btn-primary" href="${urlSolucion(slug)}">Ver la solución completa</a>
        `;
        resultado.style.display = 'block';
        resultado.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Sin guía preparada todavía: en vez de dejar a la persona sin nada,
      // buscamos de verdad en el catálogo real (mismos ~12.858 productos
      // que usa el buscador) y proponemos los que más coincidan.
      resultado.innerHTML = `
        <p class="cs-diagnostico-resultado__titulo">🔍 Buscando en nuestro catálogo…</p>
        <p>Todavía no tenemos una guía completa para este caso concreto, pero estamos mirando qué productos de nuestro catálogo podrían ayudarte.</p>
      `;
      resultado.style.display = 'block';
      resultado.scrollIntoView({ behavior: 'smooth', block: 'center' });

      D.buscarProductosEnCatalogo(textoOriginal).then((productos) => {
        const urlBuscador = `buscador.html?q=${encodeURIComponent(textoOriginal)}`;
        if (!productos.length) {
          resultado.innerHTML = `
            <p class="cs-diagnostico-resultado__titulo">🔍 Sin guía específica todavía</p>
            <p>No hemos encontrado una guía ni productos que encajen claramente con "<strong>${textoOriginal}</strong>". Prueba a describirlo de otra forma, o explora el buscador completo.</p>
            <a class="btn-primary" href="${urlBuscador}">Ir al buscador de productos</a>
          `;
          return;
        }
        resultado.innerHTML = `
          <p class="cs-diagnostico-resultado__titulo">🔍 No tenemos una guía completa, pero sí productos que pueden ayudarte</p>
          <p>Hemos buscado "<strong>${textoOriginal}</strong>" directamente en nuestro catálogo:</p>
          <div class="cs-productos-grid" style="margin-top:16px;">
            ${productos.map((p) => renderTarjetaProductoCatalogo(p)).join('')}
          </div>
          <a class="btn-primary" href="${urlBuscador}" style="margin-top:18px;">Ver todos los resultados en el buscador</a>
        `;
      });
    }
  }

  // ── Búsqueda real de respaldo en el catálogo (cuando no hay guía) ──────
  // La lógica de fetch/ranking vive centralizada en soluciones-data.js
  // (D.cargarCatalogoReal / D.buscarProductosEnCatalogo), compartida con
  // la resolución de productos reales en las páginas de detalle — aquí
  // solo queda el renderizado, específico de esta página.
  const NOMBRES_AREA = { drogueria: 'Droguería', perfumeria: 'Perfumería', pinturas: 'Pinturas', talleres: 'Talleres' };

  function renderTarjetaProductoCatalogo(p) {
    const precio = p.mostrar_precio && p.precio_con ? `${p.precio_con} €` : 'Consultar precio';
    const areaLabel = NOMBRES_AREA[p.area] || p.area || '';
    return `
      <a class="cs-producto-card" href="buscador.html?ref=${encodeURIComponent(p.ref)}">
        <div class="cs-producto-card__imagen-wrap">
          ${p.img
            ? `<img class="cs-producto-card__imagen" src="https://drive.google.com/thumbnail?id=${p.img}&sz=w300" alt="${p.nombre}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;cs-producto-card__imagen-fallback&quot;>📦</span>'">`
            : `<span class="cs-producto-card__imagen-fallback">📦</span>`}
        </div>
        <span class="cs-producto-card__categoria">${areaLabel}${p.familia ? ' · ' + p.familia : ''}</span>
        <div class="cs-producto-card__nombre">${p.nombre}</div>
        <div class="cs-producto-card__ref">Ref: ${p.ref}</div>
        <div class="cs-producto-card__precio">${precio}</div>
      </a>
    `;
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
  function resaltarCoincidencia(texto, consulta) {
    if (!consulta) return texto;
    const textoNorm = D.normalizarTexto(texto);
    const idx = textoNorm.indexOf(consulta);
    if (idx === -1) return texto;
    return texto.slice(0, idx) + '<mark>' + texto.slice(idx, idx + consulta.length) + '</mark>' + texto.slice(idx + consulta.length);
  }

  function renderAreas(filtro) {
    const cont = $('#cs-areas');
    const sinResultados = $('#cs-areas-sin-resultados');
    if (!cont) return;

    const consulta = D.normalizarTexto(filtro || '').trim();
    const hayFiltro = consulta.length > 0;

    // Con filtro activo: cada área solo muestra los ejemplos que
    // coinciden (por título o por el nombre del área), y las áreas sin
    // ninguna coincidencia se ocultan del todo. Sin filtro, se muestran
    // todas tal cual, con la primera abierta como siempre.
    const areasFiltradas = D.areas.map((area) => {
      if (!hayFiltro) return { area, ejemplos: area.ejemplos, coincideArea: false };
      const coincideArea = D.normalizarTexto(area.label).includes(consulta);
      const ejemplos = coincideArea
        ? area.ejemplos
        : area.ejemplos.filter((ej) => D.normalizarTexto(ej.title).includes(consulta));
      return { area, ejemplos, coincideArea };
    }).filter(({ ejemplos }) => !hayFiltro || ejemplos.length > 0);

    if (hayFiltro && areasFiltradas.length === 0) {
      cont.innerHTML = '';
      if (sinResultados) sinResultados.style.display = 'block';
      return;
    }
    if (sinResultados) sinResultados.style.display = 'none';

    cont.innerHTML = areasFiltradas.map(({ area, ejemplos }, i) => `
      <div class="cs-area-block${(hayFiltro || i === 0) ? ' is-open' : ''}" data-area="${area.id}">
        <button type="button" class="cs-area-block__header">
          <span class="emoji">${area.emoji}</span>
          <span>${resaltarCoincidencia(area.label, consulta)}</span>
          <span class="caret">▾</span>
        </button>
        <div class="cs-area-block__content">
          <div class="cs-area-list">
            ${ejemplos.map((ej) => (
              ej.solutionSlug
                ? `<a href="${urlSolucion(ej.solutionSlug)}">${resaltarCoincidencia(ej.title, consulta)}</a>`
                : `<span class="sin-enlace" title="Próximamente">${resaltarCoincidencia(ej.title, consulta)}</span>`
            )).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Delegación de clic para el acordeón — registrada UNA sola vez (no en
  // cada renderAreas(), que se llama en cada tecleo del buscador), ya que
  // consulta el DOM en el momento del clic con closest().
  function wireAreasAcordeon() {
    const cont = $('#cs-areas');
    if (!cont) return;
    cont.addEventListener('click', (e) => {
      const header = e.target.closest('.cs-area-block__header');
      if (!header) return;
      header.closest('.cs-area-block').classList.toggle('is-open');
    });
  }

  function wireAreasBuscador() {
    const input = $('#cs-areas-buscar');
    const btnLimpiar = $('#cs-areas-buscar-limpiar');
    if (!input) return;

    input.addEventListener('input', () => {
      btnLimpiar.style.display = input.value ? 'block' : 'none';
      renderAreas(input.value);
    });
    btnLimpiar.addEventListener('click', () => {
      input.value = '';
      btnLimpiar.style.display = 'none';
      renderAreas('');
      input.focus();
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
    const cont = $('#cs-wizard-contenido');

    const progreso = $('#cs-wizard-progress');
    if (progreso) progreso.innerHTML = wizardPasos.map(() => '<span class="is-done"></span>').join('');

    if (!slug || !D.soluciones[slug]) {
      // Combinación sin una guía específica todavía (p. ej. superficie
      // "Otro") — mejor decirlo con honestidad que forzar una
      // recomendación que podría no tener nada que ver con lo que
      // busca la persona. Igual que en "tengo un problema", se intenta
      // además una búsqueda real en el catálogo con lo que sí sabemos
      // (la acción y la superficie elegidas).
      const accionLabel = (D.acciones.find((a) => a.id === wizardState.accion) || {}).label || '';
      const superficieLabel = (D.superficies.find((s) => s.id === wizardState.superficie) || {}).label || '';
      const textoAproximado = [accionLabel, superficieLabel].filter(Boolean).join(' ');

      cont.innerHTML = `
        <p class="cs-wizard__step-label">Sin guía específica todavía</p>
        <h3 class="cs-wizard__question">Aún no tenemos una guía exacta para este caso</h3>
        <p style="margin-bottom:22px;color:var(--text-gray);line-height:1.6;" id="cs-wizard-sinmatch-texto">
          Buscando en nuestro catálogo qué podría ayudarte con "${textoAproximado}"…
        </p>
        <div id="cs-wizard-sinmatch-productos"></div>
        <div class="cs-wizard__nav">
          <button type="button" class="cs-wizard__back" id="cs-wizard-atras">← Volver a cambiar respuestas</button>
          <a class="btn-primary" href="#cs-problema" id="cs-wizard-ir-problema">Contarnos el problema</a>
        </div>
      `;

      if (textoAproximado) {
        D.buscarProductosEnCatalogo(textoAproximado).then((productos) => {
          const textoEl = $('#cs-wizard-sinmatch-texto', cont);
          const contProductos = $('#cs-wizard-sinmatch-productos', cont);
          if (!textoEl || !contProductos) return; // el usuario ya navegó a otro paso
          if (!productos.length) {
            textoEl.textContent = 'No pasa nada — puedes explorar todas las soluciones por área, o contarnos directamente qué problema tienes con tus propias palabras.';
            return;
          }
          textoEl.innerHTML = `No tenemos una guía completa para "${textoAproximado}", pero sí productos de nuestro catálogo que podrían servirte:`;
          contProductos.innerHTML = `
            <div class="cs-productos-grid" style="margin-bottom:20px;">
              ${productos.slice(0, 4).map((p) => renderTarjetaProductoCatalogo(p)).join('')}
            </div>
          `;
        });
      }

      const btnProblema = $('#cs-wizard-ir-problema', cont);
      if (btnProblema) {
        btnProblema.addEventListener('click', () => {
          cerrarWizard();
        });
      }
    } else {
      const sol = D.soluciones[slug];
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
    }

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

  // ── Scroll a anclas internas (#cs-problema, etc.) compensando el header
  //    fijo (.site-header es position:sticky) ─────────────────────────────
  // Sin esto, el destino del enlace queda tapado justo debajo del menú al
  // saltar directamente con el comportamiento por defecto del navegador —
  // puede dar la sensación de que "no ha pasado nada" o de haber ido a
  // otro sitio.
  function wireScrollAnclas() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const destino = document.getElementById(id);
      if (!destino) return;
      e.preventDefault();
      const header = document.querySelector('.site-header');
      const alturaHeader = header ? header.offsetHeight : 0;
      const top = destino.getBoundingClientRect().top + window.scrollY - alturaHeader - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  // ── Botón "volver arriba" ────────────────────────────────────────────────
  function wireBotonSubir() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'cs-btn-subir';
    btn.className = 'cs-btn-subir';
    btn.setAttribute('aria-label', 'Volver arriba');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > 500);
    });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderGridAcciones();
    renderGridSuperficies();
    renderProblemas();
    renderSolucionesDestacadas();
    renderAreas();
    wireAreasAcordeon();
    wireAreasBuscador();
    wireWizardOpenClose();
    wireScrollAnclas();
    wireBotonSubir();
  });
})();
