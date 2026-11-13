import React, { useState } from 'react';
import {
  BestsellerPhaseTask,
  BookChapter,
  ReaderCohortMetric,
  RetailChannelMetric,
  SocialMediaPost,
} from '../types/book';
import { calculateNYTBestsellerReadiness } from '../utils/bookLogic';
import {
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Compass,
  Users,
  Store,
  Plus,
  Loader2,
} from 'lucide-react';

interface NYTBestsellerCommandProps {
  bookTitle: string;
  chapters: BookChapter[];
  socialPosts: SocialMediaPost[];
  retailChannels: RetailChannelMetric[];
  readerCohorts: ReaderCohortMetric[];
  bestsellerTasks: BestsellerPhaseTask[];
  onUpdateRetailChannel: (updated: RetailChannelMetric) => void;
  onUpdateReaderCohort: (updated: ReaderCohortMetric) => void;
  onToggleBestsellerTask: (taskId: string) => void;
}

export const NYTBestsellerCommand: React.FC<NYTBestsellerCommandProps> = ({
  bookTitle,
  chapters,
  socialPosts,
  retailChannels,
  readerCohorts,
  bestsellerTasks,
  onUpdateRetailChannel,
  onUpdateReaderCohort,
  onToggleBestsellerTask,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    retailChannels[0]?.id || 'ret-bn'
  );
  const [batchPreorderAdd, setBatchPreorderAdd] = useState<string>('250');
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  const assessment = calculateNYTBestsellerReadiness(
    chapters,
    socialPosts,
    retailChannels,
    readerCohorts,
    bestsellerTasks
  );

  const handleLogPreorderBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(batchPreorderAdd, 10);
    if (isNaN(amount) || amount <= 0) return;
    const channel = retailChannels.find((c) => c.id === selectedChannelId);
    if (!channel) return;
    onUpdateRetailChannel({
      ...channel,
      currentPreorders: channel.currentPreorders + amount,
      weeklyVelocity: channel.weeklyVelocity + Math.round(amount * 0.25),
    });
  };

  const handleRequestAdvisorBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const savedChaptersCount = chapters.filter(
        (c) => c.status === 'saved_to_manuscript'
      ).length;
      const response = await fetch('/api/editorial/bestseller-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle,
          week1ProjectedUnits: assessment.week1ProjectedUnits,
          indieAndBnSharePct: assessment.indieAndBnSharePct,
          savedChaptersCount,
          totalChaptersCount: chapters.length,
          funnelProjectedPreorders: assessment.funnelProjectedPreorders,
        }),
      });
      const data = await response.json();
      if (data.briefing) {
        setAiBriefing(data.briefing);
      }
    } catch (error) {
      console.error('Advisor error:', error);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const unitGap = Math.max(
    0,
    assessment.nytThresholdUnits - assessment.week1ProjectedUnits
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <p className="text-xs font-medium text-amber-900">
            05 · New York Times Bestseller Intelligence & Reader Funnel
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1 text-balance">
            #1 NYT Bestseller Marketing Analytics & Timed Launch Playbook
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Real-time pre-order velocity across NYT-reporting bookstores, reader engagement funnel attribution, and timed strategic directives calibrated to your manuscript progress.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRequestAdvisorBriefing}
          disabled={isGeneratingBriefing}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
        >
          {isGeneratingBriefing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>
            {isGeneratingBriefing
              ? 'Analyzing Velocity & Funnel...'
              : 'Generate Weekly NYT Strategy Briefing'}
          </span>
        </button>
      </div>

      {/* Correspondent Time Directive Banner */}
      <div className="bg-white border border-stone-900 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 shrink-0" />
            <span>Correspondent Time Directive · {assessment.activeDirectivePhase}</span>
          </div>
          <span className="font-mono-tabular text-stone-600">
            Overall Bestseller Readiness: {assessment.overallReadinessIndex}%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-1.5">
            <h2 className="text-lg font-semibold text-stone-900">
              Immediate Next Action: {assessment.immediateDirectiveTitle}
            </h2>
            <p className="text-xs text-stone-700 leading-relaxed">
              {assessment.immediateDirectiveInstruction}
            </p>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-stone-200 lg:pl-6">
            <div>
              <p className="text-[11px] text-stone-500">Week-1 Verified Units</p>
              <p className="text-xl font-semibold font-mono-tabular text-stone-900 mt-0.5">
                {assessment.week1ProjectedUnits.toLocaleString()}{' '}
                <span className="text-xs font-normal text-stone-500">/ 10,000</span>
              </p>
              <p className="text-[11px] text-amber-900 font-mono-tabular mt-0.5">
                {unitGap > 0
                  ? `${unitGap.toLocaleString()} units to #1 lock`
                  : 'Threshold Surpassed'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-stone-500">B&N + Indie Share</p>
              <p className="text-xl font-semibold font-mono-tabular text-stone-900 mt-0.5">
                {assessment.indieAndBnSharePct}%
              </p>
              <p className="text-[11px] text-emerald-800 font-mono-tabular mt-0.5">
                Target &ge; 38% (NYT Panel Safe)
              </p>
            </div>
          </div>
        </div>

        {aiBriefing && (
          <div className="mt-4 pt-4 border-t border-stone-200 bg-[#FBF9F5] p-4 rounded-lg text-xs text-stone-800 space-y-2 leading-relaxed">
            {aiBriefing
              .split('\n')
              .map((line) => line.replace(/^#{1,4}\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim())
              .filter(Boolean)
              .map((cleanLine, idx) => (
                <p
                  key={idx}
                  className={idx === 0 ? 'font-semibold text-stone-900 text-sm' : 'text-stone-700'}
                >
                  {cleanLine}
                </p>
              ))}
          </div>
        )}
      </div>

      {/* 4-Column Quantitative KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500">
            Week-1 Pre-Order Velocity vs. NYT #1 Target
          </p>
          <p className="text-2xl font-semibold font-mono-tabular text-stone-900 mt-1">
            {assessment.velocityScorePct}%
          </p>
          <p className="text-xs text-stone-600 mt-1 font-mono-tabular">
            {assessment.week1ProjectedUnits.toLocaleString()} of 10,000 hardcover units
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500">
            NYT Retail Diversification Score
          </p>
          <p className="text-2xl font-semibold font-mono-tabular text-stone-900 mt-1">
            {assessment.retailDiversityScorePct}%
          </p>
          <p className="text-xs text-stone-600 mt-1">
            Balanced across B&amp;N, IndieBound &amp; Amazon
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500">
            Reader Funnel Projected Conversions
          </p>
          <p className="text-2xl font-semibold font-mono-tabular text-stone-900 mt-1">
            +{assessment.funnelProjectedPreorders.toLocaleString()}
          </p>
          <p className="text-xs text-stone-600 mt-1">
            From {readerCohorts.reduce((s, c) => s + c.subscribers, 0).toLocaleString()} active readers
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500">
            Chapter Social Serialization Index
          </p>
          <p className="text-2xl font-semibold font-mono-tabular text-stone-900 mt-1">
            {assessment.socialAmplificationIndex}%
          </p>
          <p className="text-xs text-stone-600 mt-1 font-mono-tabular">
            {socialPosts.length} chapter campaign assets active
          </p>
        </div>
      </div>

      {/* Split Grid: NYT Reporting Bookstore Channels + Reader Engagement Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: NYT Reporting Bookstore Pre-Order Allocation */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-900" />
              <h2 className="text-base font-semibold text-stone-900">
                NYT-Reporting Bookstore Pre-Order Velocity
              </h2>
            </div>
            <span className="text-xs text-stone-500 font-mono-tabular">
              All pre-orders count toward Week-1 Launch
            </span>
          </div>

          <div className="space-y-4">
            {retailChannels.map((ch) => {
              const pct = Math.min(
                100,
                Math.round((ch.currentPreorders / ch.targetWeek1) * 100)
              );
              return (
                <div
                  key={ch.id}
                  className="p-4 rounded-lg border border-stone-200 bg-[#FBF9F5] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold text-stone-900">
                        {ch.channelName}
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        {ch.nyTimesWeight} · Conv. Rate {ch.conversionRate}% · +{ch.weeklyVelocity}/wk
                      </p>
                    </div>
                    <div className="text-right font-mono-tabular">
                      <span className="text-sm font-semibold text-stone-900">
                        {ch.currentPreorders.toLocaleString()}
                      </span>{' '}
                      <span className="text-xs text-stone-500">
                        / {ch.targetWeek1.toLocaleString()} units ({pct}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-900 transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Pre-Order Campaign Logger */}
          <form
            onSubmit={handleLogPreorderBatch}
            className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
          >
            <div className="flex-1">
              <label
                htmlFor="channel-select-batch"
                className="block text-[11px] font-semibold text-stone-600 mb-1"
              >
                Target Bookstore Channel
              </label>
              <select
                id="channel-select-batch"
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900"
              >
                {retailChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.channelName}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-36">
              <label
                htmlFor="batch-units-input"
                className="block text-[11px] font-semibold text-stone-600 mb-1"
              >
                Verified Pre-Orders
              </label>
              <input
                id="batch-units-input"
                type="number"
                min={1}
                value={batchPreorderAdd}
                onChange={(e) => setBatchPreorderAdd(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono-tabular text-stone-900"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Pre-Order Batch</span>
            </button>
          </form>
        </div>

        {/* Right 5 Columns: Reader Engagement & Conversion Funnel Tools */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-900" />
              <h2 className="text-base font-semibold text-stone-900">
                Reader Engagement Cohorts
              </h2>
            </div>
            <span className="text-xs font-mono-tabular text-stone-500">
              +{assessment.funnelProjectedPreorders.toLocaleString()} est. units
            </span>
          </div>

          <div className="space-y-3.5">
            {readerCohorts.map((cohort) => {
              const projected = Math.round(
                cohort.subscribers *
                  (cohort.openRate / 100) *
                  (cohort.clickThroughRate / 100) *
                  (cohort.preOrderConversion / 100)
              );
              return (
                <div
                  key={cohort.id}
                  className="p-3.5 rounded-lg border border-stone-200 bg-[#FBF9F5] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-semibold text-stone-900">
                      {cohort.segmentName}
                    </h3>
                    <span className="text-xs font-mono-tabular font-semibold text-amber-900 shrink-0">
                      +{projected.toLocaleString()} pre-orders
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 font-mono-tabular">
                    <span>{cohort.subscribers.toLocaleString()} readers</span>
                    <span aria-hidden="true">·</span>
                    <span>{cohort.openRate}% open</span>
                    <span aria-hidden="true">·</span>
                    <span>{cohort.clickThroughRate}% CTR</span>
                    <span aria-hidden="true">·</span>
                    <span>{cohort.preOrderConversion}% conv</span>
                  </div>

                  <p className="text-[11px] text-stone-700 pt-1 border-t border-stone-200/80">
                    <span className="font-semibold">Engagement Lever:</span>{' '}
                    {cohort.engagementAction}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-stone-500">
                      Simulate +1,000 engaged subscribers:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateReaderCohort({
                          ...cohort,
                          subscribers: cohort.subscribers + 1000,
                        })
                      }
                      className="text-[11px] font-medium text-amber-900 hover:underline"
                    >
                      +1,000 Readers
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4-Phase Timed NYT Bestseller Playbook */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-900" />
            <h2 className="text-base font-semibold text-stone-900">
              Timed 4-Phase New York Times Bestseller Execution Roadmap
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-mono-tabular">
            {bestsellerTasks.filter((t) => t.completed).length} / {bestsellerTasks.length}{' '}
            Milestones Executed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestsellerTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                task.completed
                  ? 'bg-[#FBF9F5] border-stone-200'
                  : 'bg-white border-stone-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] text-amber-900 font-medium">
                  <span>{task.phase}</span>
                  <span className="font-mono-tabular text-stone-500">
                    Unlocks at {task.requiredManuscriptPct}% Manuscript
                  </span>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleBestsellerTask(task.id)}
                    className="mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span className="text-sm font-semibold text-stone-900">
                    {task.title}
                  </span>
                </label>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {task.tacticalInstruction}
                </p>
              </div>

              <div className="pt-2.5 border-t border-stone-200 flex items-center justify-between text-[11px] font-mono-tabular text-stone-600">
                <span>Target: {task.metricTarget}</span>
                {task.completed && (
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
