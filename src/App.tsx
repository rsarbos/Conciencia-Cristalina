import { useEffect, useState } from 'react';
import {
  BookChapter,
  BookProjectState,
  ChapterVideoPackage,
  FoundationPillar,
  ReaderCohortMetric,
  RetailChannelMetric,
  SocialMediaPost,
} from './types/book';
import { INITIAL_BOOK_PROJECT } from './utils/seedData';
import {
  calculateManuscriptProgress,
  calculateNYTBestsellerReadiness,
  compileFullManuscriptMarkdown,
} from './utils/bookLogic';
import { FoundationsVault } from './components/FoundationsVault';
import { DailyChapterStudio } from './components/DailyChapterStudio';
import { SocialCampaignLab } from './components/SocialCampaignLab';
import { ManuscriptCompiler } from './components/ManuscriptCompiler';
import { NYTBestsellerCommand } from './components/NYTBestsellerCommand';

type ActiveTab =
  | 'foundations'
  | 'daily_studio'
  | 'social_lab'
  | 'manuscript'
  | 'nyt_bestseller';

const STORAGE_KEY = 'conciencia_cristalina_studio_clean_v2';

export default function App() {
  const [project, setProject] = useState<BookProjectState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.foundations) && Array.isArray(parsed.chapters)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read saved book state:', e);
    }
    return INITIAL_BOOK_PROJECT;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('foundations');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    project.chapters[0]?.id || 'ch-1'
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn('Could not persist book state:', e);
    }
  }, [project]);

  const progress = calculateManuscriptProgress(
    project.chapters,
    project.foundations
  );
  const nytAssessment = calculateNYTBestsellerReadiness(
    project.chapters,
    project.socialPosts,
    project.retailChannels,
    project.readerCohorts,
    project.bestsellerTasks
  );

  const handleUpdateFoundation = (updated: FoundationPillar) => {
    setProject((prev) => ({
      ...prev,
      foundations: prev.foundations.map((f) =>
        f.id === updated.id ? updated : f
      ),
    }));
  };

  const handleReplaceOrAppendChapters = (
    newChapters: BookChapter[],
    mode: 'append' | 'replace'
  ) => {
    setProject((prev) => {
      const nextChapters =
        mode === 'replace' ? newChapters : [...prev.chapters, ...newChapters];
      return {
        ...prev,
        chapters: nextChapters,
      };
    });
    if (newChapters.length > 0) {
      setSelectedChapterId(newChapters[0].id);
    }
  };

  const handleUpdateChapter = (updated: BookChapter) => {
    setProject((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) => (c.id === updated.id ? updated : c)),
    }));
  };

  const handleAddChapter = (newChapter: BookChapter) => {
    setProject((prev) => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
    }));
  };

  const handleSaveChapterToManuscript = (chapterId: string) => {
    setProject((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) =>
        c.id === chapterId
          ? {
              ...c,
              status: 'saved_to_manuscript',
              savedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  };

  const handleToggleChapterSaved = (chapterId: string) => {
    setProject((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) =>
        c.id === chapterId
          ? {
              ...c,
              status:
                c.status === 'saved_to_manuscript'
                  ? 'drafting'
                  : 'saved_to_manuscript',
              savedAt:
                c.status === 'saved_to_manuscript'
                  ? c.savedAt
                  : new Date().toISOString(),
            }
          : c
      ),
    }));
  };

  const handleGenerateSocialForChapter = async (
    chapter: BookChapter,
    options?: { stayOnCurrentTab?: boolean }
  ) => {
    try {
      const res = await fetch('/api/editorial/generate-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter,
          foundations: project.foundations,
          bookTitle: project.title,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.posts) && data.posts.length > 0) {
        setProject((prev) => {
          const otherChapterPosts = prev.socialPosts.filter(
            (p) => p.chapterId !== chapter.id
          );
          return {
            ...prev,
            socialPosts: [...data.posts, ...otherChapterPosts],
          };
        });
        setSelectedChapterId(chapter.id);
        if (!options?.stayOnCurrentTab) {
          setActiveTab('social_lab');
        }
      }
    } catch (error) {
      console.error('Error generating social campaign:', error);
    }
  };

  const handleUpdateSocialPost = (updated: SocialMediaPost) => {
    setProject((prev) => ({
      ...prev,
      socialPosts: prev.socialPosts.map((p) =>
        p.id === updated.id ? updated : p
      ),
    }));
  };

  const handleAddSocialPost = (newPost: SocialMediaPost) => {
    setProject((prev) => ({
      ...prev,
      socialPosts: [newPost, ...prev.socialPosts],
    }));
  };

  const handleUpdateProjectMeta = (meta: {
    title?: string;
    subtitle?: string;
    authorName?: string;
    targetPubDate?: string;
  }) => {
    setProject((prev) => ({
      ...prev,
      ...meta,
    }));
  };

  const handleUpdateRetailChannel = (updated: RetailChannelMetric) => {
    setProject((prev) => ({
      ...prev,
      retailChannels: prev.retailChannels.map((c) =>
        c.id === updated.id ? updated : c
      ),
    }));
  };

  const handleUpdateReaderCohort = (updated: ReaderCohortMetric) => {
    setProject((prev) => ({
      ...prev,
      readerCohorts: prev.readerCohorts.map((c) =>
        c.id === updated.id ? updated : c
      ),
    }));
  };

  const handleToggleBestsellerTask = (taskId: string) => {
    setProject((prev) => ({
      ...prev,
      bestsellerTasks: prev.bestsellerTasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const handleUpdateVideoPackage = (
    chapterId: string,
    pkg: ChapterVideoPackage
  ) => {
    setProject((prev) => ({
      ...prev,
      videoPackages: {
        ...(prev.videoPackages || {}),
        [chapterId]: pkg,
      },
    }));
  };

  const handleQuickExportManuscript = () => {
    const md = compileFullManuscriptMarkdown(project, false);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    a.href = url;
    a.download = `${safeTitle}_final_manuscript.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-stone-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-stone-200 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('foundations');
          }}
          className="text-lg font-bold tracking-tight text-stone-900 font-serif-display whitespace-nowrap shrink-0"
        >
          Opus Magna
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600"
        >
          <button
            type="button"
            onClick={() => setActiveTab('foundations')}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'foundations'
                ? 'text-stone-900 underline underline-offset-8 decoration-2 decoration-amber-900'
                : ''
            }`}
          >
            Foundations &amp; Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('daily_studio')}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'daily_studio'
                ? 'text-stone-900 underline underline-offset-8 decoration-2 decoration-amber-900'
                : ''
            }`}
          >
            Daily Chapter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('social_lab')}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'social_lab'
                ? 'text-stone-900 underline underline-offset-8 decoration-2 decoration-amber-900'
                : ''
            }`}
          >
            Social Campaign
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manuscript')}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'manuscript'
                ? 'text-stone-900 underline underline-offset-8 decoration-2 decoration-amber-900'
                : ''
            }`}
          >
            Manuscript
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nyt_bestseller')}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'nyt_bestseller'
                ? 'text-stone-900 underline underline-offset-8 decoration-2 decoration-amber-900'
                : ''
            }`}
          >
            NYT Bestseller
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleQuickExportManuscript}
            className="px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
          >
            Export Manuscript
          </button>
        </div>
      </header>

      {/* Mobile Navigation Strip */}
      <nav
        aria-label="Mobile Workspace Navigation"
        className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-white border-b border-stone-200 text-xs font-medium"
      >
        <button
          type="button"
          onClick={() => setActiveTab('foundations')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'foundations'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600'
          }`}
        >
          Foundations &amp; Map
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('daily_studio')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'daily_studio'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600'
          }`}
        >
          Daily Chapter
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social_lab')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'social_lab'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600'
          }`}
        >
          Social Campaign
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manuscript')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'manuscript'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600'
          }`}
        >
          Manuscript
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nyt_bestseller')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'nyt_bestseller'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600'
          }`}
        >
          NYT Bestseller
        </button>
      </nav>

      {/* Executive Book Telemetry & Correspondent Time Bar */}
      <div className="bg-[#F5F2EB] border-b border-stone-200 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-stone-700">
          <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto">
            <span className="font-semibold text-stone-900">
              {project.title}
            </span>
            <span aria-hidden="true">·</span>
            <span>{project.authorName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {progress.savedChaptersCount}/{progress.totalChaptersCount} Chapters Saved ({progress.totalWordsWritten.toLocaleString()} w)
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {project.socialPosts.length} Social Dispatches
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs whitespace-nowrap overflow-x-auto">
            <span className="font-semibold text-amber-900">
              NYT Directive:
            </span>
            <span className="truncate max-w-sm">
              {nytAssessment.immediateDirectiveTitle}
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('nyt_bestseller')}
              className="font-mono-tabular font-semibold text-stone-900 hover:underline whitespace-nowrap shrink-0"
            >
              {nytAssessment.week1ProjectedUnits.toLocaleString()} / 10,000 Wk-1 Units →
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'foundations' && (
          <FoundationsVault
            foundations={project.foundations}
            chapters={project.chapters}
            onUpdateFoundation={handleUpdateFoundation}
            onReplaceOrAppendChapters={handleReplaceOrAppendChapters}
            onSelectChapterToWrite={(chapterId) => {
              setSelectedChapterId(chapterId);
              setActiveTab('daily_studio');
            }}
          />
        )}

        {activeTab === 'daily_studio' && (
          <DailyChapterStudio
            bookTitle={project.title}
            chapters={project.chapters}
            foundations={project.foundations}
            selectedChapterId={selectedChapterId}
            onSelectChapter={setSelectedChapterId}
            onUpdateChapter={handleUpdateChapter}
            onAddChapter={handleAddChapter}
            onSaveToManuscript={handleSaveChapterToManuscript}
            onGenerateSocialForChapter={handleGenerateSocialForChapter}
            videoPackages={project.videoPackages || {}}
            onUpdateVideoPackage={handleUpdateVideoPackage}
          />
        )}

        {activeTab === 'social_lab' && (
          <SocialCampaignLab
            bookTitle={project.title}
            chapters={project.chapters}
            socialPosts={project.socialPosts}
            selectedChapterId={selectedChapterId}
            onSelectChapter={setSelectedChapterId}
            onGeneratePostsForChapter={handleGenerateSocialForChapter}
            onUpdatePost={handleUpdateSocialPost}
            onAddPost={handleAddSocialPost}
          />
        )}

        {activeTab === 'manuscript' && (
          <ManuscriptCompiler
            project={project}
            onUpdateProjectMeta={handleUpdateProjectMeta}
            onToggleChapterSaved={handleToggleChapterSaved}
            onOpenChapterInStudio={(chapterId) => {
              setSelectedChapterId(chapterId);
              setActiveTab('daily_studio');
            }}
          />
        )}

        {activeTab === 'nyt_bestseller' && (
          <NYTBestsellerCommand
            bookTitle={project.title}
            chapters={project.chapters}
            socialPosts={project.socialPosts}
            retailChannels={project.retailChannels}
            readerCohorts={project.readerCohorts}
            bestsellerTasks={project.bestsellerTasks}
            onUpdateRetailChannel={handleUpdateRetailChannel}
            onUpdateReaderCohort={handleUpdateReaderCohort}
            onToggleBestsellerTask={handleToggleBestsellerTask}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            Conciencia Cristalina — Orient &amp; Architect · Yael Axel Cruz Cebreros &amp; AInvisible Friends
          </div>
          <div className="flex items-center gap-4 font-mono-tabular">
            <span>5 Pilares Fundacionales</span>
            <span aria-hidden="true">·</span>
            <span>{project.chapters.length} Capítulos (Kits ES + EN)</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setProject(INITIAL_BOOK_PROJECT);
              }}
              className="text-stone-600 hover:text-stone-900 underline"
            >
              Limpiar / Reiniciar Espacio en Blanco
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
