/**
 * CENTRO DE SOLUCIONES — datos mock
 * ─────────────────────────────────────────────────────────────────────────
 * Todo este archivo es DATOS DE PRUEBA (ficticios pero realistas), pensados
 * para demostrar el concepto y la arquitectura, no para usarse en producción
 * tal cual. Cuando se quiera conectar con el catálogo real:
 *
 *   - Cada "materialFase.familiaSugerida" y cada producto de
 *     recommendedProducts/alternativeProducts pasaría a resolverse contra
 *     productos.json real (por familia/subfamilia — ver
 *     contexto_proyecto_om_20082026.md) en vez de estar aquí escrito a mano.
 *   - Cada Solution es exactamente el modelo pedido:
 *     title, description, category, subcategory, problem, objective,
 *     surface, difficulty, estimatedTime, result, materials, steps,
 *     professionalTips, commonMistakes, recommendedProducts,
 *     alternativeProducts, relatedSolutions, seo.
 *   - Para SEO real, cada Solution generaría su propia página estática
 *     (mismo patrón que generar_catalogos.py: un script de pre-render
 *     recorrería este array y estamparía un .html por solución con su
 *     propio <title>/<meta description>/URL — hoy todas comparten
 *     soluciones/solucion.html?slug=... por simplicidad de prototipo).
 */
window.SOLUCIONES_DATA = (function () {

  // ── ¿Qué quieres hacer? ────────────────────────────────────────────────
  const acciones = [
    { id: 'pintar',    label: 'Pintar',                emoji: '🎨', color: 'red' },
    { id: 'reparar',   label: 'Reparar',                emoji: '🔧', color: 'blue' },
    { id: 'limpiar',   label: 'Limpiar',                emoji: '🧹', color: 'green' },
    { id: 'pulir',     label: 'Pulir',                  emoji: '✨', color: 'yellow' },
    { id: 'restaurar', label: 'Restaurar',              emoji: '🪵', color: 'blue' },
    { id: 'proteger',  label: 'Proteger',                emoji: '🛡️', color: 'green' },
    { id: 'preparar',  label: 'Preparar una superficie', emoji: '🔩', color: 'yellow' },
    { id: 'pegar',     label: 'Pegar y sellar',          emoji: '🧷', color: 'blue' },
    { id: 'acabado',   label: 'Conseguir un acabado',    emoji: '🎯', color: 'red' },
  ];

  // ── ¿Sobre qué quieres trabajar? ────────────────────────────────────────
  const superficies = [
    { id: 'coche',    label: 'Coche y carrocería', emoji: '🚗' },
    { id: 'madera',   label: 'Madera',              emoji: '🪵' },
    { id: 'metal',    label: 'Metal',                emoji: '🔩' },
    { id: 'pared',    label: 'Paredes',              emoji: '🧱' },
    { id: 'hogar',    label: 'Hogar',                emoji: '🏠' },
    { id: 'plastico', label: 'Plástico',              emoji: '🧩' },
    { id: 'suelo',    label: 'Suelo / garaje',         emoji: '🅿️' },
    { id: 'piscina',  label: 'Piscina',                emoji: '🏊' },
    { id: 'otro',     label: 'Otro',                  emoji: '❔' },
  ];

  // Paso 3 del asistente: ¿cómo está la superficie ahora?
  const estados = [
    { id: 'sin_pintar', label: 'Sin pintar' },
    { id: 'pintada',    label: 'Ya está pintada' },
    { id: 'barnizada',  label: 'Barnizada' },
    { id: 'oxidada',    label: 'Oxidada' },
    { id: 'deteriorada',label: 'Deteriorada' },
  ];

  // Paso 4 del asistente: ¿qué resultado quieres?
  const resultados = [
    { id: 'cambiar_color',      label: 'Cambiar el color' },
    { id: 'reparar',            label: 'Reparar un desperfecto' },
    { id: 'proteger',           label: 'Proteger la superficie' },
    { id: 'recuperar_brillo',   label: 'Recuperar el brillo' },
    { id: 'restaurar',          label: 'Restaurar por completo' },
  ];

  // ── Problemas frecuentes (texto libre + chips rápidos) ─────────────────
  const problemasFrecuentes = [
    { id: 'no_adhiere',    label: 'La pintura no se adhiere',            solutionSlug: 'pintar-plastico-coche' },
    { id: 'oxido',         label: 'Tengo óxido',                          solutionSlug: 'eliminar-oxido-metal' },
    { id: 'aranazos',      label: 'Tengo arañazos',                       solutionSlug: 'recuperar-brillo-carroceria' },
    { id: 'pegamento',     label: 'Tengo restos de pegamento',            solutionSlug: 'eliminar-oxido-metal' },
    { id: 'marcas_lijado', label: 'Hay marcas de lijado',                 solutionSlug: 'pintar-plastico-coche' },
    { id: 'mal_acabado',   label: 'El acabado no ha quedado bien',        solutionSlug: 'restaurar-mueble-madera' },
    { id: 'descuelgue',    label: 'La pintura se descuelga',              solutionSlug: 'pintar-plastico-coche' },
    { id: 'burbujas',      label: 'Han aparecido burbujas',                solutionSlug: 'restaurar-mueble-madera' },
    { id: 'blanquecino',   label: 'El barniz ha quedado blanquecino',     solutionSlug: 'restaurar-mueble-madera' },
    { id: 'quitar_pintura',label: 'Necesito quitar pintura',              solutionSlug: 'restaurar-mueble-madera' },
    { id: 'preparar_dudas',label: 'No sé cómo preparar la superficie',    solutionSlug: 'pintar-plastico-coche' },
    { id: 'moho_junta',    label: 'Tengo moho en las juntas del baño',    solutionSlug: 'sellar-juntas-bano' },
    { id: 'agua_turbia',   label: 'El agua de la piscina está turbia',    solutionSlug: 'mantenimiento-piscina' },
    { id: 'cucarachas',    label: 'Tengo cucarachas u hormigas',          solutionSlug: 'control-plagas-cocina' },
    { id: 'suelo_deteriorado', label: 'El suelo del garaje está deteriorado', solutionSlug: 'suelo-epoxi-garaje' },
  ];

  // ── Explora por áreas (secciones con ejemplos de trabajos) ─────────────
  const areas = [
    {
      id: 'coche', label: 'Coche y carrocería', emoji: '🚗',
      ejemplos: [
        { title: 'Reparar un arañazo',                 solutionSlug: 'recuperar-brillo-carroceria' },
        { title: 'Pintar un paragolpes',                solutionSlug: 'pintar-plastico-coche' },
        { title: 'Pintar una pieza de plástico',        solutionSlug: 'pintar-plastico-coche' },
        { title: 'Pintar una llanta' },
        { title: 'Preparar una pieza antes de pintar',  solutionSlug: 'pintar-plastico-coche' },
        { title: 'Pulir la carrocería',                 solutionSlug: 'recuperar-brillo-carroceria' },
        { title: 'Recuperar el brillo',                 solutionSlug: 'recuperar-brillo-carroceria' },
        { title: 'Eliminar hologramas' },
        { title: 'Eliminar marcas de lijado' },
        { title: 'Restaurar faros' },
        { title: 'Eliminar adhesivos' },
        { title: 'Quitar restos de cola' },
        { title: 'Eliminar óxido',                      solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Desengrasar una pieza' },
      ],
    },
    {
      id: 'pintura', label: 'Pintura y decoración', emoji: '🎨',
      ejemplos: [
        { title: 'Pintar una pared' },
        { title: 'Cambiar el color de una habitación' },
        { title: 'Pintar sobre una pared ya pintada' },
        { title: 'Pintar sobre un color oscuro' },
        { title: 'Reparar grietas' },
        { title: 'Tapar agujeros' },
        { title: 'Preparar una pared' },
        { title: 'Pintar azulejos' },
        { title: 'Pintar superficies difíciles' },
        { title: 'Conseguir acabado mate' },
        { title: 'Conseguir acabado satinado' },
        { title: 'Conseguir acabado brillante' },
      ],
    },
    {
      id: 'madera', label: 'Madera y restauración', emoji: '🪵',
      ejemplos: [
        { title: 'Pintar un mueble',                    solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Restaurar un mueble antiguo',         solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Cambiar el color' },
        { title: 'Barnizar una mesa',                   solutionSlug: 'restaurar-mueble-madera' },
        { title: 'Eliminar barniz' },
        { title: 'Pintar madera barnizada' },
        { title: 'Proteger madera exterior' },
        { title: 'Recuperar una superficie deteriorada',solutionSlug: 'restaurar-mueble-madera' },
      ],
    },
    {
      id: 'metal', label: 'Metal', emoji: '🔩',
      ejemplos: [
        { title: 'Eliminar óxido',                      solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Evitar que vuelva el óxido',          solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Pintar hierro',                       solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Pintar aluminio' },
        { title: 'Pintar estructuras metálicas' },
        { title: 'Renovar una verja',                   solutionSlug: 'eliminar-oxido-metal' },
        { title: 'Pintar radiadores' },
        { title: 'Preparar metal antes de pintar' },
        { title: 'Proteger metal' },
      ],
    },
    {
      id: 'limpieza', label: 'Limpieza y droguería', emoji: '🧹',
      ejemplos: [
        { title: 'Eliminar grasa' },
        { title: 'Eliminar pintura' },
        { title: 'Quitar adhesivos' },
        { title: 'Quitar silicona' },
        { title: 'Limpiar herramientas' },
        { title: 'Limpiar brochas' },
        { title: 'Limpiar rodillos' },
        { title: 'Desengrasar piezas' },
        { title: 'Limpiar maquinaria' },
        { title: 'Preparar una superficie' },
      ],
    },
    {
      id: 'pegado', label: 'Pegado y sellado', emoji: '🧷',
      ejemplos: [
        { title: 'Sellar una junta de baño o cocina',   solutionSlug: 'sellar-juntas-bano' },
        { title: 'Quitar moho de una junta de silicona', solutionSlug: 'sellar-juntas-bano' },
        { title: 'Pegar una tubería de PVC' },
        { title: 'Elegir el pegamento según el material' },
        { title: 'Pegar césped artificial' },
        { title: 'Sellar una ventana o marco' },
      ],
    },
    {
      id: 'suelos', label: 'Suelos y garajes', emoji: '🅿️',
      ejemplos: [
        { title: 'Pintar el suelo del garaje',           solutionSlug: 'suelo-epoxi-garaje' },
        { title: 'Proteger un suelo industrial',         solutionSlug: 'suelo-epoxi-garaje' },
        { title: 'Barnizar un suelo de madera' },
        { title: 'Reparar grietas en el suelo' },
      ],
    },
    {
      id: 'piscinas', label: 'Piscinas', emoji: '🏊',
      ejemplos: [
        { title: 'Ajustar el pH del agua',               solutionSlug: 'mantenimiento-piscina' },
        { title: 'Eliminar algas',                       solutionSlug: 'mantenimiento-piscina' },
        { title: 'Clorar correctamente la piscina',      solutionSlug: 'mantenimiento-piscina' },
        { title: 'Preparar la piscina para el verano',   solutionSlug: 'mantenimiento-piscina' },
        { title: 'Invernar la piscina' },
      ],
    },
    {
      id: 'plagas', label: 'Plagas y control de insectos', emoji: '🐜',
      ejemplos: [
        { title: 'Eliminar cucarachas de la cocina',     solutionSlug: 'control-plagas-cocina' },
        { title: 'Acabar con las hormigas',               solutionSlug: 'control-plagas-cocina' },
        { title: 'Evitar que vuelvan los insectos',       solutionSlug: 'control-plagas-cocina' },
        { title: 'Eliminar mosquitos' },
      ],
    },
  ];

  // ── Soluciones destacadas (para la home) ────────────────────────────────
  const solucionesDestacadas = [
    { slug: 'pintar-plastico-coche',     title: 'Cómo pintar una pieza de plástico de un coche', difficulty: 'Media', estimatedTime: '3-4 h + secado', emoji: '🚗' },
    { slug: 'recuperar-brillo-carroceria', title: 'Cómo reparar un arañazo de la carrocería',     difficulty: 'Media', estimatedTime: '1-2 h',          emoji: '🚗' },
    { slug: 'eliminar-oxido-metal',      title: 'Cómo eliminar óxido del metal',                 difficulty: 'Fácil', estimatedTime: '1 h',             emoji: '🔩' },
    { slug: 'restaurar-mueble-madera',   title: 'Cómo restaurar un mueble de madera',             difficulty: 'Media', estimatedTime: '1-2 días (secados)', emoji: '🪵' },
    { slug: 'sellar-juntas-bano',        title: 'Cómo sellar una junta de baño o cocina',         difficulty: 'Fácil', estimatedTime: '30-45 min + secado', emoji: '🧷' },
    { slug: 'suelo-epoxi-garaje',        title: 'Cómo pintar el suelo del garaje con epoxi',      difficulty: 'Media', estimatedTime: '1 día + curado',  emoji: '🅿️' },
    { slug: 'mantenimiento-piscina',     title: 'Cómo equilibrar el agua de la piscina',          difficulty: 'Fácil', estimatedTime: '30 min semanales', emoji: '🏊' },
    { slug: 'control-plagas-cocina',     title: 'Cómo eliminar cucarachas y hormigas',            difficulty: 'Fácil', estimatedTime: 'Resultado en 1-2 semanas', emoji: '🐜' },
  ];

  // ── Soluciones completas ────────────────────────────────────────────────
  // Cada fase de "materials" podrá mapearse en el futuro a una familia real
  // del catálogo (familiaSugerida) — hoy solo orienta.
  const soluciones = {

    'pintar-plastico-coche': {
      slug: 'pintar-plastico-coche',
      title: 'Cómo pintar una pieza de plástico de un coche',
      description: 'Aprende a preparar, imprimar y pintar correctamente una pieza de plástico para conseguir un acabado duradero y uniforme.',
      category: 'coche', subcategory: 'Pintar plástico',
      problem: 'no_adhiere',
      objective: 'pintar',
      surface: 'plastico',
      difficulty: 'Media',
      estimatedTime: '3-4 h + tiempos de secado',
      result: 'Pieza pintada y protegida, con buen anclaje y sin descuelgues',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Pintar plástico'],
      materials: [
        { fase: 'Preparación',  familiaSugerida: 'Limpieza / Desengrasantes', items: ['Desengrasante profesional'] },
        { fase: 'Preparación',  familiaSugerida: 'Abrasivos',                 items: ['Abrasivo P800'] },
        { fase: 'Adherencia',   familiaSugerida: 'Promotores de adherencia',  items: ['Promotor de adherencia para plástico'] },
        { fase: 'Imprimación',  familiaSugerida: 'Aparejos / Imprimaciones',  items: ['Aparejo acrílico'] },
        { fase: 'Color',        familiaSugerida: 'Pinturas de carrocería',    items: ['Pintura para carrocería'] },
        { fase: 'Acabado',      familiaSugerida: 'Barnices',                  items: ['Barniz 2K'] },
      ],
      receta: [
        { fase: 'Limpiar',              emoji: '🧴' },
        { fase: 'Preparar',             emoji: '🪵' },
        { fase: 'Mejorar adherencia',   emoji: '🎨' },
        { fase: 'Igualar',              emoji: '🎨' },
        { fase: 'Pintar',               emoji: '🎨' },
        { fase: 'Proteger',             emoji: '✨' },
      ],
      steps: [
        {
          n: 1, title: 'Limpieza y desengrasado',
          text: 'Los plásticos automotrices suelen tener restos de silicona, cera o grasa de fábrica. Si no se eliminan antes de nada, ningún producto posterior se agarrará bien, por muy bueno que sea.',
          productos: ['Desengrasante profesional'],
        },
        {
          n: 2, title: 'Preparación de la superficie',
          text: 'Una lijada suave con un abrasivo de grano medio-fino crea el "anclaje" mecánico que necesita la pintura para adherirse. No hace falta llegar al plástico vivo, solo matear el brillo.',
          productos: ['Abrasivo P800'],
        },
        {
          n: 3, title: 'Promotor de adherencia',
          text: 'Los plásticos (sobre todo el PP, muy habitual en paragolpes) son químicamente difíciles de pintar sin ayuda. El promotor de adherencia es lo que realmente hace posible que el sistema de pintura se quede pegado con el tiempo.',
          productos: ['Promotor de adherencia para plástico'],
        },
        {
          n: 4, title: 'Imprimación / aparejo',
          text: 'Iguala el color de base, sella la superficie y da una base uniforme sobre la que trabajar el color — evita que se transparenten diferencias del plástico de debajo.',
          productos: ['Aparejo acrílico'],
        },
        {
          n: 5, title: 'Pintura',
          text: 'Aplica el color en manos finas y uniformes, respetando el tiempo de aireado entre manos que indique la ficha técnica del producto.',
          productos: ['Pintura para carrocería'],
        },
        {
          n: 6, title: 'Acabado y protección',
          text: 'El barniz no es solo brillo: protege el color de UV, lluvia ácida y microrrayado, y es lo que da la sensación de "acabado de fábrica".',
          productos: ['Barniz 2K'],
        },
      ],
      professionalTips: [
        'Antes de pintar, asegúrate de que la superficie está completamente limpia, seca y libre de contaminantes. Una buena preparación es tan importante como la propia pintura.',
      ],
      commonMistakes: [
        'No limpiar correctamente la superficie.',
        'Utilizar un abrasivo incorrecto.',
        'No respetar los tiempos de secado.',
        'Aplicar productos incompatibles entre sí.',
        'No preparar adecuadamente el plástico (saltarse el promotor de adherencia).',
        'Aplicar demasiada cantidad de producto en una sola mano.',
        'Pintar sobre una superficie contaminada (grasa, silicona, polvo).',
      ],
      recommendedProducts: [
        { nombre: 'Desengrasante profesional',            categoria: 'Limpieza',   formato: '1 L',  precio: '12,95 €' },
        { nombre: 'Abrasivo P800',                         categoria: 'Abrasivos',                  precio: '0,80 €' },
        { nombre: 'Promotor de adherencia para plástico',  categoria: 'Talleres',                    precio: '18,95 €' },
        { nombre: 'Aparejo acrílico',                      categoria: 'Talleres',                    precio: '24,95 €' },
        { nombre: 'Pintura para carrocería',                categoria: 'Talleres',                    precio: '29,95 €' },
        { nombre: 'Barniz 2K',                              categoria: 'Talleres',                    precio: '32,95 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción económica',      nombre: 'Aerosol plástico color + barniz 2 en 1', precio: '14,95 €' },
        { etiqueta: 'Opción profesional',    nombre: 'Sistema completo con catalizador de larga duración', precio: '89,95 €' },
        { etiqueta: 'Opción rápida',         nombre: 'Kit de retoque en spray (pieza pequeña)', precio: '19,95 €' },
        { etiqueta: 'Trabajos pequeños',     nombre: 'Bote de retoque + pincel', precio: '9,95 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal', 'recuperar-brillo-carroceria'],
      seo: {
        title: 'Cómo pintar plástico de coche | Guía paso a paso — Orencio Matas',
        description: 'Guía completa para pintar correctamente una pieza de plástico de un coche: preparación, promotor de adherencia, imprimación, pintura y barniz.',
      },
    },

    'eliminar-oxido-metal': {
      slug: 'eliminar-oxido-metal',
      title: 'Cómo eliminar óxido del metal',
      description: 'Elimina el óxido de una superficie metálica y protégela para que no vuelva a aparecer, con el sistema adecuado según el grado de oxidación.',
      category: 'metal', subcategory: 'Tratamiento de óxido',
      problem: 'oxido',
      objective: 'reparar',
      surface: 'metal',
      difficulty: 'Fácil',
      estimatedTime: '1 h + secado',
      result: 'Superficie metálica limpia de óxido, tratada y protegida',
      breadcrumb: ['Centro de Soluciones', 'Metal', 'Eliminar óxido'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Abrasivos',            items: ['Cepillo de púas metálicas', 'Abrasivo grano grueso'] },
        { fase: 'Tratamiento', familiaSugerida: 'Convertidores de óxido', items: ['Convertidor de óxido'] },
        { fase: 'Imprimación', familiaSugerida: 'Imprimaciones antioxidantes', items: ['Imprimación antioxidante'] },
        { fase: 'Color',       familiaSugerida: 'Esmaltes para metal',   items: ['Esmalte metal directo'] },
      ],
      receta: [
        { fase: 'Cepillar',   emoji: '🧽' },
        { fase: 'Convertir',  emoji: '🧪' },
        { fase: 'Imprimar',   emoji: '🎨' },
        { fase: 'Pintar',     emoji: '🎨' },
      ],
      steps: [
        { n: 1, title: 'Eliminación mecánica del óxido', text: 'Con cepillo de púas o abrasivo de grano grueso, retira todo el óxido suelto y descamado hasta llegar a metal sano o al menos muy adherido.', productos: ['Cepillo de púas metálicas', 'Abrasivo grano grueso'] },
        { n: 2, title: 'Convertidor de óxido', text: 'En zonas donde no se puede llegar a metal 100% limpio, un convertidor transforma químicamente el óxido restante en una capa estable sobre la que sí se puede pintar.', productos: ['Convertidor de óxido'] },
        { n: 3, title: 'Imprimación antioxidante', text: 'Sella la superficie y evita que la humedad vuelva a iniciar el proceso de oxidación por debajo de la pintura.', productos: ['Imprimación antioxidante'] },
        { n: 4, title: 'Esmalte de acabado', text: 'Aporta color y una segunda barrera de protección frente a la intemperie.', productos: ['Esmalte metal directo'] },
      ],
      professionalTips: [
        'El óxido nunca "desaparece" solo con pintar encima — si no se trata primero, seguirá extendiéndose por debajo de la pintura nueva.',
      ],
      commonMistakes: [
        'Pintar directamente sobre óxido sin tratarlo.',
        'No dejar secar el convertidor de óxido el tiempo indicado.',
        'Usar un esmalte no apto para metal exterior.',
        'Olvidar los bordes y zonas ocultas, donde el óxido suele reaparecer antes.',
      ],
      recommendedProducts: [
        { nombre: 'Cepillo de púas metálicas', categoria: 'Herramientas', precio: '6,50 €' },
        { nombre: 'Abrasivo grano grueso',      categoria: 'Abrasivos',   precio: '1,10 €' },
        { nombre: 'Convertidor de óxido',       categoria: 'Talleres',    precio: '16,95 €' },
        { nombre: 'Imprimación antioxidante',   categoria: 'Talleres',    precio: '21,95 €' },
        { nombre: 'Esmalte metal directo',      categoria: 'Pinturas',   precio: '18,50 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción rápida',      nombre: 'Esmalte antioxidante 3 en 1 (imprimación + color en un paso)', precio: '19,95 €' },
        { etiqueta: 'Trabajos pequeños',  nombre: 'Aerosol antioxidante', precio: '8,95 €' },
      ],
      relatedSolutions: ['pintar-plastico-coche', 'restaurar-mueble-madera'],
      seo: {
        title: 'Cómo eliminar el óxido del metal | Guía — Orencio Matas',
        description: 'Cómo tratar y eliminar el óxido de una superficie metálica paso a paso, con convertidor, imprimación antioxidante y esmalte de acabado.',
      },
    },

    'restaurar-mueble-madera': {
      slug: 'restaurar-mueble-madera',
      title: 'Cómo restaurar un mueble de madera',
      description: 'Recupera un mueble antiguo o deteriorado: elimina el barniz viejo, repara la superficie y aplica un acabado nuevo duradero.',
      category: 'madera', subcategory: 'Restauración',
      problem: 'mal_acabado',
      objective: 'restaurar',
      surface: 'madera',
      difficulty: 'Media',
      estimatedTime: '1-2 días (por los secados)',
      result: 'Mueble restaurado, con superficie lisa y barniz o pintura nuevos',
      colorChart: { label: 'Encuentra tu color en Titanlux (línea madera)', url: 'https://www.titanlux.es/es/encuentratucolor' },
      breadcrumb: ['Centro de Soluciones', 'Madera y restauración', 'Restaurar mueble'],
      materials: [
        { fase: 'Decapado',     familiaSugerida: 'Decapantes',  items: ['Decapante de barniz'] },
        { fase: 'Preparación',  familiaSugerida: 'Abrasivos',   items: ['Lija de grano medio', 'Lija de grano fino'] },
        { fase: 'Reparación',   familiaSugerida: 'Masillas para madera', items: ['Masilla para madera'] },
        { fase: 'Acabado',      familiaSugerida: 'Barnices',    items: ['Barniz para madera'] },
      ],
      receta: [
        { fase: 'Decapar',    emoji: '🧴' },
        { fase: 'Lijar',      emoji: '🪵' },
        { fase: 'Reparar',    emoji: '🔧' },
        { fase: 'Barnizar',   emoji: '✨' },
      ],
      steps: [
        { n: 1, title: 'Decapado del barniz antiguo', text: 'Elimina el barniz o pintura anterior con un decapante adecuado, dejando la madera desnuda y lista para trabajar.', productos: ['Decapante de barniz'] },
        { n: 2, title: 'Lijado', text: 'Empieza con grano medio para nivelar la superficie y termina con grano fino para dejarla lista para el acabado.', productos: ['Lija de grano medio', 'Lija de grano fino'] },
        { n: 3, title: 'Reparación de desperfectos', text: 'Rellena grietas, agujeros de clavo o golpes con masilla para madera antes del acabado final.', productos: ['Masilla para madera'] },
        { n: 4, title: 'Barnizado', text: 'Aplica el barniz en manos finas, lijando muy suavemente entre manos para un acabado profesional.', productos: ['Barniz para madera'] },
      ],
      professionalTips: [
        'El barniz blanquecino suele deberse a humedad atrapada durante el secado — trabaja siempre en un ambiente seco y con buena ventilación.',
      ],
      commonMistakes: [
        'No dejar secar bien el decapante antes de lijar.',
        'Saltarse el lijado fino final.',
        'No limpiar el polvo de lijado antes de barnizar.',
        'Aplicar el barniz en manos demasiado gruesas.',
        'Barnizar en un ambiente húmedo (causa del aspecto blanquecino).',
      ],
      recommendedProducts: [
        { nombre: 'Decapante de barniz',   categoria: 'Droguería',  precio: '15,95 €' },
        { nombre: 'Lija de grano medio',    categoria: 'Abrasivos',  precio: '0,90 €' },
        { nombre: 'Lija de grano fino',     categoria: 'Abrasivos',  precio: '0,90 €' },
        { nombre: 'Masilla para madera',    categoria: 'Pinturas',  precio: '9,95 €' },
        { nombre: 'Barniz para madera',     categoria: 'Pinturas',  precio: '22,95 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción rápida',      nombre: 'Barniz al agua secado rápido', precio: '19,95 €' },
        { etiqueta: 'Opción profesional', nombre: 'Sistema de tinte + barniz de poliuretano', precio: '38,95 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal'],
      seo: {
        title: 'Cómo restaurar un mueble de madera | Guía — Orencio Matas',
        description: 'Aprende a restaurar un mueble de madera antiguo o deteriorado: decapado, lijado, reparación de desperfectos y barnizado.',
      },
    },
    'recuperar-brillo-carroceria': {
      slug: 'recuperar-brillo-carroceria',
      title: 'Cómo reparar un arañazo y recuperar el brillo de la carrocería',
      description: 'Elimina pequeños arañazos superficiales y recupera el brillo original de la pintura sin necesidad de repintar toda la pieza.',
      category: 'coche', subcategory: 'Pulido y brillo',
      problem: 'aranazos',
      objective: 'pulir',
      surface: 'coche',
      difficulty: 'Media',
      estimatedTime: '1-2 h',
      result: 'Carrocería sin arañazos superficiales, con el brillo recuperado',
      breadcrumb: ['Centro de Soluciones', 'Coche y carrocería', 'Pulido y brillo'],
      materials: [
        { fase: 'Limpieza',       familiaSugerida: 'Limpieza / Desengrasantes', items: ['Champú de lavado', 'Arcilla descontaminante'] },
        { fase: 'Evaluación',     familiaSugerida: 'Herramientas de medición',  items: ['Medidor de espesor de pintura (opcional)'] },
        { fase: 'Pulido',         familiaSugerida: 'Pulimentos',                items: ['Pasta de pulir de corte medio', 'Pulimento de acabado'] },
        { fase: 'Protección',     familiaSugerida: 'Ceras y selladores',        items: ['Cera o sellador de protección'] },
      ],
      receta: [
        { fase: 'Limpiar',        emoji: '🧴' },
        { fase: 'Descontaminar',  emoji: '🧽' },
        { fase: 'Pulir',          emoji: '✨' },
        { fase: 'Proteger',       emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Limpieza', text: 'Lava la zona a fondo para que no quede ninguna partícula abrasiva (arena, polvo) que pueda generar más marcas durante el pulido.', productos: ['Champú de lavado'] },
        { n: 2, title: 'Descontaminación', text: 'Pasa una arcilla descontaminante para retirar partículas incrustadas en la pintura (alquitrán, restos industriales) que el lavado normal no quita.', productos: ['Arcilla descontaminante'] },
        { n: 3, title: 'Evaluación de la profundidad', text: 'Si el arañazo se nota al pasar la uña, probablemente ha llegado a la base de color y el pulido no bastará por sí solo — en ese caso hará falta un pequeño retoque de pintura antes de pulir.', productos: [] },
        { n: 4, title: 'Pulido', text: 'Trabaja primero con una pasta de corte medio para nivelar el arañazo, y termina con un pulimento de acabado para devolver el brillo final.', productos: ['Pasta de pulir de corte medio', 'Pulimento de acabado'] },
        { n: 5, title: 'Protección', text: 'Sella el trabajo con cera o un sellador sintético — además de proteger, hace que el brillo dure mucho más tiempo.', productos: ['Cera o sellador de protección'] },
      ],
      professionalTips: [
        'Si al pasar la uña notas el arañazo (no solo lo ves), es señal de que ha traspasado el barniz — en ese caso, pulir sin más no lo eliminará del todo.',
      ],
      commonMistakes: [
        'Pulir sin limpiar y descontaminar antes (genera microrrayado nuevo).',
        'Usar una pasta demasiado agresiva para el tipo de arañazo.',
        'Pulir en exceso sobre la misma zona, adelgazando demasiado el barniz.',
        'No proteger después de pulir — el brillo se pierde antes de lo esperado.',
      ],
      recommendedProducts: [
        { nombre: 'Champú de lavado',               categoria: 'Talleres',   precio: '9,95 €' },
        { nombre: 'Arcilla descontaminante',         categoria: 'Talleres',   precio: '14,95 €' },
        { nombre: 'Pasta de pulir de corte medio',   categoria: 'Talleres',   precio: '16,50 €' },
        { nombre: 'Pulimento de acabado',            categoria: 'Talleres',   precio: '15,95 €' },
        { nombre: 'Cera o sellador de protección',   categoria: 'Talleres',   precio: '19,95 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción rápida',      nombre: 'Pulimento todo en uno (corte + brillo + protección)', precio: '21,95 €' },
        { etiqueta: 'Trabajos pequeños',  nombre: 'Lápiz quitarrayas', precio: '7,95 €' },
      ],
      relatedSolutions: ['pintar-plastico-coche', 'eliminar-oxido-metal'],
      seo: {
        title: 'Cómo quitar arañazos y recuperar el brillo del coche | Orencio Matas',
        description: 'Guía para eliminar arañazos superficiales de la carrocería y recuperar el brillo original con pulimento, sin repintar la pieza.',
      },
    },

    'sellar-juntas-bano': {
      slug: 'sellar-juntas-bano',
      title: 'Cómo sellar una junta de baño o cocina',
      description: 'Elimina la silicona vieja o con moho y aplica un sellado nuevo, limpio y duradero, en juntas de bañera, plato de ducha o encimera.',
      category: 'pegado', subcategory: 'Sellado de juntas',
      problem: 'moho_junta',
      objective: 'pegar',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: '30-45 min + 24 h de curado',
      result: 'Junta sellada, sin moho y estanca al agua',
      breadcrumb: ['Centro de Soluciones', 'Pegado y sellado', 'Sellado de juntas'],
      materials: [
        { fase: 'Retirada',    familiaSugerida: 'Herramientas',              items: ['Rascador o cutter'] },
        { fase: 'Limpieza',    familiaSugerida: 'Limpieza / Desengrasantes', items: ['Alcohol o desengrasante'] },
        { fase: 'Sellado',     familiaSugerida: 'Siliconas y selladores',    items: ['Silicona sanitaria antimoho'] },
        { fase: 'Acabado',     familiaSugerida: 'Herramientas',              items: ['Espátula alisadora o cinta de carrocero'] },
      ],
      receta: [
        { fase: 'Retirar',  emoji: '🔪' },
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Aplicar',  emoji: '🧷' },
        { fase: 'Alisar',   emoji: '✋' },
      ],
      steps: [
        { n: 1, title: 'Retirar la silicona vieja', text: 'Con un cutter o rascador, retira todo resto de silicona antigua y el moho acumulado. Cuanto más limpio quede el hueco, mejor se agarrará la silicona nueva.', productos: [] },
        { n: 2, title: 'Limpiar y secar la junta', text: 'Desengrasa con alcohol y deja secar completamente — la silicona no se adhiere bien sobre superficies húmedas, y por eso el sellado nuevo "falla" antes de tiempo si se salta este paso.', productos: ['Alcohol o desengrasante'] },
        { n: 3, title: 'Proteger los bordes (opcional)', text: 'Pega cinta de carrocero a ambos lados de la junta para conseguir un cordón recto y limpio, sin manchar los azulejos.', productos: [] },
        { n: 4, title: 'Aplicar la silicona', text: 'Aplica el cordón con la pistola en un movimiento continuo y a presión constante, sin parar a mitad de junta.', productos: ['Silicona sanitaria antimoho'] },
        { n: 5, title: 'Alisar el cordón', text: 'Alisa con una espátula o el dedo humedecido en agua con un poco de jabón, antes de que empiece a formar piel.', productos: [] },
        { n: 6, title: 'Retirar la cinta y dejar curar', text: 'Quita la cinta de carrocero inmediatamente después de alisar, y evita mojar la zona durante las primeras 24 horas.', productos: [] },
      ],
      professionalTips: [
        'La silicona "antimoho" lleva un fungicida que retrasa la reaparición del moho negro — pero solo funciona bien si la superficie estaba realmente limpia y seca antes de aplicarla, no encima de moho ya existente.',
      ],
      commonMistakes: [
        'Aplicar silicona nueva directamente sobre restos de silicona vieja o moho.',
        'No dejar secar la superficie después de limpiarla.',
        'No retirar la cinta de carrocero antes de que la silicona empiece a curar.',
        'Usar una silicona no apta para uso sanitario/húmedo en zonas de ducha o bañera.',
      ],
      recommendedProducts: [
        { nombre: 'CEYS Silicona Stop Moho Cartucho 280 ml Blanco', categoria: 'Droguería', formato: '280 ml', precio: '5,98 €' },
        { nombre: 'CEYS Silicona Stop Moho Tubo 125 ml Blanco',     categoria: 'Droguería', formato: '125 ml', precio: '5,02 €' },
        { nombre: 'Sellador Acrílico Blanco Baixens SA-37',         categoria: 'Droguería', formato: '310 ml', precio: '1,80 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción económica',   nombre: 'Sellaceys Silicona Cartucho 280 ml Translúcida', precio: '4,34 €' },
        { etiqueta: 'Opción rápida',      nombre: 'CEYS Sellaceys Cinta Selladora Hogar Blanco (sin pistola)', precio: '9,91 €' },
        { etiqueta: 'Trabajos pequeños',  nombre: 'Sellaceys Silicona Tubo 50 ml Blíster', precio: '2,48 €' },
      ],
      relatedSolutions: ['control-plagas-cocina'],
      seo: {
        title: 'Cómo sellar una junta de baño o cocina | Orencio Matas',
        description: 'Guía para retirar la silicona vieja o con moho y sellar correctamente una junta de baño o cocina, paso a paso.',
      },
    },

    'suelo-epoxi-garaje': {
      slug: 'suelo-epoxi-garaje',
      title: 'Cómo pintar el suelo del garaje con sistema epoxi',
      description: 'Protege un suelo de garaje, nave o taller con un sistema epoxi bicomponente resistente a aceites, químicos y al paso continuo de vehículos.',
      category: 'suelos', subcategory: 'Suelos técnicos',
      problem: 'suelo_deteriorado',
      objective: 'proteger',
      surface: 'suelo',
      difficulty: 'Media',
      estimatedTime: '1 día de aplicación + 3-7 días de curado antes del tráfico',
      result: 'Suelo protegido, con acabado uniforme resistente a aceites y desgaste',
      colorChart: { label: 'Ver carta de colores TitanTech (sistema TitanColor: TT1 / RAL / NCS)', url: 'https://www.titantech.es/colores' },
      breadcrumb: ['Centro de Soluciones', 'Suelos y garajes', 'Suelos técnicos'],
      materials: [
        { fase: 'Preparación', familiaSugerida: 'Limpieza / Desengrasantes',      items: ['Desengrasante industrial'] },
        { fase: 'Preparación', familiaSugerida: 'Abrasivos',                      items: ['Lijado mecánico del suelo (si hay pintura previa)'] },
        { fase: 'Aplicación',  familiaSugerida: 'Sistemas epoxi bicomponente',    items: ['Base epoxi + endurecedor (2 componentes)'] },
        { fase: 'Herramientas',familiaSugerida: 'Útiles de aplicación',           items: ['Rodillo de pelo corto'] },
      ],
      receta: [
        { fase: 'Limpiar',  emoji: '🧴' },
        { fase: 'Reparar',  emoji: '🔧' },
        { fase: 'Mezclar',  emoji: '🧪' },
        { fase: 'Aplicar',  emoji: '🎨' },
        { fase: 'Curar',    emoji: '⏳' },
      ],
      steps: [
        { n: 1, title: 'Limpieza y desengrasado a fondo', text: 'Los restos de aceite o grasa son la causa número uno de que un suelo epoxi se levante — hay que partir de una superficie realmente limpia.', productos: ['Desengrasante industrial'] },
        { n: 2, title: 'Reparación de grietas y desconchones', text: 'Repara cualquier grieta o zona suelta antes de aplicar el sistema — el epoxi no rellena ni corrige defectos importantes del soporte.', productos: [] },
        { n: 3, title: 'Mezcla del sistema bicomponente', text: 'Mezcla la base con su endurecedor en la proporción exacta indicada en la ficha técnica — no es un producto de un solo bote, la proporción es lo que activa el fraguado químico.', productos: ['Base epoxi + endurecedor (2 componentes)'] },
        { n: 4, title: 'Aplicación de la primera mano', text: 'Aplica con rodillo de pelo corto, trabajando por zonas dentro del "pot life" (tiempo útil de la mezcla ya activada) antes de que empiece a espesar.', productos: ['Rodillo de pelo corto'] },
        { n: 5, title: 'Segunda mano cruzada', text: 'Aplica la segunda mano en dirección cruzada respecto a la primera, respetando el tiempo de repintado indicado.', productos: [] },
        { n: 6, title: 'Curado antes de poner en servicio', text: 'Evita tráfico ligero durante 24h y tráfico pesado (coches) varios días — poner el suelo en servicio demasiado pronto es la causa más habitual de marcas y despegues tempranos.', productos: [] },
      ],
      professionalTips: [
        'Los sistemas epoxi bicomponente tienen un "pot life" limitado una vez mezclados — prepara solo la cantidad que puedas aplicar en ese tiempo, no toda la mezcla de golpe si la superficie es grande.',
      ],
      commonMistakes: [
        'No respetar la proporción exacta de base y endurecedor.',
        'Aplicar sobre un suelo con humedad o grasa residual.',
        'Mezclar más producto del que se puede aplicar dentro del pot life.',
        'Poner el suelo en servicio antes del tiempo de curado total indicado.',
      ],
      recommendedProducts: [
        { nombre: 'TITANTECH PXB-700 Base Epoxi Suelos 4 L Base Neutra', categoria: 'Talleres', formato: '4 L', precio: '72,93 €' },
        { nombre: 'TITANTECH PXB-700 Endurecedor Epoxi Suelos',          categoria: 'Talleres', formato: '1 L', precio: '15,55 €' },
        { nombre: 'TITANTECH PXB-700 Epoxi Suelos 15 L Base Neutra',     categoria: 'Talleres', formato: '15 L (superficies grandes)', precio: '253,56 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Uso sanitario/alimentario', nombre: 'Epoxi Suelos Sanitaria AQ.PXB-720 Blanco Base 4 L', precio: '97,27 €' },
        { etiqueta: 'Opción económica (superficie pequeña)', nombre: 'TITANTECH PXB-700 Epoxi Suelos 4 L Blanco', precio: '74,96 €' },
        { etiqueta: 'Sin epoxi (más sencillo)', nombre: 'Barniz Titán Suelos con Poliuretano Satinado 4 L Incoloro', precio: '75,98 €' },
      ],
      relatedSolutions: ['eliminar-oxido-metal'],
      seo: {
        title: 'Cómo pintar el suelo del garaje con epoxi | Orencio Matas',
        description: 'Guía para proteger un suelo de garaje o nave con sistema epoxi bicomponente: preparación, mezcla, aplicación y curado.',
      },
    },

    'mantenimiento-piscina': {
      slug: 'mantenimiento-piscina',
      title: 'Cómo equilibrar y mantener el agua de la piscina',
      description: 'Aprende a medir y ajustar el pH, clorar correctamente y prevenir las algas para mantener el agua de la piscina siempre clara.',
      category: 'piscinas', subcategory: 'Mantenimiento de agua',
      problem: 'agua_turbia',
      objective: 'limpiar',
      surface: 'piscina',
      difficulty: 'Fácil',
      estimatedTime: '30 min de mantenimiento semanal',
      result: 'Agua clara, equilibrada y protegida frente a algas',
      breadcrumb: ['Centro de Soluciones', 'Piscinas', 'Mantenimiento de agua'],
      materials: [
        { fase: 'Medición',    familiaSugerida: 'Análisis de agua',        items: ['Tiras analíticas o analizador de pH y cloro'] },
        { fase: 'Ajuste pH',   familiaSugerida: 'Reguladores de pH',       items: ['Reductor de pH', 'Incrementador de pH'] },
        { fase: 'Desinfección',familiaSugerida: 'Cloro para piscinas',     items: ['Cloro rápido (choque)', 'Cloro lento (mantenimiento)'] },
        { fase: 'Prevención',  familiaSugerida: 'Antialgas',               items: ['Antialgas líquido'] },
      ],
      receta: [
        { fase: 'Medir',      emoji: '🧪' },
        { fase: 'Ajustar pH', emoji: '⚖️' },
        { fase: 'Clorar',     emoji: '💧' },
        { fase: 'Prevenir',   emoji: '🛡️' },
      ],
      steps: [
        { n: 1, title: 'Medir pH y cloro', text: 'Antes de añadir cualquier producto, mide el agua con tiras analíticas o un analizador — todo lo que hagas después depende de este dato.', productos: ['Tiras analíticas o analizador de pH y cloro'] },
        { n: 2, title: 'Ajustar el pH', text: 'Lleva el pH al rango correcto (en torno a 7,2-7,6) con reductor o incrementador según el resultado de la medición — se ajusta SIEMPRE antes de clorar.', productos: ['Reductor de pH', 'Incrementador de pH'] },
        { n: 3, title: 'Clorar', text: 'Usa cloro rápido para choques puntuales (agua turbia, después de mucha afluencia de bañistas) y cloro lento para el mantenimiento continuo del día a día.', productos: ['Cloro rápido (choque)', 'Cloro lento (mantenimiento)'] },
        { n: 4, title: 'Prevenir algas', text: 'Aplica un antialgas de forma periódica, especialmente en la época de más calor, cuando las algas aparecen con más facilidad.', productos: ['Antialgas líquido'] },
        { n: 5, title: 'Confirmar al día siguiente', text: 'Repite la medición 24 horas después para confirmar que los valores se han estabilizado en el rango correcto.', productos: [] },
      ],
      professionalTips: [
        'Un pH incorrecto no solo irrita los ojos y la piel — también hace que el cloro deje de actuar correctamente, por eso el pH se ajusta siempre ANTES de clorar, nunca al revés.',
      ],
      commonMistakes: [
        'Clorar sin comprobar antes el pH.',
        'Mezclar productos químicos de piscina directamente entre sí.',
        'Bañarse inmediatamente después de un choque de cloro.',
        'No repetir la medición al día siguiente para confirmar el resultado.',
      ],
      recommendedProducts: [
        { nombre: 'Astralpool Tiras Analíticas 3 en 1, 50 uds',   categoria: 'Piscinas', formato: '50 uds', precio: '13,84 €' },
        { nombre: 'Astralpool Minus Reductor de pH Líquido',       categoria: 'Piscinas', formato: '10 L',  precio: '23,12 €' },
        { nombre: 'Astralpool Incrementador de pH',                categoria: 'Piscinas', formato: '5 kg',  precio: '12,64 €' },
        { nombre: 'Astralpool Cloro Rápido Granulado',              categoria: 'Piscinas', formato: '5 kg',  precio: '28,85 €' },
        { nombre: 'Astralpool Cloro Lento en Tableta',              categoria: 'Piscinas', formato: '5 kg',  precio: '33,93 €' },
        { nombre: 'Antialgas Líquido Astralpool',                   categoria: 'Piscinas', formato: '5 L',   precio: '10,04 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Todo en uno',       nombre: 'Astralpool Inverlong Dosificador Flotante Todo en 1', precio: '15,44 €' },
        { etiqueta: 'Opción profesional/comunidad', nombre: 'CTX 15 Reductor de pH Profesional 20 L', precio: '35,07 €' },
      ],
      relatedSolutions: [],
      seo: {
        title: 'Cómo mantener el agua de la piscina en buen estado | Orencio Matas',
        description: 'Guía de mantenimiento de piscinas: cómo medir y ajustar el pH, clorar correctamente y prevenir la aparición de algas.',
      },
    },

    'control-plagas-cocina': {
      slug: 'control-plagas-cocina',
      title: 'Cómo eliminar cucarachas y hormigas de la cocina',
      description: 'Combina cebo, barrera y sellado de entradas para eliminar cucarachas y hormigas de forma duradera, no solo puntual.',
      category: 'plagas', subcategory: 'Control de insectos',
      problem: 'cucarachas',
      objective: 'proteger',
      surface: 'hogar',
      difficulty: 'Fácil',
      estimatedTime: 'Resultado visible en 1-2 semanas',
      result: 'Cocina u hogar libre de cucarachas y hormigas, con las entradas selladas',
      breadcrumb: ['Centro de Soluciones', 'Plagas y control de insectos', 'Control de insectos'],
      materials: [
        { fase: 'Diagnóstico', familiaSugerida: '—',                    items: ['Identificar la zona de entrada o nido'] },
        { fase: 'Cebo',        familiaSugerida: 'Insecticidas en gel',  items: ['Cebo en gel para cucarachas', 'Cebo en gel para hormigas'] },
        { fase: 'Barrera',     familiaSugerida: 'Insecticidas',         items: ['Insecticida en polvo o spray de barrera'] },
        { fase: 'Prevención',  familiaSugerida: 'Siliconas y selladores', items: ['Sellado de rendijas (ver solución de sellado de juntas)'] },
      ],
      receta: [
        { fase: 'Localizar', emoji: '🔍' },
        { fase: 'Cebo',      emoji: '🎯' },
        { fase: 'Barrera',   emoji: '🛡️' },
        { fase: 'Sellar',    emoji: '🧷' },
      ],
      steps: [
        { n: 1, title: 'Localizar el punto de entrada', text: 'Busca grietas, tuberías o zonas húmedas cerca de agua y comida — ahí suele estar el origen real del problema, no solo donde ves los insectos.', productos: [] },
        { n: 2, title: 'Aplicar cebo en gel', text: 'Coloca el cebo en el recorrido habitual del insecto, nunca donde puedan tocarlo niños o mascotas, ni directamente sobre alimentos.', productos: ['Cebo en gel para cucarachas', 'Cebo en gel para hormigas'] },
        { n: 3, title: 'Reforzar con barrera', text: 'Aplica insecticida en polvo o spray en las zonas de paso — pero nunca directamente sobre el cebo, porque puede hacer que el insecto deje de tocarlo.', productos: ['Insecticida en polvo o spray de barrera'] },
        { n: 4, title: 'Esperar el resultado', text: 'El cebo en gel es de acción lenta a propósito: el insecto se lo lleva al nido y afecta a toda la colonia, no solo al que lo toca — por eso el resultado tarda 1-2 semanas en notarse del todo.', productos: [] },
        { n: 5, title: 'Sellar las entradas', text: 'Una vez controlada la plaga, sella las rendijas o grietas por donde entraban, para que no vuelvan a aparecer.', productos: [] },
      ],
      professionalTips: [
        'El cebo en gel funciona precisamente PORQUE es lento: un insecticida de contacto solo mata al que lo toca, mientras que el cebo se lleva al nido y afecta a toda la colonia — no lo combines con spray justo encima o dejará de resultar atractivo.',
      ],
      commonMistakes: [
        'Rociar spray directamente sobre el cebo en gel.',
        'Colocar cebo donde toca la comida o donde llegan niños o mascotas.',
        'Esperar resultados inmediatos con el cebo (tarda 1-2 semanas).',
        'No sellar las entradas una vez resuelto el problema, dejando la puerta abierta a que vuelvan.',
      ],
      recommendedProducts: [
        { nombre: 'Orion Cebo Matacucarachas Gel, B/3 uds',   categoria: 'Droguería', formato: '3 uds', precio: '2,29 €' },
        { nombre: 'Zum Gel Trampa contra las Hormigas',        categoria: 'Droguería',                  precio: '1,14 €' },
        { nombre: 'Cucal Insecticida en Polvo Cuca/Hormigas',  categoria: 'Droguería', formato: '200 g', precio: '3,56 €' },
        { nombre: 'Baygon Cucas y Hormigas',                    categoria: 'Droguería', formato: '600 ml', precio: '7,56 €' },
      ],
      alternativeProducts: [
        { etiqueta: 'Opción rápida (choque puntual)', nombre: 'Arrixaca Insecticida Cucarachas Spray 400 ml', precio: '2,49 €' },
        { etiqueta: 'Varias zonas de la casa',        nombre: 'Cucal Trampa Cucarachas Est. 6 uds + Trampa Hormigas Est. 2 uds', precio: '3,68 € + 2,23 €' },
      ],
      relatedSolutions: ['sellar-juntas-bano'],
      seo: {
        title: 'Cómo eliminar cucarachas y hormigas de la cocina | Orencio Matas',
        description: 'Guía para eliminar cucarachas y hormigas de forma duradera combinando cebo en gel, barrera de insecticida y sellado de entradas.',
      },
    },
  };

  // ── Motor de diagnóstico del asistente (simulado) ───────────────────────
  // Combina las 4 respuestas del wizard y devuelve el slug de solución más
  // adecuado. En el futuro esta función se sustituiría por una consulta
  // real (reglas más finas, o incluso un modelo), pero la FORMA de la
  // respuesta (un slug de Solution) no cambiaría.
  function encontrarSolucionPorDiagnostico(accionId, superficieId, estadoId, resultadoId) {
    if (accionId === 'pegar') {
      return 'sellar-juntas-bano';
    }
    if (superficieId === 'piscina') {
      return 'mantenimiento-piscina';
    }
    if (superficieId === 'suelo') {
      return 'suelo-epoxi-garaje';
    }
    if (superficieId === 'coche' && (resultadoId === 'recuperar_brillo' || accionId === 'pulir')) {
      return 'recuperar-brillo-carroceria';
    }
    if (superficieId === 'plastico' || (superficieId === 'coche' && accionId === 'pintar')) {
      return 'pintar-plastico-coche';
    }
    if (superficieId === 'metal') {
      return 'eliminar-oxido-metal';
    }
    if (superficieId === 'madera') {
      return 'restaurar-mueble-madera';
    }
    // Fallback razonable para cualquier combinación no cubierta explícitamente
    return 'pintar-plastico-coche';
  }

  // ── Motor de diagnóstico por texto libre (simulado) ─────────────────────
  // Búsqueda simple por palabras clave contra problemasFrecuentes — un
  // "asesor" real usaría NLP/IA, pero de cara al prototipo demuestra
  // exactamente la misma experiencia de principio a fin.
  function diagnosticarPorTexto(texto) {
    const t = (texto || '').toLowerCase();
    const coincidencias = {
      'oxido':      ['oxido', 'óxido', 'oxidad'],
      'aranazos':   ['arañazo', 'aranazo', 'rayad', 'brillo'],
      'no_adhiere': ['no se adhiere', 'no adhiere', 'se despega', 'plastico', 'plástico'],
      'pegamento':  ['pegamento', 'cola', 'adhesivo'],
      'mal_acabado':['barniz', 'blanquecino', 'burbuja', 'mueble', 'madera'],
      'moho_junta': ['moho', 'junta', 'silicona', 'bañera', 'banera', 'ducha'],
      'agua_turbia':['piscina', 'turbia', 'algas', 'cloro', 'ph del agua'],
      'cucarachas': ['cucaracha', 'hormiga', 'insecto', 'plaga', 'bicho'],
      'suelo_deteriorado': ['suelo', 'garaje', 'epoxi', 'nave', 'taller'],
    };
    let problemaId = null;
    for (const [id, palabras] of Object.entries(coincidencias)) {
      if (palabras.some((p) => t.includes(p))) { problemaId = id; break; }
    }
    if (!problemaId) problemaId = 'no_adhiere'; // fallback genérico razonable

    const problema = problemasFrecuentes.find((p) => p.id === problemaId) || problemasFrecuentes[0];
    return {
      problemaDetectado: problema.label,
      solutionSlug: problema.solutionSlug,
    };
  }

  return {
    acciones, superficies, estados, resultados,
    problemasFrecuentes, areas, solucionesDestacadas, soluciones,
    encontrarSolucionPorDiagnostico, diagnosticarPorTexto,
  };
})();
