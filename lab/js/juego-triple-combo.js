/**
 * Triple Combo — minijuego (lab/triple-combo.html)
 * Vanilla JS, sin dependencias. Match-3 clásico: toca una ficha y
 * luego una ficha vecina para intercambiarlas; si el intercambio
 * forma una línea de 3 o más productos iguales (en horizontal o
 * vertical) se eliminan, las de arriba caen por gravedad y se
 * rellenan los huecos — si eso genera una nueva línea sin que el
 * jugador haga nada, se encadena como combo (más puntos por cada
 * nivel de la cadena). Contrarreloj: la partida termina al agotarse
 * el tiempo, no por completar un objetivo — pensado para partidas
 * cortas y la tentación de "una más" para superar la puntuación
 * anterior.
 */
(function () {
    'use strict';

    // Iconos de producto como fichas — droguería, perfumería y
    // pinturas, visualmente bien diferenciables entre sí.
    const TOKENS = ['🧴', '🧼', '🧽', '🎨', '🖌️', '🪣'];

    const DIFICULTADES = {
        facil: { nombre: 'Fácil', columnas: 6, filas: 7, tipos: 4, tiempoTotal: 75 },
        medio: { nombre: 'Medio', columnas: 7, filas: 8, tipos: 5, tiempoTotal: 60 },
        dificil: { nombre: 'Difícil', columnas: 8, filas: 9, tipos: 6, tiempoTotal: 50 },
    };

    const PUNTOS_POR_FICHA = 10;
    // Cada cuántos puntos se premia con un aviso — para que la partida
    // dé gratificación según se avanza, no solo al final.
    const INTERVALO_HITO_PUNTOS = 150;
    const GAP = 4; // separación visual entre fichas, en px

    const estado = {
        dificultad: 'medio',
        columnas: 0,
        filas: 0,
        cuadricula: [], // cuadricula[fila][col] = { tipo, el } o null mientras se resuelve
        seleccionada: null, // { fila, col, el }
        bloqueado: false, // true durante animaciones de intercambio/caída — ignora toques
        puntos: 0,
        mejorCombo: 1,
        siguienteHitoPuntos: INTERVALO_HITO_PUNTOS,
        tiempoRestante: 0,
        tiempoTotal: 0,
        terminado: false,
        jugando: false,
        pausado: false,
    };

    let temporizador = null;
    let tamanoFicha = 40;
    const tablero = document.getElementById('jx-tablero');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    // ── Tamaño y posición de las fichas ───────────────────────────────
    // Fichas posicionadas con left/top en vez de CSS grid: el
    // intercambio y la caída por gravedad se animan solos con la
    // transición ya puesta en .jx-ficha, sin reordenar nodos del DOM.

    function medirTablero() {
        const cfg = cfgDificultad();
        const enPantallaCompleta = document.body.classList.contains('om-pantalla-completa-activa');
        const wrap = tablero.parentElement;
        const dispW = wrap.clientWidth;

        if (enPantallaCompleta) {
            const dispH = wrap.clientHeight;
            if (!dispW || !dispH) {
                requestAnimationFrame(medirTablero);
                return;
            }
            tamanoFicha = Math.max(16, Math.floor(Math.min(dispW / cfg.columnas, dispH / cfg.filas)));
        } else {
            tamanoFicha = Math.max(16, Math.floor((dispW || 300) / cfg.columnas));
        }

        tablero.style.width = (tamanoFicha * cfg.columnas) + 'px';
        tablero.style.height = (tamanoFicha * cfg.filas) + 'px';
        tablero.style.setProperty('--jx-tam-ficha', tamanoFicha + 'px');
        posicionarTodas();
    }

    function posicionar(el, fila, col) {
        el.dataset.fila = String(fila);
        el.dataset.col = String(col);
        el.style.width = (tamanoFicha - GAP) + 'px';
        el.style.height = (tamanoFicha - GAP) + 'px';
        el.style.left = (col * tamanoFicha + GAP / 2) + 'px';
        el.style.top = (fila * tamanoFicha + GAP / 2) + 'px';
    }

    function posicionarTodas() {
        for (let f = 0; f < estado.filas; f++) {
            for (let c = 0; c < estado.columnas; c++) {
                const celda = estado.cuadricula[f] && estado.cuadricula[f][c];
                if (celda) posicionar(celda.el, f, c);
            }
        }
    }

    let temporizadorResize = null;
    window.addEventListener('resize', () => {
        clearTimeout(temporizadorResize);
        temporizadorResize = setTimeout(medirTablero, 60);
    });
    window.addEventListener('orientationchange', () => setTimeout(medirTablero, 150));
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => setTimeout(medirTablero, 60));
    }
    document.addEventListener('om-pantalla-completa-cambio', () => setTimeout(medirTablero, 60));

    // ── Tablero ──────────────────────────────────────────────────────

    function crearFichaEl(tipo) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'jx-ficha';
        const span = document.createElement('span');
        span.className = 'jx-ficha__emoji';
        span.textContent = TOKENS[tipo];
        span.setAttribute('aria-hidden', 'true');
        el.appendChild(span);
        el.setAttribute('aria-label', 'Ficha');
        el.addEventListener('click', () => alPulsarFicha(el));
        return el;
    }

    // Genera una matriz de tipos SIN líneas de 3 ya formadas (para no
    // empezar la partida con un match "gratis" sin que el jugador
    // haya hecho nada) — comprueba solo hacia atrás/arriba según va
    // rellenando, así no hace falta recalcular el tablero entero.
    function generarMatrizSinMatches(filas, columnas, tipos) {
        const grid = [];
        for (let f = 0; f < filas; f++) {
            const filaArr = [];
            for (let c = 0; c < columnas; c++) {
                let intentos = 0;
                let t;
                do {
                    t = Math.floor(Math.random() * tipos);
                    intentos++;
                } while (
                    intentos < 30 && (
                        (c >= 2 && filaArr[c - 1] === t && filaArr[c - 2] === t) ||
                        (f >= 2 && grid[f - 1][c] === t && grid[f - 2][c] === t)
                    )
                );
                filaArr.push(t);
            }
            grid.push(filaArr);
        }
        return grid;
    }

    function reconstruirFichas() {
        tablero.innerHTML = '';
        const cfg = cfgDificultad();
        const matriz = generarMatrizSinMatches(cfg.filas, cfg.columnas, cfg.tipos);
        estado.cuadricula = matriz.map((filaArr) => filaArr.map((tipo) => {
            const el = crearFichaEl(tipo);
            tablero.appendChild(el);
            return { tipo, el };
        }));
    }

    function construirTablero() {
        const cfg = cfgDificultad();
        estado.columnas = cfg.columnas;
        estado.filas = cfg.filas;
        reconstruirFichas();
        medirTablero();
    }

    // ── Selección e intercambio ────────────────────────────────────────

    function tipoEn(f, c) {
        const celda = estado.cuadricula[f] && estado.cuadricula[f][c];
        return celda ? celda.tipo : -1;
    }

    function alPulsarFicha(el) {
        if (estado.terminado || !estado.jugando || estado.pausado || estado.bloqueado) return;

        const fila = Number(el.dataset.fila);
        const col = Number(el.dataset.col);

        if (!estado.seleccionada) {
            estado.seleccionada = { fila, col, el };
            el.classList.add('jx-ficha--seleccionada');
            return;
        }

        const previa = estado.seleccionada;
        previa.el.classList.remove('jx-ficha--seleccionada');
        estado.seleccionada = null;

        if (previa.el === el) return; // vuelve a tocar la misma: deseleccionar

        const esAdyacente = Math.abs(previa.fila - fila) + Math.abs(previa.col - col) === 1;
        if (!esAdyacente) {
            // No es vecina: pasa a ser la nueva ficha seleccionada.
            estado.seleccionada = { fila, col, el };
            el.classList.add('jx-ficha--seleccionada');
            return;
        }

        intentarIntercambio(previa.fila, previa.col, fila, col);
    }

    function intercambiarEnMatriz(f1, c1, f2, c2) {
        const a = estado.cuadricula[f1][c1];
        const b = estado.cuadricula[f2][c2];
        estado.cuadricula[f1][c1] = b;
        estado.cuadricula[f2][c2] = a;
        if (b) posicionar(b.el, f1, c1);
        if (a) posicionar(a.el, f2, c2);
    }

    function intentarIntercambio(f1, c1, f2, c2) {
        estado.bloqueado = true;
        intercambiarEnMatriz(f1, c1, f2, c2);

        if (encontrarTodosLosMatches().length === 0) {
            // No forma ninguna línea: se ve un instante y se deshace.
            setTimeout(() => {
                intercambiarEnMatriz(f1, c1, f2, c2);
                estado.bloqueado = false;
            }, 200);
            return;
        }

        setTimeout(() => resolverCascada(1), 160);
    }

    // ── Detectar y resolver líneas ──────────────────────────────────────

    function encontrarTodosLosMatches() {
        const marcas = new Set();

        for (let f = 0; f < estado.filas; f++) {
            let inicio = 0;
            for (let c = 1; c <= estado.columnas; c++) {
                const sigueLaRacha = c < estado.columnas && tipoEn(f, c) === tipoEn(f, inicio) && tipoEn(f, inicio) !== -1;
                if (!sigueLaRacha) {
                    if (c - inicio >= 3) for (let k = inicio; k < c; k++) marcas.add(f + ',' + k);
                    inicio = c;
                }
            }
        }

        for (let c = 0; c < estado.columnas; c++) {
            let inicio = 0;
            for (let f = 1; f <= estado.filas; f++) {
                const sigueLaRacha = f < estado.filas && tipoEn(f, c) === tipoEn(inicio, c) && tipoEn(inicio, c) !== -1;
                if (!sigueLaRacha) {
                    if (f - inicio >= 3) for (let k = inicio; k < f; k++) marcas.add(k + ',' + c);
                    inicio = f;
                }
            }
        }

        return Array.from(marcas).map((clave) => {
            const [f, c] = clave.split(',').map(Number);
            return { fila: f, col: c };
        });
    }

    function resolverCascada(nivelCombo) {
        const matches = encontrarTodosLosMatches();

        if (matches.length === 0) {
            // Aquí nivelCombo es la primera "fase" SIN match — así que
            // la cadena real que sí tuvo matches llegó hasta
            // nivelCombo - 1 (un intercambio normal sin reacción en
            // cadena llega a nivelCombo=2 con esta cuenta: la fase 1
            // tuvo el match del propio intercambio, la fase 2 ya no
            // tiene nada — eso cuenta como combo "x1", la base, no
            // como una cadena real de 2 pasos).
            const comboAlcanzado = nivelCombo - 1;
            if (comboAlcanzado > estado.mejorCombo) {
                estado.mejorCombo = comboAlcanzado;
                actualizarVista();
            }
            if (!haySwapPosible()) {
                mostrarLogro('¡Recolocando fichas!');
                setTimeout(() => {
                    reconstruirFichas();
                    medirTablero();
                    estado.bloqueado = false;
                }, 260);
                return;
            }
            estado.bloqueado = false;
            return;
        }

        estado.puntos += matches.length * PUNTOS_POR_FICHA * nivelCombo;
        comprobarHitoPuntos();
        actualizarVista();

        if (nivelCombo >= 2) mostrarLogro('¡Combo x' + nivelCombo + '!');

        matches.forEach(({ fila, col }) => {
            const celda = estado.cuadricula[fila][col];
            if (celda) celda.el.classList.add('jx-ficha--emparejando');
        });

        setTimeout(() => {
            matches.forEach(({ fila, col }) => {
                const celda = estado.cuadricula[fila][col];
                if (celda) {
                    celda.el.remove();
                    estado.cuadricula[fila][col] = null;
                }
            });
            aplicarGravedad();
            rellenarHuecos();
            setTimeout(() => resolverCascada(nivelCombo + 1), 180);
        }, 180);
    }

    function aplicarGravedad() {
        for (let c = 0; c < estado.columnas; c++) {
            let destino = estado.filas - 1;
            for (let f = estado.filas - 1; f >= 0; f--) {
                const celda = estado.cuadricula[f][c];
                if (celda) {
                    if (f !== destino) {
                        estado.cuadricula[destino][c] = celda;
                        estado.cuadricula[f][c] = null;
                        posicionar(celda.el, destino, c);
                    }
                    destino--;
                }
            }
        }
    }

    function rellenarHuecos() {
        const cfg = cfgDificultad();
        for (let c = 0; c < estado.columnas; c++) {
            // Tras aplicarGravedad() los huecos de cada columna quedan
            // SIEMPRE contiguos desde la fila 0 — en cuanto se
            // encuentra una celda ocupada ya no quedan más huecos por
            // encima en esa columna.
            for (let f = 0; f < estado.filas; f++) {
                if (estado.cuadricula[f][c]) break;
                const tipo = Math.floor(Math.random() * cfg.tipos);
                const el = crearFichaEl(tipo);
                el.classList.add('jx-ficha--nueva');
                tablero.appendChild(el);
                posicionar(el, f - estado.filas, c); // arranca bien por encima, fuera de la vista
                estado.cuadricula[f][c] = { tipo, el };
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        el.classList.remove('jx-ficha--nueva');
                        posicionar(el, f, c);
                    });
                });
            }
        }
    }

    // ── Tablero sin movimientos posibles ────────────────────────────────

    function hayMatchEnCelda(f, c) {
        const t = tipoEn(f, c);
        if (t === -1) return false;
        let cuenta = 1;
        for (let cc = c - 1; cc >= 0 && tipoEn(f, cc) === t; cc--) cuenta++;
        for (let cc = c + 1; cc < estado.columnas && tipoEn(f, cc) === t; cc++) cuenta++;
        if (cuenta >= 3) return true;
        cuenta = 1;
        for (let ff = f - 1; ff >= 0 && tipoEn(ff, c) === t; ff--) cuenta++;
        for (let ff = f + 1; ff < estado.filas && tipoEn(ff, c) === t; ff++) cuenta++;
        return cuenta >= 3;
    }

    function swapCreaMatch(f1, c1, f2, c2) {
        const celda1 = estado.cuadricula[f1][c1];
        const celda2 = estado.cuadricula[f2][c2];
        const t1 = celda1.tipo;
        const t2 = celda2.tipo;
        celda1.tipo = t2;
        celda2.tipo = t1;
        const resultado = hayMatchEnCelda(f1, c1) || hayMatchEnCelda(f2, c2);
        celda1.tipo = t1;
        celda2.tipo = t2;
        return resultado;
    }

    function haySwapPosible() {
        for (let f = 0; f < estado.filas; f++) {
            for (let c = 0; c < estado.columnas; c++) {
                if (c + 1 < estado.columnas && swapCreaMatch(f, c, f, c + 1)) return true;
                if (f + 1 < estado.filas && swapCreaMatch(f, c, f + 1, c)) return true;
            }
        }
        return false;
    }

    // ── Hitos / logros (toast) ─────────────────────────────────────────

    let temporizadorLogro = null;
    function mostrarLogro(texto) {
        const el = document.getElementById('jx-logro');
        el.textContent = texto;
        el.hidden = false;
        el.classList.remove('jx-logro--mostrar');
        void el.offsetWidth; // fuerza el reinicio de la animación si ya estaba mostrándose
        el.classList.add('jx-logro--mostrar');
        clearTimeout(temporizadorLogro);
        temporizadorLogro = setTimeout(() => { el.hidden = true; }, 1600);
    }

    function comprobarHitoPuntos() {
        if (estado.puntos < estado.siguienteHitoPuntos) return;
        mostrarLogro('¡' + estado.siguienteHitoPuntos + ' puntos!');
        estado.siguienteHitoPuntos += INTERVALO_HITO_PUNTOS;
    }

    // ── Vista / progreso ─────────────────────────────────────────────

    function actualizarVista() {
        document.getElementById('jx-puntos').textContent = String(estado.puntos);
        document.getElementById('jx-mejor-combo').textContent = 'x' + estado.mejorCombo;
        document.getElementById('jx-tiempo').textContent = formatoTiempo(estado.tiempoRestante);
        const pct = estado.tiempoTotal > 0 ? Math.max(0, Math.round((estado.tiempoRestante / estado.tiempoTotal) * 100)) : 0;
        document.getElementById('jx-barra-tiempo-relleno').style.width = pct + '%';
        document.getElementById('jx-barra-tiempo').setAttribute('aria-valuenow', String(pct));
    }

    function formatoTiempo(s) {
        const m = Math.floor(s / 60);
        const r = s % 60;
        return m + ':' + (r < 10 ? '0' : '') + r;
    }

    function tick() {
        estado.tiempoRestante--;
        actualizarVista();
        if (estado.tiempoRestante <= 0) finalizarPartida();
    }

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.jx-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jx-chip-dificultad').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.dificultad = boton.dataset.dificultad;
            nuevaPartida();
        });
    });

    // ── Pausa ────────────────────────────────────────────────────────

    function actualizarBotonPausa() {
        const boton = document.getElementById('jx-boton-pausa');
        const puedePausar = estado.jugando && !estado.terminado;
        boton.disabled = !puedePausar;
        boton.innerHTML = '<span aria-hidden="true">' + (estado.pausado || !puedePausar ? '▶' : '⏸︎') + '</span>';
        boton.setAttribute('aria-label', estado.pausado ? 'Reanudar' : 'Pausar');
    }

    function mostrarIndicadorPausa(mostrar) {
        document.getElementById('jx-pausado-indicador').hidden = !mostrar;
    }

    function pausar() {
        if (!estado.jugando || estado.terminado || estado.pausado) return;
        estado.pausado = true;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPausa();
        clearInterval(temporizador);
        actualizarBotonPausa();
        mostrarIndicadorPausa(true);
    }

    function reanudar() {
        if (!estado.jugando || estado.terminado || !estado.pausado) return;
        estado.pausado = false;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarReanudacion();
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();
        temporizador = setInterval(tick, 1000);
    }

    function alternarPausa() {
        if (estado.pausado) reanudar();
        else pausar();
    }

    document.getElementById('jx-boton-pausa').addEventListener('click', alternarPausa);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && estado.jugando && !estado.terminado && !estado.pausado) pausar();
    });

    // ── Partida ──────────────────────────────────────────────────────

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('triple-combo');
        if (temporizador) clearInterval(temporizador);

        const cfg = cfgDificultad();
        estado.puntos = 0;
        estado.mejorCombo = 1;
        estado.siguienteHitoPuntos = INTERVALO_HITO_PUNTOS;
        estado.tiempoTotal = cfg.tiempoTotal;
        estado.tiempoRestante = cfg.tiempoTotal;
        estado.terminado = false;
        estado.jugando = true;
        estado.pausado = false;
        estado.bloqueado = false;
        estado.seleccionada = null;

        document.getElementById('jx-celebracion-overlay').hidden = true;
        document.getElementById('jx-pista').style.display = '';
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();

        construirTablero();
        actualizarVista();

        temporizador = setInterval(tick, 1000);
    }

    function mensajeFinal(puntos) {
        if (puntos >= 800) return { titulo: '¡Imparable! 🔥', celebrar: true };
        if (puntos >= 400) return { titulo: '¡Muy buena partida! 🎉', celebrar: true };
        if (puntos >= 150) return { titulo: '¡Buen combo! 🧩', celebrar: false };
        return { titulo: '¡Se acabó el tiempo!', celebrar: false };
    }

    function finalizarPartida() {
        if (estado.terminado) return;
        estado.terminado = true;
        estado.jugando = false;
        estado.pausado = false;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarFinPartida('triple-combo');
        if (temporizador) clearInterval(temporizador);
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();

        const resultado = mensajeFinal(estado.puntos);
        document.getElementById('jx-celebracion-titulo').textContent = resultado.titulo;
        document.getElementById('jx-celebracion-stat').textContent =
            `${estado.puntos} puntos — mejor combo x${estado.mejorCombo} — ${cfgDificultad().nombre}`;

        dibujarResultadoEnCanvas();
        document.getElementById('jx-celebracion-overlay').hidden = false;
        if (resultado.celebrar) lanzarConfeti();
    }

    document.getElementById('jx-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        nuevaPartida();
    });
    document.getElementById('jx-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jx-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jx-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Triple Combo de Orencio Matas y Hnos! 🧩';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jx-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Triple Combo 🧩', w / 2, 90);

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(String(estado.puntos), w / 2, 190);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`puntos — mejor combo x${estado.mejorCombo} — ${cfgDificultad().nombre}`, w / 2, 240);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jx-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'triple-combo.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'triple-combo.png', { type: 'image/png' })],
                        title: 'Triple Combo — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jx-compartir-overlay');
        const enlaceDescargar = document.getElementById('jx-boton-descargar');
        const canvas = document.getElementById('jx-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jx-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jx-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jx-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jx-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jx-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jx-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jx-compartir-overlay').hidden = true;
    });
    document.getElementById('jx-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jx-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Marcas aleatorias (sin filtrar, al buscador general) ──────────

    const LOGOS = [
        '3m', 'akzonobel', 'alvarezgomez', 'ariel', 'arrixaca', 'asevi', 'babaria',
        'baixens', 'caselli', 'cif', 'cisent', 'compo', 'elmilagrito', 'fairy',
        'flower', 'gomacamps', 'industrias_beter', 'industrias_betik', 'jofel',
        'kelsia', 'losdi', 'masso', 'mimosin', 'mora', 'muropapel', 'nespoli',
        'pentrilo', 'polmeros_del_valls', 'renova', 'ressol', 'sika', 'thomil',
        'vijusa', 'vileda', 'vinfer',
    ];
    const EXTENSIONES = {
        ariel: 'jpg', arrixaca: 'jpg', asevi: 'jpg', babaria: 'webp', baixens: 'jpg',
        caselli: 'jpg', cif: 'jpg', elmilagrito: 'png', fairy: 'jpg',
        gomacamps: 'jpg', industrias_beter: 'jpg', industrias_betik: 'jpg',
        kelsia: 'webp', losdi: 'jpg', masso: 'webp', mimosin: 'jpg',
        muropapel: 'jpg', polmeros_del_valls: 'jpg', renova: 'svg', ressol: 'jpg',
        thomil: 'png', vileda: 'jpg',
    };

    function rutaLogo(clave) {
        return `../assets/marcas/logo_${clave}.${EXTENSIONES[clave] || 'png'}`;
    }

    function mezclar(array) {
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function pintarMarcasAleatorias() {
        const cont = document.getElementById('jx-proveedores-grid');
        const barajadas = mezclar(LOGOS);
        cont.innerHTML = '';
        barajadas.slice(0, 6).forEach((clave) => {
            const a = document.createElement('a');
            a.className = 'premium-provider-card';
            a.href = '../buscador.html';
            const img = document.createElement('img');
            img.src = rutaLogo(clave);
            img.alt = clave.replace(/_/g, ' ');
            img.loading = 'lazy';
            a.appendChild(img);
            cont.appendChild(a);
        });
    }

    // ── Arranque ─────────────────────────────────────────────────────

    pintarMarcasAleatorias();
    nuevaPartida();
})();
