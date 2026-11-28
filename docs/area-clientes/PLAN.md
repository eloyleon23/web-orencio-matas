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
- Panel de "Usuarios" (solo administrador) ✅ —
  `area-clientes/gestion/usuarios.html`: listado de todos los
  perfiles, dar de alta comercial/almacén/administrador (Edge Function
  `alta-usuario-interno`), editar nombre/apellidos/rol, restablecer
  contraseña y bloquear/reactivar (`profiles.activo`, ahora también
  comprobado en el login para cualquier rol, no solo cliente).
- Comercial/almacén/administrador pueden sustituir, quitar o añadir
  productos del pedido (no solo rectificar cantidad) mientras siga en
  "recibida" o "en preparación", con buscador de catálogo y doble
  confirmación. ✅

### Fase 6 — Notificaciones y puente con el CRM
- Matriz de notificaciones por correo (cliente, comercial, correo
  general, administración). ✅ Cubierto en cada transición:
  - Cliente envía pedido (→ recibida): al cliente y al correo general
    (`notificar-pedido`), **y además** al comercial asignado a ese
    cliente en persona (su propio email, no solo el buzón genérico).
  - Comercial confirma (→ en_preparación): avisa a almacén +
    administrador (hay un pedido nuevo que preparar).
  - Almacén prepara (→ lista_para_enviar): avisa a oficina +
    administrador (ya se puede hacer albarán/factura).
  - Oficina cierra (→ en_reparto / entregada): avisa al cliente.
  Todo vía `notificar-cambio-estado` (tipos `en_preparacion` /
  `lista_para_enviar` / `en_reparto` / `entregada`), salvo el primer
  paso que sigue en `notificar-pedido`. Un fallo de envío nunca
  bloquea el cambio de estado, solo se registra para depurar.
- **Bug crítico encontrado validando esta fase (28/11/2026):** ningún
  cliente ha podido enviar nunca un pedido desde que existe la máquina
  de estados (Fase 5) — `transicion_pedido_permitida_` nunca tuvo un
  caso para que el propio cliente pase su borrador a "recibida", así
  que el trigger lo rechazaba siempre. Corregido en
  `area_clientes_schema_fase6d_fix_cliente_enviar_pedido.sql` (tercer
  SQL a ejecutar, después de la Fase 6c).
- Doble confirmación de almacén → aviso a administración para
  albarán/factura. ✅ En cuanto almacén/administrador pasa un pedido a
  "lista para enviar", `notificar-cambio-estado` (tipo
  `lista_para_enviar`) avisa por correo a todos los usuarios activos
  con rol oficina o administrador (son quienes hacen el
  albarán/factura y cierran el pedido).
- Cierre del pedido por administrador (números de albarán/factura →
  habilita "En reparto"). ✅ Ya desde Fase 5 (nº de albarán/factura
  desde el detalle del pedido en cuanto está "lista para enviar", con
  quién confirmó/preparó/cerró/entregó cada pedido). Nueva Edge
  Function `notificar-cambio-estado` (misma familia de secretos que
  `notificar-pedido` — ver su CONFIGURACION.md): avisa por correo al
  cliente al pasar a "en_reparto" (transportista/seguimiento) y a
  "entregada".
- Solicitud de copia de factura por el cliente. ✅ Botón "Solicitar
  copia de factura" en "Mis pedidos" (solo en pedidos "entregada") —
  envía un correo a `PEDIDOS_EMAIL_DESTINO` con el nº de factura si ya
  está puesto.
- Entregable revisable: flujo de notificaciones end-to-end con buzones
  de prueba. — Pendiente de probar en el preview (necesita desplegar
  la función `notificar-cambio-estado` — el workflow de GitHub Actions
  lo hace solo con el próximo push a supabase/functions/**, o a mano
  desde la pestaña Actions).

### Sección de Estadísticas (Fase 5, añadida después)
- `area-clientes/gestion/estadisticas.html`: cuántos pedidos
  confirmó/preparó/cerró/entregó cada uno, por mes (últimos 12) y por
  año. Cada usuario ve solo las suyas, salvo administrador, que tiene
  un selector para ver las de cualquier usuario (ver Fase 6).

### Fase 6b — Nuevo rol "oficina" (aditivo, administrador sin límites)

A petición explícita de Eloy (28/11/2026): separar "quien hace el
albarán/factura y cierra el pedido" (nuevo rol "oficina") de
"quien da de alta usuarios internos" (administrador). Importante:
administrador es y sigue siendo un super-rol sin ninguna limitación —
oficina se AÑADE como rol nuevo, no le quita nada a administrador.
(Hubo un primer intento, corregido en el acto por Eloy, que recortaba
a administrador a solo la sección Usuarios — ver Fase 6c.)

- **oficina** (nuevo): ve todos los pedidos y todos los clientes, da de
  alta clientes, hace el albarán/factura y cierra el pedido
  (Lista para enviar → En reparto → Entregada), salvo la rectificación
  por falta de stock (eso sigue siendo solo de almacén). Ve únicamente
  sus propias estadísticas, igual que comercial/almacén.
- **administrador**: sin ninguna limitación — todo lo que hace
  comercial + almacén + oficina juntos (clientes, pedidos, cualquier
  transición de estado, estadísticas de todos los usuarios con
  selector), y además es el ÚNICO rol que gestiona la sección
  "Usuarios" (dar de alta/editar/bloquear cualquier usuario interno,
  de cualquier rol).
- **comercial** y **almacén**: sin cambios.

SQL en tres pasos obligatorios, en ESE orden (Postgres no deja usar un
valor nuevo de un enum en la misma transacción en la que se crea):
1. `area_clientes_schema_fase6b_rol_oficina_1_enum.sql` — añade el
   valor 'oficina' al enum. Solo, él solito.
2. `area_clientes_schema_fase6b_rol_oficina_2_permisos.sql` — políticas
   RLS y máquina de estados para oficina.
3. `area_clientes_schema_fase6c_admin_sin_limitaciones.sql` — corrige
   el paso 2 para que administrador conserve el 100% de su acceso
   previo (el paso 2, por error, le había quitado permisos).

También tocadas: Edge Functions `alta-cliente`, `importar-clientes`,
`simular-acceso` (exigen `comercial`/`oficina`/`administrador`) y
`alta-usuario-interno` (puede crear el rol `oficina`, solo accesible
para administrador).

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
