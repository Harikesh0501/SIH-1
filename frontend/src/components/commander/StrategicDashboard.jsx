"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar, StackedProgressBar } from '../ui/ProgressBar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../ui/Table';
import { CardSkeleton, TableRowSkeleton } from '../ui/Skeleton';
import { fetchCommanderKPI, fetchCompanyHeatmap } from '../../lib/api';
import {
  Activity,
  HeartPulse,
  ShieldAlert,
  UserCheck,
  Lock,
  RefreshCw,
  AlertTriangle,
  Compass,
  Calendar,
  Clock,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { formatISTTime } from '../../lib/utils';

/**
 * Task 6.2: Battalion Strategic Readiness Dashboard
 * Connects directly to /api/commander/readiness-kpi & /api/commander/company-heatmap
 */
export function StrategicDashboard({ onNavigateToSimulator }) {
  const [kpi, setKpi] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const loadData = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsSyncing(true);
    setError(null);
    try {
      const [kpiRes, heatmapRes] = await Promise.all([
        fetchCommanderKPI(),
        fetchCompanyHeatmap(),
      ]);
      setKpi(kpiRes);
      setHeatmap(heatmapRes || []);
      setLastRefreshed(formatISTTime());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      if (isInitial) {
        setError(err?.response?.data?.detail || err.message || "Failed to load live battalion telemetry.");
      }
    } finally {
      if (isInitial) setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Live Real-Time Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
          <span className="font-semibold text-slate-800">
            Real-Time Battalion Telemetry Active
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[11px]">
            Auto-Sync 5s • k-Anonymity (k≥5)
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
          <span>Synced: {lastRefreshed || 'Connecting...'}</span>
          <button
            onClick={() => loadData(false)}
            disabled={isSyncing}
            className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error notification if backend has issues */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Connection Notice:</strong> {error}</span>
          </div>
          <Button size="xs" variant="outline" onClick={() => loadData(true)}>
            Retry
          </Button>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      {isLoading && !kpi ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Force Readiness Index */}
          <Card hoverable className="p-5 border-slate-200 bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Force Readiness</span>
              <Activity className="w-4 h-4 text-slate-700" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-slate-950">
                {kpi ? `${kpi.force_readiness_index.toFixed(1)}%` : '—'}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                (kpi?.force_readiness_index ?? 0) >= 75
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : (kpi?.force_readiness_index ?? 0) >= 50
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}>
                {(kpi?.force_readiness_index ?? 0) >= 75 ? 'Optimal' : (kpi?.force_readiness_index ?? 0) >= 50 ? 'Moderate Alert' : 'Compromised'}
              </span>
            </div>
          </Card>

          {/* KPI 2: Average Battalion Stress Score */}
          <Card hoverable className="p-5 border-slate-200 bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Average Stress</span>
              <HeartPulse className="w-4 h-4 text-slate-700" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-slate-950">
                {kpi ? kpi.average_stress_score.toFixed(1) : '—'}
              </span>
              {kpi && (
                <Badge tier={
                  kpi.average_stress_score >= 80 ? 'critical'
                  : kpi.average_stress_score >= 65 ? 'vulnerable'
                  : kpi.average_stress_score >= 45 ? 'fatigued' : 'resilient'
                } size="sm" />
              )}
            </div>
          </Card>

          {/* KPI 3: Acute / Critical Cases */}
          <Card hoverable className="p-5 border-slate-200 bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>High Risk Cases</span>
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-red-600">
                {kpi ? kpi.critical_cases_count : '—'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded">
                Hospital Triage
              </span>
            </div>
          </Card>

          {/* KPI 4: Active Welfare Actions */}
          <Card hoverable className="p-5 border-slate-200 bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Active Welfare Actions</span>
              <UserCheck className="w-4 h-4 text-slate-900" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold font-mono text-slate-950">
                {kpi ? kpi.active_interventions_count : '—'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">
                Active Protocol
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Battalion Deployment & Company Heatmap */}
      <Card className="border border-slate-200 shadow-2xs overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-950">
              Battalion Formations & Stress Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Aggregated company telemetry under k-Anonymity (k ≥ 5)
            </CardDescription>
          </div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            k ≥ 5 Active
          </span>
        </CardHeader>

        <CardContent noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider font-semibold text-slate-500 select-none">
                <tr>
                  <th className="py-3 px-5">Formation</th>
                  <th className="py-3 px-4">Deployment Zone</th>
                  <th className="py-3 px-4 text-center">Days in Zone</th>
                  <th className="py-3 px-4 text-center">Leave Denials</th>
                  <th className="py-3 px-4 text-center">Avg Stress</th>
                  <th className="py-3 px-4 min-w-[180px]">Risk Cohorts</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && heatmap.length === 0 ? (
                  <>
                    <TableRowSkeleton cols={7} />
                    <TableRowSkeleton cols={7} />
                    <TableRowSkeleton cols={7} />
                    <TableRowSkeleton cols={7} />
                  </>
                ) : heatmap.length === 0 ? (
                  <TableEmpty message="No company telemetry available" colSpan={7} />
                ) : (
                  heatmap.map((comp) => {
                    const isSevere = comp.high_risk_flag || comp.average_stress_score >= 65;
                    const segments = [
                      { label: "Resilient", value: `${comp.risk_distribution?.resilient_pct ?? 0}%`, percentage: comp.risk_distribution?.resilient_pct ?? 0, bgClass: "bg-slate-900" },
                      { label: "Fatigued", value: `${comp.risk_distribution?.fatigued_pct ?? 0}%`, percentage: comp.risk_distribution?.fatigued_pct ?? 0, bgClass: "bg-slate-500" },
                      { label: "Vulnerable", value: `${comp.risk_distribution?.vulnerable_pct ?? 0}%`, percentage: comp.risk_distribution?.vulnerable_pct ?? 0, bgClass: "bg-amber-500" },
                      { label: "Critical", value: `${comp.risk_distribution?.critical_pct ?? 0}%`, percentage: comp.risk_distribution?.critical_pct ?? 0, bgClass: "bg-red-500" },
                    ];

                    return (
                      <tr
                        key={comp.company_name}
                        className={`transition-colors duration-150 hover:bg-slate-50/80 ${
                          isSevere ? 'bg-amber-50/10' : ''
                        }`}
                      >
                        {/* Company & Strength */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{comp.company_name}</span>
                            {isSevere && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                            {comp.strength} Jawans
                          </span>
                        </td>

                        {/* Deployment Zone & Terrain */}
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-800 text-xs block">
                            {comp.deployment_zone}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {comp.deployment_type}
                          </span>
                        </td>

                        {/* Avg Days Deployed */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {comp.average_days_deployed.toFixed(0)}d
                          </span>
                        </td>

                        {/* Leave Denials */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {comp.total_leave_denials}
                          </span>
                        </td>

                        {/* Avg Stress */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {comp.average_stress_score.toFixed(1)}
                            </span>
                            <Badge tier={comp.company_risk_level} size="xs" />
                          </div>
                        </td>

                        {/* Risk Cohorts Ribbon */}
                        <td className="py-4 px-4">
                          <StackedProgressBar
                            segments={segments}
                            height="h-2"
                            showLegend={false}
                          />
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                            <span>Res: {comp.risk_distribution?.resilient_pct}%</span>
                            <span className="font-bold text-red-600">Crit: {comp.risk_distribution?.critical_pct}%</span>
                          </div>
                        </td>

                        {/* Action: Simulate */}
                        <td className="py-4 px-5 text-right">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => onNavigateToSimulator && onNavigateToSimulator()}
                            className="font-semibold text-xs"
                          >
                            Simulate
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t border-slate-200 py-3 px-5">
          <div className="flex flex-wrap items-center justify-between gap-4 w-full text-xs text-slate-500">
            <span>Showing all {heatmap.length} deployed battalion companies</span>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-900" /> Resilient
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Fatigued
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Vulnerable
              </span>
              <span className="flex items-center gap-1.5 text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default StrategicDashboard;
