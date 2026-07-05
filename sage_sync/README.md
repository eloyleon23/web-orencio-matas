# sage_sync/ — Conector con Sage 200cloud (SQL Server)

Herramienta para explorar y, más adelante, sincronizar automáticamente el
listado de productos y precios desde vuestro Sage 200cloud hacia el Sheet
de Productos — en sustitución del proceso manual actual (exportar de Sage
y pegar en `RegistroProductos`).

## Por qué en dos fases

**Fase 1 (esto):** un script de solo lectura que explora el esquema real de
vuestra base de datos y localiza las tablas de productos y precios. Necesario
porque el esquema de Sage 200 varía según versión/edición y no se puede
adivinar a ciegas sin arriesgarse a leer (o peor, escribir) donde no se debe.

**Fase 2 (siguiente paso, una vez tengamos el resultado de la Fase 1):** el
script de sincronización real, que lee esas tablas y actualiza
`RegistroProductos` (o directamente `Productos`) de forma periódica.

## Requisito imprescindible: usuario de solo lectura

Antes de nada, pide a quien administre Sage 200 (informático interno o el
partner que os implantó Sage) un **usuario de SQL Server de solo lectura**
sobre la base de datos de la empresa. Dile literalmente esto:

> "Necesito un login de SQL Server con permiso `db_datareader` (solo
> lectura) sobre la base de datos de Sage 200 de nuestra empresa, para un
> proceso externo de solo consulta. No necesita permisos de escritura ni
> de administración."

Esto es importante por seguridad: nunca uses el usuario de administración
de Sage para esto, y nunca dejes que el script tenga permiso de escritura
sobre la base de datos contable.

## Instalación

1. Instala el driver ODBC de SQL Server (gratuito, de Microsoft) si no lo
   tienes: ["ODBC Driver 17 for SQL Server"](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)
2. Instala pyodbc:
   ```bash
   pip install pyodbc --break-system-packages
   ```
3. Crea `credenciales_sage.json` en esta misma carpeta (protegido por
   `.gitignore`, nunca se sube al repo):
   ```json
   {
     "servidor": "NOMBRE-DEL-SERVIDOR\\INSTANCIA",
     "usuario": "usuario_solo_lectura",
     "password": "la_contraseña",
     "base_datos": "NOMBRE_BASE_DATOS_EMPRESA"
   }
   ```
   El nombre del servidor/instancia y de la base de datos te los da la misma
   persona que te cree el usuario — normalmente algo como
   `SERVIDOR-SAGE\SAGE200` y un nombre de base de datos con el nombre de la
   empresa.

## Uso

```bash
# Ver qué bases de datos ve este usuario (para confirmar que apuntas a la correcta)
python explorar_esquema.py --solo-listar-bd

# Buscar tablas de productos/precios (por defecto ya busca las palabras típicas)
python explorar_esquema.py

# Ampliar o cambiar las palabras de búsqueda si las tablas usan otro naming
python explorar_esquema.py --buscar "articulo,linea,catalogo"
```

Todo es de **solo lectura** — no modifica nada, solo consulta metadatos
(`INFORMATION_SCHEMA`) y muestra una muestra de 3 filas por tabla candidata.

## Qué hacer con el resultado

Copia la salida completa (o la parte que reconozcas como relevante) y
compártela para que identifiquemos juntos:
- Cuál es la tabla real de artículos/productos (código, nombre, familia...)
- Cuál es la tabla de precios de venta (y si hay varias tarifas, cuál es la
  aplicable a vuestro catálogo público)
- Cómo se marca un producto como activo/dado de baja

Con eso construimos la Fase 2: el script de sincronización periódica real.

## Seguridad — resumen

- Usuario de SQL Server **de solo lectura**, nunca de administración
- Credenciales solo en `credenciales_sage.json`, nunca en el repositorio
  (protegido por `.gitignore`)
- El script corre en un equipo dentro de vuestra propia red (nunca desde
  GitHub Actions ni ningún servicio en la nube) — la base de datos de Sage
  no debe ser accesible desde internet bajo ninguna circunstancia
- Solo se leerán los campos necesarios para el catálogo público (código,
  nombre, precio, estado activo/baja) — nunca datos de clientes, contables
  ni bancarios
