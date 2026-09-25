"use client";

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function AppLayoutShell({ children }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-black selection:text-white">
      <main className="flex-1 w-full">
        {children}
      </main>
      <footer className="no-print border-t border-slate-200 bg-white py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-mono">
          RAKSHAK-AAYUSH &copy; 2026 &bull; Central Armed Police Forces (CAPF) &bull; DPDPA 2023 §14 Quarantined &bull; Next.js 16
        </div>
      </footer>
    </div>
  );
}

export default AppLayoutShell;
