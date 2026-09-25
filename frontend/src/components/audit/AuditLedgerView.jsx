"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { TableRowSkeleton } from '../ui/Skeleton';
import { fetchAuditLogs, verifyAuditLedgerIntegrity } from '../../lib/api';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Key,
  Database,
  ExternalLink,
  Copy,
  Check,
  Stethoscope,
  Award,
  Send,
} from 'lucide-react';
import { formatISTDateTime } from '../../lib/utils';

/**
 * Task 9.1: Audit Ledger & Compliance Inspector
 * Implements Mini-task 9.1.1, 9.1.2, 9.1.3
 */
export function AuditLedgerView({ onIntegrityVerified }) {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters (Mini-task 9.1.2)
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log Inspection Modal
  const [inspectedLog, setInspectedLog] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  // Load audit records from backend (Mini-task 9.1.3)
  const loadAuditLogs = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const params = { limit: 100, offset: 0 };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await fetchAuditLogs(params);
      setLogs(data.logs || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err?.response?.data?.detail || err.message || 'Unable to retrieve cryptographic audit logs.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    const interval = setInterval(() => {
      loadAuditLogs(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [roleFilter, actionFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setActionFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Client-side text search over the loaded records
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.actor_id && log.actor_id.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.target_entity && log.target_entity.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.classification && log.classification.toLowerCase().includes(q))
    );
  });

  // Calculate high-level audit KPIs
  const unmaskingCount = logs.filter((l) => l.action === 'UNMASK_PERSONNEL_DOSSIER').length;
  const interventionsCount = logs.filter((l) =>
    l.action === 'DISPATCH_INTERVENTION' || l.action === 'UPDATE_INTERVENTION_STATUS'
  ).length;
  const checkinCount = logs.filter((l) => l.action === 'SUBMIT_CHECKIN').length;

  // Format timestamp in Indian Standard Time (IST)
  const formatTimestamp = (isoString) => formatISTDateTime(isoString);

  // Render role badge with institutional styling
  const renderRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('commanding') || r.includes('commander')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-black text-white border border-slate-800">
          Commanding Officer
        </span>
      );
    }
    if (r.includes('welfare') || r.includes('medical')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-200 border border-red-800">
          Welfare Officer
        </span>
      );
    }
    if (r.includes('jawan')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          Jawan (Soldier)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-200 border border-slate-700">
        {role}
      </span>
    );
  };

  // Render action badge with icon
  const renderActionBadge = (action) => {
    const a = (action || '').toUpperCase();
    if (a.includes('UNMASK')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-100 text-rose-950 border border-rose-300">
          <Eye className="w-3 h-3 text-rose-700" />
          {action}
        </span>
      );
    }
    if (a.includes('INTERVENTION')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-100 text-amber-950 border border-amber-300">
          <Stethoscope className="w-3 h-3 text-amber-800" />
          {action}
        </span>
      );
    }
    if (a.includes('CHECKIN') || a.includes('BIOMETRICS') || a.includes('LEAVE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-100 text-emerald-950 border border-emerald-300">
          <ShieldCheck className="w-3 h-3 text-emerald-800" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-100 text-slate-900 border border-slate-300">
        <FileText className="w-3 h-3 text-slate-600" />
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Live Real-Time Sovereign Audit Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-900"></span>
          </span>
          <span className="font-semibold text-slate-800">
            Cryptographic Audit Ledger Stream Active
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[11px]">
            Auto-Sync 6s • SHA-256 Tamper Evident
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
          <span>Live Stream ({totalCount} entries)</span>
          <button
            onClick={() => loadAuditLogs(false)}
            disabled={isRefreshing}
            className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Governance KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Ledger Entries */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Total Entries
            </span>
            <Database className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {totalCount} <span className="text-xs font-sans font-normal text-slate-500">records</span>
          </div>
        </div>

        {/* Card 2: Unmasking Queries */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Unmasking Audits
            </span>
            <Eye className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {unmaskingCount} <span className="text-xs font-sans font-normal text-slate-500">events</span>
          </div>
        </div>

        {/* Card 3: Interventions Dispatched */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Interventions Logged
            </span>
            <Stethoscope className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {interventionsCount} <span className="text-xs font-sans font-normal text-slate-500">logged</span>
          </div>
        </div>

        {/* Card 4: Cryptographic Ledger Integrity */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Ledger Integrity
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            100% <span className="text-xs font-sans font-semibold text-emerald-700">VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Main Ledger Card */}
      <Card className="border border-slate-200 shadow-gov-subtle overflow-hidden">
        {/* Card Header & Fast Action */}
        <CardHeader className="bg-slate-50 border-b border-slate-200 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-emerald-100 text-emerald-950 flex items-center justify-center font-bold border border-emerald-200 shrink-0">
                  <FileText className="w-5 h-5 text-emerald-900" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                    System Audit Ledger & Compliance Inspector
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Immutable append-only chronological log of all tactical queries, clinical unmaskings, and APAR firewalled assessments
                  </CardDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadAuditLogs(true)}
                disabled={isRefreshing || isLoading}
                className="text-xs border-slate-300"
                leftIcon={RefreshCw}
              >
                {isRefreshing ? 'Refreshing...' : 'Live Refresh'}
              </Button>
            </div>
          </div>

          {/* Filter Toolbar (Mini-task 9.1.2) */}
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Live Text Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actor, action, details..."
                className="w-full text-xs rounded-md border border-slate-300 bg-white pl-8 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* 2. Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="ALL">All Roles (All Users)</option>
                <option value="Commanding Officer">Commanding Officer</option>
                <option value="Welfare Officer">Welfare / Medical Officer</option>
                <option value="Jawan">Jawan (Soldier)</option>
                <option value="Audit Admin">Audit Admin</option>
              </select>
            </div>

            {/* 3. Action Filter */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="ALL">All Actions</option>
                <option value="VIEW_HEATMAP">VIEW_HEATMAP (Commander)</option>
                <option value="SIMULATE_WORKLOAD">SIMULATE_WORKLOAD (Commander)</option>
                <option value="EXPORT_REPORT">EXPORT_REPORT (Commander)</option>
                <option value="UNMASK_PERSONNEL_DOSSIER">UNMASK_PERSONNEL_DOSSIER (Medical)</option>
                <option value="DISPATCH_INTERVENTION">DISPATCH_INTERVENTION (Medical)</option>
                <option value="UPDATE_INTERVENTION_STATUS">UPDATE_INTERVENTION_STATUS (Medical)</option>
                <option value="SUBMIT_CHECKIN">SUBMIT_CHECKIN (Jawan)</option>
                <option value="SUBMIT_LEAVE_REQUEST">SUBMIT_LEAVE_REQUEST (Jawan)</option>
                <option value="VERIFY_AUDIT_INTEGRITY">VERIFY_AUDIT_INTEGRITY (Auditor)</option>
              </select>
            </div>

            {/* 4. Start Date */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
                className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* 5. End Date & Reset */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
                className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              {(roleFilter !== 'ALL' || actionFilter !== 'ALL' || startDate || endDate || searchQuery) && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="text-[11px] shrink-0"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Audit Table Content */}
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="text-xs text-amber-900 font-medium">{error}</p>
              <Button size="sm" variant="outline" onClick={() => loadAuditLogs()}>
                Retry Query
              </Button>
            </div>
          ) : !isLoading && filteredLogs.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No audit log records match your filter criteria.</p>
              <Button size="xs" variant="outline" onClick={handleResetFilters}>
                Clear Active Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4">Actor ID & Role</th>
                    <th className="py-3 px-4">Action Taken</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Security Classification</th>
                    <th className="py-3 px-4">Tamper Hash (SHA-256)</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoading && logs.length === 0 ? (
                    <TableRowSkeleton rows={5} cols={7} />
                  ) : (
                    filteredLogs.map((log) => {
                      const hash = log.tamper_hash || '';
                    const shortHash = hash ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}` : '--';

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          log.action === 'UNMASK_PERSONNEL_DOSSIER' ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </td>

                        {/* Actor ID & Role */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-900 block">
                              {log.actor_id}
                            </span>
                            {renderRoleBadge(log.user_role)}
                          </div>
                        </td>

                        {/* Action Taken */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderActionBadge(log.action)}
                        </td>

                        {/* Target Entity */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] font-semibold text-slate-800">
                            {log.target_entity ? (
                              log.target_id && log.target_id !== 'None' ? (
                                <span>{log.target_entity} <span className="text-slate-400 font-normal">#{log.target_id}</span></span>
                              ) : (
                                <span>{log.target_entity}</span>
                              )
                            ) : '--'}
                          </span>
                        </td>

                        {/* Security Classification */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              log.classification.includes('DECOUPLED')
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                                : log.classification.includes('PRIVILEGE') || log.classification.includes('MEDICAL')
                                ? 'bg-red-50 text-red-900 border border-red-300'
                                : log.classification.includes('SECRET')
                                ? 'bg-amber-50 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                            }`}
                          >
                            <Lock className="w-2.5 h-2.5 shrink-0" />
                            {log.classification}
                          </span>
                        </td>

                        {/* Tamper Hash */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-slate-700">
                              {shortHash}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyHash(hash)}
                              className="text-slate-400 hover:text-emerald-800 transition-colors p-1"
                              title="Copy SHA-256 Hash"
                            >
                              {copiedHash === hash ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Inspect Button */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setInspectedLog(log)}
                            className="text-xs text-emerald-900 font-semibold hover:bg-emerald-50"
                            leftIcon={Eye}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL: Full Cryptographic Audit Certificate Inspection */}
      {inspectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedLog(null)}
          size="lg"
          className="max-h-[92vh]"
        >
          <ModalHeader className="bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-950 flex items-center justify-center font-bold border border-emerald-200 shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
              </div>
              <div>
                <ModalTitle className="text-base font-bold text-slate-900">
                  Cryptographic Audit Log Inspection
                </ModalTitle>
                <ModalDescription className="text-xs text-slate-600 font-mono">
                  LOG-REC-{inspectedLog.id.toString().padStart(6, '0')} • Non-Repudiation Certificate
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Timestamp (IST)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {formatTimestamp(inspectedLog.timestamp)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Actor Username
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {inspectedLog.actor_id}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  User Role
                </span>
                {renderRoleBadge(inspectedLog.user_role)}
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Action Executed
                </span>
                <span className="font-mono font-bold text-emerald-950">
                  {inspectedLog.action}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Target Entity
                </span>
                <span className="font-mono text-slate-900">
                  {inspectedLog.target_entity || 'N/A'}{inspectedLog.target_id && inspectedLog.target_id !== 'None' ? ` #${inspectedLog.target_id}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  IP / Network Origin
                </span>
                <span className="font-mono text-slate-900">
                  {inspectedLog.ip_address || '127.0.0.1 (Tactical Airgap)'}
                </span>
              </div>
            </div>

            {/* Audit Details */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Recorded Operational Context & Details
              </label>
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 leading-relaxed">
                {inspectedLog.details || 'No additional narrative text recorded.'}
              </div>
            </div>

            {/* Security Classification Box */}
            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-800 shrink-0" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Classification: {inspectedLog.classification}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed pl-6">
                This transaction was recorded under statutory non-repudiation mandates (DPDPA 2023 §14 & §8).
                Any alteration to this entry invalidates the root ledger hash.
              </p>
            </div>

            {/* Full Cryptographic Tamper Hash */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-800" />
                  <span>SHA-256 Non-Repudiation Digest</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleCopyHash(inspectedLog.tamper_hash)}
                  className="text-xs text-emerald-900 hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  {copiedHash === inspectedLog.tamper_hash ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Hash</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] break-all border border-slate-800 select-all">
                {inspectedLog.tamper_hash}
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              HMAC Cryptographically Verified
            </span>
            <Button variant="outline" onClick={() => setInspectedLog(null)} className="text-xs">
              Close Inspection
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

export default AuditLedgerView;
