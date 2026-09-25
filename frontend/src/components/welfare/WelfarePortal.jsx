"use client";

import React, { useState, useEffect } from 'react';
import { WelfareHeader } from './WelfareHeader';
import { TriageQueue } from './TriageQueue';
import { SoldierDossierModal } from './SoldierDossierModal';
import { InterventionsTracker } from './InterventionsTracker';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  fetchWelfareTriageQueue,
  fetchInterventions,
} from '../../lib/api';
import {
  HeartPulse,
  Lock,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Search,
  Eye,
} from 'lucide-react';

export function WelfarePortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('triage');
  const [triageQueue, setTriageQueue] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSoldier, setSelectedSoldier] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Load telemetry for authenticated Welfare Officer
  const initializeWelfareData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch dynamic triage queue and active interventions
      const [triageRes, interventionsRes] = await Promise.all([
        fetchWelfareTriageQueue().catch(() => []),
        fetchInterventions().catch(() => []),
      ]);

      setTriageQueue(triageRes || []);
      setInterventions(interventionsRes || []);
    } catch (err) {
      console.error('Failed to load welfare officer data:', err);
      setError(err?.response?.data?.detail || err.message || 'Error connecting to medical welfare API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      initializeWelfareData();
    }
  }, [user]);

  const criticalCount = triageQueue.filter(p => p.risk_level === 'Critical' || p.crisis_flag).length;
  const activeInterventionCount = interventions.filter(i => i.status !== 'Completed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 flex flex-col">
      {/* Single Unified Header */}
      <WelfareHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={user}
        onRefresh={initializeWelfareData}
        isLoading={isLoading}
        triageCount={criticalCount > 0 ? criticalCount : triageQueue.length}
        activeInterventionsCount={activeInterventionCount || interventions.length}
      />

      {/* Main Welfare Workspace Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full space-y-6">
        
        {/* Error notification if backend has issues */}
        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Medical Telemetry Notice:</strong> {error}</span>
            </div>
            <Button size="xs" variant="outline" onClick={initializeWelfareData}>
              Retry Connection
            </Button>
          </div>
        )}

        {/* Triage Tab (Task 7.2) */}
        {activeTab === 'triage' && (
          <div className="animate-in fade-in-50 duration-200">
            <TriageQueue
              onExamineDossier={(soldier) => {
                setSelectedSoldier(soldier);
                setIsDossierOpen(true);
              }}
            />
          </div>
        )}

        {/* Interventions Tab (Task 7.4: Active Interventions Management View) */}
        {activeTab === 'interventions' && (
          <div className="animate-in fade-in-50 duration-200">
            <InterventionsTracker
              onExamineDossier={(soldier) => {
                setSelectedSoldier(soldier);
                setIsDossierOpen(true);
              }}
            />
          </div>
        )}

        {/* Audit Tab Placeholder */}
        {activeTab === 'audit' && (
          <Card className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 mx-auto flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Clinical Access Audit Trail
            </h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Every soldier dossier unmasking event and welfare action sanction is cryptographically recorded in compliance with medical confidentiality directives.
            </p>
          </Card>
        )}
      </main>

      {/* Task 7.3: Comprehensive Soldier Clinical Dossier Modal */}
      <SoldierDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        personnelId={selectedSoldier?.id}
        onOpenDispatch={(soldier) => {
          setSelectedSoldier(soldier);
          setIsDossierOpen(false);
          setActiveTab('interventions');
        }}
      />
    </div>
  );
}

export default WelfarePortal;
