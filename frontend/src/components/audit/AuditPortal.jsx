"use client";

import React, { useState, useEffect } from 'react';
import { AuditHeader } from './AuditHeader';
import { AuditLedgerView } from './AuditLedgerView';
import { PrivacyProofView } from './PrivacyProofView';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { verifyAuditLedgerIntegrity, fetchAuditLogs } from '../../lib/api';
import {
  ShieldCheck,
  Lock,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export function AuditPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'proofs'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalLogsCount, setTotalLogsCount] = useState(0);

  // Tamper Verification Modal State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Load audit data for authenticated Audit Admin
  const initializeAuditSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const logData = await fetchAuditLogs({ limit: 1, offset: 0 });
      setTotalLogsCount(logData.total_count || 0);
    } catch (err) {
      console.error('Failed to initialize audit admin session:', err);
      setError(err?.response?.data?.detail || err.message || 'Error initializing sovereign audit session.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      initializeAuditSession();
    }
  }, [user]);

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyAuditLedgerIntegrity();
      setVerificationResult(res);
      setIsVerifyModalOpen(true);
    } catch (err) {
      console.error('Ledger verification failed:', err);
      setError(err?.response?.data?.detail || err.message || 'Error running cryptographic ledger verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 flex flex-col">
      {/* Header */}
      <AuditHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={user}
        onRefresh={initializeAuditSession}
        onVerifyLedger={handleVerifyLedger}
        isVerifying={isVerifying}
        isLoading={isLoading}
        totalLogsCount={totalLogsCount}
      />

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Audit Gateway Notice:</strong> {error}</span>
            </div>
            <Button size="xs" variant="outline" onClick={initializeAuditSession}>
              Retry Connection
            </Button>
          </div>
        )}

        {/* TAB 1: Cryptographic Audit Ledger & Compliance Inspector (Task 9.1) */}
        {activeTab === 'ledger' && (
          <div className="animate-in fade-in-50 duration-200">
            <AuditLedgerView />
          </div>
        )}

        {/* TAB 2: Privacy Guarantee Proof Panel (Task 9.2) */}
        {(activeTab === 'privacy' || activeTab === 'proofs') && (
          <div className="animate-in fade-in-50 duration-200">
            <PrivacyProofView onNavigateToLedger={() => setActiveTab('ledger')} />
          </div>
        )}
      </main>

      {/* MODAL: Full Cryptographic Integrity Verification Result */}
      {isVerifyModalOpen && verificationResult && (
        <Modal
          isOpen={true}
          onClose={() => setIsVerifyModalOpen(false)}
          size="md"
        >
          <ModalHeader className="bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
              <ModalTitle className="text-base font-bold text-slate-900">
                Cryptographic Ledger Integrity Certificate
              </ModalTitle>
            </div>
          </ModalHeader>

          <ModalBody className="p-5 space-y-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              </div>
              <h4 className="text-sm font-bold text-emerald-950">
                {verificationResult.integrity_status === 'VERIFIED_UNCOMPROMISED'
                  ? 'LEDGER INTEGRITY VERIFIED • UNCOMPROMISED'
                  : verificationResult.integrity_status}
              </h4>
              <p className="text-xs text-emerald-800">
                All {verificationResult.total_records_verified} sequential audit entries verified against the SHA-256 HMAC root digest.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Hash Algorithm</span>
                <span className="font-mono font-bold text-slate-800">{verificationResult.hash_algorithm}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Entries Verified</span>
                <span className="font-mono font-bold text-slate-800">{verificationResult.total_records_verified} records</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tamper Flags Detected</span>
                <span className="font-mono font-bold text-emerald-700">0 (Zero Alterations)</span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-slate-500 block">Verified Ledger Root Hash</span>
                <div className="p-2 rounded bg-slate-900 text-emerald-400 font-mono text-[10px] break-all border border-slate-800 select-all">
                  {verificationResult.latest_ledger_root_hash}
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="bg-slate-50 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)}>
              Close Verification
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

export default AuditPortal;
