import React, { useState } from 'react';
import {
  BookChapter,
  SocialMediaPost,
  SocialPlatform,
} from '../types/book';
import {
  Sparkles,
  Copy,
  Check,
  Plus,
  Loader2,
} from 'lucide-react';

interface SocialCampaignLabProps {
  bookTitle: string;
  chapters: BookChapter[];
  socialPosts: SocialMediaPost[];
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onGeneratePostsForChapter: (chapter: BookChapter) => Promise<void>;
  onUpdatePost: (updated: SocialMediaPost) => void;
  onAddPost: (newPost: SocialMediaPost) => void;
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  twitter_thread: 'X Thread',
  instagram_carousel: 'Instagram',
  substack_letter: 'Substack',
  short_video_hook: 'Video Hook',
};

export const SocialCampaignLab: React.FC<SocialCampaignLabProps> = ({
  chapters,
  socialPosts,
  selectedChapterId,
  onSelectChapter,
  onGeneratePostsForChapter,
  onUpdatePost,
  onAddPost,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'all' | SocialPlatform>('all');
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('linkedin');
  const [newHook, setNewHook] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCta, setNewCta] = useState(
    'Pre-order via Barnes & Noble or Bookshop.org to unlock the Chapter Dossier.'
  );

  const activeChapter =
    chapters.find((c) => c.id === (chapterFilter === 'all' ? selectedChapterId : chapterFilter)) ||
    chapters[0];

  const filteredPosts = socialPosts.filter((post) => {
    const matchesChapter =
      chapterFilter === 'all' || post.chapterId === chapterFilter;
    const matchesPlatform =
      platformFilter === 'all' || post.platform === platformFilter;
    return matchesChapter && matchesPlatform;
  });

  const handleGenerate = async () => {
    if (!activeChapter) return;
    setIsGenerating(true);
    try {
      await onGeneratePostsForChapter(activeChapter);
      setChapterFilter(activeChapter.id);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (post: SocialMediaPost) => {
    const fullText = `${post.hook}\n\n${post.content}\n\n${post.callToAction}\n\n${post.hashtags.join(' ')}`;
    navigator.clipboard?.writeText(fullText);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateCustomPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHook.trim() || !activeChapter) return;
    const created: SocialMediaPost = {
      id: `post-custom-${Date.now()}`,
      chapterId: activeChapter.id,
      platform: newPlatform,
      hook: newHook.trim(),
      content: newContent.trim() || 'Expanded reflection from today’s manuscript chapter.',
      callToAction: newCta.trim(),
      hashtags: ['#OrientAndArchitect', '#BookLaunch', '#IntegracionDeSabidurias'],
      status: 'ready',
      scheduledDayOffset: 0,
      predictedEngagementRate: 6.9,
    };
    onAddPost(created);
    setNewHook('');
    setNewContent('');
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <p className="text-xs font-medium text-amber-900">
            03 · Irradiación Pública · Chapter-to-Audience Serialization
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1 text-balance">
            Chapter Social Media Campaign Engine
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Turn every daily chapter into five high-converting promotional dispatches across LinkedIn, X/Twitter, Instagram, Substack, and short-form video—driving pre-order velocity toward NYT-reporting bookstores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {isGenerating
                ? 'Generating 5-Platform Campaign...'
                : `Generate 5 Posts for Ch. ${activeChapter?.number}`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCreateForm ? 'Close Form' : 'New Custom Post'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-stone-200 rounded-xl p-4">
        <div className="flex items-center gap-2 shrink-0">
          <label
            htmlFor="social-chapter-select"
            className="text-xs font-semibold text-stone-700 whitespace-nowrap"
          >
            Chapter Filter:
          </label>
          <select
            id="social-chapter-select"
            value={chapterFilter}
            onChange={(e) => {
              setChapterFilter(e.target.value);
              if (e.target.value !== 'all') {
                onSelectChapter(e.target.value);
              }
            }}
            className="rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-1.5 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-900"
          >
            <option value="all">All Chapters ({socialPosts.length} Posts)</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                Ch. {ch.number}: {ch.title}
              </option>
            ))}
          </select>
        </div>

        {/* Segmented Platform Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setPlatformFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              platformFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Platforms
          </button>
          {(Object.keys(PLATFORM_LABELS) as SocialPlatform[]).map((plat) => (
            <button
              key={plat}
              type="button"
              onClick={() => setPlatformFilter(plat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                platformFilter === plat
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {PLATFORM_LABELS[plat]}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Custom Post Creator */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateCustomPost}
          className="bg-white border border-stone-300 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">
              Create Bespoke Social Post for Chapter {activeChapter?.number}:{' '}
              {activeChapter?.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="new-post-platform"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Platform
              </label>
              <select
                id="new-post-platform"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs text-stone-900"
              >
                {(Object.keys(PLATFORM_LABELS) as SocialPlatform[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="new-post-hook"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Opening Hook
              </label>
              <input
                id="new-post-hook"
                type="text"
                value={newHook}
                onChange={(e) => setNewHook(e.target.value)}
                placeholder="Scroll-stopping opening line from this chapter..."
                className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs text-stone-900"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="new-post-body"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Post Body / Thread Script
            </label>
            <textarea
              id="new-post-body"
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Core insights, subtopic takeaways, and wisdom integration..."
              className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] p-3 text-xs text-stone-900"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              type="text"
              value={newCta}
              onChange={(e) => setNewCta(e.target.value)}
              aria-label="Pre-order Call to Action"
              className="flex-1 rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-xs text-stone-900"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 whitespace-nowrap shrink-0"
            >
              Save Social Post
            </button>
          </div>
        </form>
      )}

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-stone-900">
            No social campaign posts generated for this selection yet.
          </p>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            Click below to synthesize 5 platform-native promotional posts directly from Chapter {activeChapter?.number} and your Manifiesto y Metodología.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate 5-Platform Campaign Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPosts.map((post) => {
            const ch = chapters.find((c) => c.id === post.chapterId);
            return (
              <div
                key={post.id}
                className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Unboxed clean metadata header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 pb-2.5 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-900">
                        {PLATFORM_LABELS[post.platform]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Ch. {ch?.number || 1}: {ch?.title}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        Est. CTR {post.predictedEngagementRate}%
                      </span>
                    </div>

                    <select
                      aria-label={`Status for ${PLATFORM_LABELS[post.platform]} post`}
                      value={post.status}
                      onChange={(e) =>
                        onUpdatePost({
                          ...post,
                          status: e.target.value as SocialMediaPost['status'],
                        })
                      }
                      className="text-xs font-medium text-stone-800 bg-[#FBF9F5] border border-stone-300 rounded-md px-2 py-1"
                    >
                      <option value="draft">Status: Draft</option>
                      <option value="ready">Status: Ready</option>
                      <option value="scheduled">Status: Scheduled</option>
                      <option value="published">Status: Published</option>
                    </select>
                  </div>

                  {/* Hook */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Opening Hook
                    </label>
                    <input
                      type="text"
                      value={post.hook}
                      onChange={(e) =>
                        onUpdatePost({ ...post, hook: e.target.value })
                      }
                      aria-label="Post opening hook"
                      className="w-full rounded-lg border border-stone-200 bg-[#FBF9F5] px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  {/* Post Content */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Post Script & Chapter Synthesis
                    </label>
                    <textarea
                      rows={6}
                      value={post.content}
                      onChange={(e) =>
                        onUpdatePost({ ...post, content: e.target.value })
                      }
                      aria-label="Post content"
                      className="w-full rounded-lg border border-stone-200 bg-[#FBF9F5] p-3 text-xs text-stone-800 leading-relaxed focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  {/* Pre-Order Call to Action */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      NYT Pre-Order Call to Action
                    </label>
                    <input
                      type="text"
                      value={post.callToAction}
                      onChange={(e) =>
                        onUpdatePost({ ...post, callToAction: e.target.value })
                      }
                      aria-label="Post call to action"
                      className="w-full rounded-lg border border-stone-200 bg-[#FBF9F5] px-3 py-1.5 text-xs text-amber-950 font-medium focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* Footer: Hashtags & Copy Button */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-stone-500 truncate">
                    {post.hashtags.join('  ')}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(post)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedId === post.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Post</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Post</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
