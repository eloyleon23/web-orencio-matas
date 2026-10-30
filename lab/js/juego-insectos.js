/**
 * Fuera Bichos — minijuego (lab/insectos.html)
 * Vanilla JS, sin dependencias. Aparecen cucarachas, hormigas, moscas
 * y avispas (emoji, sin imágenes propias que generar) en una zona de
 * juego y hay que "fumigarlas" tocándolas antes de que se acabe el
 * tiempo. Tres niveles de dificultad: cambian cuántos bichos aparecen
 * en total, cuántos a la vez, lo rápido que se mueven y el tiempo
 * disponible.
 *
 * Los bichos son elementos normales del DOM (no canvas): cada uno
 * elige un punto aleatorio dentro de la zona de juego y se desplaza
 * hasta él con una transición CSS — más sencillo y igual de fluido
 * que animar a mano, y no hace falta recalcular colisiones de pintura
 * como en el resto de la suite (aquí "matar" un bicho es, simplemente,
 * quitarlo del DOM).
 */
(function () {
    'use strict';

    // ── Bichos disponibles ──────────────────────────────────────────────
    // velocidadBase en píxeles/segundo — cada bicho recorre la distancia
    // real hasta su próximo punto a esta velocidad (en vez de un tiempo
    // fijo al azar), para que un salto largo no se vea disparado: antes
    // tardaba lo mismo recorrer 50px que 500px, así que un salto largo
    // parecía mucho más rápido de lo que debía.
    const INSECTOS = {
        cucaracha: { emoji: '🪳', tam: 46, velocidadBase: 55 },
        hormiga: { emoji: '🐜', tam: 30, velocidadBase: 70 },
        mosca: { emoji: '🪰', tam: 34, velocidadBase: 95 },
        avispa: { emoji: '🐝', tam: 40, velocidadBase: 115 },
    };
    const CLAVES_INSECTOS = Object.keys(INSECTOS);

    // ── Dificultad ───────────────────────────────────────────────────
    // tiempoTotal (s), totalInsectos (a lo largo de toda la partida),
    // maxSimultaneos (a la vez en pantalla), intervaloAparicion (ms
    // entre apariciones), velocidad (multiplica la velocidadBase de
    // cada bicho) y pausaMin/Max (ms parado entre un salto y el
    // siguiente: a más difícil, pausas más cortas, así que apenas se
    // está quieto). pesos: probabilidad de que aparezca cada tipo de
    // bicho — a más difícil, predominan los más rápidos (mosca/avispa)
    // sobre los más lentos (cucaracha/hormiga), no solo sube un
    // multiplicador global.
    const DIFICULTADES = {
        facil: {
            nombre: 'Fácil', tiempoTotal: 65, totalInsectos: 12, maxSimultaneos: 3,
            intervaloAparicion: 1500, velocidad: 0.7, pausaMin: 300, pausaMax: 600,
            pesos: { cucaracha: 0.4, hormiga: 0.3, mosca: 0.2, avispa: 0.1 },
        },
        medio: {
            nombre: 'Medio', tiempoTotal: 55, totalInsectos: 20, maxSimultaneos: 6,
            intervaloAparicion: 850, velocidad: 1.15, pausaMin: 150, pausaMax: 350,
            pesos: { cucaracha: 0.2, hormiga: 0.25, mosca: 0.3, avispa: 0.25 },
        },
        dificil: {
            nombre: 'Difícil', tiempoTotal: 45, totalInsectos: 30, maxSimultaneos: 9,
            intervaloAparicion: 550, velocidad: 1.7, pausaMin: 60, pausaMax: 180,
            pesos: { cucaracha: 0.1, hormiga: 0.15, mosca: 0.35, avispa: 0.4 },
        },
    };

    function elegirInsecto(pesos) {
        const r = Math.random();
        let acum = 0;
        for (const clave of CLAVES_INSECTOS) {
            acum += pesos[clave];
            if (r <= acum) return clave;
        }
        return CLAVES_INSECTOS[CLAVES_INSECTOS.length - 1];
    }

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        dificultad: 'medio',
        vivos: [],
        aparecidos: 0,
        matados: 0,
        tiempoRestante: 0,
        terminado: false,
        jugando: false,
    };

    let temporizadorCuentaAtras = null;
    let temporizadorAparicion = null;

    const arena = document.getElementById('ji-arena');

    // ── Cursor de spray decorativo ──────────────────────────────────────

    const spray = document.createElement('div');
    spray.className = 'ji-spray-cursor';
    spray.textContent = '💦';
    spray.hidden = true;
    arena.appendChild(spray);

    arena.addEventListener('pointermove', (ev) => {
        const rect = arena.getBoundingClientRect();
        spray.hidden = false;
        spray.style.left = (ev.clientX - rect.left) + 'px';
        spray.style.top = (ev.clientY - rect.top) + 'px';
    });
    arena.addEventListener('pointerleave', () => { spray.hidden = true; });

    function lanzarNube(clientX, clientY) {
        const rect = arena.getBoundingClientRect();
        const nube = document.createElement('span');
        nube.className = 'ji-nube';
        nube.style.left = (clientX - rect.left) + 'px';
        nube.style.top = (clientY - rect.top) + 'px';
        arena.appendChild(nube);
        setTimeout(() => nube.remove(), 420);
    }

    // ── Aparición y movimiento de bichos ─────────────────────────────────

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    function aparecerInsecto() {
        if (estado.terminado) return;
        if (estado.aparecidos >= cfgDificultad().totalInsectos) return;
        if (estado.vivos.length >= cfgDificultad().maxSimultaneos) return;

        const clave = elegirInsecto(cfgDificultad().pesos);
        const cfg = INSECTOS[clave];
        const rect = arena.getBoundingClientRect();

        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'ji-insecto';
        el.style.fontSize = cfg.tam + 'px';
        el.style.width = cfg.tam + 'px';
        el.style.height = cfg.tam + 'px';
        el.setAttribute('aria-label', 'Insecto');
        el.textContent = cfg.emoji;

        const maxX = Math.max(1, rect.width - cfg.tam);
        const maxY = Math.max(1, rect.height - cfg.tam);
        el.style.left = (Math.random() * maxX) + 'px';
        el.style.top = (Math.random() * maxY) + 'px';

        el.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            matarInsecto(el);
            lanzarNube(ev.clientX, ev.clientY);
        });

        arena.appendChild(el);
        estado.vivos.push(el);
        estado.aparecidos++;
        moverInsecto(el, cfg);
    }

    function moverInsecto(el, cfg) {
        if (!estado.vivos.includes(el) || estado.terminado) return;
        const rect = arena.getBoundingClientRect();
        const maxX = Math.max(1, rect.width - cfg.tam);
        const maxY = Math.max(1, rect.height - cfg.tam);
        const actualX = parseFloat(el.style.left) || 0;
        const actualY = parseFloat(el.style.top) || 0;
        const nuevoX = Math.random() * maxX;
        const nuevoY = Math.random() * maxY;

        const distancia = Math.hypot(nuevoX - actualX, nuevoY - actualY);
        const velocidadPxSeg = cfg.velocidadBase * cfgDificultad().velocidad;
        const duracion = Math.max(450, (distancia / velocidadPxSeg) * 1000);

        el.style.transition = `left ${duracion}ms linear, top ${duracion}ms linear`;
        el.style.left = nuevoX + 'px';
        el.style.top = nuevoY + 'px';
        el.style.transform = nuevoX < actualX ? 'scaleX(-1)' : 'scaleX(1)';

        // Pequeña pausa al llegar (como si se detuviera a "mirar
        // alrededor") antes de elegir el siguiente punto — da una
        // ventana estática en la que es más fácil acertarle. La
        // duración de esa ventana depende de la dificultad (ver
        // pausaMin/pausaMax en DIFICULTADES).
        const cfgDif = cfgDificultad();
        const pausa = cfgDif.pausaMin + Math.random() * (cfgDif.pausaMax - cfgDif.pausaMin);
        el._temporizadorMovimiento = setTimeout(() => moverInsecto(el, cfg), duracion + pausa);
    }

    function matarInsecto(el) {
        if (!estado.vivos.includes(el)) return;
        clearTimeout(el._temporizadorMovimiento);
        estado.vivos = estado.vivos.filter((v) => v !== el);
        el.classList.add('ji-insecto--muerto');
        el.disabled = true;
        setTimeout(() => el.remove(), 260);

        estado.matados++;
        actualizarVista();

        if (estado.matados >= cfgDificultad().totalInsectos) {
            finalizarPartida(true);
        }
    }

    // ── Cuenta atrás ──────────────────────────────────────────────────

    function actualizarVista() {
        const cfg = cfgDificultad();
        const pct = Math.round((estado.matados / cfg.totalInsectos) * 100);
        document.getElementById('ji-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('ji-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('ji-contador').textContent = `${estado.matados}/${cfg.totalInsectos}`;
        document.getElementById('ji-tiempo').textContent = formatoTiempo(estado.tiempoRestante);
    }

    function formatoTiempo(s) {
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r < 10 ? '0' : ''}${r}`;
    }

    function tick() {
        estado.tiempoRestante--;
        actualizarVista();
        if (estado.tiempoRestante <= 0) {
            finalizarPartida(false);
        }
    }

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.ji-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.ji-chip-dificultad').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.dificultad = boton.dataset.dificultad;
            nuevaPartida();
        });
    });

    // ── Partida ──────────────────────────────────────────────────────

    function limpiarArena() {
        estado.vivos.forEach((el) => {
            clearTimeout(el._temporizadorMovimiento);
            el.remove();
        });
        estado.vivos = [];
    }

    function nuevaPartida() {
        clearInterval(temporizadorCuentaAtras);
        clearInterval(temporizadorAparicion);
        limpiarArena();

        const cfg = cfgDificultad();
        estado.aparecidos = 0;
        estado.matados = 0;
        estado.tiempoRestante = cfg.tiempoTotal;
        estado.terminado = false;
        estado.jugando = true;

        document.getElementById('ji-celebracion-overlay').hidden = true;
        document.getElementById('ji-pista').style.display = '';
        actualizarVista();

        temporizadorAparicion = setInterval(aparecerInsecto, cfg.intervaloAparicion);
        temporizadorCuentaAtras = setInterval(tick, 1000);
        aparecerInsecto();
    }

    function finalizarPartida(limpiado) {
        if (estado.terminado) return;
        estado.terminado = true;
        estado.jugando = false;
        clearInterval(temporizadorCuentaAtras);
        clearInterval(temporizadorAparicion);
        limpiarArena();

        const cfg = cfgDificultad();
        const pct = Math.round((estado.matados / cfg.totalInsectos) * 100);

        document.getElementById('ji-celebracion-titulo').textContent =
            limpiado ? '¡Zona desinfectada! 🧴' : '¡Se acabó el tiempo!';
        document.getElementById('ji-celebracion-stat').textContent =
            limpiado
                ? `Despejaste todos los bichos en ${formatoTiempo(cfg.tiempoTotal - estado.tiempoRestante)}`
                : `Despejaste el ${pct}% de los bichos (${estado.matados}/${cfg.totalInsectos})`;

        dibujarResultadoEnCanvas();
        document.getElementById('ji-celebracion-overlay').hidden = false;
        if (limpiado) lanzarConfeti();
    }

    document.getElementById('ji-boton-reiniciar').addEventListener('click', nuevaPartida);
    document.getElementById('ji-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('ji-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'ji-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────
    // Resultado vía canvas dibujado a mano (no hay lienzo de juego
    // propio que capturar: la zona es DOM, no canvas).

    const TEXTO_COMPARTIR = '¡He jugado a Fuera Bichos de Orencio Matas y Hnos! 🧴🐜';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('ji-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const cfg = cfgDificultad();
        const pct = Math.round((estado.matados / cfg.totalInsectos) * 100);

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Fuera Bichos 🧴', w / 2, 90);

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(pct + '%', w / 2, 190);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`${estado.matados}/${cfg.totalInsectos} bichos eliminados — ${DIFICULTADES[estado.dificultad].nombre}`, w / 2, 240);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('ji-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'fuera-bichos.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'fuera-bichos.png', { type: 'image/png' })],
                        title: 'Fuera Bichos — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('ji-compartir-overlay');
        const enlaceDescargar = document.getElementById('ji-boton-descargar');
        const canvas = document.getElementById('ji-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('ji-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('ji-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('ji-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('ji-boton-compartir').addEventListener('click', compartir);
    document.getElementById('ji-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('ji-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('ji-compartir-overlay').hidden = true;
    });
    document.getElementById('ji-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'ji-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Arranque ─────────────────────────────────────────────────────

    nuevaPartida();
})();
