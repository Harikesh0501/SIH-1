"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { TableRowSkeleton } from '../ui/Skeleton';
import { fetchJawanHistory, submitLeaveRequest } from '../../lib/api';
import { getTranslation } from './translations';
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HeartHandshake,
  PlusCircle,
  FileText,
  XCircle,
  Send,
  Info,
  Lock,
  RefreshCw,
  Home,
  Briefcase,
  UserCheck,
  Award,
} from 'lucide-react';

/**
 * Task 8.5: Private Leave & Welfare Request Tracker
 * Implements Mini-task 8.5.1 and Mini-task 8.5.2
 */
export function LeaveTrackerCard({ lang = 'en', onNavigateToSathi }) {
  const t = (key) => getTranslation(lang, key);

  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Leave Application Form State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [leaveType, setLeaveType] = useState('Casual Leave (CL)');
  const [daysRequested, setDaysRequested] = useState(10);
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    return tomorrow.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 15);
    return end.toISOString().split('T')[0];
  });
  const [personalReason, setPersonalReason] = useState('');
  const [isEmergencyGrievance, setIsEmergencyGrievance] = useState(false);
  const [confidentialNotes, setConfidentialNotes] = useState('');

  const loadJawanLeaveData = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJawanHistory();
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to load leave records:', err);
      setError(err?.response?.data?.detail || err.message || 'Unable to retrieve personal welfare history.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadJawanLeaveData();
    const interval = setInterval(() => {
      loadJawanLeaveData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenForm = (prefillType = null) => {
    if (prefillType) {
      setLeaveType(prefillType);
      if (prefillType.includes('Emergency') || prefillType.includes('Compassionate')) {
        setIsEmergencyGrievance(true);
      }
    }
    setFormError(null);
    setIsApplyModalOpen(true);
  };

  const handleSubmitLeaveForm = async (e) => {
    e.preventDefault();
    if (!personalReason.trim()) {
      setFormError(lang === 'hi' ? 'कृपया अवकाश का कारण विवरण अवश्य दर्ज करें।' : 'Please describe the reason for your leave request.');
      return;
    }

    if (daysRequested < 1 || daysRequested > 60) {
      setFormError(lang === 'hi' ? 'दिनों की संख्या 1 से 60 के बीच होनी चाहिए।' : 'Number of days requested must be between 1 and 60.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        leave_type: leaveType,
        days_requested: parseInt(daysRequested, 10),
        start_date: startDate,
        end_date: endDate,
        personal_reason: personalReason.trim(),
        is_emergency_welfare_request: isEmergencyGrievance,
        confidential_notes: confidentialNotes.trim() || undefined,
      };

      const res = await submitLeaveRequest(payload);
      setSuccessNotice(t('leaveSubmitSuccess'));
      setIsApplyModalOpen(false);
      setPersonalReason('');
      setConfidentialNotes('');
      setIsEmergencyGrievance(false);

      // Refresh records to show newly created leave and any welfare intervention
      await loadJawanLeaveData(true);

      // Auto-clear notice after 6 seconds
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err) {
      console.error('Leave submission error:', err);
      setFormError(err?.response?.data?.detail || err.message || 'Error transmitting confidential leave application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for status badge styling
  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'sanctioned' || s === 'approved' || s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          {t('statusSanctioned')}
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          {t('statusPending')}
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-700" />
          {t('statusCancelled')}
        </span>
      );
    }
    if (s === 'deferred') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
          <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
          {t('statusDeferred')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  // Helper for leave type display with translation
  const getLeaveTypeDisplay = (type) => {
    if (!type) return 'Leave';
    if (type.includes('Casual')) return t('leaveTypeCL');
    if (type.includes('Earned')) return t('leaveTypeEL');
    if (type.includes('Emergency') || type.includes('R&R')) return t('leaveTypeEmergencyRR');
    if (type.includes('Medical')) return t('leaveTypeMedical');
    if (type.includes('Compassionate')) return t('leaveTypeCompassionate');
    return type;
  };

  const leaveRecords = historyData?.leave_records || [];
  const interventions = historyData?.interventions || [];
  const monthsSinceLeave = historyData?.months_since_last_leave;
  const cancellationsCount = historyData?.leave_cancellations_count;
  const pendingCount = leaveRecords.filter((l) => (l.status || '').toLowerCase() === 'pending').length;
  const sanctionedCount = leaveRecords.filter((l) => (l.status || '').toLowerCase() === 'sanctioned').length;

  return (
    <div className="space-y-6">
      {/* Success Notification Alert */}
      {successNotice && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between gap-3 shadow-gov-subtle animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="font-semibold">{successNotice}</span>
          </div>
          <Button size="xs" variant="outline" onClick={() => setSuccessNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Leave Tracker Card */}
      <Card className="border border-slate-200 shadow-gov-subtle overflow-hidden">
        {/* Card Header & Fast Action */}
        <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-black text-white flex items-center justify-center font-bold border border-slate-800 shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  {t('leaveHeading')}
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  {t('leaveSubheading')}
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadJawanLeaveData(true)}
              disabled={isRefreshing || isLoading}
              className="text-xs border-slate-300"
              leftIcon={RefreshCw}
            >
              {isRefreshing ? '...' : 'Refresh'}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleOpenForm()}
              className="text-xs font-bold shadow-xs"
              leftIcon={PlusCircle}
            >
              {t('applyLeaveBtn')}
            </Button>
          </div>
        </CardHeader>

        {/* 4 Summary Stat Tiles */}
        <div className="p-5 border-b border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Tile 1: Months Separated */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {t('monthsSeparatedLabel')}
              </span>
              <Home className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {monthsSinceLeave != null ? monthsSinceLeave.toFixed(1) : '—'} <span className="text-xs font-sans font-normal text-slate-500">mos</span>
            </div>
          </div>

          {/* Tile 2: Cancelled Leaves */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {t('cancelledLeavesLabel')}
              </span>
              <AlertTriangle className={`w-4 h-4 ${(cancellationsCount ?? 0) > 0 ? 'text-red-500' : 'text-slate-400'}`} />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              <span className={(cancellationsCount ?? 0) > 0 ? 'text-red-600' : 'text-slate-900'}>
                {cancellationsCount != null ? cancellationsCount : '—'}
              </span> <span className="text-xs font-sans font-normal text-slate-500">events</span>
            </div>
          </div>

          {/* Tile 3: Pending Requests */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {t('pendingRequestsLabel')}
              </span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {pendingCount} <span className="text-xs font-sans font-normal text-slate-500">pending</span>
            </div>
          </div>

          {/* Tile 4: Sanctioned Leaves */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {t('sanctionedDaysLabel')}
              </span>
              <CheckCircle2 className="w-4 h-4 text-slate-700" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {sanctionedCount} <span className="text-xs font-sans font-normal text-slate-500">sanctioned</span>
            </div>
          </div>
        </div>

        {/* Content Section: Leave Records Table */}
        <CardContent className="p-5 space-y-6">
          {isLoading ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">{t('thLeaveType')}</th>
                    <th className="py-3 px-4">{t('thDates')}</th>
                    <th className="py-3 px-4">{t('thDays')}</th>
                    <th className="py-3 px-4">{t('thStatus')}</th>
                    <th className="py-3 px-4">{t('thReason')}</th>
                  </tr>
                </thead>
                <tbody>
                  <TableRowSkeleton rows={4} cols={5} />
                </tbody>
              </table>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
              <span>{error}</span>
              <Button size="xs" variant="outline" onClick={() => loadJawanLeaveData()}>
                Retry
              </Button>
            </div>
          ) : leaveRecords.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">{t('noLeavesFound')}</p>
              <Button size="sm" variant="primary" onClick={() => handleOpenForm()}>
                {t('applyLeaveBtn')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {t('leaveHistoryTitle')}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {t('leaveHistorySub')}
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {leaveRecords.length} records logged
                </span>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">{t('thLeaveType')}</th>
                      <th className="py-3 px-4">{t('thDates')}</th>
                      <th className="py-3 px-4">{t('thDays')}</th>
                      <th className="py-3 px-4">{t('thStatus')}</th>
                      <th className="py-3 px-4">{t('thReason')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {leaveRecords.map((leave, idx) => (
                      <tr
                        key={leave.id || idx}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          leave.status === 'Cancelled' ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* Leave Type */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                            <span>{getLeaveTypeDisplay(leave.leave_type)}</span>
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {leave.start_date} <span className="text-slate-400">→</span> {leave.end_date}
                        </td>

                        {/* Days */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {leave.days_requested} <span className="font-normal text-slate-500 font-sans">days</span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderStatusBadge(leave.status)}
                        </td>

                        {/* Reason / Remarks */}
                        <td className="py-3.5 px-4 max-w-xs text-slate-700">
                          <div className="space-y-1">
                            {leave.personal_reason && (
                              <p className="font-medium text-slate-900 truncate" title={leave.personal_reason}>
                                "{leave.personal_reason}"
                              </p>
                            )}
                            {leave.cancellation_reason && (
                              <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[10px] leading-tight flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Unit Cancellation Notice:</strong> {leave.cancellation_reason}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active Welfare Officer Interventions for Ramesh */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-800" />
                  <span>{t('activeInterventionsTitle')}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {t('activeInterventionsSub')}
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {interventions.length} Welfare Dispatches
              </span>
            </div>

            {interventions.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
                {t('noInterventionsFound')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {interventions.map((intv) => (
                  <div
                    key={intv.id}
                    className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          {intv.intervention_type}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          Priority: <span className="font-semibold text-slate-800">{intv.priority}</span> • Assigned:{' '}
                          <span className="font-semibold text-slate-800">{intv.assigned_counselor || 'Unit Welfare Wing'}</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          intv.status === 'Completed'
                            ? 'success'
                            : intv.status === 'Approved by CO'
                            ? 'champagne'
                            : 'neutral'
                        }
                        className="text-[10px] uppercase font-bold shrink-0"
                      >
                        {intv.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 italic bg-white p-2 rounded border border-slate-200">
                      "{intv.action_details}"
                    </p>

                    {intv.clinical_notes && (
                      <div className="text-[10px] text-slate-600 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-800 shrink-0" />
                        <span><strong>Confidential Notes:</strong> {intv.clinical_notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Statutory Safeguard Footer */}
        <CardFooter className="bg-slate-50/50 border-t border-slate-200 py-3.5 px-5 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="text-[11px] text-slate-500">
              DPDPA §14 Quarantined • Zero Impact on Promotion Boards
            </span>
          </div>
          {onNavigateToSathi && (
            <Button size="xs" variant="outline" onClick={onNavigateToSathi} className="shrink-0 text-xs">
              AI Sathi
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* MODAL: Submit Confidential Leave / Emergency Welfare Request Form (Mini-task 8.5.2) */}
      {isApplyModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isSubmitting && setIsApplyModalOpen(false)}
          size="lg"
          className="max-h-[92vh]"
        >
          <ModalHeader className="bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold border border-slate-800 shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <ModalTitle className="text-base font-bold text-slate-900">
                  {t('newLeaveFormTitle')}
                </ModalTitle>
                <ModalDescription className="text-xs text-slate-600">
                  {t('newLeaveFormSub')}
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <form onSubmit={handleSubmitLeaveForm}>
            <ModalBody className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[68vh]">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Field 1: Leave Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t('formLeaveTypeLabel')}
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => {
                    setLeaveType(e.target.value);
                    if (e.target.value.includes('Emergency') || e.target.value.includes('Compassionate')) {
                      setIsEmergencyGrievance(true);
                    }
                  }}
                  className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="Casual Leave (CL)">{t('leaveTypeCL')}</option>
                  <option value="Earned Leave (EL)">{t('leaveTypeEL')}</option>
                  <option value="Emergency R&R">{t('leaveTypeEmergencyRR')}</option>
                  <option value="Medical / Convalescence">{t('leaveTypeMedical')}</option>
                  <option value="Compassionate Family Emergency">{t('leaveTypeCompassionate')}</option>
                </select>
              </div>

              {/* Row: Days, Start Date, End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    {t('formDaysLabel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={daysRequested}
                    onChange={(e) => setDaysRequested(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    {t('formStartDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    {t('formEndDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>
              </div>

              {/* Field 3: Reason / Family Situation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t('formReasonLabel')}
                </label>
                <textarea
                  rows={3}
                  value={personalReason}
                  onChange={(e) => setPersonalReason(e.target.value)}
                  placeholder={t('formReasonPlaceholder')}
                  className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              {/* Field 4: Emergency Grievance Checkbox */}
              <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/50 space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergencyGrievance}
                    onChange={(e) => setIsEmergencyGrievance(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-700"
                  />
                  <span className="text-xs font-bold text-amber-950">
                    {t('formEmergencyCheckbox')}
                  </span>
                </label>
                <p className="text-[10px] text-amber-800 pl-6">
                  {lang === 'hi'
                    ? 'इसे चिह्नित करने पर यूनिट वेलफेयर ऑफिसर (डॉक्टर/काउंसलर) के पोर्टल पर तत्काल प्राथमिकता सूचना भेजी जाएगी ताकि छुट्टी जल्द स्वीकृत हो सके।'
                    : 'Flagging this automatically dispatches an expedited triage intervention directly to the Medical & Welfare Officer queue.'}
                </p>
              </div>

              {/* Field 5: Optional Travel / Operational Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {t('formNotesLabel')}
                </label>
                <input
                  type="text"
                  value={confidentialNotes}
                  onChange={(e) => setConfidentialNotes(e.target.value)}
                  placeholder={t('formNotesPlaceholder')}
                  className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Statutory Privacy Notice */}
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {t('formPrivacyDisclaimer')}
                </p>
              </div>
            </ModalBody>

            <ModalFooter className="bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsApplyModalOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                {t('closeFormBtn')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="text-xs font-bold"
                leftIcon={Send}
              >
                {isSubmitting ? t('submittingLeaveRequest') : t('submitLeaveRequestBtn')}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default LeaveTrackerCard;
