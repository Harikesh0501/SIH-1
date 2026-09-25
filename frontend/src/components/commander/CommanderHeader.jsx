"use client";

import React from 'react';
import {
  Activity,
  Sliders,
  FileText,
  LogOut,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function CommanderHeader({
  activeTab,
  onTabChange,
  currentUser,
  onRefresh,
  isLoading = false,
  kAnonymityCount = 5,
}) {
  const { logout } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Strategic Dashboard', icon: Activity },
    { id: 'simulator', label: 'Workload Simulator', icon: Sliders },
    { id: 'briefing', label: 'Executive Briefing', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Left: Brand & Portal Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-sm shadow-xs">
              R
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-slate-950">RAKSHAK</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-700">Command Center</span>
            </div>
          </div>

          {/* Center: Clean Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto" aria-label="Commander Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all select-none whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Security Pill, Officer Info & Logout */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>k≥{kAnonymityCount} Anonymized</span>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.full_name || 'Col. Devendra Sharma'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {currentUser?.rank || 'Commandant'} • 104 Bn
              </div>
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh Telemetry"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              onClick={logout}
              title="Sign Out"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

export default CommanderHeader;
