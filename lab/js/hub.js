/**
 * Hub de minijuegos — lab/index.html
 * Vanilla JS, sin dependencias. Gestiona el botón de compartir la
 * propia página del hub (enlace directo, no una imagen generada: aquí
 * no hay nada que "pintar" o "mezclar" que mostrar) y ordena las
 * tarjetas de juegos según la frecuencia de juego registrada en
 * localStorage por estadisticas-juegos.js (los más jugados primero;
 * los nunca jugados mantienen su orden original al final).
 */
(function () {
    'use strict';

    const TEXTO_COMPARTIR = '¡Prueba los minijuegos de Orencio Matas y Hnos! 🕹️';
    const URL_SITIO = window.location.href;

    // ── Orden de las tarjetas por frecuencia de juego ─────────────────

    function claveDesdeHref(href) {
        return (href || '').replace(/^.*\//, '').replace(/\.html$/, '');
    }

    function ordenarTarjetasPorFrecuencia() {
        if (!window.OMEstadisticasJuegos) return;
        const contadores = window.OMEstadisticasJuegos.leerContadores();

        const rejilla = document.querySelector('.jh-grid');
        if (!rejilla) return;

        const tarjetas = Array.prototype.slice.call(rejilla.querySelectorAll('.jh-tarjeta'));
        const conOrdenOriginal = tarjetas.map((tarjeta, indice) => ({
            tarjeta,
            indice,
            veces: contadores[claveDesdeHref(tarjeta.getAttribute('href'))] || 0,
        }));

        const sinJugarNunca = conOrdenOriginal.every((item) => item.veces === 0);
        if (sinJugarNunca) return;

        conOrdenOriginal.sort((a, b) => (b.veces - a.veces) || (a.indice - b.indice));
        conOrdenOriginal.forEach((item) => rejilla.appendChild(item.tarjeta));
    }

    ordenarTarjetasPorFrecuencia();

    async function compartir() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Minijuegos — Orencio Matas y Hnos',
                    text: TEXTO_COMPARTIR,
                    url: URL_SITIO,
                });
                return;
            } catch (err) {
                // Cancelado por el usuario u otro fallo — se cae al panel manual.
            }
        }
        abrirPanelCompartir();
    }

    function abrirPanelCompartir() {
        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jh-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jh-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jh-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;
        document.getElementById('jh-compartir-overlay').hidden = false;
    }

    document.getElementById('jh-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jh-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jh-compartir-overlay').hidden = true;
    });
    document.getElementById('jh-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jh-compartir-overlay') ev.currentTarget.hidden = true;
    });

    const botonCopiar = document.getElementById('jh-boton-copiar-enlace');
    botonCopiar.addEventListener('click', async () => {
        const textoOriginal = botonCopiar.textContent;
        try {
            await navigator.clipboard.writeText(URL_SITIO);
            botonCopiar.textContent = '¡Enlace copiado!';
        } catch (err) {
            botonCopiar.textContent = 'No se pudo copiar';
        }
        setTimeout(() => { botonCopiar.textContent = textoOriginal; }, 2000);
    });
})();
