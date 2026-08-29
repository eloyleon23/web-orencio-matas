// Se activa solo cuando se llega desde la página Profesionales
// (enlaces con ?origen=profesionales) — en cualquier otro caso no hace
// nada, así que es seguro incluirlo en cualquier página sin afectar al
// comportamiento normal. Todo dentro de DOMContentLoaded para que
// funcione igual si el <script> se carga en <head> o al final del
// <body>, según la página.
(function () {
  const params = new URLSearchParams(window.location.search);
  const vieneDeProfesionales = params.get('origen') === 'profesionales';

  // ── Propagar el origen a lo largo de toda la cadena de navegación ──
  // catalogo_X.html → "ver completo" → visor_catalogo.html → "Volver" →
  // catalogo_X.html: los tres enlaces se construyen por JS de forma
  // dinámica (tras cargar datos del catálogo de forma asíncrona), así
  // que no basta con fijar el href una sola vez al cargar la página —
  // para cuando se pulsa, el propio script de la página puede haber
  // vuelto a pisarlo. Se intercepta el clic en su lugar y se añade
  // ?origen=profesionales en ese momento, siempre que la página actual
  // ya lo tuviera.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const actual = new URLSearchParams(window.location.search);
    if (actual.get('origen') !== 'profesionales') return;
    if (!/visor_catalogo\.html|catalogo_\w+\.html/.test(link.getAttribute('href') || '')) return;
    if (link.href.includes('origen=profesionales')) return;

    e.preventDefault();
    const url = new URL(link.href, window.location.href);
    url.searchParams.set('origen', 'profesionales');
    window.location.href = url.toString();
  });

  if (!vieneDeProfesionales) return;

  function iniciar() {
    // 1) Si la página tiene el botón "Volver a Productos" de los
    // catálogos (catalogo_*.html), lo redirige a Profesionales en vez
    // de a Productos, ya que fue el punto de partida real del usuario.
    // (El "Volver" del visor_catalogo.html, #btn-volver, no se toca
    // aquí: ya vuelve correctamente al catálogo de área gracias al
    // listener de clic de arriba, que además le añade el origen).
    const btnVolver = document.querySelector('.btn-back-home');
    if (btnVolver) {
      btnVolver.setAttribute('href', 'profesionales.html?origen=profesionales');
      btnVolver.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Volver';
    }

    // 2) Aviso de precios al público, cerrable — solo aparece viniendo
    // de Profesionales. Mismo estilo visual que el aviso ya existente
    // en el buscador ("Los precios pueden variar y este producto está
    // sujeto a disponibilidad...", clase .catalog-disclaimer: tarjeta
    // normal dentro del flujo, con borde de color a la izquierda, NO
    // position:fixed) pero en azul en vez de ámbar, para no
    // confundirlo visualmente con ese otro aviso.
    if (document.getElementById('aviso-precios-publico')) return;

    const aviso = document.createElement('div');
    aviso.id = 'aviso-precios-publico';
    aviso.setAttribute('role', 'status');
    aviso.style.cssText = 'background:#eff6ff;border-left:4px solid #006dae;color:#1e3a5f;'
      + 'padding:8px 14px;margin-bottom:12px;border-radius:8px;font-size:0.8rem;line-height:1.4;'
      + 'display:flex;align-items:flex-start;gap:8px;';
    aviso.innerHTML =
      '<span style="flex:1;min-width:0;"><i class="fa-solid fa-circle-info" style="color:#006dae;margin-right:6px;"></i>'
      + 'Los precios indicados son de venta al público. Consulta los precios al por mayor con nuestro equipo.</span>'
      + '<button type="button" id="cerrar-aviso-precios" aria-label="Cerrar aviso" '
      + 'style="flex-shrink:0;background:none;border:none;color:#006dae;opacity:0.6;'
      + 'cursor:pointer;padding:2px 4px;font-size:0.85rem;line-height:1;">✕</button>';

    // Dónde insertarlo, en orden de preferencia:
    // a) Junto al aviso ámbar ya existente (#catalog-disclaimer, solo
    //    en buscador.html) — mismo sitio, mismo tipo de mensaje, sin
    //    tener que inventar una ubicación nueva.
    // b) Dentro de <main>, como primer elemento — ya tiene el
    //    padding-top que compensa la cabecera fija, así que aparece
    //    como contenido normal de la página en vez de pegado a la
    //    cabecera y desplazándola visualmente hacia abajo (el problema
    //    real de la versión anterior: se insertaba a nivel de <body>,
    //    fuera de <main>, quedando "colgado" entre la cabecera y el
    //    contenido en vez de formar parte de él).
    // c) Si no hay ninguna de las dos (visor_catalogo.html), al
    //    principio del <body> como último recurso.
    const disclaimerExistente = document.getElementById('catalog-disclaimer');
    const main = document.querySelector('main');
    if (disclaimerExistente && disclaimerExistente.parentElement) {
      disclaimerExistente.insertAdjacentElement('beforebegin', aviso);
    } else if (main) {
      main.insertAdjacentElement('afterbegin', aviso);
    } else {
      document.body.insertAdjacentElement('afterbegin', aviso);
    }

    document.getElementById('cerrar-aviso-precios').addEventListener('click', () => aviso.remove());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
