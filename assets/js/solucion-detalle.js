(function () {
  const D = window.SOLUCIONES_DATA;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);

  // Fallback del logo de una carta de colores si la imagen no carga —
  // como función global en vez de JS inline dentro del atributo onerror:
  // el HTML inline necesitaba comillas simples anidadas dentro de otras
  // comillas simples (el propio insertAdjacentHTML('...', '<span
  // class=\'...\'>...')) que el navegador cortaba de forma prematura,
  // rompiendo el atributo entero con un error real de "missing ) after
  // argument list" — bug real encontrado al añadir una segunda carta de
  // colores a una misma solución (ver colorCharts más abajo), pero que
  // ya afectaba también a la carta única de las demás soluciones.
  window.cargarFallbackColorChart = function (img) {
    img.onerror = null;
    img.style.display = 'none';
    const contenedor = img.parentElement;
    const previo = contenedor.querySelector('.cs-colorchart-fallback');
    if (previo) previo.remove();
    const span = document.createElement('span');
    span.className = 'cs-colorchart-fallback';
    span.textContent = '🎨';
    contenedor.insertBefore(span, contenedor.firstChild);
  };

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
      <!-- Cabecera del informe (solo visible al imprimir) -->
      <div class="cs-pdf-header">
        <img src="../assets/logos/logo-orencio.png" alt="Orencio Matas" class="cs-pdf-header__logo" onerror="this.style.display='none'">
        <div class="cs-pdf-header__title">Centro de Soluciones</div>
      </div>

      <!-- Breadcrumb -->
      <div class="container cs-breadcrumb no-imprimir">
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
          <a class="cs-colorchart-link" href="${sol.colorChart.url}" target="_blank" rel="noopener">
            ${sol.colorChart.logo ? `<img class="cs-colorchart-link__logo" src="${sol.colorChart.logo}" alt="${sol.colorChart.label}" loading="lazy" onerror="cargarFallbackColorChart(this)">` : '🎨'}
            <span>${sol.colorChart.label}</span>
          </a>` : ''}
          ${sol.colorCharts && sol.colorCharts.length ? `
          <div style="display:flex;flex-wrap:wrap;gap:10px;${sol.colorChart ? 'margin-top:10px;' : ''}">
            ${sol.colorCharts.map((cc) => `
            <a class="cs-colorchart-link" href="${cc.url}" target="_blank" rel="noopener">
              ${cc.logo ? `<img class="cs-colorchart-link__logo" src="${cc.logo}" alt="${cc.label}" loading="lazy" onerror="cargarFallbackColorChart(this)">` : '🎨'}
              <span>${cc.label}</span>
            </a>`).join('')}
          </div>` : ''}
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

      ${sol.calculadoraCantidad ? `
      <!-- Calculadora de cantidad -->
      <section class="cs-section no-imprimir">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Antes de comprar</p>
            <h2>¿Cuánta cantidad necesitas?</h2>
          </div>
          <div class="cs-calculadora">
            <div class="cs-calculadora__campos">
              <div class="cs-calculadora__campo">
                <label for="cs-calc-superficie">Superficie a tratar (m²)</label>
                <input type="number" id="cs-calc-superficie" min="0" step="0.5" placeholder="Ej: 8">
              </div>
              <div class="cs-calculadora__campo">
                <label for="cs-calc-manos">Nº de manos</label>
                <input type="number" id="cs-calc-manos" min="1" step="1" value="2">
              </div>
            </div>
            <p id="cs-calc-resultado" class="cs-calculadora__resultado"></p>
            <p class="cs-calculadora__nota">Rendimiento orientativo (${sol.calculadoraCantidad.rendimiento} m²/L para ${sol.calculadoraCantidad.etiqueta}) — puede variar según la superficie y la forma de aplicación. Consulta la ficha técnica del producto para el dato exacto.</p>
          </div>
        </div>
      </section>` : ''}

      ${sol.calculadoraTemple ? `
      <!-- Calculadora de pasta al temple: Kg necesarios + agua de dilución -->
      <section class="cs-section no-imprimir">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Antes de comprar</p>
            <h2>¿Cuánta pasta al temple necesitas?</h2>
          </div>
          <div class="cs-calculadora">
            <div class="cs-calculadora__campos">
              <div class="cs-calculadora__campo">
                <label for="cs-calc-temple-tipo">Acabado</label>
                <select id="cs-calc-temple-tipo">
                  ${sol.calculadoraTemple.opciones.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}
                </select>
              </div>
              <div class="cs-calculadora__campo">
                <label for="cs-calc-temple-superficie">Superficie a pintar (m²)</label>
                <input type="number" id="cs-calc-temple-superficie" min="0" step="0.5" placeholder="Ej: 20">
              </div>
            </div>
            <p id="cs-calc-temple-resultado" class="cs-calculadora__resultado"></p>
            <p class="cs-calculadora__nota">Rendimiento y dilución según el modo de empleo del propio fabricante — pueden variar ligeramente según el estado y la absorción de la superficie.</p>
          </div>
        </div>
      </section>` : ''}

      ${sol.calculadoraCloro ? `
      <!-- Calculadora de dosis de hipoclorito de sodio (choque/mantenimiento de piscina) -->
      <section class="cs-section no-imprimir">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Antes de aplicar</p>
            <h2>Calcula la dosis de hipoclorito</h2>
          </div>
          <div class="cs-calculadora cs-calculadora-cloro">
            <div class="cs-calc-cloro-modo">
              <button type="button" class="cs-calc-cloro-modo-btn is-active" data-modo="m3">Conozco los m³ de mi piscina</button>
              <button type="button" class="cs-calc-cloro-modo-btn" data-modo="medidas">Calcular a partir de las medidas</button>
            </div>

            <div class="cs-calculadora__campos" id="cs-calc-cloro-campos-m3">
              <div class="cs-calculadora__campo">
                <label for="cs-calc-cloro-m3">Volumen de la piscina (m³)</label>
                <input type="number" id="cs-calc-cloro-m3" min="0" step="0.5" placeholder="Ej: 50">
              </div>
            </div>

            <div class="cs-calculadora__campos cs-calc-cloro-campos-medidas" id="cs-calc-cloro-campos-medidas" style="display:none;">
              <div class="cs-calculadora__campo">
                <label for="cs-calc-cloro-ancho">Ancho (m)</label>
                <input type="number" id="cs-calc-cloro-ancho" min="0" step="0.1" placeholder="Ej: 5">
              </div>
              <div class="cs-calculadora__campo">
                <label for="cs-calc-cloro-largo">Largo (m)</label>
                <input type="number" id="cs-calc-cloro-largo" min="0" step="0.1" placeholder="Ej: 10">
              </div>
              <div class="cs-calculadora__campo">
                <label for="cs-calc-cloro-hondo">Profundidad media (m)</label>
                <input type="number" id="cs-calc-cloro-hondo" min="0" step="0.1" placeholder="Ej: 1,5">
              </div>
            </div>

            <div class="cs-calculadora__campos">
              <div class="cs-calculadora__campo">
                <label for="cs-calc-cloro-concentracion">Concentración del hipoclorito</label>
                <select id="cs-calc-cloro-concentracion">
                  <option value="5">5%</option>
                  <option value="10" selected>10%</option>
                  <option value="12">12%</option>
                  <option value="12.5">12,5%</option>
                  <option value="13">13%</option>
                  <option value="15">15%</option>
                </select>
              </div>
              <div class="cs-calculadora__campo">
                <label for="cs-calc-cloro-objetivo">Qué quieres hacer</label>
                <select id="cs-calc-cloro-objetivo">
                  <option value="2">Mantenimiento — subir ~2 ppm</option>
                  <option value="10" selected>Cloración de choque — subir ~10 ppm</option>
                  <option value="personalizado">Otra subida de cloro (indícala)</option>
                </select>
              </div>
            </div>

            <div class="cs-calculadora__campos" id="cs-calc-cloro-ppm-personalizado-wrap" style="display:none;">
              <div class="cs-calculadora__campo">
                <label for="cs-calc-cloro-ppm-personalizado">Subida de cloro libre deseada (ppm)</label>
                <input type="number" id="cs-calc-cloro-ppm-personalizado" min="0" step="0.5" placeholder="Ej: 5">
              </div>
            </div>

            <p id="cs-calc-cloro-resultado" class="cs-calculadora__resultado"></p>
            <p class="cs-calculadora__nota">Dosis orientativa según tablas de referencia para hipoclorito de sodio líquido — el cloro libre real también depende del estabilizante, la temperatura del agua y la exposición al sol. Mide siempre con tiras analíticas antes y después, y no te bañes hasta que el cloro libre vuelva a un nivel seguro (por debajo de 3 ppm).</p>
          </div>
        </div>
      </section>` : ''}

      ${sol.selectorSuperficie ? `
      <!-- Selector: recomienda el producto real más adecuado según la superficie elegida -->
      <section class="cs-section no-imprimir">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Elige tu caso</p>
            <h2>${sol.selectorSuperficie.pregunta}</h2>
          </div>
          <div class="cs-calculadora cs-selector-superficie">
            <div class="cs-calculadora__campos">
              <div class="cs-calculadora__campo">
                <label for="cs-selector-superficie">Superficie</label>
                <select id="cs-selector-superficie">
                  <option value="">Selecciona una opción...</option>
                  ${sol.selectorSuperficie.opciones.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <p id="cs-selector-motivo" class="cs-calculadora__nota" style="display:none;"></p>
            <div id="cs-selector-resultado" class="cs-productos-grid cs-selector-resultado"></div>
          </div>
        </div>
      </section>` : ''}

      ${sol.calculadoraCantidadMultiple ? `
      <!-- Calculadora combinada: elegir producto + calcular litros según m² y manos -->
      <section class="cs-section no-imprimir">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Calculadora</p>
            <h2>${sol.calculadoraCantidadMultiple.pregunta}</h2>
          </div>
          <div class="cs-calculadora cs-calculadora-multiple">
            <div class="cs-calculadora__campos">
              <div class="cs-calculadora__campo">
                <label for="cs-calc-multi-tipo">Qué vas a aplicar</label>
                <select id="cs-calc-multi-tipo">
                  ${sol.calculadoraCantidadMultiple.opciones.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="cs-calculadora__campos">
              <div class="cs-calculadora__campo">
                <label for="cs-calc-multi-superficie">Superficie a cubrir (m²)</label>
                <input type="number" id="cs-calc-multi-superficie" min="0" step="0.5" placeholder="Ej: 30">
              </div>
              <div class="cs-calculadora__campo">
                <label for="cs-calc-multi-manos">Número de manos</label>
                <input type="number" id="cs-calc-multi-manos" min="1" step="1" value="2">
              </div>
            </div>
            <p id="cs-calc-multi-resultado" class="cs-calculadora__resultado"></p>
            <p id="cs-calc-multi-enlace" class="cs-calculadora__nota"></p>
            <p class="cs-calculadora__nota">Rendimiento orientativo del fabricante en condiciones normales — puede variar según la superficie y la forma de aplicación.</p>
          </div>
        </div>
      </section>` : ''}
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
        <div class="container cs-tip-mistakes-grid">
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
          <div class="cs-exportar-bar">
            <p id="cs-total-productos">Total ${sol.recommendedProducts.length} productos* · <span class="precio-total">${sumaPrecios(sol.recommendedProducts)} €*</span></p>
            <p class="cs-total-disclaimer">* Precios y productos indicativos y orientativos. La cantidad, el formato y el precio final pueden variar; consulte con nuestro profesional en tienda.</p>
            <div class="cs-exportar-bar__acciones no-imprimir">
              <button type="button" class="btn-primary" id="cs-exportar-pdf">📄 Descargar como PDF</button>
              <button type="button" class="btn-secondary" id="cs-compartir-solucion"><i class="fa-solid fa-share-nodes"></i> Compartir solución</button>
              <button type="button" class="btn-secondary" id="cs-exportar-whatsapp">💬 Enviar por WhatsApp</button>
            </div>
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
          <div class="cs-alternativas" id="cs-productos-alternativos">
            ${sol.alternativeProducts.map((a) => `
              <div class="cs-alternativa-card cs-alternativa-card--cargando">
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

      <section class="cs-section no-imprimir" style="text-align:center;">
        <div class="container">
          <a class="btn-secondary" href="../centro-soluciones.html">← Volver al Centro de Soluciones</a>
        </div>
      </section>

      <!-- Pie del informe (solo visible al imprimir) -->
      <div class="cs-pdf-footer">
        <div class="cs-pdf-footer__line">
          <strong>Orencio Matas y Hermanos, S.L.</strong>
        </div>
        <div class="cs-pdf-footer__line">
          Calle Alfred Nobel, 2 - 13005 Ciudad Real
        </div>
        <div class="cs-pdf-footer__line cs-pdf-footer__horario">
          Lunes a Viernes: 9:00 - 14:00 y 16:30 - 19:30 · Sábados: 9:00 - 14:00 · Domingos: Cerrado
        </div>
      </div>
    `;

    renderProductosRecomendados(sol);
    renderProductosAlternativos(sol);
    wireCalculadoraCantidad(sol);
    wireCalculadoraTemple(sol);
    wireCalculadoraCloro(sol);
    wireSelectorSuperficie(sol);
    wireCalculadoraCantidadMultiple(sol);
  }

  function wireCalculadoraCantidad(sol) {
    if (!sol.calculadoraCantidad) return;
    const inputSuperficie = $('#cs-calc-superficie');
    const inputManos = $('#cs-calc-manos');
    const resultado = $('#cs-calc-resultado');
    if (!inputSuperficie || !inputManos || !resultado) return;

    const { rendimiento, etiqueta } = sol.calculadoraCantidad;
    const calcular = () => {
      const superficie = parseFloat(inputSuperficie.value);
      const manos = parseFloat(inputManos.value) || 2;
      if (!superficie || superficie <= 0) { resultado.innerHTML = ''; return; }
      const litros = (superficie * manos) / rendimiento;
      resultado.innerHTML = `Necesitarás aproximadamente <strong>${litros.toFixed(1).replace('.', ',')} L</strong> ` +
        `(${superficie} m² × ${manos} manos ÷ ${rendimiento} m²/L orientativos para ${etiqueta}).`;
    };
    inputSuperficie.addEventListener('input', calcular);
    inputManos.addEventListener('input', calcular);
  }

  // Calculadora de pasta al temple — a diferencia del resto de
  // calculadoras (que solo dan litros de pintura), aquí hacen falta
  // DOS datos: Kg de pasta a comprar Y cuánta agua de dilución añadir,
  // porque son productos en polvo/pasta que se preparan antes de
  // aplicar. El acabado LISO tiene una proporción de agua fija (600-700
  // ml/Kg, según el modo de empleo del fabricante); GOTELÉ y PICADO no
  // tienen una proporción fija — el propio fabricante indica "según la
  // densidad deseada" — así que para esos dos solo se calculan los Kg
  // y se explica que el agua se ajusta a ojo, en vez de inventar una
  // cifra que el fabricante no da.
  function wireCalculadoraTemple(sol) {
    if (!sol.calculadoraTemple) return;
    const selectTipo = $('#cs-calc-temple-tipo');
    const inputSuperficie = $('#cs-calc-temple-superficie');
    const resultado = $('#cs-calc-temple-resultado');
    if (!selectTipo || !inputSuperficie || !resultado) return;

    const calcular = () => {
      const opcion = sol.calculadoraTemple.opciones.find((o) => o.id === selectTipo.value);
      const superficie = parseFloat(inputSuperficie.value);
      if (!opcion || !superficie || superficie <= 0) { resultado.innerHTML = ''; return; }

      if (opcion.rendimientoMin && opcion.rendimientoMax) {
        // Acabado liso: rango de rendimiento Y rango de dilución fijos.
        const kgMin = superficie / opcion.rendimientoMax;
        const kgMax = superficie / opcion.rendimientoMin;
        const kgMedio = (kgMin + kgMax) / 2;
        const aguaMinL = (kgMedio * opcion.aguaMinMlKg) / 1000;
        const aguaMaxL = (kgMedio * opcion.aguaMaxMlKg) / 1000;
        resultado.innerHTML = `Necesitarás aproximadamente <strong>${kgMin.toFixed(1).replace('.', ',')}-${kgMax.toFixed(1).replace('.', ',')} Kg</strong> de pasta al temple ` +
          `(${superficie} m² ÷ ${opcion.rendimientoMin}-${opcion.rendimientoMax} m²/Kg orientativos para acabado liso). ` +
          `Dilúyela con aproximadamente <strong>${aguaMinL.toFixed(1).replace('.', ',')}-${aguaMaxL.toFixed(1).replace('.', ',')} L de agua</strong> ` +
          `(${opcion.aguaMinMlKg}-${opcion.aguaMaxMlKg} ml de agua por Kg de pintura, según el modo de empleo del fabricante).`;
      } else {
        // Gotelé/picado: rendimiento fijo, pero el agua se ajusta "según
        // la densidad deseada" — el propio fabricante no da una cifra
        // fija, así que no se inventa una aquí tampoco.
        const kg = superficie / opcion.rendimiento;
        resultado.innerHTML = `Necesitarás aproximadamente <strong>${kg.toFixed(1).replace('.', ',')} Kg</strong> de pasta al temple ` +
          `(${superficie} m² ÷ ${opcion.rendimiento} m²/Kg orientativo para acabado ${opcion.label.toLowerCase()}). ` +
          `La cantidad de agua se ajusta <strong>según la densidad que busques</strong> (el fabricante no da aquí una proporción fija, a diferencia del acabado liso) — añade agua poco a poco, probando antes en una zona pequeña, hasta conseguir la textura deseada.`;
      }
    };

    selectTipo.addEventListener('change', calcular);
    inputSuperficie.addEventListener('input', calcular);
    calcular();
  }

  // Calculadora de dosis de hipoclorito de sodio para piscinas — dos
  // formas de indicar el volumen (m³ directos, o ancho×largo×profundidad
  // media) y dos objetivos rápidos (mantenimiento / choque) más una
  // subida de ppm personalizada. Fórmula: dosis (ml) = m³ × ml por m³
  // por cada 1 ppm de subida (según la concentración) × ppm objetivo —
  // exactamente la tabla de referencia proporcionada para hipoclorito de
  // sodio líquido.
  function wireCalculadoraCloro(sol) {
    if (!sol.calculadoraCloro) return;
    const { dosisPorM3PorPpm } = sol.calculadoraCloro;

    const btnModos = document.querySelectorAll('.cs-calc-cloro-modo-btn');
    const camposM3 = $('#cs-calc-cloro-campos-m3');
    const camposMedidas = $('#cs-calc-cloro-campos-medidas');
    const inputM3 = $('#cs-calc-cloro-m3');
    const inputAncho = $('#cs-calc-cloro-ancho');
    const inputLargo = $('#cs-calc-cloro-largo');
    const inputHondo = $('#cs-calc-cloro-hondo');
    const selectConcentracion = $('#cs-calc-cloro-concentracion');
    const selectObjetivo = $('#cs-calc-cloro-objetivo');
    const wrapPersonalizado = $('#cs-calc-cloro-ppm-personalizado-wrap');
    const inputPersonalizado = $('#cs-calc-cloro-ppm-personalizado');
    const resultado = $('#cs-calc-cloro-resultado');
    if (!inputM3 || !selectConcentracion || !selectObjetivo || !resultado) return;

    let modo = 'm3';

    btnModos.forEach((btn) => {
      btn.addEventListener('click', () => {
        modo = btn.dataset.modo;
        btnModos.forEach((b) => b.classList.toggle('is-active', b === btn));
        camposM3.style.display = modo === 'm3' ? '' : 'none';
        camposMedidas.style.display = modo === 'medidas' ? '' : 'none';
        calcular();
      });
    });

    selectObjetivo.addEventListener('change', () => {
      wrapPersonalizado.style.display = selectObjetivo.value === 'personalizado' ? '' : 'none';
      calcular();
    });

    const obtenerM3 = () => {
      if (modo === 'm3') return parseFloat(inputM3.value) || 0;
      const ancho = parseFloat(inputAncho.value) || 0;
      const largo = parseFloat(inputLargo.value) || 0;
      const hondo = parseFloat(inputHondo.value) || 0;
      return ancho * largo * hondo;
    };

    const calcular = () => {
      const m3 = obtenerM3();
      const concentracion = parseFloat(selectConcentracion.value);
      const mlPorM3PorPpm = dosisPorM3PorPpm[concentracion];
      const ppmObjetivo = selectObjetivo.value === 'personalizado'
        ? (parseFloat(inputPersonalizado.value) || 0)
        : parseFloat(selectObjetivo.value);

      if (!m3 || m3 <= 0 || !ppmObjetivo || ppmObjetivo <= 0 || !mlPorM3PorPpm) {
        resultado.innerHTML = '';
        return;
      }

      const dosisMl = m3 * mlPorM3PorPpm * ppmObjetivo;
      const dosisTexto = dosisMl >= 1000
        ? `${(dosisMl / 1000).toFixed(2).replace('.', ',')} L`
        : `${Math.round(dosisMl)} ml`;
      const concentracionTexto = concentracion.toString().replace('.', ',');
      const mlTexto = mlPorM3PorPpm.toString().replace('.', ',');
      const m3Texto = m3.toFixed(1).replace('.', ',');

      resultado.innerHTML = `Necesitarás aproximadamente <strong>${dosisTexto}</strong> de hipoclorito al ${concentracionTexto}% ` +
        `(${m3Texto} m³ × ${mlTexto} ml/m³ por cada ppm × ${ppmObjetivo} ppm de subida).`;
    };

    [inputM3, inputAncho, inputLargo, inputHondo, inputPersonalizado].forEach((el) => {
      if (el) el.addEventListener('input', calcular);
    });
    selectConcentracion.addEventListener('change', calcular);
  }

  // Selector "elige tu superficie/caso → te recomiendo el producto real
  // más adecuado". Reutiliza exactamente el mismo mecanismo de
  // resolución contra el catálogo real y la misma tarjeta de producto
  // (renderTarjetasProducto) que la sección de productos recomendados —
  // así el resultado es una tarjeta real, con imagen/referencia/precio
  // reales y clicable para abrir el mismo modal de detalle, no un texto
  // estático.
  function wireSelectorSuperficie(sol) {
    if (!sol.selectorSuperficie) return;
    const select = $('#cs-selector-superficie');
    const motivoEl = $('#cs-selector-motivo');
    const resultadoEl = $('#cs-selector-resultado');
    if (!select || !motivoEl || !resultadoEl) return;

    select.addEventListener('change', () => {
      const opcion = sol.selectorSuperficie.opciones.find((o) => o.id === select.value);
      if (!opcion) {
        motivoEl.style.display = 'none';
        resultadoEl.innerHTML = '';
        return;
      }

      motivoEl.textContent = opcion.motivo;
      motivoEl.style.display = '';
      resultadoEl.innerHTML = `
        <div class="cs-producto-card cs-producto-card--cargando">
          <div class="cs-producto-card__imagen-wrap"></div>
          <div class="cs-producto-card__nombre">${opcion.nombre}</div>
        </div>
      `;

      D.resolverProductoReal(opcion.nombre).then((real) => {
        // Si el usuario ya ha cambiado de opción mientras se resolvía,
        // no pisar el resultado más reciente con uno que ha llegado tarde.
        const opcionActual = sol.selectorSuperficie.opciones.find((o) => o.id === select.value);
        if (!opcionActual || opcionActual.id !== opcion.id) return;
        const entrada = construirEntradaProducto({ nombre: opcion.nombre, categoria: 'Herramientas' }, real);
        renderTarjetasProducto(resultadoEl, [entrada]);
      });
    });
  }

  // Calculadora combinada "¿Cuánto necesito?": primero se elige QUÉ
  // producto se va a aplicar (cada opción trae su propio rendimiento,
  // tomado de la calculadoraCantidad ya verificada de la guía completa
  // correspondiente) y después se calculan los litros según la
  // superficie y el número de manos — misma fórmula que
  // wireCalculadoraCantidad, pero con el rendimiento variando según lo
  // que se elija en vez de estar fijo para toda la solución.
  function wireCalculadoraCantidadMultiple(sol) {
    if (!sol.calculadoraCantidadMultiple) return;
    const selectTipo = $('#cs-calc-multi-tipo');
    const inputSuperficie = $('#cs-calc-multi-superficie');
    const inputManos = $('#cs-calc-multi-manos');
    const resultado = $('#cs-calc-multi-resultado');
    const enlace = $('#cs-calc-multi-enlace');
    if (!selectTipo || !inputSuperficie || !inputManos || !resultado) return;

    const calcular = () => {
      const opcion = sol.calculadoraCantidadMultiple.opciones.find((o) => o.id === selectTipo.value);
      const superficie = parseFloat(inputSuperficie.value);
      const manos = parseFloat(inputManos.value) || 2;

      if (!opcion || !superficie || superficie <= 0) {
        resultado.innerHTML = '';
        if (enlace) enlace.innerHTML = '';
        return;
      }

      const litros = (superficie * manos) / opcion.rendimiento;
      resultado.innerHTML = `Necesitarás aproximadamente <strong>${litros.toFixed(1).replace('.', ',')} L</strong> de ${opcion.etiqueta} ` +
        `(${superficie} m² × ${manos} manos ÷ ${opcion.rendimiento} m²/L orientativos).`;

      if (enlace && opcion.solucionRelacionada) {
        enlace.innerHTML = `Ver la guía completa: <a href="${urlSolucion(opcion.solucionRelacionada)}">${opcion.label}</a>`;
      }
    };

    selectTipo.addEventListener('change', calcular);
    inputSuperficie.addEventListener('input', calcular);
    inputManos.addEventListener('input', calcular);
    calcular();
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

    // Estado inicial mientras se resuelve contra el catálogo real —
    // evita que la sección quede vacía durante la petición.
    cont.innerHTML = sol.recommendedProducts.map((p) => `
      <div class="cs-producto-card cs-producto-card--cargando">
        <div class="cs-producto-card__imagen-wrap"></div>
        <span class="cs-producto-card__categoria">${p.categoria}</span>
        <div class="cs-producto-card__nombre">${p.nombre}</div>
        <div class="cs-producto-card__precio">${p.precio}</div>
      </div>
    `).join('');

    Promise.all(sol.recommendedProducts.map((p) => D.resolverProductoReal(p.nombre)))
      .then((resueltos) => {
        const listaFinal = sol.recommendedProducts.map((mock, i) => construirEntradaProducto(mock, resueltos[i]));
        renderTarjetasProducto(cont, listaFinal);
        actualizarBarraExportar(sol, listaFinal);
      })
      .catch(() => {
        // Si falla la resolución (sin conexión, etc.), al menos se
        // mantienen los datos de referencia con los que ya se contaba.
        const listaFinal = sol.recommendedProducts.map((mock) => construirEntradaProducto(mock, null));
        renderTarjetasProducto(cont, listaFinal);
        actualizarBarraExportar(sol, listaFinal);
      });
  }

  // ── "También puedes utilizar" (alternativeProducts) — a petición de
  // Eloy: que estas tarjetas también se puedan pulsar para ver el
  // detalle y el enlace al buscador, igual que ya hacían las de
  // "Qué necesitas" (recommendedProducts). Mismo mecanismo de
  // resolución contra el catálogo real y el mismo modal — se
  // reutiliza `construirEntradaProducto`/`abrirModalProducto` en vez
  // de duplicar la lógica, solo cambia el contenedor y la plantilla
  // visual de la tarjeta (más compacta, con "etiqueta" en vez de
  // "categoría", para no perder el aspecto distinto que ya tenía esta
  // sección).
  function renderProductosAlternativos(sol) {
    const cont = $('#cs-productos-alternativos');
    if (!cont || !sol.alternativeProducts || !sol.alternativeProducts.length) return;

    Promise.all(sol.alternativeProducts.map((a) => D.resolverProductoReal(a.nombre)))
      .then((resueltos) => {
        const listaFinal = sol.alternativeProducts.map((mock, i) =>
          construirEntradaProducto({ ...mock, categoria: mock.etiqueta }, resueltos[i]));
        renderTarjetasAlternativas(cont, listaFinal);
      })
      .catch(() => {
        const listaFinal = sol.alternativeProducts.map((mock) =>
          construirEntradaProducto({ ...mock, categoria: mock.etiqueta }, null));
        renderTarjetasAlternativas(cont, listaFinal);
      });
  }

  function renderTarjetasAlternativas(cont, lista) {
    cont.innerHTML = lista.map((p, i) => `
      <button type="button" class="cs-alternativa-card" data-idx="${i}">
        <span class="cs-alternativa-card__etiqueta">${p.categoria}</span>
        <div class="cs-alternativa-card__nombre">${p.nombre}</div>
        <div class="cs-alternativa-card__precio">${p.mostrarPrecio ? p.precio : (p.esReal ? 'Consultar precio y disponibilidad' : p.precio)}</div>
      </button>
    `).join('');

    cont.querySelectorAll('.cs-alternativa-card').forEach((btn, i) => {
      btn.addEventListener('click', () => abrirModalProducto(lista[i]));
    });
  }

  // Combina el producto "mock" (siempre presente, es lo que ya sabíamos
  // de la guía) con su resolución real en el catálogo (si se ha
  // encontrado una coincidencia razonable) — el resultado siempre tiene
  // los campos nombre/precio/categoria, y ref/img SOLO si son reales.
  const NOMBRES_AREA = { drogueria: 'Droguería', perfumeria: 'Perfumería', pinturas: 'Pinturas', talleres: 'Talleres' };

  function construirEntradaProducto(mock, real) {
    if (!real) {
      return {
        nombre: mock.nombre,
        categoria: mock.categoria,
        formato: mock.formato || null,
        precio: 'Consultar precio y disponibilidad',
        ref: null,
        img: null,
        esReal: false,
        familia: mock.categoria,
        area: null,
        descripcion: null,
        precioCon: null,
        precioSin: null,
        mostrarPrecio: false,
        fichaTecnica: mock.fichaTecnica || null,
      };
    }
    // Normaliza a coma decimal por si la fuente en vivo de Apps Script
    // devuelve el precio con punto (bug real ya corregido en origen,
    // ver valorCelda_ en regenerarCacheCompletaDesdeSheet_ — un número
    // de celda tipado como NÚMERO en el Sheet se convierte con
    // Number.toString(), que siempre usa punto, sin importar el
    // idioma). Se deja esta normalización aquí también como red de
    // seguridad, igual que ya hace buscador.html en todos los sitios
    // donde muestra un precio.
    const formatearPrecio_ = (valor) => {
      if (!valor) return valor;
      const num = parseFloat(valor.toString().replace(',', '.'));
      return isNaN(num) ? valor : num.toFixed(2).replace('.', ',');
    };
    const precioConFormateado = real.precio_con ? formatearPrecio_(real.precio_con) : real.precio_con;
    const precioSinFormateado = real.precio_sin ? formatearPrecio_(real.precio_sin) : real.precio_sin;

    const precioReal = real.mostrar_precio && precioConFormateado ? `${precioConFormateado} €` : 'Consultar precio y disponibilidad';
    return {
      nombre: real.nombre || mock.nombre,
      categoria: mock.categoria,
      formato: mock.formato || null,
      precio: precioReal,
      ref: real.ref || null,
      img: real.img || null,
      esReal: true,
      familia: real.familia || mock.categoria,
      area: NOMBRES_AREA[real.area] || real.area || null,
      descripcion: real.descripcion || null,
      precioCon: real.mostrar_precio ? precioConFormateado : null,
      precioSin: real.mostrar_precio ? precioSinFormateado : null,
      mostrarPrecio: !!real.mostrar_precio,
      fichaTecnica: mock.fichaTecnica || null,
    };
  }

  function urlImagenProductoReal(imgId) {
    return imgId ? `https://drive.google.com/thumbnail?id=${imgId}&sz=w300` : null;
  }

  function renderTarjetasProducto(cont, lista) {
    cont.innerHTML = lista.map((p, i) => {
      const urlImg = urlImagenProductoReal(p.img);
      return `
        <button type="button" class="cs-producto-card" data-idx="${i}">
          <div class="cs-producto-card__imagen-wrap">
            ${urlImg
              ? `<img class="cs-producto-card__imagen" src="${urlImg}" alt="${p.nombre}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;cs-producto-card__imagen-fallback&quot;>📦</span>'">`
              : `<span class="cs-producto-card__imagen-fallback">📦</span>`}
          </div>
          <span class="cs-producto-card__categoria">${p.categoria}</span>
          <div class="cs-producto-card__nombre">${p.nombre}</div>
          ${p.formato ? `<div class="cs-producto-card__formato">Formato: ${p.formato}</div>` : ''}
          ${p.ref ? `<div class="cs-producto-card__ref">Ref: ${p.ref}</div>` : ''}
          <div class="cs-producto-card__precio${p.mostrarPrecio ? '' : ' cs-producto-card__precio--consultar'}">${p.mostrarPrecio ? p.precio : 'Consultar precio y disponibilidad'}</div>
        </button>
      `;
    }).join('');

    cont.querySelectorAll('.cs-producto-card').forEach((btn, i) => {
      btn.addEventListener('click', () => abrirModalProducto(lista[i]));
    });
  }

  // ── Modal de detalle de producto (vista rápida, sin salir de la página) ──
  function abrirModalProducto(p) {
    const overlay = $('#modal-producto-overlay');
    if (!overlay) return;

    const urlImg = urlImagenProductoReal(p.img);
    const img = $('#modal-producto-img');
    const sinImagen = $('#modal-producto-sin-imagen');
    if (urlImg) {
      img.src = urlImg;
      img.alt = p.nombre;
      img.style.display = 'block';
      img.onerror = () => { img.style.display = 'none'; sinImagen.style.display = 'flex'; };
      sinImagen.style.display = 'none';
    } else {
      img.style.display = 'none';
      sinImagen.style.display = 'flex';
    }

    $('#modal-producto-nombre').textContent = p.nombre;
    $('#modal-producto-ref').textContent = p.ref ? `Ref: ${p.ref}` : (p.formato ? `Formato: ${p.formato}` : '');

    const elDescripcion = $('#modal-producto-descripcion');
    if (p.descripcion) {
      elDescripcion.textContent = p.descripcion;
      elDescripcion.style.display = 'block';
    } else {
      elDescripcion.style.display = 'none';
    }

    // Precio con/sin IVA — igual que el modal real cuando hay datos reales
    // del catálogo; con productos orientativos (sin resolver) se muestra
    // solo el precio único que ya trae la guía.
    let precioHtml = '';
    if (p.esReal) {
      if (p.mostrarPrecio && p.precioCon) {
        precioHtml = `<div class="modal-producto-precio-con">${p.precioCon} €</div>`;
        if (p.precioSin) precioHtml += `<div class="modal-producto-precio-sin">${p.precioSin} € sin IVA</div>`;
      } else {
        precioHtml = '<p class="producto-sin-precio">Consultar precio y disponibilidad</p>';
      }
    } else {
      precioHtml = '<p class="producto-sin-precio">Consultar precio y disponibilidad</p>';
    }
    $('#modal-producto-precio').innerHTML = precioHtml;

    $('#modal-producto-familia').textContent = p.familia || '—';
    $('#modal-producto-area').textContent = p.area || '—';

    const btnBuscador = $('#modal-producto-verbuscador');
    if (p.ref) {
      btnBuscador.href = `../buscador.html?ref=${encodeURIComponent(p.ref)}`;
      btnBuscador.style.display = '';
    } else {
      btnBuscador.style.display = 'none';
    }

    // Ficha técnica del FABRICANTE (PDF real de titantech.es/titanpro.es,
    // no relacionado con la ficha del propio catálogo de Orencio Matas
    // de arriba) — solo aparece si el producto concreto la trae definida
    // en la guía (de momento, los productos TitanTech/TitanPro).
    const btnFichaTecnica = $('#modal-producto-fichatecnica');
    if (btnFichaTecnica) {
      if (p.fichaTecnica) {
        btnFichaTecnica.href = p.fichaTecnica;
        btnFichaTecnica.style.display = '';
      } else {
        btnFichaTecnica.style.display = 'none';
      }
    }

    const btnCompartir = $('#modal-producto-compartir');
    if (btnCompartir) {
      btnCompartir.style.display = p.ref ? '' : 'none';
      if (p.ref) {
        btnCompartir.onclick = () => {
          const href = btnBuscador.getAttribute('href') || '';
          const texto = `${p.nombre} — ${p.precio}\n${window.location.origin}${href.replace('..', '')}`;
          const marcarCopiado = () => {
            btnCompartir.classList.add('copiado');
            btnCompartir.textContent = '✓ Copiado';
            setTimeout(() => { btnCompartir.classList.remove('copiado'); btnCompartir.innerHTML = '↗ Compartir'; }, 1800);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(marcarCopiado).catch(() => mostrarToast('No se pudo copiar'));
          }
        };
      }
    }

    overlay.classList.add('activo');
    document.body.style.overflow = 'hidden';
  }

  function cerrarModalProducto() {
    const overlay = $('#modal-producto-overlay');
    if (!overlay) return;
    overlay.classList.remove('activo');
    document.body.style.overflow = '';
  }

  function wireModalProducto() {
    const overlay = $('#modal-producto-overlay');
    const btnCerrar = $('#modal-producto-cerrar');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarModalProducto();
      });
    }
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalProducto);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarModalProducto();
    });
  }

  function actualizarBarraExportar(sol, listaProductos) {
    const totalEl = $('#cs-total-productos');
    if (totalEl) {
      totalEl.innerHTML = `Total ${listaProductos.length} productos* · <span class="precio-total">${sumaPrecios(listaProductos)} €*</span>`;
    }
    wireExportarLista(sol, listaProductos);
  }

  // ── Exportar como lista de la compra ────────────────────────────────────
  // Sustituye al antiguo "Añadir todos los productos" (carrito simulado):
  // hoy no existe un carrito real, así que en su lugar se ofrece exportar
  // el problema, la solución y los productos recomendados como una lista
  // de la compra normal — para llevarla a tienda, pasarla por WhatsApp, o
  // guardarla como archivo de texto.

  function obtenerEtiquetaProblema(sol) {
    const p = D.problemasFrecuentes.find((pf) => pf.id === sol.problem);
    return p ? p.label : null;
  }

  function generarTextoListaCompra(sol, listaProductos) {
    const productos = listaProductos || sol.recommendedProducts;
    const etiquetaProblema = obtenerEtiquetaProblema(sol);
    const lineas = [];
    lineas.push('🛒 LISTA DE LA COMPRA — Orencio Matas y Hnos.');
    lineas.push('');
    if (etiquetaProblema) lineas.push('Problema: ' + etiquetaProblema);
    lineas.push('Solución: ' + sol.title);
    lineas.push(sol.description);
    lineas.push('');
    lineas.push('Productos que necesitas:');
    productos.forEach((p, i) => {
      const formato = p.formato ? ` (${p.formato})` : '';
      const ref = p.ref ? ` [Ref: ${p.ref}]` : '';
      lineas.push(`${i + 1}. ${p.nombre}${formato}${ref} — ${p.precio}`);
    });
    lineas.push('');
    lineas.push(`Total estimado: ${sumaPrecios(productos)} €`);
    lineas.push('');
    lineas.push(`Generado el ${new Date().toLocaleDateString('es-ES')} desde el Centro de Soluciones — orenciomatas.es`);
    return lineas.join('\n');
  }

  function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto);
    }
    // Alternativa para navegadores/contextos sin Clipboard API disponible
    return new Promise((resolve, reject) => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        ok ? resolve() : reject(new Error('execCommand copy falló'));
      } catch (err) {
        reject(err);
      }
    });
  }

  function wireExportarLista(sol, listaProductos) {
    const urlSolucion = (window.location.origin || '') + window.location.pathname + '?slug=' + encodeURIComponent(sol.slug);
    const mensajeWhatsapp = `He encontrado esta solución en Orencio Matas: ${sol.title}\n\nDescarga el informe en PDF aquí:\n${urlSolucion}`;
    const texto = generarTextoListaCompra(sol, listaProductos);

    const btnPdf = $('#cs-exportar-pdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', () => {
        // Se apoya en la función "Imprimir" nativa del navegador (el
        // usuario elige "Guardar como PDF" en el diálogo) en vez de
        // generar el PDF por JavaScript: así las imágenes de los
        // productos (alojadas en Google Drive) se muestran sin
        // problemas de CORS — al imprimir, el navegador simplemente
        // renderiza la página tal cual, no hace falta descargar y
        // convertir cada imagen a datos embebidos.
        window.print();
      });
    }

    const btnCompartir = $('#cs-compartir-solucion');
    if (btnCompartir) {
      btnCompartir.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: sol.title,
            text: sol.description,
            url: urlSolucion,
          }).catch(() => {});
        } else {
          copiarAlPortapapeles(urlSolucion)
            .then(() => mostrarToast('✓ Enlace copiado al portapapeles'))
            .catch(() => mostrarToast('No se pudo copiar el enlace'));
        }
      });
    }

    const btnWhatsapp = $('#cs-exportar-whatsapp');
    if (btnWhatsapp) {
      btnWhatsapp.addEventListener('click', () => {
        // Navegar en la misma pestaña, no abrir una nueva — con window.open
        // se quedaba una pestaña en blanco tras el salto a la app de WhatsApp.
        window.location.href = 'https://wa.me/?text=' + encodeURIComponent(mensajeWhatsapp);
      });
    }

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
    render();
    wireBotonSubir();
    wireModalProducto();
  });
})();
