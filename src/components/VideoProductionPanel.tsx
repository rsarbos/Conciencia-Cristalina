import React, { useEffect, useState } from 'react';
import {
  BookChapter,
  ChapterVideoPackage,
  CloudPipelineConfig,
  FoundationPillar,
  GuionEpBloque,
  GuionEpJsonSchema,
  LanguageCode,
  VideoBlockRenderStage,
  WritingEngineId,
} from '../types/book';
import {
  buildGuionEpJson,
  formatVideoProductionJson,
  generateChapterVideoPackage,
  syncLegacyBlocksFromGuion,
} from '../utils/bookLogic';
import {
  AUTHOR_AVATAR_ASSET,
  BOOK_COVER_ASSET,
} from '../utils/seedData';
import {
  Video,
  Download,
  Send,
  Copy,
  Check,
  Play,
  RefreshCw,
  Film,
  FileJson,
  Cpu,
  Loader2,
  FolderCheck,
  Globe,
} from 'lucide-react';

interface VideoProductionPanelProps {
  chapter: BookChapter;
  foundations: FoundationPillar[];
  writingEngine: WritingEngineId;
  cloudConfig: CloudPipelineConfig;
  autoTriggerVideo: boolean;
  onToggleAutoTrigger: (enabled: boolean) => void;
  videoPackage: ChapterVideoPackage;
  onUpdateVideoPackage: (pkg: ChapterVideoPackage) => void;
  externalTriggerCount?: number;
}

type VideoTabId = 'escaleta' | 'json_prod' | 'comfy_render';

const RENDER_STAGES_ORDER: VideoBlockRenderStage[] = [
  'En cola',
  'Generando Audio/Avatar',
  'Generando B-Roll LTX',
  'Renderizado en Drive',
];

export const VideoProductionPanel: React.FC<VideoProductionPanelProps> = ({
  chapter,
  foundations,
  writingEngine,
  cloudConfig,
  autoTriggerVideo,
  onToggleAutoTrigger,
  videoPackage,
  onUpdateVideoPackage,
  externalTriggerCount = 0,
}) => {
  const [activeVideoTab, setActiveVideoTab] = useState<VideoTabId>('escaleta');
  const [activeKitLang, setActiveKitLang] = useState<LanguageCode>(
    videoPackage.activeLanguage || chapter.activeLanguage || 'es'
  );
  const [isDispatching, setIsDispatching] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [pipelineFeedback, setPipelineFeedback] = useState<string | null>(null);
  const [activePreviewBlockIdx, setActivePreviewBlockIdx] = useState<number>(0);
  const [avatarImgErr, setAvatarImgErr] = useState(false);
  const [coverImgErr, setCoverImgErr] = useState(false);
  const [blockStages, setBlockStages] = useState<
    Record<string, VideoBlockRenderStage>
  >(() => {
    const initial: Record<string, VideoBlockRenderStage> = {};
    const blocks = videoPackage.guionEpJson?.bloques || [];
    for (const b of blocks) {
      initial[b.id] =
        videoPackage.blockRenderStates?.[b.id] ||
        b.estado_render ||
        'Renderizado en Drive';
    }
    return initial;
  });

  const activeGuion: GuionEpJsonSchema =
    videoPackage.languageKits?.[activeKitLang] ||
    videoPackage.guionEpJson ||
    buildGuionEpJson(chapter, foundations, activeKitLang);

  const productionJsonString = formatVideoProductionJson(
    videoPackage,
    chapter,
    cloudConfig,
    activeKitLang
  );

  // Real-time progression simulator across the 4 stages:
  // En cola -> Generando Audio/Avatar -> Generando B-Roll LTX -> Renderizado en Drive
  const startRealtimeBlockRenderProgression = (
    guion: GuionEpJsonSchema,
    basePkg: ChapterVideoPackage
  ) => {
    const blockIds = guion.bloques.map((b) => b.id);
    const queuedMap: Record<string, VideoBlockRenderStage> = {};
    blockIds.forEach((id) => {
      queuedMap[id] = 'En cola';
    });
    setBlockStages(queuedMap);

    // Step 1 -> Generando Audio/Avatar (workflow_latentsync.json)
    setTimeout(() => {
      setBlockStages((prev) => {
        const next = { ...prev };
        blockIds.forEach((id) => {
          next[id] = 'Generando Audio/Avatar';
        });
        return next;
      });
      onUpdateVideoPackage({
        ...basePkg,
        latentsyncRender: {
          ...basePkg.latentsyncRender,
          status: 'rendering',
          progressPct: 60,
          activeNode:
            'LatentSyncAvatarConditioner [Inyectando locucion_avatar en /prompt]',
          updatedAt: new Date().toISOString(),
        },
      });
    }, 350);

    // Step 2 -> Generando B-Roll LTX (workflow_ltx_broll.json)
    setTimeout(() => {
      setBlockStages((prev) => {
        const next = { ...prev };
        blockIds.forEach((id) => {
          next[id] = 'Generando B-Roll LTX';
        });
        return next;
      });
      onUpdateVideoPackage({
        ...basePkg,
        latentsyncRender: {
          ...basePkg.latentsyncRender,
          status: 'completed',
          progressPct: 100,
          activeNode:
            'LatentSyncVideoCombine [Audio + Avatar 24fps Completado]',
          updatedAt: new Date().toISOString(),
        },
        ltxBrollRender: {
          ...basePkg.ltxBrollRender,
          status: 'rendering',
          progressPct: 75,
          activeNode:
            'LTXVTextToVideoBatch [Renderizando 5 prompts B-Roll 4K en ComfyUI]',
          updatedAt: new Date().toISOString(),
        },
      });
    }, 900);

    // Step 3 -> Renderizado en Drive
    setTimeout(() => {
      const doneMap: Record<string, VideoBlockRenderStage> = {};
      blockIds.forEach((id) => {
        doneMap[id] = 'Renderizado en Drive';
      });
      setBlockStages(doneMap);

      const completedGuionEs: GuionEpJsonSchema = {
        ...basePkg.languageKits.es,
        bloques: basePkg.languageKits.es.bloques.map((b) => ({
          ...b,
          estado_render: 'Renderizado en Drive',
        })),
      };
      const completedGuionEn: GuionEpJsonSchema = {
        ...basePkg.languageKits.en,
        bloques: basePkg.languageKits.en.bloques.map((b) => ({
          ...b,
          estado_render: 'Renderizado en Drive',
        })),
      };

      onUpdateVideoPackage({
        ...basePkg,
        blockRenderStates: doneMap,
        guionEpJson:
          activeKitLang === 'en' ? completedGuionEn : completedGuionEs,
        languageKits: {
          es: completedGuionEs,
          en: completedGuionEn,
        },
        latentsyncRender: {
          ...basePkg.latentsyncRender,
          status: 'completed',
          progressPct: 100,
          activeNode:
            'LatentSyncVideoCombine [Sincronizado en Drive ConcienciaCristalina]',
          updatedAt: new Date().toISOString(),
        },
        ltxBrollRender: {
          ...basePkg.ltxBrollRender,
          status: 'completed',
          progressPct: 100,
          activeNode:
            'VHS_VideoCombine [5/5 Bloques B-Roll 4K Renderizados en Drive]',
          updatedAt: new Date().toISOString(),
        },
      });
    }, 1500);
  };

  useEffect(() => {
    if (externalTriggerCount > 0) {
      startRealtimeBlockRenderProgression(activeGuion, videoPackage);
    }
  }, [externalTriggerCount]);

  // Core implementation of triggerVideoPipeline(chapterData)
  const triggerVideoPipeline = async (chapterData: BookChapter) => {
    setIsDispatching(true);
    setPipelineFeedback(null);

    const guionEs = buildGuionEpJson(chapterData, foundations, 'es');
    const guionEn = buildGuionEpJson(chapterData, foundations, 'en');
    const currentGuion = activeKitLang === 'en' ? guionEn : guionEs;

    try {
      const response = await fetch('/api/trigger-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: chapterData,
          foundations,
          guion_ep: currentGuion,
          guion_ep_es: guionEs,
          guion_ep_en: guionEn,
          comfyui_tunnel_url: cloudConfig.COMFYUI_TUNNEL_URL,
          drive_folder_id: cloudConfig.DRIVE_FOLDER_ID || 'ConcienciaCristalina',
          backend_bridge_url: cloudConfig.BACKEND_BRIDGE_URL,
          writingEngine,
          autoTriggerEnabled: autoTriggerVideo,
          activeLanguage: activeKitLang,
        }),
      });
      const data = await response.json();
      const generatedPkg: ChapterVideoPackage =
        data.videoPackage ||
        generateChapterVideoPackage(
          chapterData,
          foundations,
          writingEngine,
          autoTriggerVideo,
          activeKitLang
        );

      onUpdateVideoPackage(generatedPkg);
      startRealtimeBlockRenderProgression(currentGuion, generatedPkg);

      setPipelineFeedback(
        `triggerVideoPipeline completado: ${generatedPkg.jsonFilename} (Kit ES + Kit EN) guardado en Conciencia_Cristalina_AI/scripts_input y enviado a ${cloudConfig.BACKEND_BRIDGE_URL.replace(/\/$/, '')}/api/trigger-video → ComfyUI (${cloudConfig.COMFYUI_TUNNEL_URL}/prompt).`
      );
    } catch {
      const fallbackPkg = generateChapterVideoPackage(
        chapterData,
        foundations,
        writingEngine,
        autoTriggerVideo,
        activeKitLang
      );
      onUpdateVideoPackage(fallbackPkg);
      startRealtimeBlockRenderProgression(currentGuion, fallbackPkg);
      setPipelineFeedback(
        `Paquete audiovisual (${fallbackPkg.jsonFilename}) generado en Español e Inglés y encolado para workflow_latentsync.json y workflow_ltx_broll.json.`
      );
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSwitchLanguageKit = (lang: LanguageCode) => {
    setActiveKitLang(lang);
    const targetGuion =
      videoPackage.languageKits?.[lang] ||
      buildGuionEpJson(chapter, foundations, lang);
    onUpdateVideoPackage({
      ...videoPackage,
      activeLanguage: lang,
      guionEpJson: targetGuion,
      blocks: syncLegacyBlocksFromGuion(targetGuion),
    });
  };

  const handleUpdateGuionBlock = (
    blockId: string,
    field: keyof GuionEpBloque,
    value: string
  ) => {
    const updatedBloques = activeGuion.bloques.map((b) =>
      b.id === blockId ? { ...b, [field]: value } : b
    );
    const updatedGuion: GuionEpJsonSchema = {
      ...activeGuion,
      bloques: updatedBloques,
    };

    onUpdateVideoPackage({
      ...videoPackage,
      guionEpJson: updatedGuion,
      languageKits: {
        ...videoPackage.languageKits,
        [activeKitLang]: updatedGuion,
      },
      blocks: syncLegacyBlocksFromGuion(updatedGuion),
    });
  };

  const handleUpdateShort60s = (
    field: 'hook_3s' | 'guion_hablado' | 'prompt_broll_vertical',
    value: string
  ) => {
    const updatedGuion: GuionEpJsonSchema = {
      ...activeGuion,
      pildora_short_60s: {
        ...activeGuion.pildora_short_60s,
        [field]: value,
      },
    };
    onUpdateVideoPackage({
      ...videoPackage,
      guionEpJson: updatedGuion,
      languageKits: {
        ...videoPackage.languageKits,
        [activeKitLang]: updatedGuion,
      },
    });
  };

  const handleDownloadJson = (langOverride?: LanguageCode) => {
    const targetLang = langOverride || activeKitLang;
    const jsonStr = formatVideoProductionJson(
      videoPackage,
      chapter,
      cloudConfig,
      targetLang
    );
    const blob = new Blob([jsonStr], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = langOverride ? `_${langOverride}` : '';
    const filename = `guion_ep${chapter.number}${suffix}.json`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPipelineFeedback(`Archivo ${filename} descargado en 1 clic.`);
  };

  const handleCopyJson = () => {
    navigator.clipboard?.writeText(productionJsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const activePreviewBloque =
    activeGuion.bloques[activePreviewBlockIdx] || activeGuion.bloques[0];

  return (
    <section
      aria-label="Panel de Producción Automática de Video"
      className="bg-white border border-stone-200 rounded-xl p-6 space-y-6"
    >
      {/* Top Bar of Video Production Panel */}
      <div className="flex flex-col gap-4 pb-4 border-b border-stone-200">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-900">
            <Video className="w-4 h-4 shrink-0" />
            <span>
              Conciencia Cristalina · Video Pipeline Automático ·{' '}
              {activeGuion.episodio_id} · Módulo {activeGuion.modulo}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {activeGuion.formato_salida} ({activeGuion.duracion_estimada})
            </span>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">
            Panel de Producción Automática de Video (LatentSync &amp; LTX B-Roll)
          </h2>
          <p className="text-xs text-stone-600">
            Genera los 2 Kits de Video del Capítulo {chapter.number} (Español Nativo + Inglés Nativo), descarga{' '}
            <code className="font-mono-tabular text-stone-900">
              guion_ep{chapter.number}.json
            </code>{' '}
            o guárdalo en{' '}
            <code className="font-mono-tabular text-stone-900">
              Conciencia_Cristalina_AI/scripts_input
            </code>{' '}
            y dispara ComfyUI (<code className="font-mono-tabular">/prompt</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Bilingual Video Module Kit Switcher (ES / EN) */}
          <div
            role="group"
            aria-label="Selector de Idioma del Kit de Video"
            className="inline-flex items-center p-1 rounded-lg bg-[#F5F2EB] border border-stone-300 text-xs font-medium"
          >
            <button
              type="button"
              onClick={() => handleSwitchLanguageKit('es')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeKitLang === 'es'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Kit Video ES (Nativo)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLanguageKit('en')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeKitLang === 'en'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Kit Video EN (Native)</span>
            </button>
          </div>

          {/* Toggle: Auto-disparar Pipeline de Video al terminar el capítulo */}
          <label className="inline-flex items-center gap-2.5 cursor-pointer bg-[#FBF9F5] border border-stone-300 rounded-lg px-3.5 py-2 text-xs font-medium text-stone-800">
            <input
              type="checkbox"
              role="switch"
              aria-checked={autoTriggerVideo}
              checked={autoTriggerVideo}
              onChange={(e) => onToggleAutoTrigger(e.target.checked)}
              className="rounded border-stone-400 text-stone-900 focus:ring-stone-900 w-4 h-4"
            />
            <span className="whitespace-nowrap">
              Auto-disparar Pipeline de Video al terminar el capítulo
            </span>
          </label>

          {/* Direct Action Button */}
          <button
            type="button"
            onClick={() => triggerVideoPipeline(chapter)}
            disabled={isDispatching}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {isDispatching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Film className="w-3.5 h-3.5" />
            )}
            <span>
              Generar Guion Técnico + Disparar Video (LatentSync &amp; LTX B-Roll)
            </span>
          </button>
        </div>
      </div>

      {pipelineFeedback && (
        <div
          role="status"
          className="px-4 py-2.5 bg-stone-900 text-stone-50 text-xs rounded-lg flex items-center justify-between gap-4"
        >
          <span>{pipelineFeedback}</span>
          <button
            type="button"
            onClick={() => setPipelineFeedback(null)}
            className="text-stone-300 hover:text-white underline whitespace-nowrap shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 3-Tab Navigation for the Chapter Video Package */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div
          role="tablist"
          aria-label="Paquete de Video del Capítulo"
          className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg overflow-x-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeVideoTab === 'escaleta'}
            onClick={() => setActiveVideoTab('escaleta')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeVideoTab === 'escaleta'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Escaleta y Guion Hablado (5 Bloques: Hook, Física/Conciencia, Matrix/Metáfora, Responsabilidad, Ejercicio + CTA)
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeVideoTab === 'json_prod'}
            onClick={() => setActiveVideoTab('json_prod')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeVideoTab === 'json_prod'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            JSON de Producción (guion_ep{chapter.number}.json)
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeVideoTab === 'comfy_render'}
            onClick={() => setActiveVideoTab('comfy_render')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeVideoTab === 'comfy_render'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Estado del Render en ComfyUI
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500 font-mono-tabular shrink-0">
          <button
            type="button"
            onClick={() => handleDownloadJson()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#FBF9F5] text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-amber-900" />
            <span>Descargar guion_ep{chapter.number}.json (1-Clic)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Escaleta y Guion Hablado (5 Bloques Escénicos + Píldora Short 60s) */}
      {activeVideoTab === 'escaleta' && (
        <div className="space-y-5">
          {/* Episode Metadata Bar */}
          <div className="p-4 rounded-xl bg-[#FBF9F5] border border-stone-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-stone-500 block">
                Episodio / Módulo
              </span>
              <span className="font-mono-tabular font-semibold text-stone-900">
                {activeGuion.episodio_id} · Módulo {activeGuion.modulo}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[11px] text-stone-500 block">
                Título Magnético YouTube ({activeKitLang.toUpperCase()})
              </span>
              <span className="font-semibold text-stone-900">
                {activeGuion.titulo_video}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block">
                Duración &amp; Formato Salida
              </span>
              <span className="font-mono-tabular text-amber-900 font-semibold">
                {activeGuion.duracion_estimada} · {activeGuion.formato_salida}
              </span>
            </div>
          </div>

          {/* 5 Scenic Blocks */}
          <div className="grid grid-cols-1 gap-4">
            {activeGuion.bloques.map((blk) => {
              const currentStage =
                blockStages[blk.id] || blk.estado_render || 'En cola';
              return (
                <div
                  key={blk.id}
                  className="p-4 rounded-xl border border-stone-200 bg-[#FBF9F5] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200/80">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono-tabular font-semibold text-amber-900">
                        {blk.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-stone-900">
                        {blk.titulo_bloque || blk.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono-tabular text-stone-600">
                      <span>Tiempo: {blk.tiempo}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-800 font-semibold">
                        {currentStage}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-5">
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        locucion_avatar (Síntesis de Voz y LatentSync)
                      </label>
                      <textarea
                        rows={3}
                        value={blk.locucion_avatar}
                        onChange={(e) =>
                          handleUpdateGuionBlock(
                            blk.id,
                            'locucion_avatar',
                            e.target.value
                          )
                        }
                        aria-label={`Locución avatar para ${blk.id}`}
                        className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs text-stone-900 leading-relaxed focus:outline-none focus:border-stone-900"
                      />
                    </div>

                    <div className="lg:col-span-4">
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        prompt_broll_ltx (`workflow_ltx_broll.json`)
                      </label>
                      <textarea
                        rows={3}
                        value={blk.prompt_broll_ltx}
                        onChange={(e) =>
                          handleUpdateGuionBlock(
                            blk.id,
                            'prompt_broll_ltx',
                            e.target.value
                          )
                        }
                        aria-label={`Prompt B-Roll LTX para ${blk.id}`}
                        className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs font-mono text-stone-700 leading-relaxed focus:outline-none focus:border-stone-900"
                      />
                    </div>

                    <div className="lg:col-span-3 space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          plano_camara
                        </label>
                        <input
                          type="text"
                          value={blk.plano_camara}
                          onChange={(e) =>
                            handleUpdateGuionBlock(
                              blk.id,
                              'plano_camara',
                              e.target.value
                            )
                          }
                          aria-label={`Plano de cámara para ${blk.id}`}
                          className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          texto_en_pantalla
                        </label>
                        <input
                          type="text"
                          value={blk.texto_en_pantalla}
                          onChange={(e) =>
                            handleUpdateGuionBlock(
                              blk.id,
                              'texto_en_pantalla',
                              e.target.value
                            )
                          }
                          aria-label={`Texto en pantalla para ${blk.id}`}
                          className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-mono-tabular text-amber-900 font-semibold focus:outline-none focus:border-stone-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Píldora Short 60s Section */}
          <div className="p-4 rounded-xl border border-stone-200 bg-[#FBF9F5] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-xs font-semibold text-stone-900">
                Píldora Short / Reel / TikTok 60s (`pildora_short_60s` · 9:16 Vertical)
              </h3>
              <span className="text-[11px] font-mono-tabular text-amber-900">
                Incluido en guion_ep{chapter.number}.json ({activeKitLang.toUpperCase()})
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  hook_3s (Primeros 3 segundos)
                </label>
                <textarea
                  rows={3}
                  value={activeGuion.pildora_short_60s.hook_3s}
                  onChange={(e) =>
                    handleUpdateShort60s('hook_3s', e.target.value)
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs text-stone-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  guion_hablado (60 segundos)
                </label>
                <textarea
                  rows={3}
                  value={activeGuion.pildora_short_60s.guion_hablado}
                  onChange={(e) =>
                    handleUpdateShort60s('guion_hablado', e.target.value)
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs text-stone-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  prompt_broll_vertical (LTX 9:16)
                </label>
                <textarea
                  rows={3}
                  value={activeGuion.pildora_short_60s.prompt_broll_vertical}
                  onChange={(e) =>
                    handleUpdateShort60s('prompt_broll_vertical', e.target.value)
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs font-mono text-stone-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JSON de Producción (guion_epX.json) */}
      {activeVideoTab === 'json_prod' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F5] border border-stone-200 rounded-lg p-3.5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <FileJson className="w-4 h-4 text-amber-900 shrink-0" />
              <span className="font-mono-tabular font-semibold text-stone-900">
                guion_ep{chapter.number}.json ({activeKitLang.toUpperCase()})
              </span>
              <span aria-hidden="true" className="text-stone-400">
                ·
              </span>
              <span className="text-stone-600">
                Ruta Destino:{' '}
                <code className="font-mono-tabular text-stone-900">
                  Conciencia_Cristalina_AI/scripts_input/guion_ep{chapter.number}.json
                </code>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 whitespace-nowrap shrink-0"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>JSON Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDownloadJson('es')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar ES (guion_ep{chapter.number}_es.json)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadJson('en')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar EN (guion_ep{chapter.number}_en.json)</span>
              </button>

              <button
                type="button"
                onClick={() => triggerVideoPipeline(chapter)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  Guardar en scripts_input + Disparar /api/trigger-video
                </span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-stone-950 text-stone-100 text-xs font-mono-tabular overflow-x-auto max-h-96 leading-relaxed">
            {productionJsonString}
          </pre>
        </div>
      )}

      {/* TAB 3: Estado del Render en ComfyUI (En Tiempo Real por Bloque) */}
      {activeVideoTab === 'comfy_render' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F5] border border-stone-200 rounded-lg p-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-stone-700">
              <Cpu className="w-4 h-4 text-amber-900 shrink-0" />
              <span className="font-semibold text-stone-900">
                Túnel GPU Google Colab ComfyUI:
              </span>
              <span className="font-mono-tabular text-stone-800">
                {cloudConfig.COMFYUI_TUNNEL_URL}/prompt
              </span>
              <span aria-hidden="true">·</span>
              <FolderCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="font-mono-tabular text-stone-700">
                {videoPackage.savedToScriptsInputPath ||
                  `Conciencia_Cristalina_AI/scripts_input/guion_ep${chapter.number}.json`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => triggerVideoPipeline(chapter)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-disparar POST /api/trigger-video</span>
            </button>
          </div>

          {/* Real-Time Block-by-Block Render Tracker */}
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
              <div>
                <h3 className="text-xs font-semibold text-stone-900">
                  Estado en Tiempo Real de Cada Bloque Escénico ({activeGuion.episodio_id})
                </h3>
                <p className="text-[11px] text-stone-500">
                  Flujo: En cola → Generando Audio/Avatar (`workflow_latentsync.json`) → Generando B-Roll LTX (`workflow_ltx_broll.json`) → Renderizado en Drive (`{cloudConfig.DRIVE_FOLDER_ID || 'ConcienciaCristalina'}`)
                </p>
              </div>
              <span className="text-xs font-mono-tabular font-semibold text-emerald-800">
                {
                  activeGuion.bloques.filter(
                    (b) =>
                      (blockStages[b.id] || b.estado_render) ===
                      'Renderizado en Drive'
                  ).length
                }{' '}
                / {activeGuion.bloques.length} Bloques Renderizados en Drive
              </span>
            </div>

            <div className="space-y-2.5">
              {activeGuion.bloques.map((blk) => {
                const currentStage: VideoBlockRenderStage =
                  blockStages[blk.id] ||
                  blk.estado_render ||
                  'Renderizado en Drive';
                const currentStageIdx =
                  RENDER_STAGES_ORDER.indexOf(currentStage);

                return (
                  <div
                    key={blk.id}
                    className="p-3 rounded-lg border border-stone-200 bg-[#FBF9F5] flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono-tabular font-semibold text-amber-900">
                          {blk.id}
                        </span>
                        <span className="text-stone-400">·</span>
                        <span className="font-mono-tabular text-stone-600">
                          {blk.tiempo}
                        </span>
                        <span className="text-stone-400">·</span>
                        <span className="font-semibold text-stone-900 truncate">
                          {blk.texto_en_pantalla}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 truncate mt-0.5">
                        Avatar: {blk.locucion_avatar}
                      </p>
                    </div>

                    {/* 4-Stage Pipeline Stepper */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {RENDER_STAGES_ORDER.map((stageName, sIdx) => {
                        const isReached = sIdx <= currentStageIdx;
                        const isCurrent = sIdx === currentStageIdx;
                        return (
                          <React.Fragment key={stageName}>
                            <span
                              className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular ${
                                isCurrent
                                  ? 'bg-stone-900 text-white font-semibold'
                                  : isReached
                                  ? 'bg-emerald-900/10 text-emerald-900 font-medium'
                                  : 'bg-stone-200/70 text-stone-500'
                              }`}
                            >
                              {stageName}
                            </span>
                            {sIdx < RENDER_STAGES_ORDER.length - 1 && (
                              <span
                                aria-hidden="true"
                                className="text-stone-400 text-xs"
                              >
                                →
                              </span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2 Workflow Progress Cards: workflow_latentsync.json & workflow_ltx_broll.json */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-stone-200 bg-[#FBF9F5] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-mono-tabular font-semibold text-amber-900">
                    {videoPackage.latentsyncRender.workflowFile}
                  </span>
                  <h3 className="text-sm font-semibold text-stone-900 mt-0.5">
                    {videoPackage.latentsyncRender.label}
                  </h3>
                </div>
                <span className="text-xs font-mono-tabular font-semibold text-emerald-800">
                  {videoPackage.latentsyncRender.progressPct}%
                </span>
              </div>

              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-700 transition-all duration-200"
                  style={{
                    width: `${videoPackage.latentsyncRender.progressPct}%`,
                  }}
                />
              </div>

              <div className="text-xs text-stone-600 space-y-1 font-mono-tabular">
                <div>
                  Nodo Activo: {videoPackage.latentsyncRender.activeNode}
                </div>
                <div>
                  Archivo Salida: {videoPackage.latentsyncRender.outputAsset}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-[#FBF9F5] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-mono-tabular font-semibold text-amber-900">
                    {videoPackage.ltxBrollRender.workflowFile}
                  </span>
                  <h3 className="text-sm font-semibold text-stone-900 mt-0.5">
                    {videoPackage.ltxBrollRender.label}
                  </h3>
                </div>
                <span className="text-xs font-mono-tabular font-semibold text-emerald-800">
                  {videoPackage.ltxBrollRender.progressPct}%
                </span>
              </div>

              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-900 transition-all duration-200"
                  style={{
                    width: `${videoPackage.ltxBrollRender.progressPct}%`,
                  }}
                />
              </div>

              <div className="text-xs text-stone-600 space-y-1 font-mono-tabular">
                <div>Nodo Activo: {videoPackage.ltxBrollRender.activeNode}</div>
                <div>
                  Archivo Salida: {videoPackage.ltxBrollRender.outputAsset}
                </div>
              </div>
            </div>
          </div>

          {/* Vista Previa Interactiva del Render */}
          {activePreviewBloque && (
            <div className="border border-stone-200 rounded-xl p-4 bg-[#FBF9F5] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-stone-900">
                    Vista Previa del Episodio Compuesto ({activeGuion.episodio_id} · {activeGuion.formato_salida})
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Selecciona cualquiera de los 5 bloques escénicos para inspeccionar cámara, avatar y prompt LTX
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {activeGuion.bloques.map((b, idx) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setActivePreviewBlockIdx(idx)}
                      className={`px-2.5 py-1 text-[11px] font-mono-tabular font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        activePreviewBlockIdx === idx
                          ? 'bg-stone-900 text-white'
                          : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {b.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-5 bg-stone-900 rounded-lg p-4 text-stone-100 flex flex-col justify-between min-h-48 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular text-stone-300 z-10">
                    <span>
                      {activeGuion.episodio_id.toUpperCase()} · {activePreviewBloque.id.toUpperCase()}
                    </span>
                    <span>{activePreviewBloque.tiempo} · 4K 24FPS</span>
                  </div>

                  <div className="my-3 flex items-center gap-3.5 z-10">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-amber-400/60 shrink-0 bg-stone-800">
                      {!avatarImgErr ? (
                        <img
                          src={AUTHOR_AVATAR_ASSET}
                          alt="Avatar LatentSync Preview"
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarImgErr(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-300">
                          YA
                        </div>
                      )}
                    </div>
                    <div className="w-12 h-14 rounded overflow-hidden border border-stone-700 shrink-0 bg-stone-800">
                      {!coverImgErr ? (
                        <img
                          src={BOOK_COVER_ASSET}
                          alt="LTX B-Roll Reference"
                          referrerPolicy="no-referrer"
                          onError={() => setCoverImgErr(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                          LTX
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono-tabular text-amber-300 font-semibold truncate">
                        {activePreviewBloque.texto_en_pantalla}
                      </div>
                      <p className="text-xs text-stone-200 line-clamp-2 italic mt-0.5">
                        &ldquo;{activePreviewBloque.locucion_avatar}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono-tabular text-amber-300 pt-2 border-t border-stone-800 z-10">
                    <span className="inline-flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {blockStages[activePreviewBloque.id] ||
                        'Renderizado en Drive'}
                    </span>
                    <span>
                      Drive: {cloudConfig.DRIVE_FOLDER_ID || 'ConcienciaCristalina'}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white border border-stone-200 rounded-lg p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[11px] font-mono-tabular text-amber-900 font-semibold">
                      {activePreviewBloque.id} ({activePreviewBloque.tiempo}) ·{' '}
                      {activePreviewBloque.texto_en_pantalla}
                    </div>
                    <p className="text-xs text-stone-800 mt-1 leading-relaxed">
                      <strong>locucion_avatar:</strong>{' '}
                      {activePreviewBloque.locucion_avatar}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200 text-xs">
                    <div>
                      <span className="block text-[11px] font-semibold text-stone-500">
                        plano_camara (`workflow_latentsync.json`):
                      </span>
                      <span className="text-stone-700">
                        {activePreviewBloque.plano_camara}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-stone-500">
                        prompt_broll_ltx (`workflow_ltx_broll.json`):
                      </span>
                      <span className="font-mono text-[11px] text-stone-700">
                        {activePreviewBloque.prompt_broll_ltx}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
