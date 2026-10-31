/**
 * Quita la Mancha — minijuego (lab/limpieza.html)
 * Vanilla JS, sin dependencias. 3 superficies (encimera, azulejos,
 * cristal), suciedad generada de forma procedural con canvas —sin
 * imágenes externas—, pensada igual que el resto de la suite para
 * limpiarse con el dedo en móvil: manchas grandes y de borde sólido,
 * sin detalle fino que "hilar".
 *
 * El motor es el inverso del de "Pinta tu Estancia"/"Pinta el Coche":
 * en vez de ir añadiendo pintura sobre una máscara pintable, se parte
 * de una capa de suciedad ya generada (con el alfa binarizado, igual
 * razón que la máscara de esos juegos: así el 100% siempre es
 * alcanzable) y cada pasada de bayeta/estropajo la va borrando con
 * "destination-out".
 */
(function () {
    'use strict';

    // ── Superficies disponibles ─────────────────────────────────────────
    const SUPERFICIES = {
        encimera: {
            nombre: 'Encimera',
            icono: '🍽️',
            colorFondoA: '#f3ecd9',
            colorFondoB: '#e9ddbd',
            patron: 'bandas',
            manchas: ['#6b4226', '#8a5a34', '#4a3222', '#9c6b3f'],
        },
        azulejos: {
            nombre: 'Azulejos',
            icono: '🛁',
            colorFondoA: '#eef5f6',
            colorFondoB: '#dbe9ea',
            patron: 'rejilla',
            manchas: ['#8a8f74', '#6e7259', '#aab08c', '#7d8468'],
        },
        cristal: {
            nombre: 'Cristal',
            icono: '🪟',
            colorFondoA: '#eaf4fb',
            colorFondoB: '#d8ebf5',
            patron: 'liso',
            manchas: ['#7c838a', '#9aa0a6', '#5f6368', '#8d9298'],
        },
    };

    // ── Herramientas ──────────────────────────────────────────────────
    // Bayeta: trazo ancho y opacidad alta desde el primer paso — cubre
    // mucho de golpe, pensada para suciedad extendida.
    // Estropajo: trazo estrecho y bien menos opaco por pasada (hacen
    // falta varias pasadas para dejarlo impecable) con textura de
    // fibra, pensado para rincones y manchas pequeñas muy concretas.
    const HERRAMIENTAS = {
        bayeta: { radio: 50, opacidadDab: 0.85, fibra: false, espaciadoPx: 15 },
        estropajo: { radio: 16, opacidadDab: 0.3, fibra: true, espaciadoPx: 5 },
    };

    const UMBRAL_COMPLETADO = 100;
    const ALFA_SUCIO = 140;

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        superficie: 'encimera',
        herramienta: 'bayeta',
        limpiando: false,
        ultimoPunto: null,
        terminado: false,
        porcentaje: 0,
    };

    // ── Canvas principal y capas de trabajo ─────────────────────────────
    const lienzoVisible = document.getElementById('jl-canvas');
    const ctxVisible = lienzoVisible.getContext('2d');

    const capaFondo = document.createElement('canvas');
    const ctxFondo = capaFondo.getContext('2d');
    const capaSuciedad = document.createElement('canvas');
    const ctxSuciedad = capaSuciedad.getContext('2d');
    const capaTrazo = document.createElement('canvas');
    const ctxTrazo = capaTrazo.getContext('2d');

    let puntosMuestra = [];

    // ── Fondo de la superficie (patrones sencillos, sin imágenes) ──────

    function dibujarFondo(w, h, cfg) {
        ctxFondo.clearRect(0, 0, w, h);
        ctxFondo.fillStyle = cfg.colorFondoA;
        ctxFondo.fillRect(0, 0, w, h);

        if (cfg.patron === 'bandas') {
            const n = 7;
            ctxFondo.fillStyle = cfg.colorFondoB;
            for (let i = 0; i < n; i += 2) {
                ctxFondo.fillRect(0, (h / n) * i, w, h / n);
            }
        } else if (cfg.patron === 'rejilla') {
            const cas = 7;
            ctxFondo.strokeStyle = cfg.colorFondoB;
            ctxFondo.lineWidth = Math.max(2, w * 0.004);
            for (let i = 1; i < cas; i++) {
                const x = (w / cas) * i;
                ctxFondo.beginPath();
                ctxFondo.moveTo(x, 0);
                ctxFondo.lineTo(x, h);
                ctxFondo.stroke();
            }
            const casFil = Math.round(cas * (h / w));
            for (let i = 1; i < casFil; i++) {
                const y = (h / casFil) * i;
                ctxFondo.beginPath();
                ctxFondo.moveTo(0, y);
                ctxFondo.lineTo(w, y);
                ctxFondo.stroke();
            }
        } else {
            const g = ctxFondo.createLinearGradient(0, 0, w, h);
            g.addColorStop(0, cfg.colorFondoA);
            g.addColorStop(1, cfg.colorFondoB);
            ctxFondo.fillStyle = g;
            ctxFondo.fillRect(0, 0, w, h);
        }
    }

    // ── Generación de la suciedad (manchas, procedural) ─────────────────

    function generarSuciedad(w, h, cfg) {
        ctxSuciedad.clearRect(0, 0, w, h);
        const nManchas = 15 + Math.floor(Math.random() * 6);
        for (let i = 0; i < nManchas; i++) {
            const cx = w * (0.08 + Math.random() * 0.84);
            const cy = h * (0.1 + Math.random() * 0.8);
            const radioBase = (Math.min(w, h)) * (0.045 + Math.random() * 0.06);
            const color = cfg.manchas[Math.floor(Math.random() * cfg.manchas.length)];
            dibujarMancha(ctxSuciedad, cx, cy, radioBase, color);
        }

        // Binarizar el alfa: igual razón que la máscara de los otros
        // juegos de la suite — sin un borde sólido, el 100% nunca sería
        // alcanzable del todo al limpiar.
        const datos = ctxSuciedad.getImageData(0, 0, w, h);
        for (let i = 3; i < datos.data.length; i += 4) {
            datos.data[i] = datos.data[i] > 127 ? 255 : 0;
        }
        ctxSuciedad.putImageData(datos, 0, 0);
    }

    function dibujarMancha(ctx, cx, cy, radioBase, color) {
        const lobulos = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < lobulos; i++) {
            const ang = (i / lobulos) * Math.PI * 2 + Math.random() * 0.6;
            const dist = radioBase * 0.4 * Math.random();
            const x = cx + Math.cos(ang) * dist;
            const y = cy + Math.sin(ang) * dist;
            const r = radioBase * (0.65 + Math.random() * 0.5);
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, color);
            g.addColorStop(0.75, color);
            g.addColorStop(1, hexAAlpha(color, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function precalcularPuntosMuestra(w, h) {
        puntosMuestra = [];
        const datos = ctxSuciedad.getImageData(0, 0, w, h).data;
        const paso = 10;
        for (let y = 0; y < h; y += paso) {
            for (let x = 0; x < w; x += paso) {
                if (datos[(y * w + x) * 4 + 3] > 128) puntosMuestra.push({ x, y });
            }
        }
    }

    // ── Canvas / escena ─────────────────────────────────────────────────

    const RATIO_LIENZO = 1000 / 650;

    // En pantalla completa, ".jl-lienzo-proporcion" (el div que
    // envuelve el canvas) tiene que medir el mayor tamaño 1000:650
    // que cabe en ".jl-lienzo-wrap" — pero el canvas es un elemento
    // "reemplazado" con tamaño intrínseco propio (sus atributos
    // width/height, que esta misma función recalcula para que
    // coincidan con su tamaño en pantalla), así que CSS puro
    // (aspect-ratio + auto + max-width/max-height) se queda pillado
    // en un ciclo: el tamaño del contenedor depende del canvas, que
    // depende del tamaño del contenedor. Se calcula aquí a mano,
    // a partir del wrap (que no tiene ese problema) y se fija como
    // ancho/alto en línea — igual que con el tablero de Encuentra la
    // Pareja.
    function ajustarCajaProporcion() {
        const proporcion = lienzoVisible.parentElement;
        if (!document.body.classList.contains('om-pantalla-completa-activa')) {
            proporcion.style.width = '';
            proporcion.style.height = '';
            return;
        }
        const wrap = proporcion.parentElement;
        const dispW = wrap.clientWidth;
        const dispH = wrap.clientHeight;
        if (!dispW || !dispH) return;
        let w = dispW;
        let h = w / RATIO_LIENZO;
        if (h > dispH) {
            h = dispH;
            w = h * RATIO_LIENZO;
        }
        proporcion.style.width = Math.floor(w) + 'px';
        proporcion.style.height = Math.floor(h) + 'px';
    }

    function ajustarTamanoCanvas() {
        ajustarCajaProporcion();
        const rect = lienzoVisible.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);
        lienzoVisible.width = w;
        lienzoVisible.height = h;
        [capaFondo, capaSuciedad, capaTrazo].forEach((c) => { c.width = w; c.height = h; });

        const cfg = SUPERFICIES[estado.superficie];
        dibujarFondo(w, h, cfg);
        generarSuciedad(w, h, cfg);
        precalcularPuntosMuestra(w, h);
        dibujarEscena();
    }

    function dibujarEscena() {
        const w = lienzoVisible.width, h = lienzoVisible.height;
        ctxVisible.clearRect(0, 0, w, h);
        ctxVisible.drawImage(capaFondo, 0, 0);
        ctxVisible.drawImage(capaSuciedad, 0, 0);
    }

    function dibujarDab(x, y) {
        const cfg = HERRAMIENTAS[estado.herramienta];
        const radio = cfg.radio;

        const g = ctxTrazo.createRadialGradient(x, y, 0, x, y, radio);
        g.addColorStop(0, `rgba(255,255,255,${cfg.opacidadDab})`);
        g.addColorStop(0.7, `rgba(255,255,255,${cfg.opacidadDab})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctxTrazo.fillStyle = g;
        ctxTrazo.beginPath();
        ctxTrazo.arc(x, y, radio, 0, Math.PI * 2);
        ctxTrazo.fill();

        if (cfg.fibra) {
            for (let i = 0; i < 6; i++) {
                const ang = Math.random() * Math.PI * 2;
                const dist = Math.random() * radio * 1.2;
                const mx = x + Math.cos(ang) * dist;
                const my = y + Math.sin(ang) * dist;
                ctxTrazo.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.25})`;
                ctxTrazo.beginPath();
                ctxTrazo.arc(mx, my, 1 + Math.random() * 2, 0, Math.PI * 2);
                ctxTrazo.fill();
            }
        }
    }

    function confirmarTrazo() {
        ctxSuciedad.globalCompositeOperation = 'destination-out';
        ctxSuciedad.drawImage(capaTrazo, 0, 0);
        ctxSuciedad.globalCompositeOperation = 'source-over';
        ctxTrazo.clearRect(0, 0, capaTrazo.width, capaTrazo.height);
    }

    function hexAAlpha(hex, alpha) {
        const n = parseInt(hex.replace('#', ''), 16);
        const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function limpiarEntre(p0, p1) {
        const cfg = HERRAMIENTAS[estado.herramienta];
        const dx = p1.x - p0.x, dy = p1.y - p0.y;
        const dist = Math.hypot(dx, dy);
        const pasos = Math.max(1, Math.floor(dist / cfg.espaciadoPx));
        for (let i = 0; i <= pasos; i++) {
            const t = i / pasos;
            dibujarDab(p0.x + dx * t, p0.y + dy * t);
        }
    }

    // ── Puntero (ratón + táctil, unificado vía Pointer Events) ─────────

    function coordsDesdeEvento(ev) {
        const rect = lienzoVisible.getBoundingClientRect();
        return {
            x: (ev.clientX - rect.left) * (lienzoVisible.width / rect.width),
            y: (ev.clientY - rect.top) * (lienzoVisible.height / rect.height),
        };
    }

    function lanzarParticulaDecorativa(clientX, clientY) {
        const wrap = lienzoVisible.parentElement;
        const rect = wrap.getBoundingClientRect();
        const p = document.createElement('span');
        p.className = 'jl-particula';
        const tam = 6 + Math.random() * 8;
        p.style.width = tam + 'px';
        p.style.height = tam + 'px';
        p.style.left = (clientX - rect.left - tam / 2) + 'px';
        p.style.top = (clientY - rect.top - tam / 2) + 'px';
        const cfg = SUPERFICIES[estado.superficie];
        p.style.background = cfg.manchas[0];
        wrap.appendChild(p);
        setTimeout(() => p.remove(), 480);
    }

    let ultimaParticula = 0;

    function alPuntero(ev) {
        if (estado.terminado) return;
        const punto = coordsDesdeEvento(ev);

        if (estado.ultimoPunto) {
            limpiarEntre(estado.ultimoPunto, punto);
        } else {
            dibujarDab(punto.x, punto.y);
        }
        estado.ultimoPunto = punto;
        confirmarTrazo();

        const ahora = performance.now();
        if (ahora - ultimaParticula > 90) {
            lanzarParticulaDecorativa(ev.clientX, ev.clientY);
            ultimaParticula = ahora;
            if (navigator.vibrate) navigator.vibrate(8);
        }

        dibujarEscena();
        actualizarProgresoThrottled();
    }

    lienzoVisible.addEventListener('pointerdown', (ev) => {
        lienzoVisible.setPointerCapture(ev.pointerId);
        estado.limpiando = true;
        estado.ultimoPunto = null;
        document.getElementById('jl-pista').style.display = 'none';
        alPuntero(ev);
    });

    lienzoVisible.addEventListener('pointermove', (ev) => {
        if (!estado.limpiando) return;
        alPuntero(ev);
    });

    function detenerLimpieza() {
        estado.limpiando = false;
        estado.ultimoPunto = null;
    }

    lienzoVisible.addEventListener('pointerup', detenerLimpieza);
    lienzoVisible.addEventListener('pointercancel', detenerLimpieza);
    lienzoVisible.addEventListener('pointerleave', detenerLimpieza);

    // ── Progreso ─────────────────────────────────────────────────────

    let ultimoCalculoProgreso = 0;

    function actualizarProgresoThrottled() {
        const ahora = performance.now();
        if (ahora - ultimoCalculoProgreso < 150) return;
        ultimoCalculoProgreso = ahora;
        calcularProgreso();
    }

    function calcularProgreso() {
        if (!puntosMuestra.length) return;
        const datos = ctxSuciedad.getImageData(0, 0, capaSuciedad.width, capaSuciedad.height).data;
        let limpios = 0;
        for (const pt of puntosMuestra) {
            const idx = (pt.y * capaSuciedad.width + pt.x) * 4 + 3;
            if (datos[idx] < ALFA_SUCIO) limpios++;
        }
        const pct = Math.round((limpios / puntosMuestra.length) * 100);
        if (pct === estado.porcentaje) return;
        estado.porcentaje = pct;

        document.getElementById('jl-porcentaje').textContent = pct + '%';
        document.getElementById('jl-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jl-barra-progreso').setAttribute('aria-valuenow', String(pct));

        if (pct >= UMBRAL_COMPLETADO && !estado.terminado) {
            terminarPartida();
        }
    }

    // ── Herramienta ──────────────────────────────────────────────────

    document.querySelectorAll('.jl-boton-herramienta').forEach((boton) => {
        boton.addEventListener('click', () => {
            document.querySelectorAll('.jl-boton-herramienta').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.herramienta = boton.dataset.herramienta;
        });
    });

    // ── Reiniciar / nueva partida ───────────────────────────────────

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('limpieza');
        estado.terminado = false;
        estado.porcentaje = 0;
        estado.ultimoPunto = null;
        document.getElementById('jl-porcentaje').textContent = '0%';
        document.getElementById('jl-barra-progreso-relleno').style.width = '0%';
        document.getElementById('jl-pista').style.display = '';
        ajustarTamanoCanvas();
    }

    document.getElementById('jl-boton-reiniciar').addEventListener('click', nuevaPartida);
    document.getElementById('jl-boton-jugar-de-nuevo').addEventListener('click', () => {
        document.getElementById('jl-celebracion-overlay').hidden = true;
        nuevaPartida();
    });

    // ── Superficie ───────────────────────────────────────────────────

    document.querySelectorAll('.jl-chip-superficie').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jl-chip-superficie').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.superficie = boton.dataset.superficie;
            nuevaPartida();
        });
    });

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jl-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jl-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    function terminarPartida() {
        estado.terminado = true;

        document.getElementById('jl-celebracion-stat').textContent =
            `Dejaste la superficie al ${estado.porcentaje}% de limpieza`;

        const resultado = document.getElementById('jl-canvas-resultado');
        resultado.width = lienzoVisible.width;
        resultado.height = lienzoVisible.height;
        resultado.getContext('2d').drawImage(lienzoVisible, 0, 0);

        document.getElementById('jl-celebracion-overlay').hidden = false;
        lanzarConfeti();
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Quita la Mancha de Orencio Matas y Hnos! 🧽✨';
    const URL_SITIO = window.location.href;

    async function compartir() {
        lienzoVisible.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'quita-la-mancha.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'quita-la-mancha.png', { type: 'image/png' })],
                        title: 'Quita la Mancha — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jl-compartir-overlay');
        const enlaceDescargar = document.getElementById('jl-boton-descargar');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = lienzoVisible.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jl-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jl-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jl-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jl-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jl-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jl-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jl-compartir-overlay').hidden = true;
    });
    document.getElementById('jl-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jl-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Arranque ─────────────────────────────────────────────────────

    // En móvil, mostrar/ocultar la barra de direcciones u otros
    // paneles del navegador dispara un evento "resize" de window
    // aunque el tamaño real del lienzo no haya cambiado. Sin esta
    // comprobación, ajustarTamanoCanvas() regeneraba la suciedad
    // (aleatoria) desde cero en cada uno de esos resizes espurios y
    // se perdía el progreso — igual que se corrigió en su día para
    // Pinta el Coche y Pinta tu Estancia.
    function alRedimensionarVentana() {
        ajustarCajaProporcion();
        const rect = lienzoVisible.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);
        if (w === lienzoVisible.width && h === lienzoVisible.height) return;
        ajustarTamanoCanvas();
    }

    // Tras girar la pantalla, el tamaño real del lienzo puede tardar
    // un instante en asentarse — un único chequeo con un retraso fijo
    // podía pillar una medida todavía vieja y, por la comprobación de
    // arriba, quedarse pillado en el tamaño de antes de girar.
    // Reintentar varias veces es inofensivo: si la medida ya es la
    // correcta, simplemente no hace nada.
    function comprobarTamanoVariasVeces() {
        alRedimensionarVentana();
        [150, 350, 600, 1000].forEach((ms) => setTimeout(alRedimensionarVentana, ms));
    }

    window.addEventListener('resize', debounce(comprobarTamanoVariasVeces, 200));
    window.addEventListener('orientationchange', comprobarTamanoVariasVeces);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', debounce(comprobarTamanoVariasVeces, 200));
    }
    // El modo "maximizado" simulado de pantalla completa no dispara
    // ningún "resize" de window (es un position:fixed, no cambia el
    // tamaño de la ventana) — ver el mismo aviso en juego-taller.js.
    document.addEventListener('om-pantalla-completa-cambio', comprobarTamanoVariasVeces);

    function debounce(fn, ms) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    }

    ajustarTamanoCanvas();
    if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('limpieza');
})();
