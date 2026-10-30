/**
 * Hub de minijuegos — lab/index.html
 * Vanilla JS, sin dependencias. Solo gestiona el botón de compartir la
 * propia página del hub (enlace directo, no una imagen generada: aquí
 * no hay nada que "pintar" o "mezclar" que mostrar).
 */
(function () {
    'use strict';

    const TEXTO_COMPARTIR = '¡Prueba los minijuegos de Orencio Matas y Hnos! 🕹️';
    const URL_SITIO = window.location.href;

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
