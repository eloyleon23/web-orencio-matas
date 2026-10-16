// ── Analítica del Centro de Soluciones (Fase 3) ─────────────────────────
//
// Capa central de registro de eventos — a propósito, el resto del Centro
// de Soluciones (centro-soluciones.js, solucion-detalle.js, solucion-ia.js)
// solo debe llamar a window.CentroSolucionesAnalytics.trackXxx(...), sin
// conocer nada de Supabase. Esto permite cambiar la implementación más
// adelante sin tocar el resto de la aplicación (petición expresa del
// documento de analítica, sección 27).
//
// MISMO patrón ya aprobado y en producción en buscador.html
// (registrarEventoBusqueda_ — ver ese archivo para el original), MISMAS
// tablas de Supabase, ampliadas en vez de sustituidas (ver
// supabase/03_fase3_centro_soluciones.sql). Tres reglas que no deben
// romperse nunca al tocar esto (idénticas a las de buscador.html):
//   1. Nunca bloquea ni ralentiza el Centro de Soluciones — "fire-and-
//      forget", sin await desde quien llama, y un fallo aquí nunca debe
//      propagarse ni mostrarse al usuario.
//   2. Nunca guarda PII — session_id es anónimo (mismo id que ya usa
//      buscador.html, ver idSesionAnalitica_ más abajo), y los campos de
//      texto libre (consulta, motivo de feedback) se truncan para evitar
//      que alguien pegue algo desproporcionado por error.
//   3. event_type es texto libre a propósito (prefijo CS_) — añadir un
//      tipo nuevo no exige ninguna migración.
//
// Si SUPABASE_URL/SUPABASE_ANON_KEY no están configuradas (o el proyecto
// decide desactivar esto en algún momento), todas las funciones son no-op
// — el Centro de Soluciones funciona exactamente igual.
(function () {
  const TABLA_EVENTOS = 'search_events';
  const TABLA_PRODUCTOS = 'search_event_products';
  const LONGITUD_MAX_TEXTO_LIBRE = 300;

  function supabaseActivo_() {
    return !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY);
  }

  // Mismo id de sesión anónimo que ya usa buscador.html (misma clave de
  // localStorage, a propósito): así una misma visita se puede seguir de
  // una página a otra del sitio sin inventar un segundo identificador.
  function idSesionAnalitica_() {
    const CLAVE = 'omAnaliticaSesionId';
    try {
      let id = localStorage.getItem(CLAVE);
      if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2)));
        localStorage.setItem(CLAVE, id);
      }
      return id;
    } catch (e) {
      return 'sin-persistencia-' + Date.now().toString(36);
    }
  }

  function tipoDispositivoAnalitica_() {
    const ua = (navigator.userAgent || '').toLowerCase();
    if (/ipad|tablet/.test(ua)) return 'tablet';
    if (/mobi|iphone|android/.test(ua)) return 'mobile';
    return 'desktop';
  }

  function nuevoId_() {
    return crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
  }

  // Recorta cualquier texto libre que pueda acabar en una columna —
  // nunca se bloquea ni se avisa al usuario por esto, simplemente se
  // guarda recortado (sección 22 del documento: "revisar qué campos
  // pueden acabar almacenándose y evitar guardar información que no sea
  // necesaria").
  function recortar_(texto) {
    if (!texto) return texto;
    const t = String(texto);
    return t.length > LONGITUD_MAX_TEXTO_LIBRE ? t.slice(0, LONGITUD_MAX_TEXTO_LIBRE) : t;
  }

  // POST fire-and-forget a una tabla de Supabase — idéntico al patrón de
  // registrarEventoBusqueda_ en buscador.html: sin esperar respuesta,
  // keepalive (sobrevive a una navegación inmediata), nunca lanza ni deja
  // un error visible. Devuelve la promesa del propio fetch (sin relanzar
  // errores) SOLO para poder encadenar el insert de productos DESPUÉS de
  // que el evento padre exista de verdad en la tabla (evita una
  // violación de la referencia event_id -> search_events.id si llegaran
  // en otro orden) — quien llama nunca debe hacer await de esto.
  function insertar_(tabla, fila) {
    const url = window.SUPABASE_URL, key = window.SUPABASE_ANON_KEY;
    if (!url || !key) return Promise.resolve();
    try {
      return fetch(url.replace(/\/$/, '') + '/rest/v1/' + tabla, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(fila),
        keepalive: true,
      }).catch(() => {});
    } catch (e) {
      return Promise.resolve();
    }
  }

  // Un evento base, común a todos los tipos — los campos que no aplican
  // a un tipo concreto simplemente se mandan undefined y Supabase los
  // guarda como NULL (no hace falta "if" por cada combinación).
  function registrarEvento_(eventType, campos) {
    if (!supabaseActivo_()) return Promise.resolve(null);
    const id = nuevoId_();
    const fila = Object.assign({
      id,
      event_type: eventType,
      session_id: idSesionAnalitica_(),
      device_type: tipoDispositivoAnalitica_(),
      source_page: 'centro-soluciones',
    }, campos);
    return insertar_(TABLA_EVENTOS, fila).then(() => id);
  }

  // Productos asociados a un evento — SIEMPRE encadenado DESPUÉS del
  // insert del evento (ver el porqué en insertar_ más arriba). `role`
  // distingue qué papel tuvo cada producto en ESTE evento concreto:
  // 'presented' | 'viewed' | 'selected' | 'alternative_selected'.
  function registrarProductosEvento_(eventIdPromesa, role, productos, recommendationType) {
    if (!supabaseActivo_() || !productos || !productos.length) return;
    eventIdPromesa.then((eventId) => {
      if (!eventId) return;
      const filas = productos.map((p, i) => ({
        event_id: eventId,
        product_ref: p.ref || p.product_ref || '',
        product_name: recortar_(p.nombre || p.name || p.product_name || ''),
        role,
        position: (typeof p.position === 'number') ? p.position : i,
      })).filter((f) => f.product_ref);
      if (filas.length) insertar_(TABLA_PRODUCTOS, filas);
    });
  }

  // ── API pública — nombres alineados con el documento de analítica
  // (sección 27): el resto del Centro de Soluciones solo conoce estas
  // funciones, nunca los detalles de Supabase de arriba. ─────────────────
  const API = {

    // A. Búsquedas — cada búsqueda realizada en el Centro de Soluciones.
    // `source`: 'hero' | 'problema' | 'wizard' | 'area' | etc.
    trackSolutionSearch(query, source, resultCount) {
      registrarEvento_('CS_SOLUTION_SEARCH', {
        query_raw: recortar_(query),
        query_normalized: (window.SOLUCIONES_DATA && window.SOLUCIONES_DATA.normalizarTexto) ? window.SOLUCIONES_DATA.normalizarTexto(query) : null,
        interaction_source: source,
        result_count: (typeof resultCount === 'number') ? resultCount : null,
      });
    },

    // B. Solución seleccionada — el usuario entra en una guía existente.
    // Devuelve un interaction_id nuevo para encadenar los eventos que
    // sigan mientras se ve ESTA solución (productos, feedback...).
    trackSolutionSelected(slug, title, source) {
      const interactionId = nuevoId_();
      registrarEvento_('CS_SOLUTION_SELECTED', {
        solution_slug: slug,
        solution_title: recortar_(title),
        interaction_id: interactionId,
        interaction_source: source,
      });
      return interactionId;
    },

    // J/K. Solución dinámica generada por IA — se conserva el JSON
    // completo tal cual se usó para presentar la solución (nunca solo el
    // texto final). Devuelve un interaction_id nuevo, igual que
    // trackSolutionSelected, para encadenar lo que venga después.
    trackAiSolutionGenerated(query, datosGenerados) {
      const interactionId = nuevoId_();
      let json = null;
      try { json = datosGenerados ? JSON.parse(JSON.stringify(datosGenerados)) : null; } catch (e) { json = null; }
      registrarEvento_('CS_AI_SOLUTION_GENERATED', {
        query_raw: recortar_(query),
        query_normalized: (window.SOLUCIONES_DATA && window.SOLUCIONES_DATA.normalizarTexto) ? window.SOLUCIONES_DATA.normalizarTexto(query) : null,
        interaction_id: interactionId,
        interaction_source: 'ai',
        ai_generated_json: json,
      });
      return interactionId;
    },

    // E/F/H. Productos mostrados para una solución (recomendados,
    // alternativos, o los que trajo la IA) — `products`: [{ref, nombre}].
    // `recommendationSource`: 'structured' | 'alternative' | 'ai' | etc.
    trackProductsPresented(solutionSlug, interactionId, products, recommendationSource) {
      if (!products || !products.length) return;
      const eventIdPromesa = registrarEvento_('CS_PRODUCTS_PRESENTED', {
        solution_slug: solutionSlug,
        interaction_id: interactionId,
        interaction_source: recommendationSource,
      });
      registrarProductosEvento_(eventIdPromesa, 'presented', products, recommendationSource);
    },

    // Vista previa de un producto (modal de detalle) — más débil que una
    // selección real, pero útil para distinguir "lo miró" de "ni lo
    // miró" (sección 18 del documento: presented / viewed / selected).
    trackProductViewed(solutionSlug, interactionId, product, recommendationType) {
      if (!product || !product.ref) return;
      const eventIdPromesa = registrarEvento_('CS_PRODUCT_VIEWED', {
        solution_slug: solutionSlug,
        interaction_id: interactionId,
        interaction_source: recommendationType,
      });
      registrarProductosEvento_(eventIdPromesa, 'viewed', [product], recommendationType);
    },

    // G. Producto seleccionado — el usuario sigue adelante con ESTE
    // producto (click-through real al buscador/ficha, no solo una vista
    // previa). `recommendationType`: 'structured' | 'alternative' | 'ai'.
    trackProductSelected(solutionSlug, interactionId, product, recommendationType) {
      if (!product || !product.ref) return;
      const eventIdPromesa = registrarEvento_('CS_PRODUCT_SELECTED', {
        solution_slug: solutionSlug,
        interaction_id: interactionId,
        interaction_source: recommendationType,
      });
      registrarProductosEvento_(eventIdPromesa, 'selected', [product], recommendationType);
    },

    // I. El usuario pide más productos porque los que se le mostraron no
    // le convencen — `originalRefs`: referencias ya mostradas hasta ahora.
    trackMoreProductsRequested(solutionSlug, interactionId, originalRefs) {
      registrarEvento_('CS_MORE_PRODUCTS_REQUESTED', {
        solution_slug: solutionSlug,
        interaction_id: interactionId,
        original_recommended_refs: (originalRefs && originalRefs.length) ? originalRefs : null,
      });
    },

    // I (continuación). Qué producto ALTERNATIVO termina eligiendo tras
    // pedir "más productos" — permite comparar después "recomendamos A,
    // eligen B" (tasa de sustitución, sección 16 del documento).
    trackAlternativeProductSelected(solutionSlug, interactionId, originalRefs, product, position) {
      if (!product || !product.ref) return;
      const eventIdPromesa = registrarEvento_('CS_ALTERNATIVE_PRODUCT_SELECTED', {
        solution_slug: solutionSlug,
        interaction_id: interactionId,
        original_recommended_refs: (originalRefs && originalRefs.length) ? originalRefs : null,
      });
      registrarProductosEvento_(eventIdPromesa, 'alternative_selected', [Object.assign({ position }, product)], 'alternative');
    },

    // C. Feedback del usuario sobre una solución (reutiliza el widget
    // 👍/👎 que ya existe en solucion-ia.html — nunca se crea una segunda
    // experiencia de feedback, ver sección 6 del documento).
    trackFeedback(solutionSlug, interactionId, feedback, reason) {
      registrarEvento_('CS_SOLUTION_FEEDBACK', {
        solution_slug: solutionSlug,
        interaction_id: interactionId,
        feedback,
        feedback_reason: recortar_(reason),
      });
    },

    // Utilidad expuesta para quien necesite generar su propio
    // interaction_id fuera de los casos de arriba (poco frecuente).
    nuevoInteractionId: nuevoId_,
  };

  window.CentroSolucionesAnalytics = API;
})();
