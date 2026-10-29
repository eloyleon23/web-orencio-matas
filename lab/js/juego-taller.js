/**
 * Pinta el Coche — minijuego (lab/taller.html)
 * Vanilla JS, sin dependencias. Las siluetas de los 3 modelos son
 * ilustraciones vectoriales reales (no dibujadas a mano aquí), de
 * Pixabay — licencia Pixabay Content License (gratis para uso
 * comercial, sin atribución obligatoria): "Car Silhouette Vehicle Auto
 * Sedan" / "Blueprint Automobile Technical" (Clker-Free-Vector-Images),
 * "SUV Vehicle Suburban" (Clker-Free-Vector-Images), "Truck Van White
 * Vehicle" (OpenClipart-Vectors). Guardadas en lab/assets/.
 *
 * El coche se dibuja en un <canvas> con tres capas: la ilustración
 * original tal cual (siempre arriba del todo, para que las líneas y
 * los detalles —cristales, llantas, faros— se mantengan nítidos), una
 * capa de pintura donde el usuario va dejando manchas de color, y un
 * sombreado final — todo recortado a una MÁSCARA del área pintable
 * calculada automáticamente por inundación (flood fill) a partir de la
 * propia imagen: se parte de fuera del coche y de dentro de cada
 * cristal/llanta (puntos "semilla") y se expande por los píxeles
 * conectados hasta chocar con una línea del dibujo — así nunca hay que
 * dibujar a mano el contorno de la carrocería.
 */
(function () {
    'use strict';

    // ── Modelos disponibles ──────────────────────────────────────────
    // Nombres genéricos de carrocería a propósito (sin marcas reales,
    // por derechos de marca registrada).
    //
    // Cada modelo define cómo construir su máscara de área pintable:
    //  - wallAlpha: umbral de alfa para considerar un píxel "línea del
    //    dibujo" al expandirse desde FUERA del coche (siempre encuentra
    //    el contorno exterior real, sea cual sea su forma).
    //  - exteriorExcluido: true si la imagen tiene la carrocería en
    //    blanco OPACO (en vez de transparente) — en ese caso, además de
    //    "no-exterior", solo se pinta lo que además sea casi blanco (el
    //    resto —líneas, cristales ya coloreados, pilotos— se deja tal
    //    cual sin necesitar semillas de exclusión una a una).
    //  - semillasExcluir: puntos (en píxeles de la imagen original) de
    //    dentro de cada cristal/llanta — se excluyen igual que el
    //    exterior, expandiéndose hasta la siguiente línea.
    const VEHICULOS = {
        berlina: {
            nombre: 'Berlina',
            src: 'assets/coche-berlina.png',
            wallAlpha: 60,
            exteriorExcluido: false,
            semillasExcluir: [[430, 165], [560, 150], [185, 355], [690, 350]],
        },
        suv: {
            nombre: 'SUV Urbano',
            src: 'assets/coche-suv.png',
            wallAlpha: 60,
            exteriorExcluido: false,
            semillasExcluir: [[150, 270], [500, 270], [800, 270], [290, 580], [1065, 580]],
        },
        furgoneta: {
            nombre: 'Furgoneta Reparto',
            src: 'assets/coche-furgoneta.png',
            wallAlpha: 10,
            exteriorExcluido: true,
            semillasExcluir: [[365, 525], [1090, 500]],
        },
    };

    // ── Herramientas ──────────────────────────────────────────────────
    const HERRAMIENTAS = {
        pistola: { radio: 30, opacidadDab: 0.55, mancha: false, espaciadoPx: 7 },
        spray: { radio: 20, opacidadDab: 0.32, mancha: true, espaciadoPx: 6 },
    };

    // ── Modos de juego ──────────────────────────────────────────────────
    // contrarreloj: pintar el 100% en el menor tiempo posible (cronómetro
    // cuenta hacia arriba, la partida termina en cuanto se completa).
    // desafio: pintar el mayor % posible en un tiempo fijo (cuenta atrás;
    // la partida termina al agotarse el tiempo, o antes si se llega al
    // 100%). DURACION_DESAFIO_MS es la única fuente de verdad de los
    // "30s" que también se muestran en el botón del modo (ver arranque).
    const DURACION_DESAFIO_MS = 30000;
    const UMBRAL_COMPLETADO = 100; // % para dar la partida por "terminada" en contrarreloj/desafío anticipado

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        modo: 'contrarreloj',
        vehiculo: 'berlina',
        herramienta: 'pistola',
        color: '#b3261e',
        pintando: false,
        ultimoPunto: null,
        inicioTiempo: null,
        cronometroId: null,
        terminado: false,
        porcentaje: 0,
    };

    // ── Canvas principal y capas de trabajo ─────────────────────────────
    const lienzoVisible = document.getElementById('jt-canvas');
    const ctxVisible = lienzoVisible.getContext('2d');

    const capaBase = document.createElement('canvas'); // la ilustración, ya encajada y centrada
    const ctxBase = capaBase.getContext('2d');
    const capaMascara = document.createElement('canvas'); // blanco opaco = pintable, transparente = no
    const ctxMascara = capaMascara.getContext('2d');
    const capaSombra = document.createElement('canvas'); // sombreado inferior, ya recortado a la máscara
    const capaBrillo = document.createElement('canvas'); // brillo superior, ya recortado a la máscara
    const capaPintura = document.createElement('canvas'); // manchas de color YA confirmadas (permanentes)
    const ctxPintura = capaPintura.getContext('2d');
    const capaTrazo = document.createElement('canvas'); // dabs del trazo en curso, antes de confirmarse
    const ctxTrazo = capaTrazo.getContext('2d');

    let puntosMuestra = []; // { x, y } precalculados dentro del área pintable, para estimar el %
    let imagenActual = null;
    let cargandoVehiculo = false;

    // ── Construcción de la máscara por inundación (flood fill) ─────────

    function alfaEn(datos, w, h, x, y, fueraDeLimites) {
        if (x < 0 || y < 0 || x >= w || y >= h) return fueraDeLimites;
        return datos[(y * w + x) * 4 + 3];
    }

    function esCasiBlanco(datos, w, x, y) {
        const o = (y * w + x) * 4;
        return datos[o + 3] > 200 && datos[o] > 225 && datos[o + 1] > 225 && datos[o + 2] > 225;
    }

    // Inundación desde una lista de semillas, expandiéndose por píxeles
    // 4-conectados mientras NO sean "pared" según esParedFn. Devuelve un
    // Uint8Array (1 = alcanzado por la inundación).
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

    // Construye el Uint8Array de "es pintable" para la imagen ORIGINAL
    // (en sus propias coordenadas de píxel, antes de escalarla al
    // canvas). Un punto es pintable si: no es exterior del coche, no
    // cae en ninguna de las semillas de exclusión (cristales/llantas), y
    // —si el modelo lo pide— además es de color casi blanco.
    function calcularMascaraPintable(img, cfg) {
        const w = img.naturalWidth, h = img.naturalHeight;
        const tmp = document.createElement('canvas');
        tmp.width = w;
        tmp.height = h;
        const tctx = tmp.getContext('2d');
        tctx.drawImage(img, 0, 0);
        const datos = tctx.getImageData(0, 0, w, h).data;

        const esParedExterior = (x, y) => alfaEn(datos, w, h, x, y, 255) >= cfg.wallAlpha;
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
        const margen = 0.92;
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

        const cfg = VEHICULOS[estado.vehiculo];
        const encaje = calcularEncaje(imagenActual.naturalWidth, imagenActual.naturalHeight, w, h);
        encajeActual = encaje;

        // Capa base: la ilustración tal cual, encajada y centrada.
        ctxBase.clearRect(0, 0, w, h);
        ctxBase.drawImage(imagenActual, encaje.x, encaje.y, encaje.w, encaje.h);

        // Máscara pintable (en coordenadas originales de la imagen),
        // reescalada al mismo encaje que la capa base.
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

        // Binarizar la máscara ya escalada (alfa 0 o 255, sin medios
        // tonos) — el suavizado del drawImage de arriba deja un borde
        // antialiasado de varios píxeles con alfa intermedio. Sin este
        // paso, esos píxeles de borde entran en puntosMuestra (alfa >
        // umbral de inclusión) pero el recorte de la pintura (ver
        // confirmarTrazo) los limita a ESE MISMO alfa parcial como
        // máximo posible — nunca llegan al umbral de "ya está pintado",
        // así que una parte del contorno queda matemáticamente
        // imposible de completar y el 100% nunca se alcanza.
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
        g.addColorStop(1, 'rgba(0,0,0,0.38)');
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, w, h);
        sctx.globalCompositeOperation = 'destination-in';
        sctx.drawImage(capaMascara, 0, 0);
        sctx.globalCompositeOperation = 'source-over';

        const bctx = capaBrillo.getContext('2d');
        bctx.clearRect(0, 0, w, h);
        g = bctx.createRadialGradient(w * 0.32, h * 0.12, 0, w * 0.32, h * 0.12, w * 0.55);
        g.addColorStop(0, 'rgba(255,255,255,0.45)');
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

    function cargarVehiculo(clave, callback) {
        cargandoVehiculo = true;
        const cfg = VEHICULOS[clave];
        const img = new Image();
        img.onload = () => {
            imagenActual = img;
            cargandoVehiculo = false;
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

    // ── Composición final de cada fotograma ─────────────────────────────
    // multiply(blanco, color) = color exactamente, así que "teñir" el
    // cuerpo pintado de blanco con el color elegido es tan simple como
    // dibujar la capa de pintura (ya recortada a la máscara) encima con
    // mezcla "multiply" — las líneas oscuras del dibujo, al multiplicar
    // por casi negro, se quedan prácticamente igual de oscuras.

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

    // ── Pintura: dabs en la capa de trazo, confirmados a la de pintura ──
    // Los dabs se dibujan primero en capaTrazo (el trazo en curso) y SOLO
    // al final de cada evento de puntero se recortan a la máscara UNA vez
    // y se funden en capaPintura (permanente, ya no se vuelve a tocar).
    // Antes el recorte se repetía en cada dab sobre la capa YA
    // permanente: como la máscara tenía un borde antialiasado (alfa
    // intermedio en varios píxeles), cada recorte volvía a multiplicar
    // ese alfa por el mismo valor fraccionario — la pintura cercana al
    // contorno se iba "desvaneciendo" con cada trazo nuevo en cualquier
    // parte del coche, y el 100% nunca llegaba a alcanzarse de verdad.

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
            // Textura de spray: motas pequeñas alrededor del centro.
            for (let i = 0; i < 7; i++) {
                const ang = Math.random() * Math.PI * 2;
                const dist = Math.random() * radio * 1.3;
                const mx = x + Math.cos(ang) * dist;
                const my = y + Math.sin(ang) * dist;
                ctxTrazo.fillStyle = hexAAlpha(estado.color, 0.18 + Math.random() * 0.25);
                ctxTrazo.beginPath();
                ctxTrazo.arc(mx, my, (1 + Math.random() * 2.2) * escala, 0, Math.PI * 2);
                ctxTrazo.fill();
            }
        }
    }

    function confirmarTrazo() {
        // Recorta SOLO lo nuevo (capaTrazo) a la máscara, una vez, y lo
        // funde en la capa permanente — esta última nunca se vuelve a
        // recortar, así que no puede decaer.
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
        p.className = 'jt-particula';
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
        if (estado.terminado || cargandoVehiculo) return;
        const punto = coordsDesdeEvento(ev);

        if (!estado.inicioTiempo) iniciarCronometro();

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
        document.getElementById('jt-pista').style.display = 'none';
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
            const idx = (pt.y * capaPintura.width + pt.x) * 4 + 3; // canal alpha
            if (datos[idx] > 140) cubiertos++;
        }
        const pct = Math.round((cubiertos / puntosMuestra.length) * 100);
        if (pct === estado.porcentaje) return;
        estado.porcentaje = pct;

        document.getElementById('jt-porcentaje').textContent = pct + '%';
        document.getElementById('jt-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jt-barra-progreso').setAttribute('aria-valuenow', String(pct));

        // En los dos modos, llegar al 100% da la partida por terminada
        // de inmediato — en desafío, de sobra, nada más que pintar.
        if (pct >= UMBRAL_COMPLETADO && !estado.terminado) {
            terminarPartida('completado');
        }
    }

    // ── Cronómetro ───────────────────────────────────────────────────
    // Contrarreloj: cuenta HACIA ARRIBA, sin límite, hasta completar.
    // Desafío: cuenta ATRÁS desde DURACION_DESAFIO_MS; al llegar a 0,
    // termina la partida aunque no se haya pintado el 100%.

    function formatoTiempoMs(ms) {
        const segundos = Math.max(0, Math.floor(ms / 1000));
        const m = Math.floor(segundos / 60);
        const s = segundos % 60;
        return m + ':' + String(s).padStart(2, '0');
    }

    function iniciarCronometro() {
        estado.inicioTiempo = performance.now();
        if (estado.modo === 'desafio') {
            estado.cronometroId = setInterval(actualizarCronometroDesafio, 200);
        } else {
            estado.cronometroId = setInterval(actualizarCronometroContrarreloj, 250);
        }
    }

    function actualizarCronometroContrarreloj() {
        document.getElementById('jt-cronometro').textContent =
            formatoTiempoMs(performance.now() - estado.inicioTiempo);
    }

    function actualizarCronometroDesafio() {
        const restante = DURACION_DESAFIO_MS - (performance.now() - estado.inicioTiempo);
        document.getElementById('jt-cronometro').textContent = formatoTiempoMs(restante);
        if (restante <= 0 && !estado.terminado) {
            terminarPartida('tiempo');
        }
    }

    function detenerCronometro() {
        if (estado.cronometroId) clearInterval(estado.cronometroId);
        estado.cronometroId = null;
    }

    function tiempoTranscurridoMs() {
        return estado.inicioTiempo ? performance.now() - estado.inicioTiempo : 0;
    }

    // ── Historial / ranking de esta sesión (sessionStorage) ────────────
    // Guardado por modo + modelo (los tiempos de un turismo y de una
    // furgoneta no son comparables). "En sesión": se usa sessionStorage
    // a propósito, no localStorage — se pierde al cerrar la pestaña.

    const CLAVE_HISTORIAL = 'jt_historial_v1';

    function cargarHistorialCompleto() {
        try {
            return JSON.parse(sessionStorage.getItem(CLAVE_HISTORIAL)) || [];
        } catch (err) {
            return [];
        }
    }

    function guardarResultado(entrada) {
        const todo = cargarHistorialCompleto();
        todo.push(entrada);
        try {
            sessionStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(todo));
        } catch (err) {
            // Cuota llena o sessionStorage no disponible (navegación
            // privada muy restrictiva) — el ranking de esta partida
            // simplemente no queda guardado, el juego sigue funcionando.
        }
        return todo;
    }

    function historialFiltrado(todo) {
        return todo
            .filter((e) => e.modo === estado.modo && e.vehiculo === estado.vehiculo)
            .sort((a, b) => estado.modo === 'contrarreloj'
                ? a.tiempoMs - b.tiempoMs
                : (b.porcentaje - a.porcentaje) || (a.tiempoMs - b.tiempoMs));
    }

    function renderHistorial() {
        const lista = document.getElementById('jt-historial-lista');
        const vacio = document.getElementById('jt-historial-vacio');
        const filtrado = historialFiltrado(cargarHistorialCompleto()).slice(0, 5);

        lista.innerHTML = '';
        vacio.style.display = filtrado.length ? 'none' : '';

        filtrado.forEach((entrada, i) => {
            const li = document.createElement('li');
            li.className = 'jt-historial__item' + (i === 0 ? ' es-mejor' : '');

            const puesto = document.createElement('span');
            puesto.className = 'jt-historial__puesto';
            puesto.textContent = '#' + (i + 1);

            const detalle = document.createElement('span');
            detalle.className = 'jt-historial__detalle';
            detalle.textContent = estado.modo === 'contrarreloj'
                ? `${entrada.porcentaje}% en ${formatoTiempoMs(entrada.tiempoMs)}`
                : `${entrada.porcentaje}% pintado`;

            const fechaSpan = document.createElement('span');
            fechaSpan.className = 'jt-historial__fecha';
            fechaSpan.textContent = new Date(entrada.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            li.append(puesto, detalle, fechaSpan);
            lista.appendChild(li);
        });
    }

    // ── Herramienta y color ──────────────────────────────────────────

    document.querySelectorAll('.jt-boton-herramienta').forEach((boton) => {
        boton.addEventListener('click', () => {
            document.querySelectorAll('.jt-boton-herramienta').forEach((b) => {
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
        document.querySelectorAll('.jt-swatch').forEach((s) => {
            s.classList.remove('is-activo');
            s.setAttribute('aria-checked', 'false');
        });
        if (swatchActivo) {
            swatchActivo.classList.add('is-activo');
            swatchActivo.setAttribute('aria-checked', 'true');
        }
    }

    document.querySelectorAll('.jt-swatch').forEach((swatch) => {
        swatch.addEventListener('click', () => seleccionarColor(swatch.dataset.color, swatch));
    });

    const inputColorPersonalizado = document.getElementById('jt-color-personalizado');
    inputColorPersonalizado.addEventListener('input', () => seleccionarColor(inputColorPersonalizado.value, null));

    // ── Reiniciar ────────────────────────────────────────────────────

    function reiniciarPartida() {
        ctxPintura.clearRect(0, 0, capaPintura.width, capaPintura.height);
        ctxTrazo.clearRect(0, 0, capaTrazo.width, capaTrazo.height);
        estado.inicioTiempo = null;
        estado.terminado = false;
        estado.porcentaje = 0;
        estado.ultimoPunto = null;
        detenerCronometro();
        document.getElementById('jt-cronometro').textContent =
            estado.modo === 'desafio' ? formatoTiempoMs(DURACION_DESAFIO_MS) : '0:00';
        document.getElementById('jt-cronometro-etiqueta').textContent =
            estado.modo === 'desafio' ? 'restante' : 'tiempo';
        document.getElementById('jt-porcentaje').textContent = '0%';
        document.getElementById('jt-barra-progreso-relleno').style.width = '0%';
        document.getElementById('jt-pista').style.display = '';
        document.getElementById('jt-celebracion-ranking').textContent = '';
        dibujarEscena();
    }

    document.getElementById('jt-boton-reiniciar').addEventListener('click', reiniciarPartida);
    document.getElementById('jt-boton-jugar-de-nuevo').addEventListener('click', () => {
        document.getElementById('jt-celebracion-overlay').hidden = true;
        reiniciarPartida();
    });

    // ── Modelo de vehículo ───────────────────────────────────────────
    // Cambiar de modelo reinicia la partida: las ilustraciones no
    // comparten tamaño ni posición de ruedas, así que no tiene sentido
    // intentar conservar la pintura ya hecha.

    document.querySelectorAll('.jt-chip-modelo').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo') || cargandoVehiculo) return;
            document.querySelectorAll('.jt-chip-modelo').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.vehiculo = boton.dataset.vehiculo;
            reiniciarPartida();
            renderHistorial();
            cargarVehiculo(estado.vehiculo);
        });
    });

    // ── Modo de juego ──────────────────────────────────────────────────

    document.querySelectorAll('.jt-chip-modo').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jt-chip-modo').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.modo = boton.dataset.modo;
            reiniciarPartida();
            renderHistorial();
        });
    });

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jt-confeti');
        contenedor.innerHTML = '';
        const colores = ['#b3261e', '#1e4b8f', '#1b8f4c', '#f0b429', '#ffffff'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jt-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // motivo: 'completado' (llegó al 100%, en cualquier modo) o 'tiempo'
    // (se acabó la cuenta atrás del desafío sin llegar al 100%).
    function terminarPartida(motivo) {
        estado.terminado = true;
        detenerCronometro();

        const entrada = {
            modo: estado.modo,
            vehiculo: estado.vehiculo,
            porcentaje: estado.porcentaje,
            tiempoMs: Math.round(estado.modo === 'desafio' ? DURACION_DESAFIO_MS : tiempoTranscurridoMs()),
            fecha: new Date().toISOString(),
        };
        const todoElHistorial = guardarResultado(entrada);
        const filtrado = historialFiltrado(todoElHistorial);
        const posicion = filtrado.findIndex((e) => e.fecha === entrada.fecha) + 1;
        const tiempoTexto = formatoTiempoMs(entrada.tiempoMs);

        const titulo = document.getElementById('jt-celebracion-titulo');
        const stat = document.getElementById('jt-celebracion-stat');
        if (motivo === 'tiempo') {
            titulo.textContent = '¡Se acabó el tiempo! ⏰';
            stat.textContent = `Pintaste el ${estado.porcentaje}% en ${tiempoTexto}`;
        } else {
            titulo.textContent = '¡Coche terminado! 🏁';
            stat.textContent = estado.modo === 'contrarreloj'
                ? `Lo pintaste en ${tiempoTexto}`
                : `Pintaste el ${estado.porcentaje}% — ¡con tiempo de sobra! (${tiempoTexto})`;
        }

        document.getElementById('jt-celebracion-ranking').textContent = posicion === 1
            ? '🏆 ¡Nuevo mejor resultado de la sesión, en este modo y modelo!'
            : `Puesto #${posicion} de ${filtrado.length} intentos (este modo y modelo).`;

        renderHistorial();

        const resultado = document.getElementById('jt-canvas-resultado');
        resultado.width = lienzoVisible.width;
        resultado.height = lienzoVisible.height;
        resultado.getContext('2d').drawImage(lienzoVisible, 0, 0);

        document.getElementById('jt-celebracion-overlay').hidden = false;
        lanzarConfeti();
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He pintado mi coche en el minijuego de Orencio Matas y Hnos! 🎨🚗';
    const URL_SITIO = window.location.href;

    async function compartir() {
        lienzoVisible.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'mi-coche.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'mi-coche-pintado.png', { type: 'image/png' })],
                        title: 'Pinta el Coche — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jt-compartir-overlay');
        const enlaceDescargar = document.getElementById('jt-boton-descargar');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = lienzoVisible.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jt-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jt-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jt-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jt-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jt-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jt-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jt-compartir-overlay').hidden = true;
    });
    document.getElementById('jt-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jt-compartir-overlay') ev.currentTarget.hidden = true;
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

    document.getElementById('jt-desafio-duracion').textContent = Math.round(DURACION_DESAFIO_MS / 1000);
    renderHistorial();
    cargarVehiculo(estado.vehiculo);
})();
