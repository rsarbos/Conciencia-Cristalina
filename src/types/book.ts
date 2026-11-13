export type FoundationId =
  | 'master_guide'
  | 'structural_map'
  | 'manifiesto_metodologia'
  | 'fundamentos_teoricos'
  | 'integracion_sabidurias';

export type LanguageCode = 'es' | 'en';

export interface FoundationPillar {
  id: FoundationId;
  title: string;
  spanishTitle: string;
  subtitle: string;
  content: string;
  keyPrinciples: string[];
  lastUpdated: string;
  fileOrigin?: string;
}

export interface SubtopicItem {
  id: string;
  title: string;
  completed: boolean;
  keyArgument: string;
  targetWords: number;
}

export type ChapterStatus = 'queued' | 'drafting' | 'review' | 'saved_to_manuscript';

export interface ChapterLanguageKit {
  language: LanguageCode;
  label: string;
  title: string;
  subtitle: string;
  manuscriptContent: string;
  wordCount: number;
  updatedAt?: string;
}

export interface BookChapter {
  id: string;
  number: number;
  partTitle: string;
  title: string;
  subtitle: string;
  scheduledDay: number;
  targetWordCount: number;
  manuscriptContent: string;
  editorialNotes: string;
  status: ChapterStatus;
  subtopics: SubtopicItem[];
  savedAt?: string;
  wisdomPillarsUsed: FoundationId[];
  activeLanguage?: LanguageCode;
  moduleKits?: {
    es: ChapterLanguageKit;
    en: ChapterLanguageKit;
  };
}

export type SocialPlatform =
  | 'linkedin'
  | 'twitter_thread'
  | 'instagram_carousel'
  | 'substack_letter'
  | 'short_video_hook';

export interface SocialMediaPost {
  id: string;
  chapterId: string;
  language?: LanguageCode;
  platform: SocialPlatform;
  hook: string;
  content: string;
  callToAction: string;
  hashtags: string[];
  status: 'draft' | 'ready' | 'scheduled' | 'published';
  scheduledDayOffset: number;
  predictedEngagementRate: number;
}

export interface RetailChannelMetric {
  id: string;
  channelName: string;
  currentPreorders: number;
  targetWeek1: number;
  nyTimesWeight: string;
  conversionRate: number;
  weeklyVelocity: number;
}

export interface ReaderCohortMetric {
  id: string;
  segmentName: string;
  subscribers: number;
  openRate: number;
  clickThroughRate: number;
  preOrderConversion: number;
  engagementAction: string;
}

export interface BestsellerPhaseTask {
  id: string;
  phase: string;
  title: string;
  triggerCondition: string;
  tacticalInstruction: string;
  metricTarget: string;
  completed: boolean;
  impactWeight: number;
  requiredManuscriptPct: number;
}

export type WritingEngineId = 'claude_opus_5_5_vertex' | 'gemini_4_argon';

export interface CloudPipelineConfig {
  GCP_PROJECT_ID: string;
  BACKEND_BRIDGE_URL: string;
  COMFYUI_TUNNEL_URL: string;
  DRIVE_FOLDER_ID: string;
}

export type VideoBlockRenderStage =
  | 'En cola'
  | 'Generando Audio/Avatar'
  | 'Generando B-Roll LTX'
  | 'Renderizado en Drive';

export interface GuionEpBloque {
  id: string;
  tiempo: string;
  plano_camara: string;
  locucion_avatar: string;
  prompt_broll_ltx: string;
  texto_en_pantalla: string;
  titulo_bloque?: string;
  estado_render?: VideoBlockRenderStage;
}

export interface PildoraShort60s {
  hook_3s: string;
  guion_hablado: string;
  prompt_broll_vertical: string;
}

export interface GuionEpJsonSchema {
  episodio_id: string;
  fase: string;
  modulo: string;
  titulo_video: string;
  duracion_estimada: string;
  formato_salida: string;
  idioma?: LanguageCode;
  autor?: string;
  bloques: GuionEpBloque[];
  pildora_short_60s: PildoraShort60s;
}

export interface VideoScriptBlock {
  id: string;
  blockNumber: number;
  blockType:
    | 'Hook'
    | 'Física/Conciencia'
    | 'Matrix/Metáfora'
    | 'Responsabilidad'
    | 'Ejercicio + CTA';
  durationSeconds: number;
  spokenScript: string;
  avatarDirection: string;
  ltxBrollPrompt: string;
  tiempo?: string;
  textoEnPantalla?: string;
  renderStage?: VideoBlockRenderStage;
}

export interface WorkflowRenderState {
  workflowFile: 'workflow_latentsync.json' | 'workflow_ltx_broll.json';
  label: string;
  status: 'idle' | 'queued' | 'rendering' | 'completed' | 'bridged';
  progressPct: number;
  activeNode: string;
  outputAsset: string;
  updatedAt: string;
}

export interface ChapterVideoPackage {
  chapterId: string;
  episodeNumber: number;
  jsonFilename: string;
  autoTriggerEnabled: boolean;
  writingEngineUsed: WritingEngineId;
  activeLanguage?: LanguageCode;
  blocks: VideoScriptBlock[];
  guionEpJson: GuionEpJsonSchema;
  languageKits: {
    es: GuionEpJsonSchema;
    en: GuionEpJsonSchema;
  };
  blockRenderStates: Record<string, VideoBlockRenderStage>;
  savedToScriptsInputPath?: string;
  comfyPromptDispatched?: boolean;
  latentsyncRender: WorkflowRenderState;
  ltxBrollRender: WorkflowRenderState;
  lastDispatchedAt?: string;
}

export interface BookProjectState {
  title: string;
  subtitle: string;
  authorName: string;
  targetPubDate: string;
  dailyWordGoal: number;
  foundations: FoundationPillar[];
  chapters: BookChapter[];
  socialPosts: SocialMediaPost[];
  retailChannels: RetailChannelMetric[];
  readerCohorts: ReaderCohortMetric[];
  bestsellerTasks: BestsellerPhaseTask[];
  videoPackages?: Record<string, ChapterVideoPackage>;
}
