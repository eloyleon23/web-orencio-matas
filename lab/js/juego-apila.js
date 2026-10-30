/**
 * Apila el Pedido — minijuego (lab/apila.html)
 * Vanilla JS, sin dependencias. Clon del clásico "Stack": una barra
 * oscila de lado a lado y hay que tocar para soltarla justo encima de
 * la última capa — lo que sobresale se recorta, así que la torre se
 * va estrechando y cada vez hay que acertar con más precisión. Un
 * fallo total (sin solape) acaba la partida.
 *
 * Todo el posicionamiento es en porcentaje del ancho del contenedor
 * (no px), así que no depende de ResizeObserver ni de recalcular nada
 * al cambiar de tamaño. Para dar la sensación de "cámara que sigue
 * subiendo", cada capa se dibuja a una altura = distancia (en número
 * de capas) hasta la última colocada — no hay transform de scroll
 * real, solo se recalculan las posiciones en cada colocación.
 */
(function () {
    'use strict';

    // ── Paleta (colores del propio logo) y etiquetas de capa ───────────
    const COLORES_CAPA = ['#3a3f44', '#e4392c', '#f0932b', '#f6c445', '#2f9e6e', '#1f6f8b'];
    const ETIQUETAS_CAPA = [
        'Droguería', 'Perfumería', 'Pinturas', 'Talleres',
        'Detergentes', 'Lejías', 'Colonias', 'Maquillaje',
        'Brochas', 'Barnices', 'Lijas', 'Esmaltes', 'Disolventes', 'Insecticidas',
    ];

    // ── Dificultad ───────────────────────────────────────────────────
    // periodoMs: tiempo que tarda la barra en recorrer toda su franja
    // de lado a lado (más bajo, más rápida). toleranciaPerfecta: % de
    // margen dentro del cual un golpe cuenta como "perfecto" (no
    // recorta la capa). objetivo: capas para completar la partida
    // antes de que siga creciendo.
    const DIFICULTADES = {
        facil: { nombre: 'Fácil', periodoMs: 2200, periodoMin: 900, reduccionPorCapa: 25, toleranciaPerfecta: 6, objetivo: 14 },
        medio: { nombre: 'Medio', periodoMs: 1600, periodoMin: 650, reduccionPorCapa: 22, toleranciaPerfecta: 4, objetivo: 20 },
        dificil: { nombre: 'Difícil', periodoMs: 1100, periodoMin: 450, reduccionPorCapa: 18, toleranciaPerfecta: 2.5, objetivo: 28 },
    };

    const ANCHO_INICIAL = 42; // % del contenedor
    const TOLERANCIA_FALLO = 2; // % mínimo de solape para no perder

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        dificultad: 'medio',
        capas: [], // { izquierda, ancho, color, etiqueta }
        euros: 0,
        combo: 0,
        comboMaximo: 0,
        terminado: false,
        jugando: false,
    };

    let barraAncho = ANCHO_INICIAL;
    let animacionId = null;
    let inicioAnimacion = 0;

    const torre = document.getElementById('jq-torre');
    const barra = document.getElementById('jq-barra-movil');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    function periodoActual() {
        const cfg = cfgDificultad();
        return Math.max(cfg.periodoMin, cfg.periodoMs - estado.capas.length * cfg.reduccionPorCapa);
    }

    // ── Render de la torre (capas visibles, "cámara" hacia arriba) ───

    const ALTURA_CAPA_PX = 34;
    const FILAS_VISIBLES = 9;

    function renderizarTorre() {
        torre.querySelectorAll('.jq-capa').forEach((el) => el.remove());
        const total = estado.capas.length;
        const desde = Math.max(0, total - FILAS_VISIBLES);
        for (let i = desde; i < total; i++) {
            const capa = estado.capas[i];
            const el = document.createElement('div');
            el.className = 'jq-capa';
            el.style.left = capa.izquierda + '%';
            el.style.width = capa.ancho + '%';
            el.style.bottom = ((total - 1 - i) * ALTURA_CAPA_PX) + 'px';
            el.style.background = capa.color;
            el.innerHTML = `<span class="jq-capa__etiqueta">${capa.etiqueta}</span>`;
            torre.insertBefore(el, barra);
        }
        barra.style.bottom = (total * ALTURA_CAPA_PX) + 'px';
        barra.style.width = barraAncho + '%';
    }

    // ── Movimiento de la barra ───────────────────────────────────────

    function animarBarra(marca) {
        if (!inicioAnimacion) inicioAnimacion = marca;
        const transcurrido = marca - inicioAnimacion;
        const periodo = periodoActual();
        const rango = 100 - barraAncho;
        const t = (transcurrido % periodo) / periodo; // 0..1
        const triangular = t < 0.5 ? t * 2 : 2 - t * 2; // 0→1→0
        const izquierda = triangular * rango;
        barra.style.left = izquierda + '%';
        animacionId = requestAnimationFrame(animarBarra);
    }

    function pararAnimacion() {
        if (animacionId) cancelAnimationFrame(animacionId);
        animacionId = null;
        inicioAnimacion = 0;
    }

    // ── Soltar capa ──────────────────────────────────────────────────

    function soltar() {
        if (estado.terminado || !estado.jugando) return;

        const barraIzq = parseFloat(barra.style.left) || 0;
        const ultima = estado.capas[estado.capas.length - 1];

        const nuevaIzq = Math.max(barraIzq, ultima.izquierda);
        const nuevaDer = Math.min(barraIzq + barraAncho, ultima.izquierda + ultima.ancho);
        const solape = nuevaDer - nuevaIzq;

        if (solape < TOLERANCIA_FALLO) {
            finalizarPartida(false);
            return;
        }

        const esPerfecta = (ultima.ancho - solape) <= cfgDificultad().toleranciaPerfecta;
        const color = COLORES_CAPA[estado.capas.length % COLORES_CAPA.length];
        const etiqueta = ETIQUETAS_CAPA[Math.floor(Math.random() * ETIQUETAS_CAPA.length)];

        const capa = esPerfecta
            ? { izquierda: ultima.izquierda, ancho: ultima.ancho, color, etiqueta }
            : { izquierda: nuevaIzq, ancho: solape, color, etiqueta };

        estado.capas.push(capa);
        barraAncho = capa.ancho;

        estado.combo = esPerfecta ? estado.combo + 1 : 0;
        estado.comboMaximo = Math.max(estado.comboMaximo, estado.combo);
        estado.euros += Math.round((3 + Math.random() * 15) * (esPerfecta ? 1.5 : 1) * 10) / 10;

        renderizarTorre();
        actualizarVista();
        lanzarRecorte(ultima, capa);

        if (estado.capas.length - 1 >= cfgDificultad().objetivo) {
            finalizarPartida(true);
            return;
        }

        pararAnimacion();
        requestAnimationFrame(animarBarra);
    }

    function lanzarRecorte(anterior, nueva) {
        // Pequeño trozo que "cae" representando el recorte, solo si de
        // verdad se ha recortado algo (no en un golpe perfecto).
        if (nueva.izquierda <= anterior.izquierda && nueva.ancho >= anterior.ancho - 0.01) return;
        const el = document.createElement('div');
        el.className = 'jq-recorte';
        el.style.background = nueva.color;
        if (nueva.izquierda > anterior.izquierda) {
            el.style.left = anterior.izquierda + '%';
            el.style.width = (nueva.izquierda - anterior.izquierda) + '%';
        } else {
            el.style.left = (nueva.izquierda + nueva.ancho) + '%';
            el.style.width = (anterior.izquierda + anterior.ancho - (nueva.izquierda + nueva.ancho)) + '%';
        }
        el.style.bottom = '0px';
        torre.appendChild(el);
        setTimeout(() => el.remove(), 500);
    }

    torre.addEventListener('pointerdown', (ev) => {
        if (ev.target.closest('.jq-boton-reiniciar')) return;
        soltar();
    });

    // ── Vista / progreso ─────────────────────────────────────────────

    function actualizarVista() {
        const cfg = cfgDificultad();
        const pct = Math.min(100, Math.round((estado.capas.length - 1) / cfg.objetivo * 100));

        document.getElementById('jq-contador').textContent = `${Math.max(0, estado.capas.length - 1)}/${cfg.objetivo}`;
        document.getElementById('jq-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jq-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('jq-euros').textContent = estado.euros.toFixed(2).replace('.', ',') + ' €';
        document.getElementById('jq-combo').textContent = estado.combo > 1 ? `x${estado.combo}` : '—';
    }

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.jq-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jq-chip-dificultad').forEach((b) => {
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
        pararAnimacion();

        barraAncho = ANCHO_INICIAL;
        estado.capas = [{ izquierda: (100 - ANCHO_INICIAL) / 2, ancho: ANCHO_INICIAL, color: COLORES_CAPA[0], etiqueta: 'Base' }];
        estado.euros = 0;
        estado.combo = 0;
        estado.comboMaximo = 0;
        estado.terminado = false;
        estado.jugando = true;

        document.getElementById('jq-celebracion-overlay').hidden = true;
        document.getElementById('jq-pista').style.display = '';

        renderizarTorre();
        actualizarVista();
        requestAnimationFrame(animarBarra);
    }

    function finalizarPartida(completado) {
        if (estado.terminado) return;
        estado.terminado = true;
        estado.jugando = false;
        pararAnimacion();

        const cfg = cfgDificultad();
        const capasColocadas = Math.max(0, estado.capas.length - 1);
        const pct = Math.min(100, Math.round((capasColocadas / cfg.objetivo) * 100));

        document.getElementById('jq-celebracion-titulo').textContent =
            completado ? '¡Torre al máximo! 📦' : '¡Se cayó la torre!';
        document.getElementById('jq-celebracion-stat').textContent =
            completado
                ? `${capasColocadas} capas — ${estado.euros.toFixed(2).replace('.', ',')} € cargados, combo máximo x${estado.comboMaximo}`
                : `${capasColocadas}/${cfg.objetivo} capas (${pct}%) — ${estado.euros.toFixed(2).replace('.', ',')} € cargados`;

        dibujarResultadoEnCanvas();
        document.getElementById('jq-celebracion-overlay').hidden = false;
        if (completado) lanzarConfeti();
    }

    document.getElementById('jq-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        nuevaPartida();
    });
    document.getElementById('jq-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jq-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jq-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Apila el Pedido de Orencio Matas y Hnos! 📦';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jq-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const cfg = cfgDificultad();
        const capasColocadas = Math.max(0, estado.capas.length - 1);

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Apila el Pedido 📦', w / 2, 80);

        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(capasColocadas + ' capas', w / 2, 170);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`${estado.euros.toFixed(2).replace('.', ',')} € cargados — combo máximo x${estado.comboMaximo} — ${cfg.nombre}`, w / 2, 220);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jq-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'apila-el-pedido.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'apila-el-pedido.png', { type: 'image/png' })],
                        title: 'Apila el Pedido — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jq-compartir-overlay');
        const enlaceDescargar = document.getElementById('jq-boton-descargar');
        const canvas = document.getElementById('jq-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jq-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jq-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jq-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jq-boton-compartir').addEventListener('click', (ev) => { ev.stopPropagation(); compartir(); });
    document.getElementById('jq-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jq-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jq-compartir-overlay').hidden = true;
    });
    document.getElementById('jq-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jq-compartir-overlay') ev.currentTarget.hidden = true;
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

    function pintarMarcasAleatorias() {
        const cont = document.getElementById('jq-proveedores-grid');
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
