/**
 * La Estela de Color — minijuego (lab/estela.html)
 * Vanilla JS, sin dependencias. Una brocha se mueve sin parar por el
 * lienzo en línea recta (arriba/abajo/izquierda/derecha), pintando una
 * estela. Se dirige con los botones de flecha (o las flechas del
 * teclado en PC) — sin tocar el lienzo directamente, que resultaba
 * confuso. El botón central (⏸/▶) pausa y reanuda la partida en
 * cualquier momento, ya que al ser un juego acumulativo puede alargarse.
 * Al pasar sobre un bote de pigmento tu color actual se mezcla con el
 * suyo; en dificultad media y difícil también aparecen botes de
 * aguarrás/agua que, si se recogen, borran parte de la estela ya
 * pintada. No puedes chocar contra tu propia estela ya seca ni salir
 * del lienzo.
 *
 * El movimiento y las colisiones viven en un espacio lógico fijo
 * (GW × GH, independiente del tamaño real en pantalla): así cambiar
 * de tamaño el canvas (pantalla completa, girar el móvil) nunca
 * desincroniza el juego — solo hay que recalcular la escala de
 * dibujo, no la física. El trazado se guarda como una lista de
 * segmentos para poder redibujarlo entero si el canvas cambia de
 * tamaño o si hay que recortar la cola (aguarrás).
 *
 * La partida no empieza sola: hay que pulsar "Jugar" (o "Continuar"
 * si queda una partida en pausa de esta misma sesión, guardada en
 * sessionStorage) para evitar que arranque de golpe sin que el
 * jugador esté preparado.
 */
(function () {
    'use strict';

    // ── Espacio lógico del lienzo ───────────────────────────────────────
    const GW = 100;
    const GH = 130;
    const GRACIA_FRAMES = 42; // nº de fotogramas recientes exentos de autocolisión
    const RADIO_RECOGIDA = 4.2;
    const CLAVE_SESION = 'om_estela_guardado';

    // ── Dificultad ───────────────────────────────────────────────────
    const DIFICULTADES = {
        facil: {
            nombre: 'Fácil', velocidad: 0.50, anchoLinea: 3.4,
            intervaloPigmento: 2600, maxObjetos: 3, objetivoCobertura: 30,
            probabilidadDisolvente: 0,
        },
        medio: {
            nombre: 'Medio', velocidad: 0.72, anchoLinea: 2.8,
            intervaloPigmento: 2200, maxObjetos: 3, objetivoCobertura: 40,
            probabilidadDisolvente: 0.22,
        },
        dificil: {
            nombre: 'Difícil', velocidad: 1.35, anchoLinea: 2.2,
            intervaloPigmento: 1800, maxObjetos: 4, objetivoCobertura: 50,
            probabilidadDisolvente: 0.32,
        },
    };

    const PIGMENTOS = [
        { clave: 'rojo', rgb: [217, 27, 27] },
        { clave: 'azul', rgb: [30, 75, 143] },
        { clave: 'amarillo', rgb: [240, 179, 0] },
        { clave: 'verde', rgb: [27, 143, 76] },
        { clave: 'blanco', rgb: [255, 255, 255] },
        { clave: 'negro', rgb: [26, 26, 26] },
    ];
    const COLOR_INICIAL = [217, 27, 27];

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        dificultad: 'medio',
        x: GW / 2, y: 10,
        dx: 0, dy: 1, // dirección actual: un vector cardinal unitario
        colorActual: COLOR_INICIAL.slice(),
        celdas: null, // Int32Array: fotograma en que se pintó cada celda, -1 = sin pintar
        celdasPintadas: 0,
        objetos: [], // botes de pigmento y de aguarrás/agua a recoger
        historialTrazos: [],
        puntos: 0,
        pigmentosRecogidos: 0,
        fotograma: 0,
        terminado: false,
        jugando: false,
        pausado: false,
        partidaIniciada: false,
    };

    let animacionId = null;
    let temporizadorPigmento = null;
    let escalaX = 1, escalaY = 1;

    const zona = document.getElementById('je-zona');
    const canvas = document.getElementById('je-canvas');
    const ctx = canvas.getContext('2d');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    function idxCelda(x, y) {
        return Math.floor(y) * GW + Math.floor(x);
    }

    // ── Dimensionado del canvas (desacoplado del espacio lógico) ─────

    function redimensionarCanvas() {
        const rect = zona.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        escalaX = canvas.width / GW;
        escalaY = canvas.height / GH;
        redibujarTodo();
    }

    function anchoTrazoPx() {
        return cfgDificultad().anchoLinea * ((escalaX + escalaY) / 2);
    }

    function redibujarTodo() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const ancho = anchoTrazoPx();
        estado.historialTrazos.forEach((seg) => {
            ctx.strokeStyle = `rgb(${seg.color[0]}, ${seg.color[1]}, ${seg.color[2]})`;
            ctx.lineWidth = ancho;
            ctx.beginPath();
            ctx.moveTo(seg.x1 * escalaX, seg.y1 * escalaY);
            ctx.lineTo(seg.x2 * escalaX, seg.y2 * escalaY);
            ctx.stroke();
        });
        estado.objetos.forEach((o) => (o.tipo === 'disolvente' ? dibujarDisolvente(o) : dibujarPigmento(o)));
    }

    function pintarSegmento(x1, y1, x2, y2, color) {
        ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.lineWidth = anchoTrazoPx();
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1 * escalaX, y1 * escalaY);
        ctx.lineTo(x2 * escalaX, y2 * escalaY);
        ctx.stroke();
    }

    // Reconstruye el mapa de celdas pintadas (y su recuento) a partir
    // del historial de trazos — se usa tras recortar la cola por un
    // aguarrás, para que la colisión y el % de cobertura coincidan
    // exactamente con lo que se ve en pantalla.
    function recalcularCeldasDesdeHistorial() {
        estado.celdas.fill(-1);
        estado.celdasPintadas = 0;
        estado.historialTrazos.forEach((seg) => {
            const idx = idxCelda(seg.x2, seg.y2);
            if (estado.celdas[idx] === -1) estado.celdasPintadas++;
            estado.celdas[idx] = seg.fotograma;
        });
    }

    let temporizadorResize = null;
    window.addEventListener('resize', () => {
        clearTimeout(temporizadorResize);
        temporizadorResize = setTimeout(redimensionarCanvas, 120);
    });
    window.addEventListener('orientationchange', () => {
        redimensionarCanvas();
        setTimeout(redimensionarCanvas, 300);
    });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            clearTimeout(temporizadorResize);
            temporizadorResize = setTimeout(redimensionarCanvas, 120);
        });
    }
    document.addEventListener('om-pantalla-completa-cambio', () => {
        redimensionarCanvas();
        setTimeout(redimensionarCanvas, 350);
    });

    // ── Controles: botones de flecha + flechas de teclado ─────────────

    // No se permite invertir el sentido de golpe (p. ej. ir a la
    // izquierda y pulsar a la derecha) porque chocaría contra la
    // propia estela en el acto — igual que en el clásico "snake".
    function fijarDireccion(ndx, ndy) {
        if (estado.terminado || !estado.jugando) return;
        if (ndx === -estado.dx && ndy === -estado.dy) return;
        estado.dx = ndx;
        estado.dy = ndy;
    }

    document.querySelectorAll('.je-control-boton[data-dir]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const mapa = {
                arriba: [0, -1], abajo: [0, 1],
                izquierda: [-1, 0], derecha: [1, 0],
            };
            const vector = mapa[boton.dataset.dir];
            if (vector) fijarDireccion(vector[0], vector[1]);
        });
    });

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowLeft') fijarDireccion(-1, 0);
        else if (ev.key === 'ArrowRight') fijarDireccion(1, 0);
        else if (ev.key === 'ArrowUp') fijarDireccion(0, -1);
        else if (ev.key === 'ArrowDown') fijarDireccion(0, 1);
        else if (ev.key === ' ' || ev.key === 'Spacebar') {
            ev.preventDefault();
            alternarPausa();
        }
    });

    // ── Pausa / reanudar ──────────────────────────────────────────────

    function actualizarBotonJugarPausa() {
        const boton = document.getElementById('je-boton-jugar-pausa');
        if (!boton) return;
        const puedePausar = estado.jugando && !estado.terminado;
        boton.disabled = !puedePausar;
        boton.textContent = estado.pausado || !puedePausar ? '▶' : '⏸';
        boton.setAttribute('aria-label', estado.pausado ? 'Reanudar' : 'Pausar');
    }

    function mostrarIndicadorPausa(mostrar) {
        const el = document.getElementById('je-pausado-indicador');
        if (el) el.hidden = !mostrar;
    }

    function pausar() {
        if (!estado.jugando || estado.terminado || estado.pausado) return;
        estado.pausado = true;
        if (animacionId) cancelAnimationFrame(animacionId);
        animacionId = null;
        guardarEstado();
        actualizarBotonJugarPausa();
        mostrarIndicadorPausa(true);
    }

    function reanudar() {
        if (!estado.jugando || estado.terminado || !estado.pausado) return;
        estado.pausado = false;
        mostrarIndicadorPausa(false);
        actualizarBotonJugarPausa();
        animacionId = requestAnimationFrame(frame);
    }

    function alternarPausa() {
        if (estado.pausado) reanudar();
        else pausar();
    }

    document.getElementById('je-boton-jugar-pausa').addEventListener('click', alternarPausa);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && estado.jugando && !estado.terminado && !estado.pausado) pausar();
    });
    window.addEventListener('pagehide', () => {
        if (estado.jugando && !estado.terminado) guardarEstado();
    });

    // ── Guardado / reanudación de partida (sessionStorage) ────────────

    function hayPartidaGuardada() {
        try {
            return !!sessionStorage.getItem(CLAVE_SESION);
        } catch (err) {
            return false;
        }
    }

    function guardarEstado() {
        try {
            const datos = {
                dificultad: estado.dificultad,
                x: estado.x, y: estado.y, dx: estado.dx, dy: estado.dy,
                colorActual: estado.colorActual,
                celdas: Array.from(estado.celdas),
                celdasPintadas: estado.celdasPintadas,
                historialTrazos: estado.historialTrazos,
                objetos: estado.objetos,
                puntos: estado.puntos,
                pigmentosRecogidos: estado.pigmentosRecogidos,
                fotograma: estado.fotograma,
            };
            sessionStorage.setItem(CLAVE_SESION, JSON.stringify(datos));
        } catch (err) {
            // sessionStorage no disponible (modo privado, cuota, etc.) —
            // se ignora sin interrumpir la partida.
        }
    }

    function borrarEstadoGuardado() {
        try {
            sessionStorage.removeItem(CLAVE_SESION);
        } catch (err) {
            // noop
        }
    }

    function cargarEstadoGuardado() {
        try {
            const datos = JSON.parse(sessionStorage.getItem(CLAVE_SESION));
            if (!datos) return false;
            estado.dificultad = datos.dificultad;
            estado.x = datos.x;
            estado.y = datos.y;
            estado.dx = datos.dx;
            estado.dy = datos.dy;
            estado.colorActual = datos.colorActual;
            estado.celdas = Int32Array.from(datos.celdas);
            estado.celdasPintadas = datos.celdasPintadas;
            estado.historialTrazos = datos.historialTrazos;
            estado.objetos = datos.objetos;
            estado.puntos = datos.puntos;
            estado.pigmentosRecogidos = datos.pigmentosRecogidos;
            estado.fotograma = datos.fotograma;
            estado.terminado = false;
            estado.jugando = true;
            estado.partidaIniciada = true;
            estado.pausado = true;
            return true;
        } catch (err) {
            return false;
        }
    }

    function aplicarChipDificultad(clave) {
        document.querySelectorAll('.je-chip-dificultad').forEach((b) => {
            const activo = b.dataset.dificultad === clave;
            b.classList.toggle('is-activo', activo);
            b.setAttribute('aria-checked', String(activo));
        });
    }

    // ── Objetos: pigmentos y aguarrás/agua ────────────────────────────

    function dibujarPigmento(p) {
        const cx = p.x * escalaX;
        const cy = p.y * escalaY;
        const r = RADIO_RECOGIDA * 0.62 * ((escalaX + escalaY) / 2);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]})`;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.lineWidth = Math.max(1.5, r * 0.18);
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
    }

    function dibujarDisolvente(o) {
        const cx = o.x * escalaX;
        const cy = o.y * escalaY;
        const r = RADIO_RECOGIDA * 0.62 * ((escalaX + escalaY) / 2);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#eef3f6';
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.lineWidth = Math.max(1.5, r * 0.18);
        ctx.strokeStyle = '#6b93a8';
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.font = Math.max(8, r * 1.3) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💧', cx, cy + r * 0.05);
        ctx.restore();
    }

    function aparecerObjeto() {
        if (estado.terminado || !estado.jugando || estado.pausado) return;
        const cfg = cfgDificultad();
        if (estado.objetos.length >= cfg.maxObjetos) return;

        let intentos = 0;
        let x, y;
        do {
            x = 8 + Math.random() * (GW - 16);
            y = 8 + Math.random() * (GH - 16);
            intentos++;
        } while (
            intentos < 12 &&
            (Math.hypot(x - estado.x, y - estado.y) < 16 || estado.celdas[idxCelda(x, y)] !== -1)
        );

        const esDisolvente = cfg.probabilidadDisolvente > 0 && Math.random() < cfg.probabilidadDisolvente;
        if (esDisolvente) {
            estado.objetos.push({ tipo: 'disolvente', x, y });
        } else {
            const pigmento = PIGMENTOS[Math.floor(Math.random() * PIGMENTOS.length)];
            estado.objetos.push({ tipo: 'pigmento', x, y, rgb: pigmento.rgb });
        }
        redibujarTodo();
    }

    function mezclarColor(actual, pigmento) {
        return [
            Math.round((actual[0] + pigmento[0]) / 2),
            Math.round((actual[1] + pigmento[1]) / 2),
            Math.round((actual[2] + pigmento[2]) / 2),
        ];
    }

    function recogerPigmento(o) {
        estado.colorActual = mezclarColor(estado.colorActual, o.rgb);
        estado.pigmentosRecogidos++;
        estado.puntos += 18;
        mostrarFlotante('+18', o.x, o.y, '#1b8f4c');
    }

    function recogerDisolvente(o) {
        const cantidadQuitar = Math.max(6, Math.round(estado.historialTrazos.length * 0.14));
        estado.historialTrazos.splice(-cantidadQuitar);
        recalcularCeldasDesdeHistorial();
        redibujarTodo();
        estado.puntos = Math.max(0, estado.puntos - 10);
        mostrarFlotante('−pintura', o.x, o.y, '#d91b1b');
    }

    function comprobarRecogida() {
        for (let i = estado.objetos.length - 1; i >= 0; i--) {
            const o = estado.objetos[i];
            if (Math.hypot(o.x - estado.x, o.y - estado.y) <= RADIO_RECOGIDA) {
                if (o.tipo === 'disolvente') recogerDisolvente(o);
                else recogerPigmento(o);
                estado.objetos.splice(i, 1);
                actualizarVista();
            }
        }
    }

    function mostrarFlotante(texto, x, y, color) {
        const el = document.createElement('span');
        el.className = 'je-flotante';
        el.textContent = texto;
        el.style.left = (x / GW * 100) + '%';
        el.style.top = (y / GH * 100) + '%';
        if (color) el.style.color = color;
        zona.appendChild(el);
        setTimeout(() => el.remove(), 650);
    }

    // ── Bucle principal ──────────────────────────────────────────────

    function frame() {
        if (estado.terminado || !estado.jugando || estado.pausado) return;
        estado.fotograma++;

        const cfg = cfgDificultad();
        const nx = estado.x + estado.dx * cfg.velocidad;
        const ny = estado.y + estado.dy * cfg.velocidad;

        if (nx < 1 || nx > GW - 1 || ny < 1 || ny > GH - 1) {
            finalizarPartida(false);
            return;
        }

        const idx = idxCelda(nx, ny);
        const marcaPrevia = estado.celdas[idx];
        if (marcaPrevia !== -1 && (estado.fotograma - marcaPrevia) > GRACIA_FRAMES) {
            finalizarPartida(false);
            return;
        }

        pintarSegmento(estado.x, estado.y, nx, ny, estado.colorActual);
        estado.historialTrazos.push({
            x1: estado.x, y1: estado.y, x2: nx, y2: ny,
            color: estado.colorActual.slice(), fotograma: estado.fotograma,
        });

        if (marcaPrevia === -1) estado.celdasPintadas++;
        estado.celdas[idx] = estado.fotograma;
        estado.puntos += 1;

        estado.x = nx;
        estado.y = ny;

        comprobarRecogida();

        const coberturaPct = (estado.celdasPintadas / (GW * GH)) * 100;
        if (coberturaPct >= cfg.objetivoCobertura) {
            finalizarPartida(true);
            return;
        }

        if (estado.fotograma % 6 === 0) actualizarVista();

        animacionId = requestAnimationFrame(frame);
    }

    // ── Vista / progreso ─────────────────────────────────────────────

    function actualizarVista() {
        const cfg = cfgDificultad();
        const coberturaPct = Math.min(100, Math.round((estado.celdasPintadas / (GW * GH)) * 100));
        const pct = Math.min(100, Math.round((coberturaPct / cfg.objetivoCobertura) * 100));

        document.getElementById('je-contador').textContent = `${coberturaPct}%/${cfg.objetivoCobertura}%`;
        document.getElementById('je-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('je-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('je-pigmentos').textContent = String(estado.pigmentosRecogidos);
        document.getElementById('je-puntos').textContent = String(estado.puntos);

        const muestra = document.getElementById('je-muestra-color');
        if (muestra) muestra.style.background = `rgb(${estado.colorActual.join(',')})`;
    }

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.je-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            aplicarChipDificultad(boton.dataset.dificultad);
            estado.dificultad = boton.dataset.dificultad;
            if (estado.partidaIniciada) empezarNueva();
        });
    });

    // ── Partida ──────────────────────────────────────────────────────

    function limpiarZonaVisual() {
        zona.querySelectorAll('.je-flotante').forEach((el) => el.remove());
    }

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('estela');
        if (animacionId) cancelAnimationFrame(animacionId);
        clearInterval(temporizadorPigmento);
        borrarEstadoGuardado();

        estado.x = GW / 2;
        estado.y = 10;
        estado.dx = 0;
        estado.dy = 1;
        estado.colorActual = COLOR_INICIAL.slice();
        estado.celdas = new Int32Array(GW * GH).fill(-1);
        estado.celdasPintadas = 0;
        estado.objetos = [];
        estado.historialTrazos = [];
        estado.puntos = 0;
        estado.pigmentosRecogidos = 0;
        estado.fotograma = 0;
        estado.terminado = false;
        estado.jugando = true;
        estado.pausado = false;
        estado.partidaIniciada = true;

        limpiarZonaVisual();
        document.getElementById('je-celebracion-overlay').hidden = true;
        document.getElementById('je-pista').style.display = '';
        mostrarIndicadorPausa(false);
        actualizarBotonJugarPausa();

        redimensionarCanvas();
        actualizarVista();

        temporizadorPigmento = setInterval(aparecerObjeto, cfgDificultad().intervaloPigmento);
        aparecerObjeto();
        animacionId = requestAnimationFrame(frame);
    }

    function finalizarPartida(completado) {
        if (estado.terminado) return;
        estado.terminado = true;
        estado.jugando = false;
        estado.pausado = false;
        if (animacionId) cancelAnimationFrame(animacionId);
        clearInterval(temporizadorPigmento);
        borrarEstadoGuardado();
        mostrarIndicadorPausa(false);
        actualizarBotonJugarPausa();

        const cfg = cfgDificultad();
        const coberturaPct = Math.min(100, Math.round((estado.celdasPintadas / (GW * GH)) * 100));

        document.getElementById('je-celebracion-titulo').textContent =
            completado ? '¡Lienzo cubierto! 🎨' : '¡Te has chocado!';
        document.getElementById('je-celebracion-stat').textContent =
            completado
                ? `Cubriste el ${coberturaPct}% del lienzo — ${estado.puntos} puntos, ${estado.pigmentosRecogidos} pigmentos`
                : `Cubriste el ${coberturaPct}%/${cfg.objetivoCobertura}% del lienzo — ${estado.puntos} puntos`;

        dibujarResultadoEnCanvas();
        document.getElementById('je-celebracion-overlay').hidden = false;
        if (completado) lanzarConfeti();
    }

    document.getElementById('je-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        empezarNueva();
    });
    document.getElementById('je-boton-jugar-de-nuevo').addEventListener('click', empezarNueva);

    // ── Pantalla de inicio: empezar o continuar ───────────────────────

    function mostrarInicioOverlay(mostrar) {
        document.getElementById('je-inicio-overlay').hidden = !mostrar;
    }

    function empezarNueva() {
        mostrarInicioOverlay(false);
        nuevaPartida();
    }

    function continuarGuardada() {
        if (!cargarEstadoGuardado()) {
            empezarNueva();
            return;
        }
        mostrarInicioOverlay(false);
        limpiarZonaVisual();
        document.getElementById('je-celebracion-overlay').hidden = true;
        document.getElementById('je-pista').style.display = '';
        aplicarChipDificultad(estado.dificultad);

        redimensionarCanvas();
        actualizarVista();
        actualizarBotonJugarPausa();
        mostrarIndicadorPausa(true);

        temporizadorPigmento = setInterval(aparecerObjeto, cfgDificultad().intervaloPigmento);
    }

    document.getElementById('je-boton-jugar').addEventListener('click', empezarNueva);
    document.getElementById('je-boton-continuar').addEventListener('click', continuarGuardada);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('je-confeti');
        contenedor.innerHTML = '';
        const colores = ['#d91b1b', '#1e4b8f', '#f0b300', '#1b8f4c', '#ffffff', '#7b2d8e'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'je-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a La Estela de Color de Orencio Matas y Hnos! 🎨';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvasR = document.getElementById('je-canvas-resultado');
        const w = 640, h = 360;
        canvasR.width = w;
        canvasR.height = h;
        const ctxR = canvasR.getContext('2d');
        const coberturaPct = Math.min(100, Math.round((estado.celdasPintadas / (GW * GH)) * 100));

        ctxR.fillStyle = '#f7f6f4';
        ctxR.fillRect(0, 0, w, h);
        ctxR.fillStyle = '#1a1a1a';
        ctxR.font = 'bold 26px sans-serif';
        ctxR.textAlign = 'center';
        ctxR.fillText('La Estela de Color 🎨', w / 2, 80);

        ctxR.font = 'bold 48px sans-serif';
        ctxR.fillStyle = `rgb(${estado.colorActual.join(',')})`;
        ctxR.fillText(coberturaPct + '% cubierto', w / 2, 170);

        ctxR.font = '20px sans-serif';
        ctxR.fillStyle = '#52555a';
        ctxR.fillText(`${estado.puntos} puntos — ${estado.pigmentosRecogidos} pigmentos — ${cfgDificultad().nombre}`, w / 2, 220);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvasR = document.getElementById('je-canvas-resultado');
        canvasR.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'la-estela-de-color.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'la-estela-de-color.png', { type: 'image/png' })],
                        title: 'La Estela de Color — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('je-compartir-overlay');
        const enlaceDescargar = document.getElementById('je-boton-descargar');
        const canvasR = document.getElementById('je-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvasR.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('je-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('je-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('je-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('je-boton-compartir').addEventListener('click', compartir);
    document.getElementById('je-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('je-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('je-compartir-overlay').hidden = true;
    });
    document.getElementById('je-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'je-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Arranque ─────────────────────────────────────────────────────
    // No se entra en partida automáticamente: se muestra la pantalla
    // de inicio con "Jugar" y, si hay una partida en pausa guardada
    // en esta sesión, también "Continuar".

    estado.celdas = new Int32Array(GW * GH).fill(-1);
    actualizarBotonJugarPausa();
    document.getElementById('je-boton-continuar').hidden = !hayPartidaGuardada();
    mostrarInicioOverlay(true);
})();
