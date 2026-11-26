import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiRequest, isDemoMode } from '../lib/api';
import { DEMO_SESSION, DEMO_PROFILE } from '../lib/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // ── Toast helpers ──────────────────────────────────────────
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // ── Profile fetch ──────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (isDemoMode) {
      setProfile(DEMO_PROFILE);
      return DEMO_PROFILE;
    }
    try {
      const data = await apiRequest('/api/profile');
      const p = data?.profile || data || null;
      if (p) setProfile(p);
      return p;
    } catch {
      return null;
    }
  }, []);

  // ── Auth init ──────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    async function init() {
      // ---- Demo mode: auto-login ----
      if (isDemoMode) {
        if (active) {
          setSession(DEMO_SESSION);
          setProfile(DEMO_PROFILE);
          setLoading(false);
        }
        return;
      }

      // ---- Real Supabase auth ----
      if (!isSupabaseConfigured) {
        if (active) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session || null);
      if (data.session?.user) await refreshProfile();
      if (active) setLoading(false);
    }

    init();

    // Listen to auth state changes (only in real mode)
    let subscription = { unsubscribe: () => {} };
    if (!isDemoMode && isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, next) => {
        if (!active) return;
        setSession(next || null);
        if (next?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      subscription = data.subscription;
    }

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  // ── Sign out ───────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (isDemoMode) {
      // In demo mode, just show a toast — stay on page
      addToast('Sign out is disabled in Demo Mode 🎮', 'info');
      return;
    }
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, [addToast]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        setProfile,
        refreshProfile,
        loading,
        authLoading: loading,
        signOut,
        supabase,
        isDemoMode,
        // Toast system
        toasts,
        addToast,
        // Legacy compat
        showToast: addToast,
        toast: toasts[0] || { visible: false, message: '', type: 'success' },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
