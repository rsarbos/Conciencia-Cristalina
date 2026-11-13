import React, { useState } from 'react';
import {
  BookChapter,
  FoundationId,
  FoundationPillar,
} from '../types/book';
import {
  countWords,
  extractKeyPrinciples,
  parseSyllabusTextToChapters,
} from '../utils/bookLogic';
import {
  Upload,
  FileText,
  Check,
  Plus,
  Sparkles,
  BookOpen,
  Layers,
  Compass,
  ScrollText,
  Scale,
} from 'lucide-react';

interface FoundationsVaultProps {
  foundations: FoundationPillar[];
  chapters: BookChapter[];
  onUpdateFoundation: (updated: FoundationPillar) => void;
  onReplaceOrAppendChapters: (newChapters: BookChapter[], mode: 'append' | 'replace') => void;
  onSelectChapterToWrite: (chapterId: string) => void;
}

const SAMPLE_SYLLABUS_TEMPLATE = `Fase 1 · El Despertar y la Deconstrucción del Ego
Capítulo 1: El Espejo de la Conciencia Cristalina — De la Matrix Reactiva a la Soberanía del Observador
- El Diagnóstico de la Fragmentación y el Espejo Interior
- Física de la Conciencia y Coherencia del Observador
- La Verdad Incómoda: Responsabilidad sin Culpa
- Protocolo Práctico: Conciencia en Acción en 3 Pasos

Fase 2 · Física de la Conciencia y el Espejo Interior
Capítulo 2: La Frecuencia del Observador Interno — Cómo la Atención Colapsa el Caos
- La Sala de Espejos y la Proyección Inconsciente
- Neurobiología Predictiva y Coherencia de Fase
- Salir del Victimismo sin Caer en la Culpa
- Ejercicio Práctico de Recalibración Matutina

Fase 3 · Salida de la Matrix Reactiva y Soberanía
Capítulo 3: Arquitectura de la Soberanía Mental — Diseñando tu Propia Catedral Interior
- Por Qué Fracasan los Hábitos Superficiales sin Mapa Estructural
- Cibernética de Segundo Orden: El Arquitecto Dentro del Sistema
- Las 3 Leyes de la Responsabilidad Soberana
- Protocolo del Bloque Ininterrumpido de 90 Minutos`;

export const FoundationsVault: React.FC<FoundationsVaultProps> = ({
  foundations,
  chapters,
  onUpdateFoundation,
  onReplaceOrAppendChapters,
  onSelectChapterToWrite,
}) => {
  const [activePillarId, setActivePillarId] = useState<FoundationId>('master_guide');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [syllabusInput, setSyllabusInput] = useState('');
  const [newKeyPrinciple, setNewKeyPrinciple] = useState('');
  const [dropFeedback, setDropFeedback] = useState<string | null>(null);

  const activePillar =
    foundations.find((f) => f.id === activePillarId) || foundations[0];

  const handleFileRead = (file: File, targetPillarId?: FoundationId) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      if (!text.trim()) return;

      // Check if user dropped into syllabus parser or a specific foundation pillar
      const target =
        targetPillarId ||
        (file.name.toLowerCase().includes('mapa') || file.name.toLowerCase().includes('map')
          ? 'structural_map'
          : file.name.toLowerCase().includes('manifiesto')
          ? 'manifiesto_metodologia'
          : file.name.toLowerCase().includes('teorico')
          ? 'fundamentos_teoricos'
          : file.name.toLowerCase().includes('sabiduria')
          ? 'integracion_sabidurias'
          : activePillar.id);

      const pillarToUpdate = foundations.find((f) => f.id === target) || activePillar;
      const extractedPrinciples = extractKeyPrinciples(text, 4);

      onUpdateFoundation({
        ...pillarToUpdate,
        content: text,
        fileOrigin: file.name,
        lastUpdated: new Date().toISOString().split('T')[0],
        keyPrinciples:
          extractedPrinciples.length > 0
            ? extractedPrinciples
            : pillarToUpdate.keyPrinciples,
      });

      setActivePillarId(pillarToUpdate.id);
      setDropFeedback(
        `Loaded "${file.name}" (${countWords(text).toLocaleString()} words) into ${pillarToUpdate.title}.`
      );
      setTimeout(() => setDropFeedback(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileRead(files[0], activePillar.id);
    }
  };

  const handleParseSyllabus = (mode: 'append' | 'replace') => {
    const raw = syllabusInput.trim();
    if (!raw) return;
    const baseCount = mode === 'append' ? chapters.length : 0;
    const parsed = parseSyllabusTextToChapters(raw, baseCount);
    if (parsed.length === 0) return;
    onReplaceOrAppendChapters(parsed, mode);
    setSyllabusInput('');
    setDropFeedback(
      `Parsed ${parsed.length} daily chapters and ${parsed.reduce(
        (acc, c) => acc + c.subtopics.length,
        0
      )} subtopics into your Daily Chapter Queue.`
    );
    setTimeout(() => setDropFeedback(null), 5000);
  };

  const handleAddPrinciple = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyPrinciple.trim()) return;
    onUpdateFoundation({
      ...activePillar,
      keyPrinciples: [...activePillar.keyPrinciples, newKeyPrinciple.trim()],
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    setNewKeyPrinciple('');
  };

  const getPillarIcon = (id: FoundationId) => {
    switch (id) {
      case 'master_guide':
        return <BookOpen className="w-4 h-4 text-amber-800 shrink-0" />;
      case 'structural_map':
        return <Compass className="w-4 h-4 text-amber-800 shrink-0" />;
      case 'manifiesto_metodologia':
        return <ScrollText className="w-4 h-4 text-amber-800 shrink-0" />;
      case 'fundamentos_teoricos':
        return <Scale className="w-4 h-4 text-amber-800 shrink-0" />;
      case 'integracion_sabidurias':
        return <Layers className="w-4 h-4 text-amber-800 shrink-0" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <p className="text-xs font-medium text-amber-900 tracking-wide">
            01 · Architectural Prelude & Syllabus Ingestion
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1 text-balance">
            Book Foundations & Full Topics Architecture
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Drop or refine your five foundational pillars—Master Guide, Structural Map (Visión General), Manifiesto y Metodología, Fundamentos Teóricos, and Integración de Sabidurías—and parse your full Topics & Subtopics syllabus into daily chapters.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-600 font-mono-tabular shrink-0">
          <span>
            {foundations.filter((f) => countWords(f.content) >= 25).length} / 5 Pillars Ready
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {foundations
              .reduce((sum, f) => sum + countWords(f.content), 0)
              .toLocaleString()}{' '}
            Foundation Words
          </span>
          <span aria-hidden="true">·</span>
          <span>{chapters.length} Scheduled Chapters</span>
        </div>
      </div>

      {dropFeedback && (
        <div
          role="status"
          className="px-4 py-3 bg-emerald-950 text-emerald-50 text-sm rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dropFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setDropFeedback(null)}
            className="text-xs text-emerald-200 hover:text-white underline ml-4 whitespace-nowrap shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 12-Col Split: 5 Foundational Pillars Selector + Active Pillar Dropzone & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Columns: The 5 Core Foundational Pillars */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-xs font-semibold text-stone-500">
              Five Core Foundational Documents
            </h2>
            <span className="text-xs text-stone-400 font-mono-tabular">
              Select to inspect or drop
            </span>
          </div>

          {foundations.map((pillar, index) => {
            const isSelected = pillar.id === activePillar.id;
            const words = countWords(pillar.content);
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActivePillarId(pillar.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-white border-stone-900 shadow-xs'
                    : 'bg-[#F5F2EB]/70 border-stone-200/90 hover:bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getPillarIcon(pillar.id)}
                    <span className="text-xs font-mono-tabular text-stone-500">
                      0{index + 1}.
                    </span>
                    <span className="text-sm font-semibold text-stone-900">
                      {pillar.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono-tabular text-stone-500 shrink-0">
                    {words.toLocaleString()} w
                  </span>
                </div>
                <p className="text-xs font-medium text-amber-900 mt-1">
                  {pillar.spanishTitle}
                </p>
                <p className="text-xs text-stone-600 mt-1.5 line-clamp-2">
                  {pillar.subtitle}
                </p>
                <div className="flex items-center gap-2 mt-3 text-[11px] text-stone-500 font-mono-tabular">
                  <span>{pillar.fileOrigin || 'Manual Entry'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Updated {pillar.lastUpdated}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 8 Columns: Active Pillar Dropzone, Full Text Editor & Extracted Principles */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                <span>{activePillar.spanishTitle}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {countWords(activePillar.content).toLocaleString()} words
                </span>
              </div>
              <h2 className="text-xl font-semibold text-stone-900 mt-0.5">
                {activePillar.title}
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                {activePillar.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-stone-900 text-stone-50 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Drop or Upload .MD / .TXT</span>
                <input
                  type="file"
                  accept=".md,.txt,.json"
                  className="sr-only"
                  aria-label={`Upload file for ${activePillar.title}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileRead(file, activePillar.id);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Drag-and-Drop Surface */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            className={`p-4 rounded-lg border border-dashed transition-colors flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDraggingOver
                ? 'border-amber-800 bg-amber-50/60'
                : 'border-stone-300 bg-[#FBF9F5]'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-900 shrink-0" />
              <div className="text-xs text-stone-600">
                <span className="font-semibold text-stone-900">
                  Drag & drop your {activePillar.title} document here
                </span>{' '}
                or edit the foundational manuscript directly below. Every daily chapter and social post draws from this text.
              </div>
            </div>
            <span className="text-xs font-mono-tabular text-stone-500 whitespace-nowrap shrink-0">
              {activePillar.fileOrigin || 'Live Buffer'}
            </span>
          </div>

          {/* Pillar Content Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="pillar-content-textarea"
                className="text-xs font-semibold text-stone-700"
              >
                Foundational Document Content ({activePillar.title})
              </label>
              <button
                type="button"
                onClick={() => {
                  const extracted = extractKeyPrinciples(activePillar.content, 4);
                  if (extracted.length > 0) {
                    onUpdateFoundation({
                      ...activePillar,
                      keyPrinciples: extracted,
                      lastUpdated: new Date().toISOString().split('T')[0],
                    });
                    setDropFeedback(
                      `Refreshed ${extracted.length} core principles from ${activePillar.title}.`
                    );
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 hover:text-amber-700 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extract Core Principles from Text</span>
              </button>
            </div>
            <textarea
              id="pillar-content-textarea"
              rows={11}
              value={activePillar.content}
              onChange={(e) =>
                onUpdateFoundation({
                  ...activePillar,
                  content: e.target.value,
                  lastUpdated: new Date().toISOString().split('T')[0],
                })
              }
              placeholder={`Paste or drop the full ${activePillar.title} (${activePillar.spanishTitle}) overview here...`}
              className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] p-4 text-sm text-stone-900 leading-relaxed focus:outline-none focus:border-stone-900 font-sans"
            />
          </div>

          {/* Governing Principles List for this Pillar */}
          <div className="pt-2 border-t border-stone-200">
            <h3 className="text-xs font-semibold text-stone-700 mb-3">
              Key Directives & Thesis Anchors ({activePillar.keyPrinciples.length})
            </h3>
            <ul className="space-y-2 mb-4">
              {activePillar.keyPrinciples.map((principle, idx) => (
                <li
                  key={idx}
                  className="flex items-start justify-between gap-3 text-xs text-stone-700 bg-[#FBF9F5] px-3.5 py-2.5 rounded-lg border border-stone-200/80"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono-tabular text-amber-900 font-semibold">
                      0{idx + 1}.
                    </span>
                    <span className="leading-relaxed">{principle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateFoundation({
                        ...activePillar,
                        keyPrinciples: activePillar.keyPrinciples.filter(
                          (_, i) => i !== idx
                        ),
                      })
                    }
                    className="text-stone-400 hover:text-red-700 text-xs whitespace-nowrap shrink-0"
                    aria-label={`Remove principle ${idx + 1}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddPrinciple} className="flex items-center gap-2">
              <input
                type="text"
                value={newKeyPrinciple}
                onChange={(e) => setNewKeyPrinciple(e.target.value)}
                placeholder={`Add a key principle or rule to ${activePillar.title}...`}
                aria-label="New key principle"
                className="flex-1 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-stone-100 text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Principle</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Section: Full Topics & Subtopics Syllabus Importer & Structural Map Queue */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <p className="text-xs font-medium text-amber-900">
              02 · Full Topics & Subtopics Syllabus Engine
            </p>
            <h2 className="text-xl font-semibold text-stone-900 mt-0.5">
              Drop Full Book Topics & Subtopics to Schedule Daily Chapters
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Paste or drop your complete book outline (Parts, Chapters/Topics, and bulleted Subtopics). The parser automatically maps each topic to a scheduled day with subtopic checklists.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSyllabusInput(SAMPLE_SYLLABUS_TEMPLATE)}
              className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-lg hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0"
            >
              Load Sample Syllabus Outline
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Syllabus Input Parser */}
          <div className="lg:col-span-5 space-y-3">
            <label
              htmlFor="syllabus-outline-input"
              className="block text-xs font-semibold text-stone-700"
            >
              Topics & Subtopics Outline Input
            </label>
            <textarea
              id="syllabus-outline-input"
              rows={9}
              value={syllabusInput}
              onChange={(e) => setSyllabusInput(e.target.value)}
              placeholder={`Example format:\nPart I: Vision General\nChapter 7: The Architecture of Wisdom — Subtitle\n- Subtopic 1: Epistemological roots\n- Subtopic 2: Practical synthesis\n- Subtopic 3: Daily protocol`}
              className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] p-3.5 text-xs text-stone-900 font-mono leading-relaxed focus:outline-none focus:border-stone-900"
            />
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleParseSyllabus('append')}
                disabled={!syllabusInput.trim()}
                className="px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
              >
                Append to Daily Chapter Queue
              </button>
              <button
                type="button"
                onClick={() => handleParseSyllabus('replace')}
                disabled={!syllabusInput.trim()}
                className="px-3.5 py-2 text-xs font-medium bg-white text-stone-800 border border-stone-300 rounded-lg hover:bg-stone-100 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
              >
                Replace Entire Queue
              </button>
            </div>
          </div>

          {/* Current Topics & Subtopics Map Overview */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-700">
                Active Book Architecture ({chapters.length} Daily Chapters Mapped)
              </h3>
              <span className="text-xs text-stone-500 font-mono-tabular">
                {chapters.reduce((s, c) => s + c.subtopics.length, 0)} Total Subtopics
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {chapters.map((ch) => {
                const words = countWords(ch.manuscriptContent);
                return (
                  <div
                    key={ch.id}
                    className="p-3.5 rounded-lg border border-stone-200 bg-[#FBF9F5] flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 font-mono-tabular">
                        <span>
                          Day {ch.scheduledDay} · Ch. {ch.number}
                        </span>
                        <span>
                          {ch.status === 'saved_to_manuscript'
                            ? 'Saved to Manuscript'
                            : ch.status === 'drafting'
                            ? 'Drafting'
                            : 'Queued'}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-stone-900 mt-1">
                        {ch.title}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                        {ch.subtitle}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {ch.subtopics.map((sub, sIdx) => (
                          <li
                            key={sub.id}
                            className="text-[11px] text-stone-600 truncate"
                          >
                            <span className="font-mono-tabular text-stone-400">
                              {ch.number}.{sIdx + 1}
                            </span>{' '}
                            {sub.title}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
                      <span className="font-mono-tabular text-stone-500">
                        {words.toLocaleString()} / {ch.targetWordCount.toLocaleString()} w
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectChapterToWrite(ch.id)}
                        className="font-medium text-amber-900 hover:underline whitespace-nowrap shrink-0"
                      >
                        Open in Daily Studio →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
