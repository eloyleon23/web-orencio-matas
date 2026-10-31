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
 * Además, envía a Google Analytics (solo en producción, igual que el
 * resto del sitio — ver gtag en el <head> de cada página) tres
 * eventos para poder evaluar qué juegos enganchan de verdad:
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
    function enviarEventoGA_(nombre, params) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', nombre, params);
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
            enviarEventoGA_('juego_tiempo', {
                juego: sesionTiempo.juego,
                segundos: sesionTiempo.segundosActivos,
                motivo: motivo || 'fin_partida',
            });
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
            enviarEventoGA_('conversion_buscador', { juego: sesionTiempo.juego || '(ninguno)' });
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
    };
})();
