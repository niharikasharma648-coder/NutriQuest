import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AuthPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!isSupabaseConfigured) {
      setError('Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not configured yet.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cleanName = displayName.trim() || email.split('@')[0];
        const cleanUser = (username.trim() || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');

        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: cleanName,
              username: cleanUser || 'explorer',
            },
          },
        });

        if (signUpErr) throw signUpErr;

        if (!data.session) {
          setInfoMessage(
            'Account created! Check your inbox to confirm your email address, then sign in.'
          );
          setMode('signin');
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center px-margin-mobile py-8">
      <div className="max-w-md mx-auto w-full flex flex-col gap-space-md">
        {/* Hero Brand Card matching Stitch aesthetic */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary-container to-primary p-space-lg text-on-primary shadow-[0_12px_28px_rgba(0,108,73,0.22)]">
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="NutriQuest Brand Logo"
              className="w-12 h-12 rounded-full bg-white/90 p-1 shadow-md object-contain"
            />
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed font-extrabold">
                Gamified Nutrition Platform
              </span>
              <h1 className="font-headline-xl-mobile text-headline-xl-mobile font-extrabold text-white leading-tight">
                NutriQuest
              </h1>
            </div>
          </div>
          <p className="relative z-10 mt-3 font-body-md text-body-md text-surface-container-high">
            Turn Nutrition Into a Quest! Learn. Play. Eat Better.
          </p>
        </section>

        {/* Auth Form Card */}
        <section className="rounded-xl bg-surface-container-lowest p-space-lg shadow-[0_6px_0_0_#d8e3fb,0_16px_28px_rgba(0,108,73,0.06)] flex flex-col gap-space-md">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-full bg-surface-container-low">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`py-2 rounded-full font-label-md text-label-md font-extrabold transition-all ${
                mode === 'signin'
                  ? 'bg-primary text-on-primary shadow-[0_2px_0_0_#00422b]'
                  : 'text-on-surface-variant'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2 rounded-full font-label-md text-label-md font-extrabold transition-all ${
                mode === 'signup'
                  ? 'bg-primary text-on-primary shadow-[0_2px_0_0_#00422b]'
                  : 'text-on-surface-variant'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Maya Chen"
                    className="w-full h-11 px-4 rounded-DEFAULT bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Quest Handle
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nutriexplorer"
                    className="w-full h-11 px-4 rounded-DEFAULT bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.edu"
                className="w-full h-11 px-4 rounded-DEFAULT bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-11 px-4 rounded-DEFAULT bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="rounded-DEFAULT bg-error-container text-on-error-container px-3 py-2.5 font-body-sm text-body-sm font-semibold">
                {error}
              </div>
            )}

            {infoMessage && (
              <div className="rounded-DEFAULT bg-primary-fixed text-on-primary-fixed px-3 py-2.5 font-body-sm text-body-sm font-semibold">
                {infoMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 active:translate-y-1 transition-all duration-150 rounded-full bg-secondary-container hover:bg-secondary-container/95 text-on-secondary-container px-6 py-3.5 flex items-center justify-center gap-2 font-label-lg text-label-lg shadow-[0_5px_0_0_#b37400,0_10px_20px_rgba(254,166,25,0.35)] disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">
                {loading ? 'sync' : mode === 'signin' ? 'login' : 'rocket_launch'}
              </span>
              <span className="font-extrabold tracking-wide uppercase">
                {loading
                  ? 'Connecting...'
                  : mode === 'signin'
                    ? 'Enter Quest Arena'
                    : 'Start My Quest'}
              </span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
