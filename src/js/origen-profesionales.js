// Se activa solo cuando se llega desde la página Profesionales
// (enlaces con ?origen=profesionales) — en cualquier otro caso no hace
// nada, así que es seguro incluirlo en cualquier página sin afectar al
// comportamiento normal. Todo dentro de DOMContentLoaded para que
// funcione igual si el <script> se carga en <head> o al final del
// <body>, según la página.
(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('origen') !== 'profesionales') return;

  function iniciar() {
    // 1) Si la página tiene el botón "Volver a Productos" de los
    // catálogos (catalogo_*.html), lo redirige a Profesionales en vez
    // de a Productos, ya que fue el punto de partida real del usuario.
    const btnVolver = document.querySelector('.btn-back-home');
    if (btnVolver) {
      btnVolver.setAttribute('href', 'profesionales.html?origen=profesionales');
      btnVolver.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Volver';
    }

    // 2) Aviso de precios al público, cerrable — solo aparece viniendo
    // de Profesionales, donde tiene sentido aclarar que el catálogo/
    // buscador muestra precio de venta al público.
    //
    // Posición calculada en vez de fija: esta misma pieza se usa tanto
    // en los catálogos (.main-header, position:fixed) como en el
    // buscador (.site-header, position:sticky) — ambos ocupan ya el
    // top:0 de la página, y el aviso de cookies (analytics-consent.js)
    // ocupa a su vez el bottom:0 con el mismo z-index. Fijarlo a ciegas
    // arriba o abajo colisionaba siempre con alguno de los dos. Se
    // calcula la altura real de la cabecera de la página (si la hay) y
    // el aviso se coloca justo debajo, evitando las tres colisiones
    // sin necesidad de conocer de antemano qué página lo está usando.
    if (document.getElementById('aviso-precios-publico')) return;

    function alturaCabeceraFija() {
      const candidatos = document.querySelectorAll('.main-header, .site-header, .navbar-wrapper');
      let alto = 0;
      candidatos.forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.position === 'sticky') {
          alto = Math.max(alto, el.getBoundingClientRect().height);
        }
      });
      return alto;
    }

    const aviso = document.createElement('div');
    aviso.id = 'aviso-precios-publico';
    aviso.setAttribute('role', 'status');
    aviso.style.cssText = `position:fixed;left:0;right:0;top:${alturaCabeceraFija()}px;z-index:900;background:#0f172a;color:#fff;`
      + 'padding:12px 20px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;'
      + 'font-size:0.88rem;box-shadow:0 6px 20px rgba(0,0,0,0.18);';
    aviso.innerHTML =
      '<span><i class="fa-solid fa-circle-info" style="color:#f1b300;margin-right:8px;"></i>'
      + 'Los precios indicados son de venta al público. Consulta los precios al por mayor con nuestro equipo.</span>'
      + '<button type="button" id="cerrar-aviso-precios" aria-label="Cerrar aviso" '
      + 'style="background:none;border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:6px;'
      + 'padding:6px 14px;cursor:pointer;font-weight:700;">Entendido</button>';
    document.body.appendChild(aviso);
    document.getElementById('cerrar-aviso-precios').addEventListener('click', () => aviso.remove());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
