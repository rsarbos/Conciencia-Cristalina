import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  parseSyllabusTextToChapters,
  calculateManuscriptProgress,
  calculateNYTBestsellerReadiness,
  compileFullManuscriptMarkdown,
  generateFallbackChapterDraft,
  generateFallbackSocialPosts,
  generateChapterVideoPackage,
  formatVideoProductionJson,
  DEFAULT_CLOUD_PIPELINE_CONFIG,
  buildClaudeOpusChapterPayload,
  generateSixBlockBestsellerChapterStreamChunks,
  buildGuionEpJson,
  buildBilingualChapterKits,
  buildComfyUIPromptPayloads,
} from './bookLogic';
import { INITIAL_BOOK_PROJECT } from './seedData';

test('countWords accurately counts words in empty and multi-line strings', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   \n  '), 0);
  assert.equal(countWords('Master Guide and Structural Map'), 5);
});

test('INITIAL_BOOK_PROJECT is clean of mocked data and uses author Yael Axel Cruz Cebreros & AInvisible Friends', () => {
  assert.equal(
    INITIAL_BOOK_PROJECT.authorName,
    'Yael Axel Cruz Cebreros & AInvisible Friends'
  );
  assert.equal(INITIAL_BOOK_PROJECT.socialPosts.length, 0);
  assert.equal(INITIAL_BOOK_PROJECT.chapters.length, 1);
  assert.equal(INITIAL_BOOK_PROJECT.chapters[0].manuscriptContent, '');
  assert.ok(INITIAL_BOOK_PROJECT.chapters[0].moduleKits?.es);
  assert.ok(INITIAL_BOOK_PROJECT.chapters[0].moduleKits?.en);
});

test('parseSyllabusTextToChapters parses Topics and Subtopics into daily chapters with bilingual moduleKits', () => {
  const sampleOutline = `
Fase 1 · El Despertar y la Deconstrucción del Ego
Capítulo 1: El Espejo de la Conciencia Cristalina — De la Matrix a la Soberanía
- El Diagnóstico de la Fragmentación
- Física de la Conciencia
- La Verdad Incómoda: Responsabilidad sin Culpa
- Protocolo Conciencia en Acción
Capítulo 2: La Frecuencia del Observador — Coherencia Interna
- Sala de Espejos
- Neurobiología Predictiva
`;
  const parsed = parseSyllabusTextToChapters(sampleOutline, 0);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].number, 1);
  assert.equal(parsed[0].title, 'El Espejo de la Conciencia Cristalina');
  assert.equal(parsed[0].subtopics.length, 4);
  assert.ok(parsed[0].moduleKits?.es);
  assert.ok(parsed[0].moduleKits?.en);
});

test('calculateManuscriptProgress and calculateNYTBestsellerReadiness work on clean and populated states', () => {
  const summary = calculateManuscriptProgress(
    INITIAL_BOOK_PROJECT.chapters,
    INITIAL_BOOK_PROJECT.foundations
  );
  assert.equal(summary.totalWordsWritten, 0);
  assert.equal(summary.totalChaptersCount, 1);

  const assessment = calculateNYTBestsellerReadiness(
    INITIAL_BOOK_PROJECT.chapters,
    INITIAL_BOOK_PROJECT.socialPosts,
    INITIAL_BOOK_PROJECT.retailChannels,
    INITIAL_BOOK_PROJECT.readerCohorts,
    INITIAL_BOOK_PROJECT.bestsellerTasks
  );
  assert.equal(assessment.nytThresholdUnits, 10000);
  assert.equal(assessment.week1ProjectedUnits, 0);
  assert.ok(assessment.immediateDirectiveTitle.length > 5);
});

test('generateFallbackChapterDraft, buildBilingualChapterKits, and generateFallbackSocialPosts produce ES and EN kits', () => {
  const ch = INITIAL_BOOK_PROJECT.chapters[0];
  const draftEs = generateFallbackChapterDraft(
    ch,
    INITIAL_BOOK_PROJECT.foundations,
    undefined,
    'es'
  );
  const draftEn = generateFallbackChapterDraft(
    ch,
    INITIAL_BOOK_PROJECT.foundations,
    undefined,
    'en'
  );
  assert.ok(draftEs.includes('Yael Axel Cruz Cebreros & AInvisible Friends'));
  assert.ok(draftEn.includes('Yael Axel Cruz Cebreros & AInvisible Friends'));
  assert.ok(draftEs.includes('Bloque 1: Gancho Visceral'));
  assert.ok(draftEn.includes('Block 1: Visceral Hook'));

  const kits = buildBilingualChapterKits(
    ch,
    INITIAL_BOOK_PROJECT.foundations,
    draftEs,
    'es'
  );
  assert.ok(kits.es.wordCount > 200);
  assert.ok(kits.en.wordCount > 200);

  const posts = generateFallbackSocialPosts(
    ch,
    INITIAL_BOOK_PROJECT.foundations,
    INITIAL_BOOK_PROJECT.title
  );
  assert.equal(posts.length, 5);
});

test('buildGuionEpJson and formatVideoProductionJson produce exact guion_epX.json schema in ES and EN', () => {
  const ch = INITIAL_BOOK_PROJECT.chapters[0];
  const guionEs = buildGuionEpJson(ch, INITIAL_BOOK_PROJECT.foundations, 'es');
  const guionEn = buildGuionEpJson(ch, INITIAL_BOOK_PROJECT.foundations, 'en');

  assert.equal(guionEs.episodio_id, 'ep_01');
  assert.equal(guionEs.modulo, '1.1');
  assert.equal(guionEs.duracion_estimada, '15 a 18 minutos');
  assert.equal(guionEs.formato_salida, '16:9 UHD 4K / 24 fps');
  assert.equal(guionEs.bloques.length, 5);
  assert.equal(guionEs.bloques[0].id, 'bloque_0_hook');
  assert.equal(guionEs.bloques[0].tiempo, '00:00 - 01:30');
  assert.ok(guionEs.bloques[0].plano_camara.includes('Plano Medio'));
  assert.ok(guionEs.bloques[0].locucion_avatar.length > 20);
  assert.ok(guionEs.bloques[0].prompt_broll_ltx.includes('Cinematic 4K'));
  assert.ok(guionEs.bloques[0].texto_en_pantalla.length > 3);
  assert.ok(guionEs.pildora_short_60s.hook_3s.length > 10);
  assert.ok(guionEs.pildora_short_60s.guion_hablado.length > 20);
  assert.ok(guionEs.pildora_short_60s.prompt_broll_vertical.length > 20);

  assert.equal(guionEn.episodio_id, 'ep_01');
  assert.equal(guionEn.duracion_estimada, '15 to 18 minutes');
  assert.equal(guionEn.bloques.length, 5);

  const pkg = generateChapterVideoPackage(
    ch,
    INITIAL_BOOK_PROJECT.foundations,
    'claude_opus_5_5_vertex',
    true,
    'es'
  );
  const jsonStr = formatVideoProductionJson(
    pkg,
    ch,
    DEFAULT_CLOUD_PIPELINE_CONFIG,
    'es'
  );
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.episodio_id, 'ep_01');
  assert.equal(parsed.formato_salida, '16:9 UHD 4K / 24 fps');
  assert.equal(parsed.bloques.length, 5);
  assert.ok(parsed.pildora_short_60s.hook_3s);

  const comfyPayloads = buildComfyUIPromptPayloads(guionEs);
  assert.equal(
    comfyPayloads.workflow_latentsync.workflow_name,
    'workflow_latentsync.json'
  );
  assert.equal(
    comfyPayloads.workflow_ltx_broll.workflow_name,
    'workflow_ltx_broll.json'
  );
});

test('buildClaudeOpusChapterPayload combines Master Guide and foundations into system_prompt and 6-Block NYT anatomy into user_prompt', () => {
  const ch = INITIAL_BOOK_PROJECT.chapters[0];
  const payload = buildClaudeOpusChapterPayload(
    ch,
    INITIAL_BOOK_PROJECT.foundations,
    'conciencia-cristalina-vertex-01',
    INITIAL_BOOK_PROJECT.chapters,
    'es'
  );
  assert.equal(payload.project_id, 'conciencia-cristalina-vertex-01');
  assert.equal(payload.model, 'claude-opus-5-5');
  assert.equal(payload.phase_number, 1);
  assert.equal(payload.mandatory_subtopics.length, 4);
  assert.ok(
    payload.system_prompt.includes('Yael Axel Cruz Cebreros & AInvisible Friends')
  );
  assert.ok(
    payload.system_prompt.includes('Guia_Agente_Escritor_Conciencia_Cristalina.md')
  );
  assert.ok(payload.user_prompt.includes('3,500 y 4,000 palabras'));
  assert.ok(payload.user_prompt.includes('Bloque 1: Gancho Visceral (10%'));
  assert.ok(payload.user_prompt.includes('Bloque 6: Cierre Resonante'));

  const chunks = generateSixBlockBestsellerChapterStreamChunks(
    ch,
    INITIAL_BOOK_PROJECT.foundations
  );
  const fullStreamText = chunks.join('');
  assert.ok(fullStreamText.includes('Bloque 1: Gancho Visceral'));
  assert.ok(fullStreamText.includes('Frase Ancla 1'));
  assert.ok(fullStreamText.includes('Frase Ancla 2'));
  assert.ok(fullStreamText.includes('Frase Ancla 3'));
});

test('compileFullManuscriptMarkdown exports either ES or EN module kit', () => {
  const ch = INITIAL_BOOK_PROJECT.chapters[0];
  const kits = buildBilingualChapterKits(
    ch,
    INITIAL_BOOK_PROJECT.foundations,
    'Contenido en Español Nativo de prueba',
    'es'
  );
  const projectWithSaved = {
    ...INITIAL_BOOK_PROJECT,
    chapters: [
      {
        ...ch,
        status: 'saved_to_manuscript' as const,
        manuscriptContent: kits.es.manuscriptContent,
        moduleKits: kits,
      },
    ],
  };

  const mdEs = compileFullManuscriptMarkdown(projectWithSaved, false, 'es');
  const mdEn = compileFullManuscriptMarkdown(projectWithSaved, false, 'en');
  assert.ok(mdEs.includes('Contenido en Español Nativo de prueba'));
  assert.ok(mdEn.includes('Block 1: Visceral Hook'));
});
