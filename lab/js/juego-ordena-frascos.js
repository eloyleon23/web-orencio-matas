/**
 * Ordena los Frascos — minijuego (lab/ordena-frascos.html)
 * Vanilla JS, sin dependencias. Puzzle de clasificar líquidos por
 * color ("water-sort"): toca un frasco para elegirlo y toca otro
 * para verter — solo se puede verter sobre un frasco vacío o con el
 * mismo color arriba del todo. El nivel se resuelve cuando cada
 * frasco queda de un único color (o vacío). Sin límite de tiempo: el
 * reto es pensar el movimiento, no reaccionar rápido — a diferencia
 * del resto de la suite, que es casi toda contrarreloj/reflejos. Un
 * único modo de juego: los logos que aparecen en cada frasco
 * alternan entre marcas de TODAS las áreas (ver LOGOS, más abajo) —
 * a petición de Eloy, un selector de tema por área habría dejado
 * fuera a las que no se eligieran, algo que no quería.
 */
(function () {
    'use strict';

    const CAPACIDAD = 4; // unidades de líquido por frasco
    const VACIOS = 2; // frascos vacíos de margen en cada nivel

    // Progresión de dificultad: más colores (y por tanto más frascos,
    // colores + VACIOS) en cada nivel de la partida. Bug real
    // reportado: "los seis niveles son relativamente fáciles" — se
    // añaden 3 niveles más por encima de la dificultad anterior (que
    // topaba en 6 colores/8 frascos) hasta 7 y 8 colores/9-10
    // frascos, tal y como ya preveía la propuesta original de este
    // juego. Son los dos tramos más difíciles verificados en las
    // pruebas de generación de niveles (hasta 15ms, igual de rápido
    // que el resto — ver generarNivel más abajo).
    const NIVELES = [4, 4, 5, 5, 6, 6, 7, 7, 8];

    // 8 colores bien diferenciables, cada uno con un símbolo propio
    // (no solo el tono) para que el juego siga siendo jugable sin
    // distinguir perfectamente el color exacto.
    const COLORES = [
        { hex: '#e85d75', simbolo: '●', nombre: 'Rosa pétalo' },
        { hex: '#e8a33d', simbolo: '▲', nombre: 'Ámbar' },
        { hex: '#4caf7d', simbolo: '■', nombre: 'Verde cítrico' },
        { hex: '#3a6fd8', simbolo: '◆', nombre: 'Azul marino' },
        { hex: '#8b5cf6', simbolo: '★', nombre: 'Violeta' },
        { hex: '#1fb6b0', simbolo: '✦', nombre: 'Turquesa' },
        { hex: '#f2684b', simbolo: '✚', nombre: 'Coral' },
        { hex: '#c9a227', simbolo: '✖', nombre: 'Mostaza' },
    ];

    const estado = {
        nivelIndex: 0, // 0-based, índice dentro de NIVELES
        tubos: [], // tubos[i] = array de índices de color, de abajo arriba
        marcasNivel: [], // marcasNivel[colorIdx] = slug de marca para ese color EN ESTE nivel (ver construirNivel)
        seleccion: null,
        movimientos: 0,
        movimientosPorNivel: 0,
        puntos: 0,
        terminado: false,
        jugando: false,
        bloqueado: false, // true durante la animación de un vertido
    };

    const tablero = document.getElementById('jo-tablero');
    const tableroWrap = document.querySelector('.jo-tablero-wrap');

    // ── Tamaño de los frascos en pantalla completa ──────────────────────
    // Fuera de pantalla completa se usa el tamaño fijo por defecto de
    // juego-ordena-frascos.css (--jo-ancho-frasco/--jo-alto-frasco sin
    // definir). En pantalla completa, donde SÍ hay mucho más alto
    // disponible, se mide y se agranda — ver el comentario largo en
    // ese mismo bloque del CSS sobre el bug que esto corrige.
    const RELACION_ALTO_ANCHO = 3.3;
    const ANCHO_MIN_PANTALLA_COMPLETA = 64;
    const ANCHO_MAX_PANTALLA_COMPLETA = 150;

    const GAP_TABLERO = 14; // debe coincidir con "gap" de .jo-tablero en el CSS

    // Calcula el mayor ancho de frasco (entre el mínimo y el máximo)
    // que, dado el número de frascos del nivel, cabe en el espacio
    // disponible SIN desbordar — probando de mayor a menor y, para
    // cada candidato, calculando cuántas columnas entran por fila
    // (flex-wrap) y por tanto cuántas filas resultarían, no solo si
    // cabe una única fila. Sin esto, un candidato que obliga a 2 filas
    // podía seguir pareciendo "cabe" si solo se miraba el alto de una
    // fila, desbordando la zona real (bug real: en una pantalla de
    // 1366×700 los frascos se salían por arriba y por abajo).
    function calcularAnchoFrasco(n, anchoDisp, altoDisp) {
        for (let ancho = ANCHO_MAX_PANTALLA_COMPLETA; ancho >= ANCHO_MIN_PANTALLA_COMPLETA; ancho -= 2) {
            const alto = ancho * RELACION_ALTO_ANCHO;
            const columnas = Math.max(1, Math.floor((anchoDisp + GAP_TABLERO) / (ancho + GAP_TABLERO)));
            const filas = Math.ceil(n / columnas);
            const altoNecesario = filas * alto + (filas - 1) * GAP_TABLERO;
            if (altoNecesario <= altoDisp) return ancho;
        }
        return ANCHO_MIN_PANTALLA_COMPLETA;
    }

    function medirTablero() {
        if (!tableroWrap) return;
        const enPantallaCompleta = document.body.classList.contains('om-pantalla-completa-activa');

        if (!enPantallaCompleta) {
            tablero.style.removeProperty('--jo-ancho-frasco');
            tablero.style.removeProperty('--jo-alto-frasco');
            return;
        }

        // Pequeño margen de seguridad (padding del propio tablero,
        // redondeos) para no quedarse justo al límite.
        const altoDisp = Math.floor(tableroWrap.clientHeight * 0.94);
        const anchoDisp = Math.floor(tableroWrap.clientWidth * 0.96);
        if (!altoDisp || !anchoDisp) {
            requestAnimationFrame(medirTablero);
            return;
        }
        const n = estado.tubos.length || 1;
        const ancho = calcularAnchoFrasco(n, anchoDisp, altoDisp);
        const alto = Math.round(ancho * RELACION_ALTO_ANCHO);
        tablero.style.setProperty('--jo-ancho-frasco', ancho + 'px');
        tablero.style.setProperty('--jo-alto-frasco', alto + 'px');
    }

    let temporizadorResizeTablero = null;
    window.addEventListener('resize', () => {
        clearTimeout(temporizadorResizeTablero);
        temporizadorResizeTablero = setTimeout(medirTablero, 60);
    });
    window.addEventListener('orientationchange', () => setTimeout(medirTablero, 150));
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => setTimeout(medirTablero, 60));
    }
    document.addEventListener('om-pantalla-completa-cambio', () => setTimeout(medirTablero, 60));

    // ── Generación de niveles (garantizada resoluble) ───────────────────
    // Se genera un reparto aleatorio de colores en los frascos y se
    // verifica con un solver propio (DFS con heurística de orden de
    // movimientos — ver movimientosOrdenados) que exista AL MENOS una
    // secuencia de movimientos reales que lo resuelva; si no, se
    // vuelve a barajar. En la práctica el primer intento ya es
    // resoluble casi siempre (medido: <15ms incluso con 8 colores).

    function mezclar(array) {
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function claveTubos(tubos) {
        return tubos.map((t) => t.join(',')).join('|');
    }

    function tuboResuelto(t) {
        return t.length === 0 || (t.length === CAPACIDAD && t.every((c) => c === t[0]));
    }

    function estadoResuelto(tubos) {
        return tubos.every(tuboResuelto);
    }

    function corridaSuperior(t) {
        if (t.length === 0) return 0;
        const color = t[t.length - 1];
        let r = 0;
        for (let k = t.length - 1; k >= 0 && t[k] === color; k--) r++;
        return r;
    }

    // Movimientos legales, con heurística de orden: primero los que
    // "producen progreso" real (vacían del todo el origen, o
    // completan un tubo hasta el tope), luego el resto — así el DFS
    // de esResoluble() encuentra una solución mucho más rápido que
    // explorando por capas (BFS), sin necesitar la solución óptima,
    // solo que exista alguna.
    function movimientosOrdenados(tubos) {
        const buenos = [];
        const normales = [];
        for (let i = 0; i < tubos.length; i++) {
            const origen = tubos[i];
            if (origen.length === 0) continue;
            const colorTop = origen[origen.length - 1];
            const corrida = corridaSuperior(origen);
            for (let j = 0; j < tubos.length; j++) {
                if (i === j) continue;
                const destino = tubos[j];
                if (destino.length >= CAPACIDAD) continue;
                const destinoVacio = destino.length === 0;
                if (!destinoVacio && destino[destino.length - 1] !== colorTop) continue;
                // Mover un tubo YA monocromo entero a otro vacío no
                // progresa nada (solo cambia cuál está vacío).
                if (destinoVacio && corrida === origen.length && origen.length < CAPACIDAD) continue;
                const espacio = CAPACIDAD - destino.length;
                const mover = Math.min(corrida, espacio);
                const origenQuedaVacio = mover === origen.length;
                const destinoQuedaCompleto = (destino.length + mover) === CAPACIDAD;
                const mov = [i, j];
                if (origenQuedaVacio || destinoQuedaCompleto) buenos.push(mov);
                else normales.push(mov);
            }
        }
        return buenos.concat(normales);
    }

    function aplicarMov(tubos, i, j) {
        const nuevo = tubos.map((t) => t.slice());
        const origen = nuevo[i];
        const colorTop = origen[origen.length - 1];
        let corrida = 0;
        for (let k = origen.length - 1; k >= 0 && origen[k] === colorTop; k--) corrida++;
        const espacio = CAPACIDAD - nuevo[j].length;
        const mover = Math.min(corrida, espacio);
        for (let k = 0; k < mover; k++) nuevo[j].push(origen.pop());
        return nuevo;
    }

    function esResoluble(tubosIniciales, limiteEstados) {
        const visitados = new Set([claveTubos(tubosIniciales)]);
        const pila = [tubosIniciales];
        let explorados = 0;
        while (pila.length && explorados < limiteEstados) {
            const actual = pila.pop();
            explorados++;
            if (estadoResuelto(actual)) return true;
            const movs = movimientosOrdenados(actual);
            for (let k = movs.length - 1; k >= 0; k--) {
                const [a, b] = movs[k];
                const siguiente = aplicarMov(actual, a, b);
                const clave = claveTubos(siguiente);
                if (!visitados.has(clave)) {
                    visitados.add(clave);
                    pila.push(siguiente);
                }
            }
        }
        return false;
    }

    const LIMITE_ESTADOS_SOLVER = 20000;
    const MAX_INTENTOS_GENERACION = 25;

    function generarNivel(numColores) {
        for (let intento = 0; intento < MAX_INTENTOS_GENERACION; intento++) {
            const unidades = [];
            for (let c = 0; c < numColores; c++) {
                for (let k = 0; k < CAPACIDAD; k++) unidades.push(c);
            }
            const barajadas = mezclar(unidades);
            const tubos = [];
            for (let t = 0; t < numColores; t++) {
                tubos.push(barajadas.slice(t * CAPACIDAD, t * CAPACIDAD + CAPACIDAD));
            }
            for (let t = 0; t < VACIOS; t++) tubos.push([]);
            const tubosMezclados = mezclar(tubos);
            if (esResoluble(tubosMezclados, LIMITE_ESTADOS_SOLVER)) return tubosMezclados;
        }
        // Red de seguridad teórica (no debería hacer falta nunca en la
        // práctica — ver pruebas de generación): reparto ya resuelto,
        // igual de jugable aunque sin reto, antes que bloquear la partida.
        const tubos = [];
        for (let c = 0; c < numColores; c++) tubos.push(new Array(CAPACIDAD).fill(c));
        for (let t = 0; t < VACIOS; t++) tubos.push([]);
        return tubos;
    }

    // ── Vertido ──────────────────────────────────────────────────────

    function verterValido(i, j) {
        if (i === j) return false;
        const origen = estado.tubos[i];
        const destino = estado.tubos[j];
        if (origen.length === 0) return false;
        if (destino.length >= CAPACIDAD) return false;
        if (destino.length === 0) return true;
        return destino[destino.length - 1] === origen[origen.length - 1];
    }

    function verter(i, j) {
        const origen = estado.tubos[i];
        const destino = estado.tubos[j];
        const colorTop = origen[origen.length - 1];
        const corrida = corridaSuperior(origen);
        const espacio = CAPACIDAD - destino.length;
        const mover = Math.min(corrida, espacio);
        for (let k = 0; k < mover; k++) destino.push(origen.pop());
        return mover;
    }

    // ── Render ───────────────────────────────────────────────────────

    function crearFrascoEl(indiceTubo) {
        const el = document.createElement('div');
        el.className = 'jo-frasco';
        el.dataset.indice = String(indiceTubo);
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        // El "cuerpo" interior es quien recorta los colores a las
        // esquinas redondeadas de abajo (overflow: hidden) — si ese
        // recorte viviera en .jo-frasco directamente, se comería
        // también el cuello del frasco (::before, por encima del
        // propio borde), que es justo el efecto de frasco "cortado"
        // reportado. Ver juego-ordena-frascos.css.
        const cuerpo = document.createElement('div');
        cuerpo.className = 'jo-frasco__cuerpo';
        el.appendChild(cuerpo);
        actualizarFrascoEl(el, indiceTubo);
        return el;
    }

    function actualizarFrascoEl(el, indiceTubo) {
        const tubo = estado.tubos[indiceTubo];
        const cuerpo = el.querySelector('.jo-frasco__cuerpo');
        cuerpo.innerHTML = '';
        tubo.forEach((colorIdx) => {
            const seg = document.createElement('div');
            seg.className = 'jo-segmento';
            const color = COLORES[colorIdx];
            seg.style.background = color.hex;
            // A petición de Eloy: un logo real de marca (no el símbolo
            // abstracto de antes) en cada bloque de color, para que se
            // vea mientras se juega — elegida al azar por nivel entre
            // TODAS las marcas que tenemos (ver estado.marcasNivel en
            // construirNivel y LOGOS más abajo), sin filtrar por tema
            // ("no poner el resto sería discriminatorio"). No afecta a
            // la resolución del puzzle, que sigue basándose en el color
            // de fondo de cada bloque, no en el logo.
            if (estado.marcasNivel[colorIdx]) {
                const marca = estado.marcasNivel[colorIdx];
                const insignia = document.createElement('span');
                insignia.className = 'jo-segmento__logo';
                const img = document.createElement('img');
                img.src = rutaLogo(marca);
                img.alt = '';
                img.loading = 'lazy';
                insignia.appendChild(img);
                seg.appendChild(insignia);
            }
            seg.title = color.nombre;
            cuerpo.appendChild(seg);
        });
        el.classList.toggle('is-resuelto', tuboResuelto(tubo) && tubo.length > 0);
        el.setAttribute('aria-label', tubo.length === 0
            ? 'frasco vacío'
            : `frasco con ${tubo.length} unidades, arriba ${COLORES[tubo[tubo.length - 1]].nombre}`);
    }

    function renderTablero() {
        tablero.innerHTML = '';
        estado.tubos.forEach((_, i) => tablero.appendChild(crearFrascoEl(i)));
    }

    function marcarSegmentoNuevo(indiceTubo) {
        const el = tablero.querySelector(`.jo-frasco[data-indice="${indiceTubo}"]`);
        if (!el) return;
        const segmentos = el.querySelectorAll('.jo-segmento');
        const ultimo = segmentos[segmentos.length - 1];
        if (ultimo) {
            ultimo.classList.add('jo-segmento--entrando');
            setTimeout(() => ultimo.classList.remove('jo-segmento--entrando'), 220);
        }
    }

    // ── Interacción ──────────────────────────────────────────────────

    function deseleccionarTodo() {
        tablero.querySelectorAll('.jo-frasco.is-seleccionado').forEach((el) => el.classList.remove('is-seleccionado'));
        estado.seleccion = null;
    }

    function destellarInvalido(indiceTubo) {
        const el = tablero.querySelector(`.jo-frasco[data-indice="${indiceTubo}"]`);
        if (!el) return;
        el.classList.remove('is-invalido');
        void el.offsetWidth;
        el.classList.add('is-invalido');
        setTimeout(() => el.classList.remove('is-invalido'), 300);
    }

    function manejarClicFrasco(indiceTubo) {
        if (!estado.jugando || estado.terminado || estado.bloqueado) return;

        if (estado.seleccion === null) {
            if (estado.tubos[indiceTubo].length === 0) return; // nada que verter desde un frasco vacío
            estado.seleccion = indiceTubo;
            tablero.querySelector(`.jo-frasco[data-indice="${indiceTubo}"]`).classList.add('is-seleccionado');
            return;
        }

        if (estado.seleccion === indiceTubo) {
            deseleccionarTodo();
            return;
        }

        const origen = estado.seleccion;
        if (!verterValido(origen, indiceTubo)) {
            destellarInvalido(indiceTubo);
            // Si el frasco tocado SÍ tiene contenido, se cambia la
            // selección a él (más cómodo que tener que deseleccionar
            // primero) en vez de quedarse bloqueado en un intento fallido.
            deseleccionarTodo();
            if (estado.tubos[indiceTubo].length > 0) manejarClicFrasco(indiceTubo);
            return;
        }

        estado.bloqueado = true;
        verter(origen, indiceTubo);
        estado.movimientos++;
        estado.movimientosPorNivel++;
        actualizarVista();
        deseleccionarTodo();

        const elOrigen = tablero.querySelector(`.jo-frasco[data-indice="${origen}"]`);
        const elDestino = tablero.querySelector(`.jo-frasco[data-indice="${indiceTubo}"]`);
        actualizarFrascoEl(elOrigen, origen);
        actualizarFrascoEl(elDestino, indiceTubo);
        marcarSegmentoNuevo(indiceTubo);

        setTimeout(() => {
            estado.bloqueado = false;
            if (estadoResuelto(estado.tubos)) {
                nivelResuelto();
            }
        }, 160);
    }

    tablero.addEventListener('click', (ev) => {
        const frascoEl = ev.target.closest('.jo-frasco');
        if (!frascoEl) return;
        manejarClicFrasco(Number(frascoEl.dataset.indice));
    });

    tablero.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        const frascoEl = ev.target.closest('.jo-frasco');
        if (!frascoEl) return;
        ev.preventDefault();
        manejarClicFrasco(Number(frascoEl.dataset.indice));
    });

    // ── Logro / mensaje de nivel ─────────────────────────────────────

    let temporizadorLogro = null;
    function mostrarLogro(texto) {
        const el = document.getElementById('jo-logro');
        el.textContent = texto;
        el.hidden = false;
        el.classList.remove('jo-logro--mostrar');
        void el.offsetWidth;
        el.classList.add('jo-logro--mostrar');
        clearTimeout(temporizadorLogro);
        temporizadorLogro = setTimeout(() => { el.hidden = true; }, 1600);
    }

    // ── Puntuación ───────────────────────────────────────────────────
    // Cuantos menos movimientos se usen en un nivel, más puntos — sin
    // reloj, para que "mejor resultado" (ver mejores-resultados.js,
    // que asume que un valor más alto siempre es mejor) tenga sentido
    // con "menos movimientos es mejor".

    function puntosPorNivel(movimientosUsados) {
        return Math.max(20, 200 - movimientosUsados * 8);
    }


    // ── Vista ────────────────────────────────────────────────────────

    function actualizarVista() {
        document.getElementById('jo-nivel').textContent = String(estado.nivelIndex + 1);
        document.getElementById('jo-movimientos').textContent = String(estado.movimientosPorNivel);
        document.getElementById('jo-puntos').textContent = String(estado.puntos);
    }

    // ── Partida ──────────────────────────────────────────────────────

    function construirNivel() {
        const numColores = NIVELES[estado.nivelIndex];
        estado.tubos = generarNivel(numColores);
        // Una marca distinta por color, elegida al azar entre TODAS las
        // que tenemos (ver LOGOS, más abajo) — no solo las 8 primeras
        // de la lista: se baraja de nuevo en cada nivel, así que a lo
        // largo de una partida (y de una partida a otra) se ven marcas
        // distintas, no siempre las mismas. Como LOGOS tiene de sobra
        // (36) para el máximo de colores de un nivel (8), nunca hace
        // falta repetir ninguna dentro del mismo nivel.
        estado.marcasNivel = mezclarLogos(LOGOS).slice(0, numColores);
        estado.movimientosPorNivel = 0;
        estado.seleccion = null;
        renderTablero();
        actualizarVista();
        medirTablero();
    }

    function nivelResuelto() {
        const puntos = puntosPorNivel(estado.movimientosPorNivel);
        estado.puntos += puntos;
        mostrarLogro(`¡Nivel ${estado.nivelIndex + 1} completo! +${puntos}`);

        if (estado.nivelIndex + 1 >= NIVELES.length) {
            setTimeout(finalizarPartida, 700);
            return;
        }

        setTimeout(() => {
            estado.nivelIndex++;
            construirNivel();
        }, 900);
    }

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('ordena-frascos');

        estado.nivelIndex = 0;
        estado.movimientos = 0;
        estado.movimientosPorNivel = 0;
        estado.puntos = 0;
        estado.terminado = false;
        estado.jugando = true;
        estado.bloqueado = false;

        document.getElementById('jo-celebracion-overlay').hidden = true;
        document.getElementById('jo-pista').style.display = '';

        construirNivel();
    }

    // Umbrales escalados junto con NIVELES (eran 1000/750 cuando la
    // partida tenía 6 niveles como máximo) — con 9 niveles el máximo
    // teórico de puntos también sube, así que se suben en la misma
    // proporción (×1.5) para que sigan representando un resultado
    // igual de exigente, no más fácil de alcanzar por tener más niveles.
    function mensajeFinal(puntos) {
        if (puntos >= 1500) return { titulo: '¡Nariz perfecta! 🏆', celebrar: true };
        if (puntos >= 1125) return { titulo: '¡Muy buena partida! 🎉', celebrar: true };
        return { titulo: '¡Partida completa!', celebrar: false };
    }

    function finalizarPartida() {
        if (estado.terminado) return;
        estado.terminado = true;
        estado.jugando = false;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarFinPartida('ordena-frascos');

        const resultado = mensajeFinal(estado.puntos);
        document.getElementById('jo-celebracion-titulo').textContent = resultado.titulo;
        document.getElementById('jo-celebracion-stat').textContent =
            `${estado.puntos} puntos — ${estado.movimientos} movimientos — ${NIVELES.length} niveles`;
        if (window.OMMejoresResultados) {
            window.OMMejoresResultados.registrar('ordena-frascos', { valor: estado.puntos, texto: estado.puntos + ' puntos' });
        }

        dibujarResultadoEnCanvas();
        document.getElementById('jo-celebracion-overlay').hidden = false;
        if (resultado.celebrar) lanzarConfeti();
    }

    document.getElementById('jo-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        nuevaPartida();
    });
    document.getElementById('jo-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jo-confeti');
        contenedor.innerHTML = '';
        const colores = COLORES.map((c) => c.hex);
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jo-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jo-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Ordena los Frascos 🧪', w / 2, 90);

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(String(estado.puntos), w / 2, 190);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`puntos — ${estado.movimientos} movimientos — ${NIVELES.length} niveles`, w / 2, 240);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const textoCompartir = '¡He jugado a Ordena los Frascos de Orencio Matas y Hnos! 🧪';
        const canvas = document.getElementById('jo-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null, textoCompartir);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'ordena-frascos.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'ordena-frascos.png', { type: 'image/png' })],
                        title: 'Ordena los Frascos — Orencio Matas y Hnos',
                        text: textoCompartir,
                    });
                    return;
                } catch (err) {
                    // Cancelado por el usuario u otro fallo — se cae al panel manual.
                }
            }
            abrirPanelCompartir(blob, textoCompartir);
        }, 'image/png');
    }

    function abrirPanelCompartir(blob, textoCompartir) {
        const overlay = document.getElementById('jo-compartir-overlay');
        const enlaceDescargar = document.getElementById('jo-boton-descargar');
        const canvas = document.getElementById('jo-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(textoCompartir + ' ' + URL_SITIO);
        document.getElementById('jo-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jo-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jo-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jo-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jo-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jo-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jo-compartir-overlay').hidden = true;
    });
    document.getElementById('jo-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jo-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Marcas (todas, sin modos ni filtros por área) ────────────────────
    // A petición de Eloy: un selector de tema por área habría dejado
    // fuera a las que no se eligieran — "no poner el resto sería
    // discriminatorio". Un único modo de juego, con un único diseño de
    // frasco (ver juego-ordena-frascos.css), y TODAS las marcas que
    // tenemos alternando entre ellas tanto en la insignia de cada
    // bloque de color (ver actualizarFrascoEl) como en la sección
    // "Algunas de nuestras marcas" de abajo.
    //
    // La lista sigue viniendo de catálogo real, no inventada — filtrando
    // data/productos.json por marca y comprobando en qué área(s)
    // aparece de verdad (ver el análisis del PR): ningún nombre de
    // aquí es talleres-exclusivo (esa área usa sus propios catálogos de
    // proveedor — Glasurit/Besa/Baslac/Zaphiro — fuera de esta lista).
    // Dos correcciones de Eloy sobre el reparto inicial por tema:
    // "thomil y kelsia son de Droguería" (no de Pinturas, donde habían
    // quedado por error) y se añaden tres marcas de pintura reales que
    // faltaban — Akzonobel, 3M y Titan (TitanPro/TitanTech son líneas
    // de la misma marca Titan, confirmado en el catálogo: hay
    // productos "TITAN", "TITANPRO" y "TITANTECH" distintos bajo el
    // mismo fabricante — un único logo para los tres).
    const LOGOS = [
        '3m', 'akzonobel', 'alvarezgomez', 'ariel', 'arrixaca', 'asevi', 'babaria',
        'baixens', 'caselli', 'cif', 'cisent', 'compo', 'elmilagrito', 'fairy',
        'flower', 'gomacamps', 'industrias_beter', 'industrias_betik', 'jofel',
        'kelsia', 'losdi', 'masso', 'mimosin', 'mora', 'muropapel', 'nespoli',
        'pentrilo', 'polmeros_del_valls', 'renova', 'ressol', 'sika', 'thomil',
        'titan', 'vijusa', 'vileda', 'vinfer',
    ];
    const EXTENSIONES = {
        ariel: 'jpg', arrixaca: 'jpg', asevi: 'jpg', babaria: 'webp', baixens: 'jpg',
        caselli: 'jpg', cif: 'jpg', elmilagrito: 'png', fairy: 'jpg',
        gomacamps: 'jpg', industrias_beter: 'jpg', industrias_betik: 'jpg',
        kelsia: 'webp', losdi: 'jpg', masso: 'webp', mimosin: 'jpg',
        muropapel: 'jpg', polmeros_del_valls: 'jpg', renova: 'svg', ressol: 'jpg',
        thomil: 'png', vileda: 'jpg',
    };
    // Titan vive en una carpeta distinta (assets/proveedores/, junto a
    // las marcas de Talleres) con un nombre de archivo que no sigue el
    // patrón logo_<clave>.<ext> del resto — ruta completa aparte en
    // vez de forzarla dentro de rutaLogo().
    const RUTA_LOGO_TITAN = '../assets/proveedores/LOGO-TITANPRO.png';

    function rutaLogo(clave) {
        if (clave === 'titan') return RUTA_LOGO_TITAN;
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

    function pintarMarcas() {
        const cont = document.getElementById('jo-proveedores-grid');
        const barajadas = mezclarLogos(LOGOS);
        cont.innerHTML = '';
        barajadas.slice(0, 9).forEach((clave) => {
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

    pintarMarcas();
    nuevaPartida();
})();
