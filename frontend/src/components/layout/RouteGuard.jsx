"use client";

import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from '../auth/LoginPage';

export function RouteGuard({ children, allowedRoles }) {
  const { user, loading, logout } = useAuth();

  // Session validating spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm shadow-sm animate-pulse">
            R
          </div>
          <div className="text-xs font-semibold text-slate-500 font-mono">
            Validating Security Clearance...
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: Show Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Role authorization check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center mx-auto border border-slate-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-950">403 Forbidden: Access Restricted</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              According to the military RBAC security policy, your assigned role (<b className="text-slate-900">{user.role}</b>) does not possess clearance to inspect this terminal.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={logout}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Switch to Authorized Officer</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default RouteGuard;
