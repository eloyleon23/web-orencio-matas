# Herramientas de búsqueda de imágenes de producto

Preparación para la revisión manual de imágenes: normaliza nombres y busca
candidatas **antes** de subir nada a Drive. Ningún script de esta carpeta
modifica el Sheet ni Drive directamente.

## Flujo de trabajo para productos nuevos desde Excel

Si tienes un Excel filtrado con productos nuevos añadidos al catálogo, usa estos scripts:

### 1. `buscar_imagenes_unsplash.py` — Buscar imágenes con Unsplash API (gratuita)

Busca imágenes usando Unsplash API (gratuita, 50 requests/hora) buscando por la descripción completa del producto sin depender de dominios específicos.

**Qué hace:**
- Lee un Excel filtrado de productos nuevos (columnas: referencia, nombre, familia, area, codigo)
- Busca imágenes usando Unsplash API con la descripción normalizada del producto
- Descarga la imagen encontrada y la convierte a JPG
- Guarda las imágenes en un directorio temporal para evaluación manual
- Genera un CSV con la información de las imágenes descargadas

**Ventajas:**
- 100% gratuito (50 requests/hora)
- No depende de dominios específicos ni marcas configuradas
- Busca por descripción completa del producto
- Imágenes de alta calidad profesionales
- Registro fácil en unsplash.com/developers

**Requisitos:**
- Access Key de Unsplash (gratuita en https://unsplash.com/developers)
- Columnas requeridas: `referencia`, `nombre`

**Uso:**
```bash
# Obtener Access Key gratuita en unsplash.com/developers

# Buscar imágenes (simulación primero)
python buscar_imagenes_unsplash.py --excel productos_nuevos.xlsx --unsplash-key TU_ACCESS_KEY --salida imagenes_unsplash --dry-run

# Buscar imágenes real
python buscar_imagenes_unsplash.py --excel productos_nuevos.xlsx --unsplash-key TU_ACCESS_KEY --salida imagenes_unsplash
```

**Archivos generados:**
- `imagenes_unsplash/imagenes_descargadas.csv`: Lista de imágenes descargadas
- `imagenes_unsplash/sin_resultado.csv`: Productos sin imagen encontrada
- `imagenes_unsplash/<referencia>.jpg`: Imágenes descargadas (todas en JPG)

---

### 2. `buscar_imagenes_pexels.py` — Buscar imágenes con Pexels API (alternativa)

Busca imágenes usando Pexels API (gratuita, 200 requests/hora) buscando por la descripción completa del producto sin depender de dominios específicos.

**Requisitos:**
- API Key de Pexels (gratuita en https://pexels.com/api/)
- Columnas requeridas: `referencia`, `nombre`

**Uso:**
```bash
python buscar_imagenes_pexels.py --excel productos_nuevos.xlsx --pexels-key TU_API_KEY --salida imagenes_pexels
```

---

### 3. `buscar_imagenes_pixabay.py` — Buscar imágenes con Pixabay API (alternativa)

Busca imágenes usando Pixabay API (gratuita, 5,000 requests/hora) buscando por la descripción completa del producto sin depender de dominios específicos.

**Requisitos:**
- API Key de Pixabay (gratuita en https://pixabay.com/api/docs/)
- Columnas requeridas: `referencia`, `nombre`

**Uso:**
```bash
python buscar_imagenes_pixabay.py --excel productos_nuevos.xlsx --pixabay-key TU_API_KEY --salida imagenes_pixabay
```

---

### 4. `buscar_imagenes_descripcion.py` — Buscar imágenes SOLO por descripción (sin filtros)

Busca imágenes usando SOLO la descripción del producto sin ningún filtro de dominio o marca. Usa scraping de Bing Images.

**⚠ ADVERTENCIA:** Este método es impreciso y puede devolver imágenes que no coinciden exactamente con el producto. Requiere revisión manual obligatoria.

**Qué hace:**
- Lee un Excel filtrado de productos nuevos
- Usa la descripción completa (nombre) como query de búsqueda
- Busca en Bing Images sin filtros de dominio
- Descarga la imagen encontrada y la convierte a JPG
- Guarda las imágenes en un directorio temporal para evaluación manual

**Ventajas:**
- No requiere configuración de marcas ni dominios
- No requiere API keys
- Funciona para cualquier producto

**Desventajas:**
- Impreciso: puede devolver imágenes incorrectas
- Requiere revisión manual obligatoria
- Bing puede bloquear solicitudes excesivas

**Uso:**
```bash
# Buscar imágenes (simulación primero)
python buscar_imagenes_descripcion.py --excel productos_nuevos.xlsx --salida imagenes_descripcion --dry-run

# Buscar imágenes real
python buscar_imagenes_descripcion.py --excel productos_nuevos.xlsx --salida imagenes_descripcion
```

**Archivos generados:**
- `imagenes_descripcion/imagenes_descargadas.csv`: Lista de imágenes descargadas
- `imagenes_descripcion/sin_resultado.csv`: Productos sin imagen encontrada
- `imagenes_descripcion/<referencia>.jpg`: Imágenes descargadas (todas en JPG)

---

### 5. `buscar_imagenes_excel.py` — Buscar imágenes desde Excel (métodos tradicionales)

Busca imágenes para productos nuevos a partir de un Excel filtrado.

**Qué hace:**
- Lee un Excel filtrado de productos nuevos (columnas: referencia, nombre, familia, area, codigo)
- Busca la imagen adecuada usando:
  - Primero: nombre/descripción del producto
  - Luego: familia y código/referencia
- Descarga la imagen encontrada y la nombra como `<referencia>.ext`
- Guarda las imágenes en un directorio temporal para evaluación manual
- Genera un CSV con la información de las imágenes descargadas

**Métodos de búsqueda:**
- Para droguería/perfumería: APIs gratuitas de WooCommerce/WordPress (gratuito pero limitado)
- Para pinturas: servidor de Titan (gratuito)
- Google Custom Search API (más preciso, requiere credenciales - 100 consultas/día gratis)

**Nota importante:** El scraping de motores de búsqueda (Google/Bing) no es preciso para productos específicos y puede devolver imágenes incorrectas. Para obtener resultados precisos, se recomienda usar Google Custom Search API.

**Requisitos del Excel:**
- Columnas requeridas: `referencia`, `nombre`
- Columnas opcionales: `familia`, `area`, `codigo`
- Los nombres de columnas se normalizan a minúsculas automáticamente

**Uso:**
```bash
# Instalar dependencias (solo la primera vez)
pip install --user -r requirements.txt

# Buscar imágenes (simulación primero)
python buscar_imagenes_excel.py --excel productos_nuevos.xlsx --salida imagenes_temp --dry-run

# Buscar imágenes real (100% gratuito)
python buscar_imagenes_excel.py --excel productos_nuevos.xlsx --salida imagenes_temp
```

**Archivos generados:**
- `imagenes_temp/imagenes_descargadas.csv`: Lista de imágenes descargadas
- `imagenes_temp/sin_resultado.csv`: Productos sin imagen encontrada
- `imagenes_temp/<referencia>.ext`: Imágenes descargadas

### 2. `subir_imagenes_validadas.py` — Subir imágenes validadas a Drive

Sube las imágenes evaluadas y validadas manualmente a Google Drive y actualiza
la hoja de Google Sheet con el ID de Drive correspondiente.

**Qué hace:**
- Lee el CSV de imágenes descargadas (generado por `buscar_imagenes_excel.py`)
- Toma las imágenes del directorio temporal que el usuario ha revisado manualmente
- Sube cada imagen validada al directorio Drive de imágenes de productos
- Actualiza la hoja "Productos" del Google Sheet con:
  - `imagen_drive_id`: ID del fichero subido a Drive
  - `fecha_actualizacion_imagen`: fecha/hora actual
  - `imagen_validada`: fecha/hora actual

**Requisitos:**
- Tener `credentials.json` configurado (ver sección sincronizar_drive_sheet.py)
- El directorio temporal debe contener solo las imágenes validadas (elimina las que no sirvan)
- El CSV `imagenes_descargadas.csv` debe estar presente

**Uso:**
```bash
# 1) Revisa manualmente las imágenes en imagenes_temp/
#    Elimina las que no sean adecuadas

# 2) Simulación: ver qué subiría sin tocar nada real
python subir_imagenes_validadas.py --directorio imagenes_temp --csv imagenes_temp/imagenes_descargadas.csv --dry-run

# 3) Subir imágenes validadas (primero con pocos para probar)
python subir_imagenes_validadas.py --directorio imagenes_temp --csv imagenes_temp/imagenes_descargadas.csv --limite 5

# 4) Si todo va bien, subir todas
python subir_imagenes_validadas.py --directorio imagenes_temp --csv imagenes_temp/imagenes_descargadas.csv
```

**Archivos generados:**
- `imagenes_temp/fallos_sincronizacion.csv`: Lista de productos que fallaron (para reintentar)

## 1. `normalizar.py`

Módulo de normalización de nombres de producto (quita puntuación, expande
abreviaturas como `C.` → con, `P/` → para, `EDT.` → eau de toilette, separa
unidades pegadas a números). Constrúido a partir de un análisis de frecuencia
real sobre los 9.519 productos de `data/productos.json`.

```bash
python normalizar.py   # ejecuta ejemplos de prueba
```

Amplía los diccionarios `ABREVIATURAS_PUNTO` / `ABREVIATURAS_BARRA` según
vayas encontrando casos nuevos.

## 2. `titan_buscar_imagenes.py` — área PINTURAS

**Ejecútalo en tu ordenador**, no en un entorno con red restringida: necesita
acceso libre a `ficheros.industriastitan.es`.

Qué hace:
1. Lee `data/productos.json`, filtra productos de `area=pinturas` sin
   `imagen_validada` ni `fecha_actualizacion_imagen` (ahora mismo son 3.571).
2. Rastrea recursivamente todo el servidor de fotos de envases de Titan
   (`FOTOS ENVASES/` — incluye TITANPRO, TITANPROFESIONAL, TITANTECH,
   ACRITON, ENVASES COLOR, DECORACION, etc. — son las carpetas que ya vi al
   navegar el listado).
3. Empareja cada producto con el fichero más similar por tokens (marca +
   línea + formato/litros), con un sistema de puntuación 0–100.
4. Descarga solo las candidatas con `score >= --min-score` a
   `imagenes_pendientes_revision/pinturas/<REFERENCIA>.<ext>` — el nombre
   es la referencia (EAN) + extensión, sin nada más, para que encaje con
   el flujo de subida a Drive (`imagenes_nuevas_pendientes_procesar` usa
   nombre=EAN).
5. Genera dos CSV en esa carpeta:
   - `revision_pinturas.csv`: todos los procesados, tengan o no candidata.
   - `imagenes_descargadas.csv`: solo los que sí tienen imagen descargada
     (referencia, nombre_producto, nombre_archivo, score) — este es el
     listado para la subida a Drive.

```bash
pip install requests beautifulsoup4
python titan_buscar_imagenes.py --productos ../data/productos.json --min-score 55
```

Prueba primero con `--limite 30` para validar la calidad del matching antes
de lanzarlo contra los 3.571 productos completos (el rastreo del servidor de
Titan puede tardar varios minutos porque recorre bastantes subcarpetas).

**Sobre la calidad del matching:** en las pruebas que hice con el listado de
`TITANPRO`, los aciertos de línea+formato exactos dan 90-115 de score
("TITANPRO P10 4L" → `TitanPRO P10 4L.png` = 100). Con `--min-score 55` se
cuelan pocos falsos positivos, pero **revisa el CSV visualmente antes de
subir nada** — es una preselección, no una verificación automática de que la
imagen sea la correcta.

## 3. Drogería y perfumería — por qué no scrapeo Amazon/ladrogueria.com

Dos motivos, uno técnico y uno de fondo:

- **Técnico:** el entorno donde trabajo tiene el acceso a red bloqueado
  salvo un puñado de dominios (GitHub, PyPI, npm...); no puedo descargar
  binarios de esos sitios ni aunque quisiera.
- **De fondo:** las fotos de producto de Amazon y de tiendas online como
  ladrogueria.com son propiedad de esos vendedores. Descargarlas en bloque
  para republicarlas en vuestro propio catálogo comercial pisa sus
  condiciones de uso y derechos de imagen, independientemente de la
  limitación técnica.

**Alternativa que sí funciona y es limpia:** igual que con Titan, la mayoría
de marcas de vuestro catálogo (Nivea, Dove, Fairy, Cif, Babaria, 3M, Sika,
Akzonobel...) publican fototeca oficial de producto pensada para
distribuidores — ya tenéis media docena de esos logos en `assets/marcas/`.
El mismo patrón de `titan_buscar_imagenes.py` (normalizar → listar servidor
del fabricante → matching por tokens → descarga a carpeta local) se puede
reutilizar marca a marca en cuanto me pases (o encuentres) la URL de la
fototeca de cada una — es el mismo caso que Titan.

Como muestra de qué tipo de resultado cabe esperar a mano, busqué imagen
para `SUMA BAC D (DESINFECT) GARRAFA 5 L.` y el propio fabricante (Diversey)
tiene foto de producto oficial disponible — ese es el tipo de fuente que
conviene priorizar sobre un scraping masivo de retailers.

## Siguiente paso sugerido

1. Ejecuta `titan_buscar_imagenes.py --limite 30` y revisa el CSV para
   validar que el criterio de matching te convence.
2. Si el resultado es bueno, lo lanzamos contra los 3.571 productos de
   pinturas.
3. Para drogería/perfumería, dime qué marcas concentran más productos
   pendientes y busco si tienen fototeca de distribuidor pública (como
   Titan) para replicar el mismo script.

## 4. `generar_revision_html.py` — revisión visual en bloque

Genera `revision.html` a partir de `imagenes_descargadas.csv`: una galería
donde apruebas/rechazas con un clic en vez de abrir cada imagen en el
Explorador. Botón final "Descargar aprobadas.csv" con el listado limpio.

```bash
python generar_revision_html.py --carpeta imagenes_pendientes_revision/pinturas
```

## 5. `sincronizar_drive_sheet.py` — subir a Drive y actualizar el Sheet

Último paso: toma el `aprobadas.csv` de la revisión visual y, para cada
producto:
1. Busca en la carpeta de Drive de imágenes públicas un fichero con ese
   mismo nombre de referencia (cualquier extensión) y, si existe, lo manda
   a la papelera de Drive (recuperable 30 días — nunca se borra
   permanentemente).
2. Sube la imagen nueva con nombre `<referencia>.ext`.
3. La marca como pública ("cualquiera con el enlace, solo lectura").
4. Busca en la hoja "Productos" del Sheet la fila cuya columna
   `referencia` coincide EXACTAMENTE con el EAN — y solo esa fila — y
   actualiza `imagen_drive_id`, `fecha_actualizacion_imagen` e
   `imagen_validada` con la fecha/hora actual.

Si una referencia está duplicada en el Sheet, o no se encuentra, o el
fichero local no existe, **se salta ese producto y se anota en
`fallos_sincronizacion.csv`** — nunca se actualiza una fila que no sea la
exacta, y un fallo puntual no frena el resto del proceso.

### Configurar acceso a Google Drive y Sheets (solo la primera vez)

1. Ve a [console.cloud.google.com](https://console.cloud.google.com/) y crea
   un proyecto nuevo (o usa uno existente).
2. Menú → "APIs y servicios" → "Biblioteca" → busca y habilita **Google
   Drive API** y **Google Sheets API** (una por una).
3. "APIs y servicios" → "Pantalla de consentimiento OAuth":
   - Tipo de usuario: **Externo**.
   - Rellena nombre de la app y tu email.
   - En "Usuarios de prueba", añade tu cuenta de Google (la que tiene
     acceso al Drive y al Sheet de Orencio Matas).
4. "APIs y servicios" → "Credenciales" → "Crear credenciales" → **"ID de
   cliente de OAuth"**:
   - Tipo de aplicación: **Aplicación de escritorio**.
   - Descarga el JSON (botón de descarga junto al cliente creado).
5. Renombra ese fichero a `credentials.json` y colócalo en la carpeta
   `imagenes_tool/` (junto a `sincronizar_drive_sheet.py`).

La primera vez que ejecutes el script se abrirá el navegador pidiéndote
iniciar sesión y autorizar el acceso a Drive y Sheets. Verás un aviso de
"Google no ha verificado esta app" — es normal para apps personales sin
publicar; pulsa "Avanzado" → "Ir a [nombre de la app] (no seguro)" (es tu
propia app, autorizándote solo a ti mismo). Tras autorizar, queda guardado
en `token.json` y no hace falta repetirlo.

### Uso (SIEMPRE prueba primero con --dry-run)

```bash
pip install --user -r requirements.txt

# 1) Simulación: no sube ni borra ni toca el Sheet, solo muestra qué haría
python sincronizar_drive_sheet.py ^
    --csv imagenes_pendientes_revision/pinturas/aprobadas.csv ^
    --carpeta-imagenes imagenes_pendientes_revision/pinturas ^
    --dry-run --limite 5

# 2) Ejecución real, primero con pocos productos para validar en Drive/Sheet
python sincronizar_drive_sheet.py ^
    --csv imagenes_pendientes_revision/pinturas/aprobadas.csv ^
    --carpeta-imagenes imagenes_pendientes_revision/pinturas ^
    --limite 5

# 3) Si todo va bien, el resto
python sincronizar_drive_sheet.py ^
    --csv imagenes_pendientes_revision/pinturas/aprobadas.csv ^
    --carpeta-imagenes imagenes_pendientes_revision/pinturas
```

Si se corta a mitad (fallo de red, cierras la consola...), simplemente
vuelve a lanzarlo con el mismo CSV: los productos que ya se procesaron
correctamente no vuelven a aparecer como "aprobados pendientes" si generas
`aprobadas.csv` de nuevo desde la galería, y los que fallaron están listados
en `fallos_sincronizacion.csv` para reintentarlos aparte.

## 6. `buscar_imagenes_api.py` — DROGUERÍA / PERFUMERÍA

A diferencia de pinturas, ninguna marca de gran consumo (Babaria, Nivea,
Asevi...) tiene un servidor de fotos abierto como Titan — lo comprobé
buscando varias de las marcas con más productos pendientes. El enfoque aquí
es distinto: **Google Custom Search API**, restringida SIEMPRE al dominio
oficial del fabricante (nunca Amazon ni retailers, por el tema de derechos
de imagen ya comentado).

### Cómo funciona
1. Detecta la marca del producto por la primera palabra del nombre.
2. La compara contra `marcas_dominios.json` (mapa marca → dominio oficial).
3. Si no hay dominio configurado para esa marca, el producto se omite y
   queda anotado en `sin_dominio_configurado.csv` — nunca busca en sitios
   no verificados.
4. Si hay dominio, busca la imagen restringida a ese dominio y descarga el
   primer resultado como `<referencia>.ext`.
5. Genera `imagenes_descargadas.csv` con el mismo formato que el resto del
   pipeline — se usa directamente con `generar_revision_html.py` y
   `sincronizar_drive_sheet.py`, sin tocar nada de esos dos scripts.

**El "score" aquí no es una medida de similitud** (a diferencia de Titan):
es un valor fijo (75) que solo marca "encontrado vía API, pendiente de
revisión visual". La revisión manual en la galería sigue siendo necesaria.

### Dominios ya identificados (semilla inicial)
| Marca | Dominio | Productos pendientes |
|---|---|---|
| BABARIA | babaria.es | 185 |
| NIVEA | nivea.es | 135 |
| ASEVI | asevicompany.com | 88 |
| LLONGUERAS | llongueras.com | 79 |
| SORA | cosmeticossora.com | 72 |

Quedan ~25 marcas más por investigar (ver `_pendientes_de_investigar` en
`marcas_dominios.json`) — pídeme que las busque cuando quieras ampliar
cobertura, o añádelas tú directamente al JSON si ya conoces el dominio.

### Configurar acceso a la API (solo la primera vez)

1. En el mismo proyecto de Google Cloud que ya usas para Drive/Sheets
   (`console.cloud.google.com`, proyecto `653585333298`), habilita la
   **Custom Search API** en "APIs y servicios" → "Biblioteca".
2. Ve a [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)
   → "Añadir" → crea un motor con **"Buscar en toda la Web"** activado (no
   lo restrinjas a sitios al crearlo — la restricción por dominio se hace
   en cada consulta). Activa "Búsqueda de imágenes" en su configuración.
   Copia el **ID de motor de búsqueda** (cx).
3. "APIs y servicios" → "Credenciales" → "Crear credenciales" → **"Clave
   de API"** (puedes restringirla a la Custom Search API).
4. Crea `google_search_credentials.json` en `imagenes_tool/`:
   ```json
   {"api_key": "TU_CLAVE", "cx": "TU_ID_DE_MOTOR"}
   ```

### Coste y cuota

**100 consultas/día gratis.** A partir de ahí, 5 USD por cada 1.000
consultas (máximo 10.000/día). Con ~5.900 productos pendientes en
drogería+perfumería:
- Todo de una vez: ~25-30 USD.
- Solo en el tramo gratuito: ~60 días a 100/día.

Usa `--limite` para controlar cuánto gastas/tardas en cada ejecución.

### Uso

```bash
# 1) Simulación: ver qué buscaría y en qué dominio, sin gastar cuota
python buscar_imagenes_api.py --limite 20 --dry-run

# 2) Real, dentro del tramo gratuito diario
python buscar_imagenes_api.py --limite 90

# 3) Revisar visualmente (mismo visor que pinturas)
python generar_revision_html.py --carpeta imagenes_pendientes_revision/drogueria_perfumeria

# 4) Subir aprobadas a Drive y actualizar el Sheet (mismo script que pinturas)
python sincronizar_drive_sheet.py ^
    --csv imagenes_pendientes_revision/drogueria_perfumeria/aprobadas.csv ^
    --carpeta-imagenes imagenes_pendientes_revision/drogueria_perfumeria ^
    --dry-run --limite 5
```


