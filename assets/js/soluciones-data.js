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
  ];

  // ── Soluciones destacadas (para la home) ────────────────────────────────
  const solucionesDestacadas = [
    { slug: 'pintar-plastico-coche',     title: 'Cómo pintar una pieza de plástico de un coche', difficulty: 'Media', estimatedTime: '3-4 h + secado', emoji: '🚗' },
    { slug: 'recuperar-brillo-carroceria', title: 'Cómo reparar un arañazo de la carrocería',     difficulty: 'Media', estimatedTime: '1-2 h',          emoji: '🚗' },
    { slug: 'eliminar-oxido-metal',      title: 'Cómo eliminar óxido del metal',                 difficulty: 'Fácil', estimatedTime: '1 h',             emoji: '🔩' },
    { slug: 'restaurar-mueble-madera',   title: 'Cómo restaurar un mueble de madera',             difficulty: 'Media', estimatedTime: '1-2 días (secados)', emoji: '🪵' },
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
  };

  // ── Motor de diagnóstico del asistente (simulado) ───────────────────────
  // Combina las 4 respuestas del wizard y devuelve el slug de solución más
  // adecuado. En el futuro esta función se sustituiría por una consulta
  // real (reglas más finas, o incluso un modelo), pero la FORMA de la
  // respuesta (un slug de Solution) no cambiaría.
  function encontrarSolucionPorDiagnostico(accionId, superficieId, estadoId, resultadoId) {
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
