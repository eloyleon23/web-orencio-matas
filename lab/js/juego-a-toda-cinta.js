/**
 * A Toda Cinta — minijuego (lab/a-toda-cinta.html)
 * Vanilla JS, sin dependencias. Productos cruzan una cinta
 * transportadora de 3 carriles de derecha a izquierda; hay que tocar
 * solo el producto objetivo (indicado arriba, cambia cada pocos
 * aciertos) antes de que llegue al final de la cinta, e ignorar el
 * resto. Tocar uno equivocado o dejar pasar el objetivo corta la
 * racha.
 */
(function () {
    'use strict';

    // ── Productos ────────────────────────────────────────────────────

    const PRODUCTOS = [
        { icono: '🧴', nombre: 'Champú' },
        { icono: '🧼', nombre: 'Jabón' },
        { icono: '🧽', nombre: 'Bayeta' },
        { icono: '🪣', nombre: 'Friegasuelos' },
        { icono: '🎨', nombre: 'Pintura' },
        { icono: '🖌️', nombre: 'Brocha' },
        { icono: '🌸', nombre: 'Colonia' },
        { icono: '🧺', nombre: 'Detergente' },
    ];

    // ── Dificultad ───────────────────────────────────────────────────
    // tipos: cuántos productos del catálogo están en juego (más tipos,
    // más distracción). intervaloAparicion/duracionCruce: ritmo y
    // velocidad de la cinta. objetivoCada: aciertos antes de cambiar
    // de objetivo.
    const DIFICULTADES = {
        facil: {
            nombre: 'Fácil', tiempoTotal: 60, tipos: 4, maxSimultaneos: 3,
            intervaloAparicion: 1100, duracionCruceMin: 3600, duracionCruceMax: 4600,
            objetivoCada: 4,
        },
        medio: {
            nombre: 'Medio', tiempoTotal: 60, tipos: 6, maxSimultaneos: 4,
            intervaloAparicion: 850, duracionCruceMin: 2600, duracionCruceMax: 3600,
            objetivoCada: 5,
        },
        dificil: {
            nombre: 'Difícil', tiempoTotal: 65, tipos: 8, maxSimultaneos: 5,
            intervaloAparicion: 650, duracionCruceMin: 1800, duracionCruceMax: 2600,
            objetivoCada: 6,
        },
    };

    const INTERVALO_HITO_PUNTOS = 100;

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        dificultad: 'medio',
        cruzando: [],
        carrilOcupado: [false, false, false],
        puntos: 0,
        combo: 0,
        mejorCombo: 0,
        aciertos: 0,
        objetivoIdx: 0,
        tiempoRestante: 0,
        tiempoTotal: 0,
        siguienteHitoPuntos: INTERVALO_HITO_PUNTOS,
        terminado: false,
    };

    let temporizadorTurno = null;
    let temporizadorAparicion = null;
    const zona = document.getElementById('jk-zona');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    // ── Objetivo ─────────────────────────────────────────────────────

    function elegirNuevoObjetivo(anunciar) {
        const cfg = cfgDificultad();
        let nuevo = estado.objetivoIdx;
        if (cfg.tipos > 1) {
            while (nuevo === estado.objetivoIdx) {
                nuevo = Math.floor(Math.random() * cfg.tipos);
            }
        } else {
            nuevo = 0;
        }
        estado.objetivoIdx = nuevo;
        const producto = PRODUCTOS[nuevo];
        document.getElementById('jk-objetivo-icono').textContent = producto.icono;
        document.getElementById('jk-objetivo-nombre').textContent = producto.nombre;

        const objetivoEl = document.querySelector('.jk-objetivo');
        objetivoEl.classList.remove('jk-objetivo--cambiado');
        void objetivoEl.offsetWidth;
        objetivoEl.classList.add('jk-objetivo--cambiado');

        if (anunciar) mostrarLogro('¡Nuevo objetivo: ' + producto.nombre + '!');
    }

    // ── Aparición y cruce ────────────────────────────────────────────

    function carrilesLibres() {
        const libres = [];
        for (let c = 0; c < 3; c++) {
            if (!estado.carrilOcupado[c]) libres.push(c);
        }
        return libres;
    }

    function aparecerProducto() {
        if (estado.terminado) return;
        if (estado.cruzando.length >= cfgDificultad().maxSimultaneos) return;

        const libres = carrilesLibres();
        if (libres.length === 0) return;

        const cfg = cfgDificultad();
        const carril = libres[Math.floor(Math.random() * libres.length)];
        const tipoIdx = Math.floor(Math.random() * cfg.tipos);
        const producto = PRODUCTOS[tipoIdx];
        const duracion = cfg.duracionCruceMin + Math.random() * (cfg.duracionCruceMax - cfg.duracionCruceMin);
        const topPct = (carril + 0.5) * (100 / 3);

        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'jk-producto';
        el.setAttribute('aria-label', producto.nombre);
        el.style.top = topPct + '%';
        el.style.left = '104%';
        el.innerHTML = `<span aria-hidden="true">${producto.icono}</span>`;
        zona.appendChild(el);

        requestAnimationFrame(() => {
            el.style.transition = `left ${duracion}ms linear`;
            el.style.left = '-8%';
        });

        estado.carrilOcupado[carril] = true;
        setTimeout(() => { estado.carrilOcupado[carril] = false; }, duracion * 0.55);

        const entrada = { el, tipoIdx, carril };
        estado.cruzando.push(entrada);
        entrada.temporizador = setTimeout(() => cruceCompletado(entrada), duracion);

        el.addEventListener('pointerdown', (ev) => {
            ev.stopPropagation();
            tocarProducto(entrada);
        });
    }

    function quitarEntrada(entrada) {
        clearTimeout(entrada.temporizador);
        estado.cruzando = estado.cruzando.filter((e) => e !== entrada);
    }

    // El producto llega al final de la cinta sin que lo hayan tocado.
    function cruceCompletado(entrada) {
        quitarEntrada(entrada);
        if (entrada.tipoIdx === estado.objetivoIdx) {
            estado.combo = 0;
            actualizarVista();
        }
        entrada.el.remove();
    }

    function posicionActual(el) {
        const rect = el.getBoundingClientRect();
        const zonaRect = zona.getBoundingClientRect();
        return {
            xPct: zonaRect.width ? ((rect.left + rect.width / 2 - zonaRect.left) / zonaRect.width) * 100 : 50,
            yPct: zonaRect.height ? ((rect.top + rect.height / 2 - zonaRect.top) / zonaRect.height) * 100 : 50,
        };
    }

    function tocarProducto(entrada) {
        if (estado.terminado) return;
        if (!estado.cruzando.includes(entrada)) return;

        const pos = posicionActual(entrada.el);
        quitarEntrada(entrada);

        // Congela el producto en su posición actual antes de animar el
        // acierto/fallo, para que no siga desplazándose mientras se
        // desvanece.
        entrada.el.style.transition = 'none';
        entrada.el.style.left = pos.xPct + '%';
        void entrada.el.offsetWidth;

        if (entrada.tipoIdx === estado.objetivoIdx) {
            acertar(entrada, pos);
        } else {
            fallar(entrada, pos);
        }

        setTimeout(() => entrada.el.remove(), 320);
    }

    function acertar(entrada, pos) {
        estado.combo++;
        estado.mejorCombo = Math.max(estado.mejorCombo, estado.combo);
        const ganancia = 10 + Math.floor(estado.combo / 3) * 2;
        estado.puntos += ganancia;
        estado.aciertos++;

        entrada.el.classList.add('jk-producto--acierto');
        mostrarFlotante('+' + ganancia, 'jk-flotante--bien', pos);
        actualizarVista();
        comprobarHitoPuntos();

        if (estado.aciertos % cfgDificultad().objetivoCada === 0) {
            elegirNuevoObjetivo(true);
        }
    }

    function fallar(entrada, pos) {
        estado.combo = 0;
        estado.puntos = Math.max(0, estado.puntos - 5);

        entrada.el.classList.add('jk-producto--fallo');
        mostrarFlotante('−5', 'jk-flotante--mal', pos);
        actualizarVista();
    }

    function mostrarFlotante(texto, clase, pos) {
        const el = document.createElement('span');
        el.className = 'jk-flotante ' + clase;
        el.textContent = texto;
        el.style.left = pos.xPct + '%';
        el.style.top = pos.yPct + '%';
        zona.appendChild(el);
        setTimeout(() => el.remove(), 650);
    }

    // ── Hitos / logros (toast) ──────────────────────────────────────

    let temporizadorLogro = null;
    function mostrarLogro(texto) {
        const el = document.getElementById('jk-logro');
        el.textContent = texto;
        el.hidden = false;
        el.classList.remove('jk-logro--mostrar');
        void el.offsetWidth;
        el.classList.add('jk-logro--mostrar');
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
        document.getElementById('jk-puntos').textContent = String(estado.puntos);
        document.getElementById('jk-mejor-combo').textContent = 'x' + Math.max(1, estado.mejorCombo);
        document.getElementById('jk-tiempo').textContent = formatoTiempo(estado.tiempoRestante);
        const pct = estado.tiempoTotal > 0 ? Math.max(0, Math.round((estado.tiempoRestante / estado.tiempoTotal) * 100)) : 0;
        document.getElementById('jk-barra-tiempo-relleno').style.width = pct + '%';
        document.getElementById('jk-barra-tiempo').setAttribute('aria-valuenow', String(pct));
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
            finalizarPartida();
        }
    }

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.jk-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jk-chip-dificultad').forEach((b) => {
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
        estado.cruzando.forEach((e) => clearTimeout(e.temporizador));
        estado.cruzando = [];
        estado.carrilOcupado = [false, false, false];
        zona.querySelectorAll('.jk-producto, .jk-flotante').forEach((el) => el.remove());
    }

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('a-toda-cinta');
        clearInterval(temporizadorTurno);
        clearInterval(temporizadorAparicion);
        limpiarZona();

        const cfg = cfgDificultad();
        estado.puntos = 0;
        estado.combo = 0;
        estado.mejorCombo = 0;
        estado.aciertos = 0;
        estado.objetivoIdx = -1;
        estado.tiempoRestante = cfg.tiempoTotal;
        estado.tiempoTotal = cfg.tiempoTotal;
        estado.siguienteHitoPuntos = INTERVALO_HITO_PUNTOS;
        estado.terminado = false;

        elegirNuevoObjetivo(false);
        document.getElementById('jk-celebracion-overlay').hidden = true;

        actualizarVista();
        temporizadorTurno = setInterval(tick, 1000);
        temporizadorAparicion = setInterval(aparecerProducto, cfg.intervaloAparicion);
    }

    function mensajeFinal(puntos) {
        if (puntos >= 300) return { titulo: '¡Reflejos de profesional! 🏆', confeti: true };
        if (puntos >= 150) return { titulo: '¡Muy buena racha! 🎉', confeti: true };
        if (puntos >= 60) return { titulo: '¡Buen ritmo! 🏃', confeti: false };
        return { titulo: '¡Se acabó el tiempo!', confeti: false };
    }

    function finalizarPartida() {
        if (estado.terminado) return;
        estado.terminado = true;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarFinPartida('a-toda-cinta');
        clearInterval(temporizadorTurno);
        clearInterval(temporizadorAparicion);
        limpiarZona();

        const resultado = mensajeFinal(estado.puntos);
        document.getElementById('jk-celebracion-titulo').textContent = resultado.titulo;
        document.getElementById('jk-celebracion-stat').textContent =
            `${estado.puntos} puntos — mejor racha x${Math.max(1, estado.mejorCombo)} — ${cfgDificultad().nombre}`;

        dibujarResultadoEnCanvas();
        document.getElementById('jk-celebracion-overlay').hidden = false;
        if (resultado.confeti) lanzarConfeti();
    }

    document.getElementById('jk-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        nuevaPartida();
    });
    document.getElementById('jk-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jk-confeti');
        contenedor.innerHTML = '';
        const colores = ['#e4392c', '#f0932b', '#f6c445', '#2f9e6e', '#ffffff', '#2b7fd9'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jk-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a A Toda Cinta de Orencio Matas y Hnos! 🏃';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jk-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const cfg = cfgDificultad();

        ctx.fillStyle = '#f4f6fa';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('A Toda Cinta 🏃', w / 2, 80);

        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#2b7fd9';
        ctx.fillText(String(estado.puntos) + ' pts', w / 2, 170);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`Mejor racha x${Math.max(1, estado.mejorCombo)} — ${cfg.nombre}`, w / 2, 220);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jk-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'a-toda-cinta.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'a-toda-cinta.png', { type: 'image/png' })],
                        title: 'A Toda Cinta — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jk-compartir-overlay');
        const enlaceDescargar = document.getElementById('jk-boton-descargar');
        const canvas = document.getElementById('jk-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jk-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jk-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jk-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jk-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jk-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jk-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jk-compartir-overlay').hidden = true;
    });
    document.getElementById('jk-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jk-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Marcas / proveedores aleatorios ───────────────────────────────

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
        const cont = document.getElementById('jk-proveedores-grid');
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
