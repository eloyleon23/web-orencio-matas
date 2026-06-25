# Script para generar informe de desarrollo web actualizado
# Formato tabular y menos ejecutivo, manteniendo TOTAL: 35 horas

$outputPath = "docs/informe_desarrollo_web.pdf"

# Función para escapar caracteres especiales en PDF
function Escape-Pdf {
    param([string]$text)
    $text = $text -replace '\\', '\\\\'
    $text = $text -replace '\(', '\\\('
    $text = $text -replace '\)', '\\\)'
    return $text
}

# Crear contenido del PDF
$content = @"

INFORME DE DESARROLLO WEB
ORENCIO MATAS Y HERMANOS, S.L.
Fecha: $(Get-Date -Format "dd/MM/yyyy")

================================================================================
1. LISTADO GENERAL DE TRABAJOS REALIZADOS
================================================================================

- Desarrollo de sitio web corporativo responsive
- Integración de Google Tag Manager (GTM)
- Implementación de banner de cookies con consentimiento
- Creación de páginas internas (Empresa, Servicios, Productos, Historia, Actualidad)
- Integración de Brevo para gestión de correos desde formulario de contacto
- Desarrollo de catálogos de productos por área (Droguería, Perfumería, Pinturas)
- Implementación de responsive design en todas las páginas
- Optimización SEO y accesibilidad

================================================================================
2. TRABAJOS REALIZADOS POR PÁGINA
================================================================================

INDEX (Página principal)
- Hero section con llamada a la acción
- Sección de beneficios y valores
- Categorías de productos
- Sección de profesionales B2B
- Marcas líderes
- Formulario de contacto doble (email y teléfono)
- Footer corporativo

EMPRESA
- Historia y trayectoria de la empresa
- Valores y misión
- Equipo y estructura organizativa

SERVICIOS
- Descripción de servicios principales
- Grid de partners y colaboradores
- Detalle de áreas de negocio

PRODUCTOS
- Cuatro áreas de productos: Droguería, Perfumería, Pinturas, Maquinaria
- Botones de catálogo específicos por área
- Páginas de catálogo con visualizador PDF
- Disclaimer de disponibilidad de productos

HISTORIA
- Narrativa histórica desde 1919
- Archivo documental con imágenes
- Cronología de eventos clave
- Timeline responsive

ACTUALIDAD
- Canal de Instagram integrado
- Feed de redes sociales
- Enlace a perfil oficial

================================================================================
3. INTEGRACIONES Y CONFIGURACIONES
================================================================================

- Google Tag Manager (GTM-TWX6NRXN)
- Brevo (Sendinblue) para gestión de correos
- Formulario de contacto con validación
- Banner de cookies con localStorage
- Analytics consent management
- Integración de redes sociales (Instagram)

================================================================================
4. AJUSTES TÉCNICOS
================================================================================

- Responsive design mobile-first
- Optimización de imágenes
- CSS modular y maintainable
- JavaScript para interacciones
- Cross-browser compatibility
- Performance optimization
- Implementación de catálogos PDF por área
- Ajustes de scroll en visualizador PDF móvil
- Botón móvil alternativo para abrir PDF en nueva pestaña

================================================================================
5. AJUSTES DE CONTENIDO
================================================================================

- Redacción de textos corporativos
- Optimización de mensajes de marketing
- Adaptación de contenido SEO
- Creación de disclaimer de disponibilidad en catálogos
- División de catálogo PDF por áreas de negocio

================================================================================
6. DESGLOSE DE HORAS
================================================================================

Fase de Diseño y Planificación: 5 horas
  - Diseño de arquitectura de información
  - Wireframes y prototipos
  - Definición de estructura de páginas

Desarrollo Frontend: 20 horas
  - Desarrollo de estructura HTML
  - Implementación de estilos CSS responsive
  - Desarrollo de componentes interactivos
  - Integración de JavaScript
  - Optimización de rendimiento

Integraciones y Configuración: 5 horas
  - Configuración de Google Tag Manager
  - Integración de Brevo para correos
  - Implementación de banner de cookies
  - Integración de redes sociales

Desarrollo de Catálogos: 3 horas
  - División de PDF original por áreas
  - Creación de páginas de visualizador
  - Ajustes responsive de PDF
  - Implementación de botón móvil alternativo

Contenido y Ajustes: 2 horas
  - Redacción y optimización de textos
  - Ajustes de contenido SEO
  - Implementación de disclaimers

TOTAL: 35 horas

================================================================================
7. OBSERVACIONES
================================================================================

El sitio web está completamente funcional y optimizado para dispositivos móviles.
Se han implementado soluciones alternativas para visualización de PDF en móvil
debido a limitaciones de navegadores móviles con iframes de PDF.
La integración con Brevo permite gestión automatizada de correos desde el
formulario de contacto.
El banner de cookies cumple con normativa GDPR y almacena consentimiento
en localStorage.

================================================================================
ORENCIO MATAS Y HERMANOS, S.L.
Av. Alfred Nobel, 2 · 13005 Ciudad Real · 926 221 217 · correo@orenciomatas.es
================================================================================

"@

# Escribir contenido a archivo temporal
$tempFile = "$env:TEMP\informe_temp.txt"
$content | Out-File -FilePath $tempFile -Encoding UTF8

# Convertir a PDF usando PowerShell (método simple)
# Nota: Este método crea un PDF básico. Para producción se recomienda usar
# herramientas como wkhtmltopdf o una librería de PDF profesional.

# Para este caso, crearemos un archivo de texto y dejaremos que el usuario
# lo convierta a PDF, ya que PowerShell no tiene capacidades nativas de PDF
# sin librerías externas.

Write-Host "Informe generado como archivo de texto: $tempFile"
Write-Host "Para convertir a PDF, usa una herramienta como wkhtmltopdf o MS Word."
Write-Host "O bien, el contenido está listo para copiar a un documento de Word."

# Alternativa: Crear un archivo HTML que se pueda imprimir como PDF
$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Informe de Desarrollo Web - Orencio Matas y Hnos</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
        }
        h1 {
            font-size: 18px;
            text-align: center;
            margin-bottom: 20px;
        }
        h2 {
            font-size: 14px;
            border-bottom: 2px solid #333;
            margin-top: 20px;
            padding-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
        }
        ul {
            margin: 5px 0;
            padding-left: 20px;
        }
        li {
            margin: 3px 0;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>INFORME DE DESARROLLO WEB</h1>
        <h2>ORENCIO MATAS Y HERMANOS, S.L.</h2>
        <p>Fecha: $(Get-Date -Format "dd/MM/yyyy")</p>
    </div>

    <h2>1. LISTADO GENERAL DE TRABAJOS REALIZADOS</h2>
    <ul>
        <li>Desarrollo de sitio web corporativo responsive</li>
        <li>Integración de Google Tag Manager (GTM)</li>
        <li>Implementación de banner de cookies con consentimiento</li>
        <li>Creación de páginas internas (Empresa, Servicios, Productos, Historia, Actualidad)</li>
        <li>Integración de Brevo para gestión de correos desde formulario de contacto</li>
        <li>Desarrollo de catálogos de productos por área (Droguería, Perfumería, Pinturas)</li>
        <li>Implementación de responsive design en todas las páginas</li>
        <li>Optimización SEO y accesibilidad</li>
    </ul>

    <h2>2. TRABAJOS REALIZADOS POR PÁGINA</h2>
    <table>
        <tr><th>Página</th><th>Contenido</th></tr>
        <tr><td>INDEX</td><td>Hero section, beneficios, categorías, profesionales B2B, marcas, contacto doble, footer</td></tr>
        <tr><td>EMPRESA</td><td>Historia, trayectoria, valores, misión, equipo</td></tr>
        <tr><td>SERVICIOS</td><td>Servicios principales, grid de partners, áreas de negocio</td></tr>
        <tr><td>PRODUCTOS</td><td>Cuatro áreas, botones de catálogo, visualizador PDF, disclaimer disponibilidad</td></tr>
        <tr><td>HISTORIA</td><td>Narrativa histórica, archivo documental, cronología, timeline</td></tr>
        <tr><td>ACTUALIDAD</td><td>Canal Instagram, feed redes sociales, enlace perfil oficial</td></tr>
    </table>

    <h2>3. INTEGRACIONES Y CONFIGURACIONES</h2>
    <ul>
        <li>Google Tag Manager (GTM-TWX6NRXN)</li>
        <li>Brevo (Sendinblue) para gestión de correos</li>
        <li>Formulario de contacto con validación</li>
        <li>Banner de cookies con localStorage</li>
        <li>Analytics consent management</li>
        <li>Integración de redes sociales (Instagram)</li>
    </ul>

    <h2>4. AJUSTES TÉCNICOS</h2>
    <ul>
        <li>Responsive design mobile-first</li>
        <li>Optimización de imágenes</li>
        <li>CSS modular y maintainable</li>
        <li>JavaScript para interacciones</li>
        <li>Cross-browser compatibility</li>
        <li>Performance optimization</li>
        <li>Implementación de catálogos PDF por área</li>
        <li>Ajustes de scroll en visualizador PDF móvil</li>
        <li>Botón móvil alternativo para abrir PDF en nueva pestaña</li>
    </ul>

    <h2>5. AJUSTES DE CONTENIDO</h2>
    <ul>
        <li>Redacción de textos corporativos</li>
        <li>Optimización de mensajes de marketing</li>
        <li>Adaptación de contenido SEO</li>
        <li>Creación de disclaimer de disponibilidad en catálogos</li>
        <li>División de catálogo PDF por áreas de negocio</li>
    </ul>

    <h2>6. DESGLOSE DE HORAS</h2>
    <table>
        <tr><th>Fase</th><th>Horas</th><th>Descripción</th></tr>
        <tr><td>Diseño y Planificación</td><td>5 h</td><td>Arquitectura, wireframes, estructura</td></tr>
        <tr><td>Desarrollo Frontend</td><td>20 h</td><td>HTML, CSS, JS, componentes, optimización</td></tr>
        <tr><td>Integraciones</td><td>5 h</td><td>GTM, Brevo, cookies, redes sociales</td></tr>
        <tr><td>Catálogos</td><td>3 h</td><td>División PDF, visualizador, responsive móvil</td></tr>
        <tr><td>Contenido y Ajustes</td><td>2 h</td><td>Redacción, SEO, disclaimers</td></tr>
        <tr><td><strong>TOTAL</strong></td><td><strong>35 h</strong></td><td></td></tr>
    </table>

    <h2>7. OBSERVACIONES</h2>
    <p>El sitio web está completamente funcional y optimizado para dispositivos móviles. Se han implementado soluciones alternativas para visualización de PDF en móvil debido a limitaciones de navegadores móviles con iframes de PDF. La integración con Brevo permite gestión automatizada de correos desde el formulario de contacto. El banner de cookies cumple con normativa GDPR y almacena consentimiento en localStorage.</p>

    <div class="footer">
        <p>ORENCIO MATAS Y HERMANOS, S.L.</p>
        <p>Av. Alfred Nobel, 2 · 13005 Ciudad Real · 926 221 217 · correo@orenciomatas.es</p>
    </div>
</body>
</html>
"@

$htmlTempFile = "$env:TEMP\informe_temp.html"
$htmlContent | Out-File -FilePath $htmlTempFile -Encoding UTF8

Write-Host "Informe HTML generado: $htmlTempFile"
Write-Host "Para convertir a PDF, abre el archivo HTML en un navegador e imprime como PDF."
