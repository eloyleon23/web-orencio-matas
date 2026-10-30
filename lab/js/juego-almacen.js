/**
 * Organiza el Almacén — minijuego (lab/almacen.html)
 * Vanilla JS, sin dependencias. Hay que colocar cajas de distinto
 * tamaño en una estantería de 4 filas x 8 huecos, cada caja ocupando
 * tantos huecos contiguos como su tamaño — si no hay sitio contiguo
 * suficiente en la fila tocada, no se coloca ("no se cae" porque
 * sencillamente no se deja colocar donde no cabe). En los niveles
 * medio y difícil, empleados del almacén (emoji) se acercan de vez en
 * cuando a una caja ya colocada y se la llevan, liberando el hueco:
 * esa caja vuelve al final de la cola para tener que volver a
 * colocarla.
 *
 * Victoria: tener en algún momento TODAS las cajas de la ronda
 * colocadas a la vez (la cola vacía y nada pendiente). Si se acaba el
 * tiempo antes, la puntuación es cuántas quedan colocadas en ese
 * instante sobre el total.
 */
(function () {
    'use strict';

    // ── Estantería ──────────────────────────────────────────────────────
    const FILAS = 4;
    const SLOTS_POR_FILA = 8;

    // ── Tamaños de caja (en huecos) ─────────────────────────────────────
    const TAMANOS = [
        { unidades: 1, etiqueta: 'Pequeña', peso: 0.4 },
        { unidades: 2, etiqueta: 'Mediana', peso: 0.35 },
        { unidades: 3, etiqueta: 'Grande', peso: 0.25 },
    ];

    function elegirTamano() {
        const r = Math.random();
        let acum = 0;
        for (const t of TAMANOS) {
            acum += t.peso;
            if (r <= acum) return t;
        }
        return TAMANOS[0];
    }

    // ── Logos de marcas (para la miniatura de cada caja) ────────────────
    const LOGOS = [
        '3m', 'akzonobel', 'alvarezgomez', 'ariel', 'arrixaca', 'asevi', 'babaria',
        'baixens', 'caselli', 'cif', 'cisent', 'compo', 'elmilagrito', 'fairy',
        'flower', 'gomacamps', 'industrias_beter', 'industrias_betik', 'jofel',
        'kelsia', 'losdi', 'masso', 'mimosin', 'mora', 'muropapel', 'nespoli',
        'pentrilo', 'polmeros_del_valls', 'renova', 'ressol', 'sika', 'thomil',
        'vijusa', 'vileda', 'vinfer',
    ];

    function rutaLogo(clave) {
        return `../assets/marcas/logo_${clave}.${EXTENSIONES[clave] || 'png'}`;
    }

    // Algunos ficheros no son .png — mapa de excepciones conocidas.
    const EXTENSIONES = {
        ariel: 'jpg', arrixaca: 'jpg', asevi: 'jpg', babaria: 'webp', baixens: 'jpg',
        caselli: 'jpg', cif: 'jpg', elmilagrito: 'png', fairy: 'jpg',
        gomacamps: 'jpg', industrias_beter: 'jpg', industrias_betik: 'jpg',
        kelsia: 'webp', losdi: 'jpg', masso: 'webp', mimosin: 'jpg',
        muropapel: 'jpg', polmeros_del_valls: 'jpg', renova: 'svg', ressol: 'jpg',
        thomil: 'png', vileda: 'jpg',
    };

    function logoAleatorio() {
        return LOGOS[Math.floor(Math.random() * LOGOS.length)];
    }

    // ── Dificultad ───────────────────────────────────────────────────
    // personas: cuántos empleados "roban" cajas colocadas a la vez;
    // intervaloMin/Max: tiempo entre una visita y la siguiente de cada
    // empleado.
    const DIFICULTADES = {
        facil: { nombre: 'Fácil', tiempoTotal: 70, totalCajas: 8, personas: 0, intervaloMin: 0, intervaloMax: 0 },
        medio: { nombre: 'Medio', tiempoTotal: 75, totalCajas: 12, personas: 1, intervaloMin: 6000, intervaloMax: 10000 },
        dificil: { nombre: 'Difícil', tiempoTotal: 80, totalCajas: 15, personas: 2, intervaloMin: 4500, intervaloMax: 7500 },
    };

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        dificultad: 'medio',
        slots: [],
        infoCajas: new Map(),
        colaCajas: [],
        cajaActualId: null,
        colocaciones: new Map(),
        historialColocaciones: [],
        siguienteId: 1,
        tiempoRestante: 0,
        terminado: false,
    };

    let temporizadorCuentaAtras = null;
    let temporizadoresPersona = [];

    const estanteria = document.getElementById('ja-estanteria');
    const filasEl = [];

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    // ── Construcción de la estantería ────────────────────────────────

    function construirEstanteria() {
        estanteria.innerHTML = '';
        filasEl.length = 0;
        for (let f = 0; f < FILAS; f++) {
            const fila = document.createElement('div');
            fila.className = 'ja-fila';
            fila.dataset.fila = String(f);

            const slotsWrap = document.createElement('div');
            slotsWrap.className = 'ja-slots';
            for (let s = 0; s < SLOTS_POR_FILA; s++) {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.className = 'ja-slot';
                boton.dataset.fila = String(f);
                boton.dataset.slot = String(s);
                boton.setAttribute('aria-label', `Fila ${f + 1}, hueco ${s + 1}`);
                boton.addEventListener('click', () => intentarColocar(f, s));
                slotsWrap.appendChild(boton);
            }
            fila.appendChild(slotsWrap);

            const cajasWrap = document.createElement('div');
            cajasWrap.className = 'ja-cajas-overlay';
            fila.appendChild(cajasWrap);

            estanteria.appendChild(fila);
            filasEl.push({ fila, slotsWrap, cajasWrap });
        }
    }

    function slotBotones(f) {
        return filasEl[f].slotsWrap.children;
    }

    // ── Ronda ────────────────────────────────────────────────────────

    function generarRonda() {
        const cfg = cfgDificultad();
        estado.slots = Array.from({ length: FILAS }, () => new Array(SLOTS_POR_FILA).fill(null));
        estado.infoCajas = new Map();
        estado.colaCajas = [];
        estado.colocaciones = new Map();
        estado.historialColocaciones = [];
        estado.siguienteId = 1;

        for (let i = 0; i < cfg.totalCajas; i++) {
            const id = estado.siguienteId++;
            const tam = elegirTamano();
            estado.infoCajas.set(id, { unidades: tam.unidades, etiqueta: tam.etiqueta, logo: logoAleatorio() });
            estado.colaCajas.push(id);
        }
        estado.cajaActualId = estado.colaCajas.shift();
    }

    function avanzarCola() {
        estado.cajaActualId = estado.colaCajas.length ? estado.colaCajas.shift() : null;
    }

    // ── Colocar / robar cajas ────────────────────────────────────────

    function intentarColocar(fila, inicio) {
        if (estado.terminado || estado.cajaActualId === null) return;
        const info = estado.infoCajas.get(estado.cajaActualId);
        const tam = info.unidades;

        if (inicio + tam > SLOTS_POR_FILA) return rechazarEnFila(fila);
        for (let i = inicio; i < inicio + tam; i++) {
            if (estado.slots[fila][i] !== null) return rechazarEnFila(fila);
        }

        for (let i = inicio; i < inicio + tam; i++) {
            estado.slots[fila][i] = estado.cajaActualId;
        }
        const el = crearElementoCaja(info, inicio, tam);
        filasEl[fila].cajasWrap.appendChild(el);
        estado.colocaciones.set(estado.cajaActualId, { fila, inicio, tam, el });
        estado.historialColocaciones.push(estado.cajaActualId);
        actualizarSlotsDeshabilitados(fila);

        avanzarCola();
        actualizarVista();
        comprobarVictoria();
    }

    function rechazarEnFila(fila) {
        const el = filasEl[fila].fila;
        el.classList.remove('ja-fila--rechazada');
        void el.offsetWidth;
        el.classList.add('ja-fila--rechazada');
        setTimeout(() => el.classList.remove('ja-fila--rechazada'), 320);
    }

    function crearElementoCaja(info, inicio, tam) {
        const el = document.createElement('div');
        el.className = `ja-caja ja-caja--${info.unidades}`;
        el.style.left = (inicio / SLOTS_POR_FILA * 100) + '%';
        el.style.width = (tam / SLOTS_POR_FILA * 100) + '%';
        const img = document.createElement('img');
        img.src = rutaLogo(info.logo);
        img.alt = '';
        img.loading = 'lazy';
        el.appendChild(img);
        return el;
    }

    function actualizarSlotsDeshabilitados(fila) {
        const botones = slotBotones(fila);
        for (let i = 0; i < SLOTS_POR_FILA; i++) {
            botones[i].classList.toggle('ja-slot--ocupado', estado.slots[fila][i] !== null);
        }
    }

    // Libera el hueco de una caja ya colocada y quita su elemento
    // visual. No decide qué pasa con el id (a la cola, a caja actual,
    // ...) — eso lo deciden robarCaja() y deshacerColocacion().
    function quitarDeEstanteria(id, claseAnimacion) {
        const entrada = estado.colocaciones.get(id);
        if (!entrada) return false;
        const { fila, inicio, tam, el } = entrada;
        for (let i = inicio; i < inicio + tam; i++) {
            estado.slots[fila][i] = null;
        }
        estado.colocaciones.delete(id);
        actualizarSlotsDeshabilitados(fila);

        el.classList.add(claseAnimacion);
        setTimeout(() => el.remove(), 320);
        return true;
    }

    function robarCaja(id) {
        if (!quitarDeEstanteria(id, 'ja-caja--robada')) return;
        estado.colaCajas.push(id);
        if (estado.cajaActualId === null) avanzarCola();
        actualizarVista();
    }

    // Deshacer: recupera la última caja colocada por el jugador (no
    // una robada por un empleado, esa ya no está en el historial) y la
    // vuelve a poner como "caja a colocar" para poder intentarlo en
    // otro hueco — pensada para corregir una mala colocación que deje
    // la estantería sin hueco contiguo para una caja grande.
    function deshacerColocacion() {
        if (estado.terminado) return;
        while (estado.historialColocaciones.length) {
            const id = estado.historialColocaciones.pop();
            if (!quitarDeEstanteria(id, 'ja-caja--robada')) continue; // ya no estaba (se la llevó un empleado)
            if (estado.cajaActualId !== null) estado.colaCajas.unshift(estado.cajaActualId);
            estado.cajaActualId = id;
            actualizarVista();
            return;
        }
    }

    // ── Vista ────────────────────────────────────────────────────────

    function actualizarVista() {
        const cfg = cfgDificultad();
        const colocadas = estado.colocaciones.size;
        const pct = Math.round((colocadas / cfg.totalCajas) * 100);

        document.getElementById('ja-contador').textContent = `${colocadas}/${cfg.totalCajas}`;
        document.getElementById('ja-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('ja-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('ja-tiempo').textContent = formatoTiempo(estado.tiempoRestante);
        document.getElementById('ja-boton-deshacer').disabled = estado.historialColocaciones.length === 0;

        const previa = document.getElementById('ja-caja-actual');
        if (estado.cajaActualId === null) {
            previa.innerHTML = '<p class="ja-caja-actual__vacio">¡Todo colocado! 📦</p>';
        } else {
            const info = estado.infoCajas.get(estado.cajaActualId);
            previa.innerHTML = '';
            const miniatura = document.createElement('div');
            miniatura.className = `ja-caja-actual__caja ja-caja--${info.unidades}`;
            const img = document.createElement('img');
            img.src = rutaLogo(info.logo);
            img.alt = '';
            miniatura.appendChild(img);
            const etiqueta = document.createElement('p');
            etiqueta.className = 'ja-caja-actual__etiqueta';
            etiqueta.textContent = `${info.etiqueta} · quedan ${estado.colaCajas.length + 1} por colocar`;
            previa.appendChild(miniatura);
            previa.appendChild(etiqueta);
        }
    }

    function formatoTiempo(s) {
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r < 10 ? '0' : ''}${r}`;
    }

    function comprobarVictoria() {
        const cfg = cfgDificultad();
        if (estado.colocaciones.size >= cfg.totalCajas) {
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

    // ── Empleados que roban cajas colocadas ─────────────────────────

    const arenaPersonas = document.getElementById('ja-personas');

    function iniciarPersonas() {
        const cfg = cfgDificultad();
        temporizadoresPersona = [];
        for (let i = 0; i < cfg.personas; i++) {
            programarPersona(i);
        }
    }

    function programarPersona(indice) {
        const cfg = cfgDificultad();
        if (cfg.personas <= 0 || estado.terminado) return;
        const espera = cfg.intervaloMin + Math.random() * (cfg.intervaloMax - cfg.intervaloMin);
        temporizadoresPersona[indice] = setTimeout(() => lanzarPersona(indice), espera);
    }

    function lanzarPersona(indice) {
        if (estado.terminado) return;
        const idsColocados = Array.from(estado.colocaciones.keys());
        if (!idsColocados.length) {
            programarPersona(indice);
            return;
        }
        const idObjetivo = idsColocados[Math.floor(Math.random() * idsColocados.length)];
        const entrada = estado.colocaciones.get(idObjetivo);
        if (!entrada) {
            programarPersona(indice);
            return;
        }

        const rectEstante = estanteria.getBoundingClientRect();
        const rectCaja = entrada.el.getBoundingClientRect();
        const destinoX = rectCaja.left - rectEstante.left + rectCaja.width / 2;
        const destinoY = rectCaja.top - rectEstante.top + rectCaja.height / 2;

        const persona = document.createElement('div');
        persona.className = 'ja-persona';
        persona.textContent = indice === 0 ? '👷' : '👷‍♀️';
        persona.style.left = (destinoX < rectEstante.width / 2 ? rectEstante.width + 10 : -40) + 'px';
        persona.style.top = destinoY + 'px';
        arenaPersonas.appendChild(persona);

        requestAnimationFrame(() => {
            persona.style.transition = 'left 900ms ease-in-out, top 900ms ease-in-out';
            persona.style.left = destinoX + 'px';
            persona.style.top = destinoY + 'px';
        });

        setTimeout(() => {
            if (!estado.terminado) {
                persona.classList.add('ja-persona--agarra');
                robarCaja(idObjetivo);
            }
            setTimeout(() => {
                persona.style.left = (destinoX < rectEstante.width / 2 ? -40 : rectEstante.width + 10) + 'px';
                setTimeout(() => persona.remove(), 950);
            }, 260);
        }, 950);

        programarPersona(indice);
    }

    function limpiarPersonas() {
        temporizadoresPersona.forEach((t) => clearTimeout(t));
        temporizadoresPersona = [];
        arenaPersonas.innerHTML = '';
    }

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.ja-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.ja-chip-dificultad').forEach((b) => {
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

    function nuevaPartida() {
        clearInterval(temporizadorCuentaAtras);
        limpiarPersonas();

        const cfg = cfgDificultad();
        estado.tiempoRestante = cfg.tiempoTotal;
        estado.terminado = false;

        document.getElementById('ja-celebracion-overlay').hidden = true;
        document.getElementById('ja-pista').style.display = '';

        construirEstanteria();
        generarRonda();
        actualizarVista();

        temporizadorCuentaAtras = setInterval(tick, 1000);
        iniciarPersonas();
    }

    function finalizarPartida(completado) {
        if (estado.terminado) return;
        estado.terminado = true;
        clearInterval(temporizadorCuentaAtras);
        limpiarPersonas();

        const cfg = cfgDificultad();
        const colocadas = estado.colocaciones.size;
        const pct = Math.round((colocadas / cfg.totalCajas) * 100);

        document.getElementById('ja-celebracion-titulo').textContent =
            completado ? '¡Almacén organizado! 📦' : '¡Se acabó el tiempo!';
        document.getElementById('ja-celebracion-stat').textContent =
            completado
                ? `Colocaste las ${cfg.totalCajas} cajas en ${formatoTiempo(cfg.tiempoTotal - estado.tiempoRestante)}`
                : `Dejaste ${colocadas}/${cfg.totalCajas} cajas colocadas (${pct}%)`;

        document.getElementById('ja-celebracion-overlay').hidden = false;
        if (completado) lanzarConfeti();
    }

    document.getElementById('ja-boton-reiniciar').addEventListener('click', nuevaPartida);
    document.getElementById('ja-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);
    document.getElementById('ja-boton-deshacer').addEventListener('click', deshacerColocacion);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('ja-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'ja-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Organiza el Almacén de Orencio Matas y Hnos! 📦';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('ja-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const cfg = cfgDificultad();
        const colocadas = estado.colocaciones.size;
        const pct = Math.round((colocadas / cfg.totalCajas) * 100);

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Organiza el Almacén 📦', w / 2, 90);

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(pct + '%', w / 2, 190);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`${colocadas}/${cfg.totalCajas} cajas colocadas — ${cfg.nombre}`, w / 2, 240);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('ja-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'organiza-el-almacen.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'organiza-el-almacen.png', { type: 'image/png' })],
                        title: 'Organiza el Almacén — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('ja-compartir-overlay');
        const enlaceDescargar = document.getElementById('ja-boton-descargar');
        const canvas = document.getElementById('ja-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('ja-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('ja-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('ja-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('ja-boton-compartir').addEventListener('click', compartir);
    document.getElementById('ja-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('ja-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('ja-compartir-overlay').hidden = true;
    });
    document.getElementById('ja-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'ja-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Marcas aleatorias (sin filtrar, al buscador general) ──────────
    // Se recalculan cada vez que se entra a la página: 6 logos al azar
    // de entre todas las marcas, distintos entre sí.

    function pintarMarcasAleatorias() {
        const cont = document.getElementById('ja-proveedores-grid');
        const barajadas = LOGOS.slice();
        for (let i = barajadas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [barajadas[i], barajadas[j]] = [barajadas[j], barajadas[i]];
        }
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
