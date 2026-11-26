import React, { useCallback, useEffect, useState } from 'react';
import TabShell from '../components/TabShell';
import FoodLogModal from '../components/FoodLogModal';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function formatTimer(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

export default function QuestsPage() {
  const { setProfile, refreshProfile, showToast } = useAuth();
  const [quests, setQuests] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [filter, setFilter] = useState('all');
  const [secondsLeft, setSecondsLeft] = useState(8 * 3600 + 42 * 60 + 15);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);

  const loadQuests = useCallback(async () => {
    try {
      const res = await apiRequest('/api/quests');
      setQuests(res.quests || []);
      setCompletedCount(res.completedCount || 0);
      setBonusClaimed(Boolean(res.bonusChestClaimed));
      if (res.msUntilReset != null) {
        setSecondsLeft(Math.floor(res.msUntilReset / 1000));
      }
      if (res.profile) setProfile(res.profile);
    } catch (err) {
      showToast(err.message || 'Failed to load daily quests', 'error');
    } finally {
      setLoading(false);
    }
  }, [setProfile, showToast]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 86400 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateQuestProgress = async (questId, action, value) => {
    setBusyId(questId);
    try {
      const res = await apiRequest(`/api/quests/${questId}/progress`, {
        method: 'PATCH',
        body: { action, value },
      });
      if (res.newlyCompleted) {
        showToast(`🎉 Quest Completed! +${res.awardedXp} XP`);
        await refreshProfile();
      }
      await loadQuests();
    } catch (err) {
      showToast(err.message || 'Could not update quest', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenBonusChest = async () => {
    setBusyId('bonus-chest');
    try {
      const res = await apiRequest('/api/quests/bonus-chest', { method: 'POST' });
      if (res.profile) setProfile(res.profile);
      showToast(`🎁 Bonus Chest Opened! +${res.awardedXp} XP & +${res.awardedCoins} Coins`);
      await loadQuests();
    } catch (err) {
      showToast(err.message || 'Unable to open chest yet', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const filteredQuests = quests.filter((q) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return q.isCompleted;
    return q.difficulty === filter;
  });

  const renderDifficultyStars = (difficulty) => {
    const count = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
    const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    return (
      <div className="flex items-center gap-1 text-secondary">
        <span className="font-label-sm text-label-sm font-bold text-on-surface-variant">
          {label}
        </span>
        {[1, 2, 3].map((idx) => (
          <span
            key={idx}
            className={`material-symbols-outlined text-[14px] ${
              idx <= count ? 'material-symbols-filled' : 'text-surface-container-highest'
            }`}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  return (
    <TabShell subtitle="Quests">
      <div className="flex flex-col w-full px-margin-mobile pb-8 space-y-space-md">
        {/* Streaks & Reset Status Banner */}
        <div className="relative overflow-hidden rounded-lg bg-surface-container p-space-md shadow-sm">
          <div className="flex items-start justify-between gap-space-sm relative z-10">
            <div className="flex items-center gap-space-sm">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-md shrink-0">
                <span className="text-2xl leading-none select-none">🔥</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Daily Streak Quest!
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-extrabold uppercase tracking-wide">
                    Active
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                  Complete today&apos;s quests to unlock the{' '}
                  <span className="font-bold text-secondary">Weekend XP Doubler</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-space-md pt-space-sm flex items-center justify-between gap-space-sm relative z-10">
            <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              <span className="font-mono font-bold tracking-tight">
                Resets in {formatTimer(secondsLeft)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold">
              <span>Daily Target:</span>
              <span className="text-primary font-extrabold">{completedCount}/5 Done</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-primary-fixed/20 blur-xl pointer-events-none" />
        </div>

        {/* Filter Chips Strip */}
        <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-1 -mx-margin-mobile px-margin-mobile">
          {[
            { id: 'all', label: `All Quests (${quests.length})` },
            { id: 'easy', label: 'Easy' },
            { id: 'medium', label: 'Medium' },
            { id: 'hard', label: 'Hard' },
            { id: 'completed', label: `Completed (${completedCount})` },
          ].map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`shrink-0 px-3.5 py-2 rounded-full font-label-md text-label-md transition-all duration-200 ${
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Challenge Cards Container */}
        <div className="flex flex-col space-y-space-md">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 rounded-lg bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : filteredQuests.length === 0 ? (
            <div className="rounded-lg bg-surface-container-lowest p-space-md text-center text-on-surface-variant">
              No quests match this filter yet!
            </div>
          ) : (
            filteredQuests.map((quest) => {
              const isBusy = busyId === quest.id;

              if (quest.questType === 'plate') {
                return (
                  <div
                    key={quest.id}
                    className={`rounded-lg p-space-md shadow-sm relative overflow-hidden transition-all duration-300 ${
                      quest.isCompleted ? 'bg-surface-container-low' : 'bg-surface-container-lowest'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[22px]">restaurant</span>
                        </div>
                        <div>
                          <h3
                            className={`font-headline-sm text-headline-sm text-on-surface ${
                              quest.isCompleted ? 'line-through opacity-70' : ''
                            }`}
                          >
                            {quest.title}
                          </h3>
                          {renderDifficultyStars(quest.difficulty)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed/80 text-on-primary-fixed font-label-sm text-label-sm font-extrabold shrink-0">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          bolt
                        </span>
                        <span>+{quest.xpReward} XP</span>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md opacity-90">
                      {quest.description}
                    </p>

                    <div className="flex items-center justify-between gap-space-md">
                      <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-primary text-[18px] material-symbols-filled">
                          verified
                        </span>
                        <span className="font-bold text-primary">
                          {quest.badgeHint || 'Chef Badge Progress'}
                        </span>
                      </div>
                      {quest.isCompleted ? (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 rounded-full font-label-md text-label-md font-extrabold bg-surface-container-highest text-on-surface-variant/70 cursor-not-allowed flex items-center gap-1"
                        >
                          <span>Claimed</span>
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            check_circle
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setFoodModalOpen(true)}
                          className="px-4 py-2 rounded-full font-label-md text-label-md font-extrabold bg-primary text-on-primary shadow-[0_4px_0_0_#00422b] transition-transform active:scale-95"
                        >
                          Log Meal
                        </button>
                      )}
                    </div>

                    {quest.isCompleted && (
                      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                        <div className="absolute transform rotate-45 bg-primary-fixed text-on-primary-fixed font-label-sm text-[9px] font-extrabold py-0.5 right-[-35px] top-[14px] w-[110px] text-center shadow-sm">
                          DONE
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (quest.questType === 'water') {
                const count = quest.progressCount || 0;
                const pct = Math.round((count / 6) * 100);
                return (
                  <div
                    key={quest.id}
                    className="rounded-lg bg-surface-container-lowest p-space-md shadow-sm relative overflow-hidden transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[22px]">water_drop</span>
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">
                            {quest.title}
                          </h3>
                          {renderDifficultyStars(quest.difficulty)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-extrabold shrink-0">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          bolt
                        </span>
                        <span>+{quest.xpReward} XP</span>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                      {quest.description}
                    </p>

                    <div className="flex flex-col gap-2 mb-space-md p-space-sm rounded-lg bg-surface-container-low">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Hydration Meter:{' '}
                          <strong className="text-on-surface">{count} of 6 glasses</strong>
                        </span>
                        <span className="font-label-sm text-label-sm font-extrabold text-primary">
                          {pct}%
                        </span>
                      </div>
                      <div className="grid grid-cols-6 gap-2 pt-1">
                        {[1, 2, 3, 4, 5, 6].map((idx) => {
                          const filled = idx <= count;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isBusy}
                              onClick={() => updateQuestProgress(quest.id, 'set_water', idx)}
                              className={`flex flex-col items-center justify-center py-2 rounded transition-transform active:scale-90 ${
                                filled
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined text-[20px] ${
                                  filled ? 'material-symbols-filled' : ''
                                }`}
                              >
                                local_drink
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-space-sm">
                      <button
                        type="button"
                        disabled={isBusy || count >= 6}
                        onClick={() => updateQuestProgress(quest.id, 'increment_water')}
                        className="px-3.5 py-2 rounded-full font-label-md text-label-md font-bold bg-surface-container-high text-on-surface hover:bg-surface-variant transition-transform active:scale-95 flex items-center gap-1 shadow-sm disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Log Glass</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || quest.isCompleted}
                        onClick={() => updateQuestProgress(quest.id, 'set_water', 6)}
                        className={`px-4 py-2 rounded-full font-label-md text-label-md font-extrabold transition-transform active:scale-95 ${
                          quest.isCompleted
                            ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                            : 'bg-primary text-on-primary shadow-[0_4px_0_0_#00422b] hover:brightness-105'
                        }`}
                      >
                        {quest.isCompleted
                          ? `Claimed (+${quest.xpReward} XP)`
                          : `Complete (+${quest.xpReward} XP)`}
                      </button>
                    </div>
                  </div>
                );
              }

              if (quest.questType === 'fruit') {
                const fruits = Array.isArray(quest.metadata?.fruits) ? quest.metadata.fruits : [];
                const pct = Math.min(100, Math.round((fruits.length / 2) * 100));
                return (
                  <div
                    key={quest.id}
                    className="rounded-lg bg-surface-container-lowest p-space-md shadow-sm relative overflow-hidden transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
                          <span className="material-symbols-outlined text-[24px] text-primary">
                            nutrition
                          </span>
                          <span className="material-symbols-outlined text-[10px] text-secondary absolute inset-0 m-auto mt-2 material-symbols-filled">
                            star
                          </span>
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">
                            {quest.title}
                          </h3>
                          {renderDifficultyStars(quest.difficulty)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-extrabold shrink-0">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          bolt
                        </span>
                        <span>+{quest.xpReward} XP</span>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                      {quest.description}
                    </p>

                    <div className="mb-space-md">
                      <div className="flex justify-between items-center mb-1.5 font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Progress</span>
                        <span className="font-bold text-on-surface">
                          {fruits.length} of 2 fruits logged{quest.isCompleted ? ' (Completed!)' : ''}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden p-[2px]">
                        <div
                          className="h-full bg-primary-container rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-space-sm">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-sm text-[11px] font-extrabold ${
                            fruits[0]
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {fruits[0] || '🍎 Waiting...'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold ${
                            fruits[1]
                              ? 'bg-secondary-fixed text-on-secondary-fixed font-extrabold'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {fruits[1] || 'Waiting...'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy || quest.isCompleted}
                        onClick={() => updateQuestProgress(quest.id, 'add_fruit')}
                        className={`px-4 py-2 rounded-full font-label-md text-label-md font-extrabold transition-transform active:scale-95 flex items-center gap-1 shrink-0 ${
                          quest.isCompleted
                            ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                            : 'bg-primary text-on-primary shadow-[0_4px_0_0_#00422b] hover:brightness-105'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {quest.isCompleted ? 'check' : 'add_circle'}
                        </span>
                        <span>
                          {quest.isCompleted ? `Claimed (+${quest.xpReward} XP)` : 'Log Fruit (+1)'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              }

              if (quest.questType === 'grain') {
                return (
                  <div
                    key={quest.id}
                    className="rounded-lg bg-surface-container-lowest p-space-md shadow-sm relative overflow-hidden transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary shrink-0">
                          <span className="material-symbols-outlined text-[22px]">grain</span>
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">
                            {quest.title}
                          </h3>
                          {renderDifficultyStars(quest.difficulty)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-extrabold shrink-0">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          bolt
                        </span>
                        <span>+{quest.xpReward} XP</span>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                      {quest.description}
                    </p>

                    <div className="flex items-center justify-between gap-space-md pt-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            quest.isCompleted ? 'bg-primary-container' : 'bg-surface-container-highest'
                          }`}
                        />
                        <span
                          className={`font-label-sm text-label-sm font-bold ${
                            quest.isCompleted ? 'text-primary' : 'text-on-surface-variant'
                          }`}
                        >
                          {quest.isCompleted
                            ? `1 of 1 swapped (${quest.metadata?.swapItem || 'Quinoa Bowl'})`
                            : '0 of 1 swapped'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy || quest.isCompleted}
                        onClick={() => updateQuestProgress(quest.id, 'toggle_grain', 'Quinoa Bowl')}
                        className={`px-4 py-2 rounded-full font-label-md text-label-md font-extrabold transition-transform active:scale-95 shadow-sm flex items-center gap-1 ${
                          quest.isCompleted
                            ? 'bg-surface-container-high text-primary opacity-75 cursor-not-allowed'
                            : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          check
                        </span>
                        <span>{quest.isCompleted ? 'Done ✅' : 'Mark as Done'}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Eat a Rainbow
              const colors = Array.isArray(quest.metadata?.colors) ? quest.metadata.colors : [];
              const swatches = [
                { key: 'red', label: 'Red', emoji: '🍅', activeClass: 'bg-error-container/40 text-on-error-container' },
                { key: 'green', label: 'Green', emoji: '🥦', activeClass: 'bg-primary-container/20 text-on-primary-container' },
                { key: 'orange', label: 'Orange', emoji: '🥕', activeClass: 'bg-secondary-container/20 text-on-secondary-container' },
                { key: 'purple', label: 'Purple', emoji: '🍆', activeClass: 'bg-tertiary-container/30 text-tertiary' },
              ];
              return (
                <div
                  key={quest.id}
                  className="rounded-lg bg-surface-container-lowest p-space-md shadow-sm relative overflow-hidden transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-tertiary-container/30 flex items-center justify-center text-tertiary shrink-0">
                        <span className="material-symbols-outlined text-[22px]">palette</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">
                          {quest.title}
                        </h3>
                        {renderDifficultyStars(quest.difficulty)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-extrabold shrink-0">
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        bolt
                      </span>
                      <span>+{quest.xpReward} XP</span>
                    </div>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                    {quest.description}
                  </p>

                  <div className="grid grid-cols-4 gap-2 mb-space-md">
                    {swatches.map((sw) => {
                      const done = colors.includes(sw.key);
                      return (
                        <button
                          key={sw.key}
                          type="button"
                          disabled={isBusy || done}
                          onClick={() => updateQuestProgress(quest.id, 'add_rainbow_color', sw.key)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-transform active:scale-95 ${
                            done
                              ? sw.activeClass
                              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                          }`}
                        >
                          <span className={`text-lg ${done ? '' : 'opacity-70'}`}>{sw.emoji}</span>
                          <span className="font-label-sm text-[11px] font-bold mt-1">
                            {sw.label}
                          </span>
                          <span
                            className={`material-symbols-outlined text-[14px] mt-0.5 ${
                              done ? 'text-primary material-symbols-filled' : 'opacity-40'
                            }`}
                          >
                            {done ? 'check_circle' : 'add_circle'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-tertiary text-[18px]">
                        workspace_premium
                      </span>
                      <span className="font-bold text-on-surface">Rainbow Badge</span>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy || quest.isCompleted}
                      onClick={() => updateQuestProgress(quest.id, 'add_rainbow_color')}
                      className={`px-4 py-2 rounded-full font-label-md text-label-md font-extrabold transition-transform active:scale-95 flex items-center gap-1 ${
                        quest.isCompleted
                          ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                          : 'bg-primary text-on-primary shadow-[0_4px_0_0_#00422b] hover:brightness-105'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {quest.isCompleted ? 'check_circle' : 'brush'}
                      </span>
                      <span>{quest.isCompleted ? 'Rainbow Claimed!' : 'Add Color'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Daily Quest Bonus Chest Card */}
        <div className="rounded-lg bg-gradient-to-br from-surface-container-high via-surface-container to-secondary-fixed/20 p-space-md shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between gap-space-sm mb-space-sm">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-md shrink-0">
                <span className="material-symbols-outlined text-[28px] material-symbols-filled">
                  redeem
                </span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">
                  Daily Quest Bonus Chest
                </h4>
                <span className="font-label-sm text-label-sm font-bold text-secondary">
                  Mystery Tier Loot
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-headline-sm text-headline-sm text-primary font-black">
                {completedCount} / 5
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant font-extrabold uppercase tracking-wider">
                Completed
              </span>
            </div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
            Complete all 5 daily quests for mystery bonus{' '}
            <span className="font-bold text-primary">(+100 XP + 50 Coins)</span>.
          </p>

          <div className="relative w-full h-3.5 rounded-full bg-surface-container-highest overflow-hidden p-[2px] mb-space-md shadow-inner">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (completedCount / 5) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                {completedCount >= 5 ? 'lock_open' : 'lock'}
              </span>
              <span>
                {bonusClaimed
                  ? 'Chest opened today!'
                  : completedCount >= 5
                    ? 'Unlocked! Ready to claim'
                    : 'Unlocks today at 5/5 quests'}
              </span>
            </span>
            <button
              type="button"
              disabled={completedCount < 5 || bonusClaimed || busyId === 'bonus-chest'}
              onClick={handleOpenBonusChest}
              className={`px-4 py-2 rounded-full font-label-md text-label-md font-extrabold transition-all ${
                completedCount >= 5 && !bonusClaimed
                  ? 'bg-secondary-container text-on-secondary-container cursor-pointer shadow-[0_4px_0_0_#855300] hover:brightness-105'
                  : 'bg-surface-container-highest text-on-surface-variant/60 cursor-not-allowed'
              }`}
            >
              {bonusClaimed
                ? 'Chest Claimed ✅'
                : completedCount >= 5
                  ? 'Open Chest! 🎁'
                  : 'Locked Chest'}
            </button>
          </div>
        </div>
      </div>

      <FoodLogModal
        isOpen={foodModalOpen}
        onClose={() => setFoodModalOpen(false)}
        onSaved={loadQuests}
      />
    </TabShell>
  );
}
