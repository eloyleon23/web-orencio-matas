/**
 * Clasifica por Pasillos — minijuego (lab/clasifica.html)
 * Vanilla JS, sin dependencias. Caen productos desde arriba y hay que
 * tocar a qué área pertenecen (droguería, perfumería, pinturas o
 * talleres) antes de que lleguen abajo. El carril por el que cae cada
 * producto es aleatorio y no indica su área — hay que leer el icono y
 * el nombre y decidir, no basta con "tocar por donde cae".
 */
(function () {
    'use strict';

    // ── Catálogo de productos (ficticio, sin red) ───────────────────────
    const AREAS = {
        drogueria: { nombre: 'Droguería', icono: '🧽' },
        perfumeria: { nombre: 'Perfumería', icono: '🌸' },
        pinturas: { nombre: 'Pinturas', icono: '🎨' },
        talleres: { nombre: 'Talleres', icono: '🚗' },
    };

    const PRODUCTOS = [
        { icono: '🧺', nombre: 'Detergente', area: 'drogueria' },
        { icono: '🧪', nombre: 'Lejía', area: 'drogueria' },
        { icono: '🪣', nombre: 'Friegasuelos', area: 'drogueria' },
        { icono: '🐜', nombre: 'Insecticida', area: 'drogueria' },
        { icono: '🌸', nombre: 'Colonia', area: 'perfumeria' },
        { icono: '🧴', nombre: 'Champú', area: 'perfumeria' },
        { icono: '🧼', nombre: 'Jabón de manos', area: 'perfumeria' },
        { icono: '💄', nombre: 'Maquillaje', area: 'perfumeria' },
        { icono: '🎨', nombre: 'Pintura de pared', area: 'pinturas' },
        { icono: '🖌️', nombre: 'Brocha', area: 'pinturas' },
        { icono: '🧻', nombre: 'Rodillo', area: 'pinturas' },
        { icono: '🪵', nombre: 'Barniz', area: 'pinturas' },
        { icono: '🟫', nombre: 'Lija', area: 'talleres' },
        { icono: '🫧', nombre: 'Pulimento', area: 'talleres' },
        { icono: '🧱', nombre: 'Masilla', area: 'talleres' },
        { icono: '🛢️', nombre: 'Imprimación', area: 'talleres' },
    ];

    // ── Dificultad ───────────────────────────────────────────────────
    // objetivo: aciertos para ganar la partida antes de tiempo.
    // duracionCaidaMin/Max: ms que tarda un producto en llegar abajo.
    // intervaloAparicion: ms entre apariciones. maxSimultaneos: cuántos
    // productos puede haber cayendo a la vez.
    const DIFICULTADES = {
        facil: {
            nombre: 'Fácil', tiempoTotal: 60, objetivo: 12, maxSimultaneos: 2,
            intervaloAparicion: 1700, duracionCaidaMin: 3400, duracionCaidaMax: 4300,
        },
        medio: {
            nombre: 'Medio', tiempoTotal: 65, objetivo: 18, maxSimultaneos: 3,
            intervaloAparicion: 1150, duracionCaidaMin: 2400, duracionCaidaMax: 3200,
        },
        dificil: {
            nombre: 'Difícil', tiempoTotal: 70, objetivo: 26, maxSimultaneos: 5,
            intervaloAparicion: 800, duracionCaidaMin: 1600, duracionCaidaMax: 2300,
        },
    };

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        dificultad: 'medio',
        cayendo: [],
        capturados: 0,
        fallados: 0,
        puntos: 0,
        combo: 0,
        comboMaximo: 0,
        tiempoRestante: 0,
        terminado: false,
    };

    let temporizadorTurno = null;
    let temporizadorAparicion = null;
    const zona = document.getElementById('jf-zona');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    // ── Aparición y caída ────────────────────────────────────────────

    function aparecerProducto() {
        if (estado.terminado) return;
        if (estado.cayendo.length >= cfgDificultad().maxSimultaneos) return;

        const producto = PRODUCTOS[Math.floor(Math.random() * PRODUCTOS.length)];
        const cfg = cfgDificultad();
        const duracion = cfg.duracionCaidaMin + Math.random() * (cfg.duracionCaidaMax - cfg.duracionCaidaMin);

        const el = document.createElement('div');
        el.className = 'jf-producto';
        el.style.left = (5 + Math.random() * 80) + '%';
        el.innerHTML = `<span class="jf-producto__icono" aria-hidden="true">${producto.icono}</span><span class="jf-producto__nombre">${producto.nombre}</span>`;
        zona.appendChild(el);

        const entrada = { el, producto, atrapado: false };
        estado.cayendo.push(entrada);

        requestAnimationFrame(() => {
            el.style.transition = `top ${duracion}ms linear`;
            el.style.top = '100%';
        });

        entrada.temporizador = setTimeout(() => {
            if (entrada.atrapado) return;
            perderProducto(entrada);
        }, duracion);
    }

    function quitarEntrada(entrada) {
        clearTimeout(entrada.temporizador);
        estado.cayendo = estado.cayendo.filter((e) => e !== entrada);
        entrada.el.remove();
    }

    function perderProducto(entrada) {
        quitarEntrada(entrada);
        estado.fallados++;
        estado.combo = 0;
        actualizarVista();
    }

    // ── Cesta (tocar área) ───────────────────────────────────────────

    function tocarArea(area, boton) {
        if (estado.terminado) return;
        const entrada = estado.cayendo.find((e) => e.producto.area === area && !e.atrapado);

        if (!entrada) {
            flashBoton(boton, 'jf-area--fallo');
            estado.combo = 0;
            actualizarVista();
            return;
        }

        entrada.atrapado = true;
        quitarEntrada(entrada);
        flashBoton(boton, 'jf-area--acierto');

        estado.capturados++;
        estado.combo++;
        estado.comboMaximo = Math.max(estado.comboMaximo, estado.combo);
        estado.puntos += 10 + Math.floor(estado.combo / 3) * 2;
        actualizarVista();
        comprobarVictoria();
    }

    function flashBoton(boton, clase) {
        boton.classList.remove('jf-area--acierto', 'jf-area--fallo');
        void boton.offsetWidth;
        boton.classList.add(clase);
        setTimeout(() => boton.classList.remove(clase), 280);
    }

    document.querySelectorAll('.jf-area').forEach((boton) => {
        boton.addEventListener('click', () => tocarArea(boton.dataset.area, boton));
    });

    // ── Vista / progreso ─────────────────────────────────────────────

    function actualizarVista() {
        const cfg = cfgDificultad();
        const pct = Math.min(100, Math.round((estado.capturados / cfg.objetivo) * 100));

        document.getElementById('jf-contador').textContent = `${estado.capturados}/${cfg.objetivo}`;
        document.getElementById('jf-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jf-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('jf-tiempo').textContent = formatoTiempo(estado.tiempoRestante);
        document.getElementById('jf-puntos').textContent = String(estado.puntos);
        document.getElementById('jf-combo').textContent = estado.combo > 1 ? `x${estado.combo}` : '—';
    }

    function formatoTiempo(s) {
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r < 10 ? '0' : ''}${r}`;
    }

    function comprobarVictoria() {
        if (estado.capturados >= cfgDificultad().objetivo) {
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

    document.querySelectorAll('.jf-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jf-chip-dificultad').forEach((b) => {
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
        zona.innerHTML = '';
    }

    function nuevaPartida() {
        clearInterval(temporizadorTurno);
        clearInterval(temporizadorAparicion);
        limpiarZona();

        estado.capturados = 0;
        estado.fallados = 0;
        estado.puntos = 0;
        estado.combo = 0;
        estado.comboMaximo = 0;
        estado.tiempoRestante = cfgDificultad().tiempoTotal;
        estado.terminado = false;

        document.getElementById('jf-celebracion-overlay').hidden = true;
        document.getElementById('jf-pista').style.display = '';

        actualizarVista();
        temporizadorTurno = setInterval(tick, 1000);
        temporizadorAparicion = setInterval(aparecerProducto, cfgDificultad().intervaloAparicion);
    }

    function finalizarPartida(completado) {
        if (estado.terminado) return;
        estado.terminado = true;
        clearInterval(temporizadorTurno);
        clearInterval(temporizadorAparicion);
        limpiarZona();

        const cfg = cfgDificultad();
        const pct = Math.min(100, Math.round((estado.capturados / cfg.objetivo) * 100));

        document.getElementById('jf-celebracion-titulo').textContent =
            completado ? '¡Pasillos bien surtidos! 📦' : '¡Se acabó el tiempo!';
        document.getElementById('jf-celebracion-stat').textContent =
            completado
                ? `Clasificaste ${cfg.objetivo} productos — ${estado.puntos} puntos, combo máximo x${estado.comboMaximo}`
                : `Clasificaste ${estado.capturados}/${cfg.objetivo} productos (${pct}%) — ${estado.puntos} puntos`;

        dibujarResultadoEnCanvas();
        document.getElementById('jf-celebracion-overlay').hidden = false;
        if (completado) lanzarConfeti();
    }

    document.getElementById('jf-boton-reiniciar').addEventListener('click', nuevaPartida);
    document.getElementById('jf-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jf-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jf-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Clasifica por Pasillos de Orencio Matas y Hnos! 📦';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jf-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const cfg = cfgDificultad();
        const pct = Math.min(100, Math.round((estado.capturados / cfg.objetivo) * 100));

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Clasifica por Pasillos 📦', w / 2, 80);

        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(String(estado.puntos) + ' pts', w / 2, 170);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`${estado.capturados}/${cfg.objetivo} productos — combo máximo x${estado.comboMaximo} — ${cfg.nombre}`, w / 2, 220);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jf-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'clasifica-por-pasillos.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'clasifica-por-pasillos.png', { type: 'image/png' })],
                        title: 'Clasifica por Pasillos — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jf-compartir-overlay');
        const enlaceDescargar = document.getElementById('jf-boton-descargar');
        const canvas = document.getElementById('jf-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jf-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jf-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jf-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jf-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jf-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jf-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jf-compartir-overlay').hidden = true;
    });
    document.getElementById('jf-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jf-compartir-overlay') ev.currentTarget.hidden = true;
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
        const cont = document.getElementById('jf-proveedores-grid');
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
