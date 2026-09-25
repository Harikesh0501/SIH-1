"use client";

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RouteGuard } from '../components/layout/RouteGuard';
import { CommanderPortal } from '../components/commander/CommanderPortal';
import { WelfarePortal } from '../components/welfare/WelfarePortal';
import { JawanPortal } from '../components/jawan/JawanPortal';
import { AuditPortal } from '../components/audit/AuditPortal';
import { ShieldAlert } from 'lucide-react';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <RouteGuard>
      {user?.role === 'Commanding Officer' && <CommanderPortal />}
      {user?.role === 'Welfare Officer' && <WelfarePortal />}
      {user?.role === 'Jawan' && <JawanPortal />}
      {user?.role === 'Audit Admin' && <AuditPortal />}

      {/* Fallback if role is not recognized */}
      {user && !['Commanding Officer', 'Welfare Officer', 'Jawan', 'Audit Admin'].includes(user.role) && (
        <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center mx-auto border border-slate-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-950">Unknown Role Assignment</h2>
          <p className="text-xs text-slate-500">
            Your credentials were authenticated, but no tactical portal matches role: <strong>{user.role}</strong>.
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Sign Out
          </button>
        </div>
      )}
    </RouteGuard>
  );
}
