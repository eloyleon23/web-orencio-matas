// Cliente Supabase compartido por todas las páginas del área de
// clientes. Mismo proyecto que la analítica del buscador
// (supabase/schema.sql) — decisión explícita de Eloy — pero
// completamente aislado por tablas y RLS propias (ver
// supabase/area_clientes_schema.sql). La clave "anon" es pública por
// diseño de Supabase: lo que protege los datos es Row Level Security,
// nunca el secreto de esta clave.
window.SUPABASE_URL = 'https://ptuwaqfrphmsmaadedta.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dXdhcWZycGhtc21hYWRlZHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzYwOTEsImV4cCI6MjEwNjQ1MjA5MX0.-NgRcVCBe0JGIt7FqGGAXhtgQicsoM2rGsePGdATA1k';

// "simulacion", si se pasa true, usa una clave de almacenamiento
// distinta ('sb-simulacion-auth') — así la sesión de simulación de un
// cliente vive aparte de la sesión normal del comercial/administrador
// en el mismo navegador (misma pestaña o distinta, da igual): abrir
// una simulación nunca puede cerrar ni pisar la sesión de quien la
// abre. Ver area-clientes/simular.html.
window.obtenerClienteSupabase_ = function (simulacion) {
    const clave = simulacion ? '_clienteSupabaseSimulacion' : '_clienteSupabase';
    if (!window[clave]) {
        window[clave] = window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY,
            simulacion ? { auth: { storageKey: 'sb-simulacion-auth' } } : undefined
        );
    }
    return window[clave];
};

// Comprueba que haya una sesión activa; si no, redirige al login.
// Usarlo al principio de cualquier página que requiera estar logueado.
// "rutaLogin" varía según la profundidad de la página (p. ej.
// '../index.html' desde dentro de gestion/).
window.exigirSesionAreaClientes_ = async function (rutaLogin) {
    const cliente = window.obtenerClienteSupabase_();
    const { data } = await cliente.auth.getSession();
    if (!data.session) {
        window.location.href = rutaLogin || 'index.html';
        return null;
    }
    return data.session;
};

// Exige además que el rol del usuario sea uno de los permitidos — para
// las páginas del panel de gestión. Si no hay sesión o el rol no
// cuadra, redirige y no deja seguir.
window.exigirRolAreaClientes_ = async function (rolesPermitidos, rutaLogin, rutaSinPermiso) {
    const sesion = await window.exigirSesionAreaClientes_(rutaLogin);
    if (!sesion) return null;

    const cliente = window.obtenerClienteSupabase_();
    const { data: perfil, error } = await cliente
        .from('profiles')
        .select('rol, nombre, apellidos')
        .eq('id', sesion.user.id)
        .single();

    if (error || !perfil || !rolesPermitidos.includes(perfil.rol)) {
        window.location.href = rutaSinPermiso || rutaLogin || 'index.html';
        return null;
    }
    return { sesion, perfil };
};

// Modal de confirmación con estilo propio, en vez del confirm()
// nativo del navegador (sin marca y sin forma de resaltar que la
// acción es delicada). Crea la modal en el DOM la primera vez que se
// llama y la reutiliza después. Devuelve una promesa: true si se
// confirma, false si se cancela o se cierra de cualquier otra forma.
window.confirmarModal_ = function (titulo, texto, textoBotonConfirmar, peligroso) {
    let overlay = document.getElementById('modalConfirmarOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modalConfirmarOverlay';
        overlay.className = 'modal-confirmar-overlay';
        overlay.innerHTML =
            '<div class="modal-confirmar">' +
                '<h3 class="modal-confirmar__titulo" id="modalConfirmarTitulo"></h3>' +
                '<p class="modal-confirmar__texto" id="modalConfirmarTexto"></p>' +
                '<div class="modal-confirmar__botones">' +
                    '<button type="button" class="boton-secundario" id="modalConfirmarCancelar">Cancelar</button>' +
                    '<button type="button" class="boton-principal" id="modalConfirmarAceptar"></button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
    }

    document.getElementById('modalConfirmarTitulo').textContent = titulo;
    document.getElementById('modalConfirmarTexto').textContent = texto;
    const botonAceptar = document.getElementById('modalConfirmarAceptar');
    botonAceptar.textContent = textoBotonConfirmar || 'Confirmar';
    botonAceptar.style.background = peligroso ? 'var(--danger)' : '';

    overlay.classList.add('activo');

    return new Promise(function (resolve) {
        function cerrar_(resultado) {
            overlay.classList.remove('activo');
            botonAceptar.removeEventListener('click', onAceptar_);
            document.getElementById('modalConfirmarCancelar').removeEventListener('click', onCancelar_);
            overlay.removeEventListener('click', onFondo_);
            resolve(resultado);
        }
        function onAceptar_() { cerrar_(true); }
        function onCancelar_() { cerrar_(false); }
        function onFondo_(ev) { if (ev.target === overlay) cerrar_(false); }

        botonAceptar.addEventListener('click', onAceptar_);
        document.getElementById('modalConfirmarCancelar').addEventListener('click', onCancelar_);
        overlay.addEventListener('click', onFondo_);
    });
};
