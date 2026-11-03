/**
 * Hub de minijuegos — lab/index.html
 * Vanilla JS, sin dependencias. Gestiona el botón de compartir la
 * propia página del hub (enlace directo, no una imagen generada: aquí
 * no hay nada que "pintar" o "mezclar" que mostrar) y ordena las
 * tarjetas de juegos por cuándo se jugó cada una por última vez (la
 * fecha que guarda mejores-resultados.js en localStorage al terminar
 * una partida): el último jugado primero, luego el resto del más
 * reciente al más antiguo, y los nunca jugados al final manteniendo
 * su orden original. Depende de que mejores-resultados.js se cargue
 * ANTES que este script (ver el orden de <script> en lab/index.html).
 */
(function () {
    'use strict';

    const TEXTO_COMPARTIR = '¡Prueba los minijuegos de Orencio Matas y Hnos! 🕹️';
    const URL_SITIO = window.location.href;

    // ── Orden de las tarjetas por última vez jugada ─────────────────

    function claveDesdeHref(href) {
        return (href || '').replace(/^.*\//, '').replace(/\.html$/, '');
    }

    function ordenarTarjetasPorUltimaJugada() {
        if (!window.OMMejoresResultados) return;

        const rejilla = document.querySelector('.jh-grid');
        if (!rejilla) return;

        const tarjetas = Array.prototype.slice.call(rejilla.querySelectorAll('.jh-tarjeta'));
        const conOrdenOriginal = tarjetas.map((tarjeta, indice) => {
            const datos = window.OMMejoresResultados.obtener(claveDesdeHref(tarjeta.getAttribute('href')));
            return {
                tarjeta,
                indice,
                momento: datos ? new Date(datos.fecha).getTime() : null,
            };
        });

        const nadieJugoNunca = conOrdenOriginal.every((item) => item.momento === null);
        if (nadieJugoNunca) return;

        conOrdenOriginal.sort((a, b) => {
            if (a.momento === null && b.momento === null) return a.indice - b.indice;
            if (a.momento === null) return 1; // nunca jugado: al final
            if (b.momento === null) return -1;
            return b.momento - a.momento; // más reciente primero
        });
        conOrdenOriginal.forEach((item) => rejilla.appendChild(item.tarjeta));
    }

    ordenarTarjetasPorUltimaJugada();

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
