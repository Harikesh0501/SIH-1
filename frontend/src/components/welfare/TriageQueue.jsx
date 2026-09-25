"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../ui/Table';
import { TableRowSkeleton } from '../ui/Skeleton';
import { fetchWelfareTriageQueue } from '../../lib/api';
import {
  Search,
  Filter,
  ShieldAlert,
  Eye,
  AlertTriangle,
  RefreshCw,
  HeartPulse,
  UserCheck,
  Flame,
  CheckCircle2,
  Calendar,
  Compass,
} from 'lucide-react';
import { formatISTTime } from '../../lib/utils';

/**
 * Task 7.2: Confidential Clinical Triage Queue
 * Implements Mini-task 7.2.1, 7.2.2, 7.2.3
 */
export function TriageQueue({ onExamineDossier }) {
  const [personnelList, setPersonnelList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters (Mini-task 7.2.1)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('');
  const [crisisOnly, setCrisisOnly] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const [isSyncing, setIsSyncing] = useState(false);

  const loadTriageQueue = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsSyncing(true);
    setError(null);
    try {
      const params = {};
      if (selectedCompany && selectedCompany !== 'ALL') params.company = selectedCompany;
      if (selectedRiskLevel && selectedRiskLevel !== 'ALL') params.risk_level = selectedRiskLevel;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await fetchWelfareTriageQueue(params);
      setPersonnelList(data || []);
      setLastRefreshed(formatISTTime());
    } catch (err) {
      console.error("Failed to load triage queue:", err);
      if (isInitial) {
        setError(err?.response?.data?.detail || err.message || "Failed to load clinical triage queue.");
      }
    } finally {
      if (isInitial) setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadTriageQueue(true);
    const interval = setInterval(() => {
      loadTriageQueue(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [selectedCompany, selectedRiskLevel]);

  // Handle Search on Submit or KeyDown
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    loadTriageQueue();
  };

  // Filter crisis-only in memory if toggled
  const displayedPersonnel = crisisOnly
    ? personnelList.filter(p => p.crisis_flag || p.stress_score >= 80.0)
    : personnelList;

  const totalCritical = personnelList.filter(p => p.stress_score >= 80.0 || p.crisis_flag).length;
  const totalVulnerable = personnelList.filter(p => p.risk_level === 'Vulnerable').length;

  return (
    <div className="space-y-6">
      {/* Live Real-Time Clinical Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <span className="font-semibold text-slate-800">
            Real-Time Clinical Telemetry & Triage Queue Active
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[11px]">
            Auto-Sync 6s • Medical Privilege Guaranteed
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
          <span>Synced: {lastRefreshed || 'Connecting...'}</span>
          <button
            onClick={() => loadTriageQueue(false)}
            disabled={isSyncing}
            className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Triage Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total In Triage</span>
          <div className="text-2xl font-mono font-extrabold text-slate-900">
            {personnelList.length} <span className="text-xs font-sans font-normal text-slate-500">Personnel</span>
          </div>
          <p className="text-[10px] text-slate-400">Ranked by predictive stress score</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Critical / Crisis Priority</span>
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-red-600">
            {totalCritical} <span className="text-xs font-sans font-normal text-slate-500">Cases</span>
          </div>
          <p className="text-[10px] text-red-600 font-medium">Immediate clinical intervention advised</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Active Interventions</span>
          <div className="text-2xl font-mono font-extrabold text-slate-900">
            {personnelList.reduce((acc, p) => acc + (p.active_interventions_count || 0), 0)} <span className="text-xs font-sans font-normal text-slate-500">Dispatched</span>
          </div>
          <p className="text-[10px] text-slate-400">Clinical orders underway</p>
        </div>
      </div>

      {/* Main Triage Table Card */}
      <Card>
        <CardHeader
          action={
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                leftIcon={RefreshCw}
                onClick={loadTriageQueue}
                isLoading={isLoading}
              >
                Refresh
              </Button>
            </div>
          }
        >
          <CardTitle>
            Clinical Triage Queue
          </CardTitle>
          <CardDescription>
            Confidential soldier triage sorted by predictive stress score
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filter Toolbar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/70 p-3 rounded-lg border border-slate-200">
            {/* Search Input */}
            <div className="w-full md:w-80">
              <Input
                placeholder="Search soldier name, service number..."
                leftIcon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={loadTriageQueue}
              />
            </div>

            {/* Company Filter Dropdown */}
            <div className="w-full md:w-48">
              <Select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                options={[
                  { value: "ALL", label: "All Companies (63)" },
                  { value: "Alpha", label: "Alpha Company" },
                  { value: "Bravo", label: "Bravo Company" },
                  { value: "Charlie", label: "Charlie Company" },
                  { value: "Delta", label: "Delta Company" },
                ]}
              />
            </div>

            {/* Risk Level Filter Dropdown */}
            <div className="w-full md:w-48">
              <Select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                options={[
                  { value: "ALL", label: "All Risk Levels" },
                  { value: "Critical", label: "Critical (80-100)" },
                  { value: "Vulnerable", label: "Vulnerable (65-79)" },
                  { value: "Fatigued", label: "Fatigued (40-64)" },
                  { value: "Resilient", label: "Resilient (0-39)" },
                ]}
              />
            </div>

            {/* Crisis Flags Toggle */}
            <button
              type="button"
              onClick={() => setCrisisOnly(!crisisOnly)}
              className={`w-full md:w-auto px-3 py-2 rounded-md text-xs font-bold transition-all border flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                crisisOnly
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${crisisOnly ? 'text-white' : 'text-red-600'}`} />
              <span>Crisis Only ({totalCritical})</span>
            </button>
          </form>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span>{error}</span>
              <Button size="xs" variant="outline" onClick={loadTriageQueue}>
                Retry
              </Button>
            </div>
          )}

          {/* Clean 7-Column Personnel Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider font-semibold text-slate-500 select-none">
                <tr>
                  <th className="py-3 px-5">Soldier</th>
                  <th className="py-3 px-4">Formation & Zone</th>
                  <th className="py-3 px-4 text-center">Days in Zone</th>
                  <th className="py-3 px-4 text-center">Leave Denials</th>
                  <th className="py-3 px-4">Stress & Risk</th>
                  <th className="py-3 px-4">Primary Trigger</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && displayedPersonnel.length === 0 ? (
                  <>
                    <TableRowSkeleton cols={7} />
                    <TableRowSkeleton cols={7} />
                    <TableRowSkeleton cols={7} />
                    <TableRowSkeleton cols={7} />
                  </>
                ) : displayedPersonnel.length === 0 ? (
                  <TableEmpty
                    colSpan={7}
                    message="No personnel match current triage filters"
                  />
                ) : (
                  displayedPersonnel.map((person) => {
                    const isRedFlag = person.crisis_flag || person.stress_score >= 80.0;
                    
                    return (
                      <tr
                        key={person.id}
                        className={`transition-colors duration-150 hover:bg-slate-50/80 ${
                          isRedFlag
                            ? 'bg-red-50/20'
                            : ''
                        }`}
                      >
                        {/* Soldier: Full Name, Rank & Service Number */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            {isRedFlag && (
                              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{person.full_name}</span>
                                <span className="font-normal text-slate-500">({person.rank})</span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 block">
                                {person.service_number}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Formation & Outpost */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold text-slate-800 block">
                            {person.company} Co • {person.platoon}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {person.deployment_zone}
                          </span>
                        </td>

                        {/* Days in Zone */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {person.days_in_current_zone}d
                          </span>
                        </td>

                        {/* Leave Cancellations */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`font-mono font-bold text-xs ${
                            person.leave_cancellations_count >= 2 ? 'text-red-600 font-extrabold' : 'text-slate-700'
                          }`}>
                            {person.leave_cancellations_count}
                          </span>
                        </td>

                        {/* Stress Score & Badge */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-xs ${
                              person.stress_score >= 80 ? 'text-red-600' :
                              person.stress_score >= 65 ? 'text-amber-600' : 'text-slate-800'
                            }`}>
                              {person.stress_score.toFixed(1)}
                            </span>
                            <Badge tier={person.risk_level} size="xs" />
                          </div>
                        </td>

                        {/* Primary Trigger */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {person.top_stress_driver}
                          </span>
                        </td>

                        {/* Action: Examine Dossier Button */}
                        <td className="py-3.5 px-5 text-right">
                          <Button
                            variant={isRedFlag ? "destructive" : "outline"}
                            size="xs"
                            leftIcon={Eye}
                            onClick={() => onExamineDossier && onExamineDossier(person)}
                            className="font-semibold text-xs"
                          >
                            Examine
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
          <div className="flex flex-wrap items-center justify-between w-full text-xs text-slate-500 gap-2">
            <span>
              Showing {displayedPersonnel.length} of {personnelList.length} personnel records
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              DPDPA §14 Medical Privilege
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default TriageQueue;
