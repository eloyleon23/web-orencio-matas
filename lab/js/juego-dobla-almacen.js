/**
 * Dobla el Almacén — minijuego (lab/dobla-almacen.html)
 * Vanilla JS, sin dependencias. Merge estilo 2048: desliza en una
 * cuadrícula NxN (arriba/abajo/izquierda/derecha, con botones,
 * flechas de teclado o gesto táctil) y las cajas con el mismo número
 * se fusionan en una del doble de valor. Cada movimiento añade una
 * caja nueva (2 u 8 de cada 10 veces, 4 el resto — igual que el 2048
 * original); la partida termina cuando el almacén se llena y ya no
 * queda ninguna fusión posible. Sin límite de tiempo: el reto es
 * puramente espacial, no contrarreloj (a diferencia de Triple Combo).
 */
(function () {
    'use strict';

    const DIFICULTADES = {
        facil: { nombre: 'Fácil', n: 5 },
        medio: { nombre: 'Medio', n: 4 },
        dificil: { nombre: 'Difícil', n: 3 },
    };

    const GAP = 6; // separación visual entre cajas, en px
    const HITOS_FICHA = [64, 128, 256, 512, 1024, 2048, 4096];

    const estado = {
        dificultad: 'medio',
        n: 4,
        cuadricula: [], // cuadricula[fila][col] = { valor, el } o null
        puntos: 0,
        mejorFicha: 2,
        hitosVistos: new Set(),
        terminado: false,
        jugando: false,
        pausado: false,
        bloqueado: false, // true durante la animación de un movimiento
    };

    let tamanoFicha = 60;
    const tablero = document.getElementById('jy-tablero');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    // ── Color por valor ──────────────────────────────────────────────
    // 2 y 4 claras (como el 2048 original); a partir de 8 se usa una
    // fórmula de tono según log2(valor) para no tener que mantener a
    // mano una lista de colores — funciona igual de bien llegue hasta
    // donde llegue la partida.
    function colorParaValor(valor) {
        if (valor === 2) return { fondo: '#efe9da', texto: '#5a564d' };
        if (valor === 4) return { fondo: '#e6dcc3', texto: '#5a564d' };
        const nivel = Math.log2(valor) - 2;
        const tono = (6 + nivel * 26) % 360;
        return { fondo: `hsl(${tono}, 62%, 50%)`, texto: '#ffffff' };
    }

    // ── Tamaño y posición de las cajas ─────────────────────────────────

    function medirTablero() {
        const n = estado.n;
        const enPantallaCompleta = document.body.classList.contains('om-pantalla-completa-activa');
        const wrap = tablero.parentElement;
        const dispW = wrap.clientWidth;

        if (enPantallaCompleta) {
            const dispH = wrap.clientHeight;
            if (!dispW || !dispH) {
                requestAnimationFrame(medirTablero);
                return;
            }
            tamanoFicha = Math.max(28, Math.floor(Math.min(dispW, dispH) / n));
        } else {
            tamanoFicha = Math.max(28, Math.floor((dispW || 300) / n));
        }

        tablero.style.width = (tamanoFicha * n) + 'px';
        tablero.style.height = (tamanoFicha * n) + 'px';
        tablero.style.setProperty('--jy-tam-ficha', tamanoFicha + 'px');
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
        for (let f = 0; f < estado.n; f++) {
            for (let c = 0; c < estado.n; c++) {
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

    // ── Fichas ───────────────────────────────────────────────────────

    function tamanoTextoPara(valor) {
        const digitos = String(valor).length;
        const factor = digitos >= 4 ? 0.34 : digitos === 3 ? 0.4 : 0.46;
        return Math.round(tamanoFicha * factor) + 'px';
    }

    function actualizarFichaDom(el, valor) {
        const color = colorParaValor(valor);
        el.textContent = String(valor);
        el.style.background = color.fondo;
        el.style.color = color.texto;
        el.style.fontSize = tamanoTextoPara(valor);
    }

    function crearFichaEl(valor) {
        const el = document.createElement('div');
        el.className = 'jy-ficha';
        actualizarFichaDom(el, valor);
        return el;
    }

    function celdasVacias() {
        const vacias = [];
        for (let f = 0; f < estado.n; f++) {
            for (let c = 0; c < estado.n; c++) {
                if (!estado.cuadricula[f][c]) vacias.push({ fila: f, col: c });
            }
        }
        return vacias;
    }

    function agregarFichaAleatoria() {
        const vacias = celdasVacias();
        if (vacias.length === 0) return;
        const { fila, col } = vacias[Math.floor(Math.random() * vacias.length)];
        const valor = Math.random() < 0.9 ? 2 : 4;
        const el = crearFichaEl(valor);
        el.classList.add('jy-ficha--nueva');
        tablero.appendChild(el);
        posicionar(el, fila, col);
        estado.cuadricula[fila][col] = { valor, el };
    }

    // ── Movimiento (deslizar + fusionar) ────────────────────────────────
    // "Línea" = fila (izquierda/derecha) o columna (arriba/abajo), con
    // el índice 0 siempre del lado de destino (hacia donde se
    // desliza) — así el mismo algoritmo de colapso sirve para las
    // cuatro direcciones sin repetir código.

    function obtenerLineas(direccion) {
        const n = estado.n;
        const lineas = [];
        if (direccion === 'izquierda' || direccion === 'derecha') {
            for (let f = 0; f < n; f++) {
                const coords = [];
                for (let k = 0; k < n; k++) {
                    coords.push({ fila: f, col: direccion === 'izquierda' ? k : (n - 1 - k) });
                }
                lineas.push(coords);
            }
        } else {
            for (let c = 0; c < n; c++) {
                const coords = [];
                for (let k = 0; k < n; k++) {
                    coords.push({ fila: direccion === 'arriba' ? k : (n - 1 - k), col: c });
                }
                lineas.push(coords);
            }
        }
        return lineas;
    }

    // Colapsa una línea (ya reordenada con el destino en el índice 0):
    // compacta las celdas ocupadas hacia el principio y fusiona cada
    // par de iguales consecutivo UNA sola vez (un 2,2,2,2 se convierte
    // en 4,4 — no en 8 — exactamente como en el 2048 original).
    function colapsarLinea(celdas) {
        const noVacias = [];
        celdas.forEach((celda, k) => { if (celda) noVacias.push({ valor: celda.valor, el: celda.el, kOrigen: k }); });

        const resultado = [];
        let puntosGanados = 0;
        let huboFusion = false;
        let i = 0;
        while (i < noVacias.length) {
            if (i + 1 < noVacias.length && noVacias[i].valor === noVacias[i + 1].valor) {
                const nuevoValor = noVacias[i].valor * 2;
                resultado.push({
                    valor: nuevoValor,
                    el: noVacias[i].el,
                    kOrigen: noVacias[i].kOrigen,
                    elFusionada: noVacias[i + 1].el,
                    kOrigenFusionada: noVacias[i + 1].kOrigen,
                    fusionada: true,
                });
                puntosGanados += nuevoValor;
                huboFusion = true;
                i += 2;
            } else {
                resultado.push({ valor: noVacias[i].valor, el: noVacias[i].el, kOrigen: noVacias[i].kOrigen, fusionada: false });
                i += 1;
            }
        }
        while (resultado.length < celdas.length) resultado.push(null);

        return { resultado, puntosGanados, huboFusion };
    }

    function mover(direccion) {
        if (estado.terminado || !estado.jugando || estado.pausado || estado.bloqueado) return;

        const lineas = obtenerLineas(direccion);
        let huboMovimiento = false;
        let puntosGanadosTotal = 0;
        let mejorFichaNueva = 0;

        lineas.forEach((coords) => {
            const celdasOriginales = coords.map(({ fila, col }) => estado.cuadricula[fila][col]);
            const { resultado, puntosGanados, huboFusion } = colapsarLinea(celdasOriginales);
            puntosGanadosTotal += puntosGanados;

            coords.forEach(({ fila, col }) => { estado.cuadricula[fila][col] = null; });

            resultado.forEach((entrada, k) => {
                if (!entrada) return;
                const { fila, col } = coords[k];

                if (entrada.kOrigen !== k) huboMovimiento = true;
                posicionar(entrada.el, fila, col);
                estado.cuadricula[fila][col] = { valor: entrada.valor, el: entrada.el };

                if (entrada.fusionada) {
                    huboMovimiento = true;
                    posicionar(entrada.elFusionada, fila, col);
                    actualizarFichaDom(entrada.el, entrada.valor);
                    entrada.el.classList.remove('jy-ficha--pop');
                    void entrada.el.offsetWidth;
                    entrada.el.classList.add('jy-ficha--pop');
                    const elEliminar = entrada.elFusionada;
                    setTimeout(() => elEliminar.remove(), 140);
                    if (entrada.valor > mejorFichaNueva) mejorFichaNueva = entrada.valor;
                }
            });

            if (huboFusion) { /* ya contabilizado arriba vía puntosGanados */ }
        });

        if (!huboMovimiento) return;

        estado.bloqueado = true;
        estado.puntos += puntosGanadosTotal;
        if (mejorFichaNueva > estado.mejorFicha) {
            estado.mejorFicha = mejorFichaNueva;
            comprobarHitoFicha(mejorFichaNueva);
        }
        actualizarVista();

        setTimeout(() => {
            agregarFichaAleatoria();
            estado.bloqueado = false;
            if (!hayMovimientosPosibles()) finalizarPartida();
        }, 150);
    }

    function hayMovimientosPosibles() {
        if (celdasVacias().length > 0) return true;
        for (let f = 0; f < estado.n; f++) {
            for (let c = 0; c < estado.n; c++) {
                const v = estado.cuadricula[f][c].valor;
                if (c + 1 < estado.n && estado.cuadricula[f][c + 1].valor === v) return true;
                if (f + 1 < estado.n && estado.cuadricula[f + 1][c].valor === v) return true;
            }
        }
        return false;
    }

    // ── Hitos / logros (toast) ─────────────────────────────────────────

    let temporizadorLogro = null;
    function mostrarLogro(texto) {
        const el = document.getElementById('jy-logro');
        el.textContent = texto;
        el.hidden = false;
        el.classList.remove('jy-logro--mostrar');
        void el.offsetWidth;
        el.classList.add('jy-logro--mostrar');
        clearTimeout(temporizadorLogro);
        temporizadorLogro = setTimeout(() => { el.hidden = true; }, 1800);
    }

    function comprobarHitoFicha(valor) {
        if (!HITOS_FICHA.includes(valor) || estado.hitosVistos.has(valor)) return;
        estado.hitosVistos.add(valor);
        mostrarLogro('¡Caja de ' + valor + '!' + (valor >= 2048 ? ' 🏆' : ''));
    }

    // ── Controles ────────────────────────────────────────────────────

    document.querySelectorAll('.jy-control-boton').forEach((boton) => {
        boton.addEventListener('click', () => mover(boton.dataset.dir));
    });

    document.addEventListener('keydown', (ev) => {
        const mapa = { ArrowLeft: 'izquierda', ArrowRight: 'derecha', ArrowUp: 'arriba', ArrowDown: 'abajo' };
        if (!mapa[ev.key]) return;
        ev.preventDefault();
        mover(mapa[ev.key]);
    });

    let inicioToque = null;
    tablero.addEventListener('pointerdown', (ev) => {
        inicioToque = { x: ev.clientX, y: ev.clientY };
    });
    tablero.addEventListener('pointerup', (ev) => {
        if (!inicioToque) return;
        const dx = ev.clientX - inicioToque.x;
        const dy = ev.clientY - inicioToque.y;
        inicioToque = null;
        const UMBRAL = 20;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < UMBRAL) return;
        if (Math.abs(dx) > Math.abs(dy)) mover(dx > 0 ? 'derecha' : 'izquierda');
        else mover(dy > 0 ? 'abajo' : 'arriba');
    });

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.jy-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jy-chip-dificultad').forEach((b) => {
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
        const boton = document.getElementById('jy-boton-pausa');
        const puedePausar = estado.jugando && !estado.terminado;
        boton.disabled = !puedePausar;
        boton.innerHTML = '<span aria-hidden="true">' + (estado.pausado || !puedePausar ? '▶' : '⏸︎') + '</span>';
        boton.setAttribute('aria-label', estado.pausado ? 'Reanudar' : 'Pausar');
    }

    function mostrarIndicadorPausa(mostrar) {
        document.getElementById('jy-pausado-indicador').hidden = !mostrar;
    }

    function pausar() {
        if (!estado.jugando || estado.terminado || estado.pausado) return;
        estado.pausado = true;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPausa();
        actualizarBotonPausa();
        mostrarIndicadorPausa(true);
    }

    function reanudar() {
        if (!estado.jugando || estado.terminado || !estado.pausado) return;
        estado.pausado = false;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarReanudacion();
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();
    }

    function alternarPausa() {
        if (estado.pausado) reanudar();
        else pausar();
    }

    document.getElementById('jy-boton-pausa').addEventListener('click', alternarPausa);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && estado.jugando && !estado.terminado && !estado.pausado) pausar();
    });

    // ── Vista ────────────────────────────────────────────────────────

    function actualizarVista() {
        document.getElementById('jy-puntos').textContent = String(estado.puntos);
        document.getElementById('jy-mejor-ficha').textContent = String(estado.mejorFicha);
    }

    // ── Partida ──────────────────────────────────────────────────────

    function construirTablero() {
        tablero.innerHTML = '';
        const cfg = cfgDificultad();
        estado.n = cfg.n;
        estado.cuadricula = [];
        for (let f = 0; f < estado.n; f++) {
            estado.cuadricula.push(new Array(estado.n).fill(null));
        }
        agregarFichaAleatoria();
        agregarFichaAleatoria();
        medirTablero();
    }

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('dobla-almacen');

        estado.puntos = 0;
        estado.mejorFicha = 2;
        estado.hitosVistos = new Set();
        estado.terminado = false;
        estado.jugando = true;
        estado.pausado = false;
        estado.bloqueado = false;

        document.getElementById('jy-celebracion-overlay').hidden = true;
        document.getElementById('jy-pista').style.display = '';
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();

        construirTablero();
        actualizarVista();
    }

    function mensajeFinal(mejorFicha) {
        if (mejorFicha >= 2048) return { titulo: '¡Caja definitiva conseguida! 🏆', celebrar: true };
        if (mejorFicha >= 512) return { titulo: '¡Muy buena fusión! 🎉', celebrar: true };
        if (mejorFicha >= 128) return { titulo: '¡Buena partida! 📦', celebrar: false };
        return { titulo: '¡Almacén lleno!', celebrar: false };
    }

    function finalizarPartida() {
        if (estado.terminado) return;
        estado.terminado = true;
        estado.jugando = false;
        estado.pausado = false;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarFinPartida('dobla-almacen');
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();

        const resultado = mensajeFinal(estado.mejorFicha);
        document.getElementById('jy-celebracion-titulo').textContent = resultado.titulo;
        document.getElementById('jy-celebracion-stat').textContent =
            `${estado.puntos} puntos — mejor caja ${estado.mejorFicha} — ${cfgDificultad().nombre}`;

        dibujarResultadoEnCanvas();
        document.getElementById('jy-celebracion-overlay').hidden = false;
        if (resultado.celebrar) lanzarConfeti();
    }

    document.getElementById('jy-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        nuevaPartida();
    });
    document.getElementById('jy-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jy-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jy-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Dobla el Almacén de Orencio Matas y Hnos! 📦';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jy-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Dobla el Almacén 📦', w / 2, 90);

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(String(estado.puntos), w / 2, 190);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`puntos — mejor caja ${estado.mejorFicha} — ${cfgDificultad().nombre}`, w / 2, 240);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jy-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'dobla-almacen.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'dobla-almacen.png', { type: 'image/png' })],
                        title: 'Dobla el Almacén — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jy-compartir-overlay');
        const enlaceDescargar = document.getElementById('jy-boton-descargar');
        const canvas = document.getElementById('jy-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jy-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jy-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jy-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jy-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jy-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jy-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jy-compartir-overlay').hidden = true;
    });
    document.getElementById('jy-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jy-compartir-overlay') ev.currentTarget.hidden = true;
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
        const cont = document.getElementById('jy-proveedores-grid');
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
