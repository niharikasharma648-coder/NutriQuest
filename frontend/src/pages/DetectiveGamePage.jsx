import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StackShell from '../components/StackShell';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function DetectiveGamePage({ slug }) {
  const navigate = useNavigate();
  const { setProfile, showToast } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [rewardSummary, setRewardSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const isFoodDetective = slug === 'food-detective';
  const title = isFoodDetective ? 'Food Detective' : 'Sugar Detective';

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/games/challenges/${slug}`);
      setChallenges(res.challenges || []);
    } catch (err) {
      showToast(err.message || 'Could not load game challenges', 'error');
    } finally {
      setLoading(false);
    }
  }, [slug, showToast]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedChoice(null);
    setCorrectCount(0);
    setFinished(false);
    setRewardSummary(null);
    loadChallenges();
  }, [loadChallenges]);

  const current = challenges[currentIndex];

  const handleSelect = (choice) => {
    if (selectedChoice || !current) return;
    setSelectedChoice(choice);
    if (choice === current.correct_answer) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedChoice(null);
      return;
    }

    const total = challenges.length || 1;
    const scorePct = Math.round((correctCount / total) * 100);
    const won = scorePct >= 60;

    try {
      const res = await apiRequest('/api/games/sessions', {
        method: 'POST',
        body: {
          gameSlug: slug,
          score: scorePct,
          won,
          details: { correctCount, total },
        },
      });
      if (res.profile) setProfile(res.profile);
      setRewardSummary({ scorePct, won, awardedXp: res.awardedXp, awardedCoins: res.awardedCoins });
      setFinished(true);
      showToast(`🎮 ${title} Complete! +${res.awardedXp} XP`);
    } catch (err) {
      showToast(err.message || 'Failed to record score', 'error');
    }
  };

  return (
    <StackShell title={title} backTo="/games">
      <div className="flex flex-col w-full px-margin-mobile pb-8 gap-space-md pt-2">
        {loading ? (
          <div className="h-64 rounded-2xl bg-surface-container-low animate-pulse" />
        ) : finished && rewardSummary ? (
          <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-[0_6px_0_0_#d8e3fb] flex flex-col items-center text-center gap-space-md">
            <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center text-4xl">
              {rewardSummary.won ? '🏆' : '🎯'}
            </div>
            <div>
              <span className="font-label-sm text-label-sm uppercase font-extrabold text-primary">
                {rewardSummary.won ? 'Arena Victory!' : 'Good Effort!'}
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-1">
                Score: {rewardSummary.scorePct}% ({correctCount}/{challenges.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md font-extrabold">
                +{rewardSummary.awardedXp} XP
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md font-extrabold">
                🪙 +{rewardSummary.awardedCoins} Coins
              </span>
            </div>
            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(0);
                  setSelectedChoice(null);
                  setCorrectCount(0);
                  setFinished(false);
                }}
                className="py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-extrabold shadow-[0_4px_0_0_#00422b]"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={() => navigate('/games')}
                className="py-3 rounded-full bg-surface-container text-on-surface font-label-lg text-label-lg font-extrabold shadow-[0_4px_0_0_#bbcabf]"
              >
                Arcade Hub
              </button>
            </div>
          </div>
        ) : current ? (
          <>
            {/* Progress Header */}
            <div className="bg-surface-container-low rounded-2xl p-space-sm flex items-center justify-between">
              <span className="font-label-md text-label-md text-primary font-extrabold">
                Round {currentIndex + 1} of {challenges.length}
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-extrabold">
                Score: {correctCount}/{challenges.length}
              </span>
            </div>

            {/* Prompt Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_0_0_#d8e3fb] flex flex-col gap-space-sm">
              <span className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold">
                {isFoodDetective ? '🔍 Nutrient Duel' : '🍬 Hidden Sugar Scan'}
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                {current.prompt}
              </h2>

              {!isFoodDetective && current.payload?.item && (
                <div className="rounded-xl bg-surface-container-low p-space-md flex items-center gap-3 mt-1">
                  <span className="text-4xl">{current.payload.emoji}</span>
                  <div>
                    <div className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                      {current.payload.item}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      Serving: {current.payload.serving}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Choices */}
            {isFoodDetective ? (
              <div className="grid grid-cols-1 gap-space-sm">
                {['left', 'right'].map((side) => {
                  const opt = current.payload?.[side];
                  if (!opt) return null;
                  const picked = selectedChoice === side;
                  const isCorrect = current.correct_answer === side;
                  let cardClass = 'bg-surface-container-lowest shadow-[0_4px_0_0_#d8e3fb]';
                  if (selectedChoice) {
                    if (isCorrect) cardClass = 'bg-primary-fixed shadow-[0_4px_0_0_#4edea3]';
                    else if (picked) cardClass = 'bg-error-container shadow-[0_4px_0_0_#ba1a1a]';
                  }
                  return (
                    <button
                      key={side}
                      type="button"
                      disabled={Boolean(selectedChoice)}
                      onClick={() => handleSelect(side)}
                      className={`w-full text-left rounded-xl p-space-md flex items-center gap-3 transition-all active:scale-[0.99] ${cardClass}`}
                    >
                      <span className="text-4xl shrink-0">{opt.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                          {opt.name}
                        </div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          {opt.stats}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-space-sm">
                {(current.payload?.choices || []).map((choice) => {
                  const picked = selectedChoice === choice;
                  const isCorrect = current.correct_answer === choice;
                  let btnClass = 'bg-surface-container-lowest shadow-[0_4px_0_0_#d8e3fb] text-on-surface';
                  if (selectedChoice) {
                    if (isCorrect)
                      btnClass = 'bg-primary-fixed text-on-primary-fixed shadow-[0_4px_0_0_#4edea3]';
                    else if (picked)
                      btnClass = 'bg-error-container text-on-error-container shadow-[0_4px_0_0_#ba1a1a]';
                  }
                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={Boolean(selectedChoice)}
                      onClick={() => handleSelect(choice)}
                      className={`py-4 px-3 rounded-xl font-headline-sm text-headline-sm font-extrabold transition-all active:scale-95 ${btnClass}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Feedback & Next */}
            {selectedChoice && (
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_0_0_#d8e3fb] flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      selectedChoice === current.correct_answer ? 'text-primary' : 'text-error'
                    }`}
                  >
                    {selectedChoice === current.correct_answer ? 'verified' : 'info'}
                  </span>
                  <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
                    {selectedChoice === current.correct_answer
                      ? 'Spot on! +20 pts'
                      : `Answer: ${current.correct_answer}`}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {current.explanation}
                </p>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-extrabold shadow-[0_4px_0_0_#00422b]"
                >
                  {currentIndex < challenges.length - 1 ? 'Next Round →' : 'Finish & Claim XP'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-6 rounded-xl bg-surface-container-lowest text-center text-on-surface-variant">
            No challenges available.
          </div>
        )}
      </div>
    </StackShell>
  );
}
