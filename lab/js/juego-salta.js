/**
 * Salta y Reparte — minijuego (lab/salta.html)
 * Vanilla JS, sin dependencias. Estilo Doodle Jump / Flappy Bird: un
 * operario de almacén salta de plataforma en plataforma hacia arriba
 * recogiendo paquetes, sin caerse. Movimiento horizontal con botones
 * ◀/▶, salto manual con un botón dedicado (no rebote automático al
 * aterrizar) y botón de pausa — el juego puede alargarse bastante
 * cuanto más alto se llega, así que conviene poder pausar.
 *
 * Física y plataformas en coordenadas propias: X en % del ancho de la
 * zona (acotado, el eje horizontal es finito), Y en píxeles CSS reales
 * del "mundo" (el eje vertical es, en la práctica, infinito — se van
 * generando plataformas nuevas por encima y se eliminan las que
 * quedan muy por debajo de la cámara). La cámara (desplazamiento
 * vertical de la zona visible) solo sube, nunca baja, como en el
 * Doodle Jump original.
 */
(function () {
    'use strict';

    // ── Dificultad ───────────────────────────────────────────────────
    // anchoPlataforma: % del ancho de la zona que ocupa cada plataforma
    // (más estrecha, más precisión hace falta). gapYMin/Max: separación
    // vertical en px entre una plataforma y la siguiente (más grande,
    // más difícil de alcanzar saltando). probabilidadMovil: fracción de
    // plataformas que se mueven de lado a lado.
    const DIFICULTADES = {
        facil: {
            nombre: 'Fácil', anchoPlataforma: 26, gapYMin: 70, gapYMax: 105,
            probabilidadPaquete: 0.4, probabilidadMovil: 0, probabilidadObstaculo: 0.08,
        },
        medio: {
            nombre: 'Medio', anchoPlataforma: 19, gapYMin: 90, gapYMax: 125,
            probabilidadPaquete: 0.45, probabilidadMovil: 0.12, probabilidadObstaculo: 0.15,
        },
        dificil: {
            nombre: 'Difícil', anchoPlataforma: 13, gapYMin: 105, gapYMax: 145,
            probabilidadPaquete: 0.5, probabilidadMovil: 0.26, probabilidadObstaculo: 0.22,
        },
    };

    const ANCHO_PLATAFORMA_INICIAL = 36;
    const GRAVEDAD = 0.62; // px/fotograma^2, resta a la velocidad vertical cada fotograma
    const IMPULSO_SALTO = 14.2; // px/fotograma, velocidad vertical al saltar
    const VELOCIDAD_HORIZONTAL = 1.55; // % del ancho de la zona por fotograma
    const ANCHO_JUGADOR_PCT = 11;
    const MARGEN_ATERRIZAJE_PCT = 2.5; // tolerancia extra al comprobar si el jugador pisa la plataforma
    const ALTO_PLATAFORMA_PX = 14; // debe coincidir con "height" de .jz-plataforma en el CSS
    // "Coyote time": las plataformas pueden ser bastante estrechas (13%
    // de ancho en difícil) y el jugador se mueve rápido — manteniendo
    // pulsado un lado se sale del borde de la plataforma en bastante
    // menos de medio segundo. Sin este margen, saltar() rechazaba el
    // salto en cuanto el jugador dejaba de pisar nada, aunque hiciera
    // solo un instante que se había salido del borde — el salto
    // "no funcionaba" al mover y saltar casi a la vez. Con este margen
    // sigue pudiendo saltar un pequeño número de fotogramas después de
    // perder apoyo, como en la mayoría de plataformas.
    const COYOTE_FOTOGRAMAS = 9;
    const UMBRAL_CAMARA = 0.55; // fracción de la altura de la zona a la que se "pega" el jugador al subir
    const PUNTOS_POR_PAQUETE = 15;
    const PUNTOS_POR_BONUS = 35;
    const PROBABILIDAD_BONUS = 0.22; // de los recogibles que aparecen, qué fracción es un bonus en vez de un paquete
    // Objetos bonus — productos de droguería, perfumería y pinturas en
    // vez de paquetes de pedido, con más puntos que un paquete normal.
    const EMOJIS_BONUS = ['🧴', '🎨', '🖌️', '🧼', '🧽', '💐'];

    // ── Hitos de altura: recompensa cada cierta distancia subida, para
    // que la partida no se sienta plana cuanto más dura. ─────────────
    const INTERVALO_HITO_M = 100; // cada cuántos metros se premia
    const PUNTOS_POR_HITO = 50;

    // ── Fondo según la altura: cada 500m cambia de "cielo", de la nave
    // a pie de calle hasta el espacio — puramente decorativo, para que
    // subir se note y no sea siempre la misma pantalla. ──────────────
    const METROS_POR_CIELO = 500;
    const CIELOS = [
        'linear-gradient(180deg, #dce7f5 0%, #eef2f6 100%)', // nave, a pie de planta
        'linear-gradient(180deg, #a9cdf0 0%, #d9ecfb 100%)', // altura media, cielo despejado
        'linear-gradient(180deg, #f3b56a 0%, #fcd9a8 100%)', // atardecer
        'linear-gradient(180deg, #7d5ba6 0%, #c58ec9 100%)', // anochecer
        'linear-gradient(180deg, #1b2a4a 0%, #3c4f7d 100%)', // noche
        'linear-gradient(180deg, #05050f 0%, #1a1a3a 100%)', // espacio
    ];

    // ── Obstáculos: barreras/estanterías que hay que esquivar saltando
    // — no se puede aterrizar en ellas, solo restan puntos si se chocan
    // al atravesarlas (no terminan la partida, para no sumar otra forma
    // de morir encima de la caída al vacío). ─────────────────────────
    const PENALIZACION_OBSTACULO = 15;
    const ANCHO_OBSTACULO_MIN = 20;
    const ANCHO_OBSTACULO_MAX = 36;

    // ── Avatares disponibles ─────────────────────────────────────────
    const CLAVE_AVATAR = 'om_salta_avatar';
    const CLAVE_AVATAR_PERSONALIZADO = 'om_salta_avatar_personalizado';
    const AVATAR_PREDETERMINADO = '👷🏻‍♂️';

    function leerAvatarGuardado() {
        try {
            return localStorage.getItem(CLAVE_AVATAR);
        } catch (err) {
            return null;
        }
    }

    function guardarAvatar(avatar) {
        try {
            localStorage.setItem(CLAVE_AVATAR, avatar);
        } catch (err) {
            // localStorage no disponible — se ignora, simplemente no se recuerda.
        }
    }

    function leerAvatarPersonalizadoGuardado() {
        try {
            return localStorage.getItem(CLAVE_AVATAR_PERSONALIZADO);
        } catch (err) {
            return null;
        }
    }

    function guardarAvatarPersonalizado(avatar) {
        try {
            localStorage.setItem(CLAVE_AVATAR_PERSONALIZADO, avatar);
        } catch (err) {
            // localStorage no disponible — se ignora.
        }
    }

    const estado = {
        dificultad: 'medio',
        avatar: AVATAR_PREDETERMINADO,
        x: 50, // % del ancho de la zona (centro del jugador)
        y: 0, // px del "mundo", pies del jugador
        vy: 0,
        moviendoIzquierda: false,
        moviendoDerecha: false,
        enSuelo: true,
        plataformaActual: null, // la plataforma que pisa ahora mismo, para arrastrarlo si es móvil
        fotogramasSinSuelo: 0, // "coyote time": cuánto hace que se dejó de pisar una plataforma
        cameraY: 0,
        maxYGenerado: 0,
        plataformas: [], // {id, x, y, ancho, movil, rango, centro, velocidad, el, paquete}
        siguienteIdPlataforma: 1,
        obstaculos: [], // {id, x, y, ancho, el, golpeado}
        siguienteIdObstaculo: 1,
        siguienteHitoM: INTERVALO_HITO_M,
        paquetesRecogidos: 0,
        puntos: 0,
        puntosObjetos: 0, // puntos acumulados por paquetes/bonus recogidos (puntos variables, no se recalculan desde un multiplicador fijo)
        alturaMaxima: 0,
        terminado: false,
        jugando: false,
        pausado: false,
    };

    let animacionId = null;
    let zonaAltoPx = 0;
    let zonaAnchoPx = 0;

    const zona = document.getElementById('jz-zona');
    const mundo = document.getElementById('jz-mundo');
    const jugadorEl = document.getElementById('jz-jugador');

    function cfgDificultad() {
        return DIFICULTADES[estado.dificultad];
    }

    function medirZona() {
        const rect = zona.getBoundingClientRect();
        zonaAnchoPx = rect.width || 1;
        zonaAltoPx = rect.height || 1;

        // El tamaño de la caja de .jz-jugador es un % del ancho de la
        // zona (variable según el dispositivo/pantalla completa), pero
        // un emoji no escala solo con el ancho del contenedor — con un
        // font-size fijo en CSS, en pantallas más anchas la caja crecía
        // mucho más que el emoji y el operario quedaba "flotando" muy
        // por encima de donde pisaba de verdad. Se fija aquí el tamaño
        // exacto en px para que el glifo llene la caja en cualquier
        // tamaño de pantalla.
        const anchoJugadorPx = zonaAnchoPx * (ANCHO_JUGADOR_PCT / 100);
        jugadorEl.style.fontSize = Math.round(anchoJugadorPx * 1.05) + 'px';
    }

    let temporizadorResize = null;
    window.addEventListener('resize', () => {
        clearTimeout(temporizadorResize);
        temporizadorResize = setTimeout(medirZona, 120);
    });
    window.addEventListener('orientationchange', () => {
        medirZona();
        setTimeout(medirZona, 300);
    });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            clearTimeout(temporizadorResize);
            temporizadorResize = setTimeout(medirZona, 120);
        });
    }
    document.addEventListener('om-pantalla-completa-cambio', () => {
        medirZona();
        setTimeout(medirZona, 350);
    });

    // ── Plataformas ──────────────────────────────────────────────────

    function crearPlataforma(xIzquierda, y, ancho, movil) {
        const el = document.createElement('div');
        el.className = 'jz-plataforma' + (movil ? ' jz-plataforma--movil' : '');
        el.style.left = xIzquierda + '%';
        el.style.width = ancho + '%';
        mundo.appendChild(el);

        const plataforma = {
            id: estado.siguienteIdPlataforma++,
            x: xIzquierda,
            y,
            ancho,
            movil,
            centro: xIzquierda,
            rango: movil ? 10 + Math.random() * 12 : 0,
            fase: Math.random() * Math.PI * 2,
            el,
            paquete: null,
        };

        const cfg = cfgDificultad();
        if (Math.random() < cfg.probabilidadPaquete) {
            const esBonus = Math.random() < PROBABILIDAD_BONUS;
            const emoji = esBonus ? EMOJIS_BONUS[Math.floor(Math.random() * EMOJIS_BONUS.length)] : '📦';
            const puntos = esBonus ? PUNTOS_POR_BONUS : PUNTOS_POR_PAQUETE;

            const paqueteEl = document.createElement('div');
            paqueteEl.className = 'jz-paquete' + (esBonus ? ' jz-paquete--bonus' : '');
            paqueteEl.textContent = emoji;
            mundo.appendChild(paqueteEl);
            plataforma.paquete = { el: paqueteEl, recogido: false, puntos };
        }

        estado.plataformas.push(plataforma);
        return plataforma;
    }

    // Obstáculos a mitad de camino entre una plataforma y la siguiente
    // (justo por donde pasa el salto) — se saltan los primeros metros
    // para dar un arranque tranquilo, sin nada que esquivar de golpe.
    const ALTURA_SIN_OBSTACULOS = 250;

    function crearObstaculo(y) {
        const ancho = ANCHO_OBSTACULO_MIN + Math.random() * (ANCHO_OBSTACULO_MAX - ANCHO_OBSTACULO_MIN);
        const xIzquierda = Math.random() * (100 - ancho);

        const el = document.createElement('div');
        el.className = 'jz-obstaculo';
        el.style.left = xIzquierda + '%';
        el.style.width = ancho + '%';
        const icono = document.createElement('span');
        icono.className = 'jz-obstaculo__icono';
        icono.textContent = '🚧';
        el.appendChild(icono);
        mundo.appendChild(el);

        const obstaculo = { id: estado.siguienteIdObstaculo++, x: xIzquierda, y, ancho, el, golpeado: false };
        estado.obstaculos.push(obstaculo);
        return obstaculo;
    }

    function generarSiguientesPlataformas() {
        const cfg = cfgDificultad();
        const limite = estado.cameraY + zonaAltoPx * 1.6;
        while (estado.maxYGenerado < limite) {
            const gap = cfg.gapYMin + Math.random() * (cfg.gapYMax - cfg.gapYMin);
            const y = estado.maxYGenerado + gap;
            const ancho = cfg.anchoPlataforma;
            const xIzquierda = Math.random() * (100 - ancho);
            const movil = Math.random() < cfg.probabilidadMovil;
            crearPlataforma(xIzquierda, y, ancho, movil);

            if (y > ALTURA_SIN_OBSTACULOS && Math.random() < cfg.probabilidadObstaculo) {
                crearObstaculo(estado.maxYGenerado + gap / 2);
            }

            estado.maxYGenerado = y;
        }
    }

    function eliminarPlataformasLejanas() {
        const umbral = estado.cameraY - 120;
        for (let i = estado.plataformas.length - 1; i >= 0; i--) {
            const p = estado.plataformas[i];
            if (p.y < umbral) {
                p.el.remove();
                if (p.paquete) p.paquete.el.remove();
                estado.plataformas.splice(i, 1);
            }
        }
        for (let i = estado.obstaculos.length - 1; i >= 0; i--) {
            const o = estado.obstaculos[i];
            if (o.y < umbral) {
                o.el.remove();
                estado.obstaculos.splice(i, 1);
            }
        }
    }

    function actualizarPlataformasMoviles() {
        estado.plataformas.forEach((p) => {
            if (!p.movil) return;
            const xAntes = p.x;
            p.fase += 0.018;
            p.x = p.centro + Math.sin(p.fase) * p.rango;
            if (p.x < 0) p.x = 0;
            if (p.x > 100 - p.ancho) p.x = 100 - p.ancho;
            p.el.style.left = p.x + '%';
            // Si el operario está de pie sobre esta plataforma, se
            // mueve con ella — si no, se quedaría clavado en el sitio
            // mientras la plataforma se desliza por debajo.
            if (estado.enSuelo && estado.plataformaActual === p) {
                estado.x += p.x - xAntes;
            }
            if (p.paquete && !p.paquete.recogido) posicionarPaquete(p);
        });
    }

    function posicionarPaquete(p) {
        p.paquete.el.style.left = (p.x + p.ancho / 2) + '%';
        p.paquete.el.style.bottom = (p.y - estado.cameraY + 16) + 'px';
    }

    // ── Dibujado ─────────────────────────────────────────────────────

    function dibujar() {
        estado.plataformas.forEach((p) => {
            p.el.style.bottom = (p.y - estado.cameraY) + 'px';
            p.el.style.left = p.x + '%';
            if (p.paquete && !p.paquete.recogido) posicionarPaquete(p);
        });

        estado.obstaculos.forEach((o) => {
            o.el.style.bottom = (o.y - estado.cameraY) + 'px';
        });

        // + ALTO_PLATAFORMA_PX: estado.y es la altura "lógica" de la
        // plataforma (una línea sin grosor a efectos de colisión),
        // pero la plataforma se dibuja con su superficie superior
        // ALTO_PLATAFORMA_PX por encima de su propio "bottom" — sin
        // sumarlo aquí, los pies del operario quedaban a la altura
        // del borde INFERIOR de la plataforma, hundidos en ella.
        jugadorEl.style.left = estado.x + '%';
        jugadorEl.style.bottom = (estado.y - estado.cameraY + ALTO_PLATAFORMA_PX) + 'px';
        jugadorEl.classList.toggle('jz-jugador--cayendo', estado.vy < -2);
        jugadorEl.classList.toggle('jz-jugador--saltando', estado.vy > 2);
    }

    // ── Controles ────────────────────────────────────────────────────

    function alPulsarMover(ev) {
        ev.preventDefault();
        const dir = ev.currentTarget.dataset.dir;
        if (dir === '-1') estado.moviendoIzquierda = true;
        else estado.moviendoDerecha = true;
    }
    function alSoltarMover(ev) {
        const dir = ev.currentTarget.dataset.dir;
        if (dir === '-1') estado.moviendoIzquierda = false;
        else estado.moviendoDerecha = false;
    }

    // { passive: false } + preventDefault(): sin esto, en algunos
    // navegadores móviles un segundo dedo tocando OTRO botón mientras
    // ya hay un dedo pulsado en este (manteniendo el movimiento) podía
    // hacer que el navegador interpretase ambos toques como el inicio
    // de un gesto propio (desplazamiento, zoom) y se "comiera" el
    // segundo toque en vez de entregarlo al botón — así que saltar()
    // nunca llegaba a llamarse aunque pareciera que se había pulsado.
    document.querySelectorAll('.jz-boton-mover').forEach((boton) => {
        boton.addEventListener('pointerdown', alPulsarMover, { passive: false });
        boton.addEventListener('pointerup', alSoltarMover);
        boton.addEventListener('pointercancel', alSoltarMover);
        boton.addEventListener('pointerleave', alSoltarMover);
    });

    function saltar() {
        if (estado.terminado || !estado.jugando || estado.pausado) return;
        if (estado.fotogramasSinSuelo > COYOTE_FOTOGRAMAS) return;
        estado.vy = IMPULSO_SALTO;
        estado.enSuelo = false;
        estado.plataformaActual = null;
        estado.fotogramasSinSuelo = COYOTE_FOTOGRAMAS + 1; // evita un segundo salto "de cortesía" inmediato
    }

    const botonSaltar = document.getElementById('jz-boton-saltar');
    // "pointerdown" en vez de (o además de) "click": responde en el
    // instante del toque, sin esperar a un ciclo completo de
    // pulsar+soltar sobre el mismo botón — más fiable cuando ya hay
    // otro dedo pulsado en un botón de movimiento. Se deja también
    // "click" para que funcione con teclado (Intro/Espacio con el
    // botón enfocado); saltar() ya es seguro llamarlo dos veces
    // seguidas (la segunda no hace nada, por el margen de coyote
    // time ya consumido).
    botonSaltar.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        saltar();
    }, { passive: false });
    botonSaltar.addEventListener('click', saltar);

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowLeft') estado.moviendoIzquierda = true;
        else if (ev.key === 'ArrowRight') estado.moviendoDerecha = true;
        else if (ev.key === 'ArrowUp' || ev.key === ' ' || ev.key === 'Spacebar') {
            ev.preventDefault();
            saltar();
        }
    });
    document.addEventListener('keyup', (ev) => {
        if (ev.key === 'ArrowLeft') estado.moviendoIzquierda = false;
        else if (ev.key === 'ArrowRight') estado.moviendoDerecha = false;
    });

    // ── Pausa ────────────────────────────────────────────────────────

    function actualizarBotonPausa() {
        const boton = document.getElementById('jz-boton-pausa');
        const puedePausar = estado.jugando && !estado.terminado;
        boton.disabled = !puedePausar;
        boton.textContent = (estado.pausado || !puedePausar ? '▶' : '⏸') + '︎';
        boton.setAttribute('aria-label', estado.pausado ? 'Reanudar' : 'Pausar');
    }

    function mostrarIndicadorPausa(mostrar) {
        document.getElementById('jz-pausado-indicador').hidden = !mostrar;
    }

    function pausar() {
        if (!estado.jugando || estado.terminado || estado.pausado) return;
        estado.pausado = true;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPausa();
        if (animacionId) cancelAnimationFrame(animacionId);
        animacionId = null;
        actualizarBotonPausa();
        mostrarIndicadorPausa(true);
    }

    function reanudar() {
        if (!estado.jugando || estado.terminado || !estado.pausado) return;
        estado.pausado = false;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarReanudacion();
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();
        animacionId = requestAnimationFrame(frame);
    }

    function alternarPausa() {
        if (estado.pausado) reanudar();
        else pausar();
    }

    document.getElementById('jz-boton-pausa').addEventListener('click', alternarPausa);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && estado.jugando && !estado.terminado && !estado.pausado) pausar();
    });

    // ── Bucle principal ──────────────────────────────────────────────

    function comprobarRecogidaPaquetes() {
        estado.plataformas.forEach((p) => {
            if (!p.paquete || p.paquete.recogido) return;
            const centroJugador = estado.x;
            const centroPaquete = p.x + p.ancho / 2;
            const distanciaX = Math.abs(centroJugador - centroPaquete);
            const distanciaY = Math.abs(estado.y - (p.y + 16));
            if (distanciaX <= ANCHO_JUGADOR_PCT && distanciaY <= 20) {
                p.paquete.recogido = true;
                p.paquete.el.classList.add('jz-paquete--recogido');
                setTimeout(() => p.paquete.el.remove(), 300);
                estado.paquetesRecogidos++;
                estado.puntosObjetos += p.paquete.puntos;
                mostrarFlotante('+' + p.paquete.puntos, centroPaquete, p.y + 16 - estado.cameraY);
            }
        });
    }

    function mostrarFlotante(texto, xPct, yPx, negativo) {
        const el = document.createElement('span');
        el.className = 'jz-flotante' + (negativo ? ' jz-flotante--negativo' : '');
        el.textContent = texto;
        el.style.left = xPct + '%';
        el.style.bottom = yPx + 'px';
        zona.appendChild(el);
        setTimeout(() => el.remove(), 650);
    }

    // Los obstáculos no se pueden pisar ni terminan la partida al
    // chocar — solo restan puntos una vez cada uno (golpeado=true),
    // igual que al revés de recoger un paquete. Se detecta el choque
    // comprobando si el tramo vertical recorrido este fotograma
    // (entre el pie anterior y el actual, en cualquier dirección,
    // subiendo o cayendo) atraviesa la altura del obstáculo, con
    // solape en X contra el ancho del jugador.
    function comprobarObstaculos(pieAnterior) {
        const mitadJugador = ANCHO_JUGADOR_PCT / 2;
        const izqJugador = estado.x - mitadJugador;
        const derJugador = estado.x + mitadJugador;
        const yMin = Math.min(pieAnterior, estado.y);
        const yMax = Math.max(pieAnterior, estado.y);
        estado.obstaculos.forEach((o) => {
            if (o.golpeado) return;
            if (o.y < yMin || o.y > yMax) return;
            const solapaX = derJugador >= o.x && izqJugador <= o.x + o.ancho;
            if (!solapaX) return;

            o.golpeado = true;
            o.el.classList.add('jz-obstaculo--golpeado');
            estado.puntosObjetos = Math.max(0, estado.puntosObjetos - PENALIZACION_OBSTACULO);
            mostrarFlotante('-' + PENALIZACION_OBSTACULO, estado.x, o.y - estado.cameraY, true);
            // No se toca estado.vy: frenar la velocidad vertical al
            // chocar cortaba en seco el impulso del salto a mitad de
            // trayectoria (sobre todo si se chocaba nada más saltar),
            // haciendo que el jugador se quedara corto de la siguiente
            // plataforma y cayera al vacío aunque el salto, a ojos del
            // jugador, iba bien encaminado. El golpe solo debe doler en
            // puntos, nunca sabotear la física del salto.

            jugadorEl.classList.add('jz-jugador--golpeado');
            setTimeout(() => jugadorEl.classList.remove('jz-jugador--golpeado'), 350);
        });
    }

    // ── Hitos de altura y fondo según la altura ───────────────────────

    let temporizadorLogro = null;
    function mostrarLogro(texto) {
        const el = document.getElementById('jz-logro');
        el.textContent = texto;
        el.hidden = false;
        el.classList.remove('jz-logro--mostrar');
        void el.offsetWidth; // fuerza el reinicio de la animación si ya estaba mostrándose
        el.classList.add('jz-logro--mostrar');
        clearTimeout(temporizadorLogro);
        temporizadorLogro = setTimeout(() => { el.hidden = true; }, 1800);
    }

    function comprobarHitoAltura() {
        const metros = Math.floor(estado.alturaMaxima / 10);
        if (metros < estado.siguienteHitoM) return;
        estado.puntosObjetos += PUNTOS_POR_HITO;
        mostrarLogro('¡' + estado.siguienteHitoM + ' m! +' + PUNTOS_POR_HITO);
        estado.siguienteHitoM += INTERVALO_HITO_M;
    }

    function actualizarCielo() {
        const metros = Math.floor(estado.alturaMaxima / 10);
        const indice = Math.min(Math.floor(metros / METROS_POR_CIELO), CIELOS.length - 1);
        zona.style.background = CIELOS[indice];
    }

    function frame() {
        if (estado.terminado || !estado.jugando || estado.pausado) return;

        if (estado.moviendoIzquierda) estado.x -= VELOCIDAD_HORIZONTAL;
        if (estado.moviendoDerecha) estado.x += VELOCIDAD_HORIZONTAL;
        if (estado.x < 0) estado.x += 100; // envuelve por los bordes, como el Doodle Jump original
        if (estado.x > 100) estado.x -= 100;

        const pieAnterior = estado.y;
        estado.vy -= GRAVEDAD;
        estado.y += estado.vy;

        // Se reinicia cada fotograma y solo se vuelve a poner a true si
        // el bucle de abajo encuentra una plataforma que lo sostenga
        // — si no, se detecta aquí mismo que se ha caído de la
        // plataforma (por ejemplo, al salirse del borde andando sin
        // saltar), en vez de quedarse "en el suelo" a medias.
        estado.enSuelo = false;

        if (estado.vy < 0) {
            for (let i = 0; i < estado.plataformas.length; i++) {
                const p = estado.plataformas[i];
                if (p.y > pieAnterior || p.y < estado.y) continue;
                const mitadJugador = ANCHO_JUGADOR_PCT / 2;
                const izqJugador = estado.x - mitadJugador;
                const derJugador = estado.x + mitadJugador;
                const solapa = derJugador >= (p.x - MARGEN_ATERRIZAJE_PCT) && izqJugador <= (p.x + p.ancho + MARGEN_ATERRIZAJE_PCT);
                if (solapa) {
                    estado.y = p.y;
                    estado.vy = 0;
                    estado.enSuelo = true;
                    estado.plataformaActual = p;
                    break;
                }
            }
        }
        if (!estado.enSuelo) estado.plataformaActual = null;
        estado.fotogramasSinSuelo = estado.enSuelo ? 0 : estado.fotogramasSinSuelo + 1;

        comprobarObstaculos(pieAnterior);

        if (estado.y > estado.alturaMaxima) {
            estado.alturaMaxima = estado.y;
            actualizarCielo();
            comprobarHitoAltura();
        }

        const objetivoCamara = estado.y - zonaAltoPx * UMBRAL_CAMARA;
        if (objetivoCamara > estado.cameraY) estado.cameraY = objetivoCamara;

        actualizarPlataformasMoviles();
        comprobarRecogidaPaquetes();
        generarSiguientesPlataformas();
        eliminarPlataformasLejanas();
        dibujar();

        // Importante: la comprobación es relativa a la PANTALLA (y -
        // cameraY, lo mismo que se usa para pintar "bottom"), no al
        // valor bruto de cameraY — cameraY ya está medio-monitor por
        // debajo del punto más alto alcanzado (ver UMBRAL_CAMARA), así
        // que comparar estado.y directamente contra él dejaba caer al
        // jugador bastante más de media pantalla fuera de la vista
        // antes de terminar la partida.
        const yEnPantalla = estado.y - estado.cameraY;
        if (yEnPantalla < -60) {
            finalizarPartida();
            return;
        }

        actualizarVista();
        animacionId = requestAnimationFrame(frame);
    }

    // ── Vista / progreso ─────────────────────────────────────────────

    function puntosTotales() {
        // Los puntos por objetos recogidos (paquetes o bonus, con
        // valores distintos cada uno) ya se acumulan al recogerlos en
        // estado.puntosObjetos — aquí solo se le suma la parte que sí
        // cambia sola con el tiempo: la altura alcanzada.
        return Math.floor(estado.alturaMaxima / 8) + estado.puntosObjetos;
    }

    function actualizarVista() {
        estado.puntos = puntosTotales();
        document.getElementById('jz-altura').textContent = Math.floor(estado.alturaMaxima / 10) + ' m';
        document.getElementById('jz-paquetes').textContent = String(estado.paquetesRecogidos);
        document.getElementById('jz-puntos').textContent = String(estado.puntos);
    }

    // ── Dificultad ───────────────────────────────────────────────────

    document.querySelectorAll('.jz-chip-dificultad').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (boton.classList.contains('is-activo')) return;
            document.querySelectorAll('.jz-chip-dificultad').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.dificultad = boton.dataset.dificultad;
            nuevaPartida();
        });
    });

    // ── Avatar ───────────────────────────────────────────────────────
    // Elegir avatar no reinicia la partida en curso — el cambio se ve
    // al momento (el emoji del jugador se actualiza ya mismo) y, si
    // se cae y se empieza de nuevo, ya sale con el avatar elegido.

    function elegirAvatar(avatar, guardar) {
        estado.avatar = avatar;
        jugadorEl.textContent = avatar;
        document.querySelectorAll('.jz-chip-avatar').forEach((b) => {
            const activo = b.dataset.avatar === avatar;
            b.classList.toggle('is-activo', activo);
            b.setAttribute('aria-checked', String(activo));
        });
        if (guardar) guardarAvatar(avatar);
    }

    // El botón "+" también lleva la clase base .jz-chip-avatar (para
    // heredar el mismo estilo de chip), pero no tiene data-avatar — se
    // excluye aquí para que no dispare elegirAvatar(undefined, ...); su
    // propio comportamiento (abrir el selector) se añade más abajo.
    document.querySelectorAll('.jz-chip-avatar:not(.jz-chip-avatar--anadir)').forEach((boton) => {
        boton.addEventListener('click', () => elegirAvatar(boton.dataset.avatar, true));
    });

    // ── Avatar personalizado (cualquier emoji) ────────────────────────

    const selectorAvatares = document.querySelector('.jz-selector-avatar');
    const botonAnadirAvatar = document.getElementById('jz-boton-avatar-personalizado');
    const overlayAvatar = document.getElementById('jz-avatar-overlay');
    const inputAvatar = document.getElementById('jz-avatar-input');

    function insertarChipAvatarPersonalizado(avatar) {
        let chip = selectorAvatares.querySelector('.jz-chip-avatar[data-personalizado]');
        if (!chip) {
            chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'jz-chip-avatar';
            chip.setAttribute('role', 'radio');
            chip.setAttribute('aria-checked', 'false');
            chip.dataset.personalizado = '1';
            chip.addEventListener('click', () => elegirAvatar(chip.dataset.avatar, true));
            selectorAvatares.insertBefore(chip, botonAnadirAvatar);
        }
        chip.dataset.avatar = avatar;
        chip.textContent = avatar;
        chip.title = 'Tu emoji';
        chip.setAttribute('aria-label', 'Tu emoji personalizado');
        return chip;
    }

    function abrirSelectorAvatarPersonalizado() {
        inputAvatar.value = '';
        overlayAvatar.hidden = false;
        setTimeout(() => inputAvatar.focus(), 50);
    }

    function cerrarSelectorAvatarPersonalizado() {
        overlayAvatar.hidden = true;
    }

    botonAnadirAvatar.addEventListener('click', abrirSelectorAvatarPersonalizado);
    document.getElementById('jz-avatar-cerrar').addEventListener('click', cerrarSelectorAvatarPersonalizado);
    overlayAvatar.addEventListener('click', (ev) => {
        if (ev.target === overlayAvatar) cerrarSelectorAvatarPersonalizado();
    });
    document.getElementById('jz-avatar-usar').addEventListener('click', () => {
        const valor = inputAvatar.value.trim();
        if (!valor) return;
        insertarChipAvatarPersonalizado(valor);
        guardarAvatarPersonalizado(valor);
        elegirAvatar(valor, true);
        cerrarSelectorAvatarPersonalizado();
    });

    // Si ya había un emoji personalizado guardado, se restaura el chip
    // ANTES de elegirAvatar() de abajo, para que pueda marcarse como
    // activo si era el último elegido.
    const avatarPersonalizadoGuardado = leerAvatarPersonalizadoGuardado();
    if (avatarPersonalizadoGuardado) insertarChipAvatarPersonalizado(avatarPersonalizadoGuardado);

    elegirAvatar(leerAvatarGuardado() || AVATAR_PREDETERMINADO, false);

    // ── Partida ──────────────────────────────────────────────────────

    function limpiarMundo() {
        estado.plataformas.forEach((p) => {
            p.el.remove();
            if (p.paquete) p.paquete.el.remove();
        });
        estado.plataformas = [];
        estado.obstaculos.forEach((o) => o.el.remove());
        estado.obstaculos = [];
        zona.querySelectorAll('.jz-flotante').forEach((el) => el.remove());
    }

    function nuevaPartida() {
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarPartida('salta');
        if (animacionId) cancelAnimationFrame(animacionId);
        limpiarMundo();
        medirZona();

        estado.x = 50;
        estado.y = 0;
        estado.vy = 0;
        estado.moviendoIzquierda = false;
        estado.moviendoDerecha = false;
        estado.enSuelo = true;
        estado.fotogramasSinSuelo = 0;
        estado.cameraY = 0;
        estado.maxYGenerado = 0;
        estado.siguienteIdPlataforma = 1;
        estado.siguienteIdObstaculo = 1;
        estado.siguienteHitoM = INTERVALO_HITO_M;
        estado.paquetesRecogidos = 0;
        estado.puntos = 0;
        estado.puntosObjetos = 0;
        estado.alturaMaxima = 0;
        estado.terminado = false;
        estado.jugando = true;
        estado.pausado = false;
        zona.style.background = CIELOS[0];

        estado.plataformaActual = crearPlataforma(50 - ANCHO_PLATAFORMA_INICIAL / 2, 0, ANCHO_PLATAFORMA_INICIAL, false);
        estado.maxYGenerado = 0;
        generarSiguientesPlataformas();

        document.getElementById('jz-celebracion-overlay').hidden = true;
        document.getElementById('jz-pista').style.display = '';
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();

        dibujar();
        actualizarVista();
        animacionId = requestAnimationFrame(frame);
    }

    function finalizarPartida() {
        if (estado.terminado) return;
        estado.terminado = true;
        if (window.OMEstadisticasJuegos) window.OMEstadisticasJuegos.registrarFinPartida('salta');
        estado.jugando = false;
        estado.pausado = false;
        if (animacionId) cancelAnimationFrame(animacionId);
        mostrarIndicadorPausa(false);
        actualizarBotonPausa();

        const metros = Math.floor(estado.alturaMaxima / 10);
        document.getElementById('jz-celebracion-titulo').textContent = '¡Te has caído!';
        document.getElementById('jz-celebracion-stat').textContent =
            `Subiste ${metros} m y recogiste ${estado.paquetesRecogidos} paquetes — ${estado.puntos} puntos`;

        dibujarResultadoEnCanvas();
        document.getElementById('jz-celebracion-overlay').hidden = false;
    }

    document.getElementById('jz-boton-reiniciar').addEventListener('click', (ev) => {
        ev.stopPropagation();
        nuevaPartida();
    });
    document.getElementById('jz-boton-jugar-de-nuevo').addEventListener('click', nuevaPartida);

    // ── Compartir ─────────────────────────────────────────────────────

    const TEXTO_COMPARTIR = '¡He jugado a Salta y Reparte de Orencio Matas y Hnos! 🦘';
    const URL_SITIO = window.location.href;

    function dibujarResultadoEnCanvas() {
        const canvasR = document.getElementById('jz-canvas-resultado');
        const w = 640, h = 360;
        canvasR.width = w;
        canvasR.height = h;
        const ctxR = canvasR.getContext('2d');
        const metros = Math.floor(estado.alturaMaxima / 10);

        ctxR.fillStyle = '#f2f6fb';
        ctxR.fillRect(0, 0, w, h);
        ctxR.fillStyle = '#1a1a1a';
        ctxR.font = 'bold 26px sans-serif';
        ctxR.textAlign = 'center';
        ctxR.fillText('Salta y Reparte 🦘', w / 2, 80);

        ctxR.font = 'bold 48px sans-serif';
        ctxR.fillStyle = '#1e4b8f';
        ctxR.fillText(metros + ' m', w / 2, 170);

        ctxR.font = '20px sans-serif';
        ctxR.fillStyle = '#52555a';
        ctxR.fillText(`${estado.paquetesRecogidos} paquetes — ${estado.puntos} puntos — ${cfgDificultad().nombre}`, w / 2, 220);
    }

    async function compartir() {
        dibujarResultadoEnCanvas();
        const canvasR = document.getElementById('jz-canvas-resultado');
        canvasR.toBlob(async (blob) => {
            if (!blob) return abrirPanelCompartir(null);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'salta-y-reparte.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'salta-y-reparte.png', { type: 'image/png' })],
                        title: 'Salta y Reparte — Orencio Matas y Hnos',
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
        const overlay = document.getElementById('jz-compartir-overlay');
        const enlaceDescargar = document.getElementById('jz-boton-descargar');
        const canvasR = document.getElementById('jz-canvas-resultado');

        if (blob) {
            enlaceDescargar.href = URL.createObjectURL(blob);
        } else {
            enlaceDescargar.href = canvasR.toDataURL('image/png');
        }

        const texto = encodeURIComponent(TEXTO_COMPARTIR + ' ' + URL_SITIO);
        document.getElementById('jz-enlace-whatsapp').href = `https://wa.me/?text=${texto}`;
        document.getElementById('jz-enlace-x').href = `https://twitter.com/intent/tweet?text=${texto}`;
        document.getElementById('jz-enlace-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_SITIO)}`;

        overlay.hidden = false;
    }

    document.getElementById('jz-boton-compartir').addEventListener('click', compartir);
    document.getElementById('jz-boton-compartir-final').addEventListener('click', compartir);
    document.getElementById('jz-compartir-cerrar').addEventListener('click', () => {
        document.getElementById('jz-compartir-overlay').hidden = true;
    });
    document.getElementById('jz-compartir-overlay').addEventListener('click', (ev) => {
        if (ev.target.id === 'jz-compartir-overlay') ev.currentTarget.hidden = true;
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
        const cont = document.getElementById('jz-proveedores-grid');
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
