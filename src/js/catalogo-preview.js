/**
 * Muestra visual de productos reales del catálogo, embebida en las
 * páginas catalogo_*.html — pensada para dar una idea de lo que contiene
 * el PDF sin tener que cargarlo entero (que es justo el problema de
 * tamaño que esto sustituye).
 *
 * Igual que buscador.html/soluciones-data.js/escaparate.html: prioriza
 * SIEMPRE la fuente en vivo de Apps Script (obtener_productos) sobre el
 * data/productos.json estático del propio despliegue — así, si esta
 * página llega a incluirse en una copia de IONOS, sigue reflejando
 * precios e imágenes actualizados sin necesidad de un redespliegue. El
 * estático solo se usa como último recurso si la fuente en vivo falla.
 * Para el área 'talleres' se añaden además los catálogos estáticos de
 * proveedor (Zaphiro/Besa/Glasurit/Baslac) — no tienen fuente en vivo
 * posible, no vienen de la hoja de Productos del Sheet.
 *
 * Misma lógica de URL de imagen que buscador.html — ver
 * urlImagenProductoCatalogo().
 *
 * Se cargan los productos UNA sola vez, y cada 10 segundos se elige un
 * nuevo grupo aleatorio de familias + productos y se vuelve a pintar —
 * así el usuario ve variedad sin tener que recargar la página.
 *
 * Uso: en cada catalogo_*.html, tras el contenedor con id
 * "catalogo-preview-grid", llamar a:
 *   cargarMuestraCatalogo({ area: 'drogueria', contenedorId: 'catalogo-preview-grid' })
 */
(function () {
    'use strict';

    const ROTACION_MS = 10000;
    // Misma URL de Apps Script que usa buscador.html — fuente en vivo,
    // siempre actualizada, sin depender de ningún despliegue.
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqJOASK7XTqZ_XH2wt512Es5DlItsjIQn24JYGuuNMcuolzvi5P8L-m0N5Sf0oHzQ7/exec';
    const PRODUCTOS_REMOTO_URL = APPS_SCRIPT_URL + '?accion=obtener_productos';
    // Catálogos estáticos de proveedor — solo para el área 'talleres',
    // no tienen fuente en vivo posible (no vienen del Sheet).
    const CATALOGOS_PROVEEDOR_TALLERES = [
        './data/productos_talleres.json',
        './data/productos_glasurit.json',
        './data/productos_besa.json',
        './data/productos_baslac.json',
    ];
    // Deben coincidir con el CSS real de la cuadrícula (minmax + gap) en
    // cada catalogo_*.html, para poder calcular cuántas columnas caben
    // de verdad en el ancho disponible.
    const ANCHO_MIN_TARJETA = 140;
    const GAP_TARJETA = 14;
    const FILAS_OBJETIVO = 4;
    const LIMITE_MINIMO = 8;
    const LIMITE_MAXIMO = 36;

    function calcularColumnas(contenedor) {
        const ancho = contenedor.clientWidth || contenedor.parentElement.clientWidth || 800;
        return Math.max(1, Math.floor((ancho + GAP_TARJETA) / (ANCHO_MIN_TARJETA + GAP_TARJETA)));
    }

    // Cuántas tarjetas hacen falta para llenar "FILAS_OBJETIVO" filas
    // completas con el ancho real del contenedor — así nunca queda una
    // última fila a medias con hueco vacío. Se recalcula en cada
    // rotación y al redimensionar la ventana.
    function calcularLimiteResponsive(contenedor) {
        const columnas = calcularColumnas(contenedor);
        const limite = columnas * FILAS_OBJETIVO;
        return Math.min(LIMITE_MAXIMO, Math.max(LIMITE_MINIMO, limite));
    }

    // Fuente en vivo primero (siempre actualizada); si falla, cae al
    // data/productos.json estático del propio despliegue (con el mismo
    // cache-busting por versión que ya usaba antes). Para 'talleres', se
    // añaden además los 4 catálogos estáticos de proveedor — estos no
    // tienen fuente en vivo posible, así que se cargan siempre igual,
    // independientemente de si el catálogo principal vino en vivo o del
    // respaldo estático.
    async function cargarProductosPrincipalesParaMuestra_() {
        try {
            const resp = await fetch(PRODUCTOS_REMOTO_URL, { cache: 'no-store' });
            if (!resp.ok) throw new Error('obtener_productos no respondió OK');
            const datos = await resp.json();
            const productos = datos.productos || datos;
            if (!Array.isArray(productos) || productos.length === 0) throw new Error('respuesta en vivo vacía');
            return productos;
        } catch (e) {
            console.warn('catalogo-preview: fuente en vivo no disponible, usando el respaldo estático.', e);
            let productosUrl = './data/productos.json';
            try {
                const versionResp = await fetch(`./data/productos_version.json?_t=${Date.now()}`, { cache: 'no-store' });
                if (versionResp.ok) {
                    const version = await versionResp.json();
                    productosUrl += `?v=${encodeURIComponent(version.timestamp || Date.now())}`;
                }
            } catch (e2) { /* si falla, se sigue con la URL sin versión */ }
            const resp = await fetch(productosUrl);
            const datos = await resp.json();
            return datos.productos || datos;
        }
    }

    async function cargarProductosParaMuestra_(area) {
        const principales = await cargarProductosPrincipalesParaMuestra_();
        if (area !== 'talleres') return principales;

        // Catálogos de proveedor de Talleres — sin fuente en vivo posible,
        // se cargan siempre del archivo estático. Si alguno falla, se
        // sigue con los demás (mejor una muestra parcial que ninguna).
        const proveedores = await Promise.all(
            CATALOGOS_PROVEEDOR_TALLERES.map(url =>
                fetch(url).then(r => r.ok ? r.json() : { productos: [] }).catch(() => ({ productos: [] }))
            )
        );
        const productosProveedor = proveedores.flatMap(d => d.productos || d || []);
        return [...principales, ...productosProveedor];
    }

    function urlImagenProductoCatalogo(p, tamano) {
        if (!p.img) return null;
        // Los 4 catálogos estáticos de proveedor (Zaphiro/Besa/Glasurit/
        // Baslac) traen 'fabricante' y su 'img' es un nombre de archivo
        // real en assets/imagenes_talleres/, no un ID de Drive.
        if (p.fabricante) return `./assets/imagenes_talleres/${p.img}`;
        return `https://drive.google.com/thumbnail?id=${p.img}&sz=w${tamano}`;
    }

    function tieneImagenReal(p) {
        const valor = (p.img || '').toString().trim().toUpperCase();
        return valor !== '' && valor !== 'NO_TIENE_FOTO' && valor !== 'NO TIENE FOTO';
    }

    function escaparHtml(t) {
        const d = document.createElement('div');
        d.textContent = t || '';
        return d.innerHTML;
    }

    function formatearPrecio(p) {
        if (!p.mostrar_precio || !p.precio_con) return '';
        return `${p.precio_con} € <span style="font-weight:400;font-size:0.75em;color:#94a3b8;">IVA incl.</span>`;
    }

    function mezclar(array) {
        // Fisher-Yates — para que cada rotación sea una combinación
        // distinta de la anterior.
        const copia = array.slice();
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function puntuarRelevancia(p) {
        // Más alto = más relevante para aparecer en la muestra.
        let puntos = 0;
        if (p.oferta) puntos += 3;
        if (p.imagen_validada || p.fecha_actualizacion_imagen) puntos += 2;
        if (p.mostrar_precio && p.precio_con) puntos += 1;
        return puntos;
    }

    // Elige un grupo aleatorio de "numFamilias" familias (de entre TODAS
    // las que tiene el área) y reparte "limite" productos entre ellas —
    // tanto las familias elegidas como los productos dentro de cada una
    // cambian en cada llamada, para que la rotación automática dé
    // variedad real y no muestre siempre la misma combinación.
    function muestraDiversaPorFamilia(candidatos, limite, numFamilias) {
        const porFamilia = new Map();
        for (const p of candidatos) {
            const familia = p.familia || '(sin familia)';
            if (!porFamilia.has(familia)) porFamilia.set(familia, []);
            porFamilia.get(familia).push(p);
        }

        const familiasElegidas = mezclar([...porFamilia.keys()]).slice(0, numFamilias);

        // Dentro de cada familia elegida: mezclar y priorizar por
        // relevancia (ofertas, imagen validada primero).
        for (const familia of familiasElegidas) {
            const lista = porFamilia.get(familia);
            porFamilia.set(familia, mezclar(lista).sort((a, b) => puntuarRelevancia(b) - puntuarRelevancia(a)));
        }

        const muestra = [];
        let ronda = 0;
        // Ronda a ronda: una unidad de cada familia elegida por vuelta,
        // hasta llenar el límite o agotar esas familias.
        while (muestra.length < limite) {
            let añadidoEnRonda = false;
            for (const familia of familiasElegidas) {
                if (muestra.length >= limite) break;
                const lista = porFamilia.get(familia);
                if (lista.length > ronda) {
                    muestra.push(lista[ronda]);
                    añadidoEnRonda = true;
                }
            }
            if (!añadidoEnRonda) break; // esas familias ya no tienen más productos
            ronda++;
        }
        return muestra;
    }

    function tarjetaHtml(p) {
        const img = urlImagenProductoCatalogo(p, 400);
        const precio = formatearPrecio(p);
        return `
            <div style="height:100%;background:white;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;flex-direction:column;">
                <div style="aspect-ratio:1;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                    <img src="${img}" alt="${escaparHtml(p.nombre)}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fa-solid fa-image\\' style=\\'font-size:1.5rem;color:#cbd5e1;\\'></i>'" style="width:100%;height:100%;object-fit:contain;padding:8px;box-sizing:border-box;">
                </div>
                <div style="padding:10px 12px 12px;display:flex;flex-direction:column;flex:1;">
                    <p style="margin:0;font-size:0.8rem;color:#334155;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.15em;">${escaparHtml(p.nombre)}</p>
                    <p style="margin:6px 0 0;font-size:0.9rem;font-weight:700;color:#1e293b;min-height:1.2em;">${precio}</p>
                </div>
            </div>`;
    }

    // Mismo icono y estilo que el spinner principal de estas páginas
    // (#cargando-catalogo en catalogo_*.html) — coherencia visual. Ocupa
    // todo el ancho de la cuadrícula (grid-column: 1 / -1) en vez de una
    // sola celda, ya que es un único indicador, no una tarjeta más.
    function spinnerHtml_() {
        return `
            <div style="grid-column:1/-1;text-align:center;padding:40px 20px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:#94a3b8;margin-bottom:12px;display:block"></i>
                <p style="color:#64748b;font-size:0.95rem;margin:0;">Cargando productos…</p>
            </div>`;
    }

    async function cargarMuestraCatalogo(opts) {
        const { area, contenedorId, numFamilias = 5 } = opts;
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;

        // Por si se llamara dos veces para el mismo contenedor, no dejar
        // rotaciones ni listeners duplicados corriendo en paralelo.
        if (contenedor._rotacionCatalogoId) {
            clearInterval(contenedor._rotacionCatalogoId);
        }
        if (contenedor._resizeHandlerCatalogo) {
            window.removeEventListener('resize', contenedor._resizeHandlerCatalogo);
        }

        // La fuente en vivo (obtener_productos) tarda algo más que el
        // antiguo data/productos.json estático — mientras se resuelve
        // (o cae al respaldo), mostrar un spinner en vez de dejar la
        // cuadrícula vacía y sin explicación.
        contenedor.style.opacity = '1';
        contenedor.innerHTML = spinnerHtml_();

        try {
            const todos = await cargarProductosParaMuestra_(area);

            const candidatos = todos.filter(p =>
                p.area === area &&
                !p.fecha_baja &&
                tieneImagenReal(p)
            );

            if (candidatos.length === 0) {
                contenedor.style.display = 'none';
                return;
            }

            contenedor.style.transition = 'opacity 0.25s ease';

            function pintarRonda() {
                const limite = calcularLimiteResponsive(contenedor);
                contenedor._ultimasColumnas = calcularColumnas(contenedor);
                const muestra = muestraDiversaPorFamilia(candidatos, limite, numFamilias);
                contenedor.style.opacity = '0';
                setTimeout(() => {
                    contenedor.innerHTML = muestra.map(tarjetaHtml).join('');
                    contenedor.style.opacity = '1';
                }, 250);
            }

            pintarRonda();
            if (candidatos.length > LIMITE_MINIMO) {
                contenedor._rotacionCatalogoId = setInterval(pintarRonda, ROTACION_MS);
            }

            // Al redimensionar (girar el móvil, cambiar el tamaño de la
            // ventana...), repintar con el nuevo número de columnas. En
            // móvil, hacer scroll oculta/muestra la barra de direcciones
            // del navegador y eso dispara eventos "resize" continuamente
            // aunque el ancho (y por tanto las columnas) no cambien — sin
            // esta comprobación, cada scroll repintaba la muestra con
            // productos nuevos y la rotación de 10s se sentía carreras.
            // Solo se repinta si el número de columnas cambió de verdad.
            let resizeTimeout;
            contenedor._resizeHandlerCatalogo = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (calcularColumnas(contenedor) !== contenedor._ultimasColumnas) {
                        pintarRonda();
                    }
                }, 300);
            };
            window.addEventListener('resize', contenedor._resizeHandlerCatalogo);
        } catch (e) {
            console.error('No se pudo cargar la muestra del catálogo:', e);
            contenedor.style.display = 'none';
        }
    }

    window.cargarMuestraCatalogo = cargarMuestraCatalogo;
})();
