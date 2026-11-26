import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ToastBanner from './ToastBanner';

export default function StackShell({ title, backTo, children }) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const currentXp = profile?.current_xp ?? 0;
  const avatarUrl = profile?.avatar_url || '/assets/default-avatar.png';

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,108,73,0.06)]">
        <div className="max-w-lg mx-auto w-full h-16 px-margin-mobile flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <button
              aria-label="Go Back"
              type="button"
              onClick={handleBack}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface active:scale-95 transition-transform shadow-[0_2px_0_0_#d8e3fb]"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <img
              alt="NutriQuest Brand Logo"
              className="h-7 w-auto object-contain shrink-0"
              src="/assets/logo.png"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
                {title}
              </span>
              <span className="font-label-sm text-label-sm text-primary font-extrabold">
                NutriQuest
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-xs shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px] text-primary">bolt</span>
              <span className="font-extrabold">+{currentXp}</span>
            </div>
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 ml-1"
              src={avatarUrl}
              onError={(e) => {
                e.currentTarget.src = '/assets/default-avatar.png';
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-16 pb-safe bg-surface flex-1">
        <div className="max-w-lg mx-auto w-full flex flex-col">{children}</div>
      </main>

      <ToastBanner />
    </>
  );
}
