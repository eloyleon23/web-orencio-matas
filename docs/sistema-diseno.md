# Sistema de Diseño — Orencio Matas y Hnos, S.L.
## Guía de Estilos y UI Kit para Desarrollo Nativo (Windsurf AI)

Este documento define las reglas visuales, componentes y clases CSS que los agentes de Windsurf deben aplicar de forma consistente en todos los módulos HTML del proyecto.

---

## 1. VARIABLES DE COLOR (CSS CUSTOM PROPERTIES)

Los agentes deben inyectar este bloque en el selector `:root` del archivo `/src/css/estilos.css`:

```css
:root {
  /* Colores Extraídos Directamente del Logotipo */
  --primary-black: #1a1a1a;       /* El tono gris oscuro/antracita del cuerpo del logo */
  --primary-red: #d91b1b;         /* El rojo vivo del cuadrante inferior izquierdo del logo */
  --primary-yellow: #f1b300;      /* El amarillo transicional del logo */
  --primary-green: #008743;       /* El verde industrial del cuadrante inferior */
  --primary-blue: #006dae;        /* El azul técnico del cuadrante derecho */
  --primary-white: #ffffff;       /* Blanco puro para fondos limpios */

  /* Colores de Fondo y Superficies del Mockup */
  --bg-dark-premium: #0f1115;     /* Negro profundo para el Hero y sección Profesionales */
  --bg-light-gray: #f5f6f8;       /* Fondo limpio para la franja de categorías */
  --bg-card-dark: #191c23;        /* Fondo para la tarjeta del formulario de contacto */

  /* Textos y Legibilidad */
  --text-dark: #121417;           /* Texto principal ultra-legible */
  --text-gray: #656c75;           /* Descripciones secundarias */
  --text-muted: #b0b7c0;          /* Texto claro para bloques oscuros */

  /* Sombras y Efectos */
  --shadow-subtle: 0 12px 32px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 16px 40px rgba(0, 0, 0, 0.12);
}
```
