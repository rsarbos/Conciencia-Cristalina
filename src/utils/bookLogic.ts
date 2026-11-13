import {
  BookChapter,
  BookProjectState,
  BestsellerPhaseTask,
  ChapterLanguageKit,
  ChapterVideoPackage,
  CloudPipelineConfig,
  FoundationPillar,
  GuionEpBloque,
  GuionEpJsonSchema,
  LanguageCode,
  ReaderCohortMetric,
  RetailChannelMetric,
  SocialMediaPost,
  SubtopicItem,
  VideoBlockRenderStage,
  VideoScriptBlock,
  WritingEngineId,
} from '../types/book';

export function countWords(text: string): number {
  const cleaned = (text || '').trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

export function extractKeyPrinciples(text: string, maxItems = 4): string[] {
  if (!text || !text.trim()) return [];
  const lines = text
    .split('\n')
    .map((line) => line.replace(/^[-*•#\d.)\s]+/, '').trim())
    .filter((line) => line.length >= 18 && line.length <= 160);
  if (lines.length > 0) {
    return lines.slice(0, maxItems);
  }
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);
  return sentences.slice(0, maxItems);
}

/**
 * Parses a dropped or pasted Topics & Subtopics outline into structured daily chapters
 * with bilingual module kits (ES + EN) ready to write.
 */
export function parseSyllabusTextToChapters(
  rawText: string,
  existingChapterCount = 0
): BookChapter[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const chapters: BookChapter[] = [];
  let currentPart = 'Fase 1 · El Despertar y la Deconstrucción del Ego';
  let currentChapter: BookChapter | null = null;

  const pushCurrent = () => {
    if (currentChapter) {
      if (currentChapter.subtopics.length === 0) {
        currentChapter.subtopics = ensureFourSubtopics(currentChapter);
      }
      currentChapter.moduleKits = {
        es: {
          language: 'es',
          label: 'Kit Español (Nativo)',
          title: currentChapter.title,
          subtitle: currentChapter.subtitle,
          manuscriptContent: '',
          wordCount: 0,
        },
        en: {
          language: 'en',
          label: 'Kit English (Native)',
          title: currentChapter.title,
          subtitle: currentChapter.subtitle,
          manuscriptContent: '',
          wordCount: 0,
        },
      };
      chapters.push(currentChapter);
      currentChapter = null;
    }
  };

  for (const line of lines) {
    if (
      /^(part|parte|fase)\s+[ivx\d]+/i.test(line) ||
      /^#\s+(part|parte|fase)/i.test(line)
    ) {
      currentPart = line.replace(/^#+\s*/, '');
      continue;
    }

    const isChapterHeader =
      /^(chapter|cap[ií]tulo|tema|topic|day|d[ií]a|m[oó]dulo)\s*\d*/i.test(
        line
      ) ||
      /^#{1,2}\s+/.test(line) ||
      /^\d+\.\s+[A-ZÁÉÍÓÚÑ¿¡]/.test(line);

    const isSubtopicBullet =
      /^[-*•+]\s+/.test(line) ||
      /^\d+\.\d+\s+/.test(line) ||
      /^[a-z]\)\s+/i.test(line);

    if (isChapterHeader && !isSubtopicBullet) {
      pushCurrent();
      const nextNum = existingChapterCount + chapters.length + 1;
      const cleanedTitle = line
        .replace(/^#{1,3}\s*/, '')
        .replace(
          /^(chapter|cap[ií]tulo|tema|topic|day|d[ií]a|m[oó]dulo)\s*[\d.]*[:.-]?\s*/i,
          ''
        )
        .replace(/^\d+\.\s*/, '')
        .trim();

      const parts = cleanedTitle.split(/\s*[—–:]\s*/);
      const mainTitle = parts[0] || `Capítulo ${nextNum}`;
      const subTitle =
        parts.slice(1).join(' — ') ||
        'Arquitectura de Conciencia Cristalina, Ciencia y Sabiduría Aplicada';

      currentChapter = {
        id: `ch-${Date.now()}-${nextNum}`,
        number: nextNum,
        partTitle: currentPart,
        title: mainTitle,
        subtitle: subTitle,
        scheduledDay: nextNum,
        targetWordCount: 3800,
        manuscriptContent: '',
        editorialNotes: `Programado para el Día ${nextNum}. Kits ES + EN habilitados.`,
        status: 'queued',
        activeLanguage: 'es',
        subtopics: [],
        wisdomPillarsUsed: [
          'master_guide',
          'structural_map',
          'manifiesto_metodologia',
          'fundamentos_teoricos',
          'integracion_sabidurias',
        ],
      };
    } else if (isSubtopicBullet || currentChapter) {
      if (!currentChapter) {
        const nextNum = existingChapterCount + chapters.length + 1;
        currentChapter = {
          id: `ch-${Date.now()}-${nextNum}`,
          number: nextNum,
          partTitle: currentPart,
          title:
            line.replace(/^[-*•+\d.)\s]+/, '').trim() || `Capítulo ${nextNum}`,
          subtitle: 'Capítulo del Manuscrito Diario (ES / EN)',
          scheduledDay: nextNum,
          targetWordCount: 3800,
          manuscriptContent: '',
          editorialNotes: `Programado para el Día ${nextNum}.`,
          status: 'queued',
          activeLanguage: 'es',
          subtopics: [],
          wisdomPillarsUsed: [
            'master_guide',
            'structural_map',
            'fundamentos_teoricos',
          ],
        };
      } else {
        const subTitle = line
          .replace(/^[-*•+]|\d+\.\d+|[a-z]\)\s*/i, '')
          .trim();
        if (subTitle) {
          const subIdx = currentChapter.subtopics.length + 1;
          currentChapter.subtopics.push({
            id: `${currentChapter.id}-sub-${subIdx}`,
            title: subTitle,
            completed: false,
            keyArgument: `Desarrollar "${subTitle}" integrando ciencia, conciencia y protocolo práctico.`,
            targetWords: 950,
          });
        }
      }
    }
  }

  pushCurrent();
  return chapters;
}

export interface ManuscriptProgressSummary {
  totalWordsWritten: number;
  totalTargetWords: number;
  wordCompletionPct: number;
  savedChaptersCount: number;
  totalChaptersCount: number;
  chapterCompletionPct: number;
  estimatedBookPages: number;
  foundationsCompletedCount: number;
  completedSubtopicsCount: number;
  totalSubtopicsCount: number;
}

export function calculateManuscriptProgress(
  chapters: BookChapter[],
  foundations: FoundationPillar[]
): ManuscriptProgressSummary {
  const totalWordsWritten = chapters.reduce(
    (sum, ch) => sum + countWords(ch.manuscriptContent),
    0
  );
  const totalTargetWords = chapters.reduce(
    (sum, ch) => sum + (ch.targetWordCount || 3800),
    0
  );
  const wordCompletionPct =
    totalTargetWords > 0
      ? Math.min(100, Math.round((totalWordsWritten / totalTargetWords) * 100))
      : 0;

  const savedChaptersCount = chapters.filter(
    (ch) => ch.status === 'saved_to_manuscript'
  ).length;
  const totalChaptersCount = chapters.length;
  const chapterCompletionPct =
    totalChaptersCount > 0
      ? Math.round((savedChaptersCount / totalChaptersCount) * 100)
      : 0;

  const estimatedBookPages = Math.max(1, Math.round(totalWordsWritten / 275));
  const foundationsCompletedCount = foundations.filter(
    (f) => countWords(f.content) >= 25
  ).length;

  let completedSubtopicsCount = 0;
  let totalSubtopicsCount = 0;
  for (const ch of chapters) {
    totalSubtopicsCount += ch.subtopics.length;
    completedSubtopicsCount += ch.subtopics.filter((s) => s.completed).length;
  }

  return {
    totalWordsWritten,
    totalTargetWords,
    wordCompletionPct,
    savedChaptersCount,
    totalChaptersCount,
    chapterCompletionPct,
    estimatedBookPages,
    foundationsCompletedCount,
    completedSubtopicsCount,
    totalSubtopicsCount,
  };
}

export interface NYTBestsellerAssessment {
  week1ProjectedUnits: number;
  nytThresholdUnits: number;
  velocityScorePct: number;
  retailDiversityScorePct: number;
  indieAndBnSharePct: number;
  funnelProjectedPreorders: number;
  overallReadinessIndex: number;
  activeDirectivePhase: string;
  immediateDirectiveTitle: string;
  immediateDirectiveInstruction: string;
  socialAmplificationIndex: number;
}

export function calculateNYTBestsellerReadiness(
  chapters: BookChapter[],
  socialPosts: SocialMediaPost[],
  retailChannels: RetailChannelMetric[],
  readerCohorts: ReaderCohortMetric[],
  tasks: BestsellerPhaseTask[]
): NYTBestsellerAssessment {
  const nytThresholdUnits = 10000;
  const week1ProjectedUnits = retailChannels.reduce(
    (sum, ch) => sum + ch.currentPreorders,
    0
  );
  const velocityScorePct = Math.min(
    100,
    Math.round((week1ProjectedUnits / nytThresholdUnits) * 100)
  );

  const indieAndBnUnits = retailChannels
    .filter((c) => /barnes|indie|bookshop/i.test(c.channelName))
    .reduce((sum, c) => sum + c.currentPreorders, 0);

  const indieAndBnSharePct =
    week1ProjectedUnits > 0
      ? Math.round((indieAndBnUnits / week1ProjectedUnits) * 100)
      : 0;

  const retailDiversityScorePct = Math.min(
    100,
    Math.round((indieAndBnSharePct / 35) * 100)
  );

  const funnelProjectedPreorders = readerCohorts.reduce((sum, cohort) => {
    const engagedReaders =
      cohort.subscribers *
      (cohort.openRate / 100) *
      (cohort.clickThroughRate / 100);
    const converted = Math.round(
      engagedReaders * (cohort.preOrderConversion / 100)
    );
    return sum + converted;
  }, 0);

  const readyOrPublishedPosts = socialPosts.filter(
    (p) =>
      p.status === 'ready' ||
      p.status === 'scheduled' ||
      p.status === 'published'
  ).length;
  const targetPosts = Math.max(5, chapters.length * 3);
  const socialAmplificationIndex = Math.min(
    100,
    Math.round((readyOrPublishedPosts / targetPosts) * 100)
  );

  const savedChaptersPct =
    chapters.length > 0
      ? Math.round(
          (chapters.filter((c) => c.status === 'saved_to_manuscript').length /
            chapters.length) *
            100
        )
      : 0;

  const overallReadinessIndex = Math.round(
    velocityScorePct * 0.4 +
      retailDiversityScorePct * 0.25 +
      socialAmplificationIndex * 0.15 +
      savedChaptersPct * 0.2
  );

  const nextPendingTask =
    tasks.find(
      (t) => !t.completed && savedChaptersPct >= t.requiredManuscriptPct
    ) ||
    tasks.find((t) => !t.completed) ||
    tasks[tasks.length - 1];

  let activeDirectivePhase =
    'Fase 1 · Cimiento Arquitectónico y Carga de Guías Maestras';
  if (savedChaptersPct >= 75 && velocityScorePct >= 60) {
    activeDirectivePhase = 'Fase 4 · Impulso de Semana de Lanzamiento NYT';
  } else if (savedChaptersPct >= 50) {
    activeDirectivePhase = 'Fase 3 · Diversificación de Librerías NYT';
  } else if (savedChaptersPct >= 25) {
    activeDirectivePhase = 'Fase 2 · Producción Bilingüe Diaria (ES / EN)';
  }

  return {
    week1ProjectedUnits,
    nytThresholdUnits,
    velocityScorePct,
    retailDiversityScorePct,
    indieAndBnSharePct,
    funnelProjectedPreorders,
    overallReadinessIndex,
    activeDirectivePhase,
    immediateDirectiveTitle:
      nextPendingTask?.title ||
      'Subir Guías Maestras y Redactar Capítulo Bilingüe (ES/EN)',
    immediateDirectiveInstruction:
      nextPendingTask?.tacticalInstruction ||
      'Carga tus documentos en Foundations & Map y presiona "Escribir Capítulo del Día" para generar los Kits en Español e Inglés.',
    socialAmplificationIndex,
  };
}

export function generateFallbackChapterDraft(
  chapter: BookChapter,
  foundations: FoundationPillar[],
  subtopicFocus?: string,
  lang: LanguageCode = 'es'
): string {
  if (subtopicFocus) {
    const matched =
      chapter.subtopics.find((s) => s.title === subtopicFocus) ||
      chapter.subtopics[0];
    if (lang === 'en') {
      return `### Expanded Subtopic: ${matched?.title || subtopicFocus}
${matched?.keyArgument || 'Integrating theoretical science with conscious practice.'}

When we examine **${subtopicFocus}** through the lens of *Conciencia Cristalina* by Yael Axel Cruz Cebreros & AInvisible Friends, we bridge empirical systems theory with sovereign presence. Rather than reacting from fragmented habits, the observer reorganizes internal coherence and translates insight into immediate daily action.`;
    }
    return `### Subtema Expandido: ${matched?.title || subtopicFocus}
${matched?.keyArgument || 'Integrando la física de la conciencia con la práctica cotidiana.'}

Al examinar **${subtopicFocus}** desde la arquitectura de *Conciencia Cristalina* de Yael Axel Cruz Cebreros & AInvisible Friends, tendemos un puente directo entre los Fundamentos Teóricos y la soberanía del observador. En lugar de reaccionar desde la Matrix del hábito automático, el lector reorganiza su coherencia interna y la convierte en acción verificable hoy mismo.`;
  }

  return generateSixBlockBestsellerChapterStreamChunks(
    chapter,
    foundations,
    'el siguiente capítulo de Conciencia Cristalina',
    lang
  ).join('');
}

export function generateFallbackSocialPosts(
  chapter: BookChapter,
  foundations: FoundationPillar[],
  bookTitle: string
): SocialMediaPost[] {
  const manifiesto = foundations.find((f) => f.id === 'manifiesto_metodologia');
  const sabidurias = foundations.find((f) => f.id === 'integracion_sabidurias');
  const subtopicNames = chapter.subtopics.map((s) => s.title).slice(0, 4);
  const subList =
    subtopicNames.length > 0
      ? subtopicNames.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '1. Diagnóstico del Espejo\n2. Física de la Conciencia\n3. Responsabilidad sin Culpa\n4. Conciencia en Acción';

  const corePrinciple =
    extractKeyPrinciples(manifiesto?.content || '', 1)[0] ||
    'La atención consciente es el puente donde la física de sistemas y la sabiduría interior se vuelven una sola fuerza.';
  const wisdomBridge =
    extractKeyPrinciples(sabidurias?.content || '', 1)[0] ||
    'No viniste a sobrevivir dentro de una estructura ajena; viniste a diseñar la geometría de tu propia conciencia.';

  return [
    {
      id: `post-${chapter.id}-twitter-${Date.now()}`,
      chapterId: chapter.id,
      language: 'es',
      platform: 'twitter_thread',
      hook: `1/ Hoy terminamos el Capítulo ${chapter.number} de "${bookTitle}" (Yael Axel Cruz Cebreros & AInvisible Friends): "${chapter.title}".\n\nPor qué el 95% de las personas intenta cambiar su realidad externa sin recalibrar el observador interno (Hilo 🧵):`,
      content: `2/ El diagnóstico: Vivimos atrapados en una sala de espejos reactiva.\n\n3/ En el Capítulo ${chapter.number} integramos estos 4 pilares:\n${subList}\n\n4/ La frase ancla del capítulo:\n"${corePrinciple}"\n\n5/ Incluye Kit en Español Nativo + Kit en Inglés Nativo y el episodio completo en video.`,
      callToAction: `Reserva tu ejemplar en Barnes & Noble o Bookshop.org y comenta "CRISTALINA" para recibir el Dossier del Capítulo ${chapter.number}.`,
      hashtags: [
        '#ConcienciaCristalina',
        '#OrientAndArchitect',
        '#YaelAxelCruzCebreros',
        '#AInvisibleFriends',
      ],
      status: 'ready',
      scheduledDayOffset: 0,
      predictedEngagementRate: 7.4,
    },
    {
      id: `post-${chapter.id}-instagram-${Date.now()}`,
      chapterId: chapter.id,
      language: 'es',
      platform: 'instagram_carousel',
      hook: `Slide 1: CAPÍTULO ${chapter.number} · ${chapter.title.toUpperCase()} — De la Matrix Reactiva a la Conciencia Cristalina`,
      content: `Slide 2: El Fallo Invisible — Intentar ordenar el reflejo sin mover al observador.\nSlide 3: Puente Ciencia + Conciencia — "${corePrinciple}"\nSlide 4: Los 4 Subtemas del Capítulo ${chapter.number}:\n${subList}\nSlide 5: La Verdad Incómoda — "${wisdomBridge}"\nSlide 6: Protocolo Conciencia en Acción en 3 pasos (Disponible en Español e Inglés).`,
      callToAction: `Guarda este carrusel y entra al link de la bio para reservar "${bookTitle}".`,
      hashtags: [
        '#ConcienciaCristalina',
        '#DespertarConsciente',
        '#FísicaDeLaConciencia',
        '#AInvisibleFriends',
      ],
      status: 'ready',
      scheduledDayOffset: 1,
      predictedEngagementRate: 8.5,
    },
    {
      id: `post-${chapter.id}-video-${Date.now()}`,
      chapterId: chapter.id,
      language: 'es',
      platform: 'short_video_hook',
      hook: `[0:00–0:03 Hook] Deja de pelear con el espejo: tu realidad exterior solo está replicando la frecuencia de tu observador interno.`,
      content: `[0:04–0:20 Física/Conciencia] En el Capítulo ${chapter.number} de "${bookTitle}" ("${chapter.title}"), mostramos cómo la neurobiología predictiva y la sabiduría ancestral convergen en una misma ley: "${corePrinciple}"\n[0:21–0:45 Protocolo en 3 Pasos]\n${subList}\n[0:46–0:60 CTA] Comenta "ESPEJO" para enviarte el guion y el capítulo bilingüe (ES/EN).`,
      callToAction: `Comenta "ESPEJO" y mira el episodio completo de 15–18 min en YouTube.`,
      hashtags: ['#ReelsConciencia', '#BookTok', '#ConcienciaCristalina'],
      status: 'ready',
      scheduledDayOffset: 2,
      predictedEngagementRate: 9.2,
    },
    {
      id: `post-${chapter.id}-linkedin-${Date.now()}`,
      chapterId: chapter.id,
      language: 'en',
      platform: 'linkedin',
      hook: `We just locked Chapter ${chapter.number} of "${bookTitle}" (by Yael Axel Cruz Cebreros & AInvisible Friends) in both our Spanish Native and English Native Module Kits: "${chapter.title}".`,
      content: `Most leadership and personal architecture models fail because they address symptoms while ignoring the observer inside the system.\n\nIn Chapter ${chapter.number} (${chapter.subtitle}), we bridge empirical systems theory with contemplative sovereignty across four subtopics:\n${subList}\n\nKeystone Principle:\n"${wisdomBridge}"`,
      callToAction: `Pre-order "${bookTitle}" via Barnes & Noble or IndieBound/Bookshop.org to unlock the bilingual Chapter ${chapter.number} Dossier.`,
      hashtags: [
        '#OrientAndArchitect',
        '#ConcienciaCristalina',
        '#SystemsThinking',
        '#AInvisibleFriends',
      ],
      status: 'ready',
      scheduledDayOffset: 3,
      predictedEngagementRate: 6.9,
    },
    {
      id: `post-${chapter.id}-substack-${Date.now()}`,
      chapterId: chapter.id,
      language: 'es',
      platform: 'substack_letter',
      hook: `Bitácora del Manuscrito · Capítulo ${chapter.number}: ${chapter.title} (Edición Bilingüe ES + EN)`,
      content: `Querida comunidad de Conciencia Cristalina,\n\nHoy ha quedado guardado en el Manuscrito Final el Capítulo ${chapter.number}: "${chapter.title}" (${chapter.subtitle}), firmado por Yael Axel Cruz Cebreros & AInvisible Friends.\n\nEn esta entrega exploramos:\n${subList}\n\nAdemás, el pipeline audiovisual ya generó el paquete guion_ep${String(chapter.number).padStart(2, '0')}.json en Español e Inglés para nuestro episodio de YouTube.`,
      callToAction: `Responde a esta carta con tu comprobante de preventa para recibir el adelanto completo en PDF/DOCX.`,
      hashtags: ['#SubstackConciencia', '#ConcienciaCristalina'],
      status: 'ready',
      scheduledDayOffset: 4,
      predictedEngagementRate: 14.5,
    },
  ];
}

export function compileFullManuscriptMarkdown(
  project: BookProjectState,
  includeAllChapters = false,
  preferredLang?: LanguageCode
): string {
  const chaptersToExport = includeAllChapters
    ? project.chapters
    : project.chapters.filter(
        (c) =>
          c.status === 'saved_to_manuscript' ||
          countWords(c.manuscriptContent) > 0
      );

  const nonEmptyFoundations = project.foundations.filter(
    (f) => f.content && f.content.trim().length > 0
  );

  const foundationsSection =
    nonEmptyFoundations.length > 0
      ? nonEmptyFoundations
          .map(
            (f) => `### ${f.title} (${f.spanishTitle})
*${f.subtitle}*

${f.content.trim()}
`
          )
          .join('\n---\n\n')
      : '*Los 5 Pilares Fundacionales están listos para recibir tus documentos en la pestaña Foundations & Map.*';

  const chaptersSection =
    chaptersToExport.length > 0
      ? chaptersToExport
          .map((ch) => {
            const kitContent =
              preferredLang && ch.moduleKits?.[preferredLang]?.manuscriptContent
                ? ch.moduleKits[preferredLang].manuscriptContent
                : ch.manuscriptContent;
            const kitTitle =
              preferredLang && ch.moduleKits?.[preferredLang]?.title
                ? ch.moduleKits[preferredLang].title
                : ch.title;
            const kitSubtitle =
              preferredLang && ch.moduleKits?.[preferredLang]?.subtitle
                ? ch.moduleKits[preferredLang].subtitle
                : ch.subtitle;

            return `# Capítulo ${ch.number}: ${kitTitle}
*${ch.partTitle} — ${kitSubtitle}*

${
  (kitContent || '').trim() ||
  `[Capítulo en preparación — Día ${ch.scheduledDay}]\n\nSubtemas:\n` +
    ch.subtopics.map((s) => `- ${s.title}: ${s.keyArgument}`).join('\n')
}
`;
          })
          .join(
            '\n\n================================================================================\n\n'
          )
      : '*Aún no hay capítulos guardados en el Manuscrito Final. Presiona "Escribir Capítulo del Día" en el Writer Panel para redactar y guardar automáticamente.*';

  return `# ${project.title}
## ${project.subtitle}
**Por ${project.authorName}**
*Fecha Objetivo de Publicación: ${project.targetPubDate}*

================================================================================
## PRELUDIO ARQUITECTÓNICO Y DOCUMENTOS FUNDACIONALES
================================================================================

${foundationsSection}

================================================================================
## CAPÍTULOS DEL MANUSCRITO (${chaptersToExport.length} CAPÍTULOS)
================================================================================

${chaptersSection}
`;
}

export const DEFAULT_CLOUD_PIPELINE_CONFIG: CloudPipelineConfig = {
  GCP_PROJECT_ID: 'conciencia-cristalina-prod',
  BACKEND_BRIDGE_URL: 'http://localhost:8000',
  COMFYUI_TUNNEL_URL: 'https://conciencia-gpu-node.trycloudflare.com',
  DRIVE_FOLDER_ID: 'ConcienciaCristalina',
};

export function resolveChapterPhaseNumber(chapter: BookChapter): number {
  const match = chapter.partTitle.match(/fase\s*(\d+)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (parsed >= 1 && parsed <= 5) return parsed;
  }
  return Math.min(5, Math.max(1, Math.ceil(chapter.number / 2)));
}

export function ensureFourSubtopics(chapter: BookChapter): SubtopicItem[] {
  const existing = [...chapter.subtopics];
  const defaults = [
    {
      title: 'Diagnóstico del Fallo y Fenomenología de la Dispersión',
      keyArgument:
        'Exponer la raíz estructural del problema cotidiano desde la Visión General.',
    },
    {
      title: 'Puente Ciencia Empírica + Conciencia Cristalina',
      keyArgument:
        'Unificar los Fundamentos Teóricos con la neurobiología y la física de sistemas.',
    },
    {
      title: 'La Verdad Incómoda: Responsabilidad sin Culpa',
      keyArgument:
        'Desmantelar la ilusión reactiva e instalar las 3 frases ancla subrayables.',
    },
    {
      title: 'Protocolo Práctico Conciencia en Acción en 3 Pasos',
      keyArgument:
        'Traducir la Integración de Sabidurías en una práctica verificable en 3 pasos.',
    },
  ];

  while (existing.length < 4) {
    const idx = existing.length;
    const def = defaults[idx % defaults.length];
    existing.push({
      id: `${chapter.id}-sub-auto-${idx + 1}`,
      title: def.title,
      completed: false,
      keyArgument: def.keyArgument,
      targetWords: 950,
    });
  }

  return existing.slice(0, 4);
}

/**
 * Genera el objeto JSON estructurado exacto de `guion_epX.json` siguiendo la arquitectura
 * de "Conciencia Cristalina" en Español Nativo ('es') o Inglés Nativo ('en').
 */
export function buildGuionEpJson(
  chapter: BookChapter,
  foundations: FoundationPillar[],
  lang: LanguageCode = 'es'
): GuionEpJsonSchema {
  const epNumPadded = String(chapter.number).padStart(2, '0');
  const phaseNum = resolveChapterPhaseNumber(chapter);
  const subs = ensureFourSubtopics(chapter);

  const teoricos = foundations.find((f) => f.id === 'fundamentos_teoricos');
  const manifiesto = foundations.find((f) => f.id === 'manifiesto_metodologia');
  const sabidurias = foundations.find((f) => f.id === 'integracion_sabidurias');

  const teoricosKey =
    extractKeyPrinciples(teoricos?.content || '', 1)[0] ||
    (lang === 'en'
      ? 'The brain operates as a predictive inference engine that collapses uncertainty through conscious architecture.'
      : 'El cerebro opera como un motor de inferencia predictiva que colapsa la incertidumbre mediante arquitectura consciente.');

  const manifiestoKey =
    extractKeyPrinciples(manifiesto?.content || '', 1)[0] ||
    (lang === 'en'
      ? 'Human attention is the primary creative substance of our century.'
      : 'La atención humana es la sustancia creativa primaria de nuestro siglo.');

  const sabiduriasKey =
    extractKeyPrinciples(sabidurias?.content || '', 1)[0] ||
    (lang === 'en'
      ? 'When empirical science and contemplative wisdom converge, sovereign presence emerges.'
      : 'Cuando la ciencia empírica y la sabiduría contemplativa convergen, emerge la soberanía interior.');

  if (lang === 'en') {
    const enTitle =
      chapter.moduleKits?.en?.title ||
      `${chapter.title} (English Native Edition)`;
    const bloquesEn: GuionEpBloque[] = [
      {
        id: 'bloque_0_hook',
        titulo_bloque: 'Block 0: Visceral Hook',
        tiempo: '00:00 - 01:30',
        plano_camara:
          'Medium Shot (MS) direct to camera, warm studio key light, shallow depth of field',
        locucion_avatar: `Have you ever felt like you are fighting a thousand reflections in a room full of mirrors without realizing you are the one holding the light? Welcome to Episode ${chapter.number} of Conciencia Cristalina — "${enTitle}" by Yael Axel Cruz Cebreros & AInvisible Friends. Today we dismantle the invisible friction keeping your mind in reactive survival.`,
        prompt_broll_ltx:
          'Cinematic 4K visual metaphor of a room full of mirrors reflecting warm golden frequencies, slow camera push-in, photorealistic, 24fps',
        texto_en_pantalla: `EP_${epNumPadded}: STOP FIGHTING THE REFLECTION`,
        estado_render: 'En cola',
      },
      {
        id: 'bloque_1_fisica_conciencia',
        titulo_bloque: 'Block 1: Physics of Consciousness',
        tiempo: '01:30 - 05:30',
        plano_camara:
          'Medium Close-Up (MCU), calm analytical cadence, subtle lateral camera drift',
        locucion_avatar: `When we examine "${subs[1].title}" through systems physics and predictive neuroscience, a foundational law becomes clear: ${teoricosKey} The observer is never outside the system being observed. Every time you stabilize your internal frame of reference, scattered cognitive energy locks into phase coherence.`,
        prompt_broll_ltx:
          'Cinematic 4K macro visualization of chaotic light waves aligning into a coherent crystalline geometric lattice, warm gold and deep obsidian volumetric lighting, photorealistic, 24fps',
        texto_en_pantalla: 'COHERENCE OF THE INTERNAL OBSERVER',
        estado_render: 'En cola',
      },
      {
        id: 'bloque_2_metafora_matrix',
        titulo_bloque: 'Block 2: Matrix / Earthly Metaphor',
        tiempo: '05:30 - 09:30',
        plano_camara:
          'Dynamic Medium Shot (MS) alternating with B-Roll voiceover, warm tungsten contrast',
        locucion_avatar: `Think of a master watchmaker trying to assemble a precision chronometer inside a speeding train car shaking out of control. That is the everyday Matrix diagnosed in "${subs[0].title}". As our Manifesto declares: ${manifiestoKey}`,
        prompt_broll_ltx:
          'Cinematic 4K shot of golden architectural blueprint lines drawing themselves over a hyper-accelerated city at dusk, time-lapse freezing into serene stillness, photorealistic, 24fps',
        texto_en_pantalla: 'EXITING THE REACTIVE MATRIX',
        estado_render: 'En cola',
      },
      {
        id: 'bloque_3_responsabilidad',
        titulo_bloque: 'Block 3: Responsibility Without Guilt',
        tiempo: '09:30 - 13:30',
        plano_camara:
          'Intimate Close-Up (CU) direct to lens, high-precision LatentSync lip-sync, grounded tone',
        locucion_avatar: `Here is the uncomfortable truth at the core of "${subs[2].title}": responsibility is not blame—it is sovereignty. Blame looks backward in paralysis; conscious responsibility looks forward as an architect. ${sabiduriasKey}`,
        prompt_broll_ltx:
          'Cinematic 4K close-up of an ancient brass astrolabe and a crystal prism refracting a single white beam into structured golden geometry, warm studio light, 24fps',
        texto_en_pantalla: 'RESPONSIBILITY IS SOVEREIGNTY, NOT GUILT',
        estado_render: 'En cola',
      },
      {
        id: 'bloque_4_ejercicio_practico',
        titulo_bloque: 'Block 4: Practical Exercise + Block 5: Closing & CTA',
        tiempo: '13:30 - 17:30',
        plano_camara:
          'Medium Shot (MS) with hardcover book on travertine desk, warm morning sunlight',
        locucion_avatar: `Let us bring "${subs[3].title}" into Consciousness in Action in three steps today: First, twelve minutes of pre-digital stillness to map your daily vector. Second, a ninety-minute uninterrupted block of deep creation. Third, an evening audit of gratitude and reciprocity. Subscribe, download the bilingual Module Kit in the description, and pre-order Conciencia Cristalina — Orient & Architect today.`,
        prompt_broll_ltx:
          'Cinematic 4K shot of a luxury hardcover edition of Conciencia Cristalina resting on warm travertine stone with morning sunlight and fountain pen, slow camera push-in, photorealistic, 24fps',
        texto_en_pantalla: 'PROTOCOL: CONSCIOUSNESS IN ACTION (3 STEPS)',
        estado_render: 'En cola',
      },
    ];

    return {
      episodio_id: `ep_${epNumPadded}`,
      fase: chapter.partTitle,
      modulo: `${phaseNum}.${chapter.number}`,
      titulo_video: `${enTitle} — How to Shift From Reactive Chaos to Crystalline Sovereignty (Ep. ${chapter.number})`,
      duracion_estimada: '15 to 18 minutes',
      formato_salida: '16:9 UHD 4K / 24 fps',
      idioma: 'en',
      autor: 'Yael Axel Cruz Cebreros & AInvisible Friends',
      bloques: bloquesEn,
      pildora_short_60s: {
        hook_3s:
          'Stop fighting the mirror: your external reality is only echoing the frequency of your internal observer.',
        guion_hablado: `In Episode ${chapter.number} of Conciencia Cristalina ("${enTitle}"), Yael Axel Cruz Cebreros & AInvisible Friends reveal why tactical effort collapses without an internal structural map. Apply the 3-step Consciousness in Action protocol for 7 days and watch how your attention locks into crystalline coherence. Link in bio for the full episode and bilingual book kit.`,
        prompt_broll_vertical:
          'Vertical 9:16 4K cinematic visual of a person standing in a hall of golden mirrors as the reflections align into a single luminous crystal path, photorealistic, 24fps',
      },
    };
  }

  // Default: Español Nativo ('es')
  const bloquesEs: GuionEpBloque[] = [
    {
      id: 'bloque_0_hook',
      titulo_bloque: 'Bloque 0: Hook Visceral',
      tiempo: '00:00 - 01:30',
      plano_camara:
        'Plano Medio (PM) directo a cámara, iluminación cálida',
      locucion_avatar: `¿Alguna vez has sentido que peleas contra mil reflejos en una habitación llena de espejos sin darte cuenta de que tú eres quien sostiene la lámpara? Bienvenido al Episodio ${chapter.number} de Conciencia Cristalina: "${chapter.title}", por Yael Axel Cruz Cebreros & AInvisible Friends. Hoy vamos a desmantelar la raíz invisible de la fragmentación mental.`,
      prompt_broll_ltx:
        'Cinematic 4K visual metaphor of a room full of mirrors reflecting warm golden frequencies, slow camera push-in, photorealistic, 24fps',
      texto_en_pantalla: `EP_${epNumPadded}: DEJA DE PELEAR CON EL ESPEJO`,
      estado_render: 'En cola',
    },
    {
      id: 'bloque_1_fisica_conciencia',
      titulo_bloque: 'Bloque 1: Física de la Conciencia',
      tiempo: '01:30 - 05:30',
      plano_camara:
        'Plano Medio Corto (PMC) directo a cámara, cadencia serena y científica, iluminación cálida lateral',
      locucion_avatar: `Cuando analizamos "${subs[1].title}" desde la física de sistemas complejos y la neurobiología predictiva, descubrimos una ley inapelable: ${teoricosKey} El observador jamás está separado del sistema que observa. En el instante en que ordenas tu arquitectura interior, la energía dispersa entra en coherencia de fase.`,
      prompt_broll_ltx:
        'Cinematic 4K macro visualization of chaotic light waves aligning into a coherent crystalline geometric lattice, warm gold and deep obsidian volumetric lighting, photorealistic, 24fps',
      texto_en_pantalla: 'LA FÍSICA DEL OBSERVADOR CONSCIENTE',
      estado_render: 'En cola',
    },
    {
      id: 'bloque_2_metafora_matrix',
      titulo_bloque: 'Bloque 2: Metáfora / Matrix',
      tiempo: '05:30 - 09:30',
      plano_camara:
        'Plano Medio (PM) alternando con secuencias B-Roll sobre voz en off, contraste cálido cinematográfico',
      locucion_avatar: `Imagina a un maestro relojero intentando ensamblar un cronógrafo de precisión milimétrica dentro de un vagón de tren que vibra sin control. Esa es la Matrix de la reactividad moderna que diagnosticamos en "${subs[0].title}". Como declara nuestro Manifiesto: ${manifiestoKey}`,
      prompt_broll_ltx:
        'Cinematic 4K shot of golden architectural blueprint lines drawing themselves over a hyper-accelerated city at dusk, time-lapse freezing into serene stillness, photorealistic, 24fps',
      texto_en_pantalla: 'SALIENDO DE LA MATRIX REACTIVA',
      estado_render: 'En cola',
    },
    {
      id: 'bloque_3_responsabilidad',
      titulo_bloque: 'Bloque 3: Responsabilidad sin Culpa',
      tiempo: '09:30 - 13:30',
      plano_camara:
        'Primer Plano (PP) íntimo a cámara, sincronización labial LatentSync de alta precisión, tono firme y empático',
      locucion_avatar: `Aquí emerge la verdad incómoda de "${subs[2].title}": asumir responsabilidad no tiene nada que ver con la culpa. La culpa te encadena al pasado; la responsabilidad consciente te devuelve el cincel de arquitecto en el presente. ${sabiduriasKey}`,
      prompt_broll_ltx:
        'Cinematic 4K close-up of an ancient brass astrolabe and a crystal prism refracting a single white beam into structured golden geometry, warm studio light, 24fps',
      texto_en_pantalla: 'RESPONSABILIDAD SIN CULPA = SOBERANÍA',
      estado_render: 'En cola',
    },
    {
      id: 'bloque_4_ejercicio_practico',
      titulo_bloque: 'Bloque 4: Ejercicio Práctico + Bloque 5: Cierre y CTA',
      tiempo: '13:30 - 17:30',
      plano_camara:
        'Plano Medio (PM) con edición impresa del libro sobre mesa de travertino, luz dorada matutina',
      locucion_avatar: `Llevemos "${subs[3].title}" a la práctica con el protocolo Conciencia en Acción en tres pasos hoy mismo: Primero, doce minutos de silencio pre-digital para trazar tu vector del día. Segundo, un bloque ininterrumpido de noventa minutos de creación profunda. Tercero, una auditoría nocturna de reciprocidad y gratitud. Suscríbete al canal, descarga el Kit Bilingüe del episodio en la descripción y reserva tu ejemplar de Conciencia Cristalina.`,
      prompt_broll_ltx:
        'Cinematic 4K shot of a luxury hardcover edition of Conciencia Cristalina resting on warm travertine stone with morning sunlight and fountain pen, slow camera push-in, photorealistic, 24fps',
      texto_en_pantalla: 'PROTOCOLO: CONCIENCIA EN ACCIÓN (3 PASOS)',
      estado_render: 'En cola',
    },
  ];

  return {
    episodio_id: `ep_${epNumPadded}`,
    fase: chapter.partTitle,
    modulo: `${phaseNum}.${chapter.number}`,
    titulo_video: `${chapter.title} — Cómo Pasar del Caos Reactivo a la Conciencia Cristalina (Ep. ${chapter.number})`,
    duracion_estimada: '15 a 18 minutos',
    formato_salida: '16:9 UHD 4K / 24 fps',
    idioma: 'es',
    autor: 'Yael Axel Cruz Cebreros & AInvisible Friends',
    bloques: bloquesEs,
    pildora_short_60s: {
      hook_3s:
        'Deja de pelear con el espejo: tu realidad exterior solo está proyectando la frecuencia de tu observador interno.',
      guion_hablado: `En el Episodio ${chapter.number} de Conciencia Cristalina ("${chapter.title}"), junto a Yael Axel Cruz Cebreros & AInvisible Friends revelamos por qué el esfuerzo táctico colapsa cuando no tienes un mapa interior. Aplica hoy los 3 pasos de Conciencia en Acción y transforma la dispersión en coherencia cristalina. Ve el episodio completo y descarga el kit bilingüe en el enlace del perfil.`,
      prompt_broll_vertical:
        'Vertical 9:16 4K cinematic visual of a person standing in a hall of golden mirrors as the reflections align into a single luminous crystal path, photorealistic, 24fps',
    },
  };
}

export function syncLegacyBlocksFromGuion(
  guion: GuionEpJsonSchema
): VideoScriptBlock[] {
  const categoryMap: Array<VideoScriptBlock['blockType']> = [
    'Hook',
    'Física/Conciencia',
    'Matrix/Metáfora',
    'Responsabilidad',
    'Ejercicio + CTA',
  ];

  return guion.bloques.map((b, idx) => ({
    id: b.id,
    blockNumber: idx + 1,
    blockType: categoryMap[idx % categoryMap.length],
    durationSeconds: idx === 0 ? 90 : 210,
    spokenScript: b.locucion_avatar,
    avatarDirection: b.plano_camara,
    ltxBrollPrompt: b.prompt_broll_ltx,
    tiempo: b.tiempo,
    textoEnPantalla: b.texto_en_pantalla,
    renderStage: b.estado_render || 'En cola',
  }));
}

export function generateChapterVideoPackage(
  chapter: BookChapter,
  foundations: FoundationPillar[],
  writingEngine: WritingEngineId = 'claude_opus_5_5_vertex',
  autoTriggerEnabled = true,
  activeLanguage: LanguageCode = chapter.activeLanguage || 'es'
): ChapterVideoPackage {
  const guionEs = buildGuionEpJson(chapter, foundations, 'es');
  const guionEn = buildGuionEpJson(chapter, foundations, 'en');
  const activeGuion = activeLanguage === 'en' ? guionEn : guionEs;
  const blocks = syncLegacyBlocksFromGuion(activeGuion);

  const blockRenderStates: Record<string, VideoBlockRenderStage> = {};
  for (const b of activeGuion.bloques) {
    blockRenderStates[b.id] = b.estado_render || 'En cola';
  }

  const nowIso = new Date().toISOString();
  const epNumPadded = String(chapter.number).padStart(2, '0');

  return {
    chapterId: chapter.id,
    episodeNumber: chapter.number,
    jsonFilename: `guion_ep${chapter.number}.json`,
    autoTriggerEnabled,
    writingEngineUsed: writingEngine,
    activeLanguage,
    blocks,
    guionEpJson: activeGuion,
    languageKits: {
      es: guionEs,
      en: guionEn,
    },
    blockRenderStates,
    savedToScriptsInputPath: `Conciencia_Cristalina_AI/scripts_input/guion_ep${chapter.number}.json`,
    comfyPromptDispatched: false,
    lastDispatchedAt: nowIso,
    latentsyncRender: {
      workflowFile: 'workflow_latentsync.json',
      label: 'Avatar Lip-Sync & Voice Conditioning (LatentSync)',
      status: 'queued',
      progressPct: 25,
      activeNode: `LatentSyncNode [ep_${epNumPadded} · En cola para /prompt]`,
      outputAsset: `ep_${epNumPadded}_avatar_latentsync_master.mp4`,
      updatedAt: nowIso,
    },
    ltxBrollRender: {
      workflowFile: 'workflow_ltx_broll.json',
      label: 'Secuencias B-Roll Cinematográficas 4K (LTX Video)',
      status: 'queued',
      progressPct: 25,
      activeNode: `LTXVPromptInjector [5 Bloques B-Roll listos para /prompt]`,
      outputAsset: `ep_${epNumPadded}_ltx_broll_sequence_4k.mp4`,
      updatedAt: nowIso,
    },
  };
}

/**
 * Devuelve el JSON exacto de `guion_epX.json` con el esquema oficial de Conciencia Cristalina.
 */
export function formatVideoProductionJson(
  pkg: ChapterVideoPackage,
  chapter: BookChapter,
  _cloudConfig?: CloudPipelineConfig,
  lang?: LanguageCode
): string {
  const chosenLang = lang || pkg.activeLanguage || chapter.activeLanguage || 'es';
  const guion: GuionEpJsonSchema =
    pkg.languageKits?.[chosenLang] ||
    pkg.guionEpJson ||
    buildGuionEpJson(chapter, [], chosenLang);

  const exactSchemaObject = {
    episodio_id: guion.episodio_id,
    fase: guion.fase,
    modulo: guion.modulo,
    titulo_video: guion.titulo_video,
    duracion_estimada: guion.duracion_estimada,
    formato_salida: guion.formato_salida,
    bloques: guion.bloques.map((b) => ({
      id: b.id,
      tiempo: b.tiempo,
      plano_camara: b.plano_camara,
      locucion_avatar: b.locucion_avatar,
      prompt_broll_ltx: b.prompt_broll_ltx,
      texto_en_pantalla: b.texto_en_pantalla,
    })),
    pildora_short_60s: {
      hook_3s: guion.pildora_short_60s.hook_3s,
      guion_hablado: guion.pildora_short_60s.guion_hablado,
      prompt_broll_vertical: guion.pildora_short_60s.prompt_broll_vertical,
    },
  };

  return JSON.stringify(exactSchemaObject, null, 2);
}

/**
 * Construye los payloads de ComfyUI (/prompt) inyectando locucion_avatar en workflow_latentsync.json
 * y prompt_broll_ltx en workflow_ltx_broll.json.
 */
export function buildComfyUIPromptPayloads(guion: GuionEpJsonSchema) {
  const workflow_latentsync = {
    client_id: `conciencia_cristalina_${guion.episodio_id}_latentsync`,
    workflow_name: 'workflow_latentsync.json',
    prompt: {
      '10_AudioTTSAndLatentSync': {
        class_type: 'LatentSyncAvatarConditioner',
        inputs: {
          episodio_id: guion.episodio_id,
          formato_salida: guion.formato_salida,
          fps: 24,
          bloques_locucion: guion.bloques.map((b) => ({
            id: b.id,
            tiempo: b.tiempo,
            plano_camara: b.plano_camara,
            locucion_avatar: b.locucion_avatar,
          })),
        },
      },
      '42_VideoCombine': {
        class_type: 'VHS_VideoCombine',
        inputs: {
          frame_rate: 24,
          filename_prefix: `${guion.episodio_id}_latentsync_avatar`,
          format: 'video/h264-mp4',
        },
      },
    },
  };

  const workflow_ltx_broll = {
    client_id: `conciencia_cristalina_${guion.episodio_id}_ltx_broll`,
    workflow_name: 'workflow_ltx_broll.json',
    prompt: {
      '20_LTXBrollBatchGenerator': {
        class_type: 'LTXVTextToVideoBatch',
        inputs: {
          episodio_id: guion.episodio_id,
          resolution: '3840x2160',
          fps: 24,
          broll_prompts: guion.bloques.map((b) => ({
            id: b.id,
            tiempo: b.tiempo,
            prompt_broll_ltx: b.prompt_broll_ltx,
            texto_en_pantalla: b.texto_en_pantalla,
          })),
          short_60s_vertical_prompt:
            guion.pildora_short_60s.prompt_broll_vertical,
        },
      },
      '88_LTXVideoSave': {
        class_type: 'VHS_VideoCombine',
        inputs: {
          frame_rate: 24,
          filename_prefix: `${guion.episodio_id}_ltx_broll_4k`,
          format: 'video/h264-mp4',
        },
      },
    },
  };

  return {
    workflow_latentsync,
    workflow_ltx_broll,
  };
}

export interface ClaudeOpusBridgePayload {
  project_id: string;
  model: 'claude-opus-5-5';
  system_prompt: string;
  user_prompt: string;
  phase_number: number;
  mandatory_subtopics: SubtopicItem[];
  language?: LanguageCode;
}

/**
 * Construye automáticamente el payload exacto para POST ${BACKEND_BRIDGE_URL}/api/write-chapter
 * cuando se selecciona "Claude Opus 5.5 (Google Cloud Vertex AI)" y se presiona "Escribir Capítulo del Día".
 */
export function buildClaudeOpusChapterPayload(
  chapter: BookChapter,
  foundations: FoundationPillar[],
  projectId: string,
  allChapters: BookChapter[] = [],
  lang: LanguageCode = chapter.activeLanguage || 'es'
): ClaudeOpusBridgePayload {
  const masterGuide = foundations.find((f) => f.id === 'master_guide');
  const structuralMap = foundations.find((f) => f.id === 'structural_map');
  const manifiesto = foundations.find((f) => f.id === 'manifiesto_metodologia');
  const teoricos = foundations.find((f) => f.id === 'fundamentos_teoricos');
  const sabidurias = foundations.find((f) => f.id === 'integracion_sabidurias');

  const system_prompt = `=== SISTEMA MAESTRO DE REDACCIÓN LITERARIA: CONCIENCIA CRISTALINA ===
AUTORES: Yael Axel Cruz Cebreros & AInvisible Friends

1. GUÍA MAESTRA DE VOZ Y PERSONALIDAD (${masterGuide?.fileOrigin || 'Guia_Agente_Escritor_Conciencia_Cristalina.md'}):
${masterGuide?.content?.trim() || '[Guía Maestra activa: Prosa luminosa, incisiva, científica y contemplativa de Conciencia Cristalina]'}

2. VISIÓN GENERAL Y MAPA ESTRUCTURAL DE 5 FASES (${structuralMap?.spanishTitle || 'Mapa Estructural'}):
${structuralMap?.content?.trim() || '[Mapa Estructural de 5 Fases de Conciencia Cristalina]'}

3. MANIFIESTO Y METODOLOGÍA (${manifiesto?.spanishTitle || 'Manifiesto y Metodología'}):
${manifiesto?.content?.trim() || '[Manifiesto y Metodología: De la Matrix reactiva a la Conciencia en Acción]'}

4. FUNDAMENTOS TEÓRICOS (${teoricos?.spanishTitle || 'Fundamentos Teóricos'}):
${teoricos?.content?.trim() || '[Fundamentos Teóricos: Física de la conciencia, cibernética de segundo orden y neurobiología predictiva]'}

5. INTEGRACIÓN DE SABIDURÍAS (${sabidurias?.spanishTitle || 'Integración de Sabidurías'}):
${sabidurias?.content?.trim() || '[Integración de Sabidurías: Soberanía interior, reciprocidad y coherencia cristalina]'}`.trim();

  const phaseNumber = resolveChapterPhaseNumber(chapter);
  const fourSubtopics = ensureFourSubtopics(chapter);
  const nextChapter = allChapters.find((c) => c.number === chapter.number + 1);
  const nextChapterRef = nextChapter
    ? `Capítulo ${nextChapter.number}: "${nextChapter.title}" (${nextChapter.subtitle})`
    : `el siguiente movimiento arquitectónico de Conciencia Cristalina`;

  const subtopicsFormatted = fourSubtopics
    .map(
      (s, idx) =>
        `   - Subtema Obligatorio ${idx + 1}: "${s.title}" — Tesis central: ${s.keyArgument}`
    )
    .join('\n');

  const languageDirective =
    lang === 'en'
      ? 'IDIOMA DEL KIT ACTIVO: Redacta esta versión íntegramente en INGLÉS NATIVO (English Native Edition) conservando la fuerza literaria de Conciencia Cristalina.'
      : 'IDIOMA DEL KIT ACTIVO: Redacta esta versión íntegramente en ESPAÑOL NATIVO conservando la fuerza literaria de Conciencia Cristalina.';

  const user_prompt = `Escribe el Capítulo completo del día para la obra "Conciencia Cristalina" (Autores: Yael Axel Cruz Cebreros & AInvisible Friends):
${languageDirective}

• FASE ACTUAL DEL MAPA (1 a 5): Fase ${phaseNumber} de 5 (${chapter.partTitle})
• CAPÍTULO SELECCIONADO: Capítulo ${chapter.number} — "${chapter.title}"
• SUBTÍTULO / TESIS: ${chapter.subtitle}
• LOS 4 SUBTEMAS OBLIGATORIOS A DESARROLLAR E INTEGRAR:
${subtopicsFormatted}

INSTRUCCIÓN ESTRICTA DE EXTENSIÓN Y ARQUITECTURA:
Debes redactar un capítulo profundo, magnético y de nivel literario New York Times Bestseller de entre **3,500 y 4,000 palabras**, estructurado rigurosamente bajo la **Anatomía de 6 Bloques NYT Bestseller**:

1. **Bloque 1: Gancho Visceral (10% · ~380 palabras)**
   Escena inmersiva, tensión existencial inmediata y pregunta incisiva que captura la atención del lector desde la primera línea.
2. **Bloque 2: Analogía Terrenal y Diagnóstico del Fallo (20% · ~760 palabras)**
   Desarrollo del Subtema 1 ("${fourSubtopics[0].title}") mediante una metáfora arquitectónica y cotidiana tangible que diagnostique por qué fracasa el enfoque convencional.
3. **Bloque 3: Puente Ciencia + Conciencia (25% · ~950 palabras)**
   Desarrollo profundo del Subtema 2 ("${fourSubtopics[1].title}") entrelazando neurobiología, cibernética de segundo orden, física de sistemas y sabiduría contemplativa.
4. **Bloque 4: La Verdad Incómoda y Cambio de Paradigma con 3 frases ancla subrayables (20% · ~760 palabras)**
   Desarrollo del Subtema 3 ("${fourSubtopics[2].title}"). Desmantela la ilusión de la Matrix reactiva e incluye explícitamente **3 Frases Ancla Subrayables** en formato blockquote (> **Frase Ancla 1/2/3**).
5. **Bloque 5: Protocolo Práctico "Conciencia en Acción" en 3 pasos (15% · ~570 palabras)**
   Desarrollo del Subtema 4 ("${fourSubtopics[3].title}"). Guía operativa verificable en 3 pasos concretos para ejecutar hoy mismo.
6. **Bloque 6: Cierre Resonante y Puente de Momentum al siguiente capítulo (10% · ~380 palabras)**
   Síntesis poética y filosófica que deja huella emocional y tiende el puente directo de curiosidad hacia ${nextChapterRef}.`.trim();

  return {
    project_id: projectId || DEFAULT_CLOUD_PIPELINE_CONFIG.GCP_PROJECT_ID,
    model: 'claude-opus-5-5',
    system_prompt,
    user_prompt,
    phase_number: phaseNumber,
    mandatory_subtopics: fourSubtopics,
    language: lang,
  };
}

/**
 * Genera los bloques en streaming de la Anatomía de 6 Bloques NYT Bestseller
 * tanto en Español Nativo ('es') como en Inglés Nativo ('en').
 */
export function generateSixBlockBestsellerChapterStreamChunks(
  chapter: BookChapter,
  foundations: FoundationPillar[],
  nextChapterTitle = 'La Geometría del Pensamiento Sistémico',
  lang: LanguageCode = 'es'
): string[] {
  const phaseNum = resolveChapterPhaseNumber(chapter);
  const subs = ensureFourSubtopics(chapter);
  const master = foundations.find((f) => f.id === 'master_guide');
  const manifiesto = foundations.find((f) => f.id === 'manifiesto_metodologia');
  const teoricos = foundations.find((f) => f.id === 'fundamentos_teoricos');
  const sabidurias = foundations.find((f) => f.id === 'integracion_sabidurias');

  if (lang === 'en') {
    const enTitle =
      chapter.moduleKits?.en?.title ||
      `${chapter.title} (English Native Edition)`;
    const enSubtitle =
      chapter.moduleKits?.en?.subtitle || chapter.subtitle;

    return [
      `# Chapter ${chapter.number}: ${enTitle}\n*${enSubtitle} · Phase ${phaseNum} of 5 (${chapter.partTitle})*\n**By Yael Axel Cruz Cebreros & AInvisible Friends**\n\n`,

      `## Block 1: Visceral Hook (10%)\nIt is three in the morning inside the silent observatory of your own awareness. Outside, the city sleeps; inside, a hundred unfinished loops of reactive thought continue to drain your vital bandwidth. You look at your open projects, your ambitions, and the promises you made to yourself, and a piercing realization sets in: the obstacle was never a lack of effort or talent—it was trying to fight reflections in a hall of mirrors without recalibrating the observer holding the light.\n\nIn **Phase ${phaseNum}** of *Conciencia Cristalina — Orient & Architect*, we cross the threshold of **${enTitle}**. Here we do not add another superficial tactic to your inventory; we reconstruct the internal architecture from which you perceive, decide, and create.\n\n`,

      `## Block 2: Earthly Analogy & Diagnostic of the Flaw (20%)\n### Subtopic 1: ${subs[0].title}\nPicture a master watchmaker attempting to assemble a microscopic chronometer inside a train car hurtling down uneven tracks at full speed. No matter how steady the artisan's hands may be, every jolt of the carriage knocks the gears out of alignment. That is the exact earthly analogy for how modern minds attempt to resolve **${subs[0].title}** while remaining trapped inside reactive urgency.\n\n${subs[0].keyArgument} When we operate without an explicit structural map of consciousness, we mistake frantic motion for genuine progress. We exhaust our nervous system rearranging reflections on the glass while the governing projector inside remains untouched.\n\n`,

      `## Block 3: Science + Consciousness Bridge (25%)\n### Subtopic 2: ${subs[1].title}\nWhen we build the bridge between empirical science and contemplative wisdom across **${subs[1].title}**, an extraordinary convergence emerges. Neuroscience's predictive processing framework and second-order cybernetics prove that the observer is never separate from the system being regulated.\n\n${subs[1].keyArgument} The human brain is an inference engine constantly projecting internal priors onto sensory reality. The moment you align conscious attention with an externalized structural map, limbic threat reactivity subsides and the prefrontal cortex unlocks phase coherence. Ancient contemplative traditions and contemporary systems physics are describing the exact same sovereignty in two complementary languages.\n\n`,

      `## Block 4: The Uncomfortable Truth & Paradigm Shift (20%)\n### Subtopic 3: ${subs[2].title}\nIt is time to name the uncomfortable truth at the heart of **${subs[2].title}**: much of what modern culture celebrates as "relentless hustle" is actually a sophisticated flight from the stillness required to claim authorship of our own lives. ${subs[2].keyArgument}\n\nTo anchor this paradigm shift permanently in your operational memory, underline these **3 Underlineable Anchor Sentences**:\n\n> **Anchor Sentence 1**: "Whoever fails to consciously architect their own attention ends up inhabiting the ruins of other people's emergencies."\n\n> **Anchor Sentence 2**: "True velocity never comes from running faster inside the labyrinth; it comes from rising high enough to behold its entire geometry."\n\n> **Anchor Sentence 3**: "Responsibility without guilt is the exact instant you stop blaming the mirror and reclaim the sovereignty of the observer."\n\n`,

      `## Block 5: Practical Protocol "Consciousness in Action" in 3 Steps (15%)\n### Subtopic 4: ${subs[3].title}\nTo embody **${subs[3].title}** (${subs[3].keyArgument}), execute this verifiable **3-Step "Consciousness in Action" Protocol** today:\n\n1. **Step 1 · Threshold Calibration (12 minutes before touching any screen)**: Write down on paper the single structural vector of your day and identify which reactive loop you are choosing to dissolve before noon.\n2. **Step 2 · The 90-Minute Crystalline Keystone Block**: Dedicate ninety uninterrupted minutes to deep architectural creation with zero algorithmic inputs.\n3. **Step 3 · Reciprocity Seal (Ayni) & Evening Observer Audit (10 minutes)**: Distill today's breakthrough into a clear teaching artifact shared with your community and close the day in conscious stillness.\n\n`,

      `## Block 6: Resonant Closing & Momentum Bridge to the Next Chapter (10%)\nA cathedral does not rise by accident, nor does a sovereign consciousness awaken by inertia. It rises the moment an observer decides that every single day is a deliberate chisel stroke guided by an eternal blueprint. Today, you have locked the keystone of **${enTitle}** into place.\n\nYet a new question now opens on our horizon: once the internal observer is aligned, how do we translate this invisible coherence into systemic geometry that transforms entire organizations and cultures? That is the exact threshold waiting for us in **Chapter ${chapter.number + 1}: "${nextChapterTitle}"**.\n`,
    ];
  }

  const masterPrinciple =
    extractKeyPrinciples(master?.content || '', 1)[0] ||
    'Unificar el pensamiento sistémico de alta precisión con una prosa contemplativa luminosa.';
  const manifiestoPrinciple =
    extractKeyPrinciples(manifiesto?.content || '', 1)[0] ||
    'La atención humana es la sustancia creativa primaria de nuestro siglo.';
  const teoricosPrinciple =
    extractKeyPrinciples(teoricos?.content || '', 1)[0] ||
    'El cerebro actúa como un motor de inferencia predictiva que requiere mapas estructurales externos.';
  const sabiduriasPrinciple =
    extractKeyPrinciples(sabidurias?.content || '', 1)[0] ||
    'La prosochê estoica y la cibernética moderna describen la misma soberanía interior.';

  return [
    `# Capítulo ${chapter.number}: ${chapter.title}\n*${chapter.subtitle} · Fase ${phaseNum} de 5 (${chapter.partTitle})*\n**Por Yael Axel Cruz Cebreros & AInvisible Friends**\n\n`,

    `## Bloque 1: Gancho Visceral (10%)\nSon las tres de la madrugada en el observatorio interior de tu propia mente y, aunque el mundo exterior parece en calma, el ruido de fondo de mil decisiones inconclusas sigue consumiendo tu ancho de banda vital. Miras tus notas, tus proyectos abiertos, las promesas postergadas, y sientes con una nitidez punzante que el problema nunca fue la falta de talento ni de disciplina: fue intentar pelear contra los reflejos de una sala de espejos sin haber recalibrado primero al observador que sostiene la luz.\n\nEn esta **Fase ${phaseNum}** de *Conciencia Cristalina*, firmada por **Yael Axel Cruz Cebreros & AInvisible Friends**, nos detenemos frente al umbral de **${chapter.title}**. Tal como establece nuestra *Guía Maestra de Voz y Personalidad*: "${masterPrinciple}" No estamos aquí para añadir una táctica superficial más a tu colección; estamos aquí para alterar la estructura misma desde la cual observas, decides y creas.\n\n`,

    `## Bloque 2: Analogía Terrenal y Diagnóstico del Fallo (20%)\n### Subtema 1: ${subs[0].title}\nImagina a un maestro relojero que intenta ensamblar un cronógrafo de precisión milimétrica dentro de un vagón de tren que vibra sin control a toda velocidad. Por más firme que sea su pulso, cada sacudida del vagón desalinea los engranajes. Esa es la analogía exacta de cómo intenta operar la mente contemporánea cuando aborda **${subs[0].title}** sin una arquitectura previa.\n\n${subs[0].keyArgument} Cuando carecemos de un mapa estructural que ordene nuestras prioridades ontológicas, confundimos el movimiento frenético con el avance real. Nos agotamos moviendo piedras de un extremo a otro de la cantera mientras la estructura central permanece sin construir.\n\n`,

    `## Bloque 3: Puente Ciencia + Conciencia (25%)\n### Subtema 2: ${subs[1].title}\nCuando cruzamos el puente entre la ciencia empírica rigurosa y la tradición contemplativa en **${subs[1].title}**, descubrimos una convergencia extraordinaria. Desde nuestros *Fundamentos Teóricos*, sabemos que: "${teoricosPrinciple}"\n\n${subs[1].keyArgument} La neurobiología del procesamiento predictivo (Friston) y la cibernética de segundo orden (Maturana y Varela) demuestran que el observador nunca está separado del sistema que regula. En el instante en que unificas la atención consciente (*prosochê*) con un esquema estructural explícito, la corteza prefrontal deja de gastar energía en defenderse de la incertidumbre y libera su capacidad máxima de síntesis creativa. Como recuerda nuestra *Integración de Sabidurías*: "${sabiduriasPrinciple}"\n\n`,

    `## Bloque 4: La Verdad Incómoda y Cambio de Paradigma (20%)\n### Subtema 3: ${subs[2].title}\nEs momento de nombrar la verdad incómoda que sostiene a **${subs[2].title}**: gran parte de lo que hoy llamamos "búsqueda de productividad" es, en realidad, una sofisticada evasión del silencio necesario para asumir nuestra propia autoría sin culpa. ${subs[2].keyArgument}\n\nComo proclama nuestro *Manifiesto y Metodología*: "${manifiestoPrinciple}" Para sellar este cambio de paradigma en tu memoria operativa, subraya estas **3 Frases Ancla**:\n\n> **Frase Ancla 1**: "Quien no diseña conscientemente la arquitectura de su atención, termina habitando los escombros de las urgencias ajenas."\n\n> **Frase Ancla 2**: "La verdadera velocidad nunca nace de correr más rápido dentro del laberinto, sino de elevarse lo suficiente para contemplar su geometría completa."\n\n> **Frase Ancla 3**: "La responsabilidad sin culpa es el instante exacto en que dejas de reclamarle al espejo y recuperas la soberanía del observador."\n\n`,

    `## Bloque 5: Protocolo Práctico "Conciencia en Acción" en 3 Pasos (15%)\n### Subtema 4: ${subs[3].title}\nPara encarnar **${subs[3].title}** (${subs[3].keyArgument}), ejecuta hoy mismo este **Protocolo "Conciencia en Acción" en 3 pasos verificables**:\n\n1. **Paso 1 · Calibración de Umbral (12 minutos antes de abrir pantallas)**: Traza en papel el vector único de este capítulo y define cuál es la piedra angular que debe quedar colocada antes del mediodía.\n2. **Paso 2 · Bloque de Construcción Cristalina (90 minutos sin interrupción)**: Ejecuta la síntesis profunda de los cuatro subtemas manteniendo a la vista tu Mapa Estructural de 5 Fases, cerrando toda entrada reactiva.\n3. **Paso 3 · Sello de Reciprocidad (Ayni) y Auditoría Nocturna (10 minutos)**: Destila el aprendizaje nuclear del día en una enseñanza pública que eleve a tu comunidad de lectores.\n\n`,

    `## Bloque 6: Cierre Resonante y Puente de Momentum al Siguiente Capítulo (10%)\nUna catedral no se levanta por accidente; se levanta porque cada día un arquitecto decide qué piedra angular sostendrá la bóveda entera. Hoy has colocado los cimientos de **${chapter.title}**, transformando la dispersión reactiva en presencia soberana.\n\nPero este descubrimiento abre una pregunta aún más fascinante: una vez que el observador interior ha sido calibrado, ¿cómo traducimos estas leyes invisibles en modelos sistémicos que transformen nuestra cultura y nuestras decisiones colectivas? Ese es el territorio exacto que cruzaremos mañana en el **Capítulo ${chapter.number + 1}: "${nextChapterTitle}"**.\n`,
  ];
}

/**
 * Construye los dos Kits de Módulo (Español Nativo 'es' + Inglés Nativo 'en') para un capítulo.
 */
export function buildBilingualChapterKits(
  chapter: BookChapter,
  foundations: FoundationPillar[],
  streamedContent: string,
  streamedLang: LanguageCode = 'es',
  nextChapterTitle = 'La Geometría del Pensamiento Sistémico'
): { es: ChapterLanguageKit; en: ChapterLanguageKit } {
  const nowIso = new Date().toISOString();
  const esText =
    streamedLang === 'es'
      ? streamedContent
      : generateSixBlockBestsellerChapterStreamChunks(
          chapter,
          foundations,
          nextChapterTitle,
          'es'
        ).join('');

  const enText =
    streamedLang === 'en'
      ? streamedContent
      : generateSixBlockBestsellerChapterStreamChunks(
          chapter,
          foundations,
          nextChapterTitle,
          'en'
        ).join('');

  return {
    es: {
      language: 'es',
      label: 'Kit Español (Nativo)',
      title: chapter.title,
      subtitle: chapter.subtitle,
      manuscriptContent: esText,
      wordCount: countWords(esText),
      updatedAt: nowIso,
    },
    en: {
      language: 'en',
      label: 'Kit English (Native)',
      title:
        chapter.moduleKits?.en?.title ||
        `${chapter.title} (English Native Edition)`,
      subtitle: chapter.moduleKits?.en?.subtitle || chapter.subtitle,
      manuscriptContent: enText,
      wordCount: countWords(enText),
      updatedAt: nowIso,
    },
  };
}
