import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StackShell from '../components/StackShell';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'quick' ? 'quick' : 'standard';
  const { setProfile, showToast } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [checkedResult, setCheckedResult] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [completedSummary, setCompletedSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/quiz/questions?mode=${mode}`);
      setQuestions(res.questions || []);
      setCurrentIdx(0);
      setSelectedChoice(null);
      setShowHint(false);
      setCheckedResult(null);
      setCorrectCount(0);
      setStreak(0);
      setMaxStreak(0);
      setCompletedSummary(null);
    } catch (err) {
      showToast(err.message || 'Failed to load quiz questions', 'error');
    } finally {
      setLoading(false);
    }
  }, [mode, showToast]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length || 1;
  const progressPct = Math.round(((currentIdx + 1) / totalQuestions) * 100);

  const handleCheckAnswer = async () => {
    if (!selectedChoice || !currentQuestion || checkedResult) return;
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/quiz/check', {
        method: 'POST',
        body: { questionId: currentQuestion.id, choice: selectedChoice },
      });
      setCheckedResult(res);
      if (res.isCorrect) {
        setCorrectCount((c) => c + 1);
        setStreak((s) => {
          const next = s + 1;
          setMaxStreak((m) => Math.max(m, next));
          return next;
        });
      } else {
        setStreak(0);
      }
    } catch (err) {
      showToast(err.message || 'Could not verify answer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedChoice(null);
      setShowHint(false);
      setCheckedResult(null);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/api/quiz/complete', {
        method: 'POST',
        body: {
          mode,
          totalQuestions: questions.length,
          correctCount,
          maxStreak,
        },
      });
      if (res.profile) setProfile(res.profile);
      setCompletedSummary(res);
      showToast(`🧠 Quiz Complete! +${res.awardedXp} XP`);
    } catch (err) {
      showToast(err.message || 'Failed to save quiz attempt', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StackShell title="Quest Details" backTo="/">
      <div className="flex flex-col w-full px-margin-mobile pb-8 gap-space-md pt-2">
        {loading ? (
          <div className="h-72 rounded-2xl bg-surface-container-low animate-pulse" />
        ) : completedSummary ? (
          <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-[0_6px_0_0_#d8e3fb] flex flex-col items-center text-center gap-space-md">
            <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center text-4xl">
              🎓
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase font-extrabold">
                {mode === 'quick' ? 'Quick Mini-Quiz Complete' : 'Nutrition Quiz Complete'}
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-1">
                {correctCount} / {questions.length} Correct ({completedSummary.accuracy}%)
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md font-extrabold">
                +{completedSummary.awardedXp} XP
              </span>
              <span className="px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md font-extrabold">
                🪙 +{completedSummary.awardedCoins} Coins
              </span>
            </div>
            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={loadQuestions}
                className="py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-extrabold shadow-[0_4px_0_0_#00422b]"
              >
                Retry Quiz
              </button>
              <button
                type="button"
                onClick={() => navigate('/learn')}
                className="py-3 rounded-full bg-surface-container text-on-surface font-label-lg text-label-lg font-extrabold shadow-[0_4px_0_0_#bbcabf]"
              >
                Food Academy
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          <>
            {/* Interactive Header Tracker Bar */}
            <div className="bg-surface-container-low rounded-2xl p-space-sm shadow-sm flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[16px] text-primary material-symbols-filled">
                    quiz
                  </span>
                  <span>
                    Question {currentIdx + 1} of {totalQuestions}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm shadow-[0_2px_0_0_#ffb95f]">
                  <span className="material-symbols-outlined text-[15px] text-secondary material-symbols-filled">
                    local_fire_department
                  </span>
                  <span>{streak > 0 ? `${streak}x XP Streak` : `+${currentQuestion.xp_value} XP`}</span>
                </div>
              </div>

              <div className="relative w-full h-3.5 bg-surface-container-highest rounded-full overflow-visible p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-primary-fixed-dim to-primary-container rounded-full relative transition-all duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  style={{ width: `${progressPct}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-surface-container-lowest shadow-[0_2px_4px_rgba(0,108,73,0.25)] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-primary material-symbols-filled">
                      star
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Question Card */}
            <div className="relative bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_0_0_#d8e3fb,0_10px_20px_rgba(0,108,73,0.04)] flex flex-col gap-space-sm overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[14px]">fitness_center</span>
                  <span>{currentQuestion.topic}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm active:scale-95 transition-transform shadow-[0_2px_0_0_#fea619]"
                >
                  <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                  <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                </button>
              </div>

              {showHint && (
                <div className="bg-surface-container-low rounded-xl p-space-sm flex items-start gap-2 shadow-inner">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 material-symbols-filled">
                    tips_and_updates
                  </span>
                  <p className="text-on-surface-variant font-body-sm text-body-sm leading-relaxed">
                    {currentQuestion.hint}
                  </p>
                </div>
              )}

              <h2 className="text-on-surface font-headline-md text-headline-md tracking-tight pt-1">
                {currentQuestion.question_text}
              </h2>

              <div className="flex items-center justify-center py-2">
                <div className="relative w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,108,73,0.12)]">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_4px_0_0_#00422b]">
                    <div className="relative w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-on-primary-fixed text-[28px] material-symbols-filled">
                        nutrition
                      </span>
                      <span className="material-symbols-outlined absolute -top-1 -right-1 text-secondary-container text-[18px] drop-shadow-sm material-symbols-filled">
                        star
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Answer Options */}
            <div className="flex flex-col gap-space-xs">
              {(currentQuestion.options || []).map((opt) => {
                const isSelected = selectedChoice === opt.choice;
                const isVerifiedCorrect =
                  checkedResult && checkedResult.correctChoice === opt.choice;
                const isVerifiedWrong =
                  checkedResult && isSelected && !checkedResult.isCorrect;

                let btnStyle = 'bg-surface-container-lowest shadow-[0_4px_0_0_#d8e3fb]';
                let badgeStyle = 'bg-surface-container text-on-surface';
                let textStyle = 'text-on-surface';

                if (isVerifiedWrong) {
                  btnStyle = 'bg-error-container shadow-[0_4px_0_0_#ba1a1a]';
                  badgeStyle = 'bg-error text-on-error';
                  textStyle = 'text-on-error-container';
                } else if (isVerifiedCorrect || (isSelected && !checkedResult)) {
                  btnStyle = 'bg-primary-fixed shadow-[0_4px_0_0_#4edea3]';
                  badgeStyle = 'bg-primary text-on-primary';
                  textStyle = 'text-on-primary-fixed';
                }

                return (
                  <button
                    key={opt.choice}
                    type="button"
                    disabled={Boolean(checkedResult)}
                    onClick={() => setSelectedChoice(opt.choice)}
                    className={`w-full text-left rounded-xl p-space-sm active:translate-y-1 active:shadow-none transition-all flex items-center justify-between group ${btnStyle}`}
                  >
                    <div className="flex items-center gap-space-sm min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl font-headline-sm text-headline-sm flex items-center justify-center shadow-sm shrink-0 ${badgeStyle}`}
                      >
                        {opt.choice}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[20px] text-primary shrink-0">
                          {opt.icon || 'restaurant'}
                        </span>
                        <span className={`font-headline-sm text-headline-sm truncate ${textStyle}`}>
                          {opt.label}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected || isVerifiedCorrect
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-low'
                      }`}
                    >
                      {(isSelected || isVerifiedCorrect) && (
                        <span className="material-symbols-outlined text-[16px]">
                          {isVerifiedWrong ? 'close' : 'check'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Primary Verification Action Button */}
            {!checkedResult && (
              <button
                type="button"
                disabled={!selectedChoice || submitting}
                onClick={handleCheckAnswer}
                className="w-full py-3.5 px-space-lg rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm shadow-[0_4px_0_0_#00422b] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{submitting ? 'Checking...' : 'Check Answer'}</span>
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
              </button>
            )}

            {/* Instant Feedback Card */}
            {checkedResult && (
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_0_0_#d8e3fb,0_10px_25px_rgba(0,108,73,0.06)] flex flex-col gap-space-sm relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                        checkedResult.isCorrect
                          ? 'bg-primary-container text-on-primary'
                          : 'bg-error text-on-error'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {checkedResult.isCorrect ? 'verified' : 'lightbulb'}
                      </span>
                    </div>
                    <span
                      className={`font-headline-sm text-headline-sm ${
                        checkedResult.isCorrect ? 'text-primary' : 'text-error'
                      }`}
                    >
                      {checkedResult.isCorrect
                        ? 'Correct! Awesome Job!'
                        : `Good try! Correct: ${checkedResult.correctChoice}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm shadow-[0_2px_0_0_#d0bcff] shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-tertiary material-symbols-filled">
                      stars
                    </span>
                    <span>+{checkedResult.xpValue} XP</span>
                  </div>
                </div>

                <p className="text-on-surface-variant font-body-md text-body-md leading-relaxed">
                  {checkedResult.explanation}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(checkedResult.foodTags || []).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Question Navigation Stepper Dock */}
            <div className="bg-surface-container-low rounded-2xl p-space-sm shadow-sm flex flex-col gap-space-xs mt-1">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Round 1 Progress
                </span>
                <span className="font-label-sm text-label-sm text-primary font-bold">
                  {currentIdx + (checkedResult ? 1 : 0)} answered
                </span>
              </div>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${totalQuestions}, minmax(0, 1fr))` }}
              >
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`h-2 rounded-full ${
                      idx < currentIdx
                        ? 'bg-primary-container'
                        : idx === currentIdx
                          ? 'bg-primary'
                          : 'bg-surface-container-highest'
                    }`}
                  />
                ))}
              </div>
            </div>

            {checkedResult && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleNextQuestion}
                className="w-full h-12 py-3 px-space-md rounded-full bg-surface-container-highest text-on-surface font-headline-sm text-headline-sm shadow-[0_4px_0_0_#cfdaf2] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish & Claim XP'}
                </span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </>
        ) : (
          <div className="p-6 rounded-xl bg-surface-container-lowest text-center text-on-surface-variant">
            No quiz questions available.
          </div>
        )}
      </div>
    </StackShell>
  );
}
