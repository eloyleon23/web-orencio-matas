// Cliente Supabase compartido por todas las páginas del área de
// clientes. Mismo proyecto que la analítica del buscador
// (supabase/schema.sql) — decisión explícita de Eloy — pero
// completamente aislado por tablas y RLS propias (ver
// supabase/area_clientes_schema.sql). La clave "anon" es pública por
// diseño de Supabase: lo que protege los datos es Row Level Security,
// nunca el secreto de esta clave.
window.SUPABASE_URL = 'https://ptuwaqfrphmsmaadedta.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dXdhcWZycGhtc21hYWRlZHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzYwOTEsImV4cCI6MjEwNjQ1MjA5MX0.-NgRcVCBe0JGIt7FqGGAXhtgQicsoM2rGsePGdATA1k';

window.obtenerClienteSupabase_ = function () {
    if (!window._clienteSupabase) {
        window._clienteSupabase = window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY
        );
    }
    return window._clienteSupabase;
};

// Comprueba que haya una sesión activa; si no, redirige al login.
// Usarlo al principio de cualquier página que requiera estar logueado.
window.exigirSesionAreaClientes_ = async function () {
    const cliente = window.obtenerClienteSupabase_();
    const { data } = await cliente.auth.getSession();
    if (!data.session) {
        window.location.href = 'index.html';
        return null;
    }
    return data.session;
};
