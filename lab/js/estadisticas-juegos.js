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
 */
(function () {
    'use strict';

    const CLAVE_ALMACEN = 'om_lab_juegos_jugados';
    const CLAVE_CONTADOR_INVITACION = 'om_lab_contador_invitacion';
    const CLAVE_INDICE_MENSAJE = 'om_lab_indice_mensaje_invitacion';
    const UMBRAL_INVITACION = 8;

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

        const totalDesdeInvitacion = leerEntero_(CLAVE_CONTADOR_INVITACION) + 1;
        if (totalDesdeInvitacion >= UMBRAL_INVITACION) {
            guardarEntero_(CLAVE_CONTADOR_INVITACION, 0);
            mostrarModalInvitacion_();
        } else {
            guardarEntero_(CLAVE_CONTADOR_INVITACION, totalDesdeInvitacion);
        }
    }

    window.OMEstadisticasJuegos = { registrarPartida, leerContadores };
})();
