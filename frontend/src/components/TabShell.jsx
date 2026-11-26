import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ToastBanner from './ToastBanner';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/quests', label: 'Quests', icon: 'explore' },
  { path: '/games', label: 'Games', icon: 'sports_esports' },
  { path: '/learn', label: 'Learn', icon: 'menu_book' },
  { path: '/rewards', label: 'Rewards', icon: 'redeem' },
  { path: '/profile', label: 'Profile', icon: 'account_circle' },
];

export default function TabShell({ subtitle, activeTab, children }) {
  const location = useLocation();
  const { profile } = useAuth();

  const streakDays = profile?.streak ?? profile?.streak_days ?? 1;
  const currentXp = profile?.xp ?? profile?.current_xp ?? 0;
  const xpToNext = profile?.xpToNextLevel ?? profile?.xp_to_next_level ?? 500;
  const level = profile?.level ?? 1;
  const rankTitle = profile?.title ?? profile?.rank_title ?? 'Quest Novice';
  const pct = Math.min(100, Math.round((currentXp / xpToNext) * 100));
  const avatarUrl = profile?.avatarUrl ?? profile?.avatar_url ?? '/assets/default-avatar.png';

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,108,73,0.06)]">
        <div className="max-w-lg mx-auto w-full h-24 px-margin-mobile flex flex-col justify-center gap-space-xs">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <img
                alt="NutriQuest Brand Logo"
                className="h-8 w-auto object-contain shrink-0"
                src="/assets/logo.png"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-extrabold truncate leading-tight">
                  NutriQuest
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                  {subtitle}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs shrink-0">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/20 text-on-secondary-container font-label-sm text-label-sm shadow-[0_2px_0_0_#ffddb8]">
                <span className="text-xs leading-none">🔥</span>
                <span className="font-extrabold">{streakDays}</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm shadow-[0_2px_0_0_#4edea3]">
                <span className="material-symbols-outlined text-[14px] leading-none text-primary">
                  bolt
                </span>
                <span className="font-extrabold">+{currentXp} XP</span>
              </div>
              <Link
                className="relative shrink-0 block rounded-full ring-2 ring-primary/20 shadow-[0_2px_4px_rgba(0,0,0,0.08)] ml-1"
                to="/profile"
              >
                <img
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                  src={avatarUrl}
                  onError={(e) => {
                    e.currentTarget.src = '/assets/default-avatar.png';
                  }}
                />
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px] text-secondary">
                military_tech
              </span>
              <span className="font-bold">
                Lv. {level} {rankTitle}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-[130px] ml-3">
              <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden p-[1px]">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-label-sm text-[10px] text-on-surface-variant font-bold">
                {pct}%
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-24 pb-28 bg-surface flex-1">
        <div className="max-w-lg mx-auto w-full flex flex-col">{children}</div>
      </main>

      <ToastBanner />

      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="max-w-lg mx-auto w-full flex justify-around items-center h-16 px-space-xs">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-w-[50px] h-12 transition-transform active:scale-95 ${
                  isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
                }`}
                to={item.path}
              >
                <span
                  className={`material-symbols-outlined text-[24px] ${
                    isActive ? 'material-symbols-filled' : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span className="font-label-sm text-label-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
