/**
 * Pinta tu Estancia — minijuego (lab/pinturas.html)
 * Vanilla JS, sin dependencias. 6 estancias (salón, dormitorio, baño,
 * cocina, fachada y piscina), todas ilustraciones geométricas propias
 * (sin fuente externa — planos sencillos en esquina o elevación, sin
 * problema de derechos de imagen al estar creadas aquí mismo).
 * Guardadas en lab/assets/sala-*.png.
 *
 * Mismo motor de pintura que "Pinta el Coche" (ver lab/js/juego-taller.js
 * para la explicación completa del porqué): el área pintable se calcula
 * por inundación (flood fill) a partir de la propia imagen —se parte de
 * fuera de la estancia y de dentro de cada puerta/ventana (semillas) y
 * se expande hasta chocar con una línea del dibujo—, la máscara se
 * binariza para evitar bordes a medio pintar, y cada trazo se confirma
 * una sola vez sobre la capa permanente para que el 100% sea siempre
 * alcanzable.
 */
(function () {
    'use strict';

    // ── Estancias disponibles ──────────────────────────────────────────
    // Mismo campo que VEHICULOS en juego-taller.js: wallAlpha,
    // exteriorExcluido y semillasExcluir (puertas/ventanas/tejado aquí,
    // en vez de cristales/llantas). "piscina" no tiene huecos que
    // excluir (toda la lámina de agua es pintable), de ahí el array
    // vacío.
    // Ilustraciones profesionales reales (no dibujadas a mano aquí),
    // con licencia Pixabay Content License (gratis para uso comercial,
    // sin atribución obligatoria): salón/dormitorio/baño/cocina, de
    // Silvia Gaudenzi; fachada y piscina, procesadas por extracción de
    // bordes a partir de sendas ilustraciones vectoriales también de
    // Pixabay. Guardadas en lab/assets/.
    //
    // Con ilustraciones tan detalladas (muebles, marcos, texturas...)
    // enumerar cada hueco a excluir sería inabarcable, así que estas 6
    // estancias usan modoMascara:'incluir' (ver calcularMascaraPintable):
    // semillasIncluir son puntos sobre la propia pared/superficie lisa,
    // y SOLO eso es pintable — todo lo demás (muebles, marcos, ventanas,
    // vistas exteriores) queda fuera sin tener que señalarlo uno a uno.
    const ESTANCIAS = {
        salon: {
            nombre: 'Salón',
            icono: '🛋️',
            src: 'assets/sala-salon.png',
            wallAlpha: 60,
            modoMascara: 'incluir',
            semillasIncluir: [[270, 150], [600, 150]],
        },
        dormitorio: {
            nombre: 'Dormitorio',
            icono: '🛏️',
            src: 'assets/sala-dormitorio.png',
            wallAlpha: 60,
            modoMascara: 'incluir',
            semillasIncluir: [[60, 60], [160, 50], [400, 90], [550, 70]],
        },
        bano: {
            nombre: 'Baño',
            icono: '🛁',
            src: 'assets/sala-bano.png',
            wallAlpha: 60,
            modoMascara: 'incluir',
            semillasIncluir: [
                [20, 15], [20, 35], [20, 55], [20, 75], [20, 95], [20, 115],
                [20, 155], [20, 175], [20, 195], [20, 215], [20, 235],
                [330, 180],
            ],
        },
        cocina: {
            nombre: 'Cocina',
            icono: '🍳',
            src: 'assets/sala-cocina.png',
            wallAlpha: 60,
            modoMascara: 'incluir',
            // Esta cocina está completamente ocupada por armarios de
            // pared a pared — la única superficie realmente lisa es el
            // suelo embaldosado, así que aquí se pinta el suelo. Rejilla
            // densa de semillas: las baldosas en diagonal son pequeñas y
            // una rejilla más espaciada dejaba demasiadas sin conectar.
            semillasIncluir: (() => {
                const puntos = [];
                for (let x = 20; x < 1260; x += 40) {
                    for (let y = 660; y < 840; y += 30) puntos.push([x, y]);
                }
                return puntos;
            })(),
        },
        fachada: {
            nombre: 'Fachada',
            icono: '🏠',
            src: 'assets/sala-fachada.png',
            wallAlpha: 60,
            modoMascara: 'incluir',
            semillasIncluir: [
                [60, 40], [270, 40], [480, 40], [690, 40], [900, 40], [1110, 40],
                [60, 150], [480, 150], [690, 150], [930, 150],
                [60, 340], [270, 340], [480, 340], [690, 340], [900, 340], [1110, 340],
            ],
        },
        piscina: {
            nombre: 'Piscina',
            icono: '🏊',
            src: 'assets/sala-piscina.png',
            wallAlpha: 60,
            modoMascara: 'incluir',
            semillasIncluir: [[300, 150]],
        },
    };

    // ── Herramientas ──────────────────────────────────────────────────
    const HERRAMIENTAS = {
        rodillo: { radio: 34, opacidadDab: 0.62, mancha: false, espaciadoPx: 10 },
        brocha: { radio: 15, opacidadDab: 0.5, mancha: true, espaciadoPx: 5 },
    };

    const UMBRAL_COMPLETADO = 100;

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        estancia: 'salon',
        herramienta: 'rodillo',
        color: '#f3efe6',
        pintando: false,
        ultimoPunto: null,
        terminado: false,
        porcentaje: 0,
    };

    // ── Canvas principal y capas de trabajo ─────────────────────────────
    const lienzoVisible = document.getElementById('jp-canvas');
    const ctxVisible = lienzoVisible.getContext('2d');

    const capaBase = document.createElement('canvas');
    const ctxBase = capaBase.getContext('2d');
    const capaMascara = document.createElement('canvas');
    const ctxMascara = capaMascara.getContext('2d');
    const capaSombra = document.createElement('canvas');
    const capaBrillo = document.createElement('canvas');
    const capaPintura = document.createElement('canvas');
    const ctxPintura = capaPintura.getContext('2d');
    const capaTrazo = document.createElement('canvas');
    const ctxTrazo = capaTrazo.getContext('2d');

    let puntosMuestra = [];
    let imagenActual = null;
    let cargandoEstancia = false;

    // ── Construcción de la máscara por inundación (flood fill) ─────────
    // Idéntico algoritmo que juego-taller.js — ver ahí la explicación
    // detallada de cada paso.

    function alfaEn(datos, w, h, x, y, fueraDeLimites) {
        if (x < 0 || y < 0 || x >= w || y >= h) return fueraDeLimites;
        return datos[(y * w + x) * 4 + 3];
    }

    function esCasiBlanco(datos, w, x, y) {
        const o = (y * w + x) * 4;
        return datos[o + 3] > 200 && datos[o] > 225 && datos[o + 1] > 225 && datos[o + 2] > 225;
    }

    function inundar(datos, w, h, semillas, esParedFn) {
        const visitado = new Uint8Array(w * h);
        const pila = [];
        semillas.forEach(([sx, sy]) => {
            if (sx >= 0 && sy >= 0 && sx < w && sy < h && !esParedFn(sx, sy)) pila.push([sx, sy]);
        });
        while (pila.length) {
            const [x, y] = pila.pop();
            if (x < 0 || y < 0 || x >= w || y >= h) continue;
            const idx = y * w + x;
            if (visitado[idx]) continue;
            if (esParedFn(x, y)) continue;
            visitado[idx] = 1;
            pila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        return visitado;
    }

    // Dos modos de máscara:
    //  - 'excluir' (el de siempre): todo es pintable salvo el exterior y
    //    los huecos sembrados en semillasExcluir (puertas, ventanas,
    //    muebles...). Funciona bien cuando la ilustración tiene pocos
    //    huecos bien delimitados.
    //  - 'incluir': al revés — SOLO es pintable lo alcanzado desde
    //    semillasIncluir (puntos sobre la propia pared/superficie lisa).
    //    Pensado para ilustraciones muy detalladas (muebles con mil
    //    detalles, marcos, cojines...) donde enumerar cada hueco a
    //    excluir sería inabarcable: basta con sembrar la propia pared y
    //    la inundación se para sola en cualquier línea del dibujo.
    function calcularMascaraPintable(img, cfg) {
        const w = img.naturalWidth, h = img.naturalHeight;
        const tmp = document.createElement('canvas');
        tmp.width = w;
        tmp.height = h;
        const tctx = tmp.getContext('2d');
        tctx.drawImage(img, 0, 0);
        const datos = tctx.getImageData(0, 0, w, h).data;

        const esParedExterior = (x, y) => alfaEn(datos, w, h, x, y, 255) >= cfg.wallAlpha;

        if (cfg.modoMascara === 'incluir') {
            const incluido = inundar(datos, w, h, cfg.semillasIncluir, esParedExterior);
            return { pintable: incluido, w, h };
        }

        const exterior = inundar(datos, w, h,
            [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2], [Math.floor(w / 2), 1]],
            esParedExterior);

        const esParedExcluir = cfg.exteriorExcluido
            ? (x, y) => !esCasiBlanco(datos, w, x, y)
            : esParedExterior;
        const excluido = cfg.semillasExcluir.length
            ? inundar(datos, w, h, cfg.semillasExcluir, esParedExcluir)
            : new Uint8Array(w * h);

        const pintable = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) {
            if (exterior[i] || excluido[i]) continue;
            if (cfg.exteriorExcluido) {
                const x = i % w, y = (i / w) | 0;
                if (!esCasiBlanco(datos, w, x, y)) continue;
            }
            pintable[i] = 1;
        }
        return { pintable, w, h };
    }

    // ── Encaje de la imagen en el canvas (estilo "contain", centrada) ──

    function calcularEncaje(imgW, imgH, canvasW, canvasH) {
        const margen = 0.94;
        const escala = Math.min(canvasW / imgW, canvasH / imgH) * margen;
        const drawW = imgW * escala;
        const drawH = imgH * escala;
        return {
            escala,
            x: (canvasW - drawW) / 2,
            y: (canvasH - drawH) / 2,
            w: drawW,
            h: drawH,
        };
    }

    let encajeActual = null;

    function reconstruirCapas() {
        if (!imagenActual) return;
        const w = lienzoVisible.width, h = lienzoVisible.height;
        [capaBase, capaMascara, capaSombra, capaBrillo, capaPintura, capaTrazo].forEach((c) => {
            c.width = w;
            c.height = h;
        });

        const cfg = ESTANCIAS[estado.estancia];
        const encaje = calcularEncaje(imagenActual.naturalWidth, imagenActual.naturalHeight, w, h);
        encajeActual = encaje;

        ctxBase.clearRect(0, 0, w, h);
        ctxBase.drawImage(imagenActual, encaje.x, encaje.y, encaje.w, encaje.h);

        const { pintable, w: mw, h: mh } = calcularMascaraPintable(imagenActual, cfg);
        const mascaraOriginal = document.createElement('canvas');
        mascaraOriginal.width = mw;
        mascaraOriginal.height = mh;
        const mctx = mascaraOriginal.getContext('2d');
        const salida = mctx.createImageData(mw, mh);
        for (let i = 0; i < mw * mh; i++) {
            if (pintable[i]) {
                const o = i * 4;
                salida.data[o] = 255; salida.data[o + 1] = 255; salida.data[o + 2] = 255; salida.data[o + 3] = 255;
            }
        }
        mctx.putImageData(salida, 0, 0);

        ctxMascara.clearRect(0, 0, w, h);
        ctxMascara.imageSmoothingEnabled = true;
        ctxMascara.drawImage(mascaraOriginal, encaje.x, encaje.y, encaje.w, encaje.h);

        // Binarizar (ver juego-taller.js: sin esto, el borde antialiasado
        // de la máscara nunca llega al 100% de cobertura posible).
        const bin = ctxMascara.getImageData(0, 0, w, h);
        for (let i = 3; i < bin.data.length; i += 4) {
            bin.data[i] = bin.data[i] > 127 ? 255 : 0;
        }
        ctxMascara.putImageData(bin, 0, 0);

        construirSombreado(w, h);
        precalcularPuntosMuestra(w, h);
    }

    function construirSombreado(w, h) {
        const sctx = capaSombra.getContext('2d');
        sctx.clearRect(0, 0, w, h);
        let g = sctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.22)');
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, w, h);
        sctx.globalCompositeOperation = 'destination-in';
        sctx.drawImage(capaMascara, 0, 0);
        sctx.globalCompositeOperation = 'source-over';

        const bctx = capaBrillo.getContext('2d');
        bctx.clearRect(0, 0, w, h);
        g = bctx.createRadialGradient(w * 0.3, h * 0.08, 0, w * 0.3, h * 0.08, w * 0.6);
        g.addColorStop(0, 'rgba(255,255,255,0.3)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        bctx.fillStyle = g;
        bctx.fillRect(0, 0, w, h);
        bctx.globalCompositeOperation = 'destination-in';
        bctx.drawImage(capaMascara, 0, 0);
        bctx.globalCompositeOperation = 'source-over';
    }

    function precalcularPuntosMuestra(w, h) {
        puntosMuestra = [];
        const datos = ctxMascara.getImageData(0, 0, w, h).data;
        const paso = 10;
        for (let y = 0; y < h; y += paso) {
            for (let x = 0; x < w; x += paso) {
                if (datos[(y * w + x) * 4 + 3] > 128) puntosMuestra.push({ x, y });
            }
        }
    }

    function cargarEstancia(clave, callback) {
        cargandoEstancia = true;
        const cfg = ESTANCIAS[clave];
        const img = new Image();
        img.onload = () => {
            imagenActual = img;
            cargandoEstancia = false;
            ajustarTamanoCanvas();
            if (callback) callback();
        };
        img.src = cfg.src;
    }

    function ajustarTamanoCanvas() {
        const rect = lienzoVisible.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);
        lienzoVisible.width = w;
        lienzoVisible.height = h;
        reconstruirCapas();
        dibujarEscena();
    }

    function dibujarEscena() {
        const w = lienzoVisible.width, h = lienzoVisible.height;
        ctxVisible.clearRect(0, 0, w, h);
        ctxVisible.drawImage(capaBase, 0, 0);

        ctxVisible.globalCompositeOperation = 'multiply';
        ctxVisible.drawImage(capaPintura, 0, 0);
        ctxVisible.drawImage(capaSombra, 0, 0);
        ctxVisible.globalCompositeOperation = 'screen';
        ctxVisible.drawImage(capaBrillo, 0, 0);
        ctxVisible.globalCompositeOperation = 'source-over';
    }

    function dibujarDab(x, y) {
        const cfg = HERRAMIENTAS[estado.herramienta];
        const escala = encajeActual ? encajeActual.escala : 1;
        const radio = cfg.radio * escala;

        const g = ctxTrazo.createRadialGradient(x, y, 0, x, y, radio);
        g.addColorStop(0, hexAAlpha(estado.color, cfg.opacidadDab));
        g.addColorStop(0.7, hexAAlpha(estado.color, cfg.opacidadDab));
        g.addColorStop(1, hexAAlpha(estado.color, 0));
        ctxTrazo.fillStyle = g;
        ctxTrazo.beginPath();
        ctxTrazo.arc(x, y, radio, 0, Math.PI * 2);
        ctxTrazo.fill();

        if (cfg.mancha) {
            // Textura de cerdas de la brocha: motas pequeñas alrededor del centro.
            for (let i = 0; i < 6; i++) {
                const ang = Math.random() * Math.PI * 2;
                const dist = Math.random() * radio * 1.2;
                const mx = x + Math.cos(ang) * dist;
                const my = y + Math.sin(ang) * dist;
                ctxTrazo.fillStyle = hexAAlpha(estado.color, 0.2 + Math.random() * 0.25);
                ctxTrazo.beginPath();
                ctxTrazo.arc(mx, my, (1 + Math.random() * 2) * escala, 0, Math.PI * 2);
                ctxTrazo.fill();
            }
        }
    }

    function confirmarTrazo() {
        ctxTrazo.globalCompositeOperation = 'destination-in';
        ctxTrazo.drawImage(capaMascara, 0, 0);
        ctxTrazo.globalCompositeOperation = 'source-over';
        ctxPintura.drawImage(capaTrazo, 0, 0);
        ctxTrazo.clearRect(0, 0, capaTrazo.width, capaTrazo.height);
    }

    function hexAAlpha(hex, alpha) {
        const n = parseInt(hex.replace('#', ''), 16);
        const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function pintarEntre(p0, p1) {
        const cfg = HERRAMIENTAS[estado.herramienta];
        const escala = encajeActual ? encajeActual.escala : 1;
        const dx = p1.x - p0.x, dy = p1.y - p0.y;
        const dist = Math.hypot(dx, dy);
        const paso = cfg.espaciadoPx * escala;
        const pasos = Math.max(1, Math.floor(dist / paso));
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
        p.className = 'jp-particula';
        const tam = 8 + Math.random() * 10;
        p.style.width = tam + 'px';
        p.style.height = tam + 'px';
        p.style.left = (clientX - rect.left - tam / 2) + 'px';
        p.style.top = (clientY - rect.top - tam / 2) + 'px';
        p.style.background = estado.color;
        wrap.appendChild(p);
        setTimeout(() => p.remove(), 520);
    }

    let ultimaParticula = 0;

    function alPuntero(ev) {
        if (estado.terminado || cargandoEstancia) return;
        const punto = coordsDesdeEvento(ev);

        if (estado.ultimoPunto) {
            pintarEntre(estado.ultimoPunto, punto);
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
        estado.pintando = true;
        estado.ultimoPunto = null;
        document.getElementById('jp-pista').style.display = 'none';
        alPuntero(ev);
    });

    lienzoVisible.addEventListener('pointermove', (ev) => {
        if (!estado.pintando) return;
        alPuntero(ev);
    });

    function detenerPintura() {
        estado.pintando = false;
        estado.ultimoPunto = null;
    }

    lienzoVisible.addEventListener('pointerup', detenerPintura);
    lienzoVisible.addEventListener('pointercancel', detenerPintura);
    lienzoVisible.addEventListener('pointerleave', detenerPintura);

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
        const datos = ctxPintura.getImageData(0, 0, capaPintura.width, capaPintura.height).data;
        let cubiertos = 0;
        for (const pt of puntosMuestra) {
            const idx = (pt.y * capaPintura.width + pt.x) * 4 + 3;
            if (datos[idx] > 140) cubiertos++;
        }
        const pct = Math.round((cubiertos / puntosMuestra.length) * 100);
        if (pct === estado.porcentaje) return;
        estado.porcentaje = pct;

        document.getElementById('jp-porcentaje').textContent = pct + '%';
        document.getElementById('jp-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jp-barra-progreso').setAttribute('aria-valuenow', String(pct));

        if (pct >= UMBRAL_COMPLETADO && !estado.terminado) {
            terminarPartida();
        }
    }

    // ── Herramienta y color ──────────────────────────────────────────

    document.querySelectorAll('.jp-boton-herramienta').forEach((boton) => {
        boton.addEventListener('click', () => {
            document.querySelectorAll('.jp-boton-herramienta').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.herramienta = boton.dataset.herramienta;
        });
    });

    function seleccionarColor(hex, swatchActivo) {
        estado.color = hex;
        document.querySelectorAll('.jp-swatch').forEach((s) => {
            s.classList.remove('is-activo');
            s.setAttribute('aria-checked', 'false');
        });
        if (swatchActivo) {
            swatchActivo.classList.add('is-activo');
            swatchActivo.setAttribute('aria-checked', 'true');
        }
    }

    document.querySelectorAll('.jp-swatch').forEach((swatch) => {
        swatch.addEventListener('click', () => seleccionarColor(swatch.dataset.color, swatch));
    });

    const inputColorPersonalizado = document.getElementById('jp-color-personalizado');
    inputColorPersonalizado.addEventListener('input', () => seleccionarColor(inputColorPersonalizado.value, null));

    // ── Reiniciar ────────────────────────────────────────────────────

    function reiniciarPartida() {
        ctxPintura.clearRect(0, 0, capaPintura.width, capaPintura.height);
        ctxTrazo.clearRect(0, 0, capaTrazo.width, capaTrazo.height);
        estado.terminado = false;
        estado.porcentaje = 0;
        estado.ultimoPunto = null;
        document.getElementById('jp-porcentaje').textContent = '0%';
        document.getElementById('jp-barra-progreso-relleno').style.width = '0%';
        document.getElementById('jp-pista').style.display = '';
        dibujarEscena();
    }

    document.getElementById('jp-boton-reiniciar').addEventListener('click', reiniciarPartida);
    document.getElementById('jp-boton-jugar-de-nuevo').addEventListener('click', () => {
        document.getElementById('jp-celebracion-overlay').hidden = true;
        reiniciarPartida();
    });

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jp-confeti');
        contenedor.innerHTML = '';
        const colores = ['#e63946', '#ff8a3d', '#ffc93c', '#3a86ff', '#06d6a0', '#ffffff'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jp-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    function terminarPartida() {
        estado.terminado = true;

        document.getElementById('jp-celebracion-stat').textContent =
            `Pintaste el ${estado.porcentaje}% de la estancia`;

        const resultado = document.getElementById('jp-canvas-resultado');
        resultado.width = lienzoVisible.width;
        resultado.height = lienzoVisible.height;
        resultado.getContext('2d').drawImage(lienzoVisible, 0, 0);

        document.getElementById('jp-celebracion-overlay').hidden = false;
        lanzarConfeti();
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He pintado mi estancia en el minijuego de Orencio Matas y Hnos! 🖌️🏠';
    const URL_SITIO = window.location.href;

    async function compartir() {
        lienzoVisible.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'mi-estancia.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'mi-estancia-pintada.png', { type: 'image/png' })],
                        title: 'Pinta tu Estancia — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jp-compartir-overlay');
        const enlaceDescargar = document.getElementById('jp-boton-descargar');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = lienzoVisible.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jp-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jp-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jp-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jp-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jp-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jp-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jp-compartir-overlay').hidden = true;
    });
    document.getElementById('jp-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jp-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Estancia ─────────────────────────────────────────────────────
    // Cambiar de estancia reinicia la partida: las ilustraciones no
    // comparten tamaño ni posición de huecos, así que no tiene sentido
    // intentar conservar la pintura ya hecha.

    document.querySelectorAll('.jp-chip-estancia').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo') || cargandoEstancia) return;
            document.querySelectorAll('.jp-chip-estancia').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.estancia = boton.dataset.estancia;
            reiniciarPartida();
            cargarEstancia(estado.estancia);
        });
    });

    // ── Arranque ─────────────────────────────────────────────────────

    window.addEventListener('resize', debounce(ajustarTamanoCanvas, 200));

    function debounce(fn, ms) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    }

    cargarEstancia(estado.estancia);
})();
