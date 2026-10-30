/**
 * Mezcla de Colores — minijuego (lab/mezcla-colores.html)
 * Vanilla JS, sin dependencias.
 *
 * Mecánica: el jugador vierte "cazos" de pintura de una paleta fija
 * (los mismos colores de marca del sitio: rojo, amarillo, azul, verde,
 * blanco, negro) y el juego calcula la media ponderada de sus
 * cantidades en RGB — una aproximación sencilla a mezclar pintura,
 * suficiente para un juego casual sin modelar mezcla sustractiva real.
 *
 * El color objetivo se genera igual: una receta secreta de cantidades
 * aleatorias de la MISMA paleta, nunca mostrada al jugador — solo el
 * color resultante. Como el objetivo siempre es una combinación
 * alcanzable de la propia paleta, el jugador siempre puede llegar al
 * 100% si da con la proporción correcta.
 *
 * El parecido se mide como distancia euclídea en RGB entre la mezcla
 * del jugador y la receta secreta, convertida a porcentaje (0 =
 * colores opuestos, 100 = idénticos).
 */
(function () {
    'use strict';

    const PALETA = {
        rojo: { r: 217, g: 27, b: 27 },
        amarillo: { r: 241, g: 179, b: 0 },
        azul: { r: 0, g: 109, b: 174 },
        verde: { r: 0, g: 135, b: 67 },
        blanco: { r: 255, g: 255, b: 255 },
        negro: { r: 26, g: 26, b: 26 },
    };
    const CLAVES_PALETA = Object.keys(PALETA);
    const DISTANCIA_MAXIMA = Math.sqrt(3 * 255 * 255);

    // ── Dificultad ───────────────────────────────────────────────────
    // minColores/maxColores: cuántos colores distintos entran en la
    // receta secreta del objetivo — con más colores el resultado es
    // más "turbio" y difícil de adivinar a ojo.
    // maxVertidos: tope de cazos que puede verter el jugador (null =
    // sin límite) — con menos cazos hay menos margen para afinar la
    // proporción, así que toca acertar antes.
    const DIFICULTADES = {
        facil: { nombre: 'Fácil', minColores: 1, maxColores: 2, maxVertidos: null },
        medio: { nombre: 'Medio', minColores: 2, maxColores: 4, maxVertidos: 14 },
        dificil: { nombre: 'Difícil', minColores: 3, maxColores: 6, maxVertidos: 9 },
    };

    const estado = {
        dificultad: 'medio',
        objetivo: null, // { r, g, b }
        cantidades: {}, // { rojo: n, amarillo: n, ... }
        historialVertidos: [], // pila de claves vertidas, para "deshacer"
        terminado: false,
    };

    function mezclar(array) {
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function nuevoObjetivo() {
        // Receta secreta: entre minColores y maxColores colores
        // distintos (según la dificultad), cada uno con una cantidad
        // aleatoria — nunca se le muestra al jugador, solo el color
        // resultante.
        const cfg = DIFICULTADES[estado.dificultad];
        const nColores = cfg.minColores + Math.floor(Math.random() * (cfg.maxColores - cfg.minColores + 1));
        const elegidos = mezclar(CLAVES_PALETA).slice(0, nColores);

        const receta = {};
        elegidos.forEach((clave) => {
            receta[clave] = 1 + Math.floor(Math.random() * 5);
        });
        return mezclarDesdeCantidades(receta);
    }

    function mezclarDesdeCantidades(cantidades) {
        let total = 0, r = 0, g = 0, b = 0;
        CLAVES_PALETA.forEach((clave) => {
            const n = cantidades[clave] || 0;
            total += n;
            r += PALETA[clave].r * n;
            g += PALETA[clave].g * n;
            b += PALETA[clave].b * n;
        });
        if (total === 0) return null;
        return { r: Math.round(r / total), g: Math.round(g / total), b: Math.round(b / total) };
    }

    function rgbACss(color) {
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    function calcularParecido(a, b) {
        if (!a || !b) return 0;
        const d = Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
        return Math.max(0, Math.round(100 * (1 - d / DISTANCIA_MAXIMA)));
    }

    // ── Render ──────────────────────────────────────────────────────

    function totalVertido() {
        return CLAVES_PALETA.reduce((acc, clave) => acc + (estado.cantidades[clave] || 0), 0);
    }

    function actualizarVista() {
        const mezcla = mezclarDesdeCantidades(estado.cantidades);
        const total = totalVertido();

        const swatchMezcla = document.getElementById('jm-mezcla-swatch');
        const vacioEtiqueta = document.getElementById('jm-bote-vacio');
        if (mezcla) {
            swatchMezcla.style.background = rgbACss(mezcla);
            vacioEtiqueta.style.display = 'none';
        } else {
            swatchMezcla.style.background = '';
            vacioEtiqueta.style.display = '';
        }

        const pct = mezcla ? calcularParecido(mezcla, estado.objetivo) : 0;
        document.getElementById('jm-porcentaje').textContent = pct + '%';
        document.getElementById('jm-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jm-barra-progreso').setAttribute('aria-valuenow', String(pct));

        CLAVES_PALETA.forEach((clave) => {
            document.getElementById('jm-cantidad-' + clave).textContent = String(estado.cantidades[clave] || 0);
        });

        const cfg = DIFICULTADES[estado.dificultad];
        const tope = cfg.maxVertidos;
        const alTope = tope != null && total >= tope;

        if (total === 0) {
            document.getElementById('jm-pista').textContent = 'Toca un bote de pintura para empezar a verter';
        } else if (alTope) {
            document.getElementById('jm-pista').textContent = `Has llegado al límite de ${tope} cazos — toca "Terminar mezcla" o vacía el bote para reintentarlo`;
        } else {
            const restantes = tope != null ? ` (quedan ${tope - total})` : '';
            document.getElementById('jm-pista').textContent =
                `${total}${tope != null ? '/' + tope : ''} ${total === 1 ? 'cazo vertido' : 'cazos vertidos'}${restantes} — toca "Terminar mezcla" cuando estés listo`;
        }

        document.getElementById('jm-boton-deshacer').disabled = estado.historialVertidos.length === 0;
        document.getElementById('jm-boton-vaciar').disabled = total === 0;
        document.getElementById('jm-boton-terminar').disabled = total === 0;
        document.querySelectorAll('.jm-bote-color').forEach((boton) => {
            boton.disabled = alTope;
        });
    }

    // ── Verter / deshacer / vaciar ──────────────────────────────────

    function verter(clave) {
        if (estado.terminado) return;
        const cfg = DIFICULTADES[estado.dificultad];
        if (cfg.maxVertidos != null && totalVertido() >= cfg.maxVertidos) return;
        estado.cantidades[clave] = (estado.cantidades[clave] || 0) + 1;
        estado.historialVertidos.push(clave);
        lanzarSalpicadura(clave);
        actualizarVista();
    }

    function deshacer() {
        const ultima = estado.historialVertidos.pop();
        if (!ultima) return;
        estado.cantidades[ultima] = Math.max(0, (estado.cantidades[ultima] || 0) - 1);
        actualizarVista();
    }

    function vaciar() {
        estado.cantidades = {};
        estado.historialVertidos = [];
        actualizarVista();
    }

    function lanzarSalpicadura(clave) {
        const boton = document.querySelector(`.jm-bote-color[data-color="${clave}"]`);
        if (!boton) return;
        boton.classList.remove('jm-bote-color--salpica');
        // Forzar reflow para poder repetir la animación en vertidos seguidos.
        void boton.offsetWidth;
        boton.classList.add('jm-bote-color--salpica');
    }

    document.querySelectorAll('.jm-bote-color').forEach((boton) => {
        boton.addEventListener('click', () => verter(boton.dataset.color));
    });
    document.getElementById('jm-boton-deshacer').addEventListener('click', deshacer);
    document.getElementById('jm-boton-vaciar').addEventListener('click', vaciar);

    // ── Nueva partida ────────────────────────────────────────────────

    function nuevaPartida() {
        estado.objetivo = nuevoObjetivo();
        estado.cantidades = {};
        estado.historialVertidos = [];
        estado.terminado = false;
        document.getElementById('jm-objetivo-swatch').style.background = rgbACss(estado.objetivo);
        actualizarVista();
    }

    document.getElementById('jm-boton-nuevo-objetivo').addEventListener('click', () => {
        document.getElementById('jm-celebracion-overlay').hidden = true;
        nuevaPartida();
    });

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.jm-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jm-chip-dificultad').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.dificultad = boton.dataset.dificultad;
            nuevaPartida();
        });
    });

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jm-confeti');
        contenedor.innerHTML = '';
        const colores = ['#d91b1b', '#f1b300', '#006dae', '#008743', '#ffffff', '#1a1a1a'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jm-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    function mensajeParaPct(pct) {
        if (pct >= 95) return '¡Mezcla prácticamente perfecta! 🎯';
        if (pct >= 80) return '¡Muy buena aproximación!';
        if (pct >= 60) return 'Aceptable — ¡sigue practicando!';
        return 'Vaya, no ha salido muy parecido. ¡Prueba otra vez!';
    }

    function terminarMezcla() {
        if (totalVertido() === 0 || estado.terminado) return;
        estado.terminado = true;

        const mezcla = mezclarDesdeCantidades(estado.cantidades);
        const pct = calcularParecido(mezcla, estado.objetivo);

        document.getElementById('jm-celebracion-titulo').textContent = mensajeParaPct(pct);
        document.getElementById('jm-celebracion-stat').textContent = `Un ${pct}% de parecido con el color objetivo`;
        document.getElementById('jm-resultado-objetivo').style.background = rgbACss(estado.objetivo);
        document.getElementById('jm-resultado-mezcla').style.background = rgbACss(mezcla);

        document.getElementById('jm-celebracion-overlay').hidden = false;
        if (pct >= 80) lanzarConfeti();
        else document.getElementById('jm-confeti').innerHTML = '';
    }

    document.getElementById('jm-boton-terminar').addEventListener('click', terminarMezcla);
    document.getElementById('jm-boton-jugar-de-nuevo').addEventListener('click', () => {
        document.getElementById('jm-celebracion-overlay').hidden = true;
        nuevaPartida();
    });

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Mezcla de Colores de Orencio Matas y Hnos! 🧪🎨';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jm-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        const mezcla = mezclarDesdeCantidades(estado.cantidades);
        const pct = calcularParecido(mezcla, estado.objetivo);

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = rgbACss(estado.objetivo);
        ctx.fillRect(60, 60, 220, 180);
        ctx.fillStyle = rgbACss(mezcla);
        ctx.fillRect(360, 60, 220, 180);

        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Objetivo', 170, 270);
        ctx.fillText('Mi mezcla', 470, 270);

        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(pct + '% de parecido', w / 2, 320);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jm-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'mi-mezcla.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'mi-mezcla-de-colores.png', { type: 'image/png' })],
                        title: 'Mezcla de Colores — Orencio Matas y Hnos',
                        text: TEXTO_COMPARTIR,
                    });
                    return;
                } catch (err) {
                    // Cancelado por el usuario u otro fallo — se cae al panel manual.
                }
            }
            abrirPanelCompartir(blob);
        }, 'image/png');
    }

    function abrirPanelCompartir(blob) {
        const overlay = document.getElementById('jm-compartir-overlay');
        const enlaceDescargar = document.getElementById('jm-boton-descargar');
        const canvas = document.getElementById('jm-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jm-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jm-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jm-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jm-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jm-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jm-compartir-overlay').hidden = true;
    });
    document.getElementById('jm-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jm-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Arranque ─────────────────────────────────────────────────────

    nuevaPartida();
})();
