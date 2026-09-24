/**
 * Modo mantenimiento — comprobación en vivo (sin ningún redespliegue)
 * para poder desactivar temporalmente el acceso a una página o grupo de
 * páginas si algo falla tras llevarlas a producción. A petición
 * explícita de Eloy, pensado para las páginas que se van a incluir por
 * primera vez en una release grande (buscador, catálogos, Exposición,
 * Centro de Soluciones, profesionales).
 *
 * El ajuste vive en la hoja "Configuracion" del Sheet (clave/valor,
 * mismo mecanismo ya usado para zaphiro_activo) — cambiar "si"/"no" en
 * una celda basta, cada página lo comprueba sola al cargar, sin
 * necesidad de tocar el código ni de desplegar nada.
 *
 * Uso: en cada página que deba poder ponerse en mantenimiento, declarar
 * su clave ANTES de cargar este script:
 *   <script>window.OM_CLAVE_MANTENIMIENTO = 'buscador';</script>
 *   <script src="./assets/js/mantenimiento.js?v=..."></script>
 * (o '../assets/js/mantenimiento.js' desde soluciones/). Claves usadas:
 * 'buscador', 'catalogos', 'escaparate', 'centro_soluciones',
 * 'profesionales' — deben coincidir con las que devuelve la acción
 * obtener_mantenimiento de Apps Script.
 *
 * Se comprueba de forma ASÍNCRONA, DESPUÉS de que la página cargue con
 * normalidad — no añade espera al caso normal (la inmensa mayoría del
 * tiempo), que es cuando nada está en mantenimiento. Si la comprobación
 * en sí falla (red, Apps Script caído...), se deja pasar sin bloquear
 * nada — mejor fallar "abierto" que dejar el sitio entero inaccesible
 * por un problema ajeno al propio contenido.
 */
(function () {
    'use strict';

    const clave = window.OM_CLAVE_MANTENIMIENTO;
    if (!clave) return;

    const APPS_SCRIPT_URL = window.GOOGLE_APPS_SCRIPT_URL ||
        'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec';

    function mostrarAvisoMantenimiento() {
        // Por si se llamara dos veces (no debería, pero por seguridad).
        if (document.getElementById('om-mantenimiento-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'om-mantenimiento-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#1a1a1a;' +
            'color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
            'text-align:center;padding:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;';
        overlay.innerHTML =
            '<div style="font-size:3rem;margin-bottom:16px;">🔧</div>' +
            '<h1 style="font-size:1.4rem;margin:0 0 12px;color:#fff;">Sección en mantenimiento</h1>' +
            '<p style="font-size:1rem;color:#cbd5e1;max-width:420px;margin:0 0 24px;line-height:1.5;">' +
            'Estamos actualizando esta parte de la web. Vuelve a intentarlo en unos minutos — disculpa las molestias.</p>' +
            '<a href="/index.html" style="display:inline-block;background:#d91b1b;color:#fff;padding:12px 28px;' +
            'border-radius:8px;text-decoration:none;font-weight:700;">Ir al inicio</a>';

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    }

    fetch(APPS_SCRIPT_URL + '?accion=obtener_mantenimiento', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(estado => {
            if (estado && estado[clave]) mostrarAvisoMantenimiento();
        })
        .catch(() => { /* fallar abierto, ver comentario de arriba */ });
})();
