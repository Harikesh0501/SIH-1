"use client";

import React from 'react';
import {
  Clock,
  HeartPulse,
  Sparkles,
  Calendar,
  ShieldCheck,
  LogOut,
  User,
} from 'lucide-react';
import { getTranslation } from './translations';
import { useAuth } from '../../context/AuthContext';

export function JawanHeader({
  activeTab,
  onTabChange,
  currentUser,
  lang = 'en',
  onToggleLanguage,
}) {
  const { logout } = useAuth();
  const t = (key) => getTranslation(lang, key);

  const tabs = [
    { id: 'checkin', label: t('tabCheckin'), icon: Clock },
    { id: 'sathi', label: t('tabAiSathi'), icon: Sparkles },
    { id: 'leave', label: t('tabLeave'), icon: Calendar },
    { id: 'certificate', label: t('tabCertificate'), icon: ShieldCheck },
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
              <span className="text-xs font-semibold text-slate-700">Soldier Enclave</span>
            </div>
          </div>

          {/* Center: Clean Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto" aria-label="Jawan Tabs">
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

          {/* Right: Language Switcher, Soldier Info & Logout */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Language Switcher */}
            <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                onClick={() => onToggleLanguage('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onToggleLanguage('hi')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'hi' ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.full_name || 'Ct. Ramesh Kumar'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {currentUser?.service_number || 'CT-RAMESH-84920'}
              </div>
            </div>

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

export default JawanHeader;
