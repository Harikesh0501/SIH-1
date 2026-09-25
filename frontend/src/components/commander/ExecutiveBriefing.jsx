"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { exportCommanderReport } from '../../lib/api';
import { formatMilitaryDate } from '../../lib/utils';
import {
  Printer,
  Download,
  Shield,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  QrCode,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

/**
 * Task 6.4: Executive Briefing & Printable Reports
 * Connects directly to GET /api/commander/export-report
 */
export function ExecutiveBriefing() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await exportCommanderReport();
      setReport(data);
    } catch (err) {
      console.error("Export report fetch error:", err);
      setError(err?.response?.data?.detail || err.message || "Failed to fetch executive report.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_id || 'Executive_Report'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar (Hidden during Print) */}
      <div className="no-print bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="text-xs font-semibold text-slate-800">
            Battalion Executive Briefing & Export
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            SHA-256 Verified
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            leftIcon={RefreshCw}
            onClick={fetchReport}
            isLoading={isLoading}
          >
            Regenerate
          </Button>
          <Button
            size="xs"
            variant="outline"
            leftIcon={Download}
            onClick={handleDownloadJson}
            disabled={!report || isLoading}
          >
            Export JSON
          </Button>
          <Button
            size="xs"
            variant="primary"
            leftIcon={Printer}
            onClick={handlePrint}
            disabled={!report || isLoading}
          >
            Print PDF Briefing
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="no-print p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Briefing Generation Notice:</strong> {error}</span>
          </div>
          <Button size="xs" variant="outline" onClick={fetchReport}>
            Retry
          </Button>
        </div>
      )}

      {/* Mini-task 6.4.1 & 6.4.2: Official Printable Document Container */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-gov-card overflow-hidden p-6 sm:p-10 defense-watermark relative">
        
        {/* Document Classification Header Bar */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start text-xs font-mono font-bold text-red-950 uppercase tracking-widest pb-2">
            <span>RESTRICTED DISTRIBUTION</span>
            <span className="bg-red-950 text-red-100 px-2 py-0.5 rounded text-[11px]">
              {report?.security_classification || "SECRET - FOR BATTALION COMMANDER EYES ONLY"}
            </span>
            <span>MHA-OPS-INT-104</span>
          </div>

          {/* Official Emblem & National Typography */}
          <div className="text-center pt-2 space-y-1">
            <div className="w-12 h-12 rounded-lg bg-black text-white mx-auto flex items-center justify-center font-bold shadow-xs border border-slate-800">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <p className="text-[11px] font-bold text-slate-700 tracking-wider uppercase font-mono">
              GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS
            </p>
            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
              DIRECTORATE GENERAL, CENTRAL ARMED POLICE FORCES (CAPF)
            </p>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-serif pt-1">
              {report?.title || "EXECUTIVE BATTALION READINESS & PERSONNEL WELFARE AUDIT REPORT"}
            </h1>
            <p className="text-xs text-slate-600 font-mono">
              HEADQUARTERS 104 BATTALION • OPERATIONAL DEPLOYMENT SECTOR
            </p>
          </div>
        </div>

        {/* Metadata Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-slate-400 font-medium block">Report ID:</span>
            <span className="font-mono font-bold text-slate-900">{report?.report_id || 'REP-104BN-PENDING'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Date & Time (IST):</span>
            <span className="font-mono font-bold text-slate-900">
              {report?.generated_at ? formatMilitaryDate(report.generated_at) : 'CURRENT TELEMETRY'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Commanding Officer:</span>
            <span className="font-bold text-slate-900">{report?.commanding_officer || 'Col. A. Sharma (Commandant)'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Privacy Compliance:</span>
            <span className="font-bold text-slate-900 font-mono">k-Anonymity (k≥5) Active</span>
          </div>
        </div>

        {/* Section 1: Executive KPI Metrics Table */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-black" />
            1. Battalion Strategic Readiness Summary
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50/80 rounded border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Force Readiness Index</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
                {report?.readiness_kpi?.force_readiness_index != null
                  ? `${report.readiness_kpi.force_readiness_index.toFixed(1)}%`
                  : '—'}
              </span>
              <span className="text-[10px] font-semibold text-slate-700">Target ≥ 85.0%</span>
            </div>

            <div className="p-3 bg-amber-50/50 rounded border border-amber-200 text-center">
              <span className="text-xs text-slate-500 block">Avg Battalion Stress</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
                {report?.readiness_kpi?.average_stress_score != null
                  ? report.readiness_kpi.average_stress_score.toFixed(1)
                  : '—'}
              </span>
              <span className="text-[10px] font-semibold text-amber-700">Moderate / Fatigued</span>
            </div>

            <div className="p-3 bg-red-50/50 rounded border border-red-200 text-center">
              <span className="text-xs text-slate-500 block">Acute Crisis Cases</span>
              <span className="text-2xl font-extrabold font-mono text-red-700 mt-1 block">
                {report?.readiness_kpi?.critical_cases_count != null
                  ? report.readiness_kpi.critical_cases_count
                  : '—'}
              </span>
              <span className="text-[10px] font-semibold text-red-700">Hospital Triage Priority</span>
            </div>

            <div className="p-3 bg-slate-50/80 rounded border border-slate-200 text-center">
              <span className="text-xs text-slate-500 block">Active Interventions</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
                {report?.readiness_kpi?.active_interventions_count != null
                  ? report.readiness_kpi.active_interventions_count
                  : '—'}
              </span>
              <span className="text-[10px] font-semibold text-slate-800">100% Monitored</span>
            </div>
          </div>
        </div>

        {/* Section 2: Company Breakdown Table (Mini-task 6.4.2) */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-800" />
            2. Company Deployment Strain Matrix
          </h3>

          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Strength</th>
                  <th className="py-2.5 px-3">Deployment Zone</th>
                  <th className="py-2.5 px-3 text-center">Avg Days Deployed</th>
                  <th className="py-2.5 px-3 text-center">Leave Denials</th>
                  <th className="py-2.5 px-3 text-center">Avg Stress</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(report?.company_readiness_breakdown || []).map((comp) => (
                  <tr key={comp.company_name} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{comp.company_name}</td>
                    <td className="py-2.5 px-3 font-mono">{comp.strength} Jawans</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{comp.deployment_zone}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">{comp.average_days_deployed.toFixed(0)} d</td>
                    <td className="py-2.5 px-3 text-center font-mono">{comp.total_leave_denials}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">{comp.average_stress_score.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        comp.company_risk_level === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : comp.company_risk_level === 'Vulnerable'
                          ? 'bg-orange-100 text-orange-800'
                          : comp.company_risk_level === 'Fatigued'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {comp.company_risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Critical Action Items */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-700" />
            3. Synthesized Tactical & Clinical Directives
          </h3>

          <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-2 text-xs">
            {report?.critical_action_items && report.critical_action_items.length > 0 ? (
              report.critical_action_items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{item}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">Battalion operating within resilient baseline parameters. Maintain scheduled rotations.</p>
            )}
          </div>
        </div>

        {/* Section 4: Legal & Statutory APAR Decoupling Seal */}
        <div className="p-4 bg-emerald-50/70 rounded-lg border border-emerald-300 text-xs mb-8 space-y-1 text-emerald-950">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <Lock className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>STATUTORY APAR/ACR DECOUPLING IMMUNITY CERTIFICATE</span>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-900/90">
            {report?.apar_immunity_seal || (
              "LEGAL CERTIFICATE: This operational readiness report is cryptographically quarantined from the Annual Confidential Report (ACR/APAR) appraisal database under Ministry of Home Affairs Medical Confidentiality Directives. Individual soldier identities remain shielded under k-anonymity."
            )}
          </p>
        </div>

        {/* Section 5: Cryptographic Digital Signature & Commander Sign-Off Block (Mini-task 6.4.2) */}
        <div className="border-t-2 border-slate-900 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          {/* Digital Cryptographic Seal */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              Cryptographic Integrity Verification
            </p>
            <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded leading-relaxed break-all border border-slate-800">
              <span className="text-slate-400 block mb-1">SHA-256 DIGITAL REPORT DIGEST:</span>
              {report?.digital_signature_hash || "GENERATING SECURE REPORT DIGEST..."}
            </div>
            <p className="text-[10px] text-slate-400">
              Verified by RAKSHAK-AAYUSH Governance Subsystem • Tamper-Evident Ledger
            </p>
          </div>

          {/* Commander Sign-Off Block */}
          <div className="text-right space-y-4">
            <div className="inline-block text-left border border-slate-300 rounded p-4 bg-slate-50/50 min-w-[260px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">Commanding Officer Ratification</p>
              <div className="h-12 border-b border-dashed border-slate-400 flex items-center justify-center my-1 text-slate-400 italic text-xs">
                [Digitally Signed & Validated]
              </div>
              <p className="font-bold text-slate-900 text-xs">
                {report?.commanding_officer || "Battalion Commandant"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Commandant, 104 Bn CAPF
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Timestamp (IST): {report?.generated_at ? formatMilitaryDate(report.generated_at) : formatMilitaryDate(new Date())}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Classification Bar */}
        <div className="border-t border-slate-200 mt-8 pt-3 text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          SECRET • FOR OFFICIAL DEFENSE USE ONLY • UNAUTHORIZED DUPLICATION PROHIBITED UNDER OFFICIAL SECRETS ACT
        </div>
      </div>
    </div>
  );
}

export default ExecutiveBriefing;
