import React, { useState } from 'react';
import { BookProjectState, LanguageCode } from '../types/book';
import {
  calculateManuscriptProgress,
  compileFullManuscriptMarkdown,
  countWords,
} from '../utils/bookLogic';
import {
  BOOK_COVER_ASSET,
  AUTHOR_AVATAR_ASSET,
} from '../utils/seedData';
import {
  Download,
  FileCode,
  FileText,
  BookCheck,
  Check,
  BookOpen,
  Globe,
} from 'lucide-react';

interface ManuscriptCompilerProps {
  project: BookProjectState;
  onUpdateProjectMeta: (meta: {
    title?: string;
    subtitle?: string;
    authorName?: string;
    targetPubDate?: string;
  }) => void;
  onToggleChapterSaved: (chapterId: string) => void;
  onOpenChapterInStudio: (chapterId: string) => void;
}

export const ManuscriptCompiler: React.FC<ManuscriptCompilerProps> = ({
  project,
  onUpdateProjectMeta,
  onToggleChapterSaved,
  onOpenChapterInStudio,
}) => {
  const [includeDraftsInExport, setIncludeDraftsInExport] = useState(false);
  const [exportLang, setExportLang] = useState<LanguageCode>('es');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const progress = calculateManuscriptProgress(
    project.chapters,
    project.foundations
  );

  const compiledMarkdown = compileFullManuscriptMarkdown(
    project,
    includeDraftsInExport,
    exportLang
  );

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportNotice(`Exported "${filename}" (${content.length.toLocaleString()} bytes).`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  const handleExportMarkdown = () => {
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    triggerDownload(
      `${safeTitle}_manuscript_${exportLang}.md`,
      compiledMarkdown,
      'text/markdown;charset=utf-8'
    );
  };

  const handleExportHtmlBook = () => {
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const htmlContent = `<!doctype html>
<html lang="${exportLang}">
<head>
  <meta charset="utf-8" />
  <title>${project.title} (${exportLang.toUpperCase()}) — Complete Typeset Manuscript</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 3rem auto; padding: 0 1.5rem; line-height: 1.75; color: #1c1917; background: #fbf9f5; }
    h1, h2, h3 { font-family: Georgia, serif; color: #0c0a09; }
    hr { border: none; border-top: 1px solid #d6d3d1; margin: 2.5rem 0; }
    pre { white-space: pre-wrap; font-family: Georgia, serif; }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
  <h3>${project.subtitle}</h3>
  <p><strong>By ${project.authorName}</strong> · Target Publication: ${project.targetPubDate} · Edition: ${exportLang.toUpperCase()}</p>
  <hr />
  <pre>${compiledMarkdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
    triggerDownload(
      `${safeTitle}_typeset_edition_${exportLang}.html`,
      htmlContent,
      'text/html;charset=utf-8'
    );
  };

  const handleExportDocx = () => {
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const wordDocHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${project.title}</title></head>
<body style="font-family: Georgia, serif; line-height: 1.6;">
  <h1>${project.title}</h1>
  <h3>${project.subtitle}</h3>
  <p><strong>Por ${project.authorName}</strong> · Publicación: ${project.targetPubDate} · Kit: ${exportLang.toUpperCase()}</p>
  <hr />
  <pre style="white-space: pre-wrap; font-family: Georgia, serif;">${compiledMarkdown
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
    triggerDownload(
      `${safeTitle}_final_manuscript_${exportLang}.doc`,
      wordDocHtml,
      'application/msword;charset=utf-8'
    );
  };

  const handleExportJsonArchive = () => {
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    triggerDownload(
      `${safeTitle}_complete_studio_backup.json`,
      JSON.stringify(project, null, 2),
      'application/json;charset=utf-8'
    );
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <p className="text-xs font-medium text-amber-900">
            04 · Final Manuscript Compilation &amp; Bilingual Edition Export (ES / EN)
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1 text-balance">
            Final Manuscript Assembly &amp; Galley Export
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Exporta tu manuscrito unificado tanto en el <strong>Kit Español (Nativo)</strong> como en el <strong>Kit Inglés (Native English)</strong> en formatos DOCX, Markdown o HTML/PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Bilingual Export Selector */}
          <div
            role="group"
            aria-label="Selector de Idioma de Exportación"
            className="inline-flex items-center p-1 rounded-lg bg-[#F5F2EB] border border-stone-300 text-xs font-medium"
          >
            <button
              type="button"
              onClick={() => setExportLang('es')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                exportLang === 'es'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Kit Español (ES)</span>
            </button>
            <button
              type="button"
              onClick={() => setExportLang('en')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                exportLang === 'en'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Kit English (EN)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Final Manuscript (.MD)</span>
          </button>

          <button
            type="button"
            onClick={handleExportDocx}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Word (.DOCX)</span>
          </button>

          <button
            type="button"
            onClick={handleExportHtmlBook}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export Galley / PDF (.HTML)</span>
          </button>

          <button
            type="button"
            onClick={handleExportJsonArchive}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Backup Project (.JSON)</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div
          role="status"
          className="px-4 py-3 bg-emerald-950 text-emerald-50 text-xs rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-emerald-200 hover:text-white underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Book Edition Identity & Hardcover Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Hardcover Edition Jacket Preview */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-stone-900 relative border border-stone-200">
            {!coverError ? (
              <img
                src={BOOK_COVER_ASSET}
                alt={`Hardcover book edition cover for ${project.title}`}
                referrerPolicy="no-referrer"
                onError={() => setCoverError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-stone-900 text-amber-100">
                <BookOpen className="w-10 h-10 mb-3 text-amber-400" />
                <p className="text-lg font-serif-display font-semibold">
                  {project.title}
                </p>
                <p className="text-xs text-stone-400 mt-1">{project.authorName}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-stone-200">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
              {!avatarError ? (
                <img
                  src={AUTHOR_AVATAR_ASSET}
                  alt={project.authorName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-stone-700">
                  YA
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-900 truncate">
                {project.authorName}
              </p>
              <p className="text-[11px] text-stone-500 font-mono-tabular">
                Target Release: {project.targetPubDate}
              </p>
            </div>
          </div>
        </div>

        {/* Right 8 Columns: Publication Metadata & Chapter-by-Chapter Manuscript Ledger */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200">
              <h2 className="text-base font-semibold text-stone-900">
                Edition Metadata & Manuscript Ledger
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono-tabular text-stone-600">
                <span>
                  {progress.savedChaptersCount} / {progress.totalChaptersCount} Chapters Saved
                </span>
                <span aria-hidden="true">·</span>
                <span>{progress.totalWordsWritten.toLocaleString()} Total Words</span>
                <span aria-hidden="true">·</span>
                <span>~{progress.estimatedBookPages} Est. Pages</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="book-title-input"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Book Title
                </label>
                <input
                  id="book-title-input"
                  type="text"
                  value={project.title}
                  onChange={(e) => onUpdateProjectMeta({ title: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs font-semibold text-stone-900"
                />
              </div>
              <div>
                <label
                  htmlFor="book-author-input"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Author Name
                </label>
                <input
                  id="book-author-input"
                  type="text"
                  value={project.authorName}
                  onChange={(e) =>
                    onUpdateProjectMeta({ authorName: e.target.value })
                  }
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs text-stone-900"
                />
              </div>
              <div>
                <label
                  htmlFor="book-pubdate-input"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Target Publication Date
                </label>
                <input
                  id="book-pubdate-input"
                  type="date"
                  value={project.targetPubDate}
                  onChange={(e) =>
                    onUpdateProjectMeta({ targetPubDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs font-mono-tabular text-stone-900"
                />
              </div>
            </div>

            {/* Chapter Assembly Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-[11px] font-semibold text-stone-500">
                    <th className="py-2.5 pr-3">Day / Ch.</th>
                    <th className="py-2.5 px-3">Chapter Title & Part</th>
                    <th className="py-2.5 px-3 text-right">Subtopics</th>
                    <th className="py-2.5 px-3 text-right">Word Count</th>
                    <th className="py-2.5 px-3">Manuscript State</th>
                    <th className="py-2.5 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/80 text-xs">
                  {project.chapters.map((ch) => {
                    const words = countWords(ch.manuscriptContent);
                    const doneSubs = ch.subtopics.filter((s) => s.completed).length;
                    const isSaved = ch.status === 'saved_to_manuscript';
                    return (
                      <tr key={ch.id} className="hover:bg-[#FBF9F5]">
                        <td className="py-3 pr-3 font-mono-tabular text-stone-600 whitespace-nowrap">
                          Day {ch.scheduledDay} · #{ch.number}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-stone-900">
                            {ch.title}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {ch.partTitle}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-stone-600">
                          {doneSubs}/{ch.subtopics.length}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular text-stone-900">
                          {words.toLocaleString()} / {ch.targetWordCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={
                              isSaved
                                ? 'text-emerald-800 font-semibold'
                                : 'text-stone-500'
                            }
                          >
                            {isSaved ? 'Saved in Final Export' : 'Working Draft'}
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() => onToggleChapterSaved(ch.id)}
                            className="text-xs font-medium text-stone-800 hover:underline"
                          >
                            {isSaved ? 'Unmark' : 'Save to Final'}
                          </button>
                          <span aria-hidden="true" className="text-stone-300">
                            |
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenChapterInStudio(ch.id)}
                            className="text-xs font-medium text-amber-900 hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDraftsInExport}
                onChange={(e) => setIncludeDraftsInExport(e.target.checked)}
                className="rounded border-stone-300 text-stone-900"
              />
              <span>
                Include queued & in-progress chapter outlines in compiled preview
              </span>
            </label>

            <div className="flex items-center gap-2 text-xs text-stone-500">
              <BookCheck className="w-4 h-4 text-emerald-700" />
              <span>
                All 5 Foundational Pillars automatically prepended to Architectural Prelude
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Compiled Manuscript Reader Preview */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Live Compiled Manuscript Galley Preview
            </h2>
            <p className="text-xs text-stone-500">
              Exact text included when exporting your Final Manuscript (.MD / .HTML)
            </p>
          </div>
          <span className="text-xs font-mono-tabular text-stone-500">
            {countWords(compiledMarkdown).toLocaleString()} Compiled Words
          </span>
        </div>

        <pre className="p-5 rounded-lg bg-[#FBF9F5] border border-stone-200 text-xs text-stone-800 font-sans whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
          {compiledMarkdown}
        </pre>
      </div>
    </div>
  );
};
