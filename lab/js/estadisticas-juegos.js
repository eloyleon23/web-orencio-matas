/**
 * Estadísticas de juego — compartido por todos los minijuegos de lab/
 * Vanilla JS, sin dependencias. Cada minijuego llama a
 * `OMEstadisticasJuegos.registrarPartida('clave')` al empezar una
 * partida; el hub (lab/index.html) usa `leerContadores()` para
 * ordenar las tarjetas por frecuencia de juego. Se guarda en
 * localStorage (persiste entre sesiones del navegador, no solo
 * mientras la pestaña está abierta) para que el orden refleje el
 * uso real a lo largo del tiempo, no solo la visita actual.
 *
 * También cuenta las partidas jugadas en CUALQUIER juego (acumulado
 * entre todos) y, cada 8 partidas, muestra una modal invitando a
 * visitar el buscador — con un mensaje distinto cada vez, que no se
 * repite hasta agotar la lista. El contador se reinicia cada vez que
 * se muestra la modal. Requiere que la página cargue también
 * css/invitacion-buscador.css.
 *
 * Además, envía (solo en producción, igual que el resto del sitio —
 * ver gtag en el <head> de cada página) tres eventos para poder
 * evaluar qué juegos enganchan de verdad, tanto a Google Analytics
 * como al backend propio de Google Apps Script que alimenta las
 * gráficas de la modal de estadísticas (lab/js/estadisticas-admin.js
 * — ver scripts/estadisticas_juegos.gs para el propio backend):
 *   - "juego_inicio": cada vez que arranca una partida.
 *   - "juego_tiempo": el tiempo ACTIVO jugado en una partida (sin
 *     contar pausas ni ratos con la pestaña en segundo plano), al
 *     terminar la partida, al abandonar la página a medio jugar, o al
 *     reiniciar sin haber llegado a terminarla.
 *   - "conversion_buscador": al aceptar la modal de invitación al
 *     buscador — el objetivo de negocio real de todo el minijuego.
 */
(function () {
    'use strict';

    const CLAVE_ALMACEN = 'om_lab_juegos_jugados';
    const CLAVE_CONTADOR_INVITACION = 'om_lab_contador_invitacion';
    const CLAVE_INDICE_MENSAJE = 'om_lab_indice_mensaje_invitacion';
    const UMBRAL_INVITACION = 8;

    // ── Envío de eventos a GA4 ──────────────────────────────────────
    // gtag solo se define en producción (orenciomatas.es) — ver el
    // bloque "Google tag (gtag.js)" en el <head> de cada página. En
    // preproducción/local, window.gtag no existe y estos envíos se
    // ignoran sin más, así que no hace falta repetir aquí la
    // comprobación de dominio.
    function enProduccion_() {
        return typeof window.gtag === 'function';
    }

    function enviarEventoGA_(nombre, params) {
        if (!enProduccion_()) return;
        window.gtag('event', nombre, params);
    }

    // ── Envío de eventos al backend propio (hoja de cálculo) ─────────
    // Alimenta las gráficas nativas de la modal de estadísticas (ver
    // lab/js/estadisticas-admin.js) sin depender de ninguna
    // herramienta externa. Las acciones "registrar_evento_juego" y
    // "obtener_estadisticas_juegos" viven en el MISMO proyecto de
    // Apps Script que ya usa panel_admin.html (scripts/
    // apps_script_trigger.js, doPost) — por eso es la misma URL_BASE
    // que panel_admin.html, no una nueva.
    //
    // IMPORTANTE: tiene que ser una constante fija en el código (no
    // algo configurable por navegador vía localStorage, como se
    // intentó en un primer momento) — quien envía estos eventos es
    // cualquier visitante jugando en PRODUCCIÓN (orenciomatas.es),
    // mientras que la modal de administración solo se ve en
    // PREPRODUCCIÓN (github.io): son dos orígenes distintos, cada uno
    // con su propio localStorage, así que una URL guardada desde la
    // modal en preproducción nunca llegaría a producción.
    const URL_BACKEND_ESTADISTICAS = 'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec';

    // Mismo criterio de solo-producción que GA4; un fallo de red aquí
    // nunca debe interrumpir la partida.
    function enviarEventoBackend_(tipo, juego, segundos, motivo) {
        if (!enProduccion_()) return;
        const url = URL_BACKEND_ESTADISTICAS;
        if (!url) return;
        const payload = JSON.stringify({ accion: 'registrar_evento_juego', tipo, juego, segundos, motivo });
        try {
            if (navigator.sendBeacon) {
                // text/plain evita el preflight CORS, igual que el resto
                // de llamadas a Apps Script de este sitio — y sendBeacon
                // es el mecanismo pensado para envíos justo al
                // abandonar la página (pagehide).
                navigator.sendBeacon(url, new Blob([payload], { type: 'text/plain;charset=utf-8' }));
            } else {
                fetch(url, { method: 'POST', body: payload, keepalive: true }).catch(() => {});
            }
        } catch (err) {
            // Sin conexión, backend no configurado, etc. — se ignora.
        }
    }

    // ── Tiempo activo jugado por partida ─────────────────────────────
    // Un "tick" por segundo, solo mientras hay una partida en curso,
    // no está en pausa (registrarPausa/registrarReanudacion, que
    // llaman los pocos juegos con pausa propia) y la pestaña está
    // visible — así el tiempo reportado es tiempo de verdad jugando,
    // no tiempo con el juego simplemente abierto de fondo.
    const sesionTiempo = { juego: null, segundosActivos: 0 };
    let pausaManual = false;
    let intervaloTick = null;

    function tickActivo_() {
        if (!sesionTiempo.juego || pausaManual || document.hidden) return;
        sesionTiempo.segundosActivos += 1;
    }

    function cerrarSesionTiempo_(motivo) {
        if (!sesionTiempo.juego) return;
        if (sesionTiempo.segundosActivos >= 1) {
            const motivoFinal = motivo || 'fin_partida';
            enviarEventoGA_('juego_tiempo', {
                juego: sesionTiempo.juego,
                segundos: sesionTiempo.segundosActivos,
                motivo: motivoFinal,
            });
            enviarEventoBackend_('tiempo', sesionTiempo.juego, sesionTiempo.segundosActivos, motivoFinal);
        }
        sesionTiempo.juego = null;
    }

    function registrarFinPartida(clave) {
        cerrarSesionTiempo_('fin_partida');
    }

    function registrarPausa() {
        pausaManual = true;
    }

    function registrarReanudacion() {
        pausaManual = false;
    }

    window.addEventListener('pagehide', () => cerrarSesionTiempo_('abandono'));

    const MENSAJES_INVITACION = [
        '¿Sabías que en nuestro buscador puedes encontrar miles de productos de droguería, perfumería, pinturas y talleres? Échale un vistazo.',
        '¡Llevas varias partidas jugando! ¿Qué te parece si descubres ahora nuestro catálogo completo en el buscador?',
        'Antes de seguir jugando, prueba nuestro buscador: filtra por marca, categoría o precio y encuentra justo lo que necesitas.',
        '¿Te está gustando el Espacio Creativo? Seguro que también te gusta nuestro buscador de productos. Pruébalo.',
        'Un pequeño descanso: visita el buscador y descubre ofertas y novedades de droguería, perfumería, pinturas y automoción.',
        '¿Buscas algo en concreto para tu negocio? Nuestro buscador tiene cientos de productos esperándote a un clic.',
    ];

    function leerContadores() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_ALMACEN));
            return datos && typeof datos === 'object' ? datos : {};
        } catch (err) {
            return {};
        }
    }

    function leerEntero_(clave) {
        try {
            const valor = parseInt(localStorage.getItem(clave), 10);
            return Number.isFinite(valor) ? valor : 0;
        } catch (err) {
            return 0;
        }
    }

    function guardarEntero_(clave, valor) {
        try {
            localStorage.setItem(clave, String(valor));
        } catch (err) {
            // localStorage no disponible — se ignora.
        }
    }

    function siguienteMensajeInvitacion_() {
        const indice = leerEntero_(CLAVE_INDICE_MENSAJE);
        const mensaje = MENSAJES_INVITACION[indice % MENSAJES_INVITACION.length];
        guardarEntero_(CLAVE_INDICE_MENSAJE, indice + 1);
        return mensaje;
    }

    function mostrarModalInvitacion_() {
        if (document.getElementById('om-invitacion-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'om-invitacion-overlay';
        overlay.className = 'om-invitacion-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'om-invitacion-titulo');

        const panel = document.createElement('div');
        panel.className = 'om-invitacion-panel';

        const titulo = document.createElement('h2');
        titulo.id = 'om-invitacion-titulo';
        titulo.textContent = '¿Una pausa para descubrir algo más?';

        const mensaje = document.createElement('p');
        mensaje.textContent = siguienteMensajeInvitacion_();

        const acciones = document.createElement('div');
        acciones.className = 'om-invitacion-acciones';

        const botonAceptar = document.createElement('button');
        botonAceptar.type = 'button';
        botonAceptar.className = 'om-invitacion-boton om-invitacion-boton--aceptar';
        botonAceptar.textContent = 'Ir al buscador';
        botonAceptar.addEventListener('click', () => {
            // El objetivo de negocio real del Espacio Creativo: que el
            // usuario acabe en el buscador. Se registra antes de
            // navegar, con el juego que estaba jugando en ese momento
            // como contexto (si lo hay).
            const juegoActual = sesionTiempo.juego || '(ninguno)';
            enviarEventoGA_('conversion_buscador', { juego: juegoActual });
            enviarEventoBackend_('conversion', juegoActual);
            window.location.href = '../buscador.html';
        });

        const botonCancelar = document.createElement('button');
        botonCancelar.type = 'button';
        botonCancelar.className = 'om-invitacion-boton om-invitacion-boton--cancelar';
        botonCancelar.textContent = 'Seguir jugando';
        botonCancelar.addEventListener('click', () => overlay.remove());

        acciones.appendChild(botonAceptar);
        acciones.appendChild(botonCancelar);
        panel.appendChild(titulo);
        panel.appendChild(mensaje);
        panel.appendChild(acciones);
        overlay.appendChild(panel);

        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) overlay.remove();
        });

        document.body.appendChild(overlay);
    }

    function registrarPartida(clave) {
        try {
            const contadores = leerContadores();
            contadores[clave] = (contadores[clave] || 0) + 1;
            localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(contadores));
        } catch (err) {
            // localStorage no disponible (modo privado, cuota agotada, etc.)
            // — se ignora sin interrumpir la partida.
        }

        // Si quedaba una sesión de tiempo abierta sin cerrar (p.ej. el
        // juego se reinicia sin llegar a terminar la partida anterior:
        // cambio de dificultad, botón "Reiniciar"), se cierra ahora
        // como abandono antes de empezar a contar la nueva.
        cerrarSesionTiempo_('reinicio');
        sesionTiempo.juego = clave;
        sesionTiempo.segundosActivos = 0;
        pausaManual = false;
        if (!intervaloTick) intervaloTick = setInterval(tickActivo_, 1000);
        enviarEventoGA_('juego_inicio', { juego: clave });
        enviarEventoBackend_('inicio', clave);

        const totalDesdeInvitacion = leerEntero_(CLAVE_CONTADOR_INVITACION) + 1;
        if (totalDesdeInvitacion >= UMBRAL_INVITACION) {
            guardarEntero_(CLAVE_CONTADOR_INVITACION, 0);
            mostrarModalInvitacion_();
        } else {
            guardarEntero_(CLAVE_CONTADOR_INVITACION, totalDesdeInvitacion);
        }
    }

    window.OMEstadisticasJuegos = {
        registrarPartida,
        registrarFinPartida,
        registrarPausa,
        registrarReanudacion,
        leerContadores,
        URL_BACKEND_ESTADISTICAS,
    };
})();
