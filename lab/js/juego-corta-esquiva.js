/**
 * Corta y Esquiva — minijuego (lab/corta-esquiva.html)
 * Vanilla JS, sin dependencias. Slice/swipe estilo Fruit Ninja: los
 * productos salen disparados desde abajo describiendo un arco (física
 * real: velocidad inicial + gravedad) y hay que deslizar el dedo para
 * cortar los buenos antes de que vuelvan a caer, esquivando los
 * caducados/estropeados. A diferencia del resto de la suite (toda a
 * contrarreloj), aquí el límite son las VIDAS: se pierde una por cada
 * producto bueno que se cae sin cortar o por cada malo que se corta
 * por error. La partida también se puede ganar llegando al objetivo
 * de cortes antes de quedarse sin vidas.
 */
(function () {
    'use strict';

    const VIDAS_INICIALES = 3;

    // Física en % del alto de la zona por segundo (no en px): así no
    // hay que retocar nada según el tamaño real de pantalla — ver
    // medirFisica()/objetivo de diseño documentado en el PR. Cada
    // dificultad define cuánto dura el vuelo (duracionVuelo, en ms,
    // de abajo a abajo) y cuánto sube (subida, en % del alto) — de
    // ahí se derivan gravedad y velocidad inicial reales.
    const DIFICULTADES = {
        facil: {
            nombre: 'Fácil', objetivo: 20, vidasExtra: 0,
            intervaloAparicion: 1100, maxSimultaneos: 2,
            duracionVueloMin: 1900, duracionVueloMax: 2300, subida: 78,
            probabilidadMalo: 0.18,
        },
        medio: {
            nombre: 'Medio', objetivo: 28, vidasExtra: 0,
            intervaloAparicion: 850, maxSimultaneos: 3,
            duracionVueloMin: 1500, duracionVueloMax: 1800, subida: 72,
            probabilidadMalo: 0.26,
        },
        dificil: {
            nombre: 'Difícil', objetivo: 36, vidasExtra: 0,
            intervaloAparicion: 650, maxSimultaneos: 4,
            duracionVueloMin: 1150, duracionVueloMax: 1400, subida: 65,
            probabilidadMalo: 0.34,
        },
    };

    const ITEMS_BUENOS = [
        { icono: '📦', nombre: 'Caja' },
        { icono: '🧴', nombre: 'Frasco' },
        { icono: '🎨', nombre: 'Bote de pintura' },
        { icono: '🧽', nombre: 'Esponja' },
        { icono: '🪣', nombre: 'Cubo' },
    ];
    const ITEMS_MALOS = [
        { icono: '💨', nombre: 'Humo' },
        { icono: '🗑️', nombre: 'Caducado' },
        { icono: '🦨', nombre: 'Estropeado' },
        { icono: '🪰', nombre: 'Mosca' },
    ];

    const RADIO_CORTE_PX = 32; // margen de acierto alrededor del centro del producto (ítem de 50px)

    const estado = {
        dificultad: 'medio',
        cayendo: [], // { el, xPct, yPct, vxPct, vyPctPorSeg, gravedadPct, esMalo, cortado }
        vidas: VIDAS_INICIALES,
        cortes: 0,
        puntos: 0,
        combo: 0,
        comboMaximo: 0,
        tiempoInicio: 0,
        terminado: false,
        jugando: false,
        cortando: false,
        ultimoPunto: null,
    };

    let temporizadorTurno = null;
    let temporizadorAparicion = null;
    let idAnimacion = null;
    const zona = document.getElementById('jr-zona');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    function mezclar(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // ── Aparición y física del arco ──────────────────────────────────
    // vyPct (negativa = subiendo) decrece por la gravedad cada frame;
    // la posición en % se integra directamente — ver animar().

    function aparecerItem() {
        if (estado.terminado) return;
        if (estado.cayendo.length >= cfgDificultad().maxSimultaneos) return;

        const cfg = cfgDificultad();
        const esMalo = Math.random() < cfg.probabilidadMalo;
        const lista = esMalo ? ITEMS_MALOS : ITEMS_BUENOS;
        const item = mezclar(lista);

        const duracionVuelo = (cfg.duracionVueloMin + Math.random() * (cfg.duracionVueloMax - cfg.duracionVueloMin)) / 1000; // segundos
        const subida = cfg.subida * (0.85 + Math.random() * 0.3); // variación orgánica
        // Cinemática de un tiro parabólico simétrico (sube y baja a la
        // misma altura): T = 2*v0/g, subida = v0²/(2g) → v0 = g*T/2 y,
        // sustituyendo, g = 8*subida/T².
        const gravedadPct = (8 * subida) / (duracionVuelo * duracionVuelo); // %/s²
        const vyPctPorSeg = -(gravedadPct * duracionVuelo) / 2; // negativa = subiendo
        const xPct = 10 + Math.random() * 80;
        const vxPctPorSeg = (Math.random() - 0.5) * 18; // ligera deriva horizontal

        const el = document.createElement('div');
        el.className = 'jr-item' + (esMalo ? ' jr-item--malo' : '');
        el.innerHTML = `<span aria-hidden="true">${item.icono}</span>`;
        el.title = item.nombre;
        zona.appendChild(el);

        const entrada = {
            el, xPct, yPct: 98, vxPctPorSeg, vyPctPorSeg, gravedadPct,
            esMalo, cortado: false, nacimiento: performance.now(),
        };
        estado.cayendo.push(entrada);
        posicionarItem(entrada);
    }

    function posicionarItem(entrada) {
        entrada.el.style.left = entrada.xPct + '%';
        entrada.el.style.top = entrada.yPct + '%';
    }

    function quitarEntrada(entrada) {
        estado.cayendo = estado.cayendo.filter((e) => e !== entrada);
        entrada.el.remove();
    }

    // ── Bucle de animación (física + comprobación de salida de zona) ──

    let ultimoFrame = null;
    function animar(ahora) {
        if (ultimoFrame === null) ultimoFrame = ahora;
        const dt = Math.min(0.05, (ahora - ultimoFrame) / 1000); // tope de 50ms por frame (pestaña en segundo plano, etc.)
        ultimoFrame = ahora;

        if (estado.jugando && !estado.terminado) {
            // Copia porque quitarEntrada muta estado.cayendo mientras se recorre
            estado.cayendo.slice().forEach((entrada) => {
                if (entrada.cortado) return;
                entrada.vyPctPorSeg += entrada.gravedadPct * dt;
                entrada.xPct += entrada.vxPctPorSeg * dt;
                entrada.yPct += entrada.vyPctPorSeg * dt;
                posicionarItem(entrada);

                if (entrada.yPct > 108) {
                    // Ha caído de nuevo fuera de la zona sin cortarse.
                    if (!entrada.esMalo) fallarBueno();
                    quitarEntrada(entrada);
                }
            });
        }

        idAnimacion = requestAnimationFrame(animar);
    }

    // ── Corte (deslizar el dedo/ratón) ──────────────────────────────

    function distanciaPuntoSegmento(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const largo2 = dx * dx + dy * dy;
        let t = largo2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / largo2;
        t = Math.max(0, Math.min(1, t));
        const cx = ax + t * dx, cy = ay + t * dy;
        return Math.hypot(px - cx, py - cy);
    }

    function crearPuntoRastro(x, y) {
        const punto = document.createElement('div');
        punto.className = 'jr-rastro-punto';
        punto.style.left = x + 'px';
        punto.style.top = y + 'px';
        zona.appendChild(punto);
        setTimeout(() => punto.remove(), 350);
    }

    function comprobarCorte(ax, ay, bx, by) {
        if (!estado.jugando || estado.terminado) return;
        const rect = zona.getBoundingClientRect();
        estado.cayendo.slice().forEach((entrada) => {
            if (entrada.cortado) return;
            const cx = rect.left + (entrada.xPct / 100) * rect.width;
            const cy = rect.top + (entrada.yPct / 100) * rect.height;
            if (distanciaPuntoSegmento(cx, cy, ax, ay, bx, by) <= RADIO_CORTE_PX) {
                cortarEntrada(entrada);
            }
        });
    }

    function cortarEntrada(entrada) {
        entrada.cortado = true;
        entrada.el.classList.add('jr-item--cortado');
        const elEliminar = entrada.el;
        setTimeout(() => elEliminar.remove(), 220);
        estado.cayendo = estado.cayendo.filter((e) => e !== entrada);

        if (entrada.esMalo) cortarMalo(entrada);
        else cortarBueno(entrada);
    }

    function posicionFlotante(xPct, yPct) {
        const rect = zona.getBoundingClientRect();
        return { x: (xPct / 100) * rect.width, y: (yPct / 100) * rect.height };
    }

    function mostrarFlotante(texto, clase, xPct, yPct) {
        const { x, y } = posicionFlotante(xPct, yPct);
        const el = document.createElement('span');
        el.className = 'jr-flotante ' + clase;
        el.textContent = texto;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        zona.appendChild(el);
        setTimeout(() => el.remove(), 650);
    }

    function cortarBueno(entrada) {
        estado.cortes++;
        estado.combo++;
        estado.comboMaximo = Math.max(estado.comboMaximo, estado.combo);
        const ganancia = 10 + Math.floor(estado.combo / 3) * 2;
        estado.puntos += ganancia;
        mostrarFlotante('+' + ganancia, 'jr-flotante--bien', entrada.xPct, entrada.yPct);
        actualizarVista();
        comprobarVictoria();
    }

    function cortarMalo(entrada) {
        estado.combo = 0;
        estado.puntos = Math.max(0, estado.puntos - 6);
        mostrarFlotante('−1 vida', 'jr-flotante--mal', entrada.xPct, entrada.yPct);
        perderVida();
    }

    function fallarBueno() {
        estado.combo = 0;
        perderVida();
    }

    function perderVida() {
        if (estado.terminado) return;
        estado.vidas--;
        destellarZona();
        actualizarVista();
        if (estado.vidas <= 0) {
            finalizarPartida(false);
        }
    }

    function destellarZona() {
        zona.classList.remove('jr-zona--golpe');
        void zona.offsetWidth;
        zona.classList.add('jr-zona--golpe');
    }

    // ── Entrada de puntero (deslizar) ────────────────────────────────

    function puntoDeEvento(ev) {
        return { x: ev.clientX, y: ev.clientY };
    }

    zona.addEventListener('pointerdown', (ev) => {
        if (!estado.jugando || estado.terminado) return;
        estado.cortando = true;
        estado.ultimoPunto = puntoDeEvento(ev);
        const { x, y } = estado.ultimoPunto;
        crearPuntoRastro(x - zona.getBoundingClientRect().left, y - zona.getBoundingClientRect().top);
        comprobarCorte(x, y, x, y);
    });

    zona.addEventListener('pointermove', (ev) => {
        if (!estado.cortando || !estado.ultimoPunto) return;
        const actual = puntoDeEvento(ev);
        comprobarCorte(estado.ultimoPunto.x, estado.ultimoPunto.y, actual.x, actual.y);
        const rect = zona.getBoundingClientRect();
        crearPuntoRastro(actual.x - rect.left, actual.y - rect.top);
        estado.ultimoPunto = actual;
    });

    function terminarGesto() {
        estado.cortando = false;
        estado.ultimoPunto = null;
    }
    zona.addEventListener('pointerup', terminarGesto);
    zona.addEventListener('pointercancel', terminarGesto);
    zona.addEventListener('pointerleave', terminarGesto);

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.jr-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jr-chip-dificultad').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.dificultad = boton.dataset.dificultad;
            nuevaPartida();
        });
    });

    // ── Vista ────────────────────────────────────────────────────────

    function actualizarVidasVista() {
        const spans = document.querySelectorAll('#jr-vidas span');
        spans.forEach((span, i) => {
            span.classList.toggle('jr-vida--perdida', i >= estado.vidas);
        });
        document.getElementById('jr-vidas').setAttribute('aria-label', estado.vidas + ' vidas restantes');
    }

    function actualizarVista() {
        const cfg = cfgDificultad();
        const pct = Math.min(100, Math.round((estado.cortes / cfg.objetivo) * 100));
        document.getElementById('jr-contador').textContent = `${estado.cortes}/${cfg.objetivo}`;
        document.getElementById('jr-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jr-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('jr-puntos').textContent = String(estado.puntos);
        document.getElementById('jr-combo').textContent = estado.combo > 1 ? 'x' + estado.combo : '—';
        actualizarVidasVista();
    }

    function comprobarVictoria() {
        if (estado.cortes >= cfgDificultad().objetivo) {
            finalizarPartida(true);
        }
    }

    // ── Partida ──────────────────────────────────────────────────────

    function limpiarZona() {
        estado.cayendo.forEach((entrada) => entrada.el.remove());
        estado.cayendo = [];
        zona.querySelectorAll('.jr-rastro-punto, .jr-flotante').forEach((el) => el.remove());
    }

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('corta-esquiva');

        clearInterval(temporizadorAparicion);
        limpiarZona();

        estado.vidas = VIDAS_INICIALES;
        estado.cortes = 0;
        estado.puntos = 0;
        estado.combo = 0;
        estado.comboMaximo = 0;
        estado.terminado = false;
        estado.jugando = true;
        estado.cortando = false;
        estado.ultimoPunto = null;

        document.getElementById('jr-celebracion-overlay').hidden = true;
        document.getElementById('jr-pista').style.display = '';

        actualizarVista();
        temporizadorAparicion = setInterval(aparecerItem, cfgDificultad().intervaloAparicion);

        if (idAnimacion === null) {
            ultimoFrame = null;
            idAnimacion = requestAnimationFrame(animar);
        }
    }

    function mensajeFinal(gano, puntos) {
        if (gano && puntos >= 500) return { titulo: '¡Corte perfecto! 🏆', celebrar: true };
        if (gano) return { titulo: '¡Objetivo conseguido! 🎉', celebrar: true };
        return { titulo: '¡Sin vidas! Casi lo tienes', celebrar: false };
    }

    function finalizarPartida(gano) {
        if (estado.terminado) return;
        estado.terminado = true;
        estado.jugando = false;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarFinPartida('corta-esquiva');
        clearInterval(temporizadorAparicion);
        limpiarZona();

        const resultado = mensajeFinal(gano, estado.puntos);
        document.getElementById('jr-celebracion-titulo').textContent = resultado.titulo;
        document.getElementById('jr-celebracion-stat').textContent =
            `${estado.puntos} puntos — ${estado.cortes}/${cfgDificultad().objetivo} cortes — combo máximo x${estado.comboMaximo} — ${cfgDificultad().nombre}`;
        if (window.OMMejoresResultados) {
            window.OMMejoresResultados.registrar('corta-esquiva', { valor: estado.puntos, texto: estado.puntos + ' puntos' });
        }

        dibujarResultadoEnCanvas();
        document.getElementById('jr-celebracion-overlay').hidden = false;
        if (resultado.celebrar) lanzarConfeti();
    }

    document.getElementById('jr-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        nuevaPartida();
    });
    document.getElementById('jr-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jr-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jr-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Corta y Esquiva de Orencio Matas y Hnos! 🔪';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jr-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Corta y Esquiva 🔪', w / 2, 90);

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(String(estado.puntos), w / 2, 190);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`puntos — combo máximo x${estado.comboMaximo} — ${cfgDificultad().nombre}`, w / 2, 240);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jr-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'corta-y-esquiva.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'corta-y-esquiva.png', { type: 'image/png' })],
                        title: 'Corta y Esquiva — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jr-compartir-overlay');
        const enlaceDescargar = document.getElementById('jr-boton-descargar');
        const canvas = document.getElementById('jr-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jr-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jr-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jr-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jr-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jr-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jr-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jr-compartir-overlay').hidden = true;
    });
    document.getElementById('jr-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jr-compartir-overlay') ev.currentTarget.hidden = true;
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
        const cont = document.getElementById('jr-proveedores-grid');
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

    // ── Arranque ─────────────────────────────────────────────────────

    pintarMarcasAleatorias();
    nuevaPartida();
})();
