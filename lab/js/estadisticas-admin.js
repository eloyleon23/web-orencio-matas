/**
 * Panel de estadísticas de Espacio Creativo — SOLO en preproducción
 * (GitHub Pages / local, nunca en orenciomatas.es), protegido por un
 * código de acceso simple.
 *
 * Importante: esto es un simple filtro frente a visitantes casuales,
 * NO seguridad real — el código vive en este JS, visible para
 * cualquiera que mire el código fuente de la página. No lo uses para
 * nada que de verdad necesite protegerse; si hiciera falta, habría
 * que moverlo a un backend con autenticación de verdad.
 *
 * Muestra un botón flotante que abre una modal: primero pide el
 * código de acceso, y una vez correcto, un panel donde pegar la URL
 * de inserción ("Insertar informe") de un informe de Looker Studio
 * conectado a la propiedad de GA4 de orenciomatas.es — con los
 * eventos "juego_inicio", "juego_tiempo" y "conversion_buscador" que
 * envían los minijuegos (ver estadisticas-juegos.js). La URL elegida
 * se recuerda en este navegador (localStorage) para no tener que
 * volver a pegarla cada vez.
 */
(function () {
    'use strict';

    // Cambia este código por el que quieras usar.
    const CODIGO_ACCESO = 'espacio-creativo-2026';
    const CLAVE_URL_INFORME = 'om_stats_looker_url';

    function enProduccion() {
        return window.location.hostname.replace(/^www\./, '') === 'orenciomatas.es';
    }

    if (enProduccion()) return; // Nunca se muestra en el sitio real.

    function leerUrlInforme() {
        try {
            return localStorage.getItem(CLAVE_URL_INFORME) || '';
        } catch (err) {
            return '';
        }
    }

    function guardarUrlInforme(url) {
        try {
            localStorage.setItem(CLAVE_URL_INFORME, url);
        } catch (err) {
            // localStorage no disponible — se ignora, solo no se recuerda.
        }
    }

    // Solo se acepta un enlace de inserción de Looker Studio — evita
    // poder cargar cualquier URL arbitraria dentro del iframe.
    function urlInformeValida(url) {
        return /^https:\/\/lookerstudio\.google\.com\/embed\//.test(url);
    }

    let overlayActual = null;

    function cerrarOverlay() {
        if (overlayActual) overlayActual.remove();
        overlayActual = null;
    }

    function crearOverlay(ancho) {
        cerrarOverlay();
        const overlay = document.createElement('div');
        overlay.className = 'om-stats-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) cerrarOverlay();
        });

        const panel = document.createElement('div');
        panel.className = 'om-stats-panel' + (ancho ? ' om-stats-panel--ancho' : '');

        const botonCerrar = document.createElement('button');
        botonCerrar.type = 'button';
        botonCerrar.className = 'om-stats-panel__cerrar';
        botonCerrar.setAttribute('aria-label', 'Cerrar');
        botonCerrar.innerHTML = '&times;';
        botonCerrar.addEventListener('click', cerrarOverlay);

        panel.appendChild(botonCerrar);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        overlayActual = overlay;
        return panel;
    }

    function mostrarPanelCodigo() {
        const panel = crearOverlay(false);

        const titulo = document.createElement('h2');
        titulo.textContent = 'Estadísticas de Espacio Creativo';
        const texto = document.createElement('p');
        texto.textContent = 'Solo visible en preproducción. Introduce el código de acceso para ver el informe.';

        const input = document.createElement('input');
        input.type = 'password';
        input.className = 'om-stats-input';
        input.placeholder = 'Código de acceso';
        input.autocomplete = 'off';

        const error = document.createElement('p');
        error.className = 'om-stats-error';

        const botonEntrar = document.createElement('button');
        botonEntrar.type = 'button';
        botonEntrar.className = 'om-stats-boton';
        botonEntrar.textContent = 'Entrar';

        function intentarEntrar() {
            if (input.value === CODIGO_ACCESO) {
                mostrarPanelInforme();
            } else {
                error.textContent = 'Código incorrecto.';
                input.value = '';
                input.focus();
            }
        }

        botonEntrar.addEventListener('click', intentarEntrar);
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') intentarEntrar();
        });

        panel.appendChild(titulo);
        panel.appendChild(texto);
        panel.appendChild(input);
        panel.appendChild(error);
        panel.appendChild(botonEntrar);

        setTimeout(() => input.focus(), 50);
    }

    function mostrarPanelInforme() {
        const panel = crearOverlay(true);
        const urlGuardada = leerUrlInforme();

        const titulo = document.createElement('h2');
        titulo.textContent = 'Estadísticas de Espacio Creativo';

        if (urlGuardada && urlInformeValida(urlGuardada)) {
            const envoltorio = document.createElement('div');
            envoltorio.className = 'om-stats-iframe-envoltorio';
            const iframe = document.createElement('iframe');
            iframe.src = urlGuardada;
            iframe.loading = 'lazy';
            iframe.title = 'Informe de estadísticas de Espacio Creativo';
            envoltorio.appendChild(iframe);

            const botonCambiar = document.createElement('button');
            botonCambiar.type = 'button';
            botonCambiar.className = 'om-stats-boton om-stats-boton--secundario';
            botonCambiar.textContent = 'Cambiar informe';
            botonCambiar.addEventListener('click', () => mostrarPanelConfigurar());

            panel.appendChild(titulo);
            panel.appendChild(envoltorio);
            panel.appendChild(botonCambiar);
        } else {
            mostrarPanelConfigurar(panel, titulo);
        }
    }

    function mostrarPanelConfigurar(panelExistente, tituloExistente) {
        const panel = panelExistente || crearOverlay(false);
        panel.innerHTML = '';

        const botonCerrar = document.createElement('button');
        botonCerrar.type = 'button';
        botonCerrar.className = 'om-stats-panel__cerrar';
        botonCerrar.setAttribute('aria-label', 'Cerrar');
        botonCerrar.innerHTML = '&times;';
        botonCerrar.addEventListener('click', cerrarOverlay);
        panel.appendChild(botonCerrar);

        const titulo = tituloExistente || document.createElement('h2');
        titulo.textContent = 'Informe de Looker Studio';

        const texto = document.createElement('p');
        texto.textContent = 'Pega aquí la URL de inserción (el enlace que empieza por ' +
            'https://lookerstudio.google.com/embed/...) del informe conectado a GA4. ' +
            'En Looker Studio: Compartir → Insertar informe → copiar el enlace.';

        const input = document.createElement('input');
        input.type = 'url';
        input.className = 'om-stats-input';
        input.placeholder = 'https://lookerstudio.google.com/embed/reporting/...';
        input.value = leerUrlInforme();
        input.autocomplete = 'off';

        const error = document.createElement('p');
        error.className = 'om-stats-error';

        const botonGuardar = document.createElement('button');
        botonGuardar.type = 'button';
        botonGuardar.className = 'om-stats-boton';
        botonGuardar.textContent = 'Guardar y ver informe';
        botonGuardar.addEventListener('click', () => {
            const url = input.value.trim();
            if (!urlInformeValida(url)) {
                error.textContent = 'Tiene que ser un enlace de inserción de Looker Studio (empieza por https://lookerstudio.google.com/embed/).';
                return;
            }
            guardarUrlInforme(url);
            mostrarPanelInforme();
        });

        const nota = document.createElement('p');
        nota.className = 'om-stats-nota';
        nota.textContent = 'Eventos enviados desde los juegos: juego_inicio, juego_tiempo (segundos activos jugados, sin pausas) y conversion_buscador (al aceptar ir al buscador).';

        panel.appendChild(titulo);
        panel.appendChild(texto);
        panel.appendChild(input);
        panel.appendChild(error);
        panel.appendChild(botonGuardar);
        panel.appendChild(nota);

        setTimeout(() => input.focus(), 50);
    }

    function crearBotonFlotante() {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'om-stats-boton-flotante';
        boton.innerHTML = '📊 Estadísticas <span class="om-stats-boton-flotante__etiqueta">preprod</span>';
        boton.addEventListener('click', mostrarPanelCodigo);
        document.body.appendChild(boton);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', crearBotonFlotante);
    } else {
        crearBotonFlotante();
    }
})();
