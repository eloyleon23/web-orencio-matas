/**
 * Panel de estadísticas de Espacio Creativo — SOLO en preproducción
 * (GitHub Pages / local, nunca en orenciomatas.es).
 *
 * Muestra un botón flotante que abre una modal con gráficas nativas
 * (barras en HTML/CSS, sin librerías ni servicios externos) de uso
 * real de los minijuegos: partidas jugadas, tiempo medio jugado y
 * conversión al buscador, por juego — a partir de los datos que
 * agrega scripts/estadisticas_juegos.gs (ver también
 * lab/js/estadisticas-juegos.js, que envía los eventos).
 *
 * El acceso pide el PIN — el MISMO PIN que ya usa panel_admin.html,
 * no uno nuevo: se manda tal cual al backend de estadísticas, que lo
 * valida reenviándolo al endpoint de panel_admin.html
 * (panel_validar_pin). Aquí nunca se guarda ni se compara ningún PIN.
 */
(function () {
    'use strict';

    function enProduccion() {
        return window.location.hostname.replace(/^www\./, '') === 'orenciomatas.es';
    }

    if (enProduccion()) return; // Nunca se muestra en el sitio real.

    const NOMBRES_JUEGO = {
        taller: 'Pinta el Coche',
        pinturas: 'Pinta tu Estancia',
        'mezcla-colores': 'Mezcla de Colores',
        limpieza: 'Quita la Mancha',
        insectos: 'Fuera Bichos',
        almacen: 'Organiza el Almacén',
        pedido: 'Despacha el Pedido',
        memoria: 'Encuentra la Pareja',
        clasifica: 'Clasifica por Pasillos',
        apila: 'Apila el Pedido',
        fragancia: 'Atrapa la Fragancia',
        estela: 'La Estela de Color',
        salta: 'Salta y Reparte',
    };

    function nombreJuego(clave) {
        return NOMBRES_JUEGO[clave] || clave;
    }

    function formatearSegundos(s) {
        if (s < 60) return s + ' s';
        const min = Math.floor(s / 60);
        const seg = s % 60;
        return min + ' min' + (seg ? ' ' + seg + ' s' : '');
    }

    function urlBackend() {
        return (window.OMEstadisticasJuegos && window.OMEstadisticasJuegos.URL_BACKEND_ESTADISTICAS) || '';
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

    function mostrarPanelSinConfigurar() {
        const panel = crearOverlay(false);
        const titulo = document.createElement('h2');
        titulo.textContent = 'Estadísticas de Espacio Creativo';
        const texto = document.createElement('p');
        texto.textContent = 'Todavía no hay un backend de estadísticas desplegado. Despliega ' +
            'scripts/estadisticas_juegos.gs como Web App en Google Apps Script (instrucciones ' +
            'en la cabecera del propio archivo) y pega la URL resultante en la constante ' +
            'URL_BACKEND_ESTADISTICAS de lab/js/estadisticas-juegos.js.';
        panel.appendChild(titulo);
        panel.appendChild(texto);
    }

    function mostrarPanelCodigo() {
        if (!urlBackend()) {
            mostrarPanelSinConfigurar();
            return;
        }

        const panel = crearOverlay(false);

        const titulo = document.createElement('h2');
        titulo.textContent = 'Estadísticas de Espacio Creativo';
        const texto = document.createElement('p');
        texto.textContent = 'Solo visible en preproducción. Introduce el PIN (el mismo del Panel OM) para ver las estadísticas.';

        const input = document.createElement('input');
        input.type = 'password';
        input.inputMode = 'numeric';
        input.className = 'om-stats-input';
        input.placeholder = 'PIN';
        input.autocomplete = 'off';

        const error = document.createElement('p');
        error.className = 'om-stats-error';

        const botonEntrar = document.createElement('button');
        botonEntrar.type = 'button';
        botonEntrar.className = 'om-stats-boton';
        botonEntrar.textContent = 'Entrar';

        function intentarEntrar() {
            const pin = input.value.trim();
            if (!pin) return;
            error.textContent = '';
            botonEntrar.disabled = true;
            botonEntrar.textContent = 'Comprobando…';
            cargarEstadisticas(pin)
                .then((datos) => {
                    mostrarPanelEstadisticas(datos, pin);
                })
                .catch((err) => {
                    error.textContent = err.message || 'No se pudo comprobar el PIN.';
                    botonEntrar.disabled = false;
                    botonEntrar.textContent = 'Entrar';
                    input.value = '';
                    input.focus();
                });
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

    function cargarEstadisticas(pin) {
        return fetch(urlBackend(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ accion: 'obtener_estadisticas_juegos', pin }),
        })
            .then((r) => r.json())
            .then((d) => {
                if (!d.success) throw new Error(d.error || 'PIN incorrecto.');
                return d.datos;
            })
            .catch((err) => {
                if (err instanceof Error && err.message) throw err;
                throw new Error('Error de conexión con el backend de estadísticas.');
            });
    }

    function crearTarjetaKpi(etiqueta, valor) {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'om-stats-kpi';
        const v = document.createElement('div');
        v.className = 'om-stats-kpi__valor';
        v.textContent = valor;
        const e = document.createElement('div');
        e.className = 'om-stats-kpi__etiqueta';
        e.textContent = etiqueta;
        tarjeta.appendChild(v);
        tarjeta.appendChild(e);
        return tarjeta;
    }

    // Gráfica de barras horizontales clasificadas (ranked bars): una
    // fila por juego, una sola barra por fila (una magnitud, sin
    // comparar series — no hace falta leyenda), ordenadas de mayor a
    // menor, el valor impreso en la punta de la barra.
    function crearGraficoBarras(titulo, filas, formatearValor) {
        const seccion = document.createElement('section');
        seccion.className = 'om-stats-grafico';

        const h3 = document.createElement('h3');
        h3.className = 'om-stats-grafico__titulo';
        h3.textContent = titulo;
        seccion.appendChild(h3);

        if (!filas.length) {
            const vacio = document.createElement('p');
            vacio.className = 'om-stats-nota';
            vacio.textContent = 'Todavía no hay datos suficientes.';
            seccion.appendChild(vacio);
            return seccion;
        }

        const maxValor = Math.max(1, ...filas.map((f) => f.valor));

        filas.forEach((f) => {
            const valorTexto = formatearValor(f.valor);

            const fila = document.createElement('div');
            fila.className = 'om-stats-barra-fila';
            fila.setAttribute('role', 'img');
            fila.setAttribute('aria-label', f.etiqueta + ': ' + valorTexto);

            const etiqueta = document.createElement('span');
            etiqueta.className = 'om-stats-barra-fila__etiqueta';
            etiqueta.textContent = f.etiqueta;

            const pista = document.createElement('div');
            pista.className = 'om-stats-barra-fila__pista';
            const barra = document.createElement('div');
            barra.className = 'om-stats-barra-fila__barra';
            barra.style.width = Math.max(2, Math.round((f.valor / maxValor) * 100)) + '%';
            pista.appendChild(barra);

            const valor = document.createElement('span');
            valor.className = 'om-stats-barra-fila__valor';
            valor.textContent = valorTexto;

            fila.appendChild(etiqueta);
            fila.appendChild(pista);
            fila.appendChild(valor);
            seccion.appendChild(fila);
        });

        return seccion;
    }

    function mostrarPanelEstadisticas(datos, pin) {
        const panel = crearOverlay(true);

        const titulo = document.createElement('h2');
        titulo.textContent = 'Estadísticas de Espacio Creativo';
        panel.appendChild(titulo);

        const juegos = (datos.juegos || []).slice();
        const tasaConversion = datos.totalPartidas > 0
            ? Math.round((datos.totalConversiones / datos.totalPartidas) * 100)
            : 0;

        const kpis = document.createElement('div');
        kpis.className = 'om-stats-kpis';
        kpis.appendChild(crearTarjetaKpi('Partidas totales', String(datos.totalPartidas || 0)));
        kpis.appendChild(crearTarjetaKpi('Fueron al buscador', String(datos.totalConversiones || 0)));
        kpis.appendChild(crearTarjetaKpi('Tasa de conversión', tasaConversion + '%'));
        panel.appendChild(kpis);

        // El objetivo real: tiempo medio jugado por partida, por
        // juego — no solo quién entra, sino quién se queda jugando.
        const filasTiempo = juegos
            .filter((j) => j.tiempoMedioSegundos > 0)
            .sort((a, b) => b.tiempoMedioSegundos - a.tiempoMedioSegundos)
            .map((j) => ({ etiqueta: nombreJuego(j.juego), valor: j.tiempoMedioSegundos }));
        panel.appendChild(crearGraficoBarras('Tiempo medio jugado por partida', filasTiempo, formatearSegundos));

        // El objetivo de negocio: cuántos acaban yendo al buscador,
        // por juego.
        const filasConversion = juegos
            .filter((j) => j.conversiones > 0)
            .sort((a, b) => b.conversiones - a.conversiones)
            .map((j) => ({ etiqueta: nombreJuego(j.juego), valor: j.conversiones }));
        panel.appendChild(crearGraficoBarras('Conversión al buscador por juego', filasConversion, (v) => String(v)));

        // Contexto: partidas jugadas — por sí solo no basta (ver
        // tiempo medio arriba), pero ayuda a leer los otros dos.
        const filasPartidas = juegos
            .filter((j) => j.partidas > 0)
            .sort((a, b) => b.partidas - a.partidas)
            .map((j) => ({ etiqueta: nombreJuego(j.juego), valor: j.partidas }));
        panel.appendChild(crearGraficoBarras('Partidas jugadas por juego', filasPartidas, (v) => String(v)));

        if (datos.actualizado) {
            const nota = document.createElement('p');
            nota.className = 'om-stats-nota';
            nota.textContent = 'Datos calculados al ' + new Date(datos.actualizado).toLocaleString('es-ES');
            panel.appendChild(nota);
        }

        const botonActualizar = document.createElement('button');
        botonActualizar.type = 'button';
        botonActualizar.className = 'om-stats-boton om-stats-boton--secundario';
        botonActualizar.textContent = 'Actualizar';
        botonActualizar.addEventListener('click', () => {
            botonActualizar.disabled = true;
            botonActualizar.textContent = 'Actualizando…';
            cargarEstadisticas(pin)
                .then((d) => mostrarPanelEstadisticas(d, pin))
                .catch(() => {
                    botonActualizar.disabled = false;
                    botonActualizar.textContent = 'Actualizar';
                });
        });
        panel.appendChild(botonActualizar);
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
