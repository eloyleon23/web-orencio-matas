# Notificaciones de pedido — configuración

Esta función envía el correo cuando un cliente envía un pedido desde
`propuesta.html`. Deliberadamente **separada** de cualquier otro envío
de correo del proyecto (el de Apps Script/BREVO_API_KEY que usa el
formulario de contacto de la web pública, por ejemplo) — petición
explícita de Eloy: poder cambiar o dedicar un correo propio a pedidos
más adelante sin tocar nada de los demás flujos.

## Desplegar la función (una vez, y cada vez que cambie el código)

```
npx supabase login
npx supabase link --project-ref ptuwaqfrphmsmaadedta
npx supabase functions deploy notificar-pedido
```

## Secretos (Supabase → Edge Functions → Secrets)

Ninguno de estos se comparte con los secretos de GitHub Actions ni con
las Propiedades del script de Apps Script — viven solo aquí, y
cambiarlos no afecta a nada más del proyecto.

| Secreto | Obligatorio | Qué es |
|---|---|---|
| `BREVO_API_KEY` | Sí | Clave de la API de Brevo. Puede ser la misma cuenta que ya usa Apps Script, pero hay que volver a pegarla aquí como secreto propio — Supabase no la hereda de ningún otro sitio. |
| `PEDIDOS_EMAIL_REMITENTE` | Sí | Dirección de remitente — tiene que estar **verificada en Brevo** como remitente válido (si no, Brevo rechaza el envío). Puede ser la misma que ya usa Apps Script (`correo@orenciomatas.es`) u otra. |
| `PEDIDOS_EMAIL_DESTINO` | No* | A qué dirección(es) llega el aviso **interno** de cada pedido (gestión/comercial). Admite varias separadas por comas. **Mientras se están haciendo pruebas, aquí va el correo de quien esté evaluando** — el día que haya un buzón dedicado a pedidos, basta con cambiar este único valor. Si se deja vacío, simplemente no se manda el aviso interno (no da error). |
| `PEDIDOS_ACTIVAR_CLIENTES_REALES` | No | La copia de confirmación "para el cliente" **siempre se envía** (no es opcional) — este interruptor decide solo A QUIÉN. `true` = al email real del cliente (su perfil). Cualquier otro valor, o no definirlo (el estado por defecto, pensado para la fase de pruebas), = se manda en su lugar a `PEDIDOS_EMAIL_PRUEBA_CLIENTE`, simulando exactamente lo mismo que vería un cliente real sin arriesgarse a avisar a uno de verdad. |
| `PEDIDOS_EMAIL_PRUEBA_CLIENTE` | No* | Dirección de pruebas que recibe la copia "para el cliente" mientras `PEDIDOS_ACTIVAR_CLIENTES_REALES` no esté en `true`. Si se deja vacío y el interruptor sigue en `false`, esa copia simplemente no se envía (no da error, solo queda sin destino). |
| `AREA_CLIENTES_URL` | No | Raíz pública del Área de Clientes (sin barra final) — p. ej. `https://eloyleon23.github.io/web-orencio-matas-preview/area-clientes` mientras se prueba contra el preview, o `https://clientes.orenciomatas.es` el día que tenga subdominio propio. Se usa para el botón "Ir al pedido"/"Ver cliente" del correo. Sin este secreto, el correo sale sin botón (nunca es motivo para no enviarlo). |

\* Técnicamente opcional (la función no falla si no está), pero sin él
no llega ningún aviso a nadie del lado interno — en la práctica, para
que esto sirva de algo, hace falta rellenarlo.

### Ejemplo — fase de pruebas actual

```
BREVO_API_KEY=<la clave de Brevo>
PEDIDOS_EMAIL_REMITENTE=correo@orenciomatas.es
PEDIDOS_EMAIL_DESTINO=eloyleon23@gmail.com
PEDIDOS_ACTIVAR_CLIENTES_REALES=false
PEDIDOS_EMAIL_PRUEBA_CLIENTE=eloyleon23@gmail.com
AREA_CLIENTES_URL=https://eloyleon23.github.io/web-orencio-matas-preview/area-clientes
```
(con esto, TODO lo que generaría un pedido — tanto el aviso interno
como la copia "simulando ser el cliente" — llega a tu correo, sin
tocar ninguna dirección real de cliente.)

### Ejemplo — producción, avisando ya a clientes reales

```
PEDIDOS_ACTIVAR_CLIENTES_REALES=true
```
(el aviso interno sigue yendo a `PEDIDOS_EMAIL_DESTINO` igual que
siempre; lo único que cambia es que la copia de confirmación pasa a
llegar al email real de cada cliente en vez de al de pruebas.)

## Cómo poner los secretos

Panel de Supabase → el proyecto → **Edge Functions** → **Secrets** →
añadir cada uno (nombre y valor). No hace falta reiniciar ni
redesplegar nada tras cambiarlos — la función los lee en cada
ejecución.

## Qué pasa si falla el envío del correo

Nunca deshace ni bloquea el pedido — el pedido ya ha quedado guardado
como "recibida" en la base de datos ANTES de llamar a esta función.
Un fallo aquí (API Key mal puesta, remitente no verificado en Brevo,
etc.) solo se registra en la consola del navegador del cliente
(`console.warn`) para poder depurarlo; el cliente ve igualmente su
pedido confirmado y puede consultarlo en "Mis pedidos".
