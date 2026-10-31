/**
 * Estadísticas de juego — compartido por todos los minijuegos de lab/
 * Vanilla JS, sin dependencias. Cada minijuego llama a
 * `OMEstadisticasJuegos.registrarPartida('clave')` al empezar una
 * partida; el hub (lab/index.html) usa `leerContadores()` para
 * ordenar las tarjetas por frecuencia de juego. Se guarda en
 * localStorage (persiste entre sesiones del navegador, no solo
 * mientras la pestaña está abierta) para que el orden refleje el
 * uso real a lo largo del tiempo, no solo la visita actual.
 */
(function () {
    'use strict';

    const CLAVE_ALMACEN = 'om_lab_juegos_jugados';

    function leerContadores() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_ALMACEN));
            return datos && typeof datos === 'object' ? datos : {};
        } catch (err) {
            return {};
        }
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
    }

    window.OMEstadisticasJuegos = { registrarPartida, leerContadores };
})();
