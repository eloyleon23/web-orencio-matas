/**
 * Página de solución DINÁMICA generada por IA (soluciones/solucion-ia.html).
 *
 * A diferencia de solucion-detalle.js (que pinta una guía ESCRITA A MANO
 * de soluciones-data.js, siempre la misma para el mismo slug), esta
 * página se monta en el momento a partir de la respuesta de la IA para
 * una consulta libre (?q=) que no coincidía con ninguna guía existente.
 *
 * A petición de Eloy tras probar la primera versión: (1) debe tener el
 * MISMO estilo visual que el resto de guías (misma fila de
 * dificultad/tiempo/resultado, mismos pasos, exportar a PDF, compartir);
 * (2) si no se encuentran productos adecuados, en vez de dejar la página
 * vacía, se debe seguir mostrando la solución igualmente, indicando que
 * no se han encontrado productos concretos y ofreciendo el buscador
 * general y el contacto como dos formas de continuar; (3) si el modal
 * del Centro de Soluciones ya hizo esta misma pregunta a la IA, se
 * reutiliza esa respuesta (sessionStorage) en vez de volver a preguntar.
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

  function badgeDificultad(d) {
    const clase = d === 'Fácil' ? 'facil' : d === 'Difícil' ? 'dificil' : 'media';
    return `<span class="cs-badge-dificultad cs-badge-dificultad--${clase}">${escaparHtml(d || 'Media')}</span>`;
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
    toast._t = setTimeout(() => toast.classList.remove('is-visible'), 2500);
  }

  function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto);
    return new Promise((resolve, reject) => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        resolve();
      } catch (e) { reject(e); }
    });
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
        <p style="font-size:1.1rem;color:var(--text-gray);"><img src="../assets/logos/apple-touch-icon.png" alt="IA" class="cs-icono-ia"> Preguntando a la IA…</p>
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
        <p style="color:var(--text-gray);margin-bottom:20px;">Ni nuestras guías ni la IA han encontrado algo específico para "<strong>${escaparHtml(consulta)}</strong>". Prueba a contárnoslo con otras palabras, consulta el <a href="../buscador.html">buscador completo</a>, o <a href="../index.html#contacto">contacta con nosotros</a> y te ayudamos directamente.</p>
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

  function wireAcciones(titulo) {
    const urlPagina = window.location.href;
    const btnPdf = $('#cs-exportar-pdf');
    if (btnPdf) btnPdf.addEventListener('click', () => window.print());

    const btnCompartir = $('#cs-compartir-solucion');
    if (btnCompartir) {
      btnCompartir.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({ title: titulo, text: `Solución sugerida por IA: ${titulo}`, url: urlPagina }).catch(() => {});
        } else {
          copiarAlPortapapeles(urlPagina)
            .then(() => mostrarToast('✓ Enlace copiado al portapapeles'))
            .catch(() => mostrarToast('No se pudo copiar el enlace'));
        }
      });
    }

    const btnWhatsapp = $('#cs-exportar-whatsapp');
    if (btnWhatsapp) {
      btnWhatsapp.addEventListener('click', () => {
        const mensaje = `He encontrado esta solución en Orencio Matas: ${titulo}\n\n${urlPagina}`;
        window.location.href = 'https://wa.me/?text=' + encodeURIComponent(mensaje);
      });
    }
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
            <p><img src="../assets/logos/apple-touch-icon.png" alt="IA" class="cs-icono-ia"> <strong>Solución generada por IA</strong> — no es una de nuestras guías escritas por el equipo, así que consúltanos si tienes dudas.</p>
          </div>
          <h1 style="font-family:var(--font-heading);font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;color:var(--text-dark);max-width:760px;margin-bottom:16px;">${escaparHtml(titulo)}</h1>
          ${datos.respuesta ? `<p style="max-width:680px;color:var(--text-gray);font-size:1.05rem;line-height:1.6;">${escaparHtml(datos.respuesta)}</p>` : ''}
          <div class="cs-info-resumen">
            <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Dificultad</div><div class="cs-info-resumen__valor">${badgeDificultad(datos.dificultad)}</div></div>
            <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Tiempo estimado</div><div class="cs-info-resumen__valor">${escaparHtml(datos.tiempo || 'Variable')}</div></div>
            <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Origen</div><div class="cs-info-resumen__valor">Sugerido por IA</div></div>
            <div class="cs-info-resumen__item"><div class="cs-info-resumen__label">Resultado</div><div class="cs-info-resumen__valor">${escaparHtml(datos.resultado || 'Problema resuelto')}</div></div>
          </div>
        </div>
      </section>

      ${pasosHtml}

      <section class="cs-section cs-section--alt" id="cs-ia-productos-seccion">
        <div class="container">
          <div class="section-heading">
            <p class="section-heading__eyebrow">Ya sabes qué hacer</p>
            <h2>Productos que podrían servirte</h2>
          </div>
          <div id="cs-ia-productos-cargando" style="text-align:center;padding:20px;color:var(--text-gray);">Buscando productos en nuestro catálogo…</div>
          <div class="cs-productos-grid" id="cs-ia-productos-grid"></div>
          <div class="cs-exportar-bar" id="cs-ia-exportar-bar" style="display:none;">
            <div class="cs-exportar-bar__acciones no-imprimir">
              <button type="button" class="btn-primary" id="cs-exportar-pdf">📄 Descargar como PDF</button>
              <button type="button" class="btn-secondary" id="cs-compartir-solucion"><i class="fa-solid fa-share-nodes"></i> Compartir solución</button>
              <button type="button" class="btn-secondary" id="cs-exportar-whatsapp">💬 Enviar por WhatsApp</button>
            </div>
          </div>
        </div>
      </section>

      <section class="cs-section">
        <div class="container" style="max-width:600px;">
          <div class="cs-ia-feedback">
            <p style="font-weight:700;margin-bottom:10px;">¿Te ha servido esta solución?</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
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
    wireAcciones(titulo);

    // Productos reales — misma lógica que en la búsqueda del hero
    // (centro-soluciones.js): términos + familias reales de la IA
    // alimentan buscarProductosEnCatalogo, la única fuente de productos
    // que se muestra (nunca lo que diga el propio texto de la IA).
    const terminosBusqueda = (datos.terminos && datos.terminos.length) ? datos.terminos.join(' ') : consulta;
    D.buscarProductosEnCatalogo(terminosBusqueda, datos.familias).then((productos) => {
      $('#cs-ia-productos-cargando').style.display = 'none';
      if (!productos.length) {
        // A petición de Eloy: si no se encuentran productos adecuados,
        // NO se deja la sección vacía — se dice honestamente que no se
        // han encontrado y se ofrecen dos formas de continuar
        // (buscador completo y contacto directo).
        $('#cs-ia-productos-grid').innerHTML = `
          <div class="cs-hero__buscador-aviso" style="grid-column:1/-1;">
            No hemos podido encontrar productos concretos para esta solución en nuestro catálogo —
            <a href="../buscador.html?q=${encodeURIComponent(consulta)}">consulta el buscador completo</a>
            o <a href="../index.html#contacto">contacta con nuestro equipo</a> y te asesoramos directamente.
          </div>
        `;
        $('#cs-ia-exportar-bar').style.display = '';
        return;
      }
      $('#cs-ia-productos-grid').innerHTML = productos.slice(0, 8).map(renderTarjetaProducto).join('');
      $('#cs-ia-exportar-bar').style.display = '';
    });
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const consulta = (params.get('q') || '').trim();
    if (!consulta) { renderSinConsulta(); return; }

    document.title = `Solución para "${consulta}" | Orencio Matas y Hnos, S.L.`;

    // Si el modal del Centro de Soluciones ya obtuvo esta misma
    // respuesta hace un momento, se reutiliza en vez de volver a
    // preguntarle lo mismo a la IA.
    let cache = null;
    try {
      const guardado = sessionStorage.getItem(`cs_ia_${consulta}`);
      if (guardado) { cache = JSON.parse(guardado); sessionStorage.removeItem(`cs_ia_${consulta}`); }
    } catch (e) { /* almacenamiento no disponible, no es crítico */ }

    if (cache) { renderSolucionIA(consulta, cache); return; }

    renderCargando();
    D.buscarSolucionIA(consulta).then((datos) => {
      if (datos.fueraDeAlcance) { renderFueraDeAlcance(datos.mensaje); return; }
      if (datos.solucion) {
        window.location.href = `solucion.html?slug=${encodeURIComponent(datos.solucion.slug)}`;
        return;
      }
      if (!datos.titulo && !datos.respuesta && !(datos.pasos && datos.pasos.length)) {
        renderNoEncontrado(consulta);
        return;
      }
      renderSolucionIA(consulta, datos);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
