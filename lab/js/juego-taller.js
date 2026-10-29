/**
 * El Pintor de Carrocería — lógica de la PoC (lab/taller.html).
 * Vanilla JS, sin dependencias externas. Todo el estado vive en este
 * archivo; el SVG de cada vehículo se construye e inyecta por completo
 * al cambiar de modelo, así las capas #carroceria/#llantas/#cristales/
 * #sombras-relieve son siempre un único elemento válido en el DOM (en
 * vez de IDs duplicados ocultando el vehículo no activo).
 */
(function () {
    'use strict';

    // ── Estado ──────────────────────────────────────────────────────────
    const estado = {
        vehiculo: 'turismo',
        acabado: 'brillo',
        color: '#f3f1ea',
        colorNombre: 'Blanco perlado',
    };

    const NOMBRES_VEHICULO = {
        turismo: 'Turismo compacto',
        furgoneta: 'Furgoneta comercial / reparto',
    };

    const NOMBRES_ACABADO = {
        brillo: 'Brillo clásico',
        metalizado: 'Metalizado',
        mate: 'Mate',
    };

    // Consumo orientativo de materiales por vehículo — cifras de
    // referencia para la PoC, no un presupuesto real (se indica también
    // en el texto de la ficha y en la nota bajo ella).
    const FICHA_TECNICA = {
        turismo: { bicapa: 2.5, barniz: 1.2 },
        furgoneta: { bicapa: 4.0, barniz: 1.8 },
    };

    // ── Utilidades de color ─────────────────────────────────────────────

    function hexAInt(hex) {
        return parseInt(hex.replace('#', ''), 16);
    }

    // factor > 0 aclara hacia blanco, factor < 0 oscurece hacia negro.
    // factor en [-1, 1].
    function ajustarBrillo(hex, factor) {
        const num = hexAInt(hex);
        let r = (num >> 16) & 0xff;
        let g = (num >> 8) & 0xff;
        let b = num & 0xff;
        const destino = factor > 0 ? 255 : 0;
        const f = Math.abs(factor);
        r = Math.round(r + (destino - r) * f);
        g = Math.round(g + (destino - g) * f);
        b = Math.round(b + (destino - b) * f);
        return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    }

    // ── Plantillas SVG de los vehículos ─────────────────────────────────
    // Cada plantilla incluye su propio <defs> (clip-path de la silueta +
    // degradado dinámico para el acabado metalizado) y las 4 capas con
    // los IDs que pide la especificación: #carroceria, #llantas,
    // #cristales y #sombras-relieve (esta última superpuesta a la
    // carrocería con mix-blend-mode, clipada a la silueta exacta
    // reutilizando el mismo path del cuerpo vía <clipPath>+<use>).

    function defsComunes() {
        return `
            <linearGradient id="jt-grad-sombra-inferior" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#000" stop-opacity="0"/>
                <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
            </linearGradient>
            <radialGradient id="jt-grad-brillo-superior" cx="32%" cy="10%" r="65%">
                <stop offset="0%" stop-color="#fff" stop-opacity="0.55"/>
                <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="jt-grad-brillo-diagonal" x1="0%" y1="0%" x2="100%" y2="25%">
                <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
                <stop offset="42%" stop-color="#fff" stop-opacity="0.55"/>
                <stop offset="58%" stop-color="#fff" stop-opacity="0.55"/>
                <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="jt-grad-metalizado-color" x1="0%" y1="0%" x2="100%" y2="20%">
                <stop offset="0%" stop-color="#000"/>
                <stop offset="30%" stop-color="#000"/>
                <stop offset="50%" stop-color="#fff"/>
                <stop offset="70%" stop-color="#000"/>
                <stop offset="100%" stop-color="#000"/>
            </linearGradient>`;
    }

    function capaSombras(idClip) {
        return `
            <g id="sombras-relieve" clip-path="url(#${idClip})">
                <rect class="jt-sombra-capa" x="0" y="0" width="600" height="260" fill="url(#jt-grad-sombra-inferior)"/>
                <ellipse class="jt-brillo-capa" cx="190" cy="40" rx="260" ry="90" fill="url(#jt-grad-brillo-superior)"/>
                <rect class="jt-brillo-capa jt-brillo-metalizado" x="0" y="0" width="600" height="260" fill="url(#jt-grad-brillo-diagonal)"/>
            </g>`;
    }

    function svgTurismo() {
        const bodyPath =
            'M40,172 C40,150 55,140 80,138 C95,108 132,68 176,60 L228,55 ' +
            'C260,49 300,49 330,57 C366,65 392,84 412,110 C432,112 482,118 520,138 ' +
            'C546,148 556,158 556,172 L556,186 C556,196 548,200 538,200 L500,200 ' +
            'C500,178 482,160 460,160 C438,160 420,178 420,200 L220,200 ' +
            'C220,178 202,160 180,160 C158,160 140,178 140,200 L70,200 ' +
            'C54,200 40,190 40,178 Z';

        return `
<svg viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vista lateral de un turismo compacto">
    <defs>
        ${defsComunes()}
        <clipPath id="jt-clip-turismo"><path d="${bodyPath}"/></clipPath>
    </defs>

    <path id="carroceria" d="${bodyPath}" fill="${estado.color}"/>

    ${capaSombras('jt-clip-turismo')}

    <g id="cristales">
        <path d="M172,62 L226,57 L300,56 L344,62 L384,88 L344,96 L226,96 L182,96 L164,86 Z"/>
    </g>

    <g id="llantas">
        <circle cx="180" cy="200" r="40"/>
        <circle class="jt-llanta-centro" cx="180" cy="200" r="16"/>
        <circle cx="460" cy="200" r="40"/>
        <circle class="jt-llanta-centro" cx="460" cy="200" r="16"/>
    </g>
</svg>`;
    }

    function svgFurgoneta() {
        const bodyPath =
            'M40,190 C40,166 55,150 80,148 L90,100 C92,80 106,65 126,60 L166,58 ' +
            'C182,50 200,48 222,48 L480,48 C512,48 536,66 540,96 L540,172 ' +
            'C540,188 530,198 515,198 L480,198 C480,176 462,158 440,158 C418,158 400,176 400,198 L220,198 ' +
            'C220,176 202,158 180,158 C158,158 140,176 140,198 L65,198 ' +
            'C50,198 40,186 40,174 Z';

        return `
<svg viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vista lateral de una furgoneta comercial">
    <defs>
        ${defsComunes()}
        <clipPath id="jt-clip-furgoneta"><path d="${bodyPath}"/></clipPath>
    </defs>

    <path id="carroceria" d="${bodyPath}" fill="${estado.color}"/>

    ${capaSombras('jt-clip-furgoneta')}

    <g id="cristales">
        <path d="M100,68 L122,64 L156,64 L156,140 L112,140 L100,110 Z"/>
        <rect x="232" y="60" width="238" height="80" rx="6"/>
    </g>

    <g id="llantas">
        <circle cx="180" cy="198" r="40"/>
        <circle class="jt-llanta-centro" cx="180" cy="198" r="16"/>
        <circle cx="440" cy="198" r="40"/>
        <circle class="jt-llanta-centro" cx="440" cy="198" r="16"/>
    </g>
</svg>`;
    }

    // ── Render ──────────────────────────────────────────────────────────

    const lienzo = document.getElementById('jt-lienzo-vehiculo');

    function construirGradienteMetalizado(svgRaiz) {
        const grad = svgRaiz.querySelector('#jt-grad-metalizado-color');
        if (!grad) return;
        const oscuro = ajustarBrillo(estado.color, -0.35);
        const claro = ajustarBrillo(estado.color, 0.45);
        const stops = grad.querySelectorAll('stop');
        // orden de paradas: oscuro, oscuro, claro (reflejo), oscuro, oscuro
        stops[0].setAttribute('stop-color', oscuro);
        stops[1].setAttribute('stop-color', oscuro);
        stops[2].setAttribute('stop-color', claro);
        stops[3].setAttribute('stop-color', oscuro);
        stops[4].setAttribute('stop-color', oscuro);
    }

    function aplicarColorYAcabado() {
        const svgRaiz = lienzo.querySelector('svg');
        if (!svgRaiz) return;
        const carroceria = svgRaiz.querySelector('#carroceria');
        const sombras = svgRaiz.querySelector('#sombras-relieve');
        if (!carroceria) return;

        carroceria.classList.remove('acabado-brillo', 'acabado-metalizado', 'acabado-mate');
        carroceria.classList.add('acabado-' + estado.acabado);
        if (sombras) {
            sombras.classList.remove('acabado-brillo', 'acabado-metalizado', 'acabado-mate');
            sombras.classList.add('acabado-' + estado.acabado);
        }

        if (estado.acabado === 'metalizado') {
            construirGradienteMetalizado(svgRaiz);
            carroceria.setAttribute('fill', 'url(#jt-grad-metalizado-color)');
        } else {
            carroceria.setAttribute('fill', estado.color);
        }
    }

    function actualizarFichaTecnica() {
        const base = FICHA_TECNICA[estado.vehiculo];
        const tipoBarniz = estado.acabado === 'mate' ? 'mate' : 'UHS brillante';
        const notaAcabado = estado.acabado === 'metalizado'
            ? ' (incluye capa base metalizada)'
            : '';
        const texto = `Consumo estimado: ${base.bicapa.toFixed(1)} L de pintura bicapa${notaAcabado} ` +
            `+ ${base.barniz.toFixed(1)} L de barniz ${tipoBarniz}.`;
        document.getElementById('jt-ficha-tecnica__texto').textContent = texto;
        return texto;
    }

    function actualizarTextoResumen() {
        document.getElementById('jt-texto-acabado').textContent = NOMBRES_ACABADO[estado.acabado];
        document.getElementById('jt-texto-color').textContent = estado.colorNombre;
    }

    function renderVehiculo() {
        lienzo.innerHTML = estado.vehiculo === 'turismo' ? svgTurismo() : svgFurgoneta();
        aplicarColorYAcabado();
        actualizarFichaTecnica();
        actualizarTextoResumen();
    }

    // ── Controles: modelo de vehículo ──────────────────────────────────

    document.querySelectorAll('.jt-chip-modelo').forEach((boton) => {
        boton.addEventListener('click', () => {
            document.querySelectorAll('.jt-chip-modelo').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-selected', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-selected', 'true');
            estado.vehiculo = boton.dataset.vehiculo;
            renderVehiculo();
        });
    });

    // ── Controles: acabado ──────────────────────────────────────────────

    document.querySelectorAll('.jt-boton-acabado').forEach((boton) => {
        boton.addEventListener('click', () => {
            document.querySelectorAll('.jt-boton-acabado').forEach((b) => {
                b.classList.remove('is-activo');
                b.setAttribute('aria-checked', 'false');
            });
            boton.classList.add('is-activo');
            boton.setAttribute('aria-checked', 'true');
            estado.acabado = boton.dataset.acabado;
            aplicarColorYAcabado();
            actualizarFichaTecnica();
            actualizarTextoResumen();
        });
    });

    // ── Controles: color ─────────────────────────────────────────────────

    function seleccionarColor(hex, nombre, swatchActivo) {
        estado.color = hex;
        estado.colorNombre = nombre;
        document.querySelectorAll('.jt-swatch').forEach((s) => {
            s.classList.remove('is-activo');
            s.setAttribute('aria-checked', 'false');
        });
        if (swatchActivo) {
            swatchActivo.classList.add('is-activo');
            swatchActivo.setAttribute('aria-checked', 'true');
        }
        aplicarColorYAcabado();
        actualizarTextoResumen();
    }

    document.querySelectorAll('.jt-swatch').forEach((swatch) => {
        swatch.addEventListener('click', () => {
            seleccionarColor(swatch.dataset.color, swatch.dataset.nombre, swatch);
        });
    });

    const inputColorPersonalizado = document.getElementById('jt-color-personalizado');
    inputColorPersonalizado.addEventListener('input', () => {
        seleccionarColor(inputColorPersonalizado.value, 'Personalizado (' + inputColorPersonalizado.value.toUpperCase() + ')', null);
    });

    // ── Modal de contacto ────────────────────────────────────────────────

    const overlay = document.getElementById('jt-modal-overlay');
    const modal = document.getElementById('jt-modal');
    const botonAbrir = document.getElementById('jt-boton-abrir-modal');
    const botonCerrar = document.getElementById('jt-modal-cerrar');
    const form = document.getElementById('jt-form-contacto');
    const estadoForm = document.getElementById('jt-form-estado');
    let elementoConFocoPrevio = null;

    function abrirModal() {
        document.getElementById('jt-modal-vehiculo').textContent = NOMBRES_VEHICULO[estado.vehiculo];
        document.getElementById('jt-modal-acabado').textContent = NOMBRES_ACABADO[estado.acabado].toLowerCase();
        document.getElementById('jt-modal-color').textContent = estado.colorNombre;
        document.getElementById('jt-modal-muestra-color').style.background = estado.color;
        document.getElementById('jt-modal-ficha').textContent = actualizarFichaTecnica();

        const mensaje = document.getElementById('jt-mensaje');
        if (!mensaje.value) {
            mensaje.value = `Hola, me interesa recibir presupuesto de materiales para pintar un ${NOMBRES_VEHICULO[estado.vehiculo]} ` +
                `en acabado ${NOMBRES_ACABADO[estado.acabado].toLowerCase()}, color ${estado.colorNombre} (${estado.color.toUpperCase()}).`;
        }

        elementoConFocoPrevio = document.activeElement;
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
        document.getElementById('jt-nombre').focus();
        document.addEventListener('keydown', alEscapeCerrar);
    }

    function cerrarModal() {
        overlay.hidden = true;
        document.body.style.overflow = '';
        document.removeEventListener('keydown', alEscapeCerrar);
        if (elementoConFocoPrevio) elementoConFocoPrevio.focus();
    }

    function alEscapeCerrar(ev) {
        if (ev.key === 'Escape') cerrarModal();
    }

    botonAbrir.addEventListener('click', abrirModal);
    botonCerrar.addEventListener('click', cerrarModal);
    overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) cerrarModal();
    });

    // Foco atrapado dentro del modal mientras está abierto (accesibilidad
    // básica: Tab no debe poder escapar hacia el contenido de detrás).
    modal.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Tab') return;
        const focusables = modal.querySelectorAll('button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const primero = focusables[0];
        const ultimo = focusables[focusables.length - 1];
        if (ev.shiftKey && document.activeElement === primero) {
            ev.preventDefault();
            ultimo.focus();
        } else if (!ev.shiftKey && document.activeElement === ultimo) {
            ev.preventDefault();
            primero.focus();
        }
    });

    // ── Envío del formulario ──────────────────────────────────────────────
    // PoC: esta es una CONFIRMACIÓN SIMULADA, no un envío real — la
    // acción "enviar_contacto" ya existente en Apps Script (ver
    // scripts/apps_script_trigger.js) exige un campo "email" válido y un
    // token de reCAPTCHA v2 verificado en servidor, y este formulario de
    // prueba pide "teléfono o email" en un único campo libre. Para pasar
    // esta PoC a producción real bastaría con: añadir el widget de
    // reCAPTCHA (mismo sitekey que index.html), separar el campo en
    // nombre/email, y sustituir la simulación de abajo por el mismo
    // fetch() a GOOGLE_APPS_SCRIPT_URL con accion:'enviar_contacto' que
    // ya usa el formulario de contacto de index.html.
    form.addEventListener('submit', (ev) => {
        ev.preventDefault();

        // Honeypot — si un bot rellenó el campo oculto, fingir éxito sin
        // hacer nada más (mismo criterio que el resto del sitio).
        if (document.getElementById('jt-web').value) {
            estadoForm.textContent = '✓ Solicitud enviada. Nos pondremos en contacto contigo pronto.';
            estadoForm.className = 'jt-form__estado es-ok';
            return;
        }

        if (!form.reportValidity()) return;

        const botonEnviar = document.getElementById('jt-boton-enviar');
        botonEnviar.disabled = true;
        botonEnviar.textContent = 'Enviando…';
        estadoForm.textContent = '';
        estadoForm.className = 'jt-form__estado';

        const datos = {
            nombre: document.getElementById('jt-nombre').value.trim(),
            contacto: document.getElementById('jt-contacto').value.trim(),
            empresa: document.getElementById('jt-empresa').value.trim(),
            mensaje: document.getElementById('jt-mensaje').value.trim(),
            vehiculo: estado.vehiculo,
            acabado: estado.acabado,
            color: estado.color,
        };
        console.log('[PoC El Pintor de Carrocería] Solicitud de presupuesto (simulada):', datos);

        setTimeout(() => {
            botonEnviar.disabled = false;
            botonEnviar.textContent = 'Enviar solicitud';
            estadoForm.textContent = '✓ Solicitud enviada correctamente. Nos pondremos en contacto contigo pronto.';
            estadoForm.className = 'jt-form__estado es-ok';
            form.reset();
            setTimeout(cerrarModal, 1400);
        }, 700);
    });

    // ── Arranque ───────────────────────────────────────────────────────
    renderVehiculo();
})();
