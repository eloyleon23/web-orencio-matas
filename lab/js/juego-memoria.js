/**
 * Encuentra la Pareja — minijuego (lab/memoria.html)
 * Vanilla JS, sin dependencias. El clásico juego de memoria: voltea
 * cartas de dos en dos buscando parejas de logos de marcas iguales.
 * Cada partida sortea un subconjunto distinto de logos de entre TODAS
 * las marcas del catálogo (ninguna descartada, incluidos los
 * proveedores principales de talleres) — se "van alternando" en cada
 * partida, tal cual se pidió.
 */
(function () {
    'use strict';

    // ── Catálogo completo de logos ──────────────────────────────────────
    // Ninguna marca descartada: todas las de assets/marcas/ más los
    // proveedores principales de talleres (assets/proveedores/), uno
    // por marca (eligiendo el fichero más limpio cuando había varias
    // variantes del mismo logo).
    const LOGOS = [
        { clave: '3m', archivo: '../assets/marcas/logo_3m.png' },
        { clave: 'akzonobel', archivo: '../assets/marcas/logo_akzonobel.png' },
        { clave: 'alvarezgomez', archivo: '../assets/marcas/logo_alvarezgomez.png' },
        { clave: 'ariel', archivo: '../assets/marcas/logo_ariel.jpg' },
        { clave: 'arrixaca', archivo: '../assets/marcas/logo_arrixaca.jpg' },
        { clave: 'asevi', archivo: '../assets/marcas/logo_asevi.jpg' },
        { clave: 'babaria', archivo: '../assets/marcas/logo_babaria.webp' },
        { clave: 'baixens', archivo: '../assets/marcas/logo_baixens.jpg' },
        { clave: 'caselli', archivo: '../assets/marcas/logo_caselli.jpg' },
        { clave: 'cif', archivo: '../assets/marcas/logo_cif.jpg' },
        { clave: 'cisent', archivo: '../assets/marcas/logo_cisent.png' },
        { clave: 'compo', archivo: '../assets/marcas/logo_compo.png' },
        { clave: 'elmilagrito', archivo: '../assets/marcas/logo_elmilagrito.png' },
        { clave: 'fairy', archivo: '../assets/marcas/logo_fairy.jpg' },
        { clave: 'flower', archivo: '../assets/marcas/logo_flower.png' },
        { clave: 'gomacamps', archivo: '../assets/marcas/logo_gomacamps.jpg' },
        { clave: 'industrias_beter', archivo: '../assets/marcas/logo_industrias_beter.jpg' },
        { clave: 'industrias_betik', archivo: '../assets/marcas/logo_industrias_betik.jpg' },
        { clave: 'jofel', archivo: '../assets/marcas/logo_jofel.png' },
        { clave: 'kelsia', archivo: '../assets/marcas/logo_kelsia.webp' },
        { clave: 'losdi', archivo: '../assets/marcas/logo_losdi.jpg' },
        { clave: 'masso', archivo: '../assets/marcas/logo_masso.webp' },
        { clave: 'mimosin', archivo: '../assets/marcas/logo_mimosin.jpg' },
        { clave: 'mora', archivo: '../assets/marcas/logo_mora.png' },
        { clave: 'muropapel', archivo: '../assets/marcas/logo_muropapel.jpg' },
        { clave: 'nespoli', archivo: '../assets/marcas/logo_nespoli.png' },
        { clave: 'pentrilo', archivo: '../assets/marcas/logo_pentrilo.png' },
        { clave: 'polmeros_del_valls', archivo: '../assets/marcas/logo_polmeros_del_valls.jpg' },
        { clave: 'renova', archivo: '../assets/marcas/logo_renova.svg' },
        { clave: 'ressol', archivo: '../assets/marcas/logo_ressol.jpg' },
        { clave: 'sika', archivo: '../assets/marcas/logo_sika.png' },
        { clave: 'thomil', archivo: '../assets/marcas/logo_thomil.png' },
        { clave: 'vijusa', archivo: '../assets/marcas/logo_vijusa.png' },
        { clave: 'vileda', archivo: '../assets/marcas/logo_vileda.jpg' },
        { clave: 'vinfer', archivo: '../assets/marcas/logo_vinfer.png' },
        { clave: '2castillas', archivo: '../assets/marcas/logor_2castillas.jpg' },
        // Proveedores principales de talleres.
        { clave: 'glasurit', archivo: '../assets/proveedores/Glaurit_recortado.png' },
        { clave: 'besa', archivo: '../assets/proveedores/besa_logo_recortado.png' },
        { clave: 'rm', archivo: '../assets/proveedores/R-M_Paint_Logo.jpg' },
        { clave: 'baslac', archivo: '../assets/proveedores/Logo_baslac.jpg' },
        { clave: 'titanpro', archivo: '../assets/proveedores/LOGO-TITANPRO.png' },
        { clave: 'titantech', archivo: '../assets/proveedores/logo-titantech.jpg' },
        { clave: 'zaphiro', archivo: '../assets/proveedores/zaphiro_logo_oscuro.png' },
    ];

    // ── Dificultad ───────────────────────────────────────────────────
    const DIFICULTADES = {
        facil: { nombre: 'Fácil', pares: 6, columnas: 4, tiempoTotal: 90 },
        medio: { nombre: 'Medio', pares: 8, columnas: 4, tiempoTotal: 110 },
        dificil: { nombre: 'Difícil', pares: 12, columnas: 6, tiempoTotal: 140 },
    };

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        dificultad: 'medio',
        parejasEncontradas: 0,
        intentos: 0,
        tiempoRestante: 0,
        terminado: false,
        bloqueado: false,
        volteadas: [],
    };

    let temporizador = null;
    const tablero = document.getElementById('jc-tablero');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    function mezclar(array) {
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    // ── Tablero ──────────────────────────────────────────────────────

    function construirTablero() {
        const cfg = cfgDificultad();
        const elegidos = mezclar(LOGOS).slice(0, cfg.pares);
        const cartas = mezclar(elegidos.concat(elegidos));

        tablero.innerHTML = '';
        tablero.style.gridTemplateColumns = `repeat(${cfg.columnas}, 1fr)`;

        cartas.forEach((logo, indice) => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'jc-carta';
            boton.dataset.clave = logo.clave;
            boton.dataset.indice = String(indice);
            boton.setAttribute('aria-label', 'Carta boca abajo');
            boton.innerHTML = `
                <span class="jc-carta__cara jc-carta__cara--dorso" aria-hidden="true">
                    <span class="jc-carta__inicial">OM</span>
                </span>
                <span class="jc-carta__cara jc-carta__cara--frente">
                    <img src="${logo.archivo}" alt="" loading="lazy">
                </span>
            `;
            boton.addEventListener('click', () => voltear(boton));
            tablero.appendChild(boton);
        });
    }

    // ── Voltear / comparar ───────────────────────────────────────────

    function voltear(boton) {
        if (estado.terminado || estado.bloqueado) return;
        if (boton.classList.contains('jc-carta--volteada') || boton.classList.contains('jc-carta--encontrada')) return;

        boton.classList.add('jc-carta--volteada');
        boton.setAttribute('aria-label', 'Carta boca arriba');
        estado.volteadas.push(boton);

        if (estado.volteadas.length === 2) {
            estado.intentos++;
            actualizarVista();
            comprobarPareja();
        }
    }

    function comprobarPareja() {
        const [a, b] = estado.volteadas;
        const esPareja = a.dataset.clave === b.dataset.clave;

        if (esPareja) {
            estado.bloqueado = true;
            setTimeout(() => {
                a.classList.add('jc-carta--encontrada');
                b.classList.add('jc-carta--encontrada');
                a.setAttribute('aria-label', 'Pareja encontrada');
                b.setAttribute('aria-label', 'Pareja encontrada');
                estado.parejasEncontradas++;
                estado.volteadas = [];
                estado.bloqueado = false;
                actualizarVista();
                comprobarVictoria();
            }, 450);
        } else {
            estado.bloqueado = true;
            setTimeout(() => {
                a.classList.remove('jc-carta--volteada');
                b.classList.remove('jc-carta--volteada');
                a.setAttribute('aria-label', 'Carta boca abajo');
                b.setAttribute('aria-label', 'Carta boca abajo');
                estado.volteadas = [];
                estado.bloqueado = false;
            }, 850);
        }
    }

    // ── Vista / progreso ─────────────────────────────────────────────

    function actualizarVista() {
        const cfg = cfgDificultad();
        const pct = Math.round((estado.parejasEncontradas / cfg.pares) * 100);

        document.getElementById('jc-contador').textContent = `${estado.parejasEncontradas}/${cfg.pares}`;
        document.getElementById('jc-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jc-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('jc-tiempo').textContent = formatoTiempo(estado.tiempoRestante);
        document.getElementById('jc-intentos').textContent = String(estado.intentos);
    }

    function formatoTiempo(s) {
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r < 10 ? '0' : ''}${r}`;
    }

    function comprobarVictoria() {
        if (estado.parejasEncontradas >= cfgDificultad().pares) {
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

    document.querySelectorAll('.jc-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jc-chip-dificultad').forEach((b) => {
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
        clearInterval(temporizador);

        const cfg = cfgDificultad();
        estado.parejasEncontradas = 0;
        estado.intentos = 0;
        estado.tiempoRestante = cfg.tiempoTotal;
        estado.terminado = false;
        estado.bloqueado = false;
        estado.volteadas = [];

        document.getElementById('jc-celebracion-overlay').hidden = true;
        document.getElementById('jc-pista').style.display = '';

        construirTablero();
        actualizarVista();

        temporizador = setInterval(tick, 1000);
    }

    function finalizarPartida(completado) {
        if (estado.terminado) return;
        estado.terminado = true;
        clearInterval(temporizador);

        const cfg = cfgDificultad();
        const pct = Math.round((estado.parejasEncontradas / cfg.pares) * 100);

        document.getElementById('jc-celebracion-titulo').textContent =
            completado ? '¡Memoria de hierro! 🧠' : '¡Se acabó el tiempo!';
        document.getElementById('jc-celebracion-stat').textContent =
            completado
                ? `Encontraste las ${cfg.pares} parejas en ${estado.intentos} intentos`
                : `Encontraste ${estado.parejasEncontradas}/${cfg.pares} parejas (${pct}%) en ${estado.intentos} intentos`;

        dibujarResultadoEnCanvas();
        document.getElementById('jc-celebracion-overlay').hidden = false;
        if (completado) lanzarConfeti();
    }

    document.getElementById('jc-boton-reiniciar').addEventListener('click', nuevaPartida);
    document.getElementById('jc-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jc-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jc-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Encuentra la Pareja de Orencio Matas y Hnos! 🧠';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jc-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const cfg = cfgDificultad();
        const pct = Math.round((estado.parejasEncontradas / cfg.pares) * 100);

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Encuentra la Pareja 🧠', w / 2, 90);

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(pct + '%', w / 2, 190);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`${estado.parejasEncontradas}/${cfg.pares} parejas — ${estado.intentos} intentos — ${cfg.nombre}`, w / 2, 240);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jc-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'encuentra-la-pareja.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'encuentra-la-pareja.png', { type: 'image/png' })],
                        title: 'Encuentra la Pareja — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jc-compartir-overlay');
        const enlaceDescargar = document.getElementById('jc-boton-descargar');
        const canvas = document.getElementById('jc-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jc-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jc-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jc-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jc-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jc-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jc-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jc-compartir-overlay').hidden = true;
    });
    document.getElementById('jc-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jc-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Marcas aleatorias (sin filtrar, al buscador general) ──────────
    // Igual que en Organiza el Almacén / Despacha el Pedido: 6 logos al
    // azar de entre todas las marcas, re-sorteados cada vez que se
    // entra a la página, enlazando al buscador sin filtrar.

    function pintarMarcasAleatorias() {
        const cont = document.getElementById('jc-proveedores-grid');
        const barajadas = mezclar(LOGOS);
        cont.innerHTML = '';
        barajadas.slice(0, 6).forEach((logo) => {
            const a = document.createElement('a');
            a.className = 'premium-provider-card';
            a.href = '../buscador.html';
            const img = document.createElement('img');
            img.src = logo.archivo;
            img.alt = logo.clave.replace(/_/g, ' ');
            img.loading = 'lazy';
            a.appendChild(img);
            cont.appendChild(a);
        });
    }

    // ── Arranque ─────────────────────────────────────────────────────

    pintarMarcasAleatorias();
    nuevaPartida();
})();
