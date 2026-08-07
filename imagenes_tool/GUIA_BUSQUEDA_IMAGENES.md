# Guía de uso — Búsqueda, revisión y subida de imágenes de producto

Esta es la guía de referencia del proceso **real y actual** para encontrar,
revisar y subir imágenes de producto a Drive. Sustituye al `README.md`
antiguo de esta carpeta, que describe un enfoque anterior (APIs de bancos de
imágenes tipo Unsplash/Pexels/Bing genérico) ya no usado en la práctica.

Ningún script de esta carpeta modifica el Sheet o Drive **salvo**
`subir_imagenes_validadas.py`, que es el único paso que escribe de verdad.
Todo lo anterior (búsqueda, revisión) trabaja en local sin tocar nada online.

---

## 1. Resumen del flujo completo

```
1. Exportar Excel filtrado desde el Sheet (uno por área)
        ↓
2. BUSCAR   → buscar_imagenes_excel.py (Droguería/Perfumería/Pinturas)
              casar_imagenes_talleres.py (Talleres)
        ↓
3. REVISAR  → generar_revision_html.py  (visor HTML, aprobar/rechazar)
        ↓
4. SUBIR    → subir_imagenes_validadas.py (Drive + Sheet)
```

Los pasos 2 y 3 son solo lectura y se pueden repetir tantas veces como haga
falta sin ningún riesgo. El paso 4 es el único que escribe en Drive/Sheet.

---

## 2. Scripts disponibles

### Activos (el flujo real, usar siempre estos)

| Script | Para qué área | Qué hace |
|---|---|---|
| `buscar_imagenes_excel.py` | Droguería, Perfumería, Pinturas | Busca en las webs de marca/fabricante configuradas en `marcas_dominios.json`, más varios respaldos genéricos |
| `casar_imagenes_talleres.py` | Talleres y Carrocerías | Empareja contra las fotos **ya extraídas** de los catálogos Zaphiro/Besa (no busca en la web — es la vía que de verdad funciona para esta área) |
| `generar_revision_html.py` | Las 4 áreas | Genera un visor HTML para aprobar/rechazar visualmente lo encontrado |
| `subir_imagenes_validadas.py` | Las 4 áreas | Sube a Drive y actualiza el Sheet lo ya aprobado |
| `BUSCAR_IMAGENES_SIN_VALIDAR.bat` | Las 4 áreas de golpe | Lanza `buscar_imagenes_excel.py`/`casar_imagenes_talleres.py` automáticamente para los 4 excels si están presentes |

### Secundarios / heredados (no forman parte del flujo estándar)

`buscar_imagenes_unsplash.py`, `buscar_imagenes_pexels.py`,
`buscar_imagenes_pixabay.py`, `buscar_imagenes_descripcion.py`,
`buscar_imagenes_gratis.py`, `buscar_imagenes_api.py`,
`buscar_imagenes_barcode.py`, `titan_buscar_imagenes.py`, `normalizar.py`,
`probar_apis_manual.py`, `sincronizar_drive_sheet.py`. Son experimentos o
utilidades puntuales de sesiones anteriores; no hace falta usarlos salvo que
se indique expresamente para un caso concreto.

---

## 3. Cómo deben llamarse los Excel de entrada

### Para el `.bat` (lanzar las 4 áreas de golpe)

El `.bat` busca **exactamente** estos 4 nombres, en la misma carpeta que él:

```
ProductosSinFotoValidada_DROGUERIA.xlsx
ProductosSinFotoValidada_PERFUMERIA.xlsx
ProductosSinFotoValidada_PINTURAS.xlsx
ProductosSinFotoValidada_TALLERES.xlsx
```

Si falta alguno, simplemente se omite esa área (no da error). No hace falta
tener los 4 a la vez.

### Para lanzar un script suelto con `--excel`

Puede llamarse como se quiera — el nombre del archivo no importa, lo que
importan son sus **columnas**.

### Columnas requeridas y alias automáticos

Columnas mínimas: **`referencia`** y **`nombre`**. Si faltan, el script para
con error indicando qué falta.

El Excel exportado directamente de la hoja `Productos` del Sheet trae
`tipologia` (no `familia`) y no trae `codigo`. El script aplica alias
automáticos y lo avisa por consola:

- `tipologia` → se usa como `familia`
- `referencia` → se usa como `codigo`

Columnas opcionales que mejoran la búsqueda si están presentes: `familia`,
`area`, `codigo`, `imagen_drive_id`, `imagen_validada`.

### Filtrado automático de qué productos procesar

Si el Excel trae `imagen_drive_id`, se filtra a los que valgan literalmente
`NO_TIENE_FOTO`. Si además trae `imagen_validada`, el filtro se amplía a
**también** los que tengan foto pero sigan sin validar (celda vacía) — es un
superconjunto, cubre ambos casos con un único Excel. Si no aporta ninguna de
las dos columnas, se procesan todas las filas.

---

## 4. Comandos por área — Búsqueda

### Droguería / Perfumería / Pinturas

```bash
python buscar_imagenes_excel.py --excel ProductosSinFotoValidada_DROGUERIA.xlsx --salida resultados_DROGUERIA --debug
python buscar_imagenes_excel.py --excel ProductosSinFotoValidada_PERFUMERIA.xlsx --salida resultados_PERFUMERIA --debug
python buscar_imagenes_excel.py --excel ProductosSinFotoValidada_PINTURAS.xlsx --salida resultados_PINTURAS --debug
```

**Argumentos útiles:**

| Argumento | Para qué |
|---|---|
| `--excel RUTA` (obligatorio) | Excel de entrada |
| `--salida CARPETA` | Carpeta de resultados (por defecto `imagenes_temp`) |
| `--debug` | Muestra el motivo detallado de cada intento fallido (qué fuente, qué código HTTP...) — imprescindible para diagnosticar por qué algo no se encuentra |
| `--limite N` | Procesar solo los primeros N productos (pruebas rápidas) |
| `--marca NOMBRE[,NOMBRE2...]` | Filtrar solo esa(s) marca(s) — ej. `--marca WERKU,TOLLENS` — para probar un fix concreto sin lanzar todo el catálogo |
| `--dry-run` | Simula sin descargar nada |
| `--dominios RUTA` | JSON de marcas→dominios (por defecto `marcas_dominios.json`) |

Ejemplo de prueba dirigida:
```bash
python buscar_imagenes_excel.py --excel ProductosSinFotoValidada_PINTURAS.xlsx --salida test_werku --debug --marca WERKU --limite 10
```

### Talleres y Carrocerías

```bash
python casar_imagenes_talleres.py --excel ProductosSinFotoValidada_TALLERES.xlsx --salida resultados_TALLERES
```

**Argumentos útiles:**

| Argumento | Para qué |
|---|---|
| `--excel RUTA` (obligatorio) | Excel de entrada |
| `--salida CARPETA` | Carpeta de resultados (por defecto `candidatos_talleres`) |
| `--umbral N` | Puntuación mínima ponderada para aceptar (por defecto 3: 1 código/modelo en común, o 3 palabras genéricas) |
| `--dry-run` | Muestra coincidencias sin copiar nada |

### Las 4 áreas de golpe

```bash
BUSCAR_IMAGENES_SIN_VALIDAR.bat
```

(doble clic, o ejecutarlo desde CMD estando en la carpeta `imagenes_tool`)

---

## 5. Generar el visor de revisión (HTML)

Por cada carpeta `resultados_[AREA]` generada en el paso anterior:

```bash
python generar_revision_html.py --carpeta resultados_DROGUERIA
python generar_revision_html.py --carpeta resultados_PERFUMERIA
python generar_revision_html.py --carpeta resultados_PINTURAS
python generar_revision_html.py --carpeta resultados_TALLERES
```

Esto genera `revision.html` dentro de esa misma carpeta. Ábrelo con
cualquier navegador — muestra cada producto con la imagen candidata al
lado, y botones para **aprobar** o **rechazar** cada una.

Al terminar de revisar, pulsa **"Descargar aprobadas.csv"**. Ese archivo cae
normalmente en la carpeta de Descargas del navegador — **muévelo** a la
carpeta `resultados_[AREA]` correspondiente antes del siguiente paso.

---

## 6. Subir a Drive lo aprobado

⚠️ **Usa siempre `aprobadas.csv`, nunca `imagenes_descargadas.csv` directamente.**
El segundo es el CSV en bruto con **todo** lo encontrado sin filtrar,
incluidas las que rechazaste en el visor. El script detecta si le pasas
`imagenes_descargadas.csv` por error y pide confirmación explícita (escribir
`SI`) antes de continuar — así no hay riesgo de subir descartes por
despiste. Si de verdad quieres saltarte ese aviso, añade `--forzar`.

```bash
python subir_imagenes_validadas.py --directorio resultados_DROGUERIA --csv resultados_DROGUERIA\aprobadas.csv
python subir_imagenes_validadas.py --directorio resultados_PERFUMERIA --csv resultados_PERFUMERIA\aprobadas.csv
python subir_imagenes_validadas.py --directorio resultados_PINTURAS --csv resultados_PINTURAS\aprobadas.csv
python subir_imagenes_validadas.py --directorio resultados_TALLERES --csv resultados_TALLERES\aprobadas.csv
```

**Argumentos útiles:**

| Argumento | Para qué |
|---|---|
| `--directorio RUTA` (obligatorio) | Carpeta con las imágenes ya revisadas |
| `--csv RUTA` (obligatorio) | El `aprobadas.csv` de esa carpeta |
| `--dry-run` | Simula todo el proceso sin tocar Drive ni el Sheet — para comprobar antes de subir de verdad |
| `--limite N` | Procesar solo los primeros N (pruebas) |
| `--credenciales CARPETA` | Dónde están/se guardan `credentials.json` y `token.json` (por defecto la carpeta actual) |
| `--lote-sheet N` | Cada cuántos productos se vuelca el lote de cambios al Sheet (por defecto 25) |
| `--forzar` | Salta el aviso de confirmación al usar `imagenes_descargadas.csv` en bruto |

Primera vez que se ejecuta (o si `token.json` caducó/se revocó): se abrirá
el navegador para iniciar sesión con la cuenta de Google que tenga acceso a
Drive. Las veces siguientes usa el token guardado sin pedir login de nuevo.

---

## 7. Otras consideraciones importantes

### Talleres es un caso especial
`casar_imagenes_talleres.py` **no busca en internet** — empareja contra las
fotos que ya tenemos extraídas de los catálogos de los proveedores (Zaphiro,
Besa). Aunque el nombre encontrado se parezca mucho, revisa siempre que el
envase/formato/color coincidan de verdad en el visor — puede ser la foto de
**otro producto real** del mismo proveedor, con referencia distinta.

### Duplicados dentro de una misma ejecución
Si la misma URL de imagen se asigna a dos productos distintos en la misma
ejecución, la segunda (y siguientes) se rechaza automáticamente como
"posible candidato genérico" — no hace falta revisarlo a mano, ya sale
descartado en el CSV con el motivo indicado.

### Marcas configuradas
`marcas_dominios.json` mapea nombre de marca → dominio de su web/tienda.
Si una marca no está ahí, no significa que no se intente nada — hay varios
respaldos genéricos (scraping, APIs gratuitas de tienda si el dominio es
WooCommerce/PrestaShop) — pero la precisión es mejor cuanto más marcas
tengan su propia fuente configurada. Si detectas una marca con mucho
volumen en los `sin_resultado.csv` y no tiene entrada aquí, es candidata a
añadir.

### `--debug` es tu amigo
Cuando algo no se encuentra y no está claro por qué, relanza esa marca/
producto concreto con `--debug --marca NOMBRE --limite 10` y revisa la
salida — indica exactamente qué se intentó, contra qué candidato, y con qué
puntuación de solapamiento se quedó corto.

### Instalar dependencias
```bash
pip install -r requirements.txt
```

### Todo es repetible
Los pasos 2 (buscar) y 3 (revisar) no tocan nada online — se pueden relanzar
tantas veces como haga falta, con distintos ajustes, sin ningún riesgo.
Solo el paso 4 (subir) escribe de verdad en Drive y el Sheet.
