/**
 * Página de solución DINÁMICA generada por IA (soluciones/solucion-ia.html).
 *
 * A diferencia de solucion-detalle.js (que pinta una guía ESCRITA A MANO
 * de soluciones-data.js, siempre la misma para el mismo slug), esta
 * página se monta en el momento a partir de la respuesta de la IA para
 * una consulta libre (?q=) que no coincidía con ninguna guía existente —
 * a petición de Eloy: "una página de solución dinámica que se monte en
 * función de la respuesta de la IA, donde esté la solución, los pasos,
 * los productos recomendados si hay y que indique si le ha servido la
 * solución para mejorar".
 *
 * Reutiliza el mismo motor de IA ya construido (D.buscarSolucionIA) —
 * si la IA en realidad encuentra una guía real (slug), esta página
 * REDIRIGE a la guía de verdad en vez de intentar montar una versión
 * dinámica de algo que ya existe escrito a mano.
 */
(function () {
  const D = window.SOLUCIONES_DATA;
  const cont = document.getElementById('solucion-ia-contenido');
  const NOMBRES_AREA = { drogueria: 'Droguería', perfumeria: 'Perfumería', pinturas: 'Pinturas', talleres: 'Talleres' };

  function $(sel, root) { return (root || document).querySelector(sel); }

  function escaparHtml(t) {
    const div = document.createElement('div');
    div.textContent = t || '';
    return div.innerHTML;
  }

  function renderTarjetaProducto(p) {
    const precioReal = p.mostrar_precio && p.precio_con;
    const precio = precioReal ? `${p.precio_con} €` : 'Consultar precio y disponibilidad';
    const precioClass = precioReal ? 'cs-producto-card__precio' : 'cs-producto-card__precio cs-producto-card__precio--consultar';
    const areaLabel = NOMBRES_AREA[p.area] || p.area || '';
    return `
      <a class="cs-producto-card" href="../buscador.html?ref=${encodeURIComponent(p.ref)}">
        <div class="cs-producto-card__imagen-wrap">
          ${p.img
            ? `<img class="cs-producto-card__imagen" src="https://drive.google.com/thumbnail?id=${p.img}&sz=w300" alt="${escaparHtml(p.nombre)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;cs-producto-card__imagen-fallback&quot;>📦</span>'">`
            : `<span class="cs-producto-card__imagen-fallback">📦</span>`}
        </div>
        <span class="cs-producto-card__categoria">${areaLabel}${p.familia ? ' · ' + p.familia : ''}</span>
        <div class="cs-producto-card__nombre">${escaparHtml(p.nombre)}</div>
        <div class="cs-producto-card__ref">Ref: ${p.ref}</div>
        <div class="${precioClass}">${precio}</div>
      </a>
    `;
  }

  function renderCargando() {
    cont.innerHTML = `
      <div class="container" style="padding:60px 20px;text-align:center;">
        <p style="font-size:1.1rem;color:var(--text-gray);">🤖 Preguntando a la IA…</p>
      </div>
    `;
  }

  function renderSinConsulta() {
    cont.innerHTML = `
      <div class="container" style="padding:60px 20px;text-align:center;">
        <h1 style="font-family:var(--font-heading);font-size:1.8rem;margin-bottom:12px;">Falta la consulta</h1>
        <p style="color:var(--text-gray);margin-bottom:20px;">Esta página se monta a partir de una búsqueda en el Centro de Soluciones.</p>
        <a class="btn-primary" href="../centro-soluciones.html">← Volver al Centro de Soluciones</a>
      </div>
    `;
  }

  function renderNoEncontrado(consulta) {
    cont.innerHTML = `
      <div class="container" style="padding:60px 20px;text-align:center;max-width:600px;margin:0 auto;">
        <h1 style="font-family:var(--font-heading);font-size:1.8rem;margin-bottom:12px;">No hemos encontrado una solución</h1>
        <p style="color:var(--text-gray);margin-bottom:20px;">Ni nuestras guías ni la IA han encontrado algo específico para "<strong>${escaparHtml(consulta)}</strong>". Prueba a contárnoslo con otras palabras, o llámanos y te ayudamos directamente.</p>
        <a class="btn-primary" href="../centro-soluciones.html">← Volver al Centro de Soluciones</a>
      </div>
    `;
  }

  function renderFueraDeAlcance(mensaje) {
    cont.innerHTML = `
      <div class="container" style="padding:60px 20px;text-align:center;max-width:600px;margin:0 auto;">
        <h1 style="font-family:var(--font-heading);font-size:1.8rem;margin-bottom:12px;">Consulta fuera de nuestro ámbito</h1>
        <p class="cs-hero__buscador-aviso" style="display:inline-block;text-align:left;margin-bottom:20px;">
          <span aria-hidden="true">⚠️</span> ${escaparHtml(mensaje || 'Este asistente solo puede ayudarte con productos y soluciones de droguería, perfumería, pintura, limpieza del hogar y talleres/carrocerías.')}
        </p>
        <p><a class="btn-primary" href="../centro-soluciones.html">← Volver al Centro de Soluciones</a></p>
      </div>
    `;
  }

  function wireFeedback() {
    // De momento solo la interacción visual ("¿te ha servido?") —
    // guardar estas respuestas para que la IA aprenda de ellas es un
    // proyecto aparte, aún no abordado (decisión de Eloy: "la otra ya
    // lo veremos más adelante").
    const botones = document.querySelectorAll('.cs-ia-feedback__btn');
    const mensaje = $('#cs-ia-feedback-mensaje');
    botones.forEach((btn) => {
      btn.addEventListener('click', () => {
        botones.forEach((b) => { b.disabled = true; b.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
        if (mensaje) {
          mensaje.textContent = btn.dataset.util === 'si'
            ? '¡Gracias! Nos alegra haberte ayudado.'
            : 'Gracias por avisarnos — prueba con el buscador completo o llámanos y te ayudamos directamente.';
          mensaje.style.display = 'block';
        }
      }, { once: true });
    });
  }

  function renderSolucionIA(consulta, datos) {
    const titulo = datos.titulo || `Solución para: ${consulta}`;
    const pasosHtml = datos.pasos && datos.pasos.length ? `
      <section class="cs-section">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Cómo hacerlo</p>
            <h2>Paso a paso</h2>
          </div>
          <div class="cs-timeline">
            ${datos.pasos.map((p, i) => `
              <div class="cs-timeline__paso">
                <div class="cs-timeline__num">${i + 1}</div>
                <div class="cs-timeline__titulo">Paso ${i + 1} — ${escaparHtml(p.titulo || '')}</div>
                ${p.texto ? `<p class="cs-timeline__texto">${escaparHtml(p.texto)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    ` : '';

    cont.innerHTML = `
      <div class="container cs-breadcrumb no-imprimir">
        <a href="../centro-soluciones.html">Centro de Soluciones</a> › <span class="current">Solución sugerida por IA</span>
      </div>

      <section class="cs-section" style="padding-top:10px;">
        <div class="container">
          <div class="cs-hero__ia-respuesta" style="margin-bottom:16px;max-width:680px;">
            <p><span aria-hidden="true">🤖</span> <strong>Solución generada por IA</strong> — no es una de nuestras guías escritas por el equipo, así que consúltanos si tienes dudas.</p>
          </div>
          <h1 style="font-family:var(--font-heading);font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;color:var(--text-dark);max-width:760px;margin-bottom:16px;">${escaparHtml(titulo)}</h1>
          ${datos.respuesta ? `<p style="max-width:680px;color:var(--text-gray);font-size:1.05rem;line-height:1.6;">${escaparHtml(datos.respuesta)}</p>` : ''}
        </div>
      </section>

      ${pasosHtml}

      <section class="cs-section cs-section--alt" id="cs-ia-productos-seccion" style="display:none;">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Ya sabes qué hacer</p>
            <h2>Productos que podrían servirte</h2>
          </div>
          <div class="cs-productos-grid" id="cs-ia-productos-grid"></div>
        </div>
      </section>

      <section class="cs-section">
        <div class="container" style="max-width:600px;">
          <div class="cs-ia-feedback">
            <p style="font-weight:700;margin-bottom:10px;">¿Te ha servido esta solución?</p>
            <div style="display:flex;gap:10px;">
              <button type="button" class="cs-ia-feedback__btn" data-util="si">👍 Sí, me ha servido</button>
              <button type="button" class="cs-ia-feedback__btn" data-util="no">👎 No era lo que buscaba</button>
            </div>
            <p id="cs-ia-feedback-mensaje" style="margin-top:10px;color:var(--text-gray);display:none;"></p>
          </div>
          <p style="margin-top:24px;"><a href="../centro-soluciones.html">← Volver al Centro de Soluciones</a></p>
        </div>
      </section>
    `;

    wireFeedback();

    // Productos reales — misma lógica que en la búsqueda del hero
    // (centro-soluciones.js): términos + familias reales de la IA
    // alimentan buscarProductosEnCatalogo, la única fuente de productos
    // que se muestra (nunca lo que diga el propio texto de la IA).
    const terminosBusqueda = (datos.terminos && datos.terminos.length) ? datos.terminos.join(' ') : consulta;
    D.buscarProductosEnCatalogo(terminosBusqueda, datos.familias).then((productos) => {
      if (!productos.length) return;
      $('#cs-ia-productos-seccion').style.display = '';
      $('#cs-ia-productos-grid').innerHTML = productos.slice(0, 8).map(renderTarjetaProducto).join('');
    });
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const consulta = (params.get('q') || '').trim();
    if (!consulta) { renderSinConsulta(); return; }

    document.title = `Solución para "${consulta}" | Orencio Matas y Hnos, S.L.`;
    renderCargando();

    D.buscarSolucionIA(consulta).then((datos) => {
      // A petición de Eloy: "limitar las preguntas... informando si la
      // pregunta es inapropiada" — se corta ANTES de intentar montar
      // cualquier contenido si la propia IA marcó la consulta como
      // fuera de alcance del negocio.
      if (datos.fueraDeAlcance) {
        renderFueraDeAlcance(datos.mensaje);
        return;
      }
      // Si la IA (o el propio motor de palabras clave, dentro de
      // buscarSolucionIA) en realidad encuentra una guía real ya
      // escrita a mano, no tiene sentido montar una versión dinámica de
      // algo que ya existe — se redirige a la guía de verdad.
      if (datos.solucion) {
        window.location.href = `solucion.html?slug=${encodeURIComponent(datos.solucion.slug)}`;
        return;
      }
      if (!datos.titulo && !datos.respuesta && !(datos.pasos && datos.pasos.length) && !(datos.terminos && datos.terminos.length)) {
        renderNoEncontrado(consulta);
        return;
      }
      renderSolucionIA(consulta, datos);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
