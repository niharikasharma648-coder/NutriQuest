import React, { useCallback, useEffect, useState } from 'react';
import StackShell from '../components/StackShell';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const MEAL_QUESTS = [
  'Healthy Balanced Lunch',
  'Power Study Breakfast',
  'Post-Workout Recovery Dinner',
];

export default function BuildPlatePage() {
  const { setProfile, showToast } = useAuth();
  const [pantryFoods, setPantryFoods] = useState([]);
  const [savedPlates, setSavedPlates] = useState([]);
  const [questIndex, setQuestIndex] = useState(0);
  const [filterCat, setFilterCat] = useState('all');
  const [secondsLeft, setSecondsLeft] = useState(105);
  const [plateState, setPlateState] = useState({
    veggie: [
      { name: 'Broccoli', emoji: '🥦' },
      { name: 'Spinach', emoji: '🥗' },
    ],
    grain: [{ name: 'Quinoa', emoji: '🌾' }],
    protein: [{ name: 'Salmon', emoji: '🐟' }],
  });
  const [feedback, setFeedback] = useState({
    highlight: 'Awesome balance!',
    text: 'Your plate has colorful produce, fiber-rich grains, and lean protein. Tap Check My Plate to earn 2X XP!',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadPantry = useCallback(async () => {
    try {
      const res = await apiRequest('/api/games/pantry');
      setPantryFoods(res.foods || []);
      setSavedPlates(res.savedPlates || []);
    } catch (err) {
      showToast(err.message || 'Failed to load pantry foods', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadPantry();
  }, [loadPantry]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalVeg = plateState.veggie.length;
  const totalGrain = plateState.grain.length;
  const totalProtein = plateState.protein.length;
  const totalItems = totalVeg + totalGrain + totalProtein || 1;

  const pctVeg = Math.round((totalVeg / totalItems) * 100);
  const pctGrain = Math.round((totalGrain / totalItems) * 100);
  const pctProtein = Math.max(0, 100 - pctVeg - pctGrain);

  const totalError = Math.abs(pctVeg - 50) + Math.abs(pctGrain - 25) + Math.abs(pctProtein - 25);
  const score =
    totalVeg + totalGrain + totalProtein === 0
      ? 0
      : Math.max(20, Math.min(100, 100 - Math.round(totalError * 0.8)));

  const toggleFood = (food) => {
    const section =
      food.category === 'veggie' || food.category === 'grain' || food.category === 'protein'
        ? food.category
        : 'veggie';

    const exists = plateState[section].some((i) => i.name === food.name);
    setPlateState((prev) => ({
      ...prev,
      [section]: exists
        ? prev[section].filter((i) => i.name !== food.name)
        : [...prev[section], { name: food.name, emoji: food.emoji }],
    }));
    showToast(exists ? `Removed ${food.name}` : `Added ${food.emoji} ${food.name} to Plate!`);
  };

  const handleReset = () => {
    setPlateState({ veggie: [], grain: [], protein: [] });
    showToast('Plate cleared!');
  };

  const persistPlate = async (submitAsWin) => {
    if (totalVeg + totalGrain + totalProtein === 0) {
      showToast('Add at least one food to your plate first!', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/games/plates', {
        method: 'POST',
        body: {
          questName: MEAL_QUESTS[questIndex],
          items: plateState,
          vegPct: pctVeg,
          grainPct: pctGrain,
          proteinPct: pctProtein,
          score,
          submitAsWin,
        },
      });
      if (res.profile) setProfile(res.profile);
      await loadPantry();

      if (submitAsWin) {
        if (res.isGoldenRatio) {
          setFeedback({
            highlight: 'Incredible Balance!',
            text: `Your plate hits the golden 50/25/25 ratio! You earned +${res.awardedXp} XP & +${res.awardedCoins} Coins.`,
          });
          showToast(`Plate Validated! +${res.awardedXp} XP`);
        } else if (totalVeg < 2) {
          setFeedback({
            highlight: 'Needs More Greens:',
            text: `Saved (+${res.awardedXp} XP). Try adding at least 2 veggies/fruits to hit the 50% plant target!`,
          });
          showToast(`Checked! +${res.awardedXp} XP`);
        } else {
          setFeedback({
            highlight: 'Almost there:',
            text: `Saved (+${res.awardedXp} XP). Include both whole grains and lean protein for the 2X Victory Bonus!`,
          });
          showToast(`Checked! +${res.awardedXp} XP`);
        }
      } else {
        showToast(`💾 Plate saved! +${res.awardedXp} XP`);
      }
    } catch (err) {
      showToast(err.message || 'Could not save plate', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlate = async (id) => {
    try {
      await apiRequest(`/api/games/plates/${id}`, { method: 'DELETE' });
      setSavedPlates((prev) => prev.filter((p) => p.id !== id));
      showToast('Saved plate removed');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleNextQuest = () => {
    setQuestIndex((prev) => (prev + 1) % MEAL_QUESTS.length);
    setSecondsLeft(105);
    setPlateState({ veggie: [], grain: [], protein: [] });
    showToast('New Plate Quest loaded!');
  };

  const visibleFoods = pantryFoods.filter(
    (f) => filterCat === 'all' || f.category === filterCat
  );

  const isSelected = (food) => {
    const section =
      food.category === 'veggie' || food.category === 'grain' || food.category === 'protein'
        ? food.category
        : 'veggie';
    return plateState[section].some((i) => i.name === food.name);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <StackShell title="Game Arena" backTo="/games">
      <div className="flex flex-col w-full px-margin-mobile pb-8 gap-space-md select-none pt-2">
        {/* Game Header Info Card */}
        <div className="flex flex-col w-full bg-surface-container-lowest rounded-lg p-space-md shadow-[0_4px_0_0_#d8e3fb,0_10px_20px_rgba(0,108,73,0.04)]">
          <div className="flex items-center justify-between gap-space-sm mb-space-xs">
            <div className="flex items-center gap-1.5 bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full shadow-[0_2px_0_0_#ffb95f]">
              <span className="material-symbols-outlined text-[16px] text-secondary material-symbols-filled">
                timer
              </span>
              <span className="font-label-lg text-label-lg font-black tracking-wider">
                {mm}:{ss}
              </span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-surface-container text-primary rounded-full min-w-0">
              <span className="material-symbols-outlined text-[16px] shrink-0">track_changes</span>
              <span className="font-label-md text-label-md truncate">
                {MEAL_QUESTS[questIndex]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full shadow-[0_2px_0_0_#4edea3] shrink-0">
              <span className="material-symbols-outlined text-[18px] text-primary material-symbols-filled">
                stars
              </span>
              <span className="font-label-lg text-label-lg font-extrabold">{score}/100</span>
            </div>
          </div>

          <div className="flex items-start gap-space-sm bg-surface-container-low rounded-DEFAULT p-3 mt-1">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#006c49]">
              <span className="material-symbols-outlined text-[18px]">lightbulb</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-primary uppercase font-extrabold tracking-wider">
                Plate Quest Rule
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug mt-0.5">
                Fill <span className="font-bold text-primary">1/2</span> with veggies &amp; fruits,{' '}
                <span className="font-bold text-secondary">1/4</span> with whole grains, and{' '}
                <span className="font-bold text-error">1/4</span> with lean protein.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Plate Visual Stage */}
        <div className="flex flex-col items-center justify-center w-full bg-surface-container-lowest rounded-xl p-space-md shadow-[0_6px_0_0_#d8e3fb,0_16px_28px_rgba(0,108,73,0.06)] relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-primary-fixed-dim/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-secondary-fixed/30 blur-2xl pointer-events-none" />

          <div className="w-full flex items-center justify-between mb-space-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
              <span className="font-label-md text-label-md text-on-surface font-extrabold uppercase tracking-wide">
                Plate Assembler
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-outline hover:text-error transition-colors px-2 py-0.5 rounded-full bg-surface-container-low active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              <span className="font-label-sm text-label-sm">Reset</span>
            </button>
          </div>

          {/* 3D Tactile Ceramic Plate */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-surface-container-highest p-3 shadow-[inset_0_4px_10px_rgba(0,0,0,0.08),0_12px_24px_rgba(0,66,43,0.12)] flex items-center justify-center">
            <div className="relative w-full h-full rounded-full bg-surface-container-lowest shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] flex items-center justify-center p-2.5 overflow-hidden">
              <div className="relative w-full h-full rounded-full overflow-hidden flex flex-row">
                {/* 50% LEFT WEDGE: Veggies & Fruits */}
                <div className="w-1/2 h-full bg-primary-fixed/25 p-2 flex flex-col justify-between items-center transition-all duration-300 relative">
                  <div className="flex items-center gap-1 bg-surface-container-lowest/90 px-2 py-0.5 rounded-full shadow-sm">
                    <span className="material-symbols-outlined text-[12px] text-primary material-symbols-filled">
                      eco
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">
                      50% Greens
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 my-auto max-w-[110px]">
                    {plateState.veggie.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-full shadow-[0_2px_0_0_#bbcabf] text-[12px]"
                      >
                        <span>{item.emoji}</span>
                        <span className="font-label-sm text-label-sm text-on-surface">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="text-primary/60 font-label-sm text-label-sm font-semibold">
                    Veg &amp; Fruits
                  </span>
                </div>

                <div className="w-1 h-full bg-surface-container" />

                {/* 50% RIGHT SIDE */}
                <div className="w-1/2 h-full flex flex-col">
                  {/* 25% TOP RIGHT: Whole Grains */}
                  <div className="w-full h-1/2 bg-secondary-fixed/30 p-2 flex flex-col justify-between items-center transition-all duration-300">
                    <div className="flex items-center gap-1 bg-surface-container-lowest/90 px-2 py-0.5 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[12px] text-secondary material-symbols-filled">
                        grain
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">
                        25% Grains
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1 my-auto">
                      {plateState.grain.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-full shadow-[0_2px_0_0_#ffddb8] text-[12px]"
                        >
                          <span>{item.emoji}</span>
                          <span className="font-label-sm text-label-sm text-on-surface">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <span className="text-secondary/70 font-label-sm text-label-sm font-semibold">
                      Whole Grains
                    </span>
                  </div>

                  <div className="w-full h-1 bg-surface-container" />

                  {/* 25% BOTTOM RIGHT: Lean Protein */}
                  <div className="w-full h-1/2 bg-error-container/40 p-2 flex flex-col justify-between items-center transition-all duration-300">
                    <div className="flex items-center gap-1 bg-surface-container-lowest/90 px-2 py-0.5 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[12px] text-error material-symbols-filled">
                        egg_alt
                      </span>
                      <span className="font-label-sm text-label-sm text-error font-bold">
                        25% Protein
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1 my-auto">
                      {plateState.protein.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-full shadow-[0_2px_0_0_#ffdad6] text-[12px]"
                        >
                          <span>{item.emoji}</span>
                          <span className="font-label-sm text-label-sm text-on-surface">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <span className="text-error/80 font-label-sm text-label-sm font-semibold">
                      Lean Protein
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] pointer-events-none">
                <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              </div>
            </div>
          </div>

          {/* Macro Balance Gauges Track */}
          <div className="w-full flex flex-col gap-1.5 mt-space-md">
            <div className="flex items-center justify-between font-label-sm text-label-sm">
              <span className="text-on-surface-variant font-bold">Plate Macro Proportion</span>
              <span className="text-primary font-extrabold tracking-wide">Target: 50 / 25 / 25</span>
            </div>
            <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-primary-container transition-all duration-500 rounded-l-full"
                style={{ width: `${pctVeg}%` }}
              />
              <div
                className="h-full bg-secondary-container transition-all duration-500"
                style={{ width: `${pctGrain}%` }}
              />
              <div
                className="h-full bg-error transition-all duration-500 rounded-r-full"
                style={{ width: `${pctProtein}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-label-sm font-bold pt-0.5">
              <div className="flex items-center gap-1 text-primary">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                <span>
                  Veg: <b>{pctVeg}%</b>
                </span>
              </div>
              <div className="flex items-center gap-1 text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary-container" />
                <span>
                  Grains: <b>{pctGrain}%</b>
                </span>
              </div>
              <div className="flex items-center gap-1 text-error">
                <span className="w-2 h-2 rounded-full bg-error" />
                <span>
                  Protein: <b>{pctProtein}%</b>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pantry Selection Tray */}
        <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_0_0_#d8e3fb]">
          <div className="flex items-center justify-between mb-space-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">
                restaurant_menu
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Pantry Selection</h3>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              Tap to add
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {[
              { id: 'all', label: 'All Foods' },
              { id: 'veggie', label: 'Veggies 🥦' },
              { id: 'grain', label: 'Grains 🌾' },
              { id: 'protein', label: 'Protein 🍗' },
              { id: 'dairy', label: 'Dairy / Sides 🥛' },
            ].map((tab) => {
              const active = filterCat === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCat(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap active:scale-95 transition-transform ${
                    active
                      ? 'bg-primary text-on-primary shadow-[0_2px_0_0_#00422b]'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container shadow-[0_2px_0_0_#d8e3fb]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-space-xs mt-space-sm">
            {visibleFoods.map((food) => {
              const selected = isSelected(food);
              return (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => toggleFood(food)}
                  className={`flex items-center justify-between p-2.5 rounded-DEFAULT text-left transition-all relative overflow-hidden shadow-[0_3px_0_0_#d8e3fb] active:translate-y-0.5 ${
                    selected ? 'bg-primary-fixed/40' : 'bg-surface-container-low active:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">{food.emoji}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                        {food.name}
                      </span>
                      <span
                        className={`font-label-sm text-label-sm font-extrabold truncate ${
                          food.category === 'protein'
                            ? 'text-error'
                            : food.category === 'grain'
                              ? 'text-secondary'
                              : 'text-primary'
                        }`}
                      >
                        {food.tag}
                      </span>
                    </div>
                  </div>
                  {selected && (
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm ml-1">
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-Time Nutrition Coach Feedback Box */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_0_0_#d8e3fb] transition-all">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center text-xs shadow-sm">
              ★
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              Nutrition Coach Feedback
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            🌟 <strong className="text-primary font-bold">{feedback.highlight}</strong>{' '}
            {feedback.text}
          </p>
          <div className="flex items-center justify-between mt-3 pt-2.5 bg-surface-container-low rounded-DEFAULT px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px] material-symbols-filled">
                military_tech
              </span>
              <span className="font-label-md text-label-md text-on-surface font-bold">
                Master Plate Builder
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-primary bg-primary-fixed px-2 py-0.5 rounded-full font-black">
              +150 XP (2X)
            </span>
          </div>
        </div>

        {/* Main Tactile Action Controls */}
        <div className="flex flex-col gap-space-xs mt-1">
          <button
            type="button"
            disabled={submitting}
            onClick={() => persistPlate(true)}
            className="w-full py-3.5 px-6 rounded-full bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-[0_5px_0_0_#006c49,0_10px_20px_rgba(0,108,73,0.2)] active:translate-y-1 active:shadow-[0_1px_0_0_#006c49] transition-all disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[22px] material-symbols-filled">
              check_circle
            </span>
            <span>{submitting ? 'Validating...' : 'Check My Plate'}</span>
          </button>

          <div className="grid grid-cols-2 gap-space-xs">
            <button
              type="button"
              disabled={submitting}
              onClick={() => persistPlate(false)}
              className="w-full py-3 rounded-full bg-surface-container text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-1.5 shadow-[0_3px_0_0_#bbcabf] active:translate-y-0.5 transition-all disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">bookmark</span>
              <span>Save Plate</span>
            </button>
            <button
              type="button"
              onClick={handleNextQuest}
              className="w-full py-3 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-lg text-label-lg flex items-center justify-center gap-1.5 shadow-[0_3px_0_0_#ffb95f] active:translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                sports_esports
              </span>
              <span>Next Quest</span>
            </button>
          </div>
        </div>

        {/* Saved Plates History */}
        {savedPlates.length > 0 && (
          <div className="flex flex-col gap-2 bg-surface-container-low rounded-xl p-space-md">
            <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              Saved Plates ({savedPlates.length})
            </span>
            {savedPlates.slice(0, 4).map((sp) => (
              <div
                key={sp.id}
                className="flex items-center justify-between p-2.5 rounded-DEFAULT bg-surface-container-lowest shadow-sm"
              >
                <div className="min-w-0">
                  <div className="font-label-md text-label-md font-bold text-on-surface truncate">
                    {sp.quest_name}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    Score {sp.score}/100 • {sp.veg_pct}% Veg / {sp.grain_pct}% Grain /{' '}
                    {sp.protein_pct}% Protein
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePlate(sp.id)}
                  aria-label="Delete saved plate"
                  className="w-8 h-8 rounded-full bg-error-container/60 text-on-error-container flex items-center justify-center shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </StackShell>
  );
}
