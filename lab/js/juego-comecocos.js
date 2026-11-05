/**
 * Comecocos de Droguería — minijuego (lab/comecocos-drogueria.html)
 * Vanilla JS, sin dependencias. Comecocos clásico: el carrito recorre
 * los pasillos de un almacén recogiendo productos (pellets) mientras
 * le persiguen unas "manchas" (fantasmas). El spray desinfectante
 * (power pellet) las vuelve vulnerables unos segundos — se pueden
 * cazar para puntos extra, igual que en el Pac-Man original.
 *
 * El laberinto es una rejilla fija de 19x15 (ver MAZE más abajo,
 * generada y verificada por conectividad con un script aparte antes
 * de incrustarla aquí — todas las celdas transitables pertenecen a
 * una única componente conexa, así que no hay pellets inalcanzables).
 *
 * MOVIMIENTO: cada entidad tiene una celda "de referencia" (r, c,
 * siempre enteros — la última celda que ha terminado de cruzar, la
 * que se usa para mirar paredes/pellets/colisiones) y una posición
 * visual continua (posR, posC, con decimales) que avanza cada
 * fotograma (requestAnimationFrame) a velocidad constante en la
 * dirección activa. Al completar el cruce de una celda entera, (r, c)
 * salta a la nueva celda y se decide la siguiente dirección — ahí
 * entra en juego la dirección deseada (dirDeseada, la que el jugador
 * acaba de pulsar) si ya es válida desde esa celda.
 *
 * Esto reemplaza un diseño anterior por turnos a ritmo fijo (un
 * setInterval moviendo una celda entera de golpe, con la animación
 * CSS intentando igualar esa cadencia): funcionaba pero cada ajuste
 * para un caso (retardo al girar, retardo al invertir el sentido)
 * rompía otro (trompicones al invertir varias veces seguidas), porque
 * la duración de la transición CSS y el ritmo real de turnos tenían
 * que coincidir exactamente y cualquier adelanto los desincronizaba.
 * Con posición continua no hace falta hacer encajar nada: la
 * dirección se puede cambiar (o invertir) en cualquier instante y el
 * dibujado en pantalla, al venir de la posición real fotograma a
 * fotograma, es uniforme siempre, se gire cuando se gire.
 */
(function () {
    'use strict';

    const COLS = 19, ROWS = 15;
    const VIDAS_INICIALES = 3;

    const MAZE_BASE = [
        '###################',
        '#o...............o#',
        '#..###..###..###..#',
        '#..###..###..###..#',
        '#..###..###..###..#',
        '#.................#',
        '###....## ##....###',
        '###....#   #....###',
        '#......#####......#',
        '#.................#',
        '#..###.......###..#',
        '#..###.......###..#',
        '#.......###.......#',
        '#o....... .......o#',
        '###################',
    ];

    const INICIO_JUGADOR = { r: 13, c: 9 };
    const SPAWNS_FANTASMA = [
        { r: 7, c: 8 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 9 },
    ];
    // Antes cada mancha era un emoji de círculo de color sin más
    // significado (🟣🟢🟠🔵) — ahora todas comparten un icono real de
    // mancha líquida; la variedad de color la aporta la insignia
    // circular de fondo (ver .jn-fantasma__icono y .jn-fantasma--0..3
    // en juego-comecocos.css), no el icono en sí.
    const NUM_COLORES_MANCHA = 4;
    const ICONO_MANCHA = '💧';
    const EMOJI_ASUSTADA = '💦';
    const EMOJI_JUGADOR = '🛒';

    const VECTORES = {
        arriba: { dr: -1, dc: 0 },
        abajo: { dr: 1, dc: 0 },
        izquierda: { dr: 0, dc: -1 },
        derecha: { dr: 0, dc: 1 },
    };
    const OPUESTA = { arriba: 'abajo', abajo: 'arriba', izquierda: 'derecha', derecha: 'izquierda' };

    const DIFICULTADES = {
        facil: {
            nombre: 'Fácil', fantasmas: 2,
            tickJugador: 260, tickFantasma: 300,
            probAleatoria: 0.35, duracionAsustada: 8000,
        },
        medio: {
            nombre: 'Medio', fantasmas: 3,
            tickJugador: 220, tickFantasma: 220,
            probAleatoria: 0.2, duracionAsustada: 6500,
        },
        dificil: {
            nombre: 'Difícil', fantasmas: 4,
            tickJugador: 190, tickFantasma: 170,
            probAleatoria: 0.08, duracionAsustada: 5000,
        },
    };

    const TOTAL_COLECTABLES = MAZE_BASE.join('').split('').filter((ch) => ch === '.' || ch === 'o').length;

    const estado = {
        dificultad: 'medio',
        rejilla: [],
        celdasDom: [],
        jugador: { r: 0, c: 0, posR: 0, posC: 0, dirActual: null, dirDeseada: null },
        fantasmas: [],
        vidas: VIDAS_INICIALES,
        comidos: 0,
        puntos: 0,
        cadenaFantasmas: 0,
        comboMaximo: 0,
        terminado: false,
        jugando: false,
        pausado: false,
        // Pausa manual (botón ⏸ de los controles), independiente de
        // "pausado" — ese otro flag ya se usa para pausas automáticas
        // y breves (cuenta atrás inicial, parón tras perder una vida)
        // que no deben reactivarse solas si el jugador ha pausado él
        // mismo. Ver pausarManual()/reanudarManual().
        pausaManual: false,
        enCuentaAtras: false,
        finAsustadaEn: null,
        bonoPausaRestanteMs: null,
    };

    // Tiempo que una mancha recién aparecida (o que acaba de "morir" y
    // reaparece) se queda visible y quieta en el corral antes de
    // ponerse en marcha hacia la puerta — así no salen de golpe en
    // cuanto arranca la partida. ESPERA_SALIDA_ESCALON además escalona
    // la salida inicial de varias manchas para que no abandonen el
    // corral todas a la vez.
    const ESPERA_SALIDA_MS = 1500;
    const ESPERA_SALIDA_ESCALON_MS = 1100;

    let temporizadorAsustada = null;
    let temporizadorCuentaBono = null;
    const laberinto = document.getElementById('jn-laberinto');
    const elJugador = document.createElement('div');
    elJugador.className = 'jn-jugador';
    elJugador.innerHTML = `<span aria-hidden="true">${EMOJI_JUGADOR}</span>`;

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    // ── Rejilla y celdas ─────────────────────────────────────────────

    function clonarLaberinto() {
        return MAZE_BASE.map((fila) => fila.split(''));
    }

    function construirDom() {
        laberinto.innerHTML = '';
        estado.celdasDom = [];
        for (let r = 0; r < ROWS; r++) {
            const filaDom = [];
            for (let c = 0; c < COLS; c++) {
                const celda = document.createElement('div');
                celda.className = 'jn-celda';
                const ch = estado.rejilla[r][c];
                if (ch === '#') celda.classList.add('jn-celda--pared');
                else if (ch === '.') celda.classList.add('jn-celda--pellet');
                else if (ch === 'o') celda.classList.add('jn-celda--power');
                laberinto.appendChild(celda);
                filaDom.push(celda);
            }
            estado.celdasDom.push(filaDom);
        }
        laberinto.appendChild(elJugador);
        estado.fantasmas.forEach((f) => laberinto.appendChild(f.el));
    }

    function puedeMover(entidad, dir) {
        const v = VECTORES[dir];
        const nr = entidad.r + v.dr, nc = entidad.c + v.dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
        return estado.rejilla[nr][nc] !== '#';
    }

    // ── Jugador ──────────────────────────────────────────────────────

    function comerEnCelda(r, c) {
        const ch = estado.rejilla[r][c];
        if (ch !== '.' && ch !== 'o') return;
        estado.rejilla[r][c] = ' ';
        estado.celdasDom[r][c].classList.remove('jn-celda--pellet', 'jn-celda--power');
        estado.comidos++;
        if (ch === '.') {
            estado.puntos += 10;
        } else {
            estado.puntos += 50;
            activarAsustada();
        }
        actualizarVista();
    }

    function activarAsustada() {
        estado.cadenaFantasmas = 0;
        estado.fantasmas.forEach((f) => {
            if (f.activo) f.asustado = true;
        });
        actualizarClasesFantasmas();
        activarTemporizadorAsustada(cfgDificultad().duracionAsustada);
    }

    function activarTemporizadorAsustada(duracionMs) {
        clearTimeout(temporizadorAsustada);
        estado.finAsustadaEn = performance.now() + duracionMs;
        temporizadorAsustada = setTimeout(() => {
            estado.finAsustadaEn = null;
            estado.fantasmas.forEach((f) => { f.asustado = false; });
            actualizarClasesFantasmas();
        }, duracionMs);
        iniciarCuentaRegresivaBono(duracionMs);
    }

    // ── Aviso de modo bonus (cuenta atrás de manchas vulnerables) ─────

    function iniciarCuentaRegresivaBono(duracionMs) {
        clearInterval(temporizadorCuentaBono);
        const fin = performance.now() + duracionMs;
        const elBono = document.getElementById('jn-bonus');
        const elContador = document.getElementById('jn-bonus-contador');
        elBono.hidden = false;
        elBono.classList.remove('jn-bonus--aviso');

        function tick() {
            const restante = fin - performance.now();
            if (restante <= 0) {
                elBono.hidden = true;
                clearInterval(temporizadorCuentaBono);
                return;
            }
            elContador.textContent = String(Math.ceil(restante / 1000));
            elBono.classList.toggle('jn-bonus--aviso', restante <= 2000);
        }
        tick();
        temporizadorCuentaBono = setInterval(tick, 100);
    }

    function ocultarBono() {
        clearInterval(temporizadorCuentaBono);
        clearTimeout(temporizadorAsustada);
        estado.finAsustadaEn = null;
        estado.bonoPausaRestanteMs = null;
        document.getElementById('jn-bonus').hidden = true;
    }

    // Avanza al jugador un fotograma (dt en ms). La dirección deseada
    // (dirDeseada, la última tecla/botón pulsado) se aplica en el acto
    // en dos casos: al invertir el sentido exacto (retroceder por la
    // misma línea, válido en cualquier punto) y al arrancar desde
    // parado — en cualquier otro caso (girar 90°) solo tiene sentido
    // al terminar de cruzar una celda, momento en el que sí se
    // comprueba. Así no hace falta ningún "adelanto" artificial ni
    // ninguna cuenta para evitarlo: la dirección simplemente se mira
    // en el instante exacto en que cada cambio es geométricamente
    // posible, ni antes ni después.
    function avanzarJugador(dt) {
        const j = estado.jugador;

        if (j.dirActual && j.dirDeseada === OPUESTA[j.dirActual] && puedeMover(j, j.dirDeseada)) {
            j.dirActual = j.dirDeseada;
        } else if (!j.dirActual && j.dirDeseada && puedeMover(j, j.dirDeseada)) {
            j.dirActual = j.dirDeseada;
        }

        if (!j.dirActual) return;

        const v = VECTORES[j.dirActual];
        const velocidad = 1 / cfgDificultad().tickJugador; // celdas por ms
        j.posR += v.dr * velocidad * dt;
        j.posC += v.dc * velocidad * dt;

        if (Math.abs(j.posR - j.r) >= 1 || Math.abs(j.posC - j.c) >= 1) {
            j.r += v.dr;
            j.c += v.dc;
            j.posR = j.r;
            j.posC = j.c;
            comerEnCelda(j.r, j.c);

            if (j.dirDeseada && puedeMover(j, j.dirDeseada)) j.dirActual = j.dirDeseada;
            else if (!puedeMover(j, j.dirActual)) j.dirActual = null;
        }
    }

    // ── Fantasmas ────────────────────────────────────────────────────

    function pasoSalida(f) {
        if (f.c < 9 && puedeMover(f, 'derecha')) return 'derecha';
        if (f.c > 9 && puedeMover(f, 'izquierda')) return 'izquierda';
        if (f.r > 5 && puedeMover(f, 'arriba')) return 'arriba';
        return null;
    }

    function elegirDireccion(f) {
        const candidatos = Object.keys(VECTORES).filter((d) => puedeMover(f, d));
        const opuesta = OPUESTA[f.dirActual];
        let filtrados = candidatos.filter((d) => d !== opuesta);
        if (filtrados.length === 0) filtrados = candidatos;
        if (filtrados.length === 0) return null;

        if (Math.random() < cfgDificultad().probAleatoria) {
            return filtrados[Math.floor(Math.random() * filtrados.length)];
        }

        let mejor = null;
        let mejorPuntuacion = f.asustado ? -Infinity : Infinity;
        filtrados.forEach((d) => {
            const v = VECTORES[d];
            const nr = f.r + v.dr, nc = f.c + v.dc;
            const dist = Math.abs(nr - estado.jugador.r) + Math.abs(nc - estado.jugador.c);
            if (f.asustado ? dist > mejorPuntuacion : dist < mejorPuntuacion) {
                mejorPuntuacion = dist;
                mejor = d;
            }
        });
        return mejor || filtrados[0];
    }

    // Misma idea que avanzarJugador: posición continua, decisión de
    // rumbo (pasoSalida/elegirDireccion) solo al completar el cruce de
    // una celda (o al arrancar sin dirección todavía). Asustada, una
    // mancha va a mitad de velocidad — antes se simulaba saltándose un
    // turno de cada dos (saltoAsustado), aquí es, directamente, la
    // mitad de rápido, sin el microparón que eso dejaba.
    function avanzarFantasmas(dt, ahora) {
        estado.fantasmas.forEach((f) => {
            if (!f.activo) return;
            if (f.saliendo && ahora < f.tiempoSalida) return; // sigue quieta en el corral

            if (!f.dirActual) {
                const dir = f.saliendo ? pasoSalida(f) : elegirDireccion(f);
                if (!dir) return;
                f.dirActual = dir;
            }

            const velocidadBase = 1 / cfgDificultad().tickFantasma;
            const velocidad = f.asustado ? velocidadBase * 0.5 : velocidadBase;
            const v = VECTORES[f.dirActual];
            f.posR += v.dr * velocidad * dt;
            f.posC += v.dc * velocidad * dt;

            if (Math.abs(f.posR - f.r) >= 1 || Math.abs(f.posC - f.c) >= 1) {
                f.r += v.dr;
                f.c += v.dc;
                f.posR = f.r;
                f.posC = f.c;

                if (f.saliendo && f.r <= 5) f.saliendo = false;
                f.dirActual = f.saliendo ? pasoSalida(f) : elegirDireccion(f);
            }
        });
    }

    function comerFantasma(f) {
        f.activo = false;
        f.oculta = true;
        estado.cadenaFantasmas++;
        const ganancia = 200 * Math.pow(2, estado.cadenaFantasmas - 1);
        estado.puntos += ganancia;
        estado.comboMaximo = Math.max(estado.comboMaximo, estado.cadenaFantasmas);
        actualizarVista();
        actualizarClasesFantasmas();
        setTimeout(() => respawnFantasma(f), 3000);
    }

    function respawnFantasma(f) {
        f.r = f.spawnR;
        f.c = f.spawnC;
        f.posR = f.spawnR;
        f.posC = f.spawnC;
        f.dirActual = null;
        f.asustado = false;
        f.saliendo = true;
        f.tiempoSalida = performance.now() + ESPERA_SALIDA_MS;
        f.activo = true;
        f.oculta = false;
        actualizarPosicionesDom();
        actualizarClasesFantasmas();
    }

    // ── Colisiones y vidas ───────────────────────────────────────────
    // Por distancia continua (no por coincidencia exacta de celda):
    // con posición continua dos entidades que se cruzan de frente
    // podrían, en teoría, "pasar una al lado de la otra" entre dos
    // fotogramas sin que (r, c) llegase a coincidir nunca exactamente.

    function comprobarColisiones() {
        if (estado.terminado || estado.pausado || estado.pausaManual) return;
        const j = estado.jugador;
        for (const f of estado.fantasmas) {
            if (!f.activo) continue;
            const dist = Math.hypot(f.posR - j.posR, f.posC - j.posC);
            if (dist < 0.5) {
                if (f.asustado) comerFantasma(f);
                else perderVida();
                return;
            }
        }
    }

    function perderVida() {
        if (estado.terminado) return;
        estado.vidas--;
        estado.pausado = true;
        destellarLaberinto();
        actualizarVista();
        if (estado.vidas <= 0) {
            finalizarPartida(false);
            return;
        }
        setTimeout(() => {
            resetPosiciones();
            estado.pausado = false;
        }, 900);
    }

    function resetPosiciones() {
        estado.jugador.r = INICIO_JUGADOR.r;
        estado.jugador.c = INICIO_JUGADOR.c;
        estado.jugador.posR = INICIO_JUGADOR.r;
        estado.jugador.posC = INICIO_JUGADOR.c;
        estado.jugador.dirActual = null;
        estado.jugador.dirDeseada = null;
        estado.fantasmas.forEach((f, i) => {
            f.r = f.spawnR;
            f.c = f.spawnC;
            f.posR = f.spawnR;
            f.posC = f.spawnC;
            f.dirActual = null;
            f.asustado = false;
            f.saliendo = true;
            f.tiempoSalida = performance.now() + ESPERA_SALIDA_MS + i * ESPERA_SALIDA_ESCALON_MS;
            f.activo = true;
            f.oculta = false;
        });
        ocultarBono();
        actualizarPosicionesDom();
        actualizarClasesFantasmas();
    }

    function destellarLaberinto() {
        laberinto.classList.remove('jn-laberinto--golpe');
        void laberinto.offsetWidth;
        laberinto.classList.add('jn-laberinto--golpe');
    }

    // ── Vista ────────────────────────────────────────────────────────

    function actualizarPosicionesDom() {
        const j = estado.jugador;
        elJugador.style.left = ((j.posC + 0.5) / COLS) * 100 + '%';
        elJugador.style.top = ((j.posR + 0.5) / ROWS) * 100 + '%';
        elJugador.classList.toggle('jn-jugador--izquierda', j.dirActual === 'izquierda');

        const ahora = performance.now();
        estado.fantasmas.forEach((f) => {
            f.el.style.left = ((f.posC + 0.5) / COLS) * 100 + '%';
            f.el.style.top = ((f.posR + 0.5) / ROWS) * 100 + '%';
            f.el.classList.toggle('jn-fantasma--esperando', f.saliendo && ahora < f.tiempoSalida);
        });
    }

    function actualizarClasesFantasmas() {
        estado.fantasmas.forEach((f) => {
            f.el.classList.toggle('jn-fantasma--asustada', !!f.asustado);
            f.el.classList.toggle('jn-fantasma--oculta', !!f.oculta);
            f.el.querySelector('span').textContent = f.asustado ? EMOJI_ASUSTADA : f.icono;
        });
    }

    function actualizarVista() {
        const pct = Math.min(100, Math.round((estado.comidos / TOTAL_COLECTABLES) * 100));
        document.getElementById('jn-contador').textContent = `${estado.comidos}/${TOTAL_COLECTABLES}`;
        document.getElementById('jn-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jn-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('jn-puntos').textContent = String(estado.puntos);
        document.getElementById('jn-combo').textContent = estado.cadenaFantasmas > 0 ? 'x' + estado.cadenaFantasmas : '—';
        const spans = document.querySelectorAll('#jn-vidas span');
        spans.forEach((span, i) => span.classList.toggle('jn-vida--perdida', i >= estado.vidas));
        document.getElementById('jn-vidas').setAttribute('aria-label', estado.vidas + ' vidas restantes');
    }

    function comprobarVictoria() {
        if (estado.comidos >= TOTAL_COLECTABLES) finalizarPartida(true);
    }

    // ── Bucle principal ──────────────────────────────────────────────
    // Un único requestAnimationFrame, siempre en marcha: cada fotograma
    // decide si hay algo que mover según el estado (en cuenta atrás,
    // en pausa o con la partida ya terminada, sencillamente no hace
    // nada ese fotograma). No hace falta arrancar ni parar temporizadores
    // en ningún otro punto del código.

    let ultimoFrameEn = null;

    function bucle(ahora) {
        if (ultimoFrameEn === null) ultimoFrameEn = ahora;
        const dt = Math.min(50, ahora - ultimoFrameEn); // tope por si la pestaña estuvo en 2º plano
        ultimoFrameEn = ahora;

        if (estado.jugando && !estado.terminado && !estado.pausado && !estado.pausaManual) {
            avanzarJugador(dt);
            avanzarFantasmas(dt, ahora);
            actualizarPosicionesDom();
            comprobarColisiones();
            comprobarVictoria();
        }

        requestAnimationFrame(bucle);
    }

    // ── Dirección (teclado y D-pad) ──────────────────────────────────

    const MAPA_TECLAS = {
        ArrowUp: 'arriba', ArrowDown: 'abajo', ArrowLeft: 'izquierda', ArrowRight: 'derecha',
        w: 'arriba', s: 'abajo', a: 'izquierda', d: 'derecha',
        W: 'arriba', S: 'abajo', A: 'izquierda', D: 'derecha',
    };
    document.addEventListener('keydown', (ev) => {
        const dir = MAPA_TECLAS[ev.key];
        if (!dir) return;
        if (ev.key.indexOf('Arrow') === 0) ev.preventDefault();
        estado.jugador.dirDeseada = dir;
    });

    // "pointerdown" además de "click" (y no solo "click"): responde en
    // el instante del toque en vez de esperar a que se complete el
    // ciclo pulsar+soltar sobre el botón — mismo patrón ya usado en
    // los botones de mover de Salta y Reparte. "click" se mantiene
    // para que los botones sigan funcionando con teclado (Intro/
    // Espacio con el botón enfocado); llamar dos veces seguidas a
    // esto es inofensivo, solo fija la misma dirección otra vez.
    document.querySelectorAll('.jn-dpad__boton[data-dir]').forEach((boton) => {
        function alPulsar(ev) {
            if (ev.type === 'pointerdown') ev.preventDefault();
            estado.jugador.dirDeseada = boton.dataset.dir;
        }
        boton.addEventListener('pointerdown', alPulsar, { passive: false });
        boton.addEventListener('click', alPulsar);
    });

    // ── Pausa manual ───────────────────────────────────────────────────
    // Independiente de estado.pausado (pausas automáticas breves: la
    // cuenta atrás inicial y el parón tras perder una vida), para que
    // una no interfiera con la otra — ver el comentario en `estado`.

    function actualizarBotonPausa() {
        const boton = document.getElementById('jn-boton-pausa');
        const puedePausar = estado.jugando && !estado.terminado && !estado.enCuentaAtras;
        boton.disabled = !puedePausar;
        boton.textContent = (estado.pausaManual || !puedePausar ? '▶' : '⏸') + '︎';
        boton.setAttribute('aria-label', estado.pausaManual ? 'Reanudar' : 'Pausar');
    }

    function mostrarIndicadorPausa(mostrar) {
        document.getElementById('jn-pausado-indicador').hidden = !mostrar;
    }

    function pausarManual() {
        if (!estado.jugando || estado.terminado || estado.enCuentaAtras || estado.pausaManual) return;
        estado.pausaManual = true;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPausa();

        // El modo bonus (manchas vulnerables) usa temporizadores reales
        // (setTimeout/setInterval) que no se enteran por sí solos de
        // que el juego está en pausa — sin esto, el tiempo de bonus
        // seguiría agotándose en segundo plano mientras todo parece
        // congelado en pantalla.
        if (estado.finAsustadaEn !== null) {
            estado.bonoPausaRestanteMs = Math.max(0, estado.finAsustadaEn - performance.now());
            clearTimeout(temporizadorAsustada);
            clearInterval(temporizadorCuentaBono);
        }

        actualizarBotonPausa();
        mostrarIndicadorPausa(true);
    }

    function reanudarManual() {
        if (!estado.jugando || estado.terminado || !estado.pausaManual) return;
        estado.pausaManual = false;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarReanudacion();

        if (estado.bonoPausaRestanteMs !== null) {
            activarTemporizadorAsustada(estado.bonoPausaRestanteMs);
            estado.bonoPausaRestanteMs = null;
        }

        actualizarBotonPausa();
        mostrarIndicadorPausa(false);
    }

    function alternarPausaManual() {
        if (estado.pausaManual) reanudarManual();
        else pausarManual();
    }

    document.getElementById('jn-boton-pausa').addEventListener('click', alternarPausaManual);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && estado.jugando && !estado.terminado && !estado.pausaManual && !estado.enCuentaAtras) pausarManual();
    });

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.jn-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jn-chip-dificultad').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.dificultad = boton.dataset.dificultad;
            empezarNueva();
        });
    });

    // ── Partida ──────────────────────────────────────────────────────

    function crearFantasmas() {
        const cfg = cfgDificultad();
        const ahora = performance.now();
        return SPAWNS_FANTASMA.slice(0, cfg.fantasmas).map((spawn, i) => {
            const el = document.createElement('div');
            el.className = 'jn-fantasma jn-fantasma--' + (i % NUM_COLORES_MANCHA);
            el.innerHTML = `<span class="jn-fantasma__icono" aria-hidden="true">${ICONO_MANCHA}</span>`;
            return {
                r: spawn.r, c: spawn.c, posR: spawn.r, posC: spawn.c,
                spawnR: spawn.r, spawnC: spawn.c,
                dirActual: null, asustado: false,
                saliendo: true, tiempoSalida: ahora + ESPERA_SALIDA_MS + i * ESPERA_SALIDA_ESCALON_MS,
                activo: true, oculta: false,
                icono: ICONO_MANCHA, el,
            };
        });
    }

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('comecocos-drogueria');

        clearTimeout(temporizadorAsustada);
        clearInterval(temporizadorCuentaAtras);
        document.getElementById('jn-cuenta-atras').hidden = true;
        ocultarBono();

        estado.rejilla = clonarLaberinto();
        estado.jugador.r = INICIO_JUGADOR.r;
        estado.jugador.c = INICIO_JUGADOR.c;
        estado.jugador.posR = INICIO_JUGADOR.r;
        estado.jugador.posC = INICIO_JUGADOR.c;
        estado.jugador.dirActual = null;
        estado.jugador.dirDeseada = null;
        estado.fantasmas = crearFantasmas();
        estado.vidas = VIDAS_INICIALES;
        estado.comidos = 0;
        estado.puntos = 0;
        estado.cadenaFantasmas = 0;
        estado.comboMaximo = 0;
        estado.terminado = false;
        estado.jugando = true;
        estado.pausado = true; // hasta que acabe la cuenta atrás inicial
        estado.pausaManual = false;
        estado.enCuentaAtras = true;
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();

        construirDom();
        actualizarPosicionesDom();
        actualizarClasesFantasmas();
        actualizarVista();

        document.getElementById('jn-celebracion-overlay').hidden = true;
        document.getElementById('jn-pista').style.display = '';

        ajustarLaberintoAlEspacio();

        mostrarCuentaAtras(() => {
            // El corral se mide desde "ahora": si se recalculara al
            // crear los fantasmas, los ~3s de cuenta atrás ya se
            // habrían comido buena parte (o toda) la espera prevista.
            const ahora = performance.now();
            estado.fantasmas.forEach((f, i) => {
                f.tiempoSalida = ahora + ESPERA_SALIDA_MS + i * ESPERA_SALIDA_ESCALON_MS;
            });
            estado.pausado = false;
            estado.enCuentaAtras = false;
            actualizarBotonPausa();
        });
    }

    // ── Cuenta atrás antes de empezar a moverse ───────────────────────

    let temporizadorCuentaAtras = null;

    function mostrarCuentaAtras(alTerminar) {
        clearInterval(temporizadorCuentaAtras);
        const el = document.getElementById('jn-cuenta-atras');
        const elNumero = document.getElementById('jn-cuenta-atras-numero');
        let n = 3;

        function pintar() {
            elNumero.textContent = String(n);
            elNumero.style.animation = 'none';
            void elNumero.offsetWidth;
            elNumero.style.animation = '';
        }

        el.hidden = false;
        pintar();
        temporizadorCuentaAtras = setInterval(() => {
            n--;
            if (n <= 0) {
                clearInterval(temporizadorCuentaAtras);
                el.hidden = true;
                alTerminar();
                return;
            }
            pintar();
        }, 1000);
    }

    function mensajeFinal(gano, vidas) {
        if (gano && vidas === VIDAS_INICIALES) return { titulo: '¡Pasillos impecables! 🏆', celebrar: true };
        if (gano) return { titulo: '¡Almacén despejado! 🎉', celebrar: true };
        return { titulo: '¡Sin vidas! Las manchas ganan esta vez', celebrar: false };
    }

    function finalizarPartida(gano) {
        if (estado.terminado) return;
        estado.terminado = true;
        estado.jugando = false;
        estado.pausaManual = false;
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarFinPartida('comecocos-drogueria');
        clearTimeout(temporizadorAsustada);
        clearInterval(temporizadorCuentaAtras);
        document.getElementById('jn-cuenta-atras').hidden = true;
        ocultarBono();

        const resultado = mensajeFinal(gano, estado.vidas);
        document.getElementById('jn-celebracion-titulo').textContent = resultado.titulo;
        document.getElementById('jn-celebracion-stat').textContent =
            `${estado.puntos} puntos — ${estado.comidos}/${TOTAL_COLECTABLES} productos — racha máxima x${estado.comboMaximo || 0} — ${cfgDificultad().nombre}`;
        if (window.OMMejoresResultados) {
            window.OMMejoresResultados.registrar('comecocos-drogueria', { valor: estado.puntos, texto: estado.puntos + ' puntos' });
        }

        dibujarResultadoEnCanvas();
        document.getElementById('jn-celebracion-overlay').hidden = false;
        if (resultado.celebrar) lanzarConfeti();
    }

    // ── Pantalla de inicio: el usuario decide cuándo empezar ──────────

    function mostrarInicioOverlay(mostrar) {
        document.getElementById('jn-inicio-overlay').hidden = !mostrar;
    }

    function empezarNueva() {
        mostrarInicioOverlay(false);
        nuevaPartida();
    }

    document.getElementById('jn-boton-jugar').addEventListener('click', empezarNueva);
    document.getElementById('jn-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        empezarNueva();
    });
    document.getElementById('jn-boton-jugar-de-nuevo').addEventListener('click', empezarNueva);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jn-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#1f6fb2', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jn-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado al Comecocos de Droguería de Orencio Matas y Hnos! 🛒';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jn-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Comecocos de Droguería 🛒', w / 2, 90);

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#1f6fb2';
        ctx.fillText(String(estado.puntos), w / 2, 190);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`puntos — racha máxima x${estado.comboMaximo || 0} — ${cfgDificultad().nombre}`, w / 2, 240);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jn-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'comecocos-drogueria.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'comecocos-drogueria.png', { type: 'image/png' })],
                        title: 'Comecocos de Droguería — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jn-compartir-overlay');
        const enlaceDescargar = document.getElementById('jn-boton-descargar');
        const canvas = document.getElementById('jn-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jn-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jn-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jn-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jn-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jn-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jn-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jn-compartir-overlay').hidden = true;
    });
    document.getElementById('jn-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jn-compartir-overlay') ev.currentTarget.hidden = true;
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

    function mezclarLogos(array) {
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function pintarMarcasAleatorias() {
        const cont = document.getElementById('jn-proveedores-grid');
        const barajadas = mezclarLogos(LOGOS);
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

    // ── Pantalla completa: tamaño exacto del laberinto ────────────────
    // El laberinto es una rejilla de celdas sin tamaño propio (igual
    // que las cartas de Memoria): "aspect-ratio + auto + max-width/
    // height" no resuelve de forma fiable el mayor tamaño cuadrado-por-
    // celda que cabe a la vez en ancho y alto disponibles. Se calcula
    // aquí en píxeles, replicando lo que "object-fit: contain" haría.

    function ajustarLaberintoAlEspacio(intentosRestantes) {
        const enPantallaCompleta = document.body.classList.contains('om-pantalla-completa-activa');
        if (!enPantallaCompleta) {
            laberinto.style.width = '';
            laberinto.style.height = '';
            return;
        }

        const wrap = laberinto.parentElement;
        const dispW = wrap.clientWidth;
        const dispH = wrap.clientHeight;

        if (!dispW || !dispH) {
            const quedan = intentosRestantes === undefined ? 10 : intentosRestantes;
            if (quedan > 0) requestAnimationFrame(() => ajustarLaberintoAlEspacio(quedan - 1));
            return;
        }

        const tamanoCelda = Math.min(dispW / COLS, dispH / ROWS);
        laberinto.style.width = Math.floor(tamanoCelda * COLS) + 'px';
        laberinto.style.height = Math.floor(tamanoCelda * ROWS) + 'px';
    }

    document.addEventListener('om-pantalla-completa-cambio', () => ajustarLaberintoAlEspacio());
    window.addEventListener('resize', () => ajustarLaberintoAlEspacio());

    // ── Arranque ─────────────────────────────────────────────────────
    // No se entra en partida automáticamente: se muestra la pantalla
    // de inicio con "Jugar" y es el usuario quien decide cuándo
    // empezar (igual que en La Estela de Color).

    pintarMarcasAleatorias();
    mostrarInicioOverlay(true);
    requestAnimationFrame(bucle);
})();
