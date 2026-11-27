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
| `PEDIDOS_NOTIFICAR_CLIENTE` | No | `true` para enviar TAMBIÉN una copia de confirmación al propio cliente (a su email real de perfil). Cualquier otro valor, o no definirlo, significa que NO se le envía nada al cliente todavía — pensado para probar el aviso interno primero, sin riesgo de mandar nada a una dirección real de cliente por error. |
| `PEDIDOS_EMAIL_PRUEBA` | No | Si está definido, la copia "para el cliente" (solo se envía si `PEDIDOS_NOTIFICAR_CLIENTE=true`) se manda **aquí** en vez de al email real del cliente — para poder probar ese segundo flujo de principio a fin sin arriesgarse a avisar a un cliente real todavía. Se quita este secreto (o se deja vacío) el día que se quiera notificar de verdad a los clientes reales. |

\* Técnicamente opcional (la función no falla si no está), pero sin él
no llega ningún aviso a nadie del lado interno — en la práctica, para
que esto sirva de algo, hace falta rellenarlo.

### Ejemplo — fase de pruebas actual

```
BREVO_API_KEY=<la clave de Brevo>
PEDIDOS_EMAIL_REMITENTE=correo@orenciomatas.es
PEDIDOS_EMAIL_DESTINO=<el correo de quien está evaluando>
PEDIDOS_NOTIFICAR_CLIENTE=false
```

### Ejemplo — cuando se quiera probar también el aviso al cliente, sin arriesgarse todavía con clientes reales

```
PEDIDOS_NOTIFICAR_CLIENTE=true
PEDIDOS_EMAIL_PRUEBA=<otro correo de pruebas>
```

### Ejemplo — producción, avisando ya a clientes reales

```
PEDIDOS_NOTIFICAR_CLIENTE=true
```
(sin `PEDIDOS_EMAIL_PRUEBA` — así la copia de confirmación va al email real de cada cliente.)

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
