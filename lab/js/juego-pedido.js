/**
 * Despacha el Pedido — minijuego (lab/pedido.html)
 * Vanilla JS, sin dependencias. Llegan clientes con una lista corta de
 * 2-3 productos (de droguería, perfumería, pinturas o talleres) y hay
 * que tocar los productos correctos en la estantería antes de que se
 * le acabe la paciencia. Encadenar aciertos sube el combo y da más
 * puntos; fallar un producto o que un cliente se vaya reinicia el
 * combo (no resta puntos, solo corta la racha).
 *
 * Simplificación deliberada frente a un "Diner Dash" completo: un
 * solo cliente activo a la vez (no colas en paralelo) y productos
 * representados con icono + nombre (no fotos reales del catálogo),
 * para que el juego no dependa de la red ni de las miniaturas de
 * Google Drive del buscador — más fiable para un prototipo que vive
 * aislado en lab/ y se prueba sin conexión.
 */
(function () {
    'use strict';

    // ── Catálogo de productos del mostrador (ficticio, sin red) ────────
    const PRODUCTOS = [
        { clave: 'detergente', icono: '🧺', nombre: 'Detergente' },
        { clave: 'lejia', icono: '🧪', nombre: 'Lejía' },
        { clave: 'friegasuelos', icono: '🪣', nombre: 'Friegasuelos' },
        { clave: 'guantes', icono: '🧤', nombre: 'Guantes' },
        { clave: 'bayeta', icono: '🧽', nombre: 'Bayeta' },
        { clave: 'insecticida', icono: '🐜', nombre: 'Insecticida' },
        { clave: 'colonia', icono: '🌸', nombre: 'Colonia' },
        { clave: 'champu', icono: '🧴', nombre: 'Champú' },
        { clave: 'crema', icono: '🫙', nombre: 'Crema hidratante' },
        { clave: 'jabon', icono: '🧼', nombre: 'Jabón de manos' },
        { clave: 'desodorante', icono: '💨', nombre: 'Desodorante' },
        { clave: 'maquillaje', icono: '💄', nombre: 'Maquillaje' },
        { clave: 'pintura_pared', icono: '🎨', nombre: 'Pintura de pared' },
        { clave: 'brocha', icono: '🖌️', nombre: 'Brocha' },
        { clave: 'rodillo', icono: '🧻', nombre: 'Rodillo' },
        { clave: 'spray_pintura', icono: '🧯', nombre: 'Spray de pintura' },
        { clave: 'barniz', icono: '🪵', nombre: 'Barniz para madera' },
        { clave: 'disolvente', icono: '⚗️', nombre: 'Disolvente' },
        { clave: 'lija', icono: '🟫', nombre: 'Lija' },
        { clave: 'pulimento', icono: '🫧', nombre: 'Pulimento' },
        { clave: 'esmalte_sintetico', icono: '🎨', nombre: 'Esmalte sintético' },
        { clave: 'masilla', icono: '🧱', nombre: 'Masilla de carrocería' },
        { clave: 'imprimacion', icono: '🛢️', nombre: 'Imprimación' },
        { clave: 'limpiacristales', icono: '🪟', nombre: 'Limpiacristales' },
    ];
    const PRODUCTOS_POR_CLAVE = new Map(PRODUCTOS.map((p) => [p.clave, p]));

    const AVATARES_CLIENTE = ['🧑', '👩', '👨', '🧔', '👵', '🧓', '👱', '🧕'];

    // ── Dificultad ───────────────────────────────────────────────────
    // tilesVisibles: cuántos productos distintos hay en la estantería
    // (más, más cuesta encontrar el que toca). itemsMin/Max: tamaño del
    // pedido. paciencia: ms antes de que el cliente se canse y se vaya.
    const DIFICULTADES = {
        facil: { nombre: 'Fácil', tiempoTotal: 70, clientesObjetivo: 8, tilesVisibles: 8, itemsMin: 2, itemsMax: 2, paciencia: 14000 },
        medio: { nombre: 'Medio', tiempoTotal: 75, clientesObjetivo: 10, tilesVisibles: 12, itemsMin: 2, itemsMax: 3, paciencia: 10000 },
        dificil: { nombre: 'Difícil', tiempoTotal: 80, clientesObjetivo: 12, tilesVisibles: 16, itemsMin: 3, itemsMax: 3, paciencia: 7500 },
    };

    // ── Estado ────────────────────────────────────────────────────────
    const estado = {
        dificultad: 'medio',
        tilesActivas: [],
        clienteActual: null,
        clientesAtendidos: 0,
        clientesFallados: 0,
        puntos: 0,
        combo: 0,
        comboMaximo: 0,
        tiempoRestante: 0,
        terminado: false,
    };

    let temporizadorTurno = null;
    let temporizadorSiguienteCliente = null;

    const estanteria = document.getElementById('jd-estanteria');
    const panelCliente = document.getElementById('jd-cliente');

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

    // ── Estantería ──────────────────────────────────────────────────

    function construirEstanteria() {
        const cfg = cfgDificultad();
        estado.tilesActivas = mezclar(PRODUCTOS.map((p) => p.clave)).slice(0, cfg.tilesVisibles);

        estanteria.innerHTML = '';
        estado.tilesActivas.forEach((clave) => {
            const info = PRODUCTOS_POR_CLAVE.get(clave);
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'jd-tile';
            boton.dataset.clave = clave;
            boton.innerHTML = `<span class="jd-tile__icono" aria-hidden="true">${info.icono}</span><span class="jd-tile__nombre">${info.nombre}</span>`;
            boton.addEventListener('click', () => tocarProducto(clave, boton));
            estanteria.appendChild(boton);
        });
    }

    // ── Cliente ──────────────────────────────────────────────────────

    function nuevoCliente() {
        if (estado.terminado) return;
        const cfg = cfgDificultad();
        const n = cfg.itemsMin + Math.floor(Math.random() * (cfg.itemsMax - cfg.itemsMin + 1));
        const items = mezclar(estado.tilesActivas).slice(0, n).map((clave) => ({ clave, hecho: false }));

        estado.clienteActual = {
            avatar: AVATARES_CLIENTE[Math.floor(Math.random() * AVATARES_CLIENTE.length)],
            items,
            pacienciaTotalMs: cfg.paciencia,
            pacienciaRestanteMs: cfg.paciencia,
            intervaloPaciencia: null,
        };

        renderCliente();
        estado.clienteActual.intervaloPaciencia = setInterval(tickPaciencia, 100);
    }

    function tickPaciencia() {
        const cliente = estado.clienteActual;
        if (!cliente) return;
        cliente.pacienciaRestanteMs -= 100;
        const pct = Math.max(0, (cliente.pacienciaRestanteMs / cliente.pacienciaTotalMs) * 100);
        const relleno = panelCliente.querySelector('.jd-paciencia__relleno');
        if (relleno) relleno.style.width = pct + '%';
        if (cliente.pacienciaRestanteMs <= 0) {
            clienteSeVaDescontento();
        }
    }

    function renderCliente() {
        const cliente = estado.clienteActual;
        if (!cliente) {
            panelCliente.innerHTML = '<p class="jd-cliente__vacio">Esperando al siguiente cliente…</p>';
            return;
        }
        const listaHtml = cliente.items.map((item) => {
            const info = PRODUCTOS_POR_CLAVE.get(item.clave);
            return `<li class="jd-pedido-item ${item.hecho ? 'jd-pedido-item--hecho' : ''}">
                <span aria-hidden="true">${info.icono}</span> ${info.nombre}
                ${item.hecho ? '<span class="jd-pedido-item__check" aria-hidden="true">✔</span>' : ''}
            </li>`;
        }).join('');

        panelCliente.innerHTML = `
            <div class="jd-cliente__fila">
                <span class="jd-cliente__avatar" aria-hidden="true">${cliente.avatar}</span>
                <ul class="jd-pedido-lista">${listaHtml}</ul>
            </div>
            <div class="jd-paciencia">
                <div class="jd-paciencia__relleno" style="width:${(cliente.pacienciaRestanteMs / cliente.pacienciaTotalMs) * 100}%"></div>
            </div>
        `;
    }

    function tocarProducto(clave, boton) {
        if (estado.terminado || !estado.clienteActual) return;
        const item = estado.clienteActual.items.find((it) => it.clave === clave && !it.hecho);

        if (!item) {
            estado.combo = 0;
            flashTile(boton, 'jd-tile--fallo');
            actualizarVista();
            return;
        }

        item.hecho = true;
        estado.combo++;
        estado.comboMaximo = Math.max(estado.comboMaximo, estado.combo);
        estado.puntos += 10 + Math.floor(estado.combo / 3) * 2;
        flashTile(boton, 'jd-tile--acierto');
        renderCliente();
        actualizarVista();

        if (estado.clienteActual.items.every((it) => it.hecho)) {
            clienteContento();
        }
    }

    function flashTile(boton, clase) {
        boton.classList.remove('jd-tile--acierto', 'jd-tile--fallo');
        void boton.offsetWidth;
        boton.classList.add(clase);
        setTimeout(() => boton.classList.remove(clase), 280);
    }

    function clienteContento() {
        clearInterval(estado.clienteActual.intervaloPaciencia);
        estado.clientesAtendidos++;
        panelCliente.classList.add('jd-cliente--contento');
        estado.clienteActual = null;
        actualizarVista();
        comprobarVictoria();
        if (!estado.terminado) {
            temporizadorSiguienteCliente = setTimeout(() => {
                panelCliente.classList.remove('jd-cliente--contento');
                nuevoCliente();
            }, 500);
        }
    }

    function clienteSeVaDescontento() {
        clearInterval(estado.clienteActual.intervaloPaciencia);
        estado.clientesFallados++;
        estado.combo = 0;
        panelCliente.classList.add('jd-cliente--triste');
        estado.clienteActual = null;
        actualizarVista();
        if (!estado.terminado) {
            temporizadorSiguienteCliente = setTimeout(() => {
                panelCliente.classList.remove('jd-cliente--triste');
                nuevoCliente();
            }, 500);
        }
    }

    // ── Vista / progreso ─────────────────────────────────────────────

    function actualizarVista() {
        const cfg = cfgDificultad();
        const pct = Math.min(100, Math.round((estado.clientesAtendidos / cfg.clientesObjetivo) * 100));

        document.getElementById('jd-contador').textContent = `${estado.clientesAtendidos}/${cfg.clientesObjetivo}`;
        document.getElementById('jd-barra-progreso-relleno').style.width = pct + '%';
        document.getElementById('jd-barra-progreso').setAttribute('aria-valuenow', String(pct));
        document.getElementById('jd-tiempo').textContent = formatoTiempo(estado.tiempoRestante);
        document.getElementById('jd-puntos').textContent = String(estado.puntos);
        document.getElementById('jd-combo').textContent = estado.combo > 1 ? `x${estado.combo}` : '—';
    }

    function formatoTiempo(s) {
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r < 10 ? '0' : ''}${r}`;
    }

    function comprobarVictoria() {
        const cfg = cfgDificultad();
        if (estado.clientesAtendidos >= cfg.clientesObjetivo) {
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

    document.querySelectorAll('.jd-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jd-chip-dificultad').forEach((b) => {
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

    function pararTemporizadoresCliente() {
        if (estado.clienteActual) clearInterval(estado.clienteActual.intervaloPaciencia);
        clearTimeout(temporizadorSiguienteCliente);
    }

    function nuevaPartida() {
        clearInterval(temporizadorTurno);
        pararTemporizadoresCliente();

        const cfg = cfgDificultad();
        estado.clienteActual = null;
        estado.clientesAtendidos = 0;
        estado.clientesFallados = 0;
        estado.puntos = 0;
        estado.combo = 0;
        estado.comboMaximo = 0;
        estado.tiempoRestante = cfg.tiempoTotal;
        estado.terminado = false;

        document.getElementById('jd-celebracion-overlay').hidden = true;
        document.getElementById('jd-pista').style.display = '';
        panelCliente.classList.remove('jd-cliente--contento', 'jd-cliente--triste');

        construirEstanteria();
        actualizarVista();
        nuevoCliente();

        temporizadorTurno = setInterval(tick, 1000);
    }

    function finalizarPartida(completado) {
        if (estado.terminado) return;
        estado.terminado = true;
        clearInterval(temporizadorTurno);
        pararTemporizadoresCliente();
        estado.clienteActual = null;
        renderCliente();

        const cfg = cfgDificultad();
        const pct = Math.min(100, Math.round((estado.clientesAtendidos / cfg.clientesObjetivo) * 100));

        document.getElementById('jd-celebracion-titulo').textContent =
            completado ? '¡Turno completado! 🛎️' : '¡Se acabó el turno!';
        document.getElementById('jd-celebracion-stat').textContent =
            completado
                ? `Atendiste a los ${cfg.clientesObjetivo} clientes — ${estado.puntos} puntos, combo máximo x${estado.comboMaximo}`
                : `Atendiste a ${estado.clientesAtendidos}/${cfg.clientesObjetivo} clientes (${pct}%) — ${estado.puntos} puntos`;

        dibujarResultadoEnCanvas();
        document.getElementById('jd-celebracion-overlay').hidden = false;
        if (completado) lanzarConfeti();
    }

    document.getElementById('jd-boton-reiniciar').addEventListener('click', nuevaPartida);
    document.getElementById('jd-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Celebración final ────────────────────────────────────────────

    function lanzarConfeti() {
        const contenedor = document.getElementById('jd-confeti');
        contenedor.innerHTML = '';
        const colores = ['#25d366', '#3a86ff', '#ffc93c', '#e63946', '#ffffff', '#06d6a0'];
        for (let i = 0; i < 46; i++) {
            const pieza = document.createElement('span');
            pieza.className = 'jd-confeti-pieza';
            pieza.style.left = Math.random() * 100 + '%';
            pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
            pieza.style.animationDelay = (Math.random() * 0.4) + 's';
            contenedor.appendChild(pieza);
        }
    }

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Despacha el Pedido de Orencio Matas y Hnos! 🛎️';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvas = document.getElementById('jd-canvas-resultado');
        const w = 640, h = 360;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        const cfg = cfgDificultad();

        ctx.fillStyle = '#f7f6f4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Despacha el Pedido 🛎️', w / 2, 80);

        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#d91b1b';
        ctx.fillText(String(estado.puntos) + ' pts', w / 2, 170);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#52555a';
        ctx.fillText(`${estado.clientesAtendidos}/${cfg.clientesObjetivo} clientes — combo máximo x${estado.comboMaximo} — ${cfg.nombre}`, w / 2, 220);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvas = document.getElementById('jd-canvas-resultado');
        canvas.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'despacha-el-pedido.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'despacha-el-pedido.png', { type: 'image/png' })],
                        title: 'Despacha el Pedido — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jd-compartir-overlay');
        const enlaceDescargar = document.getElementById('jd-boton-descargar');
        const canvas = document.getElementById('jd-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvas.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jd-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jd-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jd-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jd-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jd-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jd-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jd-compartir-overlay').hidden = true;
    });
    document.getElementById('jd-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jd-compartir-overlay') ev.currentTarget.hidden = true;
    });

    // ── Marcas aleatorias (sin filtrar, al buscador general) ──────────
    // Igual que en Organiza el Almacén: 6 logos al azar de entre todas
    // las marcas, re-sorteados cada vez que se entra a la página.

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
        const cont = document.getElementById('jd-proveedores-grid');
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
