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
            ${sol.colorChart.logo ? `<img class="cs-colorchart-link__logo" src="${sol.colorChart.logo}" alt="Logo" loading="lazy" onerror="this.style.display='none'">` : '🎨'}
            <span>${sol.colorChart.label}</span>
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
            <p id="cs-total-productos">Total ${sol.recommendedProducts.length} productos · <span class="precio-total">${sumaPrecios(sol.recommendedProducts)} €</span></p>
            <div class="cs-exportar-bar__acciones no-imprimir">
              <button type="button" class="btn-primary" id="cs-exportar-pdf">📄 Descargar como PDF</button>
              <button type="button" class="btn-secondary" id="cs-exportar-copiar">📋 Copiar lista de la compra</button>
              <button type="button" class="btn-secondary" id="cs-exportar-descargar">⬇️ Descargar (.txt)</button>
              <button type="button" class="btn-secondary" id="cs-exportar-whatsapp">💬 Enviar por WhatsApp</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Alternativas -->
      <section class="cs-section no-imprimir">
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
      <section class="cs-section cs-section--alt no-imprimir">
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
    `;

    renderProductosRecomendados(sol);
    wireCalculadoraCantidad(sol);
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
      resultado.innerHTML = `Necesitarás aproximadamente <strong>${litros.toFixed(1)} L</strong> ` +
        `(${superficie} m² × ${manos} manos ÷ ${rendimiento} m²/L orientativos para ${etiqueta}).`;
    };
    inputSuperficie.addEventListener('input', calcular);
    inputManos.addEventListener('input', calcular);
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
      };
    }
    const precioReal = real.mostrar_precio && real.precio_con ? `${real.precio_con} €` : 'Consultar precio y disponibilidad';
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
      precioCon: real.mostrar_precio ? real.precio_con : null,
      precioSin: real.mostrar_precio ? real.precio_sin : null,
      mostrarPrecio: !!real.mostrar_precio,
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
          <div class="cs-producto-card__precio">${p.mostrarPrecio ? p.precio : 'Consultar precio y disponibilidad'}</div>
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
        precioHtml = '<p style="color:var(--text-muted);">Consultar precio y disponibilidad</p>';
      }
    } else {
      precioHtml = `<div class="modal-producto-precio-con">${p.precio}</div>`;
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
      totalEl.innerHTML = `Total ${listaProductos.length} productos · <span class="precio-total">${sumaPrecios(listaProductos)} €</span>`;
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

    const btnCopiar = $('#cs-exportar-copiar');
    if (btnCopiar) {
      btnCopiar.addEventListener('click', () => {
        copiarAlPortapapeles(texto)
          .then(() => mostrarToast('✓ Lista copiada al portapapeles'))
          .catch(() => mostrarToast('No se pudo copiar — prueba a descargarla en su lugar'));
      });
    }

    const btnDescargar = $('#cs-exportar-descargar');
    if (btnDescargar) {
      btnDescargar.addEventListener('click', () => {
        const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lista-compra-${sol.slug}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarToast('✓ Lista descargada');
      });
    }

    const btnWhatsapp = $('#cs-exportar-whatsapp');
    if (btnWhatsapp) {
      btnWhatsapp.addEventListener('click', () => {
        // Navegar en la misma pestaña, no abrir una nueva — con window.open
        // se quedaba una pestaña en blanco tras el salto a la app de WhatsApp.
        window.location.href = 'https://wa.me/?text=' + encodeURIComponent(texto);
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
