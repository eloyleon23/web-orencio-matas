(function () {
  const D = window.SOLUCIONES_DATA;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $all = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  // Si hay una petición de IA en curso con el modal abierto, esta
  // función la cancela — usada tanto por el botón "Cancelar" propio del
  // modal como por cualquier otra forma de cerrarlo (X, click fuera,
  // Escape, volver atrás en el navegador), para no dejar una petición
  // viva en segundo plano sin que el usuario lo sepa.
  let cancelarModalIAEnCurso = null;

  // A petición de Eloy: "me preocupa que ganemos en dar más soluciones
  // pero estemos penalizando la eficiencia y rapidez". Una parte real
  // de la lentitud de la PRIMERA pregunta a la IA en cada visita era
  // que, hasta ese momento, nunca se había cargado el catálogo real de
  // productos (necesario tanto para la taxonomía que se le manda a
  // Gemini como para buscar productos después) — esa descarga se
  // sumaba en el camino crítico de la primera consulta. Se adelanta
  // aquí, en segundo plano, nada más entrar en la página, sin esperar
  // a que el usuario pregunte nada — cargarCatalogoReal() ya cachea el
  // resultado, así que si el usuario pregunta antes de que termine,
  // simplemente reutiliza esta misma descarga ya en marcha, y si nunca
  // hace falta, no se ha bloqueado ni ralentizado nada más.
  if (D && D.cargarCatalogoReal) D.cargarCatalogoReal().catch(() => {});

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

  // ── Buscador rápido de soluciones, dentro del hero ("¿Qué quieres
  //    conseguir?") — busca en TODAS las soluciones (no solo en los
  //    chips curados de "¿Tienes un problema?"), para quien ya sabe la
  //    palabra que quiere buscar y no quiere navegar por la página. ────
  function wireBuscadorHero() {
    const input = $('#cs-hero-buscador-input');
    const btnLimpiar = $('#cs-hero-buscador-limpiar');
    const btnLupa = $('#cs-hero-buscador-lupa');
    const resultados = $('#cs-hero-buscador-resultados');
    if (!input || !resultados) return;

    function limpiar() {
      input.value = '';
      btnLimpiar.style.display = 'none';
      resultados.style.display = 'none';
      resultados.innerHTML = '';
    }

    function ejecutarBusqueda(esConfirmacion) {
      const texto = input.value.trim();
      if (!texto) {
        resultados.style.display = 'none';
        resultados.innerHTML = '';
        return;
      }

      // Detecta consultas de ficha técnica ("ficha técnica p60", "ficha
      // de pxb-730", o directamente el código "p60") ANTES que cualquier
      // otra cosa — si hay coincidencia, se muestra como un resultado
      // destacado propio, con enlace directo al PDF del fabricante,
      // encima de las guías que puedan encontrarse además con el mismo
      // texto. Ver buscarFichaTecnicaPorTexto en soluciones-data.js.
      const fichaDirecta = D.buscarFichaTecnicaPorTexto(texto);

      // Combina el diagnóstico curado (~90 términos/sinónimos, incluye
      // coloquialismos como "cloro" para la guía de piscinas aunque esa
      // palabra no aparezca escrita en su título) con la coincidencia
      // literal en título/descripción/productos — antes solo se usaba
      // esta segunda, mucho más limitada. Ver buscarSolucionesCombinado
      // en soluciones-data.js para el porqué completo.
      //
      // El diagnóstico CURADO se guarda aparte del combinado a
      // propósito: la coincidencia literal es bastante más ruidosa (p.
      // ej. "limpieza interior de una barrica de madera" encuentra 32
      // guías por solapar palabras sueltas como "limpieza"/"madera" con
      // media web, sin que ninguna trate de verdad ese caso concreto) —
      // si se usara solo "¿ha encontrado algo el combinado?" para
      // decidir si merece la pena llamar a la IA automáticamente, casi
      // nunca se llegaría a llamar, aunque ese "algo" fuera ruido sin
      // relación real con lo que pedía el cliente.
      const curadas = D.diagnosticarPorTexto(texto).todasLasSoluciones.length;
      const encontradas = D.buscarSolucionesCombinado(texto).slice(0, 12);

      if (fichaDirecta || curadas) {
        // Aun con coincidencia curada, esta puede ser floja para
        // consultas raras (p. ej. "limpieza interior de una barrica de
        // madera" encuentra 1 resultado curado, probablemente por
        // solape incidental, no porque exista de verdad una guía sobre
        // barricas) — se deja siempre visible un botón para pedir
        // también la ayuda de la IA bajo demanda (nunca automático
        // aquí, para no gastar en cada búsqueda que ya tiene un
        // resultado razonable), tal como pidió Eloy para casos así.
        mostrarResultadosBusquedaHero(encontradas, texto, fichaDirecta);
        wireBotonPedirIA(texto);
        return;
      }

      // A petición de Eloy: "conforme te pones a escribir salta la
      // modal de la IA" — si esto viene del filtro en vivo mientras se
      // teclea (no una confirmación explícita del usuario), no se hace
      // nada más todavía. Es muy normal que un texto a medio escribir
      // no coincida con nada curado, y abrir el modal en ese instante
      // interrumpe al usuario mientras sigue pensando/escribiendo. Solo
      // se intenta con la IA cuando el usuario confirma de verdad (ver
      // wiring de Enter/lupa/pausa larga más abajo).
      if (!esConfirmacion) {
        resultados.style.display = 'none';
        resultados.innerHTML = '';
        return;
      }

      // Ni el diagnóstico ni el título/descripción/productos de ninguna
      // guía encajan, ni hay ficha técnica reconocible. Antes esto caía
      // directo a la búsqueda en el catálogo de productos con el texto
      // TAL CUAL lo escribió el cliente, y si no había nada, redirigía al
      // buscador general — pero si aquí ya no hay nada, en el buscador
      // tampoco lo habrá, y ese enlace daba sensación de que algo
      // funcionaba mal (Eloy). Ahora: se le da una oportunidad a la
      // búsqueda inteligente con IA cuando el usuario confirma su
      // búsqueda — no añade coste a las búsquedas que el motor de
      // palabras clave ya resuelve razonablemente bien.
      //
      // El progreso de la espera ahora se muestra en el modal
      // compartido (ver abrirModalEsperaIA), no aquí — se deja
      // `resultados` oculto mientras tanto, para no duplicar el mensaje
      // de "preguntando a la IA" debajo del propio modal.
      ejecutarBusquedaIA(texto);
    }

    // Ejecuta la búsqueda inteligente con IA de forma AUTOMÁTICA (sin
    // que el cliente tenga que pedirlo) y escribe el resultado
    // directamente en `resultados` — único caso donde esto ocurre sin
    // acción explícita: cuando ni el diagnóstico curado ni la
    // coincidencia literal han encontrado NADA. El caso del botón
    // "pedir ayuda a la IA" (cuando sí hay algo, pero puede ser flojo)
    // usa un modal aparte — ver pedirAyudaIAModal más abajo.
    // ── Espera con mensajes progresivos para las llamadas a la IA ──
    // A petición de Eloy (mismo patrón ya aplicado y aprobado en
    // buscador.html): cortar a los 15s se quedaba corto en pruebas
    // reales — en vez de un corte automático "normal", se informa por
    // fases cada 15s de que se sigue trabajando, y es el propio usuario
    // quien decide si cancelar o seguir esperando. Queda un límite de
    // seguridad muy generoso (2 minutos) solo para el caso extremo de
    // que Apps Script/Gemini se hayan quedado colgados de verdad.
    const MENSAJES_ESPERA_IA = [
      'Preguntando a la IA…',
      'Seguimos en ello — recopilando la información adecuada…',
      'Ya casi… gracias por tu paciencia',
      'Esto está tardando más de lo normal, pero seguimos intentándolo…',
      'Seguimos esperando respuesta — puedes cancelar si prefieres no seguir esperando',
    ];
    const INTERVALO_MENSAJE_ESPERA_MS = 15000;
    const LIMITE_SEGURIDAD_ESPERA_MS = 120000;

    // Pone en marcha los mensajes rotativos y el botón de cancelar;
    // devuelve una función para detenerlo todo cuando la petición acabe
    // (con éxito, error, o cancelación).
    function iniciarEsperaIA(elTexto, elCancelar, onCancelar) {
      let paso = 0;
      elTexto.textContent = MENSAJES_ESPERA_IA[0];
      const intervalo = setInterval(() => {
        paso = Math.min(paso + 1, MENSAJES_ESPERA_IA.length - 1);
        elTexto.textContent = MENSAJES_ESPERA_IA[paso];
      }, INTERVALO_MENSAJE_ESPERA_MS);
      elCancelar.onclick = onCancelar;
      return () => { clearInterval(intervalo); elCancelar.onclick = null; };
    }

    // Abre el modal compartido de espera (mismo #cs-ia-modal-overlay que
    // ya existía) con el sistema de mensajes progresivos + cancelación.
    // Devuelve { signal, finalizar, fueCancelado } — el llamador pasa
    // `signal` a D.buscarSolucionIA() y llama a finalizar() en cuanto
    // tenga respuesta (éxito o error), antes de decidir qué mostrar.
    function abrirModalEsperaIA() {
      const overlay = $('#cs-ia-modal-overlay');
      const contenido = $('#cs-ia-modal-contenido');
      const box = overlay.querySelector('.cs-ia-modal-box');
      contenido.innerHTML = `
        <p class="cs-ia-modal-spinner" aria-hidden="true"><img src="assets/logos/apple-touch-icon.png" alt="IA" class="cs-icono-ia"></p>
        <p class="cs-ia-modal-texto" id="cs-ia-modal-texto-dinamico"></p>
        <button type="button" class="cs-ia-modal-cancelar" id="cs-ia-modal-cancelar-btn">Cancelar</button>
      `;
      if (box) box.classList.add('cs-ia-modal-box--esperando');
      overlay.style.display = 'flex';

      let canceladoPorUsuario = false;
      const controlador = new AbortController();
      const limiteSeguridad = setTimeout(() => controlador.abort(), LIMITE_SEGURIDAD_ESPERA_MS);
      const detenerMensajes = iniciarEsperaIA($('#cs-ia-modal-texto-dinamico'), $('#cs-ia-modal-cancelar-btn'), () => {
        canceladoPorUsuario = true;
        controlador.abort();
      });

      // Registrada globalmente para que cerrar el modal por otras vías
      // (X, click fuera, Escape — ver wireModalIACierre) cancele también
      // la petición en curso, en vez de dejarla viva en segundo plano.
      cancelarModalIAEnCurso = () => { canceladoPorUsuario = true; controlador.abort(); };

      function finalizar() {
        clearTimeout(limiteSeguridad);
        detenerMensajes();
        if (box) box.classList.remove('cs-ia-modal-box--esperando');
        cancelarModalIAEnCurso = null;
      }
      return { signal: controlador.signal, finalizar, fueCancelado: () => canceladoPorUsuario };
    }

    function ejecutarBusquedaIA(texto) {
      const { signal, finalizar, fueCancelado } = abrirModalEsperaIA();
      D.buscarSolucionIA(texto, signal).then(({ solucion, errorTecnico, fueraDeAlcance, mensaje, titulo, respuesta, pasos, dificultad, tiempo, resultado, terminos, familias }) => {
        finalizar();
        cerrarModalIA();
        if (input.value.trim() !== texto) return; // el texto cambió mientras la petición estaba en vuelo

        // A petición de Eloy: si el propio usuario canceló desde el
        // modal (o lo cerró de cualquier otra forma), se le dice así de
        // claro — distinto de un fallo técnico real.
        if (errorTecnico && fueCancelado()) {
          resultados.innerHTML = `<p class="cs-hero__buscador-vacio">Búsqueda cancelada. Puedes intentarlo de nuevo cuando quieras.</p>`;
          resultados.style.display = 'block';
          return;
        }

        // A petición de Eloy: si ha habido un problema TÉCNICO de
        // verdad (Gemini caído/saturado, sin conexión...), no se debe
        // decir "no hemos encontrado nada" — eso da a entender que el
        // problema no tiene solución en nuestro catálogo, cuando en
        // realidad ni siquiera se ha llegado a comprobar. Se anima a
        // reintentarlo en vez de dar la sensación de un callejón sin
        // salida.
        if (errorTecnico) {
          resultados.innerHTML = `
            <p class="cs-hero__buscador-aviso">
              <span aria-hidden="true">🔄</span> Ha habido un problema al consultar con nuestro asistente — no es que no exista una solución, es un fallo puntual. Vuelve a intentarlo en unos segundos, o cuéntanoslo en <a href="#cs-problema">¿Tienes un problema?</a>.
            </p>
          `;
          resultados.style.display = 'block';
          return;
        }

        // A petición de Eloy: "limitar las preguntas... informando si
        // la pregunta es inapropiada". Se corta aquí ANTES de mostrar
        // ningún resultado ni buscar ningún producto — el aviso es lo
        // único que se muestra.
        if (fueraDeAlcance) {
          resultados.innerHTML = `
            <p class="cs-hero__buscador-aviso">
              <span aria-hidden="true">⚠️</span> ${mensaje || 'Este asistente solo puede ayudarte con productos y soluciones de droguería, perfumería, pintura, limpieza del hogar y talleres/carrocerías.'}
            </p>
          `;
          resultados.style.display = 'block';
          return;
        }

        if (solucion) {
          mostrarResultadosBusquedaHero([solucion], texto, null, true);
          return;
        }

        // Ninguna guía escrita a mano encaja (casos como "limpieza
        // interior de una barrica de madera" o "quitar el verde del
        // borde de la piscina" nunca tendrán una guía propia para cada
        // caso posible) — a petición de Eloy: que la IA ofrezca una
        // solución alternativa igualmente, con productos SIEMPRE de los
        // disponibles. `respuesta` es la orientación que genera la IA
        // (nunca nombra marcas ni productos concretos — eso lo evita el
        // propio prompt); los productos que se muestran de verdad salen
        // siempre de la búsqueda real de catálogo con `terminos`, nunca
        // de lo que diga el texto de la IA. Si la IA no dio términos
        // útiles (o la llamada falló del todo — sin conexión, o la
        // función de Apps Script aún no desplegada), se prueba con el
        // texto tal cual como último intento.
        const terminosBusqueda = (terminos && terminos.length) ? terminos.join(' ') : texto;
        D.buscarProductosEnCatalogo(terminosBusqueda, familias).then((productos) => {
          if (input.value.trim() !== texto) return;

          if (!productos.length && !respuesta) {
            // De verdad no hay nada — ni guía, ni sugerencia de IA con
            // producto real, ni siquiera una orientación genérica. Se
            // dice así de claro, SIN enlace al buscador general (ahí
            // tampoco habría nada) — a petición expresa de Eloy, para no
            // dar sensación de que el buscador funciona mal.
            resultados.innerHTML = `
              <p class="cs-hero__buscador-vacio">No hemos encontrado ninguna solución para "<strong>${texto}</strong>" — prueba a contárnoslo con otras palabras en <a href="#cs-problema">¿Tienes un problema?</a>, o llámanos y te ayudamos directamente.</p>
            `;
            resultados.style.display = 'block';
            return;
          }

          const bloqueRespuesta = respuesta ? `
            <div class="cs-hero__ia-respuesta">
              <p><img src="assets/logos/apple-touch-icon.png" alt="IA" class="cs-icono-ia"> <strong>Sugerencia de IA</strong> — no es una de nuestras guías, pero puede orientarte:</p>
              <p>${respuesta}</p>
            </div>
          ` : `<p class="cs-hero__buscador-contador"><img src="assets/logos/apple-touch-icon.png" alt="IA" class="cs-icono-ia"> No tenemos una guía específica para "${texto}", pero estos productos pueden ayudarte:</p>`;

          const bloqueProductos = productos.length ? `
            <p class="cs-hero__buscador-contador" style="margin-top:14px;">Productos que podrían servirte:</p>
            <div class="cs-productos-grid" style="margin-top:12px;">
              ${productos.slice(0, 6).map((p) => renderTarjetaProductoCatalogo(p)).join('')}
            </div>
          ` : '';
          resultados.innerHTML = `
            ${bloqueRespuesta}
            ${bloqueProductos}
            <button type="button" class="cs-hero__buscador-chip" id="cs-hero-ver-completa" style="margin-top:14px;"><img src="assets/logos/apple-touch-icon.png" alt="IA" class="cs-icono-ia"> Ver la solución completa, paso a paso →</button>
          `;
          resultados.style.display = 'block';

          // A petición de Eloy: este botón también tiene que avisar con
          // el mismo modal — antes era un enlace normal que saltaba
          // directo a la página sin ningún aviso de "esto está en
          // marcha". Ya se tienen todos los datos de esta misma
          // respuesta, así que no hace falta preguntarle a la IA otra
          // vez — se reutiliza el modal solo para el aviso visual y la
          // transición, guardando los datos para que la página de
          // destino los reutilice (ver irASolucionCompletaConDatos).
          const btnVerCompleta = $('#cs-hero-ver-completa');
          if (btnVerCompleta) {
            btnVerCompleta.addEventListener('click', () => irASolucionCompletaConDatos(texto, {
              titulo, respuesta, pasos, dificultad, tiempo, resultado, terminos, familias,
            }));
          }
        });
      });
    }

    // Botón "pedir ayuda a la IA" bajo demanda — a petición de Eloy: en
    // vez de insertar contenido a medias bajo los resultados (una
    // "ventana intermedia" que no le convencía), se abre un modal claro
    // con estado de carga. Si la IA encuentra una solución (guía real o
    // generada dinámicamente), se REDIRIGE directamente a ella; si no
    // hay nada que mostrar (o la consulta está fuera de alcance), el
    // modal lo dice y se puede cerrar con la X, dejando intacto lo que
    // hubiera en el Centro de Soluciones.
    function pedirAyudaIAModal(texto) {
      const overlay = $('#cs-ia-modal-overlay');
      const contenido = $('#cs-ia-modal-contenido');
      if (!overlay || !contenido) return;

      const { signal, finalizar, fueCancelado } = abrirModalEsperaIA();

      D.buscarSolucionIA(texto, signal).then(({ solucion, errorTecnico, fueraDeAlcance, mensaje, titulo, respuesta, pasos, dificultad, tiempo, resultado, terminos, familias }) => {
        finalizar();

        if (errorTecnico && fueCancelado()) {
          contenido.innerHTML = `
            <p class="cs-ia-modal-spinner" aria-hidden="true">🤔</p>
            <p class="cs-ia-modal-texto">Búsqueda cancelada. Puedes intentarlo de nuevo cuando quieras.</p>
          `;
          return;
        }
        if (errorTecnico) {
          // A petición de Eloy: distinto de "no hay solución" — aquí sí
          // tiene sentido un botón de reintentar directo, porque el
          // modal ya está abierto y el usuario no ha perdido nada al
          // esperar.
          contenido.innerHTML = `
            <p class="cs-ia-modal-spinner" aria-hidden="true">🔄</p>
            <p class="cs-ia-modal-texto">Ha habido un problema al consultar con nuestro asistente — no es que no exista una solución, es un fallo puntual.</p>
            <button type="button" class="btn-primary" id="cs-ia-reintentar" style="margin-top:14px;">Reintentar</button>
          `;
          const btnReintentar = $('#cs-ia-reintentar');
          if (btnReintentar) btnReintentar.addEventListener('click', () => pedirAyudaIAModal(texto));
          return;
        }
        if (fueraDeAlcance) {
          contenido.innerHTML = `
            <p class="cs-ia-modal-spinner" aria-hidden="true">⚠️</p>
            <p class="cs-hero__buscador-aviso">${mensaje || 'Este asistente solo puede ayudarte con productos y soluciones de droguería, perfumería, pintura, limpieza del hogar y talleres/carrocerías.'}</p>
          `;
          return;
        }
        if (solucion) {
          window.location.href = urlSolucion(solucion.slug);
          return;
        }
        if (titulo || respuesta || (pasos && pasos.length) || (terminos && terminos.length)) {
          // Se guarda lo ya obtenido para que la página dinámica no
          // tenga que volver a preguntarle a la IA lo mismo dos veces.
          try {
            sessionStorage.setItem(`cs_ia_${texto}`, JSON.stringify({ titulo, respuesta, pasos, dificultad, tiempo, resultado, terminos, familias }));
          } catch (e) { /* almacenamiento no disponible, no es crítico */ }
          window.location.href = `soluciones/solucion-ia.html?q=${encodeURIComponent(texto)}`;
          return;
        }
        // Bug real detectado por Eloy ("pintar paredes" -> "no hemos
        // encontrado nada" pese a ser un caso obvio con muchos
        // productos reales): si la IA no da NINGÚN dato aprovechable
        // (ni guía, ni título/respuesta/pasos/términos), antes se
        // rendía aquí mismo sin más — a diferencia de la búsqueda
        // automática del hero, que SÍ probaba una búsqueda de productos
        // con el texto tal cual como último recurso. Se aplica ahora el
        // mismo último intento aquí, antes de decir que no hay nada.
        D.buscarProductosEnCatalogo(texto).then((productos) => {
          if (productos.length) {
            try {
              sessionStorage.setItem(`cs_ia_${texto}`, JSON.stringify({
                titulo: `Productos para: ${texto}`, respuesta: '', pasos: [],
                dificultad: '', tiempo: '', resultado: '', terminos: [texto], familias: [],
              }));
            } catch (e) { /* no crítico */ }
            window.location.href = `soluciones/solucion-ia.html?q=${encodeURIComponent(texto)}`;
            return;
          }
          contenido.innerHTML = `
            <p class="cs-ia-modal-spinner" aria-hidden="true">🤔</p>
            <p class="cs-ia-modal-texto">No hemos encontrado ninguna solución para "<strong>${texto}</strong>". Prueba a contárnoslo con otras palabras, o llámanos y te ayudamos directamente.</p>
          `;
        });
      });
    }

    // A petición de Eloy: el botón "Ver la solución completa, paso a
    // paso" (que aparece bajo una respuesta de IA ya mostrada en el
    // buscador del hero) también tiene que avisar con un modal antes de
    // saltar de página — antes era un enlace normal sin ningún aviso.
    // A diferencia de pedirAyudaIAModal, aquí NO hace falta volver a
    // preguntarle a la IA: los datos ya se tienen de la respuesta que
    // se acaba de mostrar, así que el modal solo sirve de transición
    // visual breve mientras se guardan en sessionStorage y se navega.
    function irASolucionCompletaConDatos(texto, datos) {
      const overlay = $('#cs-ia-modal-overlay');
      const contenido = $('#cs-ia-modal-contenido');
      if (!overlay || !contenido) {
        window.location.href = `soluciones/solucion-ia.html?q=${encodeURIComponent(texto)}`;
        return;
      }
      contenido.innerHTML = `
        <p class="cs-ia-modal-spinner" aria-hidden="true"><img src="assets/logos/apple-touch-icon.png" alt="IA" class="cs-icono-ia"></p>
        <p class="cs-ia-modal-texto">Preparando la solución completa…</p>
      `;
      overlay.style.display = 'flex';
      try {
        sessionStorage.setItem(`cs_ia_${texto}`, JSON.stringify(datos));
      } catch (e) { /* almacenamiento no disponible, no es crítico */ }
      window.location.href = `soluciones/solucion-ia.html?q=${encodeURIComponent(texto)}`;
    }

    function cerrarModalIA() {
      const overlay = $('#cs-ia-modal-overlay');
      if (overlay) overlay.style.display = 'none';
      // A petición de Eloy (mismo patrón de buscador.html): cerrar el
      // modal por cualquier vía (X, click fuera, Escape, "atrás" del
      // navegador) cancela también la petición en curso, si la hay —
      // nunca se deja una llamada a la IA viva en segundo plano sin que
      // el usuario lo sepa.
      if (cancelarModalIAEnCurso) cancelarModalIAEnCurso();
    }

    (function wireModalIACierre() {
      const overlay = $('#cs-ia-modal-overlay');
      const btnCerrar = $('#cs-ia-modal-cerrar');
      if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalIA);
      if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrarModalIA(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModalIA(); });

      // A petición de Eloy: al pulsar "atrás" en el navegador justo
      // después de que el modal redirigiera a una solución, el modal
      // volvía a aparecer abierto (con su último estado, normalmente
      // el spinner de "Preguntando a la IA…") en vez de mostrar
      // limpiamente los resultados de búsqueda que ya había debajo.
      // Causa real: el navegador puede restaurar la página
      // EXACTAMENTE como estaba en el instante de navegar fuera
      // (bfcache) — y ese instante era justo cuando el modal seguía
      // abierto, a medio redirigir. "pageshow" se dispara tanto en
      // cargas normales como en restauraciones desde bfcache — cerrar
      // el modal aquí siempre es inofensivo (si ya estaba cerrado, no
      // cambia nada visible) y cubre el caso real sin depender de que
      // el navegador marque event.persisted exactamente como cabría
      // esperar en todos los casos.
      window.addEventListener('pageshow', cerrarModalIA);
    })();

    // Botón "pedir ayuda a la IA" bajo demanda — se añade al final de
    // los resultados curados/combinados cuando estos existen pero
    // pueden ser flojos para consultas raras. Nunca se lanza la llamada
    // a la IA sola con solo mostrar resultados normales; hace falta que
    // el propio cliente lo pida, para no gastar en cada búsqueda que ya
    // tiene un resultado razonable. Abre el modal en vez de insertar
    // contenido bajo los resultados — ver pedirAyudaIAModal.
    function wireBotonPedirIA(texto) {
      const boton = $('#cs-hero-pedir-ia');
      if (!boton) return;
      boton.addEventListener('click', () => pedirAyudaIAModal(texto));
    }

    function mostrarResultadosBusquedaHero(encontradas, texto, fichaDirecta, esSugerenciaIA) {
      const bloqueFicha = fichaDirecta ? `
        <div class="cs-hero__ficha-directa">
          <span aria-hidden="true">📋</span>
          <div>
            <strong>Ficha técnica de fabricante:</strong> ${fichaDirecta.nombre}
            <a href="${fichaDirecta.fichaTecnica}" target="_blank" rel="noopener" class="cs-hero__buscador-chip" style="margin-left:10px;">Abrir PDF →</a>
          </div>
        </div>
      ` : '';
      // Cuando el resultado viene de la búsqueda inteligente con IA (ver
      // buscarSolucionIA) en vez del motor de palabras clave habitual, se
      // avisa de forma transparente — mismo criterio de honestidad que ya
      // se aplica en el asistente de diagnóstico (nunca simular una
      // coincidencia segura que en realidad no lo es).
      const contador = esSugerenciaIA
        ? `<p class="cs-hero__buscador-contador"><img src="assets/logos/apple-touch-icon.png" alt="IA" class="cs-icono-ia"> Sugerido por IA para "${texto}" — no es una coincidencia exacta de palabras, pero puede ser lo que buscas:</p>`
        : (encontradas.length
          ? `<p class="cs-hero__buscador-contador">${encontradas.length} ${encontradas.length === 1 ? 'solución encontrada' : 'soluciones encontradas'} para "${texto}"</p>`
          : (fichaDirecta ? `<p class="cs-hero__buscador-contador">No hay una guía específica para "${texto}", pero sí la ficha técnica del producto:</p>` : ''));
      resultados.innerHTML = `
        ${bloqueFicha}
        ${contador}
        <div class="cs-hero__buscador-lista">
          ${encontradas.map((s) => {
            const area = D.areas.find((a) => a.id === s.category);
            const emoji = area ? area.emoji : '🛠️';
            return `<a class="cs-hero__buscador-chip" href="${urlSolucion(s.slug)}"><span aria-hidden="true">${emoji}</span> ${s.title}</a>`;
          }).join('')}
        </div>
        ${esSugerenciaIA ? '' : `
          <button type="button" class="cs-hero__pedir-ia" id="cs-hero-pedir-ia"><img src="assets/logos/apple-touch-icon.png" alt="IA" class="cs-icono-ia"> ¿No es esto lo que buscabas? Pregunta a nuestra IA</button>
        `}
      `;
      resultados.style.display = 'block';
    }

    // Búsqueda en vivo mientras se escribe (a partir de las primeras
    // letras), además de al pulsar Intro o tocar la lupa. Se espera un
    // pequeño instante tras cada tecla (debounce) para no relanzar la
    // búsqueda en cada pulsación — solo cuando la persona hace una
    // pausa al escribir — y no se busca con un único carácter (demasiado
    // ruidoso, casi cualquier solución tendría alguna coincidencia).
    const MIN_CARACTERES_BUSQUEDA_VIVA = 2;
    const RETRASO_BUSQUEDA_VIVA_MS = 250;
    // A petición de Eloy: "conforme te pones a escribir salta la modal
    // de la IA" — el filtro curado (barato, solo palabras clave) se
    // sigue actualizando con cada tecla tras un respiro corto (250ms),
    // pero la llamada automática a la IA (que ahora abre un modal, más
    // intrusivo que el simple texto de antes) NO debe dispararse solo
    // porque en un instante intermedio de la escritura no haya nada
    // curado todavía — eso pasa constantemente mientras se teclea
    // letra a letra. La IA automática solo se dispara en dos casos: (a)
    // el usuario confirma explícitamente con Enter/lupa, o (b) ha
    // pasado una pausa bastante más larga sin teclear nada (ver
    // RETRASO_IA_AUTOMATICA_MS), señal de que probablemente ha
    // terminado de escribir su búsqueda.
    const RETRASO_IA_AUTOMATICA_MS = 1400;
    let temporizadorBusqueda = null;
    let temporizadorIAAutomatica = null;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // e.isComposing evita cortar una letra con tilde/acento a
        // medio componer (p. ej. en algunos teclados "á" se compone en
        // dos pulsaciones) — sin esto, pulsar Enter justo después de
        // una vocal acentuada podía capturar el valor del campo un
        // instante ANTES de que esa última letra terminara de
        // insertarse (bug real detectado: una búsqueda de "limpiar
        // sofá" llegaba a la IA como "limpiar sof", sin la á). El
        // setTimeout(…, 0) da un respiro adicional a la siguiente
        // vuelta del bucle de eventos por si el navegador aún no ha
        // terminado de actualizar input.value en ese mismo instante.
        if (e.isComposing) return;
        clearTimeout(temporizadorBusqueda);
        clearTimeout(temporizadorIAAutomatica);
        setTimeout(() => ejecutarBusqueda(true), 0);
      }
    });
    input.addEventListener('input', () => {
      btnLimpiar.style.display = input.value ? 'flex' : 'none';
      clearTimeout(temporizadorBusqueda);
      clearTimeout(temporizadorIAAutomatica);
      if (input.value.trim().length < MIN_CARACTERES_BUSQUEDA_VIVA) {
        resultados.style.display = 'none';
        resultados.innerHTML = '';
        return;
      }
      // Filtro curado en vivo — NUNCA dispara la IA automáticamente
      // (esConfirmacion=false), solo actualiza resultados por palabras
      // clave, que es barato e instantáneo.
      temporizadorBusqueda = setTimeout(() => ejecutarBusqueda(false), RETRASO_BUSQUEDA_VIVA_MS);
      // Si tras una pausa bastante más larga el usuario sigue sin haber
      // tecleado nada más, SÍ se considera una confirmación implícita —
      // ahí es donde puede llegar a abrirse el modal de la IA si no hay
      // nada curado.
      temporizadorIAAutomatica = setTimeout(() => ejecutarBusqueda(true), RETRASO_IA_AUTOMATICA_MS);
    });
    if (btnLupa) btnLupa.addEventListener('click', () => { clearTimeout(temporizadorBusqueda); clearTimeout(temporizadorIAAutomatica); ejecutarBusqueda(true); });
    if (btnLimpiar) btnLimpiar.addEventListener('click', () => { clearTimeout(temporizadorBusqueda); clearTimeout(temporizadorIAAutomatica); limpiar(); });
  }

  // ── "Tengo un problema" ─────────────────────────────────────────────────
  function renderProblemas() {
    const chips = $('#cs-problem-chips');
    if (chips) {
      // Antes era un único bloque plano con más de 50 botones seguidos —
      // demasiado grande y difícil de escanear. Se agrupan por la misma
      // categoría que usa "Explora por áreas" (la de la solución a la
      // que apunta cada chip), en bloques plegables cerrados por
      // defecto, con el emoji de la categoría antepuesto a cada chip
      // para asociarlo de un vistazo con el tipo de problema.
      const grupos = new Map(); // categoryId -> array de chips
      D.problemasFrecuentes.forEach((p) => {
        const sol = D.soluciones[p.solutionSlug];
        const catId = (sol && sol.category) || 'otro';
        if (!grupos.has(catId)) grupos.set(catId, []);
        grupos.get(catId).push(p);
      });

      chips.innerHTML = D.areas
        .filter((a) => grupos.has(a.id))
        .map((a) => {
          const chipsGrupo = grupos.get(a.id);
          return `
            <details class="cs-problem-grupo">
              <summary class="cs-problem-grupo__titulo">
                <span>${a.emoji} ${a.label}</span>
                <span class="cs-problem-grupo__contador">${chipsGrupo.length}</span>
              </summary>
              <div class="cs-problem-grupo__chips">
                ${chipsGrupo.map((p) => `
                  <button type="button" class="cs-chip" data-problema="${p.id}"><span aria-hidden="true">${a.emoji}</span> ${p.label}</button>
                `).join('')}
              </div>
            </details>
          `;
        }).join('');
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
        const { problemaDetectado, solutionSlug, todasLasSoluciones } = D.diagnosticarPorTexto(texto);
        mostrarDiagnosticoSimulado(problemaDetectado, solutionSlug, texto, todasLasSoluciones);
      });
    }

    function mostrarDiagnosticoSimulado(problemaLabel, slug, textoOriginal, todasLasSoluciones) {
      if (!resultado) return;

      // Lista de soluciones a mostrar: si el diagnóstico por texto libre
      // encontró varias guías que encajan (p. ej. buscar "moho" a secas
      // coincide con la guía de junta, la de limpieza general y la de
      // antes de pintar), se muestran TODAS — antes solo se ofrecía la
      // primera y el resto quedaba oculto. El clic directo en un chip
      // sigue mostrando solo esa guía concreta (es una selección
      // explícita de un caso ya identificado, no una búsqueda a ciegas).
      const soluciones = (todasLasSoluciones && todasLasSoluciones.length)
        ? todasLasSoluciones.filter((s) => D.soluciones[s.solutionSlug])
        : (slug && D.soluciones[slug] ? [{ problemaDetectado: problemaLabel, solutionSlug: slug }] : []);

      if (soluciones.length) {
        const varias = soluciones.length > 1;
        resultado.innerHTML = `
          <p class="cs-diagnostico-resultado__titulo">${varias ? `✅ Hemos encontrado ${soluciones.length} soluciones relacionadas` : '✅ Hemos identificado tu problema'}</p>
          ${varias ? '' : `<p><strong>Problema:</strong> ${soluciones[0].problemaDetectado}</p>`}
          <div class="cs-diagnostico-resultado__lista">
            ${soluciones.map((s) => {
              const sol = D.soluciones[s.solutionSlug];
              return `
                <div class="cs-diagnostico-resultado__item">
                  <p>${varias ? `<strong>${s.problemaDetectado}</strong><br>` : ''}Te recomendamos seguir la solución <strong>"${sol.title}"</strong> — incluye el diagnóstico completo, los pasos a seguir y los productos que necesitas.</p>
                  <a class="btn-primary" href="${urlSolucion(s.solutionSlug)}">Ver la solución completa</a>
                </div>
              `;
            }).join('')}
          </div>
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
    const precioReal = p.mostrar_precio && p.precio_con;
    const precio = precioReal ? `${p.precio_con} €` : 'Consultar precio y disponibilidad';
    const precioClass = precioReal ? 'cs-producto-card__precio' : 'cs-producto-card__precio cs-producto-card__precio--consultar';
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
        <div class="${precioClass}">${precio}</div>
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

  const BUSQUEDAS_SUGERIDAS = {
    'Abonar de forma regular': 'abono',
    'Abonar las plantas del jardín': 'abono',
    'Acabado y protección': 'barniz',
    'Aclarar con agua abundante': 'desatascador',
    'Actuar cuanto antes': 'quitamanchas',
    'Ajustar el pH': 'pH menos',
    'Ajustar el pH del agua': 'incrementador pH',
    'Alisar el cordón': 'alisador silicona',
    'Aplicación de la primera mano': 'rodillo epoxi',
    'Aplicar cebo en gel': 'cebo cucarachas',
    'Aplicar el abrillantador': 'abrillantador',
    'Aplicar el cordón de adhesivo': 'pegamento cristal',
    'Aplicar el esmalte': 'esmalte',
    'Aplicar el quitamanchas': 'quitamanchas',
    'Aplicar el revestimiento antigoteras': 'antigoteras',
    'Aplicar la antigravilla': 'antigravilla',
    'Aplicar la silicona': 'silicona',
    'Barnizado': 'barniz',
    'Barnizar un suelo de madera': 'barniz suelo',
    'Barnizar una mesa': 'barniz madera',
    'Cambiar el color': 'tinte madera',
    'Recuperar una superficie deteriorada': 'barniz madera',
    'Clorar': 'cloro',
    'Clorar correctamente la piscina': 'cloro piscina',
    'Colocar el cebo': 'raticida',
    'Colocar la luna': 'pegamento parabrisas',
    'Colocar protección antipolilla': 'antipolillas',
    'Confirmar al día siguiente': 'cloro',
    'Conseguir acabado brillante': 'barniz brillante',
    'Convertidor de óxido': 'convertidor óxido',
    'Cuidar plantas de interior': 'abono plantas',
    'Curado antes de poner en servicio': 'pintura epoxi',
    'Curar heridas de poda': 'pasta cicatrizante',
    'Cómo abonar y cuidar las plantas del jardín': 'abono jardín',
    'Cómo abrillantar un suelo de mármol o terrazo': 'abrillantador',
    'Cómo eliminar cucarachas y hormigas de la cocina': 'insecticida',
    'Cómo eliminar ratones y roedores': 'raticida',
    'Cómo eliminar una mancha de la ropa': 'quitamanchas',
    'Cómo eliminar óxido del metal': 'antióxido',
    'Cómo equilibrar y mantener el agua de la piscina': 'cloro piscina',
    'Cómo impermeabilizar una terraza con goteras': 'impermeabilizante',
    'Cómo pintar el suelo del garaje con epoxi': 'pintura suelo',
    'Cómo pintar plástico de coche | Guía paso a paso – Orencio Matas': 'pintura plástico',
    'Cómo pintar una fachada exterior': 'pintura fachada',
    'Cómo pintar una llanta': 'pintura llantas',
    'Cómo pintar una pared por dentro': 'pintura pared',
    'Cómo pintar una pieza de plástico de un coche': 'pintura plástico',
    'Cómo proteger la ropa de las polillas': 'antipolillas',
    'Cómo proteger los bajos del coche con antigravilla': 'antigravilla',
    'Cómo quitar ara\u00f1azos y recuperar el brillo del coche | Orencio Matas': 'pasta pulir',
    'Cómo restaurar un mueble de madera': 'barniz madera',
    'Cómo sellar o pegar una luna de coche': 'pegamento parabrisas',
    'Cómo sellar una junta de baño o cocina': 'silicona',
    'Decapado del barniz antiguo': 'decapante',
    'Dejar actuar': 'quitamanchas',
    'Dejar curar antes de exponer a agua': 'antigoteras',
    'Dejar secar antes de rodar': 'antigravilla',
    'Descontaminación': 'arcilla descontaminante',
    'Desengrasar piezas': 'desengrasante',
    'Desengrasar una pieza': 'desengrasante',
    'Elegir el pegamento según el material': 'pegamento',
    'Elegir el tipo de esmalte': 'esmalte',
    'Eliminación mecánica del óxido': 'lija',
    'Eliminar adhesivos': 'quita adhesivos',
    'Eliminar algas': 'antialgas',
    'Eliminar barniz': 'decapante',
    'Eliminar grasa': 'quita grasas',
    'Eliminar hologramas': 'pulimento',
    'Eliminar marcas de lijado': 'pulimento',
    'Eliminar mosquitos': 'antimosquitos',
    'Eliminar pintura': 'milagrito',
    'Enmascarar zonas sensibles': 'cinta carrocero',
    'Esperar el resultado': 'insecticida',
    'Evaluación de la profundidad': 'medidor espesor',
    'Guardar en fundas cerradas': 'fundas ropa',
    'Identificar el tipo de atasco': 'desatascador',
    'Identificar el tipo de mancha': 'quitamanchas',
    'Imprimación / aparejo': 'imprimación',
    'Imprimación antioxidante': 'imprimación metal',
    'Imprimirar': 'imprimación',
    'Imprimirar si hace falta': 'imprimación',
    'Imprimirar si hay corrosión': 'imprimación',
    'Invernar la piscina': 'invernador',
    'Lavar antes de guardar': 'detergente',
    'Lavar y comprobar': 'quitamanchas',
    'Lijado': 'lija',
    'Limpiar brochas': 'aguarras',
    'Limpiar herramientas': 'desengrasante',
    'Limpiar maquinaria': 'desengrasante',
    'Limpiar y secar la junta': 'limpiador',
    'Limpieza': 'limpiador coche',
    'Limpieza a fondo': 'limpiador',
    'Limpieza del marco y el cristal': 'limpiador cristal',
    'Limpieza previa': 'limpiador',
    'Limpieza y desengrasado': 'desengrasante',
    'Localizar el punto de entrada': 'insecticida',
    'Localizar el recorrido': 'raticida',
    'Medir pH y cloro': 'medidor pH',
    'Mezcla del sistema bicomponente': 'pintura epoxi',
    'Método mecánico si persiste': 'desatascador',
    'Pegar césped artificial': 'cinta cesped',
    'Pegar una tubería de PVC': 'pegamento PVC',
    'Pintar aluminio': 'oxiron',
    'Pintar azulejos': 'esmalte azulejos',
    'Pintar hierro': 'antioxidante',
    'Pintar estructuras metálicas': 'oxiron',
    'Pintar estufas': 'pintura anticalorica',
    'Pintar madera barnizada': 'barniz madera',
    'Pintar radiadores': 'anticalorica',
    'Pintar superficies difíciles': 'pintura plástica',
    'Pintar tubos de salida de humos': 'pintura anticalorica',
    'Pintar una llanta': 'llantas',
    'Pintura': 'pintura',
    'Preparación de la superficie': 'imprimación',
    'Preparar la piscina para el verano': 'cloro piscina',
    'Preparar la superficie': 'imprimación',
    'Preparar metal antes de pintar': 'imprimacion antioxidante',
    'Preparar una superficie': 'multiusos',
    'Prevenir algas': 'algicida',
    'Primera mano': 'pintura plástica',
    'Promotor de adherencia': 'imprimación',
    'Protección': 'cera coche',
    'Proteger la zona': 'cinta carrocero',
    'Proteger las plantas de insectos': 'insecticida plantas',
    'Proteger los bordes (opcional)': 'cinta carrocero',
    'Proteger madera exterior': 'lasur madera',
    'Proteger metal': 'antioxidante',
    'Prueba en una zona pequeña': 'abrillantador',
    'Pulido': 'pasta pulir',
    'Quitar adhesivos': 'quita adhesivos',
    'Quitar restos de cola': 'quita adhesivos',
    'Quitar moho de una junta de silicona': 'limpiador moho',
    'Quitar silicona': 'acetona',
    'Reforzar con barrera': 'insecticida',
    'Reforzar con trampas': 'raticida',
    'Reforzar puntos críticos': 'antigoteras',
    'Reparación de desperfectos': 'masilla madera',
    'Reparación de grietas y desconchones': 'masilla suelo',
    'Reparar grietas en el suelo': 'epoxi suelos',
    'Repetir periódicamente': 'abrillantador',
    'Reponer el antipolilla': 'antipolillas',
    'Respetar el tiempo de actuación': 'desatascador',
    'Respetar el tiempo de curado': 'pegamento parabrisas',
    'Restaurar faros': 'faros',
    'Retirar la cinta': 'cinta carrocero',
    'Retirar la cinta y dejar curar': 'cinta carrocero',
    'Retirar la silicona vieja': 'quita silicona',
    'Revisar periódicamente': 'antipolillas',
    'Revisar y reponer': 'raticida',
    'Secado completo': 'secador',
    'Segunda mano': 'pintura plástica',
    'Segunda mano cruzada': 'rodillo epoxi',
    'Sellar grietas puntuales': 'silicona',
    'Sellar las entradas': 'silicona',
    'Sellar una ventana o marco': 'silicona',
    'Tratar hongos': 'fungicida',
    'Tratar insectos si aparecen': 'insecticida',
    'Acabar con las hormigas': 'hormigas',
    'Evitar que vuelvan los insectos': 'insecticida',
    'Tratar un hongo en las plantas': 'fungicida',
    'Verter el desatascador': 'desatascador',
    'Vigilar signos de plaga': 'insecticida',
  };

  function urlBuscarEjemplo(areaId, titulo) {
    const areaMap = {
      coche: 'talleres', pintura: 'pinturas', madera: 'pinturas', metal: 'pinturas',
      limpieza: 'drogueria', pegado: 'pinturas', suelos: 'pinturas', piscinas: 'drogueria',
      plagas: 'drogueria', jardin: 'drogueria',
    };
    const fallbackArea = {
      coche: 'productos coche', pintura: 'pintura', madera: 'barniz madera', metal: 'antioxidante',
      limpieza: 'limpieza', pegado: 'pegamento', suelos: 'pintura suelos', piscinas: 'piscina',
      plagas: 'plagas', jardin: 'abono',
    };
    let area = areaMap[areaId] || '';
    let q = BUSQUEDAS_SUGERIDAS[titulo] || fallbackArea[areaId] || titulo;
    // Algunos productos (p. ej. acetona) están en otra área distinta a la lógica del desplegable.
    if (titulo === 'Quitar silicona') area = 'pinturas';
    return area ? `buscador.html?q=${encodeURIComponent(q)}&area=${area}` : `buscador.html?q=${encodeURIComponent(q)}`;
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
            ${ejemplos.map((ej) => {
              if (ej.solutionSlug) {
                return `<a href="${urlSolucion(ej.solutionSlug)}">${resaltarCoincidencia(ej.title, consulta)}</a>`;
              }
              // Ejemplos sin guía preparada: redirigir al buscador con el título
              // como criterio de búsqueda y el área correspondiente filtrada.
              return `<a href="${urlBuscarEjemplo(area.id, ej.title)}">${resaltarCoincidencia(ej.title, consulta)}</a>`;
            }).join('')}
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

  // ── Asistente de diagnóstico (wizard de pasos dinámicos) ────────────────
  const wizardState = { accion: null, superficie: null, estado: null, resultado: null, uso: null, tamano: null, pasoActual: 0 };

  function esAccionSimple(id) { return ['limpiar', 'proteger', 'pegar'].includes(id); }

  function wizardPasos() {
    const base = [
      { key: 'accion',     label: 'Paso 1', pregunta: '¿Qué quieres hacer?',    opciones: () => D.acciones.map((a) => ({ id: a.id, label: a.label, emoji: a.emoji })) },
      { key: 'superficie', label: 'Paso 2', pregunta: '¿Sobre qué superficie?', opciones: () => D.superficies.map((s) => ({ id: s.id, label: s.label, emoji: s.emoji })) },
    ];
    if (esAccionSimple(wizardState.accion)) {
      return [...base,
        { key: 'uso',   label: 'Paso 3', pregunta: '¿Dónde lo vas a usar?', opciones: () => D.usos.map((u) => ({ id: u.id, label: u.label })) },
        { key: 'tamano',label: 'Paso 4', pregunta: '¿Qué extensión tiene?', opciones: () => D.tamanos.map((t) => ({ id: t.id, label: t.label })) },
      ];
    }
    return [...base,
      { key: 'estado',    label: 'Paso 3', pregunta: '¿Cómo está actualmente?', opciones: () => D.estados.map((e) => ({ id: e.id, label: e.label })) },
      {
        key: 'resultado', label: 'Paso 4', pregunta: '¿Qué resultado quieres?',
        opciones: () => D.resultados.filter((r) => {
          // Si la superficie está sin pintar, no se puede "cambiar el color" (no hay color previo).
          if (wizardState.estado === 'sin_pintar' && r.id === 'cambiar_color') return false;
          return true;
        }).map((r) => ({ id: r.id, label: r.label })),
      },
    ];
  }

  function abrirWizard(opts) {
    const modal = $('#cs-wizard-modal');
    if (!modal) return;
    wizardState.accion = (opts && opts.accionInicial) || null;
    wizardState.superficie = (opts && opts.superficieInicial) || null;
    wizardState.estado = null;
    wizardState.resultado = null;
    wizardState.uso = null;
    wizardState.tamano = null;
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
    const pasos = wizardPasos();
    const paso = pasos[wizardState.pasoActual];
    const cont = $('#cs-wizard-contenido');
    if (!paso) {
      renderResultadoWizard();
      return;
    }

    const progreso = $('#cs-wizard-progress');
    if (progreso) {
      progreso.innerHTML = pasos.map((_, i) => `<span class="${i <= wizardState.pasoActual ? 'is-done' : ''}"></span>`).join('');
    }

    const valorActual = wizardState[paso.key];
    cont.innerHTML = `
      <p class="cs-wizard__step-label">${paso.label} de ${pasos.length}</p>
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
    const pasos = wizardPasos();
    const slug = esAccionSimple(wizardState.accion)
      ? D.encontrarSolucionPorDiagnostico(wizardState.accion, wizardState.superficie)
      : D.encontrarSolucionPorDiagnostico(wizardState.accion, wizardState.superficie, wizardState.estado, wizardState.resultado);
    const cont = $('#cs-wizard-contenido');

    const progreso = $('#cs-wizard-progress');
    if (progreso) progreso.innerHTML = pasos.map(() => '<span class="is-done"></span>').join('');

    if (!slug || !D.soluciones[slug]) {
      // Combinación sin una guía específica todavía — se busca en el catálogo
      // con lo que sabemos: acción + superficie (+ uso/tamaño para acciones simples).
      const accionLabel = (D.acciones.find((a) => a.id === wizardState.accion) || {}).label || '';
      const superficieLabel = (D.superficies.find((s) => s.id === wizardState.superficie) || {}).label || '';
      const partes = [accionLabel, superficieLabel];
      if (esAccionSimple(wizardState.accion)) {
        const usoLabel = (D.usos.find((u) => u.id === wizardState.uso) || {}).label;
        if (usoLabel) partes.push(usoLabel);
      }
      const textoAproximado = partes.filter(Boolean).join(' ');

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
        wizardState.pasoActual = wizardPasos().length - 1;
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
    wireBuscadorHero();
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
