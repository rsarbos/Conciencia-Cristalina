import React, { useEffect, useState } from 'react';
import {
  BookChapter,
  ChapterVideoPackage,
  CloudPipelineConfig,
  FoundationId,
  FoundationPillar,
  LanguageCode,
  SubtopicItem,
  WritingEngineId,
} from '../types/book';
import {
  buildBilingualChapterKits,
  buildClaudeOpusChapterPayload,
  buildGuionEpJson,
  countWords,
  DEFAULT_CLOUD_PIPELINE_CONFIG,
  ensureFourSubtopics,
  generateChapterVideoPackage,
  resolveChapterPhaseNumber,
} from '../utils/bookLogic';
import { VideoProductionPanel } from './VideoProductionPanel';
import {
  Sparkles,
  CheckCircle2,
  BookmarkCheck,
  Plus,
  Share2,
  BookOpen,
  FileCheck,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Save,
  Code2,
  Radio,
  Globe,
} from 'lucide-react';

interface DailyChapterStudioProps {
  bookTitle: string;
  chapters: BookChapter[];
  foundations: FoundationPillar[];
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onUpdateChapter: (updated: BookChapter) => void;
  onAddChapter: (newChapter: BookChapter) => void;
  onSaveToManuscript: (chapterId: string) => void;
  onGenerateSocialForChapter: (
    chapter: BookChapter,
    options?: { stayOnCurrentTab?: boolean }
  ) => Promise<void>;
  videoPackages: Record<string, ChapterVideoPackage>;
  onUpdateVideoPackage: (chapterId: string, pkg: ChapterVideoPackage) => void;
}

const CLOUD_CONFIG_STORAGE_KEY = 'conciencia_cristalina_cloud_pipeline_v1';
const WRITING_ENGINE_STORAGE_KEY = 'conciencia_cristalina_writing_engine_v1';

const FIVE_PHASES_OPTIONS = [
  'Fase 1 · El Despertar y la Deconstrucción del Ego',
  'Fase 2 · Física de la Conciencia y el Espejo Interior',
  'Fase 3 · Salida de la Matrix Reactiva y Soberanía',
  'Fase 4 · Responsabilidad sin Culpa y Coherencia',
  'Fase 5 · Conciencia Cristalina en Acción y Legado',
];

export const DailyChapterStudio: React.FC<DailyChapterStudioProps> = ({
  bookTitle,
  chapters,
  foundations,
  selectedChapterId,
  onSelectChapter,
  onUpdateChapter,
  onAddChapter,
  onSaveToManuscript,
  onGenerateSocialForChapter,
  videoPackages,
  onUpdateVideoPackage,
}) => {
  const activeChapter =
    chapters.find((c) => c.id === selectedChapterId) || chapters[0];

  // 1. Writing Engine state (Default: Claude Opus 5.5 (Google Cloud Vertex AI))
  const [writingEngine, setWritingEngine] = useState<WritingEngineId>(() => {
    try {
      const saved = localStorage.getItem(WRITING_ENGINE_STORAGE_KEY);
      if (saved === 'claude_opus_5_5_vertex' || saved === 'gemini_4_argon') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'claude_opus_5_5_vertex';
  });

  // 2. Google Cloud & Video Pipeline Connection state persisted in localStorage
  const [cloudConfig, setCloudConfig] = useState<CloudPipelineConfig>(() => {
    try {
      const raw = localStorage.getItem(CLOUD_CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          GCP_PROJECT_ID:
            parsed.GCP_PROJECT_ID || DEFAULT_CLOUD_PIPELINE_CONFIG.GCP_PROJECT_ID,
          BACKEND_BRIDGE_URL:
            parsed.BACKEND_BRIDGE_URL ||
            DEFAULT_CLOUD_PIPELINE_CONFIG.BACKEND_BRIDGE_URL,
          COMFYUI_TUNNEL_URL:
            parsed.COMFYUI_TUNNEL_URL ||
            DEFAULT_CLOUD_PIPELINE_CONFIG.COMFYUI_TUNNEL_URL,
          DRIVE_FOLDER_ID:
            parsed.DRIVE_FOLDER_ID ?? DEFAULT_CLOUD_PIPELINE_CONFIG.DRIVE_FOLDER_ID,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CLOUD_PIPELINE_CONFIG;
  });

  const [isCloudDrawerOpen, setIsCloudDrawerOpen] = useState<boolean>(true);
  const [isPayloadInspectorOpen, setIsPayloadInspectorOpen] =
    useState<boolean>(false);
  const [autoTriggerVideo, setAutoTriggerVideo] = useState<boolean>(true);
  const [videoPipelineTriggerCount, setVideoPipelineTriggerCount] =
    useState<number>(0);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isStreamingLive, setIsStreamingLive] = useState(false);
  const [streamChunksReceived, setStreamChunksReceived] = useState(0);
  const [synthesizingSubtopic, setSynthesizingSubtopic] = useState<string | null>(
    null
  );
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [activeFoundationTab, setActiveFoundationTab] =
    useState<FoundationId>('master_guide');
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');
  const [newSubtopicArg, setNewSubtopicArg] = useState('');
  const [showNewChapterForm, setShowNewChapterForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterSubtitle, setNewChapterSubtitle] = useState('');
  const [studioStatusMsg, setStudioStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(WRITING_ENGINE_STORAGE_KEY, writingEngine);
    } catch {
      // ignore
    }
  }, [writingEngine]);

  const handleSaveCloudConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem(CLOUD_CONFIG_STORAGE_KEY, JSON.stringify(cloudConfig));
      localStorage.setItem('GCP_PROJECT_ID', cloudConfig.GCP_PROJECT_ID);
      localStorage.setItem('BACKEND_BRIDGE_URL', cloudConfig.BACKEND_BRIDGE_URL);
      localStorage.setItem('COMFYUI_TUNNEL_URL', cloudConfig.COMFYUI_TUNNEL_URL);
      localStorage.setItem('DRIVE_FOLDER_ID', cloudConfig.DRIVE_FOLDER_ID);
      setStudioStatusMsg(
        `Conexión Google Cloud & Video Pipeline guardada en localStorage (GCP: ${cloudConfig.GCP_PROJECT_ID} · Bridge: ${cloudConfig.BACKEND_BRIDGE_URL}).`
      );
    } catch {
      setStudioStatusMsg('No se pudo guardar en localStorage.');
    }
  };

  if (!activeChapter) {
    return null;
  }

  const activeLang: LanguageCode = activeChapter.activeLanguage || 'es';

  // Switch between Spanish Native Kit ('es') and English Native Kit ('en')
  const handleSwitchChapterLanguageKit = (lang: LanguageCode) => {
    const existingKits = activeChapter.moduleKits || {
      es: {
        language: 'es',
        label: 'Kit Español (Nativo)',
        title: activeChapter.title,
        subtitle: activeChapter.subtitle,
        manuscriptContent:
          activeLang === 'es' ? activeChapter.manuscriptContent : '',
        wordCount:
          activeLang === 'es' ? countWords(activeChapter.manuscriptContent) : 0,
      },
      en: {
        language: 'en',
        label: 'Kit English (Native)',
        title: `${activeChapter.title} (English Native Edition)`,
        subtitle: activeChapter.subtitle,
        manuscriptContent:
          activeLang === 'en' ? activeChapter.manuscriptContent : '',
        wordCount:
          activeLang === 'en' ? countWords(activeChapter.manuscriptContent) : 0,
      },
    };

    // Save current editor text into current language kit before switching
    const updatedCurrentKit = {
      ...existingKits[activeLang],
      manuscriptContent: activeChapter.manuscriptContent,
      wordCount: countWords(activeChapter.manuscriptContent),
    };

    const nextKits = {
      ...existingKits,
      [activeLang]: updatedCurrentKit,
    };

    const targetKit = nextKits[lang];

    onUpdateChapter({
      ...activeChapter,
      activeLanguage: lang,
      manuscriptContent: targetKit.manuscriptContent,
      moduleKits: nextKits,
    });
  };

  // Ensure a videoPackage is always available for the active chapter
  const activeVideoPackage: ChapterVideoPackage =
    videoPackages[activeChapter.id] ||
    generateChapterVideoPackage(
      activeChapter,
      foundations,
      writingEngine,
      autoTriggerVideo,
      activeLang
    );

  // Automatic Payload Construction for Claude Opus 5.5
  const claudeOpusPayload = buildClaudeOpusChapterPayload(
    activeChapter,
    foundations,
    cloudConfig.GCP_PROJECT_ID,
    chapters,
    activeLang
  );
  const currentPhaseNum = resolveChapterPhaseNumber(activeChapter);
  const mandatoryFourSubtopics = ensureFourSubtopics(activeChapter);

  const currentWords = countWords(activeChapter.manuscriptContent);
  const targetWords = activeChapter.targetWordCount || 3800;
  const wordGoalPct = Math.min(
    100,
    Math.round((currentWords / targetWords) * 100)
  );

  const esKitWords = countWords(
    activeChapter.moduleKits?.es?.manuscriptContent ||
      (activeLang === 'es' ? activeChapter.manuscriptContent : '')
  );
  const enKitWords = countWords(
    activeChapter.moduleKits?.en?.manuscriptContent ||
      (activeLang === 'en' ? activeChapter.manuscriptContent : '')
  );

  const engineLabel =
    writingEngine === 'claude_opus_5_5_vertex'
      ? 'Claude Opus 5.5 (Google Cloud Vertex AI)'
      : 'Gemini 4 Argon';

  /**
   * Implementación de `triggerVideoPipeline(chapterData)`:
   * 1. Genera `guion_epX.json` con los 5 bloques escénicos y `pildora_short_60s` en Español e Inglés.
   * 2. Envía `POST` a `${BACKEND_BRIDGE_URL}/api/trigger-video` (con espejo en `/api/trigger-video`)
   *    guardando `guion_epX.json` en `Conciencia_Cristalina_AI/scripts_input` e inyectando
   *    `workflow_latentsync.json` y `workflow_ltx_broll.json` en ComfyUI `/prompt`.
   * 3. Activa la progresión en tiempo real en la Pestaña 3.
   */
  const triggerVideoPipeline = async (
    chapterData: BookChapter
  ): Promise<ChapterVideoPackage> => {
    const guionEs = buildGuionEpJson(chapterData, foundations, 'es');
    const guionEn = buildGuionEpJson(chapterData, foundations, 'en');
    const chosenLang = chapterData.activeLanguage || activeLang;
    const activeGuion = chosenLang === 'en' ? guionEn : guionEs;

    try {
      const response = await fetch('/api/trigger-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: chapterData,
          foundations,
          guion_ep: activeGuion,
          guion_ep_es: guionEs,
          guion_ep_en: guionEn,
          comfyui_tunnel_url: cloudConfig.COMFYUI_TUNNEL_URL,
          drive_folder_id: cloudConfig.DRIVE_FOLDER_ID || 'ConcienciaCristalina',
          backend_bridge_url: cloudConfig.BACKEND_BRIDGE_URL,
          writingEngine,
          autoTriggerEnabled: autoTriggerVideo,
          activeLanguage: chosenLang,
        }),
      });
      const data = await response.json();
      if (data.videoPackage) {
        onUpdateVideoPackage(chapterData.id, data.videoPackage);
        setVideoPipelineTriggerCount((c) => c + 1);
        return data.videoPackage;
      }
    } catch {
      // Fallback to local deterministic generator
    }
    const fallbackPkg = generateChapterVideoPackage(
      chapterData,
      foundations,
      writingEngine,
      autoTriggerVideo,
      chosenLang
    );
    onUpdateVideoPackage(chapterData.id, fallbackPkg);
    setVideoPipelineTriggerCount((c) => c + 1);
    return fallbackPkg;
  };

  // Stream Chapter from Claude Opus 5.5 Bridge (POST ${BACKEND_BRIDGE_URL}/api/write-chapter)
  const handleWriteDailyChapterWithClaudeStream = async () => {
    setIsSynthesizing(true);
    setIsStreamingLive(true);
    setStreamChunksReceived(0);
    setStudioStatusMsg(
      `Conectando en streaming con ${cloudConfig.BACKEND_BRIDGE_URL.replace(/\/$/, '')}/api/write-chapter (model: "claude-opus-5-5", Fase ${currentPhaseNum}, Kits ES + EN)...`
    );

    const payload = buildClaudeOpusChapterPayload(
      activeChapter,
      foundations,
      cloudConfig.GCP_PROJECT_ID,
      chapters,
      activeLang
    );

    const cleanBridgeBase = (
      cloudConfig.BACKEND_BRIDGE_URL || 'http://localhost:8000'
    )
      .trim()
      .replace(/\/$/, '');
    const externalEndpoint = `${cleanBridgeBase}/api/write-chapter`;

    let response: Response | null = null;

    const isSameOrigin =
      typeof window !== 'undefined' &&
      cleanBridgeBase === window.location.origin;

    if (isSameOrigin) {
      response = await fetch(externalEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/json, text/plain',
        },
        body: JSON.stringify({
          ...payload,
          chapter: activeChapter,
          foundations,
          language: activeLang,
        }),
      });
    } else {
      response = await fetch('/api/write-chapter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          ...payload,
          bridge_url: externalEndpoint,
          chapter: activeChapter,
          foundations,
          language: activeLang,
        }),
      });
    }

    if (!response.ok || !response.body) {
      throw new Error('Failed to open streaming connection to /api/write-chapter');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedManuscript = '';
    let sseBuffer = '';
    let chunkCounter = 0;

    const appendLiveChunk = (deltaText: string) => {
      if (!deltaText) return;
      accumulatedManuscript += deltaText;
      chunkCounter += 1;
      setStreamChunksReceived(chunkCounter);
      onUpdateChapter({
        ...activeChapter,
        manuscriptContent: accumulatedManuscript,
        status: 'drafting',
      });
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const decoded = decoder.decode(value, { stream: true });

      if (decoded.includes('data:') || sseBuffer.length > 0) {
        sseBuffer += decoded;
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() || '';

        for (const evt of events) {
          const lines = evt.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const rawData = trimmed.slice(5).trim();
            if (!rawData || rawData === '[DONE]') continue;
            try {
              const parsed = JSON.parse(rawData);
              const delta =
                parsed.text ??
                parsed.chunk ??
                parsed.content ??
                parsed.delta ??
                '';
              if (typeof delta === 'string') {
                appendLiveChunk(delta);
              }
            } catch {
              appendLiveChunk(rawData);
            }
          }
        }
      } else {
        appendLiveChunk(decoded);
      }
    }

    const finalManuscript = accumulatedManuscript.trim();
    const completedSubtopics = mandatoryFourSubtopics.map((s) => ({
      ...s,
      completed: true,
    }));
    const savedTimestamp = new Date().toISOString();

    // Build both Bilingual Module Kits (Español Nativo 'es' + English Native 'en')
    const nextCh = chapters.find((c) => c.number === activeChapter.number + 1);
    const bilingualKits = buildBilingualChapterKits(
      activeChapter,
      foundations,
      finalManuscript,
      activeLang,
      nextCh?.title || 'La Geometría del Pensamiento Sistémico'
    );

    // Step 2a: Automatically save the chapter and its 2 Module Kits (ES + EN) in the Final Manuscript state
    const completedChapter: BookChapter = {
      ...activeChapter,
      targetWordCount: Math.max(activeChapter.targetWordCount || 3800, 3800),
      manuscriptContent: finalManuscript,
      status: 'saved_to_manuscript',
      savedAt: savedTimestamp,
      subtopics: completedSubtopics,
      activeLanguage: activeLang,
      moduleKits: bilingualKits,
    };

    onUpdateChapter(completedChapter);
    onSaveToManuscript(completedChapter.id);

    // Step 2b: Automatically trigger generation of Social Media Posts
    setIsGeneratingSocial(true);
    try {
      await onGenerateSocialForChapter(completedChapter, {
        stayOnCurrentTab: true,
      });
    } finally {
      setIsGeneratingSocial(false);
    }

    // Step 2c: If "Auto-disparar Pipeline de Video" is active, immediately invoke triggerVideoPipeline(chapterData)
    let videoNote = '';
    if (autoTriggerVideo) {
      const pkg = await triggerVideoPipeline(completedChapter);
      videoNote = ` · triggerVideoPipeline ejecutado (${pkg.jsonFilename} en ES + EN enviado a /api/trigger-video y ComfyUI /prompt)`;
    }

    const finalWordCount = countWords(finalManuscript);
    setStudioStatusMsg(
      `Stream completado con Claude Opus 5.5 (${finalWordCount.toLocaleString()} palabras · 2 Kits de Módulo generados: Español Nativo + Inglés Nativo) · Guardado en Manuscrito Final · Posts Sociales creados${videoNote}.`
    );
  };

  const handleSynthesizeDraft = async (subtopicFocus?: string) => {
    if (subtopicFocus) {
      setSynthesizingSubtopic(subtopicFocus);
      setStudioStatusMsg(null);
      try {
        const response = await fetch('/api/editorial/draft-chapter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapter: activeChapter,
            foundations,
            subtopicFocus,
            bookTitle,
            writingEngine,
          }),
        });
        const data = await response.json();
        if (data.manuscriptContent) {
          const nextContent = activeChapter.manuscriptContent.trim()
            ? `${activeChapter.manuscriptContent.trim()}\n\n${data.manuscriptContent}`
            : data.manuscriptContent;

          const updatedSubtopics = activeChapter.subtopics.map((s) =>
            s.title === subtopicFocus ? { ...s, completed: true } : s
          );

          const updatedChapter: BookChapter = {
            ...activeChapter,
            manuscriptContent: nextContent,
            status:
              activeChapter.status === 'saved_to_manuscript'
                ? 'saved_to_manuscript'
                : 'drafting',
            subtopics: updatedSubtopics,
          };
          onUpdateChapter(updatedChapter);
          setStudioStatusMsg(
            `Subtema "${subtopicFocus}" expandido e integrado con ${engineLabel}.`
          );
        }
      } catch (error) {
        console.error('Failed to expand subtopic:', error);
        setStudioStatusMsg('No se pudo expandir el subtema.');
      } finally {
        setSynthesizingSubtopic(null);
      }
      return;
    }

    if (writingEngine === 'claude_opus_5_5_vertex') {
      try {
        await handleWriteDailyChapterWithClaudeStream();
      } catch (err) {
        console.error('Error streaming from Claude Opus 5.5 bridge:', err);
        setStudioStatusMsg(
          'Error al conectar con el puente de Claude Opus 5.5. Intenta nuevamente.'
        );
      } finally {
        setIsSynthesizing(false);
        setIsStreamingLive(false);
      }
      return;
    }

    // Gemini 4 Argon path
    setIsSynthesizing(true);
    setStudioStatusMsg(null);
    try {
      const response = await fetch('/api/editorial/draft-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: activeChapter,
          foundations,
          bookTitle,
          writingEngine,
        }),
      });
      const data = await response.json();
      if (data.manuscriptContent) {
        const updatedSubtopics = activeChapter.subtopics.map((s) => ({
          ...s,
          completed: true,
        }));
        const bilingualKits = buildBilingualChapterKits(
          activeChapter,
          foundations,
          data.manuscriptContent,
          activeLang
        );
        const updatedChapter: BookChapter = {
          ...activeChapter,
          manuscriptContent: data.manuscriptContent,
          status: 'saved_to_manuscript',
          savedAt: new Date().toISOString(),
          subtopics: updatedSubtopics,
          moduleKits: bilingualKits,
        };
        onUpdateChapter(updatedChapter);
        onSaveToManuscript(updatedChapter.id);
        await onGenerateSocialForChapter(updatedChapter, {
          stayOnCurrentTab: true,
        });
        if (autoTriggerVideo) {
          await triggerVideoPipeline(updatedChapter);
        }
        setStudioStatusMsg(
          `Capítulo ${activeChapter.number} redactado con ${engineLabel} (Kits ES + EN), guardado en el Manuscrito Final y sincronizado con redes sociales.`
        );
      }
    } catch (error) {
      console.error('Failed to synthesize chapter:', error);
      setStudioStatusMsg('Could not reach synthesis service. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCompleteAndSaveChapter = async () => {
    onSaveToManuscript(activeChapter.id);
    if (autoTriggerVideo) {
      const freshPkg = await triggerVideoPipeline(activeChapter);
      setStudioStatusMsg(
        `Capítulo ${activeChapter.number} ("${activeChapter.title}") guardado en el Manuscrito Final y triggerVideoPipeline ejecutado (${freshPkg.jsonFilename} en ES + EN).`
      );
    } else {
      setStudioStatusMsg(
        `Capítulo ${activeChapter.number} ("${activeChapter.title}") guardado en el Manuscrito Final.`
      );
    }
  };

  const handleToggleSubtopic = (subId: string) => {
    const updated = activeChapter.subtopics.map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    onUpdateChapter({ ...activeChapter, subtopics: updated });
  };

  const handleAddSubtopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtopicTitle.trim()) return;
    const newSub: SubtopicItem = {
      id: `${activeChapter.id}-sub-${Date.now()}`,
      title: newSubtopicTitle.trim(),
      completed: false,
      keyArgument:
        newSubtopicArg.trim() ||
        'Integrar fundamento teórico y protocolo práctico Conciencia en Acción.',
      targetWords: 950,
    };
    onUpdateChapter({
      ...activeChapter,
      subtopics: [...activeChapter.subtopics, newSub],
    });
    setNewSubtopicTitle('');
    setNewSubtopicArg('');
  };

  const handleCreateNewChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    const nextNum = chapters.length + 1;
    const titleClean = newChapterTitle.trim();
    const subClean =
      newChapterSubtitle.trim() ||
      'Síntesis de Metodología, Fundamentos Teóricos e Integración de Sabidurías';
    const created: BookChapter = {
      id: `ch-${Date.now()}`,
      number: nextNum,
      partTitle:
        FIVE_PHASES_OPTIONS[(nextNum - 1) % FIVE_PHASES_OPTIONS.length],
      title: titleClean,
      subtitle: subClean,
      scheduledDay: nextNum,
      targetWordCount: 3800,
      manuscriptContent: '',
      editorialNotes: `Programado para el Día ${nextNum} (Kits ES + EN).`,
      status: 'queued',
      activeLanguage: 'es',
      wisdomPillarsUsed: [
        'master_guide',
        'structural_map',
        'manifiesto_metodologia',
        'fundamentos_teoricos',
        'integracion_sabidurias',
      ],
      subtopics: [
        {
          id: `ch-${Date.now()}-sub-1`,
          title: 'Diagnóstico del Espejo y Alineación con las 5 Fases',
          completed: false,
          keyArgument: 'Anclar la tesis del capítulo en la Visión General.',
          targetWords: 950,
        },
        {
          id: `ch-${Date.now()}-sub-2`,
          title: 'Puente Física de la Conciencia + Neurobiología',
          completed: false,
          keyArgument: 'Integrar Fundamentos Teóricos con sabiduría contemplativa.',
          targetWords: 950,
        },
        {
          id: `ch-${Date.now()}-sub-3`,
          title: 'La Verdad Incómoda: Responsabilidad sin Culpa',
          completed: false,
          keyArgument: 'Establecer las 3 frases ancla subrayables del capítulo.',
          targetWords: 950,
        },
        {
          id: `ch-${Date.now()}-sub-4`,
          title: 'Protocolo Conciencia en Acción en 3 Pasos',
          completed: false,
          keyArgument: 'Traducir la teoría en un protocolo práctico de 3 pasos.',
          targetWords: 950,
        },
      ],
      moduleKits: {
        es: {
          language: 'es',
          label: 'Kit Español (Nativo)',
          title: titleClean,
          subtitle: subClean,
          manuscriptContent: '',
          wordCount: 0,
        },
        en: {
          language: 'en',
          label: 'Kit English (Native)',
          title: `${titleClean} (English Native Edition)`,
          subtitle: subClean,
          manuscriptContent: '',
          wordCount: 0,
        },
      },
    };
    onAddChapter(created);
    onSelectChapter(created.id);
    setNewChapterTitle('');
    setNewChapterSubtitle('');
    setShowNewChapterForm(false);
  };

  const handleTriggerSocialGeneration = async () => {
    setIsGeneratingSocial(true);
    try {
      await onGenerateSocialForChapter(activeChapter);
    } finally {
      setIsGeneratingSocial(false);
    }
  };

  const activeFoundation =
    foundations.find((f) => f.id === activeFoundationTab) || foundations[0];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <p className="text-xs font-medium text-amber-900">
            02 · Conciencia Cristalina · Yael Axel Cruz Cebreros &amp; AInvisible Friends · Fase {currentPhaseNum} de 5 · Capítulo {activeChapter.number}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1 text-balance">
            Daily Chapter Writing Desk &amp; Bilingual Video Pipeline (ES / EN)
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Genera automáticamente 2 Kits de Módulo por capítulo y video (Español Nativo + Inglés Nativo), guarda en el Manuscrito Final y ejecuta <code className="font-mono-tabular text-stone-900">triggerVideoPipeline(chapterData)</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSynthesizeDraft()}
            disabled={isSynthesizing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-900 text-amber-50 rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {isSynthesizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {isSynthesizing
                ? isStreamingLive
                  ? `Escribiendo en vivo (${streamChunksReceived} bloques)...`
                  : 'Escribiendo Capítulo del Día...'
                : 'Escribir Capítulo del Día'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCompleteAndSaveChapter}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Save Chapter to Manuscript</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerSocialGeneration}
            disabled={isGeneratingSocial}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            {isGeneratingSocial ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>Create Chapter Social Posts</span>
          </button>
        </div>
      </div>

      {/* MODULE 1: CONFIGURADOR DEL MOTOR DE ESCRITURA & CONEXIÓN GOOGLE CLOUD / VIDEO PIPELINE */}
      <section
        aria-label="Configurador del Motor de Escritura y Conexión Google Cloud"
        className="bg-white border border-stone-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Writing Engine Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <label
              htmlFor="writing-engine-select"
              className="text-xs font-semibold text-stone-900 whitespace-nowrap shrink-0"
            >
              Writing Engine (Motor de Escritura):
            </label>
            <select
              id="writing-engine-select"
              aria-label="Writing Engine"
              value={writingEngine}
              onChange={(e) =>
                setWritingEngine(e.target.value as WritingEngineId)
              }
              className="rounded-lg border border-stone-300 bg-[#FBF9F5] px-3.5 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-900 max-w-md w-full"
            >
              <option value="claude_opus_5_5_vertex">
                Claude Opus 5.5 (Google Cloud Vertex AI)
              </option>
              <option value="gemini_4_argon">
                Gemini 4 Argon
              </option>
            </select>
            <span className="text-xs text-stone-500">
              {writingEngine === 'claude_opus_5_5_vertex'
                ? 'POST streaming a /api/write-chapter (model: "claude-opus-5-5" · 3,500–4,000 palabras · 6 Bloques NYT).'
                : 'Optimizado para auditoría de continuidad, posts sociales y analítica de marketing.'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              aria-expanded={isPayloadInspectorOpen}
              onClick={() => setIsPayloadInspectorOpen(!isPayloadInspectorOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#FBF9F5] text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-900" />
              <span>Payload Claude Opus 5.5 (6 Bloques)</span>
              {isPayloadInspectorOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              aria-expanded={isCloudDrawerOpen}
              onClick={() => setIsCloudDrawerOpen(!isCloudDrawerOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-[#FBF9F5] text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-900" />
              <span>Conexión Google Cloud &amp; Video Pipeline</span>
              {isCloudDrawerOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Bar: Conexión Google Cloud & Video Pipeline */}
        {isCloudDrawerOpen && (
          <form
            onSubmit={handleSaveCloudConfig}
            className="pt-4 border-t border-stone-200 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold text-amber-900">
                Conexión Google Cloud &amp; Video Pipeline (Persistencia en localStorage)
              </h2>
              <span className="text-[11px] text-stone-500 font-mono-tabular">
                Bridge: {cloudConfig.BACKEND_BRIDGE_URL.replace(/\/$/, '')}/api/write-chapter &amp; /api/trigger-video
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="input-gcp-project-id"
                  className="block text-[11px] font-semibold text-stone-700 mb-1 font-mono-tabular"
                >
                  GCP_PROJECT_ID
                </label>
                <input
                  id="input-gcp-project-id"
                  type="text"
                  value={cloudConfig.GCP_PROJECT_ID}
                  onChange={(e) =>
                    setCloudConfig({
                      ...cloudConfig,
                      GCP_PROJECT_ID: e.target.value,
                    })
                  }
                  placeholder="mi-proyecto-gcp-vertex"
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs font-mono-tabular text-stone-900 focus:outline-none focus:border-stone-900"
                />
                <span className="block text-[10px] text-stone-500 mt-1">
                  ID de proyecto de Google Cloud (Vertex AI)
                </span>
              </div>

              <div>
                <label
                  htmlFor="input-backend-bridge-url"
                  className="block text-[11px] font-semibold text-stone-700 mb-1 font-mono-tabular"
                >
                  BACKEND_BRIDGE_URL
                </label>
                <input
                  id="input-backend-bridge-url"
                  type="text"
                  value={cloudConfig.BACKEND_BRIDGE_URL}
                  onChange={(e) =>
                    setCloudConfig({
                      ...cloudConfig,
                      BACKEND_BRIDGE_URL: e.target.value,
                    })
                  }
                  placeholder="http://localhost:8000"
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs font-mono-tabular text-stone-900 focus:outline-none focus:border-stone-900"
                />
                <span className="block text-[10px] text-stone-500 mt-1">
                  Por defecto: http://localhost:8000 o URL Cloud Run
                </span>
              </div>

              <div>
                <label
                  htmlFor="input-comfyui-tunnel-url"
                  className="block text-[11px] font-semibold text-stone-700 mb-1 font-mono-tabular"
                >
                  COMFYUI_TUNNEL_URL
                </label>
                <input
                  id="input-comfyui-tunnel-url"
                  type="text"
                  value={cloudConfig.COMFYUI_TUNNEL_URL}
                  onChange={(e) =>
                    setCloudConfig({
                      ...cloudConfig,
                      COMFYUI_TUNNEL_URL: e.target.value,
                    })
                  }
                  placeholder="https://xxxx.trycloudflare.com"
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs font-mono-tabular text-stone-900 focus:outline-none focus:border-stone-900"
                />
                <span className="block text-[10px] text-stone-500 mt-1">
                  URL trycloudflare.com de tu Google Colab GPU
                </span>
              </div>

              <div>
                <label
                  htmlFor="input-drive-folder-id"
                  className="block text-[11px] font-semibold text-stone-700 mb-1 font-mono-tabular"
                >
                  DRIVE_FOLDER_ID (Opcional)
                </label>
                <input
                  id="input-drive-folder-id"
                  type="text"
                  value={cloudConfig.DRIVE_FOLDER_ID}
                  onChange={(e) =>
                    setCloudConfig({
                      ...cloudConfig,
                      DRIVE_FOLDER_ID: e.target.value,
                    })
                  }
                  placeholder="ConcienciaCristalina"
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs font-mono-tabular text-stone-900 focus:outline-none focus:border-stone-900"
                />
                <span className="block text-[10px] text-stone-500 mt-1">
                  Carpeta Google Drive ConcienciaCristalina
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Conexión en localStorage</span>
              </button>
            </div>
          </form>
        )}

        {/* Collapsible Inspector: Automatic Payload Construction */}
        {isPayloadInspectorOpen && (
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-stone-900">
                  Payload Automático para POST {cloudConfig.BACKEND_BRIDGE_URL.replace(/\/$/, '')}/api/write-chapter
                </h3>
                <p className="text-[11px] text-stone-500">
                  Combina Guía_Agente_Escritor_Conciencia_Cristalina.md + Visión General + Manifiesto + Metodología + Fundamentos Teóricos en system_prompt e inyecta Fase {currentPhaseNum}, Capítulo {activeChapter.number}, 4 subtemas obligatorios y la Anatomía de 6 Bloques NYT Bestseller (3,500–4,000 palabras).
                </p>
              </div>
              <span className="text-[11px] font-mono-tabular text-amber-900 font-semibold">
                model: &quot;{claudeOpusPayload.model}&quot; · project_id: &quot;{claudeOpusPayload.project_id}&quot;
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-semibold text-stone-700 mb-1 font-mono-tabular">
                  system_prompt (Guía Maestra + Visión General + Manifiesto + Metodología + Fundamentos)
                </div>
                <pre className="p-3 rounded-lg bg-[#FBF9F5] border border-stone-200 text-[11px] text-stone-800 font-mono-tabular whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                  {claudeOpusPayload.system_prompt}
                </pre>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-stone-700 mb-1 font-mono-tabular">
                  user_prompt (Fase {currentPhaseNum} · Cap. {activeChapter.number} · 4 Subtemas · 6 Bloques NYT Bestseller)
                </div>
                <pre className="p-3 rounded-lg bg-[#FBF9F5] border border-stone-200 text-[11px] text-stone-800 font-mono-tabular whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                  {claudeOpusPayload.user_prompt}
                </pre>
              </div>
            </div>
          </div>
        )}
      </section>

      {studioStatusMsg && (
        <div
          role="status"
          className="px-4 py-3 bg-stone-900 text-stone-50 text-xs rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{studioStatusMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setStudioStatusMsg(null)}
            className="text-stone-300 hover:text-white underline ml-4 whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </div>
      )}

      {/* 12-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 3 Columns: Daily Chapter Schedule Queue */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-stone-600">
              Capítulos del Libro ({chapters.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowNewChapterForm(!showNewChapterForm)}
              className="text-xs font-medium text-amber-900 hover:underline whitespace-nowrap shrink-0"
            >
              {showNewChapterForm ? 'Cancelar' : '+ Nuevo Capítulo'}
            </button>
          </div>

          {showNewChapterForm && (
            <form
              onSubmit={handleCreateNewChapter}
              className="p-3.5 bg-white border border-stone-300 rounded-xl space-y-2.5"
            >
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Título del Capítulo..."
                aria-label="New chapter title"
                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-md focus:outline-none focus:border-stone-900"
              />
              <input
                type="text"
                value={newChapterSubtitle}
                onChange={(e) => setNewChapterSubtitle(e.target.value)}
                placeholder="Subtítulo / Tesis..."
                aria-label="New chapter subtitle"
                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-md focus:outline-none focus:border-stone-900"
              />
              <button
                type="submit"
                className="w-full py-1.5 text-xs font-medium bg-stone-900 text-white rounded-md hover:bg-stone-800"
              >
                Agregar Capítulo (Kits ES + EN)
              </button>
            </form>
          )}

          <div className="space-y-2">
            {chapters.map((ch) => {
              const isSelected = ch.id === activeChapter.id;
              const chWords = countWords(ch.manuscriptContent);
              const doneSubs = ch.subtopics.filter((s) => s.completed).length;
              const phaseNum = resolveChapterPhaseNumber(ch);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onSelectChapter(ch.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-white border-stone-900 shadow-xs'
                      : 'bg-[#F5F2EB]/70 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono-tabular">
                    <span>
                      Fase {phaseNum} · Cap. {ch.number}
                    </span>
                    <span
                      className={
                        ch.status === 'saved_to_manuscript'
                          ? 'text-emerald-800 font-medium'
                          : 'text-stone-500'
                      }
                    >
                      {ch.status === 'saved_to_manuscript'
                        ? 'Saved (ES/EN)'
                        : ch.status === 'drafting'
                        ? 'Drafting'
                        : 'Ready'}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-stone-900 mt-1 line-clamp-1">
                    {ch.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-stone-500 font-mono-tabular">
                    <span>{chWords.toLocaleString()} words</span>
                    <span>
                      {doneSubs}/{ch.subtopics.length} subtemas
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center 6 Columns: Active Chapter Subtopics Checklist & Manuscript Editor */}
        <div className="lg:col-span-6 space-y-5">
          {/* Chapter Metadata, Bilingual Kit Switcher & Subtopics Box */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
            {/* Bilingual Module Kit Selector (Español Nativo + English Native) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
              <div
                role="group"
                aria-label="Selector de Kit de Módulo del Capítulo"
                className="inline-flex items-center p-1 rounded-lg bg-[#F5F2EB] border border-stone-300 text-xs font-medium"
              >
                <button
                  type="button"
                  onClick={() => handleSwitchChapterLanguageKit('es')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                    activeLang === 'es'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Kit Módulo Español (Nativo) · {esKitWords} w</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchChapterLanguageKit('en')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                    activeLang === 'en'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Kit Módulo Inglés (Native) · {enKitWords} w</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono-tabular text-stone-600">
                <span>
                  {currentWords.toLocaleString()} /{' '}
                  {targetWords.toLocaleString()} words ({wordGoalPct}%)
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    activeChapter.status === 'saved_to_manuscript'
                      ? 'text-emerald-800 font-semibold'
                      : 'text-amber-900 font-medium'
                  }
                >
                  {activeChapter.status === 'saved_to_manuscript'
                    ? 'Saved in Final Manuscript'
                    : 'Working Chapter Draft'}
                </span>
              </div>
            </div>

            {/* Easy-to-edit Chapter Phase, Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Fase del Mapa (1 a 5)
                </label>
                <select
                  aria-label="Fase del Capítulo"
                  value={activeChapter.partTitle}
                  onChange={(e) =>
                    onUpdateChapter({
                      ...activeChapter,
                      partTitle: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-2.5 py-1.5 text-xs font-medium text-stone-900"
                >
                  {FIVE_PHASES_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  {!FIVE_PHASES_OPTIONS.includes(activeChapter.partTitle) && (
                    <option value={activeChapter.partTitle}>
                      {activeChapter.partTitle}
                    </option>
                  )}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Título del Capítulo {activeChapter.number}
                </label>
                <input
                  type="text"
                  value={activeChapter.title}
                  onChange={(e) =>
                    onUpdateChapter({
                      ...activeChapter,
                      title: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-2.5 py-1.5 text-xs font-semibold text-stone-900"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Subtítulo / Tesis Central
                </label>
                <input
                  type="text"
                  value={activeChapter.subtitle}
                  onChange={(e) =>
                    onUpdateChapter({
                      ...activeChapter,
                      subtitle: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-2.5 py-1.5 text-xs text-stone-800"
                />
              </div>
            </div>

            {/* 6-Block NYT Bestseller Anatomy Reference Bar */}
            <div className="p-3 rounded-lg bg-[#FBF9F5] border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-stone-900">
                  Anatomía Estricta de 6 Bloques NYT Bestseller (Meta: 3,500 a 4,000 palabras · ES + EN)
                </span>
                <span className="font-mono-tabular text-amber-900">
                  Claude Opus 5.5 Stream
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] text-stone-600 font-mono-tabular">
                <div>1. Gancho Visceral (10%)</div>
                <div>2. Analogía y Fallo (20%)</div>
                <div>3. Ciencia + Conciencia (25%)</div>
                <div>4. Verdad + 3 Anclas (20%)</div>
                <div>5. Conciencia en Acción (15%)</div>
                <div>6. Cierre y Puente (10%)</div>
              </div>
            </div>

            {/* Word Progress Bar */}
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-900 transition-all duration-200"
                style={{ width: `${wordGoalPct}%` }}
              />
            </div>

            {/* Subtopics Checklist with per-subtopic AI Expander */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-stone-700">
                  4 Subtemas Obligatorios del Capítulo ({activeChapter.subtopics.filter((s) => s.completed).length}/
                  {activeChapter.subtopics.length} Completados)
                </h3>
                <span className="text-[11px] text-stone-500">
                  Engine: {engineLabel}
                </span>
              </div>

              <div className="space-y-2">
                {activeChapter.subtopics.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-lg border border-stone-200 bg-[#FBF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtopic(sub.id)}
                        className="mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                      />
                      <div>
                        <div className="text-xs font-semibold text-stone-900">
                          <span className="font-mono-tabular text-amber-900 mr-1">
                            {activeChapter.number}.{idx + 1}
                          </span>
                          {sub.title}
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          {sub.keyArgument}
                        </p>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleSynthesizeDraft(sub.title)}
                      disabled={synthesizingSubtopic === sub.title || isSynthesizing}
                      className="px-2.5 py-1.5 text-[11px] font-medium bg-white text-stone-800 border border-stone-300 rounded-md hover:bg-stone-100 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {synthesizingSubtopic === sub.title
                        ? 'Expanding...'
                        : 'Expand Subtopic'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Subtopic inline */}
              <form
                onSubmit={handleAddSubtopic}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={newSubtopicTitle}
                  onChange={(e) => setNewSubtopicTitle(e.target.value)}
                  placeholder="Agregar subtema..."
                  aria-label="Subtopic title"
                  className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                />
                <input
                  type="text"
                  value={newSubtopicArg}
                  onChange={(e) => setNewSubtopicArg(e.target.value)}
                  placeholder="Tesis o argumento clave..."
                  aria-label="Subtopic key argument"
                  className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-stone-100 text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-200 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtopic</span>
                </button>
              </form>
            </div>
          </div>

          {/* Manuscript Prose Editor */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="chapter-manuscript-editor"
                className="text-xs font-semibold text-stone-700 flex items-center gap-2"
              >
                <span>
                  Chapter {activeChapter.number} Manuscript Prose ({activeLang === 'es' ? 'Kit Español Nativo' : 'Kit English Native'} · {engineLabel})
                </span>
                {isStreamingLive && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono-tabular text-amber-900">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Streaming SSE en vivo...</span>
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2 text-xs font-mono-tabular text-stone-500">
                <span>{currentWords.toLocaleString()} words</span>
                <span aria-hidden="true">·</span>
                <span>~{Math.max(1, Math.round(currentWords / 275))} pages</span>
              </div>
            </div>

            <textarea
              id="chapter-manuscript-editor"
              rows={18}
              value={activeChapter.manuscriptContent}
              onChange={(e) => {
                const val = e.target.value;
                const existingKits = activeChapter.moduleKits || {
                  es: {
                    language: 'es',
                    label: 'Kit Español (Nativo)',
                    title: activeChapter.title,
                    subtitle: activeChapter.subtitle,
                    manuscriptContent: '',
                    wordCount: 0,
                  },
                  en: {
                    language: 'en',
                    label: 'Kit English (Native)',
                    title: `${activeChapter.title} (English Native Edition)`,
                    subtitle: activeChapter.subtitle,
                    manuscriptContent: '',
                    wordCount: 0,
                  },
                };
                onUpdateChapter({
                  ...activeChapter,
                  manuscriptContent: val,
                  status:
                    activeChapter.status === 'saved_to_manuscript'
                      ? 'saved_to_manuscript'
                      : 'drafting',
                  moduleKits: {
                    ...existingKits,
                    [activeLang]: {
                      ...existingKits[activeLang],
                      manuscriptContent: val,
                      wordCount: countWords(val),
                    },
                  },
                });
              }}
              placeholder={`Presiona "Escribir Capítulo del Día" para conectar en streaming con Claude Opus 5.5 y redactar el Capítulo ${activeChapter.number}: ${activeChapter.title} (genera automáticamente el Kit Español Nativo + Kit Inglés Nativo en 6 Bloques NYT Bestseller)...`}
              className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] p-4 text-sm text-stone-900 leading-relaxed focus:outline-none focus:border-stone-900"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-stone-500">
                {activeChapter.savedAt
                  ? `Guardado en el Manuscrito Final (Kits ES + EN · DOCX/MD/PDF): ${new Date(
                      activeChapter.savedAt
                    ).toLocaleTimeString()}`
                  : 'Pendiente de guardar en el Manuscrito Final.'}
              </span>
              <button
                type="button"
                onClick={handleCompleteAndSaveChapter}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Chapter Towards Final Manuscript</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 3 Columns: Live Foundational Pillars Reference Drawer */}
        <div className="lg:col-span-3 bg-white border border-stone-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
            <BookOpen className="w-4 h-4 text-amber-900 shrink-0" />
            <div>
              <h2 className="text-xs font-semibold text-stone-900">
                Foundations Reference Compass
              </h2>
              <p className="text-[11px] text-stone-500">
                Inyectados en system_prompt de Claude Opus 5.5
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {foundations.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFoundationTab(f.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeFoundationTab === f.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {f.title.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-medium text-amber-900">
                {activeFoundation.spanishTitle}
              </p>
              <h3 className="text-sm font-semibold text-stone-900">
                {activeFoundation.title}
              </h3>
              {activeFoundation.fileOrigin && (
                <p className="text-[11px] font-mono-tabular text-stone-500 mt-0.5">
                  Archivo: {activeFoundation.fileOrigin}
                </p>
              )}
            </div>

            {activeFoundation.keyPrinciples.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-stone-600">
                  Click any principle to weave into chapter:
                </p>
                {activeFoundation.keyPrinciples.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const insertion = `\n\n> **${activeFoundation.title}**: "${p}"\n`;
                      onUpdateChapter({
                        ...activeChapter,
                        manuscriptContent:
                          (activeChapter.manuscriptContent || '') + insertion,
                      });
                      setStudioStatusMsg(
                        `Principio de ${activeFoundation.title} insertado en el Capítulo ${activeChapter.number}.`
                      );
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-[#FBF9F5] border border-stone-200 hover:border-amber-800 text-xs text-stone-700 transition-colors"
                  >
                    <span className="font-mono-tabular text-amber-900 font-semibold mr-1">
                      +
                    </span>
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-stone-200">
              <p className="text-[11px] font-semibold text-stone-600 mb-1.5">
                Contenido del Documento Fundacional (Editable en Vivo):
              </p>
              <div className="p-3 rounded-lg bg-[#FBF9F5] border border-stone-200 text-xs text-stone-600 max-h-60 overflow-y-auto whitespace-pre-line leading-relaxed">
                {activeFoundation.content.trim()
                  ? activeFoundation.content
                  : 'Documento limpio listo para cargar en la pestaña "Foundations & Map" (o el agente usará los principios base de Conciencia Cristalina).'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 2: PANEL DE PRODUCCIÓN AUTOMÁTICA DE VIDEO (Debajo del editor del capítulo) */}
      <VideoProductionPanel
        chapter={activeChapter}
        foundations={foundations}
        writingEngine={writingEngine}
        cloudConfig={cloudConfig}
        autoTriggerVideo={autoTriggerVideo}
        onToggleAutoTrigger={setAutoTriggerVideo}
        videoPackage={activeVideoPackage}
        onUpdateVideoPackage={(pkg) =>
          onUpdateVideoPackage(activeChapter.id, pkg)
        }
        externalTriggerCount={videoPipelineTriggerCount}
      />
    </div>
  );
};
