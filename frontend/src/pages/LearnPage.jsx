import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabShell from '../components/TabShell';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function LearnPage() {
  const navigate = useNavigate();
  const { setProfile, showToast } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const loadLessons = useCallback(async () => {
    try {
      const res = await apiRequest('/api/learn');
      setLessons(res.lessons || []);
      setCompletedCount(res.completedCount || 0);
    } catch (err) {
      showToast(err.message || 'Failed to load Food Academy lessons', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const handleClaimLesson = async () => {
    if (!selectedLesson) return;
    setClaiming(true);
    try {
      const res = await apiRequest(`/api/learn/${selectedLesson.id}/complete`, {
        method: 'POST',
      });
      if (res.profile) setProfile(res.profile);
      if (res.alreadyCompleted) {
        showToast('Lesson already completed! XP previously claimed.');
      } else {
        showToast(`📚 Lesson Complete! +${res.awardedXp} XP`);
      }
      await loadLessons();
      setSelectedLesson(null);
    } catch (err) {
      showToast(err.message || 'Failed to claim lesson XP', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const totalCount = lessons.length || 8;
  const scholarPct = Math.round((completedCount / totalCount) * 100);

  const filteredLessons = lessons.filter((lesson) => {
    const matchesFilter = filter === 'all' || lesson.category === filter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      lesson.title.toLowerCase().includes(q) ||
      lesson.summary.toLowerCase().includes(q) ||
      (lesson.search_keywords || '').toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <TabShell subtitle="Learn">
      <div className="flex flex-col w-full">
        <div className="px-margin-mobile flex flex-col gap-space-md pt-2 pb-8">
          {/* Top Academy Banner */}
          <div className="relative overflow-hidden rounded-lg bg-surface-container p-space-md shadow-sm">
            <div className="absolute -right-4 -bottom-6 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between gap-space-sm relative z-10">
              <div className="flex flex-col gap-space-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm w-fit shadow-[0_2px_0_0_#4edea3]">
                  <span className="material-symbols-outlined text-[13px] text-primary material-symbols-filled">
                    school
                  </span>
                  <span>Food Academy</span>
                </div>
                <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface tracking-tight">
                  Food Academy 📚
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[270px]">
                  Bite-sized nutrition lessons designed for real life, not medical school.
                </p>
              </div>
              <div className="relative shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_4px_0_0_#00422b]">
                <span className="material-symbols-outlined text-[28px] material-symbols-filled">
                  auto_stories
                </span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary-container text-[9px] font-extrabold text-on-secondary-container items-center justify-center">
                    ✨
                  </span>
                </span>
              </div>
            </div>

            {/* Scholar Mastery Progress */}
            <div className="mt-space-md pt-space-sm flex flex-col gap-space-xs relative z-10">
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-secondary material-symbols-filled">
                    workspace_premium
                  </span>
                  <span>
                    {completedCount}/{totalCount} Lessons Completed
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-extrabold">
                  {scholarPct}% Scholar
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-container-highest p-[2px] shadow-inner">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]"
                  style={{ width: `${scholarPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col gap-space-sm">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nutrients, vitamins, foods..."
                className="w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm shadow-[0_2px_0_0_#dee8ff] focus:outline-none focus:bg-surface-container-lowest transition-all"
              />
            </div>

            <div className="flex items-center gap-space-xs overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: `All (${totalCount})` },
                { id: 'macro', label: 'Macronutrients' },
                { id: 'micro', label: 'Micronutrients' },
                { id: 'habits', label: 'Habits & Daily' },
              ].map((btn) => {
                const active = filter === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setFilter(btn.id)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-transform active:scale-95 ${
                      active
                        ? 'bg-primary text-on-primary shadow-[0_2px_0_0_#00422b]'
                        : 'bg-surface-container text-on-surface-variant shadow-[0_2px_0_0_#d8e3fb] hover:bg-surface-container-high'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lesson Cards Grid */}
          <div className="flex flex-col gap-space-md">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-36 rounded-lg bg-surface-container-low animate-pulse" />
              ))
            ) : filteredLessons.length === 0 ? (
              <div className="rounded-lg bg-surface-container-lowest p-space-md text-center text-on-surface-variant">
                No lessons match your search. Try &ldquo;protein&rdquo; or &ldquo;hydration&rdquo;!
              </div>
            ) : (
              filteredLessons.map((lesson) => {
                const isMicro = lesson.category === 'micro';
                const isBalanced = lesson.slug === 'balanced-diet';
                return (
                  <div
                    key={lesson.id}
                    className="group relative bg-surface-container-lowest rounded-lg p-space-md shadow-[0_4px_0_0_#dee8ff,0_10px_20px_rgba(0,108,73,0.04)] flex flex-col gap-space-sm"
                  >
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-[24px] shrink-0 ${
                            lesson.category === 'macro' && lesson.slug !== 'healthy-fats' && lesson.slug !== 'fibre'
                              ? 'bg-secondary-fixed shadow-[0_3px_0_0_#fea619]'
                              : lesson.slug === 'hydration'
                                ? 'bg-surface-variant shadow-[0_3px_0_0_#dee8ff]'
                                : lesson.slug === 'fibre'
                                  ? 'bg-surface-container shadow-[0_3px_0_0_#d8e3fb]'
                                  : 'bg-primary-fixed shadow-[0_3px_0_0_#10b981]'
                          }`}
                        >
                          {lesson.icon}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`font-label-sm text-label-sm font-extrabold uppercase ${
                              isMicro || lesson.slug === 'protein' || lesson.slug === 'carbohydrates' || isBalanced
                                ? 'text-secondary'
                                : 'text-primary'
                            }`}
                          >
                            {lesson.category_label}
                          </span>
                          <h2 className="font-headline-sm text-headline-sm text-on-surface">
                            {lesson.title}
                          </h2>
                        </div>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-extrabold flex items-center gap-1 ${
                          lesson.completed
                            ? 'bg-primary text-on-primary'
                            : isMicro
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed shadow-[0_2px_0_0_#d0bcff]'
                              : isBalanced
                                ? 'bg-secondary-container text-on-secondary-container shadow-[0_2px_0_0_#855300]'
                                : 'bg-primary-fixed text-on-primary-fixed shadow-[0_2px_0_0_#4edea3]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px] material-symbols-filled">
                          {lesson.completed ? 'check_circle' : 'bolt'}
                        </span>
                        <span>{lesson.completed ? 'Done' : `+${lesson.xp_reward} XP`}</span>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {lesson.summary}
                    </p>

                    <div className="pt-space-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[15px] text-primary">
                          timer
                        </span>
                        <span>{lesson.read_minutes} min read</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLesson(lesson)}
                        className="flex items-center gap-1 px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold shadow-[0_3px_0_0_#00422b] transition-all active:translate-y-[2px] active:shadow-[0_1px_0_0_#00422b]"
                      >
                        <span>{lesson.completed ? 'Review' : 'Learn More'}</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Mini-Quiz Callout Card */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-tertiary to-on-tertiary-container text-on-tertiary p-space-md shadow-[0_4px_0_0_#23005c,0_10px_20px_rgba(109,59,215,0.25)] flex flex-col gap-space-sm mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-extrabold shadow-[0_2px_0_0_#b090ff]">
                <span className="material-symbols-outlined text-[13px] text-tertiary material-symbols-filled">
                  quiz
                </span>
                <span>Knowledge Check</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-extrabold shadow-[0_2px_0_0_#855300]">
                +40 XP
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <h3 className="font-headline-sm text-headline-sm text-on-tertiary font-extrabold">
                Ready for the Arena?
              </h3>
              <p className="font-body-sm text-body-sm text-tertiary-fixed">
                Test what you just learned and earn +40 XP! Only 3 fast questions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/quiz?mode=quick')}
              className="w-full h-12 mt-1 rounded-full bg-secondary-container text-on-secondary-container font-label-lg text-label-lg font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_0_0_#855300] transition-all active:translate-y-[3px] active:shadow-[0_1px_0_0_#855300]"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              <span>Start Quick Mini-Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Lesson Popup Modal */}
      {selectedLesson && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLesson(null);
          }}
        >
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-xl p-space-lg flex flex-col gap-space-md shadow-2xl max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{selectedLesson.icon}</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-secondary font-extrabold uppercase">
                    {selectedLesson.category_label}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                    {selectedLesson.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="rounded-lg bg-surface-container-low p-space-sm flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold shrink-0">
                <span className="material-symbols-outlined text-[20px]">lightbulb</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface font-semibold">
                {selectedLesson.highlight}
              </p>
            </div>

            <div className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              {(selectedLesson.body_paragraphs || []).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              <p className="font-bold text-on-surface mt-1">Smart food hero choices:</p>
              <ul className="list-disc list-inside space-y-1 text-on-surface-variant">
                {(selectedLesson.food_choices || []).map((choice, i) => (
                  <li key={i}>{choice}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              disabled={claiming}
              onClick={handleClaimLesson}
              className={`w-full h-12 rounded-full font-label-lg text-label-lg font-extrabold flex items-center justify-center gap-2 transition-all active:translate-y-[2px] ${
                selectedLesson.completed
                  ? 'bg-secondary-container text-on-secondary-container shadow-[0_4px_0_0_#855300]'
                  : 'bg-primary text-on-primary shadow-[0_4px_0_0_#00422b]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>
                {claiming
                  ? 'Claiming XP...'
                  : selectedLesson.completed
                    ? 'Completed! Close Lesson'
                    : `Claim Lesson XP (+${selectedLesson.xp_reward} XP)`}
              </span>
            </button>
          </div>
        </div>
      )}
    </TabShell>
  );
}
