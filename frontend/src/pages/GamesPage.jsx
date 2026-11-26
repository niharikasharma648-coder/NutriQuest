import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabShell from '../components/TabShell';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function GamesPage() {
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const [stats, setStats] = useState({ arcadeCoins: 100, gamesWon: 0, dailyTrophies: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launchingGame, setLaunchingGame] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      const res = await apiRequest('/api/games/overview');
      if (res.stats) setStats(res.stats);
      setLeaderboard(res.leaderboard || []);
    } catch (err) {
      showToast(err.message || 'Failed to load arcade data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const launchGame = (title, route) => {
    setLaunchingGame({ title, route });
    setTimeout(() => {
      setLaunchingGame(null);
      navigate(route);
    }, 450);
  };

  return (
    <TabShell subtitle="Games">
      <div className="flex flex-col w-full px-margin-mobile gap-space-lg pb-10">
        {/* Arcade Hero Headline */}
        <div className="flex flex-col gap-space-xs mt-2">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile font-extrabold text-on-surface tracking-tight">
              NutriQuest Arcade
            </h1>
            <span className="text-2xl animate-bounce">🕹️</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant font-medium">
            Play, compete, and level up your nutrition smarts!
          </p>
        </div>

        {/* Gamified Stats Counter Bar */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-surface-container-high rounded-2xl shadow-sm">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-lowest shadow-sm text-center">
            <div className="flex items-center gap-1">
              <span className="text-sm">🪙</span>
              <span className="font-headline-sm text-headline-sm text-secondary font-black">
                {stats.arcadeCoins}
              </span>
            </div>
            <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Arcade Coins
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-lowest shadow-sm text-center">
            <div className="flex items-center gap-1">
              <span className="text-sm">🏆</span>
              <span className="font-headline-sm text-headline-sm text-primary font-black">
                {stats.gamesWon}
              </span>
            </div>
            <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Games Won
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-lowest shadow-sm text-center">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-tertiary font-bold material-symbols-filled">
                stars
              </span>
              <span className="font-headline-sm text-headline-sm text-tertiary font-black">
                {stats.dailyTrophies}/5
              </span>
            </div>
            <span className="font-label-sm text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Daily Trophies
            </span>
          </div>
        </div>

        {/* Featured Spotlight Banner: Double XP */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-container p-5 text-on-primary shadow-[0_8px_20px_rgba(0,108,73,0.22)]">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-extrabold uppercase shadow-sm">
                <span className="material-symbols-outlined text-[14px]">
                  local_fire_department
                </span>
                Game of the Week
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-on-primary/20 backdrop-blur-md text-on-primary font-label-sm text-label-sm font-extrabold">
                <span>⚡ 2X XP Active</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-headline-lg text-headline-lg font-black text-on-primary leading-tight">
                Double XP on Build Your Plate!
              </h2>
              <p className="font-body-sm text-body-sm text-on-primary/90 font-medium">
                Stack combos, unlock golden chef badges &amp; earn +150 bonus XP per victory!
              </p>
            </div>
            <button
              type="button"
              onClick={() => launchGame('Build Your Plate', '/games/build-your-plate')}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-secondary-container text-on-secondary-container font-label-lg text-label-lg font-black shadow-[0_4px_0_0_#855300] active:translate-y-1 active:shadow-none transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              <span>Quick Play • 2X Boost</span>
            </button>
          </div>
        </div>

        {/* Game Cards Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
              Choose Your Mini-Game
            </h3>
            <span className="font-label-md text-label-md font-bold text-primary">3 Live Arenas</span>
          </div>

          {/* GAME 1: Build Your Plate */}
          <div className="flex flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-[0_6px_0_0_#d8e3fb] gap-3 transition-transform hover:-translate-y-0.5">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-fixed/40 via-surface-container to-secondary-fixed/40 flex items-center justify-center">
              <div className="flex items-center gap-4 text-5xl select-none">
                <span>🥦</span>
                <span className="text-6xl">🍽️</span>
                <span>🐟</span>
              </div>
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-extrabold shadow-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
                Most Popular
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                <span>⭐ ⭐</span>
                <span className="text-outline">☆</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-md text-headline-md font-extrabold text-on-surface flex items-center gap-1.5">
                  Build Your Plate 🍽️
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-bold">
                  Medium
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                Assemble delicious foods into perfectly balanced meals. Balance macros, hit vitamin
                goals, and score chef combos!
              </p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-black flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">bolt</span> +150 XP
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-black flex items-center gap-1">
                    🪙 25
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => launchGame('Build Your Plate', '/games/build-your-plate')}
                  className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-[0_4px_0_0_#00422b] active:translate-y-1 active:shadow-none transition-all flex items-center gap-1"
                >
                  <span>Play Now</span>
                  <span>🚀</span>
                </button>
              </div>
            </div>
          </div>

          {/* GAME 2: Food Detective */}
          <div className="flex flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-[0_6px_0_0_#d8e3fb] gap-3 transition-transform hover:-translate-y-0.5">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-tertiary-fixed/50 via-surface-container to-primary-fixed/40 flex items-center justify-center">
              <div className="flex items-center gap-4 text-5xl select-none">
                <span>🥑</span>
                <span className="text-6xl">🔍</span>
                <span>🥨</span>
              </div>
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-tertiary text-on-tertiary font-label-sm text-label-sm font-extrabold shadow-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">timer</span>
                Speed Trivia
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                <span>⭐</span>
                <span className="text-outline">☆ ☆</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-md text-headline-md font-extrabold text-on-surface flex items-center gap-1.5">
                  Food Detective 🔍
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-bold">
                  Easy • Fast Paced
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                Two foods enter, only the most nutrient-dense wins! Spot healthy swaps and identify
                hidden nutritional traps against the clock.
              </p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-black flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">bolt</span> +50 XP
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-black flex items-center gap-1">
                    🪙 15
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => launchGame('Food Detective', '/games/food-detective')}
                  className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-[0_4px_0_0_#00422b] active:translate-y-1 active:shadow-none transition-all flex items-center gap-1"
                >
                  <span>Play Now</span>
                  <span>🚀</span>
                </button>
              </div>
            </div>
          </div>

          {/* GAME 3: Sugar Detective */}
          <div className="flex flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-[0_6px_0_0_#d8e3fb] gap-3 transition-transform hover:-translate-y-0.5">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-secondary-fixed/50 via-tertiary-fixed/40 to-surface-container flex items-center justify-center">
              <div className="flex items-center gap-4 text-5xl select-none">
                <span>🥤</span>
                <span className="text-6xl">🔎</span>
                <span>🍬</span>
              </div>
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-extrabold shadow-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">visibility</span>
                Eye Opener
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                <span>⭐ ⭐ ⭐</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-md text-headline-md font-extrabold text-on-surface flex items-center gap-1.5">
                  Sugar Detective 🔎🍬
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-bold">
                  Hard
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                Can you guess how many sugar cubes are lurking in everyday drinks and snacks? Test
                your eye against marketing claims!
              </p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-black flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">bolt</span> +90 XP
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-black flex items-center gap-1">
                    🪙 40
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => launchGame('Sugar Detective', '/games/sugar-detective')}
                  className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-[0_4px_0_0_#00422b] active:translate-y-1 active:shadow-none transition-all flex items-center gap-1"
                >
                  <span>Play Now</span>
                  <span>🚀</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Snapshot */}
        <div className="flex flex-col rounded-3xl bg-surface-container p-4 gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px] material-symbols-filled">
                military_tech
              </span>
              <h3 className="font-headline-sm text-headline-sm font-black text-on-surface">
                Campus High Scores
              </h3>
            </div>
            <span className="font-label-sm text-label-sm font-bold text-primary">This Week</span>
          </div>

          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="h-24 rounded-2xl bg-surface-container-lowest animate-pulse" />
            ) : leaderboard.length === 0 ? (
              <div className="p-3 rounded-2xl bg-surface-container-lowest text-center font-body-sm text-body-sm text-on-surface-variant">
                Play a mini-game to claim the #1 Campus spot!
              </div>
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl bg-surface-container-lowest shadow-sm ${
                    entry.isCurrentUser ? 'ring-2 ring-primary/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full font-label-sm text-label-sm font-black flex items-center justify-center shrink-0 ${
                        entry.rank === 1
                          ? 'bg-secondary-container text-on-secondary-container'
                          : entry.rank === 3
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : 'bg-surface-container-highest text-on-surface'
                      }`}
                    >
                      {entry.rank}
                    </div>
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-fixed shrink-0">
                      <img
                        className="w-full h-full object-cover"
                        src={entry.avatarUrl}
                        alt={entry.displayName}
                        onError={(e) => {
                          e.currentTarget.src = '/assets/default-avatar.png';
                        }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                        {entry.displayName} {entry.isCurrentUser ? '(You)' : ''}
                      </span>
                      <span className="font-label-sm text-[11px] text-on-surface-variant truncate">
                        {entry.rankTitle}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-label-lg text-label-lg font-black text-primary">
                      {entry.points.toLocaleString()} pts
                    </span>
                    <span className="font-label-sm text-[10px] text-secondary font-extrabold">
                      {entry.rank === 1 ? '👑 #1 Leader' : `${entry.wins} wins`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Launching Arena Transition Modal */}
      {launchingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-6 flex flex-col items-center text-center gap-4 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.2)]">
            <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-3xl animate-bounce">
              🎮
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-primary font-black uppercase tracking-wider">
                Connecting to Arena
              </span>
              <h4 className="font-headline-lg text-headline-lg font-black text-on-surface">
                {launchingGame.title}
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Get ready! Warm up your reflexes and nutrition knowledge.
              </p>
            </div>
            <div className="w-full bg-surface-container-highest h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-2/3 animate-pulse" />
            </div>
            <button
              type="button"
              onClick={() => setLaunchingGame(null)}
              className="w-full py-3 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </TabShell>
  );
}
