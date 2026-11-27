# Backups de Supabase

El proyecto de Supabase (compartido entre la analítica del buscador y el
Área de Clientes — ver `supabase/area_clientes_schema*.sql`) está en el
**plan Free**, que **no incluye backups automáticos** ni restauración
point-in-time. Sin esto, perder la base de datos (borrado accidental,
fallo de Supabase, un `DELETE`/`UPDATE` sin `WHERE`…) significaría perder
también los datos de los clientes — inaceptable en cuanto el Área de
Clientes esté en uso real.

Para cubrir ese hueco, el workflow `.github/workflows/backup-supabase.yml`
hace un `pg_dump` completo cada día (y también se puede lanzar a mano),
cifra el volcado y lo guarda como artefacto de esa ejecución en GitHub
Actions.

## Qué hace falta configurar (una sola vez)

En GitHub: **Settings → Secrets and variables → Actions → New repository
secret**, dos secretos:

### 1. `SUPABASE_DB_URL`

La cadena de conexión a Postgres. En el panel de Supabase:
**Project Settings → Database → Connection string → URI**.

Importante: usa la **conexión directa** (puerto `5432`), **no** la del
"Connection pooler" (puerto `6543`) — el pooler no es compatible con
`pg_dump` en modo "transaction" y puede fallar o dar un volcado
incompleto.

La cadena tiene esta forma (sustituye `[PASSWORD]` por la contraseña real
de la base de datos, la misma que se usó al crear el proyecto o la que
se resetee en ese mismo panel):

```
postgresql://postgres:[PASSWORD]@db.ptuwaqfrphmsmaadedta.supabase.co:5432/postgres
```

### 2. `BACKUP_GPG_PASSPHRASE`

Una frase de cifrado elegida por el equipo (no por Claude — nunca la
compartas en el chat ni la pegues en ningún sitio que no sea este campo
de secreto de GitHub). Protege el volcado, que contiene datos personales
de clientes (nombre, email, dirección, teléfono). Guárdala también en un
gestor de contraseñas: **si se pierde esta frase, los backups cifrados
no se pueden recuperar**.

## Cómo comprobar que funciona

**Actions → Backup de Supabase → Run workflow** (botón "workflow_dispatch"
arriba a la derecha) para lanzarlo a mano sin esperar a la próxima
ejecución programada (03:21 UTC cada día). Si termina en verde, entra en
esa misma ejecución y comprueba que aparece un artefacto
`backup-supabase-<run_id>` descargable.

## Cómo restaurar un backup

1. Descarga el artefacto (`.zip`) desde la ejecución de Actions
   correspondiente y descomprímelo — dentro hay un archivo
   `backup-supabase-AAAA-MM-DD.dump.gpg`.
2. Descífralo (pide la frase de `BACKUP_GPG_PASSPHRASE`):
   ```
   gpg --batch --yes --passphrase "LA_FRASE" --output backup.dump \
       backup-supabase-AAAA-MM-DD.dump.gpg
   ```
3. Restaura contra la base de datos (¡revisa bien el destino antes de
   ejecutar esto — sustituye datos existentes!):
   ```
   pg_restore --clean --if-exists --no-owner --no-privileges \
       -d "postgresql://postgres:[PASSWORD]@db.ptuwaqfrphmsmaadedta.supabase.co:5432/postgres" \
       backup.dump
   ```
   Para restaurar en un proyecto de Supabase nuevo (p. ej. si el
   original se perdiera del todo), usa la cadena de conexión de ese
   proyecto nuevo en su lugar.

## Límites a tener en cuenta

- **Retención de 90 días**: es el máximo que permite GitHub para
  artefactos de Actions. Pasado ese tiempo, el artefacto desaparece
  solo. Si en algún momento hace falta guardar backups más allá de esos
  90 días (por ejemplo, una copia mensual "fría" indefinida), habría que
  añadir un paso que suba el volcado cifrado a un almacenamiento propio
  (otro repositorio privado, un bucket S3/GCS, etc.) — se puede añadir
  cuando haga falta, sin tocar el resto del workflow.
- **Plan Free de Supabase**: si el volumen de clientes/datos crece de
  verdad, merece la pena valorar subir a un plan de pago (backups
  automáticos diarios + restauración point-in-time nativos de
  Supabase) como red de seguridad adicional a este backup propio, no
  como sustituto — dos copias independientes son mejor que una.
