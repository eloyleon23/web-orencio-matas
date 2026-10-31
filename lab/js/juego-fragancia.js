/**
 * Atrapa la Fragancia — minijuego (lab/fragancia.html)
 * Vanilla JS, sin dependencias. Un frasco de perfume se mueve por la
 * parte inferior siguiendo el dedo/ratón; desde arriba caen
 * ingredientes buenos (flores, frutas, gotas) y malos (humo, basura,
 * mal olor) — hay que mover el frasco para que los buenos caigan
 * dentro y dejar pasar los malos.
 */
(function () {
    'use strict';

    // ── Ingredientes ─────────────────────────────────────────────────

    const INGREDIENTES_BUENOS = [
        { icono: '🌸', nombre: 'Flor de azahar' },
        { icono: '🌺', nombre: 'Pétalo' },
        { icono: '🍊', nombre: 'Cítrico' },
        { icono: '🍓', nombre: 'Baya roja' },
        { icono: '💧', nombre: 'Gota de rocío' },
        { icono: '🌿', nombre: 'Hierba fresca' },
        { icono: '🍋', nombre: 'Limón' },
        { icono: '🌼', nombre: 'Manzanilla' },
    ];
    const INGREDIENTES_MALOS = [
        { icono: '💨', nombre: 'Humo' },
        { icono: '🗑️', nombre: 'Basura' },
        { icono: '🦨', nombre: 'Mal olor' },
        { icono: '🪰', nombre: 'Mosca' },
    ];

    // ── Dificultad ───────────────────────────────────────────────────
    // anchoFrasco: % del ancho de la zona que ocupa el frasco (más
    // estrecho, más precisión hace falta). probabilidadMalo: fracción
    // de ingredientes que son "malos" a esquivar.
    const DIFICULTADES = {
        facil: {
            nombre: 'Fácil', tiempoTotal: 60, objetivo: 14, maxSimultaneos: 3,
            intervaloAparicion: 1400, duracionCaidaMin: 3400, duracionCaidaMax: 4300,
            probabilidadMalo: 0.22, anchoFrasco: 30,
        },
        medio: {
            nombre: 'Medio', tiempoTotal: 60, objetivo: 20, maxSimultaneos: 4,
            intervaloAparicion: 950, duracionCaidaMin: 2500, duracionCaidaMax: 3300,
            probabilidadMalo: 0.32, anchoFrasco: 24,
        },
        dificil: {
            nombre: 'Difícil', tiempoTotal: 65, objetivo: 28, maxSimultaneos: 6,
            intervaloAparicion: 650, duracionCaidaMin: 1700, duracionCaidaMax: 2500,
            probabilidadMalo: 0.42, anchoFrasco: 19,
        },
    };

    const NIVEL_INICIAL = 6;
    const NIVEL_BAJADA_MALO = 9;

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        dificultad: 'medio',
        cayendo: [],
        capturadosBuenos: 0,
        capturadosMalos: 0,
        puntos: 0,
        combo: 0,
        comboMaximo: 0,
        tiempoRestante: 0,
        terminado: false,
        frascoX: 50,
        nivelFrasco: NIVEL_INICIAL,
    };

    let temporizadorTurno = null;
    let temporizadorAparicion = null;
    const zona = document.getElementById('jg-zona');
    const frasco = document.getElementById('jg-frasco');
    const liquido = document.getElementById('jg-frasco-liquido');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    // ── Frasco (se mueve siguiendo el dedo/ratón) ─────────────────────

    function moverFrasco(clientX) {
        const rect = zona.getBoundingClientRect();
        if (!rect.width) return;
        let pct = ((clientX - rect.left) / rect.width) * 100;
        const medioAncho = cfgDificultad().anchoFrasco / 2;
        pct = Math.max(medioAncho, Math.min(100 - medioAncho, pct));
        estado.frascoX = pct;
        frasco.style.left = pct + '%';
    }

    zona.addEventListener('pointerdown', (ev) => {
        if (ev.target.closest('.jg-boton-reiniciar') || estado.terminado) return;
        moverFrasco(ev.clientX);
    });
    zona.addEventListener('pointermove', (ev) => {
        if (estado.terminado) return;
        moverFrasco(ev.clientX);
    });

    // ── Aparición y caída ────────────────────────────────────────────

    function aparecerIngrediente() {
        if (estado.terminado) return;
        if (estado.cayendo.length >= cfgDificultad().maxSimultaneos) return;

        const cfg = cfgDificultad();
        const esMalo = Math.random() < cfg.probabilidadMalo;
        const lista = esMalo ? INGREDIENTES_MALOS : INGREDIENTES_BUENOS;
        const ingrediente = lista[Math.floor(Math.random() * lista.length)];
        const duracion = cfg.duracionCaidaMin + Math.random() * (cfg.duracionCaidaMax - cfg.duracionCaidaMin);
        const x = 6 + Math.random() * 88;

        const el = document.createElement('div');
        el.className = 'jg-ingrediente' + (esMalo ? ' jg-ingrediente--malo' : '');
        el.style.left = x + '%';
        el.innerHTML = `<span class="jg-ingrediente__icono" aria-hidden="true">${ingrediente.icono}</span>`;
        zona.insertBefore(el, frasco);

        requestAnimationFrame(() => {
            el.style.transition = `top ${duracion}ms linear`;
            el.style.top = '86%';
        });

        const entrada = { el, x, esMalo };
        estado.cayendo.push(entrada);
        entrada.temporizador = setTimeout(() => comprobarCaptura(entrada), duracion);
    }

    function quitarEntrada(entrada) {
        clearTimeout(entrada.temporizador);
        estado.cayendo = estado.cayendo.filter((e) => e !== entrada);
        entrada.el.remove();
    }

    // Se comprueba en el instante en que el ingrediente llega abajo: si
    // el frasco está justo debajo en ese momento, se atrapa — igual que
    // un juego de atrapar clásico, sin necesitar un bucle de colisión
    // continuo.
    function comprobarCaptura(entrada) {
        const margen = cfgDificultad().anchoFrasco / 2 + 3;
        const dentro = Math.abs(entrada.x - estado.frascoX) <= margen;
        quitarEntrada(entrada);

        if (dentro && !entrada.esMalo) {
            capturarBueno(entrada.x);
        } else if (dentro && entrada.esMalo) {
            capturarMalo(entrada.x);
        }
        actualizarVista();
    }

    function capturarBueno(x) {
        estado.capturadosBuenos++;
        estado.combo++;
        estado.comboMaximo = Math.max(estado.comboMaximo, estado.combo);
        const ganancia = 10 + Math.floor(estado.combo / 3) * 2;
        estado.puntos += ganancia;
        estado.nivelFrasco = Math.min(100, estado.nivelFrasco + 100 / cfgDificultad().objetivo);
        actualizarNivelFrasco();
        destellarFrasco('jg-frasco--acierto');
        mostrarFlotante('+' + ganancia, 'jg-flotante--bien', x);
        comprobarVictoria();
    }

    function capturarMalo(x) {
        estado.capturadosMalos++;
        estado.combo = 0;
        estado.puntos = Math.max(0, estado.puntos - 6);
        estado.nivelFrasco = Math.max(0, estado.nivelFrasco - NIVEL_BAJADA_MALO);
        actualizarNivelFrasco();
        destellarFrasco('jg-frasco--fallo');
        mostrarFlotante('−6', 'jg-flotante--mal', x);
    }

    function actualizarNivelFrasco() {
        if (liquido) liquido.style.height = Math.max(4, estado.nivelFrasco) + '%';
    }

    function destellarFrasco(clase) {
        frasco.classList.remove('jg-frasco--acierto', 'jg-frasco--fallo');
        void frasco.offsetWidth;
        frasco.classList.add(clase);
        setTimeout(() => frasco.classList.remove(clase), 280);
    }

    function mostrarFlotante(texto, clase, x) {
        const el = document.createElement('span');
        el.className = 'jg-flotante ' + clase;
        el.textContent = texto;
        el.style.left = x + '%';
        zona.insertBefore(el, frasco);
        setTimeout(() => el.remove(), 650);
    }

    // ── Vista / progreso ─────────────────────────────────────────────

    function actualizarVista() {
        const cfg = cfgDificultad();
        const pct = Math.min(100, Math.round((estado.capturadosBuenos / cfg.objetivo) * 100));

        document.getElementById('jg-contador').textContent = `${estado.capturadosBuenos}/${cfg.objetivo}`;
        document.getElementById('jg-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jg-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('jg-tiempo').textContent = formatoTiempo(estado.tiempoRestante);
        document.getElementById('jg-puntos').textContent = String(estado.puntos);
        document.getElementById('jg-combo').textContent = estado.combo > 1 ? `x${estado.combo}` : '—';
    }

    function formatoTiempo(s) {
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r < 10 ? '0' : ''}${r}`;
    }

    function comprobarVictoria() {
        if (estado.capturadosBuenos >= cfgDificultad().objetivo) {
            finalizarPartida(true);
        }
    }

    function tick() {
        estado.tiempoRestante--;
        actualizarVista();
        if (estado.tiempoRestante <= 0) {
            finalizarPartida(false);
        }
    }

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.jg-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jg-chip-dificultad').forEach((b) => {
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

    function limpiarZona() {
        estado.cayendo.forEach((e) => clearTimeout(e.temporizador));
        estado.cayendo = [];
        zona.querySelectorAll('.jg-ingrediente, .jg-flotante').forEach((el) => el.remove());
    }

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('fragancia');
        clearInterval(temporizadorTurno);
        clearInterval(temporizadorAparicion);
        limpiarZona();

        const cfg = cfgDificultad();
        estado.capturadosBuenos = 0;
        estado.capturadosMalos = 0;
        estado.puntos = 0;
        estado.combo = 0;
        estado.comboMaximo = 0;
        estado.tiempoRestante = cfg.tiempoTotal;
        estado.terminado = false;
        estado.frascoX = 50;
        estado.nivelFrasco = NIVEL_INICIAL;

        frasco.style.width = cfg.anchoFrasco + '%';
        frasco.style.left = '50%';
        actualizarNivelFrasco();

        document.getElementById('jg-celebracion-overlay').hidden = true;
        document.getElementById('jg-pista').style.display = '';

        actualizarVista();
        temporizadorTurno = setInterval(tick, 1000);
        temporizadorAparicion = setInterval(aparecerIngrediente, cfg.intervaloAparicion);
    }

    function finalizarPartida(completado) {
        if (estado.terminado) return;
        estado.terminado = true;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarFinPartida('fragancia');
        clearInterval(temporizadorTurno);
        clearInterval(temporizadorAparicion);
        limpiarZona();

        const cfg = cfgDificultad();
        const pct = Math.min(100, Math.round((estado.capturadosBuenos / cfg.objetivo) * 100));

        document.getElementById('jg-celebracion-titulo').textContent =
            completado ? '¡Fragancia perfecta! 🌸' : '¡Se acabó el tiempo!';
        document.getElementById('jg-celebracion-stat').textContent =
            completado
                ? `Reuniste los ${cfg.objetivo} ingredientes — ${estado.puntos} puntos, combo máximo x${estado.comboMaximo}`
                : `Reuniste ${estado.capturadosBuenos}/${cfg.objetivo} ingredientes (${pct}%) — ${estado.puntos} puntos`;

        dibujarResultadoEnCanvas();
        document.getElementById('jg-celebracion-overlay').hidden = false;
        if (completado) lanzarConfeti();
    }

    document.getElementById('jg-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        nuevaPartida();
    });
    document.getElementById('jg-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jg-confeti');
        contenedor.innerHTML = '';
        const colores = ['#e4392c', '#f0932b', '#f6c445', '#2f9e6e', '#ffffff', '#d66ba0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jg-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Atrapa la Fragancia de Orencio Matas y Hnos! 🌸';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jg-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const cfg = cfgDificultad();

        ctx.fillStyle = '#fdf4f7';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Atrapa la Fragancia 🌸', w / 2, 80);

        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#d91b6b';
        ctx.fillText(String(estado.puntos) + ' pts', w / 2, 170);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`${estado.capturadosBuenos}/${cfg.objetivo} ingredientes — combo máximo x${estado.comboMaximo} — ${cfg.nombre}`, w / 2, 220);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jg-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'atrapa-la-fragancia.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'atrapa-la-fragancia.png', { type: 'image/png' })],
                        title: 'Atrapa la Fragancia — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jg-compartir-overlay');
        const enlaceDescargar = document.getElementById('jg-boton-descargar');
        const canvas = document.getElementById('jg-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jg-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jg-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jg-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jg-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jg-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jg-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jg-compartir-overlay').hidden = true;
    });
    document.getElementById('jg-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jg-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Arranque ─────────────────────────────────────────────────────

    nuevaPartida();
})();
