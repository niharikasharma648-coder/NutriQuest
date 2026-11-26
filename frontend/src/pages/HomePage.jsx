import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TabShell from '../components/TabShell';
import FoodLogModal from '../components/FoodLogModal';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function formatShortRemaining(ms) {
  const totalMins = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins}m`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { profile, setProfile, showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [msLeft, setMsLeft] = useState(6 * 3600 * 1000);

  const loadDashboard = useCallback(async () => {
    try {
      setError('');
      const res = await apiRequest('/api/dashboard');
      setData(res);
      if (res.profile) setProfile(res.profile);
      if (res.dailyChallenge?.msUntilReset != null) {
        setMsLeft(res.dailyChallenge.msUntilReset);
      }
    } catch (err) {
      setError(err.message || 'Could not load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [setProfile]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsLeft((prev) => Math.max(0, prev - 60000));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const currentProfile = data?.profile || profile;
  const level = currentProfile?.level ?? 1;
  const currentXp = currentProfile?.current_xp ?? 0;
  const xpToNext = currentProfile?.xp_to_next_level || 200;
  const xpPct = Math.min(100, Math.round((currentXp / xpToNext) * 100));
  const groupsAdded = data?.dailyChallenge?.groupsAdded || [];
  const stages = data?.stages || [];
  const activeStage = stages.find((s) => s.status === 'active') || stages[stages.length - 1];

  const handleCompleteStage = async (stageCode) => {
    try {
      const res = await apiRequest(`/api/quests/stages/${stageCode}/complete`, {
        method: 'POST',
      });
      if (res.profile) setProfile(res.profile);
      if (res.awardedXp > 0) {
        showToast(`⚔️ Stage ${stageCode} Cleared! +${res.awardedXp} XP`);
      } else {
        showToast(`Stage ${stageCode} already completed!`);
      }
      await loadDashboard();
    } catch (err) {
      showToast(err.message || 'Unable to update stage.', 'error');
    }
  };

  return (
    <TabShell subtitle="Home">
      <div className="flex flex-col w-full px-margin-mobile gap-space-md pb-6">
        {error && (
          <div className="rounded-lg bg-error-container text-on-error-container p-space-sm flex items-center justify-between gap-2">
            <span className="font-body-sm text-body-sm font-semibold">{error}</span>
            <button
              type="button"
              onClick={loadDashboard}
              className="px-3 py-1 rounded-full bg-on-error-container text-on-error font-label-sm text-label-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Gamified Hero Spotlight Card */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary-container to-primary p-space-lg text-on-primary shadow-[0_12px_28px_rgba(0,108,73,0.22)]">
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none" />
          <div className="absolute right-3 bottom-2 opacity-15 pointer-events-none select-none">
            <span className="material-symbols-outlined text-[130px] leading-none text-white">
              eco
            </span>
          </div>
          <div className="relative z-10 flex flex-col gap-space-sm max-w-[85%]">
            <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-label-sm text-label-sm shadow-sm">
              <span className="text-xs">✨</span>
              <span>LEVEL UP YOUR HABITS</span>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="font-headline-xl-mobile text-headline-xl-mobile font-extrabold tracking-tight text-white leading-tight">
                Turn Nutrition
                <br />
                Into a Quest!
              </h1>
              <p className="font-body-md text-body-md text-surface-container-high opacity-95">
                Learn. Play. Eat Better.
              </p>
            </div>
            <div className="pt-space-xs">
              <button
                type="button"
                onClick={() => {
                  showToast(
                    activeStage
                      ? `🚀 Launching Stage ${activeStage.stageCode}: ${activeStage.title}!`
                      : '🚀 Launching Nutrition Quest!'
                  );
                  navigate('/quests');
                }}
                className="w-full active:translate-y-1 transition-all duration-150 rounded-full bg-secondary-container hover:bg-secondary-container/95 text-on-secondary-container px-6 py-3.5 flex items-center justify-center gap-2 font-label-lg text-label-lg shadow-[0_5px_0_0_#b37400,0_10px_20px_rgba(254,166,25,0.35)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] material-symbols-filled">
                  star
                </span>
                <span className="font-extrabold tracking-wide uppercase">Start Your Quest</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* Player Status Hub */}
        <section className="rounded-lg bg-surface-container-lowest p-space-md shadow-[0_4px_0_0_#dee8ff,0_10px_20px_rgba(17,28,45,0.04)] flex flex-col gap-space-sm">
          <div className="flex items-center justify-between gap-space-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0 w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[26px] material-symbols-filled">
                  workspace_premium
                </span>
                <span className="absolute -bottom-1 -right-1 bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-sm">
                  {level}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold truncate">
                  {currentProfile?.rank_title || 'Quest Novice'}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Rank #{currentProfile?.league_rank || 1} in Teen League
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm shadow-[0_2px_0_0_#ffb95f]">
                <span className="text-xs">🔥</span>
                <span className="font-extrabold">{currentProfile?.streak_days ?? 1} Days</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm shadow-[0_2px_0_0_#ffdad6]">
                <span className="text-xs">❤️</span>
                <span className="font-extrabold">{currentProfile?.hearts ?? 5}/5</span>
              </div>
            </div>
          </div>

          {/* XP Bar Module */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between font-label-sm text-label-sm font-bold text-on-surface-variant">
              <span className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                Level Progress
              </span>
              <span className="text-on-surface">
                {currentXp} / {xpToNext} XP to Level {level + 1}
              </span>
            </div>
            <div className="relative w-full h-3.5 rounded-full bg-surface-container-high overflow-hidden shadow-inner p-[2px]">
              <div
                className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${xpPct}%` }}
              />
              <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] opacity-40" />
            </div>
          </div>
        </section>

        {/* Daily Challenge Card */}
        <section className="rounded-lg bg-surface-container-low p-space-md shadow-[0_4px_0_0_#d8e3fb,0_8px_16px_rgba(0,0,0,0.03)] flex flex-col gap-space-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary-fixed/40 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start justify-between gap-space-xs relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary-container/20 text-on-secondary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] material-symbols-filled">
                  restaurant
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-extrabold">
                  DAILY CHALLENGE
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-extrabold leading-snug">
                  {data?.dailyChallenge?.title || 'Build a Balanced Plate'}
                </h2>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm shadow-[0_2px_0_0_#4edea3]">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              <span className="font-extrabold">+{data?.dailyChallenge?.xpReward || 60} XP</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">task_alt</span>
              <span className="font-bold text-on-surface">
                {groupsAdded.length} of 3 Food Groups Added
              </span>
            </div>
            <div className="flex items-center gap-1 text-secondary font-semibold">
              <span className="material-symbols-outlined text-[15px]">timer</span>
              <span>Ends in {formatShortRemaining(msLeft)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1">
            {['Greens', 'Protein', 'Whole Grain'].map((group) => {
              const added = groupsAdded.includes(group);
              return (
                <div
                  key={group}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-full font-label-sm text-label-sm ${
                    added
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-highest text-on-surface-variant opacity-85'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {added ? 'check' : 'add'}
                  </span>
                  <span>{group}</span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setFoodModalOpen(true)}
            className="w-full active:translate-y-0.5 transition-all rounded-full bg-surface-container-lowest hover:bg-white text-primary px-4 py-2.5 flex items-center justify-center gap-2 font-label-md text-label-md shadow-[0_3px_0_0_#bbcabf] font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">camera_alt</span>
            <span>
              {data?.dailyChallenge?.isCompleted
                ? 'Challenge Completed! Log Another Meal'
                : 'Log Food to Complete Challenge'}
            </span>
          </button>
        </section>

        {/* Quest Map Progress Tracker: Chapter 2 */}
        <section className="rounded-lg bg-surface-container-lowest p-space-md shadow-[0_4px_0_0_#dee8ff,0_10px_20px_rgba(0,0,0,0.03)] flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-primary font-extrabold uppercase tracking-wide">
                Continue Your Quest
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                {data?.activeChapter?.title || 'Chapter 2: The Macro Realm'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setMapModalOpen(true)}
              className="font-label-sm text-label-sm text-primary font-extrabold hover:underline flex items-center gap-0.5"
            >
              <span>Map View</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>

          {/* Tactile Node Progression Track */}
          <div className="relative py-2 px-1 flex flex-col gap-4">
            <div className="relative flex items-center justify-between z-10">
              {loading && stages.length === 0 ? (
                <div className="w-full h-14 rounded-DEFAULT bg-surface-container-low animate-pulse" />
              ) : (
                stages.map((stage, idx) => (
                  <React.Fragment key={stage.stageCode}>
                    <button
                      type="button"
                      onClick={() => setMapModalOpen(true)}
                      className={`flex flex-col items-center gap-1.5 relative ${
                        stage.status === 'locked' ? 'opacity-60' : ''
                      }`}
                    >
                      {stage.status === 'active' && (
                        <div className="absolute -inset-1 rounded-full bg-primary-container/40 animate-ping" />
                      )}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 ${
                          stage.status === 'completed'
                            ? 'bg-primary text-on-primary shadow-[0_4px_0_0_#00422b]'
                            : stage.status === 'active'
                              ? 'bg-primary-container text-on-primary shadow-[0_4px_0_0_#006c49]'
                              : 'bg-surface-container-high text-on-surface-variant shadow-[0_4px_0_0_#bbcabf]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px] material-symbols-filled">
                          {stage.status === 'completed'
                            ? 'done_all'
                            : stage.status === 'active'
                              ? stage.icon || 'fitness_center'
                              : 'lock'}
                        </span>
                      </div>
                      <span
                        className={`font-label-sm text-[10px] text-center ${
                          stage.status === 'active'
                            ? 'text-primary font-extrabold'
                            : 'text-on-surface-variant font-bold'
                        }`}
                      >
                        {stage.status === 'active' ? `Stage ${stage.stageCode}` : stage.title}
                      </span>
                    </button>

                    {idx < stages.length - 1 && (
                      <div
                        className={`flex-1 h-2 rounded-full mx-1 ${
                          stage.status === 'completed'
                            ? 'bg-primary shadow-sm'
                            : stage.status === 'active'
                              ? 'bg-primary-container shadow-sm'
                              : 'bg-surface-container-highest'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))
              )}
            </div>

            {/* Current Stage Focus Banner */}
            {activeStage && (
              <div className="rounded-DEFAULT bg-surface-container p-space-sm flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0 shadow-sm text-xl">
                    🥑
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm font-bold text-primary truncate">
                      {activeStage.status === 'completed'
                        ? `Completed: Stage ${activeStage.stageCode}`
                        : `Active: Stage ${activeStage.stageCode}`}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface font-extrabold truncate">
                      {activeStage.title}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/quiz')}
                  className="shrink-0 active:translate-y-0.5 transition-all rounded-full bg-primary hover:bg-primary/95 text-on-primary px-4 py-2 font-label-md text-label-md font-extrabold shadow-[0_3px_0_0_#00422b] cursor-pointer"
                >
                  Resume
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Interactive Quick-Access Action Grid */}
        <section className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              Quest Arcades
            </h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
              Pick an Activity
            </span>
          </div>
          <div className="grid grid-cols-1 gap-space-sm">
            {/* Nutrition Quiz Card */}
            <Link
              to="/quiz"
              className="group active:scale-[0.98] transition-all rounded-lg bg-surface-container-lowest p-space-md shadow-[0_4px_0_0_#dee8ff,0_8px_16px_rgba(0,0,0,0.03)] flex items-center justify-between gap-space-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#d0bcff]">
                  <span className="material-symbols-outlined text-[28px] material-symbols-filled">
                    psychology
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold truncate">
                      Nutrition Quiz
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-tertiary/10 text-tertiary font-label-sm text-[10px] font-extrabold">
                      +30 XP
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    Test your food smarts with rapid fire facts
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              </div>
            </Link>

            {/* Mini-Games Card */}
            <Link
              to="/games"
              className="group active:scale-[0.98] transition-all rounded-lg bg-surface-container-lowest p-space-md shadow-[0_4px_0_0_#dee8ff,0_8px_16px_rgba(0,0,0,0.03)] flex items-center justify-between gap-space-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#ffb95f]">
                  <span className="material-symbols-outlined text-[28px] material-symbols-filled">
                    sports_esports
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold truncate">
                      Mini-Games
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-sm text-[10px] font-extrabold">
                      2 New
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    Plate Builder &amp; Sugar Detective
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface group-hover:bg-secondary group-hover:text-on-secondary transition-colors shrink-0">
                <span className="material-symbols-outlined text-[20px]">sports_score</span>
              </div>
            </Link>

            {/* Food Academy Card */}
            <Link
              to="/learn"
              className="group active:scale-[0.98] transition-all rounded-lg bg-surface-container-lowest p-space-md shadow-[0_4px_0_0_#dee8ff,0_8px_16px_rgba(0,0,0,0.03)] flex items-center justify-between gap-space-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#4edea3]">
                  <span className="material-symbols-outlined text-[28px] material-symbols-filled">
                    school
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold truncate">
                      Food Academy
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-primary-fixed-dim/40 text-on-primary-fixed font-label-sm text-[10px] font-extrabold">
                      8 Modules
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    Bite-sized nutrition lessons made easy
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                <span className="material-symbols-outlined text-[20px]">menu_book</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Friendly Tip of the Day Card */}
        <section className="rounded-lg bg-gradient-to-r from-surface-container-high to-surface-container p-space-md shadow-sm flex items-start gap-space-sm">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#d8e3fb] text-lg select-none">
            {data?.tipOfTheDay?.icon || '🥑'}
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-extrabold">
                Tip of the Day
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant">
                • {data?.tipOfTheDay?.category || 'Super-Brain Fact'}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-semibold leading-relaxed">
              {data?.tipOfTheDay?.content ||
                'Healthy fats help your body absorb fat-soluble vitamins A, D, E, and K! Add a slice of avocado or olive oil to your salads.'}
            </p>
          </div>
        </section>
      </div>

      {/* Food Log Modal */}
      <FoodLogModal
        isOpen={foodModalOpen}
        onClose={() => setFoodModalOpen(false)}
        onSaved={loadDashboard}
      />

      {/* Chapter 2 Map Modal */}
      {mapModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMapModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-xl sm:rounded-xl p-space-lg flex flex-col gap-space-md shadow-2xl max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-primary uppercase font-extrabold">
                  Quest Map
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                  {data?.activeChapter?.title || 'Chapter 2: The Macro Realm'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {stages.map((st) => (
                <div
                  key={st.stageCode}
                  className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        st.status === 'completed'
                          ? 'bg-primary text-on-primary'
                          : st.status === 'active'
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {st.status === 'completed'
                          ? 'done_all'
                          : st.status === 'active'
                            ? st.icon
                            : 'lock'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-label-md text-label-md font-extrabold text-on-surface truncate">
                        Stage {st.stageCode}: {st.title}
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {st.subtitle} • +{st.xpReward} XP
                      </div>
                    </div>
                  </div>
                  {st.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleCompleteStage(st.stageCode)}
                      className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold shadow-[0_2px_0_0_#00422b]"
                    >
                      Complete
                    </button>
                  )}
                  {st.status === 'completed' && (
                    <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold">
                      Done
                    </span>
                  )}
                  {st.status === 'locked' && (
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                      Locked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </TabShell>
  );
}
