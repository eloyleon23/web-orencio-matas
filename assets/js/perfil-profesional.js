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
  // Siempre en localStorage (nunca sessionStorage) — a petición
  // explícita de Eloy: "si se cierra el navegador y se vuelve a acceder
  // se debe cargar la vista profesional" mientras no se haya cerrado la
  // sesión expresamente con "Salir". sessionStorage no servía para eso:
  // se pierde al cerrar el navegador aunque no hubiera expirado. La
  // única diferencia que mantiene la casilla "recordar" es la duración:
  // sin ella, 8h (una sesión de un día de trabajo); con ella, 30 días.
  // Nunca el PIN "para siempre" — siempre con caducidad.
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
    const storage = tryStorage_('localStorage');
    if (!storage) return null;
    try {
      const bruto = storage.getItem(CLAVE_SESION);
      if (!bruto) return null;
      const datos = JSON.parse(bruto);
      if (!datos || !datos.pin || !datos.expira) { storage.removeItem(CLAVE_SESION); return null; }
      if (Date.now() > datos.expira) { storage.removeItem(CLAVE_SESION); return null; }
      return datos;
    } catch (err) {
      return null; // almacenamiento corrupto o inaccesible
    }
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
    if (local) local.setItem(CLAVE_SESION, payload);
  }

  function cerrarSesion_() {
    const local = tryStorage_('localStorage');
    if (local) local.removeItem(CLAVE_SESION);
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
      /* Ajuste del distintivo "PROFESIONALES" cuando el icono de menú
         hamburguesa ya está visible (ver src/css/estilos.css: el menú
         de escritorio pasa a desplegable y el icono aparece a partir
         de max-width:1540px, NO solo en móvil estrecho). Dos bugs
         reales distintos en este mismo rango de anchos:
         1) En móvil estrecho el texto empujaba (o apretaba, según la
            página) el icono hasta dejarlo parcialmente fuera de la
            vista — competía con él por el mismo hueco dentro de
            .navbar__inner.
         2) Al extender el efecto a otras páginas ("hay paginas que el
            logo e icono de menu no están igual que la de acceso a
            profesionales", bug real reportado) apareció uno distinto
            en anchos de tablet/portátil pequeño: con el menú de
            escritorio ya oculto (fuera del flujo, position:absolute)
            solo quedan 3 elementos flexibles en .navbar__inner (logo,
            distintivo, icono) y justify-content:space-between (del
            propio .navbar__inner, en src/css/estilos.css) reparte TODO
            el hueco libre entre ellos por igual — cuanto más ancho el
            contenedor, más se alejaba el distintivo del logo, quedando
            descolgado a mitad de camino en vez de pegado al logo como
            en móvil (donde coincidía que había poco hueco libre que
            repartir, por eso allí "se veía bien" por casualidad).
         margin-right:auto en el distintivo consume TODO ese hueco
         libre a su derecha (en vez de repartirse entre los 3
         elementos), así que logo + distintivo quedan siempre pegados a
         la izquierda y el icono siempre a la derecha, sea cual sea el
         ancho real del contenedor en cualquier página. */
      @media (max-width: 1540px) {
        .navbar__inner { gap: 8px; }
        .om-distintivo-profesional {
          margin-left: 0 !important;
          margin-top: 0 !important;
          margin-right: auto;
          padding: 3px 7px;
          font-size: 8.5px;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }
      }

      /* Logotipo con efecto diferencial cuando la sesión profesional
         está activa (ver aplicarUI_ más abajo, que añade la clase
         om-logo-profesional al enlace del logo y el SVG del trazo) —
         validado primero solo en acceso-profesional.html y ahora
         compartido por todas las páginas visibles para profesionales,
         a petición de Eloy. Un efecto en dos tiempos: una gotita
         propia (no la del logo, que no se mueve) cae desde arriba
         hasta la gota del logo, con un ligero aplastamiento al
         "aterrizar" (como una gota real al caer) y cambiando por los
         colores reales del logo conforme cae; justo después se
         desvanece mientras una línea recorre una vez el contorno REAL
         de la gota del logo (vectorizado del propio PNG, ver el SVG
         que añade aplicarUI_), también cambiando por esos mismos
         colores. Nunca en bucle continuo: solo se reproduce cuando el
         disparador de más abajo (dispararEfectoLogo_) añade la clase
         om-logo-jugar, en un intervalo aleatorio entre 2 y 20
         segundos. */
      .om-logo-profesional {
        position: relative;
        /* Colores reales del logo, muestreados directamente del propio
           PNG (no las variables --primary-* genéricas del sitio, que
           no son exactamente las mismas): rojo, dos tonos de ámbar/
           amarillo, verde azulado y dos tonos de azul, en el mismo
           orden en que aparecen en el recorrido de color. */
        --om-gota-1: #d81b24;
        --om-gota-2: #f0a800;
        --om-gota-3: #fccc00;
        --om-gota-4: #008454;
        --om-gota-5: #0078a8;
        --om-gota-6: #0c4884;
      }

      /* Gotita que cae, cambiando por los colores reales del logo
         conforme cae, de forma gradual y lenta. Forma de gota real
         (más redondeada abajo, más afilada arriba — como 💧) vía un
         border-radius distinto arriba/abajo; tamaño relativo al logo
         (no fijo en píxeles). */
      .om-logo-profesional::before {
        content: "";
        position: absolute;
        left: 17%;
        top: -16px;
        width: 10%;
        aspect-ratio: 8 / 11;
        background: var(--om-gota-1);
        border-radius: 50% 50% 50% 50% / 35% 35% 65% 65%;
        opacity: 0;
        pointer-events: none;
        z-index: 2;
      }
      .om-logo-profesional.om-logo-jugar::before {
        animation:
          om-gota-cae 4.4s,
          om-gota-color 4.4s linear;
      }
      /* Centrada en el eje X sobre la gota del logo (left:17% marca el
         centro, no el borde) — translateX(-50%) se combina en cada
         fotograma con la escala de turno porque "transform" sustituye
         el valor anterior entero, no se acumula entre fotogramas. La
         caída empieza despacio y acelera hacia el final, como una gota
         real tirada por la gravedad — cada fotograma fija su propia
         curva de aceleración hacia el siguiente en vez de una única
         curva para toda la animación. */
      @keyframes om-gota-cae {
        0%     { top: -16px; opacity: 0;  transform: translateX(-50%) scale(0.5); animation-timing-function: ease-out; }
        6%     { top: -16px; opacity: 1;  transform: translateX(-50%) scale(1);   animation-timing-function: cubic-bezier(.7, 0, .9, .35); }
        28%    { top: 44%;   opacity: 1;  transform: translateX(-50%) scale(1);   animation-timing-function: ease-out; }
        31%    { top: 46%;   opacity: 1;  transform: translateX(-50%) scaleX(1.7) scaleY(0.45); animation-timing-function: ease-out; }
        39%    { top: 46%;   opacity: 0;  transform: translateX(-50%) scaleX(0.3) scaleY(0.3); }
        39.01%, 100% { opacity: 0; }
      }
      @keyframes om-gota-color {
        0%, 7%   { background: var(--om-gota-1); }
        9%, 16%  { background: var(--om-gota-2); }
        18%, 25% { background: var(--om-gota-4); }
        27%, 100% { background: var(--om-gota-5); }
      }

      /* Línea que recorre el contorno REAL de la gota del logo (el
         <svg> con el path vectorizado lo añade aplicarUI_, dentro de
         .navbar__logo) — posicionada sobre la gota real (left:0/width
         ≈ fracción de la gota en el logo completo, 76/202) y separada
         un poco del logo (transform:scale) para que se distinga
         claramente como un trazo aparte. */
      .om-gota-trazo {
        position: absolute;
        left: 0;
        top: 0;
        width: 37.6%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
        z-index: 0;
        transform: scale(1.22);
      }
      .om-gota-trazo path {
        fill: none;
        stroke: var(--om-gota-1);
        stroke-width: 120;
        stroke-linecap: round;
        opacity: 0;
        /* 19249 es la longitud real del contorno (SVGPathElement.
           getTotalLength() del propio path, en sus unidades) — un
           tramo visible y el resto del trazo vacío, para que se vea
           como una única línea viajando alrededor del perfil en vez de
           todo el contorno coloreado de golpe. */
        stroke-dasharray: 3400 19249;
      }
      /* La gotita cae en su propia duración (4.4s), pero el trazo que
         la rodea tiene su PROPIA duración, más larga (6s), y su
         ventana visible empieza en el mismo instante absoluto en que
         la gotita aterriza (29% de 6s ≈ 1.7s) pero se mantiene visible
         mucho más tiempo y se desvanece más tarde. */
      .om-logo-profesional.om-logo-jugar .om-gota-trazo path {
        animation:
          om-trazo-opacidad 6s ease-in-out,
          om-trazo-viaja 6s linear,
          om-trazo-color 6s linear;
      }
      @keyframes om-trazo-opacidad {
        0%, 22%   { opacity: 0; }
        29%, 95%  { opacity: 1; }
        99%, 100% { opacity: 0; }
      }
      @keyframes om-trazo-viaja {
        0%, 29%  { stroke-dashoffset: 0; }
        95%, 100% { stroke-dashoffset: -19249; }
      }
      @keyframes om-trazo-color {
        0%, 29%   { stroke: var(--om-gota-1); }
        42%  { stroke: var(--om-gota-2); }
        55%  { stroke: var(--om-gota-3); }
        69%  { stroke: var(--om-gota-4); }
        82%  { stroke: var(--om-gota-5); }
        95%, 100% { stroke: var(--om-gota-6); }
      }

      .om-logo-profesional .navbar__logo-image {
        position: relative;
        z-index: 1;
      }
      @media (prefers-reduced-motion: reduce) {
        .om-logo-profesional::before { display: none; }
        .om-gota-trazo path {
          animation: none;
          opacity: 1;
          stroke: var(--om-gota-1);
          stroke-dasharray: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Path vectorizado (potrace, sobre el canal alfa real del propio PNG
  // recortado a la gota) del contorno exacto de la gota del logo — ver
  // acceso-profesional.html (historial) para el detalle del proceso.
  // Compartido aquí para que el SVG del trazo pueda añadirse por JS en
  // cualquier página, sin duplicar este markup en cada una.
  const OM_GOTA_PATH_D =
    'M2792 6851 c-6 -17 -24 -37 -42 -46 -37 -19 -151 -96 -195 -132 -16 -13 ' +
    '-54 -44 -84 -68 -30 -25 -58 -45 -62 -45 -4 0 -28 -17 -52 -37 -25 -21 ' +
    '-71 -58 -102 -83 -32 -25 -74 -59 -94 -77 -20 -17 -115 -100 -211 -184 ' +
    '-223 -195 -527 -499 -702 -704 -75 -88 -150 -176 -167 -195 -94 -109 ' +
    '-107 -126 -195 -255 -19 -28 -41 -57 -51 -65 -9 -7 -23 -27 -32 -44 -9 ' +
    '-17 -27 -44 -40 -61 -14 -16 -40 -55 -59 -85 -63 -103 -69 -112 -91 -144 ' +
    '-13 -17 -33 -51 -44 -76 -12 -25 -34 -61 -49 -80 -15 -19 -33 -52 -39 ' +
    '-73 -7 -21 -23 -50 -36 -65 -13 -16 -32 -51 -43 -78 -10 -27 -33 -71 -50 ' +
    '-98 -18 -28 -32 -57 -32 -66 0 -9 -14 -38 -31 -66 -18 -27 -41 -76 -52 ' +
    '-109 -11 -33 -28 -72 -38 -86 -11 -15 -26 -55 -35 -89 -9 -34 -27 -92 ' +
    '-41 -129 -14 -36 -31 -109 -39 -161 -19 -123 -38 -190 -64 -217 -19 -22 ' +
    '-20 -33 -20 -437 l0 -415 30 -48 c23 -38 34 -74 50 -175 11 -71 31 -156 ' +
    '44 -190 14 -35 30 -88 36 -118 6 -30 24 -78 40 -106 15 -28 34 -71 40 ' +
    '-95 6 -24 24 -62 39 -84 16 -22 34 -57 40 -78 7 -21 23 -50 35 -65 13 ' +
    '-15 33 -47 46 -72 12 -25 34 -59 49 -76 14 -17 34 -44 43 -60 17 -28 74 ' +
    '-106 133 -181 106 -136 378 -412 470 -476 17 -12 34 -27 38 -34 4 -7 25 ' +
    '-22 46 -32 20 -11 57 -36 80 -55 24 -20 49 -36 56 -36 7 0 32 -15 54 -34 ' +
    '23 -19 58 -40 79 -47 20 -7 59 -27 86 -46 26 -18 56 -33 66 -33 10 0 48 ' +
    '-16 83 -35 36 -19 92 -41 125 -49 32 -9 79 -25 104 -36 24 -10 89 -26 ' +
    '144 -35 131 -21 196 -40 219 -65 18 -20 29 -20 512 -20 339 0 493 3 493 ' +
    '11 0 21 96 52 216 70 68 10 150 29 181 43 32 13 85 29 118 36 33 6 76 22 ' +
    '96 35 20 13 63 31 95 41 33 9 79 29 103 45 25 16 62 34 82 39 21 6 51 21 ' +
    '67 35 15 13 53 34 83 48 30 13 61 32 69 42 8 10 33 26 55 36 22 11 60 35 ' +
    '85 54 25 19 67 52 94 72 154 120 373 330 421 405 14 20 29 39 35 43 5 3 ' +
    '26 30 45 58 47 70 78 114 114 163 17 22 37 56 45 75 8 19 26 49 39 67 14 ' +
    '18 31 48 38 65 7 18 23 47 36 65 13 17 33 57 43 87 10 30 30 74 44 97 14 ' +
    '24 32 75 40 113 8 39 26 95 40 125 13 30 30 91 36 135 6 44 22 121 35 ' +
    '170 36 134 45 241 45 540 0 297 -9 402 -44 515 -13 41 -29 111 -36 155 ' +
    '-6 44 -24 109 -40 145 -16 36 -34 90 -40 120 -7 30 -25 78 -40 105 -16 ' +
    '28 -34 70 -40 95 -7 25 -23 60 -37 78 -13 18 -31 54 -40 80 -9 26 -26 61 ' +
    '-40 79 -13 18 -33 54 -44 80 -11 26 -29 57 -39 68 -11 11 -28 41 -39 66 ' +
    '-12 26 -28 52 -37 60 -8 7 -26 34 -39 59 -13 25 -31 52 -40 60 -9 8 -28 ' +
    '34 -41 59 -23 43 -41 69 -124 176 -17 22 -56 74 -87 115 -30 41 -68 91 ' +
    '-84 110 -56 67 -104 124 -149 174 -25 28 -99 114 -165 191 -215 251 -742 ' +
    '763 -1073 1043 -24 20 -61 53 -82 72 -36 33 -81 72 -160 138 -45 38 -157 ' +
    '122 -194 146 -16 10 -33 31 -39 47 -17 43 -80 43 -95 0z';

  function anadirTrazoLogo_(logo) {
    if (logo.querySelector('.om-gota-trazo')) return; // ya añadido (idempotente)
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'om-gota-trazo');
    svg.setAttribute('viewBox', '0 0 608 688');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('transform', 'translate(0,688) scale(0.1,-0.1)');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', OM_GOTA_PATH_D);
    g.appendChild(path);
    svg.appendChild(g);
    logo.appendChild(svg);
  }

  // Disparador aleatorio del efecto del logo — se dispara nada más
  // activarse (perfil-profesional.js ya ha añadido om-logo-profesional
  // al logo en ese momento) y luego en un intervalo aleatorio entre 2 y
  // 20 segundos, sin parar ("que no pase más de 20 segundos sin salir
  // el efecto"). Un solo disparador por logo (guard por dataset), ya
  // que aplicarUI_ puede volver a ejecutarse sin recarga de página
  // (p.ej. justo tras validar el PIN).
  function dispararEfectoLogo_(logo) {
    if (logo.dataset.omEfectoListo) return;
    logo.dataset.omEfectoListo = '1';
    function disparar() {
      logo.classList.remove('om-logo-jugar');
      void logo.offsetWidth;
      logo.classList.add('om-logo-jugar');
      const espera = 2000 + Math.random() * 18000; // entre 2s y 20s, nunca más
      setTimeout(disparar, espera);
    }
    disparar();
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

    // 2) Distintivo "PROFESIONALES" junto al logotipo de la cabecera, y
    // un efecto visual diferencial en el propio logo (gotita cayendo +
    // línea recorriendo el contorno real de la gota, ver
    // inyectarEstilos_) — a petición de Eloy: mantener la palabra
    // "Profesional" en la cabecera Y que el LOGO tenga un efecto
    // diferencial (se probó antes iluminando el icono del menú en su
    // lugar, "no me gusta", descartado). Validado primero solo en
    // acceso-profesional.html y extendido ahora a todas las páginas
    // visibles para profesionales, a petición explícita de Eloy.
    document.querySelectorAll('.navbar__logo').forEach((logo) => {
      if (logo.closest('.site-footer')) return; // solo en la cabecera, no en el logo del pie
      logo.classList.add('om-logo-profesional');
      anadirTrazoLogo_(logo);
      dispararEfectoLogo_(logo);
      if (logo.parentElement.querySelector('.om-distintivo-profesional')) return;
      const distintivo = document.createElement('span');
      distintivo.className = 'om-distintivo-profesional';
      distintivo.textContent = 'PROFESIONALES';
      logo.insertAdjacentElement('afterend', distintivo);
    });

    // 3) Repunta cualquier enlace "Inicio" (al index.html público, sin
    // ancla) hacia el inicio profesional — a petición de Eloy: "no
    // quiero páginas innecesarias o que a los profesionales no les
    // aporten, para eso está la vista de perfil de usuario normal".
    // Cubre el logo, "Inicio" del menú (escritorio y móvil, mismo
    // <ul>) y cualquier otro enlace a index.html del pie de página —
    // selector amplio a propósito, sin limitarlo a .navbar__menu, para
    // no tener que mantener una lista de sitios donde pueda aparecer.
    // Los enlaces con ancla (p.ej. index.html#contacto) NO se tocan:
    // siguen aportando (datos de contacto), no son "ir al inicio".
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.indexOf('#') !== -1) return;
      if (nombreArchivoDe_(href) !== 'index.html') return;
      a.setAttribute('href', './' + PAGINA_INICIO_PROFESIONAL);
    });

    // 4) "Salir" — última opción del menú (escritorio y móvil comparten
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

  // La home pública (index.html) tampoco aporta nada al profesional, a
  // petición explícita de Eloy — mismo criterio que PAGINAS_EXCLUIDAS,
  // así que si se llega aquí con sesión activa se redirige igual. Se
  // comprueba aparte (no se mete directamente en PAGINAS_EXCLUIDAS)
  // porque esa lista también decide qué enlaces del menú se OCULTAN
  // (ver aplicarUI_, paso 1) — para "Inicio" no se oculta el enlace,
  // se REAPUNTA al inicio profesional (ver aplicarUI_, paso 3).
  // location.pathname da "" (cadena vacía) para la raíz del sitio
  // ("/"), que el servidor sirve como index.html — se trata igual.
  const esPaginaInicioPublica_ = paginaActual === '' || paginaActual === 'index.html';

  if (sesionActual) {
    if (PAGINAS_EXCLUIDAS.indexOf(paginaActual) !== -1 || esPaginaInicioPublica_) {
      // Página pública excluida (o la home pública) con sesión
      // profesional activa: se redirige al inicio profesional en vez
      // de dejar ver una mezcla de ambos contextos (petición
      // explícita) — con replace() para que "Atrás" no vuelva a dejar
      // a medio camino.
      location.replace('./' + PAGINA_INICIO_PROFESIONAL);
    } else {
      // Se llama de inmediato, no solo en DOMContentLoaded: este script
      // se carga siempre después de la cabecera en cada página (nunca en
      // el <head>), así que el marcado del menú ya existe en el DOM en
      // este mismo punto de la ejecución — esperar a DOMContentLoaded
      // aquí solo conseguía que el visitante viera un instante el menú
      // completo (Empresa/Historia/...) antes de que se ocultara, cada
      // vez que abría o recargaba una página con la sesión ya activa. Se
      // deja igualmente el listener como red de seguridad, por si algún
      // día el script llegara a cargarse antes del propio menú —
      // aplicarUI_ es idempotente (ver sus propias comprobaciones).
      aplicarUI_();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicarUI_);
      }
    }
  }

  window.PerfilProfesional = {
    PAGINAS_EXCLUIDAS: PAGINAS_EXCLUIDAS.slice(),
    sesionActiva: function () { return !!leerSesion_(); },
    pinActual: function () { const s = leerSesion_(); return s ? s.pin : null; },
    // Expuesto para forzar el refresco del menú en el momento exacto en
    // que un PIN se valida (ver acceso-profesional.html) — sin esto, la
    // cabecera de ESA misma página (no hay recarga tras el login) seguía
    // mostrando Empresa/Historia/... hasta que el visitante navegaba a
    // otra página y el script volvía a ejecutarse desde cero. A petición
    // explícita de Eloy.
    actualizarNavegacion: aplicarUI_,
    iniciarSesion: async function (pin, recordar) {
      const resultado = await validarPin_(pin);
      if (resultado.ok) {
        guardarSesion_(pin, !!recordar);
        if (PAGINAS_EXCLUIDAS.indexOf(paginaActual) === -1) aplicarUI_();
      }
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
