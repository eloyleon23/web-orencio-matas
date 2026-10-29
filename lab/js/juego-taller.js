/**
 * Pinta el Coche — minijuego (lab/taller.html)
 * Vanilla JS, sin dependencias. El coche se dibuja en un <canvas> con
 * tres capas: una base "imprimación" gris con sombreado, una capa de
 * pintura transparente donde el usuario va dejando manchas con el dedo
 * o el ratón (recortada a la silueta de la carrocería, sin pintar
 * cristales ni llantas), y un sombreado final que se vuelve a aplicar
 * encima de todo en cada repintado para que la pintura "tenga volumen"
 * sea cual sea el color elegido.
 */
(function () {
    'use strict';

    // ── Geometría de los modelos (mismo sistema de coordenadas: 600x260) ──
    // Nombres genéricos de carrocería a propósito (sin marcas reales,
    // por derechos de marca registrada). Cada modelo trae su carrocería
    // (con el espejo incluido como una segunda subforma del mismo "d",
    // así es pintable igual que el resto de la chapa), sus cristales,
    // ruedas, y los elementos NO pintables (faro/piloto/parrilla), que
    // siempre se quedan con su color real sea cual sea el color elegido.

    const VB_W = 600, VB_H = 260;

    const VEHICULOS = {
        berlina: {
            nombre: 'Berlina GT',
            cuerpoD:
                'M26,176 C26,156 38,146 58,144 C70,118 96,86 132,68 C152,58 172,53 196,51 ' +
                'L344,50 C368,49 384,55 396,66 C410,80 418,96 422,110 C452,112 494,118 528,134 ' +
                'C554,146 576,158 576,172 L576,184 C576,195 567,200 556,200 L518,200 ' +
                'C518,178 500,160 478,160 C456,160 438,178 438,200 L232,200 ' +
                'C232,178 214,160 192,160 C170,160 152,178 152,200 L84,200 ' +
                'C58,200 26,196 26,182 Z ' +
                'M158,62 C166,58 176,59 178,66 C176,72 166,73 158,69 Z',
            cristalesD: [
                'M172,60 L198,54 L300,53 L340,55 L380,68 L398,94 L350,100 L230,100 L190,100 L168,88 Z',
            ],
            ruedas: [
                { cx: 192, cy: 200, r: 40 },
                { cx: 478, cy: 200, r: 40 },
            ],
            faro: { cx: 42, cy: 168, rx: 11, ry: 7, color: '#fef3c7' },
            piloto: { cx: 566, cy: 172, rx: 9, ry: 9, color: '#c0392b' },
            parrilla: { x: 28, y: 172, w: 24, h: 18, color: '#2a2a2a' },
        },
        suv: {
            nombre: 'SUV Urbano',
            cuerpoD:
                'M30,188 C30,162 44,148 68,145 L80,98 C83,75 98,58 120,53 L160,50 ' +
                'C176,42 196,40 218,40 L420,40 C452,40 476,58 482,88 L482,178 ' +
                'C482,192 472,202 458,202 L420,202 C420,180 402,162 380,162 C358,162 340,180 340,202 ' +
                'L195,202 C195,180 177,162 155,162 C133,162 115,180 115,202 L58,202 ' +
                'C42,202 30,198 30,186 Z ' +
                'M118,96 C126,91 136,92 138,99 C136,105 126,106 118,102 Z',
            cristalesD: [
                'M122,54 L158,49 L158,92 L108,92 Z',
                'M172,46 L410,46 L410,92 L172,92 Z',
            ],
            ruedas: [
                { cx: 155, cy: 202, r: 44 },
                { cx: 380, cy: 202, r: 44 },
            ],
            faro: { cx: 72, cy: 152, rx: 12, ry: 9, color: '#fef3c7' },
            piloto: { cx: 476, cy: 158, rx: 10, ry: 11, color: '#c0392b' },
            parrilla: { x: 48, y: 150, w: 28, h: 26, color: '#1f2023' },
        },
        furgoneta: {
            nombre: 'Furgoneta Reparto',
            cuerpoD:
                'M40,190 C40,166 55,150 80,148 L90,100 C92,80 106,65 126,60 L166,58 ' +
                'C182,50 200,48 222,48 L480,48 C512,48 536,66 540,96 L540,172 ' +
                'C540,188 530,198 515,198 L480,198 C480,176 462,158 440,158 C418,158 400,176 400,198 ' +
                'L220,198 C220,176 202,158 180,158 C158,158 140,176 140,198 L65,198 ' +
                'C50,198 40,186 40,174 Z ' +
                'M88,96 C96,91 106,92 108,99 C106,105 96,106 88,102 Z',
            cristalesD: [
                'M100,68 L122,64 L156,64 L156,140 L112,140 L100,110 Z',
                'M232,60 L470,60 L470,140 L232,140 Z',
            ],
            ruedas: [
                { cx: 180, cy: 198, r: 40 },
                { cx: 440, cy: 198, r: 40 },
            ],
            faro: { cx: 52, cy: 160, rx: 11, ry: 8, color: '#fef3c7' },
            piloto: { cx: 534, cy: 165, rx: 9, ry: 10, color: '#c0392b' },
            parrilla: { x: 32, y: 158, w: 20, h: 24, color: '#1f2023' },
        },
    };

    // ── Herramientas ──────────────────────────────────────────────────
    const HERRAMIENTAS = {
        pistola: { radio: 30, opacidadDab: 0.5, mancha: false, espaciadoPx: 7 },
        spray: { radio: 20, opacidadDab: 0.3, mancha: true, espaciadoPx: 6 },
    };

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
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

    // ── Canvas principal ──────────────────────────────────────────────
    const lienzoVisible = document.getElementById('jt-canvas');
    const ctxVisible = lienzoVisible.getContext('2d');

    const capaPintura = document.createElement('canvas');
    const ctxPintura = capaPintura.getContext('2d');

    let clipPintable = null; // Path2D, en coordenadas de canvas reales (no viewBox)
    let escala = 1;
    let puntosMuestra = []; // { x, y } en coords de canvas, precalculados "dentro" del área pintable
    let clipViewBox = null;
    let cuerpoViewBox = null;

    function construirPathsDelVehiculo() {
        // Carrocería MENOS cristales MENOS ruedas MENOS faro/piloto/
        // parrilla, vía regla "evenodd": el mismo punto cubierto dos
        // veces (cuerpo + agujero) queda fuera del recorte — así la
        // pintura nunca cubre cristales, llantas ni los elementos fijos.
        const v = VEHICULOS[estado.vehiculo];
        cuerpoViewBox = new Path2D(v.cuerpoD);

        const p = new Path2D();
        p.addPath(cuerpoViewBox);
        v.cristalesD.forEach((d) => p.addPath(new Path2D(d)));
        v.ruedas.forEach((r) => {
            const rueda = new Path2D();
            rueda.arc(r.cx, r.cy, r.r, 0, Math.PI * 2);
            p.addPath(rueda);
        });
        [v.faro, v.piloto].forEach((el) => {
            const forma = new Path2D();
            forma.ellipse(el.cx, el.cy, el.rx, el.ry, 0, 0, Math.PI * 2);
            p.addPath(forma);
        });
        const parrilla = new Path2D();
        parrilla.rect(v.parrilla.x, v.parrilla.y, v.parrilla.w, v.parrilla.h);
        p.addPath(parrilla);

        clipViewBox = p;
    }

    function ajustarTamanoCanvas() {
        const rect = lienzoVisible.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);

        [lienzoVisible, capaPintura].forEach((c) => {
            c.width = w;
            c.height = h;
        });

        escala = w / VB_W;

        // Recalcular el clip pintable en coordenadas reales de canvas.
        const m = new DOMMatrix().scale(escala, escala);
        clipPintable = new Path2D();
        clipPintable.addPath(clipViewBox, m);

        precalcularPuntosMuestra();
        dibujarEscena();
    }

    function precalcularPuntosMuestra() {
        // Rejilla de puntos (cada ~10px reales) usados para estimar el
        // % pintado — se calcula una sola vez por tamaño de canvas/
        // vehículo comprobando con isPointInPath cuáles caen dentro del
        // área pintable (evenodd, excluye cristales/ruedas/faros/etc.).
        puntosMuestra = [];
        const paso = 10;
        for (let y = 0; y < lienzoVisible.height; y += paso) {
            for (let x = 0; x < lienzoVisible.width; x += paso) {
                if (ctxVisible.isPointInPath(clipPintable, x, y, 'evenodd')) {
                    puntosMuestra.push({ x, y });
                }
            }
        }
    }

    // ── Dibujo de la base (imprimación gris + sombreado) ───────────────

    function dibujarCuerpo(ctx, relleno) {
        ctx.save();
        ctx.scale(escala, escala);
        ctx.fillStyle = relleno;
        ctx.fill(cuerpoViewBox);
        ctx.restore();
    }

    function dibujarSombreado(ctx) {
        ctx.save();
        ctx.scale(escala, escala);
        ctx.clip(cuerpoViewBox);

        // Sombra inferior (multiply)
        ctx.globalCompositeOperation = 'multiply';
        let g = ctx.createLinearGradient(0, 0, 0, VB_H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.42)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VB_W, VB_H);

        // Brillo superior (screen)
        ctx.globalCompositeOperation = 'screen';
        g = ctx.createRadialGradient(190, 40, 0, 190, 40, 260);
        g.addColorStop(0, 'rgba(255,255,255,0.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VB_W, VB_H);

        ctx.restore();
    }

    function dibujarCristalesYRuedas(ctx) {
        const v = VEHICULOS[estado.vehiculo];
        ctx.save();
        ctx.scale(escala, escala);

        ctx.fillStyle = 'rgba(188, 211, 230, 0.9)';
        v.cristalesD.forEach((d) => ctx.fill(new Path2D(d)));

        v.ruedas.forEach((r) => {
            ctx.fillStyle = '#2b2d30';
            ctx.beginPath();
            ctx.arc(r.cx, r.cy, r.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8a8d92';
            ctx.beginPath();
            ctx.arc(r.cx, r.cy, r.r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = v.parrilla.color;
        ctx.fillRect(v.parrilla.x, v.parrilla.y, v.parrilla.w, v.parrilla.h);

        [v.faro, v.piloto].forEach((el) => {
            ctx.fillStyle = el.color;
            ctx.beginPath();
            ctx.ellipse(el.cx, el.cy, el.rx, el.ry, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    function dibujarEscena() {
        ctxVisible.clearRect(0, 0, lienzoVisible.width, lienzoVisible.height);
        dibujarCuerpo(ctxVisible, '#c7cacd'); // imprimación gris
        ctxVisible.drawImage(capaPintura, 0, 0);
        dibujarSombreado(ctxVisible);
        dibujarCristalesYRuedas(ctxVisible);
    }

    // ── Pintura: dabs en la capa de pintura ─────────────────────────────

    function dibujarDab(x, y) {
        const cfg = HERRAMIENTAS[estado.herramienta];
        const radio = cfg.radio * escala;

        ctxPintura.save();
        ctxPintura.clip(clipPintable);

        const g = ctxPintura.createRadialGradient(x, y, 0, x, y, radio);
        g.addColorStop(0, hexAAlpha(estado.color, cfg.opacidadDab));
        g.addColorStop(0.7, hexAAlpha(estado.color, cfg.opacidadDab));
        g.addColorStop(1, hexAAlpha(estado.color, 0));
        ctxPintura.fillStyle = g;
        ctxPintura.beginPath();
        ctxPintura.arc(x, y, radio, 0, Math.PI * 2);
        ctxPintura.fill();

        if (cfg.mancha) {
            // Textura de spray: motas pequeñas alrededor del centro.
            for (let i = 0; i < 7; i++) {
                const ang = Math.random() * Math.PI * 2;
                const dist = Math.random() * radio * 1.3;
                const mx = x + Math.cos(ang) * dist;
                const my = y + Math.sin(ang) * dist;
                ctxPintura.fillStyle = hexAAlpha(estado.color, 0.18 + Math.random() * 0.25);
                ctxPintura.beginPath();
                ctxPintura.arc(mx, my, (1 + Math.random() * 2.2) * escala, 0, Math.PI * 2);
                ctxPintura.fill();
            }
        }

        ctxPintura.restore();
    }

    function hexAAlpha(hex, alpha) {
        const n = parseInt(hex.replace('#', ''), 16);
        const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function pintarEntre(p0, p1) {
        const cfg = HERRAMIENTAS[estado.herramienta];
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
        if (estado.terminado) return;
        const punto = coordsDesdeEvento(ev);

        if (!estado.inicioTiempo) iniciarCronometro();

        if (estado.ultimoPunto) {
            pintarEntre(estado.ultimoPunto, punto);
        } else {
            dibujarDab(punto.x, punto.y);
        }
        estado.ultimoPunto = punto;

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

        if (pct >= 90 && !estado.terminado) {
            terminarPartida();
        }
    }

    // ── Cronómetro ───────────────────────────────────────────────────

    function iniciarCronometro() {
        estado.inicioTiempo = performance.now();
        estado.cronometroId = setInterval(actualizarCronometro, 250);
    }

    function actualizarCronometro() {
        const segundos = Math.floor((performance.now() - estado.inicioTiempo) / 1000);
        const m = Math.floor(segundos / 60);
        const s = segundos % 60;
        document.getElementById('jt-cronometro').textContent = m + ':' + String(s).padStart(2, '0');
    }

    function detenerCronometro() {
        if (estado.cronometroId) clearInterval(estado.cronometroId);
        estado.cronometroId = null;
    }

    function textoTiempoTranscurrido() {
        if (!estado.inicioTiempo) return '0:00';
        const segundos = Math.floor((performance.now() - estado.inicioTiempo) / 1000);
        const m = Math.floor(segundos / 60);
        const s = segundos % 60;
        return m + ':' + String(s).padStart(2, '0');
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
        estado.inicioTiempo = null;
        estado.terminado = false;
        estado.porcentaje = 0;
        estado.ultimoPunto = null;
        detenerCronometro();
        document.getElementById('jt-cronometro').textContent = '0:00';
        document.getElementById('jt-porcentaje').textContent = '0%';
        document.getElementById('jt-barra-progreso-relleno').style.width = '0%';
        document.getElementById('jt-pista').style.display = '';
        dibujarEscena();
    }

    document.getElementById('jt-boton-reiniciar').addEventListener('click', reiniciarPartida);
    document.getElementById('jt-boton-jugar-de-nuevo').addEventListener('click', () => {
        document.getElementById('jt-celebracion-overlay').hidden = true;
        reiniciarPartida();
    });

    // ── Modelo de vehículo ───────────────────────────────────────────
    // Cambiar de modelo reinicia la partida: las siluetas no comparten
    // tamaño ni posición de ruedas, así que no tiene sentido intentar
    // conservar la pintura ya hecha.

    document.querySelectorAll('.jt-chip-modelo').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jt-chip-modelo').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.vehiculo = boton.dataset.vehiculo;
            construirPathsDelVehiculo();
            reiniciarPartida();
            ajustarTamanoCanvas();
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

    function terminarPartida() {
        estado.terminado = true;
        detenerCronometro();

        const tiempoTexto = textoTiempoTranscurrido();
        document.getElementById('jt-celebracion-stat').textContent =
            `Pintado al ${estado.porcentaje}% en ${tiempoTexto}`;

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

    construirPathsDelVehiculo();
    ajustarTamanoCanvas();
})();
