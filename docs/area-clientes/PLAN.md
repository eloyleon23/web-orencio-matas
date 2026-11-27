# Área de Clientes — plan de desarrollo

Rama de trabajo: `feature/area-clientes` (creada desde `main` el 2026-11-26).
Previsualización: repo `eloyleon23/web-orencio-matas-preview`, que cada
15 min sincroniza el contenido de esta rama y lo publica en su propio
GitHub Pages — sin tocar preproducción (main) ni producción (IONOS).
No se libera nada a esos dos entornos hasta validación completa.

Especificación funcional completa (roles, estados del pedido,
notificaciones, mockups): ver el documento ya entregado
("Área de Clientes — Especificación").

## Estrategia

Cada fase deja algo navegable y revisable en la previsualización antes
de pasar a la siguiente. Dentro de cada fase, cada tarea se sube como
commit propio a esta rama para poder seguir el avance en el historial.

### Fase 1 — Cimentación (Supabase + esqueleto de la web nueva)
- Proyecto Supabase: esquema inicial (`clientes`, `comerciales`,
  `perfiles_acceso`, roles) y políticas RLS básicas.
- Esqueleto estático de `clientes.orenciomatas.es` (estructura de
  carpetas, layout base, tokens de estilo) servido desde esta rama.
- Pantalla de login (email/password) funcional contra Supabase Auth,
  sin personalización todavía — solo entrar/salir.
- Entregable revisable: login real + página en blanco tras entrar.

### Fase 2 — Alta y acceso
- Alta individual de cliente (comercial, verificación de email
  duplicado, ID de CRM opcional).
- Importación masiva (CSV/Excel) con relleno de campos sin re-enviar
  invitación si ya está confirmado.
- Formulario público "Solicitar acceso" (sin login) con envío de
  correo a gestión.
- Simulación de acceso (token de solo visualización, registrado).
- Entregable revisable: alta de un cliente de prueba de principio a fin.

### Fase 3 — Catálogo personalizado del cliente
- Filtros por cliente (familias/áreas/productos visibles).
- Precio/descuento personalizado por cliente.
- Página de catálogo del área de clientes reutilizando el API de
  `obtener_productos` existente (solo la capa de datos, no el HTML
  actual de 30k líneas).
- Entregable revisable: un cliente de prueba viendo su catálogo propio.

### Fase 4 — Propuestas de pedido (cliente)
- Construcción de la propuesta (antigua "lista de la compra"),
  persistida en BBDD.
- Reutilizar pedido anterior como base, borrar propuestas no emitidas.
- "Mi cuenta": listado de pedidos propios y su estado.
- Entregable revisable: ciclo completo de creación de un pedido.

### Fase 5 — Panel de gestión (comercial / almacén / administrador)
- Listado de clientes por comercial / todos para admin. ✅ (ya existía
  desde la Fase 2, `area-clientes/gestion/clientes.html`.)
- Listado de propuestas de pedido con estado y detalle. ✅
  `area-clientes/gestion/pedidos.html` — listado filtrable por
  cliente/estado + modal de detalle, visible para comercial
  (sus clientes), almacén (todo lo no-borrador) y administrador (todo).
- Máquina de estados completa: Borrador → Recibida → En preparación →
  Lista para enviar → En reparto → Entregada, con permisos de edición
  por rol y por estado. ✅ `supabase/area_clientes_schema_fase5.sql` —
  un paso de la máquina por rol (comercial confirma recibida→en
  preparación, almacén prepara→lista para enviar, administrador cierra
  el resto), impuesto con un trigger en la propia base de datos.
- Rectificación de pedidos por falta de stock (con diff para el
  cliente). ✅ Almacén edita `cantidad_confirmada`/
  `motivo_rectificacion` por línea mientras el pedido está "en
  preparación"; el cliente ve el aviso de diferencia en
  "Mis pedidos" en cuanto difiere de lo que pidió.
- Entregable revisable: un pedido gestionado de principio a fin por los
  tres roles de gestión. — Pendiente de validación por Eloy sobre la
  previsualización (hace falta una cuenta de prueba con rol "almacen":
  ver la nota al final de area_clientes_schema_fase5.sql).

### Fase 6 — Notificaciones y puente con el CRM
- Matriz de notificaciones por correo (cliente, comercial, correo
  general, administración).
- Doble confirmación de almacén → aviso a administración para
  albarán/factura.
- Cierre del pedido por administrador (números de albarán/factura →
  habilita "En reparto").
- Solicitud de copia de factura por el cliente.
- Entregable revisable: flujo de notificaciones end-to-end con buzones
  de prueba.

### Fase 7 — Endurecimiento y validación final
- Revisión de seguridad (RLS, aislamiento de datos entre clientes,
  separación legal CRM/web).
- Pruebas con el volumen real esperado (~100 clientes).
- Validación funcional completa por Eloy sobre la previsualización.
- **Secretos por entorno (demo/producción) — pendiente, anotado
  explícitamente por Eloy el 27/11/2026 para no olvidarlo.** Ahora
  mismo todo (Supabase, Edge Functions, sus secretos) es un único
  proyecto/entorno compartido por el preview y lo que más adelante
  sea producción. Antes de abrir el Área de Clientes a clientes reales
  hace falta decidir y montar cómo conviven DEMO y PROD sin pisarse,
  como mínimo para:
    - `notificar-pedido` (ver supabase/functions/notificar-pedido/
      CONFIGURACION.md): `PEDIDOS_EMAIL_DESTINO`,
      `PEDIDOS_ACTIVAR_CLIENTES_REALES`, `PEDIDOS_EMAIL_PRUEBA_CLIENTE`,
      `AREA_CLIENTES_URL` tienen que poder ser distintos en demo y en
      producción (en demo, todo a un correo de pruebas y clientes
      reales desactivados; en producción, al revés).
    - Backup de Supabase (`SUPABASE_DB_URL`, `BACKUP_GPG_PASSPHRASE` —
      ver supabase/BACKUPS.md): si hay un proyecto de Supabase por
      entorno, cada uno necesita su propio backup configurado aparte.
    - Cualquier Edge Function nueva que se añada en fases siguientes
      (Fase 5/6) con esta misma necesidad.

      Dos caminos posibles a valorar entonces (no decidido todavía):
      (a) un proyecto de Supabase separado por entorno (más limpio,
      más aislado, pero hay que duplicar esquema/RLS y mantener los
      dos sincronizados), o (b) un solo proyecto con secretos
      duplicados por sufijo (`_DEMO`/`_PROD`) y la función decidiendo
      cuál usar según de dónde llega la petición. Se decide y se monta
      en esta fase, antes de la puesta en producción — no antes,
      porque hasta entonces no hay "producción" real que proteger.
- Solo tras esta fase: planificación de la puesta en producción
  (subdominio IONOS, DNS, primer alta real).

## Seguimiento

El avance se va reflejando en commits en `feature/area-clientes` y en
la previsualización (repo `web-orencio-matas-preview`, hasta 15 min de
retardo). Al cierre de cada fase se avisa explícitamente para validar
antes de continuar con la siguiente.
