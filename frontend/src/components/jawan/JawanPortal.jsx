"use client";

import React, { useState, useEffect } from 'react';
import { JawanHeader } from './JawanHeader';
import { PrivacyCertificateCard } from './PrivacyCertificateCard';
import { DailyCheckinCard } from './DailyCheckinCard';
import { AiSathiView } from './AiSathiView';
import { LeaveTrackerCard } from './LeaveTrackerCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { getTranslation } from './translations';
import {
  ShieldCheck,
  Lock,
  Clock,
  HeartPulse,
  Sparkles,
  Calendar,
  AlertTriangle,
  Award,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export function JawanPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('checkin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Persistent language preference
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rakshak_lang') || 'en';
    }
    return 'en';
  });

  const handleToggleLanguage = (newLang) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rakshak_lang', newLang);
    }
  };

  const t = (key) => getTranslation(lang, key);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 flex flex-col">
      {/* Header with Bilingual Switcher & Decoupling Badge */}
      <JawanHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={user}
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
        onOpenCertificateModal={() => setIsCertModalOpen(true)}
      />

      {/* Main Enclave Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full space-y-6">
        {/* Error notification if backend connection fails */}
        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Enclave Notice:</strong> {error}</span>
            </div>
            <Button size="xs" variant="outline" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* APAR/ACR Decoupling Trust & Immunity Strip */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-200 shrink-0">
              <Lock className="w-4 h-4 text-emerald-800" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {t('aparCertificateTitle')}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900">
                  DPDPA §14
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                "{t('aparGuaranteeShort')}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Button
              size="xs"
              variant="outline"
              onClick={() => setIsCertModalOpen(true)}
              className="font-semibold text-xs"
              leftIcon={ShieldCheck}
            >
              {t('viewCertificateBtn')}
            </Button>
          </div>
        </div>

        {/* TAB 1: Daily Wellness Check-in (Task 8.2) */}
        {activeTab === 'checkin' && (
          <div className="animate-in fade-in-50 duration-200">
            <DailyCheckinCard
              lang={lang}
              onNavigateToSathi={() => setActiveTab('sathi')}
              onCheckinComplete={(res) => {
                console.log('Daily check-in evaluated:', res);
              }}
            />
          </div>
        )}

        {/* TAB 2: AI Sathi Mental Resilience Companion (Task 8.4) */}
        {activeTab === 'sathi' && (
          <div className="animate-in fade-in-50 duration-200">
            <AiSathiView
              lang={lang}
              onTriggerCheckin={() => setActiveTab('checkin')}
            />
          </div>
        )}

        {/* TAB 4: Private Leave & Welfare Requests (Task 8.5) */}
        {activeTab === 'leave' && (
          <div className="animate-in fade-in-50 duration-200">
            <LeaveTrackerCard
              lang={lang}
              onNavigateToSathi={() => setActiveTab('sathi')}
            />
          </div>
        )}

        {/* TAB 5: APAR Decoupling Immunity Certificate (Task 8.1) */}
        {activeTab === 'certificate' && (
          <div className="animate-in fade-in-50 duration-200 max-w-4xl mx-auto">
            <PrivacyCertificateCard lang={lang} />
          </div>
        )}
      </main>

      {/* Standalone Certificate Modal for Quick Inspection from Any Tab */}
      {isCertModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCertModalOpen(false)}
          size="xl"
          className="max-h-[92vh]"
        >
          <ModalHeader className="bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-800" />
              <ModalTitle className="text-base font-bold text-slate-900">
                {t('aparCertificateTitle')}
              </ModalTitle>
            </div>
          </ModalHeader>

          <ModalBody className="p-4 sm:p-6 overflow-y-auto">
            <PrivacyCertificateCard lang={lang} />
          </ModalBody>

          <ModalFooter className="bg-slate-50 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsCertModalOpen(false)}>
              Close Certificate
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

export default JawanPortal;
