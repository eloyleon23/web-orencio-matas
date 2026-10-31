/**
 * Compartir el juego (invitar a otros usuarios) — compartido por el
 * hub y los minijuegos de lab/. Vanilla JS, sin dependencias.
 *
 * Distinto del botón "Compartir mi resultado" que ya tiene cada
 * juego (que genera una imagen con la puntuación de esa partida):
 * este botón solo invita a jugar, compartiendo el enlace de la propia
 * página. Cualquier botón con la clase .om-compartir-juego-boton
 * dispara el share nativo del dispositivo (o, si no está disponible,
 * un panel con WhatsApp/X/Facebook y "copiar enlace") usando el
 * nombre y emoji del juego en data-nombre-juego / data-emoji-juego.
 */
(function () {
    'use strict';

    function urlActual() {
        return window.location.origin + window.location.pathname;
    }

    function abrirPanel(nombre, emoji, url) {
        const existente = document.getElementById('om-compartir-juego-overlay');
        if (existente) existente.remove();

        const texto = `¡Juega a ${nombre} en Orencio Matas y Hnos! ${emoji}`;
        const textoCodificado = encodeURIComponent(texto + ' ' + url);

        const overlay = document.createElement('div');
        overlay.id = 'om-compartir-juego-overlay';
        overlay.className = 'om-compartir-juego-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'om-compartir-juego-titulo');

        const panel = document.createElement('div');
        panel.className = 'om-compartir-juego-panel';

        const botonCerrar = document.createElement('button');
        botonCerrar.type = 'button';
        botonCerrar.className = 'om-compartir-juego-cerrar';
        botonCerrar.setAttribute('aria-label', 'Cerrar');
        botonCerrar.innerHTML = '&times;';
        botonCerrar.addEventListener('click', () => overlay.remove());

        const titulo = document.createElement('h2');
        titulo.id = 'om-compartir-juego-titulo';
        titulo.textContent = 'Invita a jugar';

        const parrafo = document.createElement('p');
        parrafo.textContent = `Comparte ${nombre} con quien quieras:`;

        const botonCopiar = document.createElement('button');
        botonCopiar.type = 'button';
        botonCopiar.className = 'om-compartir-juego-copiar';
        botonCopiar.textContent = 'Copiar enlace';
        botonCopiar.addEventListener('click', async () => {
            const original = botonCopiar.textContent;
            try {
                await navigator.clipboard.writeText(url);
                botonCopiar.textContent = '¡Enlace copiado!';
            } catch (err) {
                botonCopiar.textContent = 'No se pudo copiar';
            }
            setTimeout(() => { botonCopiar.textContent = original; }, 2000);
        });

        const redes = document.createElement('div');
        redes.className = 'om-compartir-juego-redes';

        const whatsapp = document.createElement('a');
        whatsapp.href = `https://wa.me/?text=${textoCodificado}`;
        whatsapp.target = '_blank';
        whatsapp.rel = 'noopener';
        whatsapp.textContent = 'WhatsApp';

        const x = document.createElement('a');
        x.href = `https://twitter.com/intent/tweet?text=${textoCodificado}`;
        x.target = '_blank';
        x.rel = 'noopener';
        x.textContent = 'X';

        const facebook = document.createElement('a');
        facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        facebook.target = '_blank';
        facebook.rel = 'noopener';
        facebook.textContent = 'Facebook';

        redes.appendChild(whatsapp);
        redes.appendChild(x);
        redes.appendChild(facebook);

        panel.appendChild(botonCerrar);
        panel.appendChild(titulo);
        panel.appendChild(parrafo);
        panel.appendChild(botonCopiar);
        panel.appendChild(redes);
        overlay.appendChild(panel);

        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) overlay.remove();
        });

        document.body.appendChild(overlay);
    }

    async function compartirJuego(nombre, emoji) {
        const url = urlActual();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${nombre} — Orencio Matas y Hnos`,
                    text: `¡Juega a ${nombre} en Orencio Matas y Hnos! ${emoji}`,
                    url,
                });
                return;
            } catch (err) {
                // Cancelado por el usuario u otro fallo — se cae al panel manual.
            }
        }
        abrirPanel(nombre, emoji, url);
    }

    document.querySelectorAll('.om-compartir-juego-boton').forEach((boton) => {
        boton.addEventListener('click', () => {
            const nombre = boton.dataset.nombreJuego || document.title;
            const emoji = boton.dataset.emojiJuego || '🕹️';
            compartirJuego(nombre, emoji);
        });
    });

    window.OMCompartirJuego = { compartirJuego };
})();
