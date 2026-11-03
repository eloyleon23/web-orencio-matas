/**
 * Mejores resultados por minijuego — guardados en este navegador
 * (localStorage, no en el servidor): la mejor puntuación conseguida
 * en cada juego, la de la última partida jugada y cuándo fue esa
 * última vez. Se usa en dos sitios:
 *
 *  - Dentro de cada juego: pinta un panel "Tus resultados" justo
 *    debajo de la cabecera (.om-cabecera-juego, presente en todas las
 *    páginas de lab/) — sin que cada página tenga que declarar nada
 *    en su HTML, se inserta solo.
 *  - En el hub (lab/index.html): añade una insignia con el mejor
 *    resultado y "hace N días" a cada tarjeta de juego.
 *
 * Cada juego llama a OMMejoresResultados.registrar(clave, {valor,
 * texto}) al terminar la partida — "valor" es el número que decide
 * si es un nuevo mejor resultado (cuanto más alto, mejor: puntos, o
 * el % conseguido en los juegos que no dan puntos), "texto" es la
 * etiqueta corta ya formateada que se muestra tal cual ("650 puntos",
 * "87%"...). La clave es la misma que ya usa cada juego para
 * estadisticas-juegos.js, y también el nombre de archivo sin
 * ".html" (truco que ya usa hub.js para ordenar las tarjetas).
 */
(function () {
    'use strict';

    const PREFIJO_CLAVE = 'om_mejor_resultado_';

    function claveStorage(juego) {
        return PREFIJO_CLAVE + juego;
    }

    function obtener(juego) {
        try {
            const raw = localStorage.getItem(claveStorage(juego));
            if (!raw) return null;
            const datos = JSON.parse(raw);
            if (!datos || typeof datos.mejorValor !== 'number' || !datos.fecha) return null;
            return datos;
        } catch (err) {
            return null;
        }
    }

    function registrar(juego, resultado) {
        if (!juego || !resultado || typeof resultado.valor !== 'number' || !isFinite(resultado.valor)) return null;
        try {
            const previo = obtener(juego);
            const esNuevoMejor = !previo || resultado.valor >= previo.mejorValor;
            const datos = {
                mejorValor: esNuevoMejor ? resultado.valor : previo.mejorValor,
                mejorTexto: esNuevoMejor ? (resultado.texto || '') : previo.mejorTexto,
                ultimoValor: resultado.valor,
                ultimoTexto: resultado.texto || '',
                fecha: new Date().toISOString(),
            };
            localStorage.setItem(claveStorage(juego), JSON.stringify(datos));
            pintarPanelEnPagina(juego, datos);
            return datos;
        } catch (err) {
            return null; // localStorage lleno o no disponible (navegación privada, etc.)
        }
    }

    function diasDesde(iso) {
        try {
            const entonces = new Date(iso);
            if (isNaN(entonces.getTime())) return null;
            const inicioEntonces = new Date(entonces.getFullYear(), entonces.getMonth(), entonces.getDate());
            const hoy = new Date();
            const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            return Math.round((inicioHoy - inicioEntonces) / 86400000);
        } catch (err) {
            return null;
        }
    }

    function textoHaceDias(iso) {
        const dias = diasDesde(iso);
        if (dias === null) return '';
        if (dias <= 0) return 'hoy';
        if (dias === 1) return 'ayer';
        return 'hace ' + dias + ' días';
    }

    function claveDesdeArchivo(nombreArchivo) {
        return (nombreArchivo || '').replace(/^.*\//, '').replace(/\.html$/, '').replace(/^$/, 'index');
    }

    function claveDePagina() {
        return claveDesdeArchivo(window.location.pathname);
    }

    function escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto == null ? '' : String(texto);
        return div.innerHTML;
    }

    // ── Panel "Tus resultados" dentro de cada juego ────────────────────

    function pintarPanelEnPagina(juego, datos) {
        if (claveDePagina() !== juego) return; // solo en la página del propio juego
        const cabecera = document.querySelector('.om-cabecera-juego');
        if (!cabecera) return;

        let panel = document.getElementById('om-mis-resultados');
        if (!panel) {
            panel = document.createElement('section');
            panel.id = 'om-mis-resultados';
            panel.className = 'om-mis-resultados om-oculto-en-pantalla-completa';
            panel.setAttribute('aria-label', 'Tus resultados en este juego');
            cabecera.insertAdjacentElement('afterend', panel);
        }

        if (!datos) {
            panel.hidden = true;
            return;
        }

        panel.hidden = false;
        panel.innerHTML =
            '<p class="om-mis-resultados__fila">🏆 <strong>Tu mejor resultado:</strong> ' + escaparHtml(datos.mejorTexto) + '</p>' +
            '<p class="om-mis-resultados__fila">🕹️ <strong>Última partida:</strong> ' + escaparHtml(datos.ultimoTexto) +
            ' <span class="om-mis-resultados__fecha">(' + textoHaceDias(datos.fecha) + ')</span></p>';
    }

    // ── Insignias en las tarjetas del hub ───────────────────────────────

    function pintarInsigniasHub() {
        const rejilla = document.querySelector('.jh-grid');
        if (!rejilla) return;
        rejilla.querySelectorAll('.jh-tarjeta').forEach((tarjeta) => {
            const juego = claveDesdeArchivo(tarjeta.getAttribute('href'));
            const datos = obtener(juego);
            if (!datos) return;

            let resultado = tarjeta.querySelector('.jh-tarjeta__resultado');
            if (!resultado) {
                resultado = document.createElement('p');
                resultado.className = 'jh-tarjeta__resultado';
                const descripcion = tarjeta.querySelector('.jh-tarjeta__descripcion');
                if (descripcion) {
                    descripcion.insertAdjacentElement('afterend', resultado);
                } else {
                    tarjeta.insertBefore(resultado, tarjeta.querySelector('.jh-tarjeta__cta'));
                }
            }
            resultado.innerHTML =
                '<span class="jh-tarjeta__resultado-mejor">🏆 ' + escaparHtml(datos.mejorTexto) + '</span>' +
                '<span class="jh-tarjeta__resultado-fecha">' + textoHaceDias(datos.fecha) + '</span>';
        });
    }

    function inicializar() {
        const juego = claveDePagina();
        if (juego) {
            const datos = obtener(juego);
            if (datos) pintarPanelEnPagina(juego, datos);
        }
        pintarInsigniasHub();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }

    window.OMMejoresResultados = { registrar, obtener, diasDesde, textoHaceDias };
})();
