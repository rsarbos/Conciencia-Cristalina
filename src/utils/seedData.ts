import { BookProjectState } from '../types/book';

export const BOOK_COVER_ASSET = '/src/assets/images/book_cover_hardback_1794482582342.jpg';
export const AUTHOR_AVATAR_ASSET = '/src/assets/images/author_editorial_avatar_1794482582483.jpg';

export const INITIAL_BOOK_PROJECT: BookProjectState = {
  title: 'Conciencia Cristalina — Orient & Architect',
  subtitle:
    'Mapa de 5 Fases, Manifiesto, Metodología, Fundamentos Teóricos e Integración de Sabidurías (ES / EN)',
  authorName: 'Yael Axel Cruz Cebreros & AInvisible Friends',
  targetPubDate: '2027-03-16',
  dailyWordGoal: 3800,
  foundations: [
    {
      id: 'master_guide',
      title: 'Guía Maestra de Voz y Personalidad',
      spanishTitle: 'Guia_Agente_Escritor_Conciencia_Cristalina.md',
      subtitle:
        'Arrastra o escribe aquí tu Guía Maestra de Voz, Personalidad y estándar literario de Conciencia Cristalina.',
      lastUpdated: '2026-11-12',
      fileOrigin: 'Guia_Agente_Escritor_Conciencia_Cristalina.md',
      keyPrinciples: [],
      content: '',
    },
    {
      id: 'structural_map',
      title: 'Mapa Estructural & Visión General (5 Fases)',
      spanishTitle: 'Visión General y Mapa de 5 Fases',
      subtitle:
        'Arrastra o escribe aquí la Visión General de las 5 Fases de Conciencia Cristalina.',
      lastUpdated: '2026-11-12',
      fileOrigin: 'Mapa_Estructural_5_Fases.md',
      keyPrinciples: [],
      content: '',
    },
    {
      id: 'manifiesto_metodologia',
      title: 'Manifiesto y Metodología',
      spanishTitle: 'Manifiesto Fundacional y Metodología Operativa',
      subtitle:
        'Arrastra o escribe aquí el Manifiesto y la Metodología práctica de la obra.',
      lastUpdated: '2026-11-12',
      fileOrigin: 'Manifiesto_y_Metodologia.md',
      keyPrinciples: [],
      content: '',
    },
    {
      id: 'fundamentos_teoricos',
      title: 'Fundamentos Teóricos',
      spanishTitle: 'Fundamentos Teóricos (Física, Neurobiología y Sistemas)',
      subtitle:
        'Arrastra o escribe aquí los Fundamentos Teóricos y científicos del libro.',
      lastUpdated: '2026-11-12',
      fileOrigin: 'Fundamentos_Teoricos.md',
      keyPrinciples: [],
      content: '',
    },
    {
      id: 'integracion_sabidurias',
      title: 'Integración de Sabidurías',
      spanishTitle: 'Integración de Sabidurías Ancestrales y Contemporáneas',
      subtitle:
        'Arrastra o escribe aquí el puente de Integración de Sabidurías.',
      lastUpdated: '2026-11-12',
      fileOrigin: 'Integracion_de_Sabidurias.md',
      keyPrinciples: [],
      content: '',
    },
  ],
  chapters: [
    {
      id: 'ch-1',
      number: 1,
      partTitle: 'Fase 1 · El Despertar y la Deconstrucción del Ego',
      title: 'El Espejo de la Conciencia Cristalina',
      subtitle: 'De la Matrix Reactiva a la Soberanía del Observador',
      scheduledDay: 1,
      targetWordCount: 3800,
      status: 'queued',
      editorialNotes:
        'Capítulo 1 listo para redactar en Español Nativo (ES) e Inglés Nativo (EN).',
      wisdomPillarsUsed: [
        'master_guide',
        'structural_map',
        'manifiesto_metodologia',
        'fundamentos_teoricos',
        'integracion_sabidurias',
      ],
      activeLanguage: 'es',
      subtopics: [
        {
          id: 'ch-1-sub-1',
          title: 'El Diagnóstico de la Fragmentación y el Espejo Interior',
          completed: false,
          keyArgument:
            'Exponer cómo la mente reactiva proyecta su desorden interno sobre la realidad cotidiana.',
          targetWords: 950,
        },
        {
          id: 'ch-1-sub-2',
          title: 'Física de la Conciencia y Coherencia del Observador',
          completed: false,
          keyArgument:
            'Conectar la física de sistemas y la neurobiología de la atención con la presencia consciente.',
          targetWords: 950,
        },
        {
          id: 'ch-1-sub-3',
          title: 'La Verdad Incómoda: Responsabilidad sin Culpa',
          completed: false,
          keyArgument:
            'Desmantelar el victimismo automático e instalar las 3 frases ancla subrayables.',
          targetWords: 950,
        },
        {
          id: 'ch-1-sub-4',
          title: 'Protocolo Práctico: Conciencia en Acción en 3 Pasos',
          completed: false,
          keyArgument:
            'Ejercicio diario verificable para habitar la frecuencia de Conciencia Cristalina.',
          targetWords: 950,
        },
      ],
      manuscriptContent: '',
      moduleKits: {
        es: {
          language: 'es',
          label: 'Kit Español (Nativo)',
          title: 'El Espejo de la Conciencia Cristalina',
          subtitle: 'De la Matrix Reactiva a la Soberanía del Observador',
          manuscriptContent: '',
          wordCount: 0,
        },
        en: {
          language: 'en',
          label: 'Kit English (Native)',
          title: 'The Mirror of Crystalline Consciousness',
          subtitle: 'From the Reactive Matrix to Observer Sovereignty',
          manuscriptContent: '',
          wordCount: 0,
        },
      },
    },
  ],
  socialPosts: [],
  retailChannels: [
    {
      id: 'ret-bn',
      channelName: 'Barnes & Noble (NYT Reporting)',
      currentPreorders: 0,
      targetWeek1: 3200,
      nyTimesWeight: 'Critical — Direct NYT Hardcover Panel',
      conversionRate: 0,
      weeklyVelocity: 0,
    },
    {
      id: 'ret-indie',
      channelName: 'IndieBound / Bookshop.org',
      currentPreorders: 0,
      targetWeek1: 2500,
      nyTimesWeight: 'Critical — Independent Bookstore Diversity Weight',
      conversionRate: 0,
      weeklyVelocity: 0,
    },
    {
      id: 'ret-amazon',
      channelName: 'Amazon Hardcover & Kindle',
      currentPreorders: 0,
      targetWeek1: 3300,
      nyTimesWeight: 'High — Baseline Volume & Category Rank #1',
      conversionRate: 0,
      weeklyVelocity: 0,
    },
    {
      id: 'ret-porchlight',
      channelName: 'Porchlight / Verified Corporate & University',
      currentPreorders: 0,
      targetWeek1: 1000,
      nyTimesWeight: 'Audited — Diversified Institutional Orders',
      conversionRate: 0,
      weeklyVelocity: 0,
    },
  ],
  readerCohorts: [
    {
      id: 'coh-newsletter',
      segmentName: 'Comunidad Substack & Newsletter (ES / EN)',
      subscribers: 0,
      openRate: 0,
      clickThroughRate: 0,
      preOrderConversion: 0,
      engagementAction:
        'Enviar adelanto bilingüe del Capítulo con acceso al dossier de Conciencia Cristalina.',
    },
    {
      id: 'coh-arc',
      segmentName: 'Círculo de Lectores Avanzados (ARC VIP)',
      subscribers: 0,
      openRate: 0,
      clickThroughRate: 0,
      preOrderConversion: 0,
      engagementAction:
        'Compartir Kit Español + Kit Inglés para reseñas verificadas en Semana 1.',
    },
    {
      id: 'coh-social',
      segmentName: 'Audiencia YouTube, Reels, TikTok, X & LinkedIn',
      subscribers: 0,
      openRate: 0,
      clickThroughRate: 0,
      preOrderConversion: 0,
      engagementAction:
        'Convertir cada episodio de video (LatentSync + LTX B-Roll) en preventas verificadas.',
    },
  ],
  bestsellerTasks: [
    {
      id: 'task-1',
      phase: 'Fase 1 · Cimiento Arquitectónico (0%–25% Manuscrito)',
      title: 'Subir los 5 Documentos Fundacionales y el Mapa de Temas y Subtemas',
      triggerCondition: 'Al iniciar el proyecto de Conciencia Cristalina.',
      tacticalInstruction:
        'Carga tu Guía Maestra, Mapa de 5 Fases, Manifiesto, Fundamentos Teóricos e Integración de Sabidurías en la pestaña Foundations & Map para alimentar el system_prompt de Claude Opus 5.5.',
      metricTarget: '5 Pilares Fundacionales y Temario de Capítulos listos',
      completed: false,
      impactWeight: 25,
      requiredManuscriptPct: 0,
    },
    {
      id: 'task-2',
      phase: 'Fase 2 · Producción Bilingüe Diaria (25%–50% Manuscrito)',
      title: 'Generar Kit Español (Nativo) + Kit Inglés (Native) y Paquete de Video por Capítulo',
      triggerCondition: 'Al redactar cada capítulo en el Writer Panel.',
      tacticalInstruction:
        'Usa "Escribir Capítulo del Día" para generar los dos kits de módulo (Español Nativo e Inglés Nativo) junto con sus guiones de video guion_epX.json y posts sociales.',
      metricTarget: 'Capítulos guardados en ES + EN con guion_epX.json disparado',
      completed: false,
      impactWeight: 25,
      requiredManuscriptPct: 25,
    },
    {
      id: 'task-3',
      phase: 'Fase 3 · Diversificación de Librerías NYT (50%–85% Manuscrito)',
      title: 'Balancear Preventas en Barnes & Noble e IndieBound / Bookshop.org',
      triggerCondition: 'Al superar el 50% del manuscrito guardado.',
      tacticalInstruction:
        'Dirige los llamados a la acción (CTA) de los videos de YouTube y Reels de 60s hacia librerías que reportan al New York Times (Barnes & Noble e IndieBound).',
      metricTarget: '>=38% de preventas en librerías independientes y B&N',
      completed: false,
      impactWeight: 25,
      requiredManuscriptPct: 50,
    },
    {
      id: 'task-4',
      phase: 'Fase 4 · Impulso de Semana de Lanzamiento NYT (85%–100% Manuscrito)',
      title: 'Consolidar 10,000 Unidades en Semana 1 con Comunidad Bilingüe',
      triggerCondition: 'Al exportar el Manuscrito Final en Español e Inglés.',
      tacticalInstruction:
        'Activa la entrega del Dossier Completo y Masterclass en vivo para todos los lectores que registren su recibo de preventa antes del cierre de reporte de Semana 1.',
      metricTarget: '10,000 unidades acumuladas para Semana 1 (#1 NYT Bestseller)',
      completed: false,
      impactWeight: 25,
      requiredManuscriptPct: 85,
    },
  ],
};
