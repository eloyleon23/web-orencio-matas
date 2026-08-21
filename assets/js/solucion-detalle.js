(function () {
  const D = window.SOLUCIONES_DATA;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);

  function badgeDificultad(dificultad) {
    const clase = dificultad === 'Fácil' ? 'facil' : dificultad === 'Difícil' ? 'dificil' : 'media';
    return `<span class="cs-badge-dificultad cs-badge-dificultad--${clase}">${dificultad}</span>`;
  }

  function urlSolucion(slug) {
    return `solucion.html?slug=${encodeURIComponent(slug)}`;
  }

  function mostrarToast(mensaje) {
    let toast = $('#cs-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cs-toast';
      toast.className = 'cs-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = mensaje;
    toast.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function parsePrecio(precioStr) {
    return parseFloat((precioStr || '0').replace('€', '').replace(',', '.').trim()) || 0;
  }

  function render() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || 'pintar-plastico-coche';
    const sol = D.soluciones[slug];
    const cont = $('#solucion-contenido');

    if (!sol) {
      cont.innerHTML = `
        <div class="container" style="padding:80px 0;text-align:center;">
          <h1 style="font-family:var(--font-heading);margin-bottom:14px;">Solución no encontrada</h1>
          <p style="color:var(--text-gray);margin-bottom:24px;">Puede que el enlace esté mal escrito o la solución aún no exista en este prototipo.</p>
          <a class="btn-primary" href="../centro-soluciones.html">Volver al Centro de Soluciones</a>
        </div>`;
      return;
    }

    document.title = (sol.seo && sol.seo.title) || (sol.title + ' | Orencio Matas y Hnos, S.L.');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', (sol.seo && sol.seo.description) || sol.description);

    const relacionadas = (sol.relatedSolutions || []).map((s) => D.soluciones[s]).filter(Boolean);

    cont.innerHTML = `
      <!-- Breadcrumb -->
      <div class="container cs-breadcrumb">
        <a href="../centro-soluciones.html">Centro de Soluciones</a>
        ${sol.breadcrumb.slice(1).map((b, i, arr) => i === arr.length - 1
          ? ` › <span class="current">${b}</span>`
          : ` › ${b}`).join('')}
      </div>

      <!-- Cabecera -->
      <section class="cs-section" style="padding-top:10px;">
        <div class="container">
          <h1 style="font-family:var(--font-heading);font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;color:var(--text-dark);max-width:760px;margin-bottom:16px;">${sol.title}</h1>
          <p style="max-width:680px;color:var(--text-gray);font-size:1.05rem;line-height:1.6;">${sol.description}</p>
          <div class="cs-info-resumen">
            <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Dificultad</div><div class="cs-info-resumen__valor">${badgeDificultad(sol.difficulty)}</div></div>
            <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Tiempo estimado</div><div class="cs-info-resumen__valor">${sol.estimatedTime}</div></div>
            <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Superficie</div><div class="cs-info-resumen__valor">${sol.subcategory}</div></div>
            <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Resultado</div><div class="cs-info-resumen__valor">${sol.result}</div></div>
          </div>
          ${sol.colorChart ? `
          <a class="btn-secondary" href="${sol.colorChart.url}" target="_blank" rel="noopener" style="margin-top:22px;display:inline-flex;gap:8px;">
            🎨 ${sol.colorChart.label}
          </a>` : ''}
        </div>
      </section>

      <!-- Materiales necesarios -->
      <section class="cs-section cs-section--alt">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Qué necesitas</p>
            <h2>Materiales necesarios</h2>
          </div>
          <div class="cs-materiales">
            ${agruparPorFase(sol.materials).map(([fase, items]) => `
              <div class="cs-materiales__fase">
                <h4>${fase}</h4>
                <ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Receta de trabajo -->
      <section class="cs-section">
        <div class="container">
          <div class="section-heading section-heading--center">
            <p class="section-heading__eyebrow">De un vistazo</p>
            <h2>Receta de trabajo</h2>
          </div>
          <div class="cs-receta">
            ${sol.receta.map((r, i) => `
              ${i > 0 ? '<span class="cs-receta__flecha">→</span>' : ''}
              <div class="cs-receta__paso">
                <span class="emoji">${r.emoji}</span>
                <span class="label">${r.fase}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Paso a paso -->
      <section class="cs-section cs-section--alt">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Cómo hacerlo</p>
            <h2>Paso a paso</h2>
          </div>
          <div class="cs-timeline">
            ${sol.steps.map((s) => `
              <div class="cs-timeline__paso">
                <div class="cs-timeline__num">${s.n}</div>
                <div class="cs-timeline__titulo">Paso ${s.n} — ${s.title}</div>
                <p class="cs-timeline__texto">${s.text}</p>
                ${s.productos && s.productos.length ? `
                  <div class="cs-timeline__productos">
                    ${s.productos.map((p) => `<span class="cs-timeline__producto-chip">${p}</span>`).join('')}
                  </div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Consejo profesional + errores frecuentes -->
      <section class="cs-section">
        <div class="container" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          <div class="cs-tip">
            <span class="cs-tip__emoji">💡</span>
            <div>
              <p style="font-family:var(--font-heading);font-weight:900;margin-bottom:8px;color:var(--text-dark);">Consejo profesional</p>
              ${sol.professionalTips.map((t) => `<p>${t}</p>`).join('')}
            </div>
          </div>
          <div class="cs-mistakes">
            <p style="font-family:var(--font-heading);font-weight:900;margin-bottom:10px;color:var(--text-dark);">⚠️ Errores que debes evitar</p>
            <ul>${sol.commonMistakes.map((m) => `<li>${m}</li>`).join('')}</ul>
          </div>
        </div>
      </section>

      <!-- Productos recomendados -->
      <section class="cs-section cs-section--alt">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Ya sabes qué hacer</p>
            <h2>Productos que necesitas</h2>
          </div>
          <div class="cs-productos-grid" id="cs-productos-recomendados"></div>
          <div class="cs-add-all-bar">
            <p>Total ${sol.recommendedProducts.length} productos · <span class="precio-total">${sumaPrecios(sol.recommendedProducts)} €</span></p>
            <button type="button" class="btn-primary" id="cs-anadir-todos">Añadir todos los productos</button>
          </div>
        </div>
      </section>

      <!-- Alternativas -->
      <section class="cs-section">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Según tu caso</p>
            <h2>También puedes utilizar</h2>
          </div>
          <div class="cs-alternativas">
            ${sol.alternativeProducts.map((a) => `
              <div class="cs-alternativa-card">
                <span class="cs-alternativa-card__etiqueta">${a.etiqueta}</span>
                <div class="cs-alternativa-card__nombre">${a.nombre}</div>
                <div class="cs-alternativa-card__precio">${a.precio}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      ${relacionadas.length ? `
      <!-- Soluciones relacionadas -->
      <section class="cs-section cs-section--alt">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Sigue explorando</p>
            <h2>Soluciones relacionadas</h2>
          </div>
          <div class="cs-relacionadas-grid">
            ${relacionadas.map((r) => `
              <a class="cs-solucion-card" href="${urlSolucion(r.slug)}">
                <div class="cs-solucion-card__media">🛠️</div>
                <div class="cs-solucion-card__body">
                  <div class="cs-solucion-card__title">${r.title}</div>
                  <div class="cs-solucion-card__meta">${badgeDificultad(r.difficulty)}<span>⏱ ${r.estimatedTime}</span></div>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      </section>` : ''}

      <section class="cs-section" style="text-align:center;">
        <div class="container">
          <a class="btn-secondary" href="../centro-soluciones.html">← Volver al Centro de Soluciones</a>
        </div>
      </section>
    `;

    renderProductosRecomendados(sol);
  }

  function agruparPorFase(materials) {
    const mapa = {};
    materials.forEach((m) => {
      if (!mapa[m.fase]) mapa[m.fase] = [];
      mapa[m.fase].push(...m.items);
    });
    return Object.entries(mapa);
  }

  function sumaPrecios(productos) {
    return productos.reduce((acc, p) => acc + parsePrecio(p.precio), 0).toFixed(2).replace('.', ',');
  }

  function renderProductosRecomendados(sol) {
    const cont = $('#cs-productos-recomendados');
    cont.innerHTML = sol.recommendedProducts.map((p, i) => `
      <div class="cs-producto-card" data-idx="${i}">
        <span class="cs-producto-card__categoria">${p.categoria}</span>
        <div class="cs-producto-card__nombre">${p.nombre}</div>
        ${p.formato ? `<div class="cs-producto-card__formato">Formato: ${p.formato}</div>` : ''}
        <div class="cs-producto-card__precio">${p.precio}</div>
        <button type="button" class="btn-secondary cs-btn-anadir">Ver producto</button>
      </div>
    `).join('');

    cont.querySelectorAll('.cs-btn-anadir').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        mostrarToast(`✓ ${sol.recommendedProducts[i].nombre} — visto en el buscador (demo)`);
      });
    });

    const btnTodos = $('#cs-anadir-todos');
    if (btnTodos) {
      btnTodos.addEventListener('click', () => {
        mostrarToast(`✓ ${sol.recommendedProducts.length} productos añadidos al carrito (demo)`);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', render);
})();
