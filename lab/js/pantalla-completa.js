/**
 * Pantalla completa — botón flotante reutilizable en todos los
 * minijuegos del laboratorio. Pone en pantalla completa el <main> de
 * la página (zona de juego + panel de herramientas/color cuando
 * existe), usando la Fullscreen API cuando el navegador la soporta y,
 * si no, un modo "maximizado" simulado (position: fixed cubriendo
 * toda la pantalla) para que funcione también en navegadores que no
 * la implementan.
 *
 * Mientras está activa, se ocultan los controles que no hacen falta
 * para jugar (selector de dificultad/modo, pista, marca, botón de
 * compartir, historial de partidas…) marcados en cada página con la
 * clase ".om-oculto-en-pantalla-completa" — lo necesario para jugar
 * (zona/canvas, marcador, selector de herramienta y color cuando
 * existen) se queda visible.
 *
 * Cada página de minijuego solo tiene que incluir este script: usa
 * el único <main> de la página, común a todos los juegos de la suite.
 */
(function () {
    'use strict';

    const main = document.querySelector('main');
    if (!main) return;

    const CLASE_SIMULADA = 'om-pantalla-completa-simulada';
    const CLASE_ACTIVA = 'om-pantalla-completa-activa';

    // Se añade como primer hijo del propio <main> (no de <body>): en
    // pantalla completa nativa el elemento pasa a una "capa superior"
    // del navegador por encima de todo lo demás, así que un botón
    // fuera de él quedaría tapado y sería inalcanzable. Sigue siendo
    // "position: fixed" (relativo a la ventana) porque <main> no
    // tiene transform/filter propio que cree su propio contexto de
    // posicionamiento.
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'om-pantalla-completa';
    main.insertBefore(boton, main.firstChild);

    function elementoFullscreen() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function enPantallaCompleta() {
        return elementoFullscreen() === main || main.classList.contains(CLASE_SIMULADA);
    }

    function sincronizar() {
        document.body.classList.toggle(CLASE_ACTIVA, enPantallaCompleta());
        actualizarBoton();
    }

    // En los navegadores sin Fullscreen API en elementos arbitrarios
    // (sobre todo Safari en iPhone) no hay forma de pedirle al
    // navegador que oculte su propia barra de direcciones — pero el
    // truco clásico de hacer un scroll mínimo nada más cargar hace que
    // la mayoría la colapse sola. No hace daño en los navegadores que
    // no lo necesitan.
    function intentarColapsarBarraNavegador() {
        window.scrollTo(0, 1);
        setTimeout(() => window.scrollTo(0, 1), 150);
    }

    function activarSimulado() {
        main.classList.add(CLASE_SIMULADA);
        sincronizar();
        intentarColapsarBarraNavegador();
    }

    function desactivarSimulado() {
        main.classList.remove(CLASE_SIMULADA);
        sincronizar();
    }

    function pedirFullscreen() {
        const metodo = main.requestFullscreen || main.webkitRequestFullscreen;
        if (!metodo) {
            activarSimulado();
            return;
        }
        const resultado = metodo.call(main);
        if (resultado && typeof resultado.catch === 'function') {
            resultado.catch(() => activarSimulado());
        }
    }

    function salirFullscreen() {
        const metodo = document.exitFullscreen || document.webkitExitFullscreen;
        if (elementoFullscreen() === main && metodo) {
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
        if (elementoFullscreen() !== main) main.classList.remove(CLASE_SIMULADA);
        sincronizar();
    });
    document.addEventListener('webkitfullscreenchange', () => {
        if (elementoFullscreen() !== main) main.classList.remove(CLASE_SIMULADA);
        sincronizar();
    });

    // El overlay de celebración (y el de compartir) vive fuera de
    // <main>, como el resto de los juegos de la suite. En pantalla
    // completa nativa, todo lo que no es descendiente del elemento en
    // fullscreen queda fuera de la "capa superior" del navegador y no
    // se ve; en el modo simulado, el overlay de <main> (más alto en
    // z-index) lo tapa igualmente. Así que en cuanto termina la
    // partida salimos de pantalla completa automáticamente para que
    // el resultado y el botón de compartir se vean con normalidad.
    const overlayCelebracion = document.querySelector('[id$="-celebracion-overlay"]');
    if (overlayCelebracion) {
        const observador = new MutationObserver(() => {
            if (!overlayCelebracion.hasAttribute('hidden') && enPantallaCompleta()) {
                salirFullscreen();
            }
        });
        observador.observe(overlayCelebracion, { attributes: true, attributeFilter: ['hidden'] });
    }

    sincronizar();
})();
