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
 * su clave ANTES de cargar este script, junto con la ruta relativa a la
 * raíz del sitio (para el logo y el enlace "Ir al inicio" — importante:
 * una URL absoluta tipo "/index.html" se rompe en cualquier entorno que
 * no sirva desde la raíz del dominio, como GitHub Pages en preproducción,
 * que sirve desde /web-orencio-matas/):
 *   <script>
 *     window.OM_CLAVE_MANTENIMIENTO = 'buscador';
 *     window.OM_RUTA_RAIZ = './';       // o '../' desde soluciones/
 *   </script>
 *   <script src="./assets/js/mantenimiento.js?v=..."></script>
 * Claves usadas: 'buscador', 'catalogos', 'escaparate',
 * 'centro_soluciones', 'profesionales' — deben coincidir con las que
 * devuelve la acción obtener_mantenimiento de Apps Script.
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

    // './' si la página no declaró su propia ruta — así este script
    // nunca rompe aunque alguna página se añada más adelante sin ese
    // segundo dato.
    const raiz = window.OM_RUTA_RAIZ || './';

    const APPS_SCRIPT_URL = window.GOOGLE_APPS_SCRIPT_URL ||
        'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec';

    function mostrarAvisoMantenimiento() {
        // Por si se llamara dos veces (no debería, pero por seguridad).
        if (document.getElementById('om-mantenimiento-overlay')) return;

        // Mismo estilo visual que el resto del sitio (src/css/estilos.css):
        // fondo claro (nunca oscuro en el contenido principal, solo
        // topbar/footer lo son), tarjeta blanca con sombra suave, rojo de
        // marca (#d91b1b) como acento, Montserrat para el titular e Inter
        // para el cuerpo — con el logo real de la empresa arriba, no un
        // emoji genérico.
        const overlay = document.createElement('div');
        overlay.id = 'om-mantenimiento-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#f5f6f8;' +
            'display:flex;align-items:center;justify-content:center;padding:24px;' +
            'font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;';
        overlay.innerHTML =
            '<div style="background:#fff;border-radius:16px;padding:40px 36px;max-width:440px;width:100%;' +
            'text-align:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);border:1px solid #e2e8f0;">' +
            '<img src="' + raiz + 'assets/logos/logo-orencio.png" alt="Orencio Matas y Hermanos, S.L." ' +
            'width="150" height="50" style="width:150px;height:auto;margin-bottom:24px;">' +
            '<h1 style="font-family:\'Montserrat\',sans-serif;font-size:1.3rem;font-weight:700;margin:0 0 12px;color:#1a1a1a;">' +
            'Sección en mantenimiento</h1>' +
            '<p style="font-size:0.95rem;color:#475569;margin:0 0 28px;line-height:1.5;">' +
            'Estamos actualizando esta parte de la web. Vuelve a intentarlo en unos minutos — disculpa las molestias.</p>' +
            '<a href="' + raiz + 'index.html" style="display:inline-block;background:#d91b1b;color:#fff;' +
            'padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.95rem;">Ir al inicio</a>' +
            '</div>';

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
