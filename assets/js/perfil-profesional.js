/**
 * Perfil profesional — sesión, navegación e identidad visual compartidas.
 *
 * Módulo único cargado desde todas las páginas públicas (mismo patrón que
 * entorno.js/mantenimiento.js): gestiona el estado de la sesión del PIN
 * profesional, adapta la navegación (oculta Empresa/Historia/Servicios/
 * Actualidad/Profesionales, añade el distintivo "PROFESIONALES" y la
 * opción "Salir") y expone una API mínima para que acceso-profesional.html
 * y cualquier página que necesite el precio de mayor puedan reutilizarla.
 *
 * MUY IMPORTANTE — lo que este script NO hace y no puede hacer:
 * este archivo es JavaScript público, descargado por cualquier
 * visitante, público o profesional. Guardar aquí "isProfesional = true"
 * o comprobar solo la URL nunca sería autorización real — por eso la
 * única fuente de verdad sobre qué puede VER un usuario (precio de
 * mayor, catálogos de mayor) es Apps Script, que vuelve a validar el PIN
 * en cada petición (ver verificarPinProfesional_ en
 * scripts/apps_script_trigger.js). Este script solo:
 *   1. Guarda el PIN ya validado para no pedirlo en cada página (sesión
 *      de interfaz, nunca una concesión de acceso por sí sola).
 *   2. Adapta lo que se VE (menú, distintivo) según si hay una sesión
 *      guardada — puramente cosmético: si alguien manipula el
 *      almacenamiento del navegador para fingir una sesión, seguirá sin
 *      poder obtener precios de mayor reales, porque Apps Script
 *      rechazará un PIN que no sea el correcto.
 *   3. Reenvía ese PIN guardado a quien lo pida (p.ej. buscador.html),
 *      que es quien de verdad lo manda a Apps Script en cada petición.
 *
 * Rutas SIEMPRE relativas (nunca "/acceso-profesional.html" con barra
 * inicial): en preproducción el sitio se sirve bajo
 * /web-orencio-matas/, una ruta absoluta se rompería ahí. Mismo
 * criterio que ya documenta mantenimiento.js con OM_RUTA_RAIZ.
 */
(function () {
  'use strict';

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec';
  const CLAVE_SESION = 'om_perfil_profesional_v1';
  // Sin "recordar": sesión de pestaña/navegador (sessionStorage, se
  // pierde al cerrar el navegador) con un tope de 8h por si se deja
  // abierta una pestaña mucho tiempo. Con "recordar": hasta 30 días en
  // localStorage — nunca el PIN "para siempre", siempre con caducidad.
  const DURACION_SESION_MS = 1000 * 60 * 60 * 8;
  const DURACION_RECORDAR_MS = 1000 * 60 * 60 * 24 * 30;
  const PAGINA_INICIO_PROFESIONAL = 'acceso-profesional.html';
  // Páginas que NUNCA deben verse dentro del contexto profesional (ver
  // apartado 10 del encargo) — comparadas por nombre de archivo, no por
  // URL completa, para que funcionen igual con o sin parámetros/anclas
  // y sea cual sea la profundidad de carpeta desde la que se cargue.
  const PAGINAS_EXCLUIDAS = ['empresa.html', 'historia.html', 'servicios.html', 'actualidad.html', 'profesionales.html'];

  function nombreArchivoDe_(href) {
    if (!href) return '';
    return href.split('#')[0].split('?')[0].split('/').pop().toLowerCase();
  }

  function leerSesion_() {
    const fuentes = [
      { storage: tryStorage_('localStorage'), recordada: true },
      { storage: tryStorage_('sessionStorage'), recordada: false },
    ];
    for (const { storage } of fuentes) {
      if (!storage) continue;
      try {
        const bruto = storage.getItem(CLAVE_SESION);
        if (!bruto) continue;
        const datos = JSON.parse(bruto);
        if (!datos || !datos.pin || !datos.expira) { storage.removeItem(CLAVE_SESION); continue; }
        if (Date.now() > datos.expira) { storage.removeItem(CLAVE_SESION); continue; }
        return datos;
      } catch (err) { /* almacenamiento corrupto o inaccesible — se ignora */ }
    }
    return null;
  }

  function tryStorage_(nombre) {
    try {
      const s = window[nombre];
      const prueba = '__om_test__';
      s.setItem(prueba, '1');
      s.removeItem(prueba);
      return s;
    } catch (err) {
      return null; // privado/bloqueado — se sigue funcionando sin recordar nada
    }
  }

  function guardarSesion_(pin, recordar) {
    const expira = Date.now() + (recordar ? DURACION_RECORDAR_MS : DURACION_SESION_MS);
    const payload = JSON.stringify({ pin: pin, expira: expira });
    const local = tryStorage_('localStorage');
    const sesion = tryStorage_('sessionStorage');
    if (recordar) {
      if (local) local.setItem(CLAVE_SESION, payload);
      if (sesion) sesion.removeItem(CLAVE_SESION);
    } else {
      if (sesion) sesion.setItem(CLAVE_SESION, payload);
      if (local) local.removeItem(CLAVE_SESION);
    }
  }

  function cerrarSesion_() {
    const local = tryStorage_('localStorage');
    const sesion = tryStorage_('sessionStorage');
    if (local) local.removeItem(CLAVE_SESION);
    if (sesion) sesion.removeItem(CLAVE_SESION);
  }

  async function validarPin_(pin) {
    try {
      const resp = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion: 'validar_pin_profesional', pin: pin }),
      });
      const datos = await resp.json();
      return { ok: !!datos.success, error: null };
    } catch (err) {
      return { ok: false, error: 'conexion' };
    }
  }

  function inyectarEstilos_() {
    if (document.getElementById('om-estilos-perfil-profesional')) return;
    const style = document.createElement('style');
    style.id = 'om-estilos-perfil-profesional';
    style.textContent = `
      .om-distintivo-profesional{
        display:inline-flex; align-items:center; gap:5px;
        margin-left:10px; padding:3px 10px; border-radius:999px;
        background:#1a1a1a; color:#fff; border:1px solid #d91b1b;
        font-size:11px; font-weight:800; letter-spacing:.07em;
        text-transform:uppercase; vertical-align:middle; white-space:nowrap;
      }
      .om-perfil-profesional-etiqueta{
        display:block; margin-top:6px; font-size:13px; font-weight:700;
        letter-spacing:.04em; text-transform:uppercase; color:#d91b1b;
      }
      a.om-salir-profesional{
        color:#d91b1b !important; font-weight:700;
      }
      @media (max-width:860px){
        .om-distintivo-profesional{ margin-left:0; margin-top:4px; }
      }
    `;
    document.head.appendChild(style);
  }

  function aplicarUI_() {
    inyectarEstilos_();

    // 1) Oculta en TODOS los menús (cabecera, submenús desplegables y
    // columnas del footer) cualquier enlace a una página excluida — el
    // marcado de navegación está duplicado en cada página (no hay
    // includes compartidos en este proyecto), así que se filtra por el
    // nombre de archivo del href en vez de depender de editar cada
    // página a mano.
    document.querySelectorAll(
      '.navbar__menu a[href], .navbar__submenu a[href], .site-footer__column a[href]'
    ).forEach((a) => {
      if (PAGINAS_EXCLUIDAS.indexOf(nombreArchivoDe_(a.getAttribute('href'))) === -1) return;
      const li = a.closest('li');
      if (li) li.remove(); else a.remove();
    });

    // 2) Distintivo "PROFESIONALES" junto al logotipo de la cabecera.
    document.querySelectorAll('.navbar__logo').forEach((logo) => {
      if (logo.closest('.site-footer')) return; // solo en la cabecera, no en el logo del pie
      if (logo.parentElement.querySelector('.om-distintivo-profesional')) return;
      const distintivo = document.createElement('span');
      distintivo.className = 'om-distintivo-profesional';
      distintivo.textContent = 'PROFESIONALES';
      logo.insertAdjacentElement('afterend', distintivo);
    });

    // 3) "Salir" — última opción del menú (escritorio y móvil comparten
    // el mismo <ul>, ver nota arriba).
    document.querySelectorAll('.navbar__menu').forEach((menu) => {
      if (menu.querySelector('.om-salir-profesional')) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'om-salir-profesional';
      a.textContent = 'Salir';
      a.addEventListener('click', (ev) => { ev.preventDefault(); window.PerfilProfesional.salir(); });
      li.appendChild(a);
      menu.appendChild(li);
    });
  }

  const sesionActual = leerSesion_();
  const paginaActual = nombreArchivoDe_(location.pathname);

  if (sesionActual) {
    if (PAGINAS_EXCLUIDAS.indexOf(paginaActual) !== -1) {
      // Página pública excluida con sesión profesional activa: se
      // redirige al inicio profesional en vez de dejar ver una mezcla
      // de ambos contextos (petición explícita) — con replace() para
      // que "Atrás" no vuelva a dejar a medio camino.
      location.replace('./' + PAGINA_INICIO_PROFESIONAL);
    } else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', aplicarUI_);
    } else {
      aplicarUI_();
    }
  }

  window.PerfilProfesional = {
    PAGINAS_EXCLUIDAS: PAGINAS_EXCLUIDAS.slice(),
    sesionActiva: function () { return !!leerSesion_(); },
    pinActual: function () { const s = leerSesion_(); return s ? s.pin : null; },
    iniciarSesion: async function (pin, recordar) {
      const resultado = await validarPin_(pin);
      if (resultado.ok) guardarSesion_(pin, !!recordar);
      return resultado;
    },
    salir: function () {
      cerrarSesion_();
      // history.replaceState evita que un "Atrás" posterior reconstruya,
      // vía la caché de retroceso del navegador (bfcache), una vista de
      // esta misma página todavía con el distintivo/menú profesional
      // puesto — al no ser datos protegidos de verdad (solo interfaz),
      // esto es un refuerzo razonable, no la protección real (esa ya la
      // aplica Apps Script con el PIN en cada petición).
      try { history.replaceState(null, '', location.href); } catch (err) {}
      location.href = './index.html';
    },
  };
})();
