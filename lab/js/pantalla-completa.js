/**
 * Pantalla completa — botón flotante reutilizable en todos los
 * minijuegos del laboratorio. Pone en pantalla completa la sección de
 * juego (selector de dificultad + marcador + zona de juego), usando
 * la Fullscreen API cuando el navegador la soporta y, si no, un modo
 * "maximizado" simulado (position: fixed cubriendo toda la pantalla)
 * para que funcione también en navegadores que no la implementan.
 *
 * Cada página de minijuego solo tiene que incluir este script: busca
 * automáticamente la sección jugable por su aria-label, común a todos
 * los juegos de la suite.
 */
(function () {
    'use strict';

    const seccion = document.querySelector('section[aria-label="Zona de juego"]');
    if (!seccion) return;

    const CLASE_SIMULADA = 'om-pantalla-completa-simulada';
    const CLASE_BODY = 'om-pantalla-completa-activa-body';

    // Se añade como primer hijo de la propia sección (no de <body>):
    // en pantalla completa nativa el elemento pasa a una "capa
    // superior" del navegador por encima de todo lo demás, así que un
    // botón fuera de la sección quedaría tapado y sería inalcanzable.
    // Sigue siendo "position: fixed" (relativo a la ventana) porque la
    // sección no tiene transform/filter propio que cree su propio
    // contexto de posicionamiento.
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'om-pantalla-completa';
    seccion.insertBefore(boton, seccion.firstChild);

    function elementoFullscreen() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function enPantallaCompleta() {
        return elementoFullscreen() === seccion || seccion.classList.contains(CLASE_SIMULADA);
    }

    function activarSimulado() {
        seccion.classList.add(CLASE_SIMULADA);
        document.body.classList.add(CLASE_BODY);
        actualizarBoton();
    }

    function desactivarSimulado() {
        seccion.classList.remove(CLASE_SIMULADA);
        document.body.classList.remove(CLASE_BODY);
        actualizarBoton();
    }

    function pedirFullscreen() {
        const metodo = seccion.requestFullscreen || seccion.webkitRequestFullscreen;
        if (!metodo) {
            activarSimulado();
            return;
        }
        const resultado = metodo.call(seccion);
        if (resultado && typeof resultado.catch === 'function') {
            resultado.catch(() => activarSimulado());
        }
    }

    function salirFullscreen() {
        const metodo = document.exitFullscreen || document.webkitExitFullscreen;
        if (elementoFullscreen() === seccion && metodo) {
            metodo.call(document);
        }
        desactivarSimulado();
    }

    function actualizarBoton() {
        const activo = enPantallaCompleta();
        boton.innerHTML = activo
            ? '<span aria-hidden="true">✕</span>'
            : '<span aria-hidden="true">⛶</span>';
        boton.setAttribute('aria-label', activo ? 'Salir de pantalla completa' : 'Pantalla completa');
    }

    boton.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (enPantallaCompleta()) {
            salirFullscreen();
        } else {
            pedirFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (elementoFullscreen() !== seccion) desactivarSimulado();
        actualizarBoton();
    });
    document.addEventListener('webkitfullscreenchange', () => {
        if (elementoFullscreen() !== seccion) desactivarSimulado();
        actualizarBoton();
    });

    actualizarBoton();
})();
