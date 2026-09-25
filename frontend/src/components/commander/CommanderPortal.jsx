"use client";

import React, { useState, useEffect } from 'react';
import { CommanderHeader } from './CommanderHeader';
import { StrategicDashboard } from './StrategicDashboard';
import { WorkloadSimulator } from './WorkloadSimulator';
import { ExecutiveBriefing } from './ExecutiveBriefing';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar, StackedProgressBar } from '../ui/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import {
  fetchCommanderKPI,
  fetchCompanyHeatmap,
} from '../../lib/api';
import {
  Activity,
  ShieldAlert,
  UserCheck,
  HeartPulse,
  Lock,
  Download,
  AlertTriangle,
  Info,
} from 'lucide-react';

export function CommanderPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kpiData, setKpiData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load telemetry for authenticated Commander
  const initializeCommanderData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch dynamic backend telemetry
      const [kpiRes, heatmapRes] = await Promise.all([
        fetchCommanderKPI(),
        fetchCompanyHeatmap(),
      ]);

      setKpiData(kpiRes);
      setHeatmapData(heatmapRes);
    } catch (err) {
      console.error('Failed to load commander telemetry:', err);
      setError(err?.response?.data?.detail || err.message || 'Error connecting to backend API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      initializeCommanderData();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 flex flex-col">
      {/* Single Unified Header */}
      <CommanderHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={user}
        onRefresh={initializeCommanderData}
        isLoading={isLoading}
        kAnonymityCount={5}
      />

      {/* Main Command Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full space-y-6">
        {/* Error Notification Banner if backend has issues */}
        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Backend Telemetry Notice:</strong> {error}
              </span>
            </div>
            <Button size="xs" variant="outline" onClick={initializeCommanderData}>
              Retry Connection
            </Button>
          </div>
        )}

        {/* Active Tab Container */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in-50 duration-200">
            <StrategicDashboard onNavigateToSimulator={() => setActiveTab('simulator')} />
          </div>
        )}

        {/* Simulator Tab (Task 6.3) */}
        {activeTab === 'simulator' && (
          <div className="animate-in fade-in-50 duration-200">
            <WorkloadSimulator initialCompany="Alpha" />
          </div>
        )}

        {/* Briefing Tab (Task 6.4) */}
        {activeTab === 'briefing' && (
          <div className="animate-in fade-in-50 duration-200">
            <ExecutiveBriefing />
          </div>
        )}
      </main>
    </div>
  );
}

export default CommanderPortal;
