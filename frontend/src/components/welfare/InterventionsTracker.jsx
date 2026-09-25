"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { TableRowSkeleton } from '../ui/Skeleton';
import {
  fetchInterventions,
  updateInterventionStatus,
  createIntervention,
  fetchWelfareTriageQueue,
} from '../../lib/api';
import { formatMilitaryDate } from '../../lib/utils';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Eye,
  Edit3,
  Calendar,
  User,
  ShieldCheck,
  Send,
  Building,
  HeartHandshake,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

/**
 * Task 7.4: Welfare Intervention Dispatch & Tracking System
 * Implements Mini-task 7.4.1 (Action Dispatch) and Mini-task 7.4.2 (Active Interventions Tracker)
 */
export function InterventionsTracker({ onExamineDossier }) {
  const [interventions, setInterventions] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');

  // Status Update Modal State
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [clinicalNotesToAppend, setClinicalNotesToAppend] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Dispatch New Intervention Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    personnel_id: '',
    intervention_type: 'Mandatory 10-Day R&R Leave',
    priority: 'Routine',
    assigned_counselor: 'Dr. Sunita Malhotra (CMO)',
    action_details: '',
    clinical_notes: '',
  });
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Load interventions and triage personnel list
  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [intvData, triageData] = await Promise.all([
        fetchInterventions(),
        fetchWelfareTriageQueue().catch(() => []),
      ]);
      setInterventions(intvData || []);
      setPersonnelList(triageData || []);
    } catch (err) {
      console.error('Failed to load interventions:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to fetch interventions data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filtered interventions
  const filteredInterventions = useMemo(() => {
    return interventions.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.personnel_name?.toLowerCase().includes(query) ||
        item.personnel_service_number?.toLowerCase().includes(query) ||
        item.intervention_type?.toLowerCase().includes(query) ||
        item.assigned_counselor?.toLowerCase().includes(query) ||
        item.action_details?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'ALL' || item.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === 'ALL' || item.priority.toLowerCase() === priorityFilter.toLowerCase();

      const matchesCompany =
        companyFilter === 'ALL' || item.personnel_company?.toLowerCase() === companyFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority && matchesCompany;
    });
  }, [interventions, searchQuery, statusFilter, priorityFilter, companyFilter]);

  // Aggregate KPI stats
  const kpiStats = useMemo(() => {
    const total = interventions.length;
    const urgent = interventions.filter((i) => i.priority === 'Urgent - Critical').length;
    const pendingCO = interventions.filter((i) => i.status === 'Recommended').length;
    const inProgress = interventions.filter((i) => i.status === 'In-Progress').length;
    const completed = interventions.filter((i) => i.status === 'Completed').length;
    return { total, urgent, pendingCO, inProgress, completed };
  }, [interventions]);

  // Handle status update submission
  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIntervention || !newStatus) return;

    setIsUpdatingStatus(true);
    setError(null);
    try {
      const updated = await updateInterventionStatus(
        selectedIntervention.id,
        newStatus,
        clinicalNotesToAppend.trim() || undefined
      );

      // Update state locally
      setInterventions((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );

      setSuccessToast(`Intervention #${updated.id} status successfully transitioned to "${updated.status}".`);
      setTimeout(() => setSuccessToast(null), 5000);
      setSelectedIntervention(null);
      setClinicalNotesToAppend('');
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err?.response?.data?.detail || err.message || 'Error updating intervention status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle new intervention dispatch submission
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchForm.personnel_id || !dispatchForm.action_details) {
      setError('Please select a soldier and specify action details.');
      return;
    }

    setIsSubmittingDispatch(true);
    setError(null);
    try {
      const created = await createIntervention({
        personnel_id: parseInt(dispatchForm.personnel_id, 10),
        intervention_type: dispatchForm.intervention_type,
        priority: dispatchForm.priority,
        assigned_counselor: dispatchForm.assigned_counselor,
        action_details: dispatchForm.action_details,
        clinical_notes: dispatchForm.clinical_notes || undefined,
      });

      setInterventions((prev) => [created, ...prev]);
      setSuccessToast(`Intervention #${created.id} sanctioned & dispatched for ${created.personnel_name}.`);
      setTimeout(() => setSuccessToast(null), 5000);

      setIsDispatchModalOpen(false);
      setDispatchForm({
        personnel_id: '',
        intervention_type: 'Mandatory 10-Day R&R Leave',
        priority: 'Routine',
        assigned_counselor: 'Dr. Sunita Malhotra (CMO)',
        action_details: '',
        clinical_notes: '',
      });
    } catch (err) {
      console.error('Failed to dispatch intervention:', err);
      setError(err?.response?.data?.detail || err.message || 'Error dispatching welfare intervention.');
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  // Helper for priority pill styling
  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent - Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping mr-0.5" />
            Urgent - Critical
          </span>
        );
      case 'Elevated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Elevated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            Routine
          </span>
        );
    }
  };

  // Helper for status pill styling
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Recommended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Recommended (Pending CO)
          </span>
        );
      case 'Approved by CO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Approved by CO
          </span>
        );
      case 'In-Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-300">
            <HeartHandshake className="w-3 h-3 text-emerald-700" />
            In-Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Completed
          </span>
        );
      case 'Deferred':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Deferred
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-800 hover:text-emerald-950 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="xs" variant="outline" onClick={() => loadData(true)}>
            Retry
          </Button>
        </div>
      )}

      {/* Top KPI Summary Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Interventions
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpiStats.total}
            </span>
            <span className="text-xs text-slate-500">Logged</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Urgent - Critical
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600 font-mono">
              {kpiStats.urgent}
            </span>
            <span className="text-xs text-red-600 font-semibold">Priority</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Pending CO Ratification
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpiStats.pendingCO}
            </span>
            <span className="text-xs text-slate-500">Pending</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            In-Progress
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpiStats.inProgress}
            </span>
            <span className="text-xs text-slate-500">Under Care</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Resolved / Completed
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {kpiStats.completed}
            </span>
            <span className="text-xs text-slate-500">Discharged</span>
          </div>
        </Card>
      </div>

      {/* Main Filter & Action Toolbar */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[260px]">
            <Input
              placeholder="Search soldier, service #, counselor, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={Search}
              className="py-1.5 text-xs"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 text-xs"
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'Recommended', label: 'Recommended' },
                  { value: 'Approved by CO', label: 'Approved by CO' },
                  { value: 'In-Progress', label: 'In-Progress' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Deferred', label: 'Deferred' },
                ]}
              />
            </div>

            <div className="w-36">
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="py-1.5 text-xs"
                options={[
                  { value: 'ALL', label: 'All Priorities' },
                  { value: 'Urgent - Critical', label: 'Urgent - Critical' },
                  { value: 'Elevated', label: 'Elevated' },
                  { value: 'Routine', label: 'Routine' },
                ]}
              />
            </div>

            <div className="w-32">
              <Select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="py-1.5 text-xs"
                options={[
                  { value: 'ALL', label: 'All Companies' },
                  { value: 'Alpha', label: 'Alpha Co' },
                  { value: 'Bravo', label: 'Bravo Co' },
                  { value: 'Charlie', label: 'Charlie Co' },
                  { value: 'Delta', label: 'Delta Co' },
                ]}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="text-xs shrink-0"
              leftIcon={RefreshCw}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsDispatchModalOpen(true)}
              className="text-xs shrink-0 font-bold"
              leftIcon={PlusCircle}
            >
              Dispatch Intervention
            </Button>
          </div>
        </div>
      </Card>

      {/* Interventions Matrix / Table */}
      <Card className="border-slate-200 overflow-hidden shadow-gov-subtle">
        <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-800" />
              Active Battalion Interventions Register
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Showing {filteredInterventions.length} of {interventions.length} interventions across all companies
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
              Audited Under DPDPA §14
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Soldier & Company</th>
                    <th className="py-3 px-4">Intervention Type</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                    <th className="py-3 px-4">Assigned Counselor</th>
                    <th className="py-3 px-4">Sanction Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <TableRowSkeleton rows={5} cols={7} />
                </tbody>
              </table>
            </div>
          ) : filteredInterventions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No matching interventions found</p>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Try modifying your filter parameters or dispatch a new welfare intervention using the button above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Soldier & Company</th>
                    <th className="py-3 px-4">Intervention Type</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                    <th className="py-3 px-4">Assigned Counselor</th>
                    <th className="py-3 px-4">Sanction Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInterventions.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      {/* Soldier Column */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.personnel_name || `Personnel #${item.personnel_id}`}</span>
                          {item.personnel_rank && (
                            <span className="text-[10px] font-normal text-slate-600">
                              ({item.personnel_rank})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <span>{item.personnel_service_number}</span>
                          <span>•</span>
                          <span className="text-slate-700 font-sans">{item.personnel_company}</span>
                        </div>
                      </td>

                      {/* Intervention Type Column */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                          <HeartHandshake className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                          <span>{item.intervention_type}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5 max-w-xs">
                          {item.action_details}
                        </p>
                      </td>

                      {/* Priority Column */}
                      <td className="py-3.5 px-4">
                        {renderPriorityBadge(item.priority)}
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Counselor Column */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-800">
                          {item.assigned_counselor || 'Unit Medical Officer'}
                        </div>
                        <span className="text-[10px] text-slate-600">
                          Rec: {item.recommended_by || 'CMO'}
                        </span>
                      </td>

                      {/* Sanction Date Column */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                        <div>{formatMilitaryDate(item.created_at)}</div>
                        {item.resolved_at && (
                          <div className="text-[10px] text-emerald-700">
                            Res: {formatMilitaryDate(item.resolved_at)}
                          </div>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onExamineDossier && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => onExamineDossier({ id: item.personnel_id, full_name: item.personnel_name })}
                              title="Examine Dossier"
                              className="text-xs"
                              leftIcon={Eye}
                            >
                              Dossier
                            </Button>
                          )}
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setSelectedIntervention(item);
                              setNewStatus(item.status);
                              setClinicalNotesToAppend('');
                            }}
                            className="text-xs font-semibold"
                            leftIcon={Edit3}
                          >
                            Update
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Update Intervention Status & Notes */}
      {selectedIntervention && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedIntervention(null)}
          size="lg"
        >
          <form onSubmit={handleUpdateStatusSubmit}>
            <ModalHeader className="bg-slate-50 border-b border-slate-200">
              <div>
                <ModalTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-800" />
                  Update Intervention Status & Clinical Record
                </ModalTitle>
                <ModalDescription className="text-xs text-slate-600 mt-0.5">
                  Intervention #{selectedIntervention.id} • {selectedIntervention.personnel_name} ({selectedIntervention.personnel_service_number})
                </ModalDescription>
              </div>
            </ModalHeader>

            <ModalBody className="p-5 space-y-4">
              {/* Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{selectedIntervention.intervention_type}</span>
                  <div>{renderPriorityBadge(selectedIntervention.priority)}</div>
                </div>
                <p className="text-slate-600 text-[11px]">
                  <strong>Action Directive:</strong> {selectedIntervention.action_details}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <span>Assigned: <strong>{selectedIntervention.assigned_counselor}</strong></span>
                  <span>Current: <strong>{selectedIntervention.status}</strong></span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Transition Status <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs font-medium"
                  options={[
                    { value: 'Recommended', label: 'Recommended (Pending CO Approval)' },
                    { value: 'Approved by CO', label: 'Approved by CO (Authorized)' },
                    { value: 'In-Progress', label: 'In-Progress (Care Underway)' },
                    { value: 'Completed', label: 'Completed (Case Resolved)' },
                    { value: 'Deferred', label: 'Deferred (Postponed)' },
                  ]}
                />
                <p className="text-[11px] text-slate-600 mt-1">
                  Transitions to <code>Completed</code> will automatically stamp the resolution timestamp.
                </p>
              </div>

              {/* Existing Clinical Notes Trail */}
              {selectedIntervention.clinical_notes && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Existing Clinical Notes Log
                  </label>
                  <div className="p-2.5 bg-slate-100/80 rounded border border-slate-200 text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {selectedIntervention.clinical_notes}
                  </div>
                </div>
              )}

              {/* Append Clinical Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Append Clinical Progress Note
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotesToAppend}
                  onChange={(e) => setClinicalNotesToAppend(e.target.value)}
                  placeholder="Record patient follow-up, travel authorization, counselor observation, or discharge remarks..."
                  className="w-full rounded-md border border-slate-300 text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-black text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>
            </ModalBody>

            <ModalFooter className="bg-slate-50 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedIntervention(null)}
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isUpdatingStatus}
                className="font-bold"
              >
                {isUpdatingStatus ? 'Updating Status...' : 'Commit Status Update'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Dispatch New Intervention */}
      {isDispatchModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDispatchModalOpen(false)}
          size="lg"
        >
          <form onSubmit={handleDispatchSubmit}>
            <ModalHeader className="bg-slate-50 border-b border-slate-200">
              <div>
                <ModalTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-800" />
                  Dispatch Welfare Intervention Directive
                </ModalTitle>
                <ModalDescription className="text-xs text-slate-600 mt-0.5">
                  Prescribe medical review, compulsory restorative leave, or psychological support with immediate audit logging.
                </ModalDescription>
              </div>
            </ModalHeader>

            <ModalBody className="p-5 space-y-4">
              {/* Soldier Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Target Soldier <span className="text-red-500">*</span>
                </label>
                <select
                  value={dispatchForm.personnel_id}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, personnel_id: e.target.value })}
                  required
                  className="w-full rounded-md border border-slate-300 text-xs py-2 px-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                >
                  <option value="">-- Select Soldier from Triage Registry --</option>
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.rank} {p.full_name} ({p.service_number}) • {p.company} • Risk: {p.risk_level} ({p.stress_score.toFixed(1)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Intervention Type & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Intervention Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={dispatchForm.intervention_type}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, intervention_type: e.target.value })}
                    className="w-full text-xs"
                    options={[
                      { value: 'Mandatory 10-Day R&R Leave', label: 'Mandatory 10-Day R&R Leave' },
                      { value: 'Tele-Counseling Session', label: 'Tele-Counseling Session (Tele-MANAS)' },
                      { value: 'Peer Buddy Pairing', label: 'Peer Buddy Pairing (Unit Support)' },
                      { value: 'Circadian Duty Rotation', label: 'Circadian Duty Rotation' },
                      { value: 'Medical Review', label: 'Medical Review (Base Hospital)' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Clinical Priority <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={dispatchForm.priority}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, priority: e.target.value })}
                    className="w-full text-xs"
                    options={[
                      { value: 'Routine', label: 'Routine (Administrative Track)' },
                      { value: 'Elevated', label: 'Elevated (Priority Attention)' },
                      { value: 'Urgent - Critical', label: 'Urgent - Critical (Immediate Action)' },
                    ]}
                  />
                </div>
              </div>

              {/* Assigned Counselor */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Assigned Doctor / Welfare Counselor <span className="text-red-500">*</span>
                </label>
                <Input
                  value={dispatchForm.assigned_counselor}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, assigned_counselor: e.target.value })}
                  placeholder="e.g. Dr. Sunita Malhotra (CMO) or Base Psychologist"
                  required
                  className="py-1.5 text-xs"
                />
              </div>

              {/* Action Details */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Operational Action Directive <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={dispatchForm.action_details}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, action_details: e.target.value })}
                  placeholder="e.g. Sanction 10-day emergency restorative leave and adjust company duty strength roster accordingly."
                  required
                  className="w-full rounded-md border border-slate-300 text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-black text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>

              {/* Confidential Clinical Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Initial Clinical Notes (Confidential)
                </label>
                <textarea
                  rows={2}
                  value={dispatchForm.clinical_notes}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, clinical_notes: e.target.value })}
                  placeholder="Confidential diagnostic rationale, reported sleep deprivation, or psychological screening observations..."
                  className="w-full rounded-md border border-slate-300 text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-black text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>
            </ModalBody>

            <ModalFooter className="bg-slate-50 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDispatchModalOpen(false)}
                disabled={isSubmittingDispatch}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingDispatch}
                className="font-bold"
                leftIcon={Send}
              >
                {isSubmittingDispatch ? 'Dispatching...' : 'Dispatch & Sanction Intervention'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default InterventionsTracker;
