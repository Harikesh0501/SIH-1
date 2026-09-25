"use client";

import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Tabs, TabList, TabTrigger, TabContent } from '../ui/Tabs';
import { fetchPersonnelDossier, createIntervention } from '../../lib/api';
import { formatMilitaryDate } from '../../lib/utils';
import {
  Sparkles,
  HeartPulse,
  Calendar,
  Clock,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Compass,
  User,
  Activity,
  AlertTriangle,
  FileText,
  Languages,
  CheckCircle2,
  Moon,
  Zap,
  TrendingDown,
  TrendingUp,
  Send,
  HeartHandshake,
  PlusCircle,
  Check,
} from 'lucide-react';

/**
 * Task 7.3 & 7.4: Comprehensive Soldier Clinical Dossier Modal with Action Dispatch
 * Implements Mini-task 7.3.1, 7.3.2, 7.3.3, 7.3.4, 7.3.5, and 7.4.1
 */
export function SoldierDossierModal({
  isOpen,
  onClose,
  personnelId,
  onOpenDispatch,
}) {
  const [dossier, setDossier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'
  const [activeTab, setActiveTab] = useState('xai');

  // Mini-task 7.4.1 Action Dispatch Form State
  const [dispatchType, setDispatchType] = useState('Mandatory 10-Day R&R Leave');
  const [dispatchPriority, setDispatchPriority] = useState('Routine');
  const [dispatchCounselor, setDispatchCounselor] = useState('Dr. Sunita Malhotra (CMO)');
  const [dispatchActionDetails, setDispatchActionDetails] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(null);

  useEffect(() => {
    if (!isOpen || !personnelId) return;

    const loadDossier = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPersonnelDossier(personnelId);
        setDossier(data);
      } catch (err) {
        console.error("Dossier fetch error:", err);
        setError(err?.response?.data?.detail || err.message || "Failed to load clinical dossier.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDossier();
  }, [isOpen, personnelId]);

  if (!isOpen) return null;

  const soldier = dossier?.personnel;
  const xai = dossier?.xai_attribution;
  const dutyHistory = dossier?.duty_history || [];
  const leaveHistory = dossier?.leave_history || [];
  const biometrics = dossier?.recent_biometrics || [];
  const assessments = dossier?.recent_assessments || [];
  const interventions = dossier?.interventions || [];
  const latestBio = biometrics[0];

  // Helper: auto-fill action dispatch from AI recommendation
  const adoptRecommendation = (rec) => {
    let mappedType = 'Mandatory 10-Day R&R Leave';
    const lower = (rec.title + ' ' + (rec.action_type || '')).toLowerCase();
    if (lower.includes('counsel') || lower.includes('tele')) {
      mappedType = 'Tele-Counseling Session';
    } else if (lower.includes('buddy') || lower.includes('peer')) {
      mappedType = 'Peer Buddy Pairing';
    } else if (lower.includes('rotation') || lower.includes('circadian')) {
      mappedType = 'Circadian Duty Rotation';
    } else if (lower.includes('medical') || lower.includes('review') || lower.includes('hospital')) {
      mappedType = 'Medical Review';
    }
    setDispatchType(mappedType);
    setDispatchPriority(rec.priority || 'Elevated');
    setDispatchActionDetails(`${rec.title}: ${rec.rationale}`);
    setActiveTab('dispatch');
  };

  // Helper: submit action dispatch
  const handleDispatchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!personnelId || !dispatchActionDetails) return;
    setIsSubmittingDispatch(true);
    setDispatchSuccess(null);
    try {
      const res = await createIntervention({
        personnel_id: personnelId,
        intervention_type: dispatchType,
        priority: dispatchPriority,
        assigned_counselor: dispatchCounselor,
        action_details: dispatchActionDetails,
        clinical_notes: dispatchNotes || undefined,
      });

      setDispatchSuccess(`Intervention #${res.id} successfully sanctioned for ${soldier?.full_name || 'personnel'}.`);
      setDossier((prev) => ({
        ...prev,
        interventions: [res, ...(prev?.interventions || [])],
      }));
      setDispatchActionDetails('');
      setDispatchNotes('');
    } catch (err) {
      console.error('Dispatch error:', err);
      alert(err?.response?.data?.detail || err.message || 'Failed to dispatch intervention.');
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      className="max-h-[95vh]"
    >
      {/* Mini-task 7.3.1: Unmasked Soldier Header */}
      <ModalHeader className="bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Soldier Photo Placeholder Avatar */}
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-base border border-slate-300 shadow-sm shrink-0">
              {soldier ? soldier.full_name.charAt(0) : "S"}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  {soldier ? soldier.full_name : "Loading Personnel..."}
                </span>
                <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  {soldier?.service_number}
                </span>
                {soldier && (
                  <Badge tier={soldier.risk_level} size="sm" score={soldier.stress_score.toFixed(1)} />
                )}
              </div>

              <p className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">{soldier?.rank}</span>
                <span className="text-slate-300">•</span>
                <span>{soldier?.company} Company, {soldier?.platoon}</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-700">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  {soldier?.deployment_zone} ({soldier?.days_in_current_zone}d continuous)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              <Lock className="w-3 h-3 text-emerald-700" />
              100% APAR Decoupled
            </span>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="p-5 space-y-6">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium">Decrypting clinical telemetry & running XAI inference...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between">
            <span>{error}</span>
            <Button size="xs" variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : dossier ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabList variant="underline">
              <TabTrigger value="xai" icon={Sparkles}>
                Explainable AI (XAI) Attribution
              </TabTrigger>
              <TabTrigger value="duty-leave" icon={Calendar} badge={dutyHistory.length + leaveHistory.length}>
                Duty & Leave History
              </TabTrigger>
              <TabTrigger value="biometrics" icon={HeartPulse} badge={biometrics.length}>
                Biometric Telemetry
              </TabTrigger>
              <TabTrigger value="assessments" icon={FileText} badge={assessments.length}>
                Voluntary Self-Assessments
              </TabTrigger>
              <TabTrigger value="dispatch" icon={Send} badge={interventions.length}>
                Intervention Dispatch & Records
              </TabTrigger>
            </TabList>

            {/* TAB 1 (Mini-task 7.3.2): Explainable AI Attribution */}
            <TabContent value="xai" className="space-y-5 pt-3">
              {/* Narrative Summary with Bilingual Switcher */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-slate-700" />
                    Clinical Predictive Narrative
                  </span>
                  
                  {/* Language Toggle Button */}
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setLanguage('en')}
                      className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                        language === 'en' ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage('hi')}
                      className={`px-2 py-0.5 rounded-md font-hindi font-semibold text-[11px] transition-colors cursor-pointer ${
                        language === 'hi' ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed text-slate-800 ${language === 'hi' ? 'font-hindi font-medium' : ''}`}>
                  {language === 'hi' ? xai?.clinical_narrative_hi : xai?.clinical_narrative_en}
                </p>
              </div>

              {/* 5-Factor XAI Attribution Visualizer */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Mathematical Factor Breakdown (Root Cause Attribution)
                </h4>

                <div className="space-y-3">
                  {(xai?.factors || []).map((factor, idx) => (
                    <div key={idx} className="p-3 bg-white rounded border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{language === 'hi' ? factor.feature_hi : factor.feature}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({factor.category})</span>
                        </span>
                        <span className="font-mono font-extrabold text-sm text-slate-900">
                          {factor.impact_pct.toFixed(1)}%
                        </span>
                      </div>

                      <ProgressBar
                        value={factor.impact_pct}
                        max={50}
                        variant="dynamic-stress"
                        size="xs"
                        showValue={false}
                      />

                      <p className="text-[11px] text-slate-500 leading-normal">
                        {factor.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prescribed Clinical Recommendations */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  AI Prescribed Clinical Recommendations
                </h4>
                <div className="space-y-2">
                  {(dossier?.prescribed_recommendations || []).map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50/90 rounded border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{rec.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black text-white font-bold">
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{rec.rationale}</p>
                        </div>
                      </div>

                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => adoptRecommendation(rec)}
                        className="shrink-0 font-bold text-[11px] self-start sm:self-center"
                        leftIcon={Send}
                      >
                        Adopt & Dispatch
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabContent>

            {/* TAB 2 (Mini-task 7.3.3): Duty Shift & Leave History */}
            <TabContent value="duty-leave" className="space-y-5 pt-3">
              {/* Duty Shift Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Operational Duty Shifts (Last 14 Days)
                </h4>

                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-semibold border-b">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Shift Type</th>
                        <th className="py-2 px-3 text-center">Duration</th>
                        <th className="py-2 px-3 text-center">Risk Level</th>
                        <th className="py-2 px-3">Operational Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {dutyHistory.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-400">No duty shifts logged</td></tr>
                      ) : (
                        dutyHistory.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">{d.date}</td>
                            <td className="py-2 px-3 font-sans font-bold text-slate-900 flex items-center gap-1.5">
                              {d.shift_type.includes('Night') && <Moon className="w-3 h-3 text-amber-600" />}
                              {d.shift_type}
                            </td>
                            <td className="py-2 px-3 text-center">{d.duty_hours} hrs</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                d.operational_risk_level === 'High' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {d.operational_risk_level}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-sans text-slate-600 text-[11px]">{d.notes || 'Routine patrol'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leave Applications & Cancellations */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Leave Records & Emergency Cancellations
                </h4>

                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-semibold border-b">
                      <tr>
                        <th className="py-2 px-3">Leave Type</th>
                        <th className="py-2 px-3 text-center">Days</th>
                        <th className="py-2 px-3">Reason / Purpose</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3">Administrative Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {leaveHistory.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-400">No leave records registered</td></tr>
                      ) : (
                        leaveHistory.map((l, i) => (
                          <tr key={i} className={l.status === 'Cancelled' ? 'bg-red-50/40' : ''}>
                            <td className="py-2 px-3 font-bold text-slate-900">{l.leave_type}</td>
                            <td className="py-2 px-3 text-center font-mono">{l.days_requested}</td>
                            <td className="py-2 px-3 text-slate-700">{l.reason}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.status === 'Cancelled'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500 italic text-[11px]">
                              {l.cancellation_reason || 'Approved by Company Commander'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabContent>

            {/* TAB 3 (Mini-task 7.3.4): Biometric Telemetry */}
            <TabContent value="biometrics" className="space-y-5 pt-3">
              {/* Telemetry KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-xs text-slate-500 block">Resting Heart Rate</span>
                  <span className="text-2xl font-mono font-bold text-slate-900 mt-1 block">
                    {latestBio ? `${latestBio.resting_heart_rate} BPM` : '—'}
                  </span>
                  <span className="text-[10px] text-slate-400">Baseline: 60-80</span>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-xs text-slate-500 block">HRV (RMSSD)</span>
                  <span className={`text-2xl font-mono font-bold mt-1 block ${
                    latestBio ? (latestBio.hrv_rmssd < 35 ? 'text-red-600' : 'text-emerald-700') : 'text-slate-900'
                  }`}>
                    {latestBio ? `${latestBio.hrv_rmssd.toFixed(1)} ms` : '—'}
                  </span>
                  <span className={`text-[10px] font-semibold ${latestBio && latestBio.hrv_rmssd < 35 ? 'text-red-600' : 'text-slate-400'}`}>
                    {latestBio ? (latestBio.hrv_rmssd < 35 ? 'Suppressed (Strain)' : 'Optimal') : 'No Telemetry'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-xs text-slate-500 block">Sleep Duration</span>
                  <span className="text-2xl font-mono font-bold text-slate-900 mt-1 block">
                    {latestBio ? `${latestBio.sleep_duration_hours.toFixed(1)} hrs` : '—'}
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold">Deficit &lt; 6.5h</span>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-xs text-slate-500 block">Deep Sleep Ratio</span>
                  <span className="text-2xl font-mono font-bold text-slate-900 mt-1 block">
                    {latestBio ? `${latestBio.deep_sleep_pct.toFixed(0)}%` : '—'}
                  </span>
                  <span className="text-[10px] text-slate-400">Target ≥ 20%</span>
                </div>
              </div>

              {/* Autonomic Recovery Status */}
              <div className="p-3.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Autonomic Nervous System Recovery Status:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {latestBio?.autonomic_recovery_status || 'Sympathetic Dominance (Physiological Stress Exhaustion)'}
                  </span>
                </div>
                <Badge tier={soldier?.risk_level} size="sm" />
              </div>

              {/* Historical Telemetry Logs Table */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Telemetry Sync Logs (SmartBand BLE Ingestion)
                </h5>
                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-semibold border-b">
                      <tr>
                        <th className="py-2 px-3">Timestamp</th>
                        <th className="py-2 px-3 text-center">Resting HR</th>
                        <th className="py-2 px-3 text-center">HRV (RMSSD)</th>
                        <th className="py-2 px-3 text-center">Sleep Hrs</th>
                        <th className="py-2 px-3 text-center">Deep Sleep %</th>
                        <th className="py-2 px-3">Recovery Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {biometrics.map((b, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3">{formatMilitaryDate(b.timestamp)}</td>
                          <td className="py-2 px-3 text-center">{b.resting_heart_rate} BPM</td>
                          <td className="py-2 px-3 text-center font-bold">{b.hrv_rmssd.toFixed(1)} ms</td>
                          <td className="py-2 px-3 text-center">{b.sleep_duration_hours.toFixed(1)} h</td>
                          <td className="py-2 px-3 text-center">{b.deep_sleep_pct.toFixed(0)}%</td>
                          <td className="py-2 px-3 font-sans text-slate-700 text-[11px]">{b.autonomic_recovery_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabContent>

            {/* TAB 4 (Mini-task 7.3.5): Self-Reported Check-ins & Psychometrics */}
            <TabContent value="assessments" className="space-y-4 pt-3">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  15-Second Daily Micro-Check-in Journal & Psychometrics
                </h4>

                <div className="space-y-3">
                  {assessments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No micro-checkins recorded yet.</p>
                  ) : (
                    assessments.map((a, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                          a.crisis_flag || a.stress_score >= 80
                            ? 'bg-red-50/60 border-red-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>Check-in: {formatMilitaryDate(a.timestamp)}</span>
                            {a.crisis_flag && (
                              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase">
                                Crisis Detected
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            Score: {a.stress_score.toFixed(1)} / 100
                          </span>
                        </div>

                        {/* Metric Ratings Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 font-medium">
                          <div>Mood Rating: <strong className="text-slate-900">{a.mood_score} / 5</strong></div>
                          <div>Sleep Quality: <strong className="text-slate-900">{a.sleep_quality} / 5</strong> ({a.sleep_hours} hrs)</div>
                          <div>Physical Exhaustion: <strong className="text-slate-900">{a.physical_exhaustion} / 5</strong></div>
                          <div>PHQ-4 Screener: <strong className="text-slate-900">{a.phq4_score} / 12</strong></div>
                        </div>

                        {/* Voluntary Confidential Journal Note */}
                        {a.voluntary_notes && (
                          <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200 text-slate-700 italic">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block not-italic mb-0.5">
                              Confidential Soldier Voice / Journal Note:
                            </span>
                            "{a.voluntary_notes}"
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabContent>

            {/* TAB 5 (Mini-task 7.4.1): Action Dispatch Form & Local Interventions History */}
            <TabContent value="dispatch" className="space-y-6 pt-3">
              {/* Success Notification */}
              {dispatchSuccess && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span>{dispatchSuccess}</span>
                  </div>
                  <button
                    onClick={() => setDispatchSuccess(null)}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Action Dispatch Form Card */}
              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-gov-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-800" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Sanction Welfare Intervention Directive
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Statutory Clinical Sanction
                  </span>
                </div>

                <form onSubmit={handleDispatchSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Intervention Type Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Intervention Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={dispatchType}
                        onChange={(e) => setDispatchType(e.target.value)}
                        className="w-full rounded-md border border-slate-300 text-xs py-2 px-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                      >
                        <option value="Mandatory 10-Day R&R Leave">Mandatory 10-Day R&R Leave</option>
                        <option value="Tele-Counseling Session">Tele-Counseling Session (Tele-MANAS)</option>
                        <option value="Peer Buddy Pairing">Peer Buddy Pairing (Unit Support)</option>
                        <option value="Circadian Duty Rotation">Circadian Duty Rotation</option>
                        <option value="Medical Review">Medical Review (Base Hospital)</option>
                      </select>
                    </div>

                    {/* Clinical Priority Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Clinical Priority <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={dispatchPriority}
                        onChange={(e) => setDispatchPriority(e.target.value)}
                        className="w-full rounded-md border border-slate-300 text-xs py-2 px-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                      >
                        <option value="Routine">Routine (Administrative Track)</option>
                        <option value="Elevated">Elevated (Priority Attention)</option>
                        <option value="Urgent - Critical">Urgent - Critical (Immediate Action)</option>
                      </select>
                    </div>
                  </div>

                  {/* Assigned Counselor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Assigned Doctor / Welfare Counselor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dispatchCounselor}
                      onChange={(e) => setDispatchCounselor(e.target.value)}
                      required
                      placeholder="e.g. Dr. Sunita Malhotra (CMO) or Base Psychologist"
                      className="w-full rounded-md border border-slate-300 text-xs py-2 px-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>

                  {/* Action Details */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Action Details & Directive Instruction <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dispatchActionDetails}
                      onChange={(e) => setDispatchActionDetails(e.target.value)}
                      required
                      placeholder="e.g. Grant 10 days emergency restorative leave and adjust unit duty strength."
                      className="w-full rounded-md border border-slate-300 text-xs py-2 px-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>

                  {/* Confidential Clinical Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Confidential Clinical Notes (Medical Confidentiality Protected)
                    </label>
                    <textarea
                      rows={2}
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                      placeholder="Confidential diagnostic rationale, sleep telemetry observations, or family hardship context..."
                      className="w-full rounded-md border border-slate-300 text-xs p-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmittingDispatch || !dispatchActionDetails}
                      className="font-bold text-xs"
                      leftIcon={Send}
                    >
                      {isSubmittingDispatch ? 'Sanctioning Intervention...' : 'Dispatch & Sanction Intervention'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Historical & Active Interventions for this Soldier */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-slate-500" />
                    Intervention History for {soldier?.full_name} ({interventions.length})
                  </h4>
                </div>

                {interventions.length === 0 ? (
                  <div className="p-6 rounded border border-slate-200 text-center text-slate-400 text-xs bg-slate-50/50">
                    No prior welfare interventions recorded for this personnel.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {interventions.map((intv) => (
                      <div
                        key={intv.id}
                        className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{intv.intervention_type}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              intv.priority === 'Urgent - Critical' ? 'bg-red-100 text-red-900 border border-red-200' :
                              intv.priority === 'Elevated' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                              'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}>
                              {intv.priority}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-700 border border-slate-300">
                              {intv.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-700 text-[11px] leading-relaxed">
                          {intv.action_details}
                        </p>

                        {intv.clinical_notes && (
                          <div className="p-2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-600 whitespace-pre-wrap">
                            {intv.clinical_notes}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                          <span>Counselor: <strong>{intv.assigned_counselor || 'Unit MO'}</strong></span>
                          <span>Dispatched: {formatMilitaryDate(intv.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabContent>
          </Tabs>
        ) : null}
      </ModalBody>

      <ModalFooter className="bg-slate-50 border-t border-slate-200">
        <Button variant="outline" onClick={onClose}>
          Close Dossier
        </Button>
        {activeTab !== 'dispatch' ? (
          <Button
            variant="primary"
            onClick={() => setActiveTab('dispatch')}
            leftIcon={Send}
            className="font-bold"
          >
            Dispatch Welfare Intervention
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleDispatchSubmit}
            disabled={isSubmittingDispatch || !dispatchActionDetails}
            leftIcon={Send}
            className="font-bold"
          >
            {isSubmittingDispatch ? 'Sanctioning...' : 'Sanction Directive'}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default SoldierDossierModal;
