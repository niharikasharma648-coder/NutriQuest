import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ToastBanner() {
  const { toasts, isDemoMode } = useAuth();

  return (
    <>
      {/* Demo mode ribbon */}
      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-yellow-400 text-black text-center text-xs font-bold py-1 px-4">
          🎮 DEMO MODE — Add Supabase credentials in <code>frontend/.env</code> to use real data
        </div>
      )}

      {/* Toast stack */}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`w-full px-4 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-xl pointer-events-auto transition-all duration-300 ${
              toast.type === 'error'
                ? 'bg-red-600 text-white'
                : toast.type === 'info'
                ? 'bg-blue-600 text-white'
                : 'bg-green-500 text-black'
            }`}
          >
            <span className="text-base">
              {toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}
            </span>
            <span className="truncate flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
