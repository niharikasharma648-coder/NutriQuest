import { supabase, isSupabaseConfigured } from './supabase';
import { getMockResponse } from './mockData';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Demo mode: true when Supabase is not properly configured
export const isDemoMode =
  !isSupabaseConfigured ||
  import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.includes('placeholder');

function buildUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
}

// Simulate a slight delay in demo mode so it feels real
function demoDelay(ms = 300) {
  return new Promise(r => setTimeout(r, ms));
}

export async function apiRequest(path, options = {}) {
  // ── DEMO MODE ─────────────────────────────────────────────
  if (isDemoMode) {
    await demoDelay(250);
    const method = options.method?.toUpperCase() || 'GET';
    const result = getMockResponse(path, method);
    if (result === null) throw new Error('Not found in demo mode');
    return result;
  }

  // ── REAL MODE ─────────────────────────────────────────────
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const isFormData =
    options.isFormData || options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body:
      !isFormData && options.body && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && payload.error) ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.details = payload?.details;
    throw err;
  }

  return payload;
}
