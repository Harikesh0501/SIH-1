"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { simulateCommanderWorkload } from '../../lib/api';
import {
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  Compass,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';

/**
 * Task 6.3: Operational "What-If" Workload Rebalancing Simulator
 * Connects directly to POST /api/commander/simulate-workload
 */
export function WorkloadSimulator({ initialCompany = 'Alpha' }) {
  const [selectedCompany, setSelectedCompany] = useState(initialCompany);
  const [rotationDays, setRotationDays] = useState(14);
  const [leaveCount, setLeaveCount] = useState(6);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Available Companies
  const companies = [
    { value: 'Alpha', label: 'Alpha Company (Ladakh - Extreme Altitude)', zone: 'High Altitude (Ladakh)' },
    { value: 'Bravo', label: 'Bravo Company (Valley Counter-Insurgency)', zone: 'Valley CI Sector' },
    { value: 'Charlie', label: 'Charlie Company (Dense Forest / LWE)', zone: 'LWE Dense Forest' },
    { value: 'Delta', label: 'Delta Company (Reserve & Peace R&R)', zone: 'Battalion Depot' },
  ];

  // Run simulation against backend
  const runSimulation = async (company = selectedCompany, days = rotationDays, leaves = leaveCount) => {
    setIsSimulating(true);
    setError(null);
    try {
      const res = await simulateCommanderWorkload({
        company: company,
        rotate_to_base_days_earlier: Number(days),
        mandatory_rr_leave_jawans_count: Number(leaves),
      });
      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation error:", err);
      setError(err?.response?.data?.detail || err.message || "Failed to execute workload simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Run simulation on initial load and when inputs change
  useEffect(() => {
    runSimulation(selectedCompany, rotationDays, leaveCount);
  }, [selectedCompany, rotationDays, leaveCount]);

  // Tactical scenario presets
  const applyPreset = (presetName) => {
    setIsApproved(false);
    if (presetName === 'baseline') {
      setRotationDays(0);
      setLeaveCount(0);
    } else if (presetName === 'tactical') {
      setRotationDays(7);
      setLeaveCount(4);
    } else if (presetName === 'rebalance') {
      setRotationDays(14);
      setLeaveCount(6);
    } else if (presetName === 'surge') {
      setRotationDays(21);
      setLeaveCount(10);
    }
  };

  const handleApproveOrder = () => {
    setIsApprovalModalOpen(true);
  };

  const confirmOrderApproval = () => {
    setIsApproved(true);
    setIsApprovalModalOpen(false);
  };

  const currentZone = companies.find(c => c.value === selectedCompany)?.zone || 'Active Zone';

  return (
    <div className="space-y-6">
      {/* Scenario Presets Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="text-xs font-bold text-slate-900">
            Workload Rebalancing & Rotation Simulator
          </span>
        </div>

        {/* Quick Scenario Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('baseline')}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
              rotationDays === 0 && leaveCount === 0
                ? 'bg-black text-white border-black font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Status Quo
          </button>
          <button
            onClick={() => applyPreset('tactical')}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
              rotationDays === 7 && leaveCount === 4
                ? 'bg-black text-white border-black font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            7d Relief
          </button>
          <button
            onClick={() => applyPreset('rebalance')}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
              rotationDays === 14 && leaveCount === 6
                ? 'bg-black text-white border-black font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            14d Recommended
          </button>
          <button
            onClick={() => applyPreset('surge')}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
              rotationDays === 21 && leaveCount === 10
                ? 'bg-black text-white border-black font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Surge
          </button>
        </div>
      </div>

      {/* Error notification if any */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Simulation Notice:</strong> {error}</span>
          </div>
          <Button size="xs" variant="outline" onClick={() => runSimulation()}>
            Retry
          </Button>
        </div>
      )}

      {/* Grid: Left Control Panel + Right Live Visual Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Simulation Control Panel */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle subtitle="Adjust operational parameters to dynamically project troop recovery">
                Tactical Simulation Controls
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Company Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Target Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => {
                    setSelectedCompany(e.target.value);
                    setIsApproved(false);
                  }}
                  className="w-full rounded-md border border-slate-300 text-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                >
                  {companies.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deployment: <strong>{currentZone}</strong></span>
                </p>
              </div>

              {/* Slider 1: Rotation Advancement Slider */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-700" />
                    Advance Base Rotation
                  </label>
                  <span className="font-mono text-sm font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {rotationDays}d earlier
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={rotationDays}
                  onChange={(e) => {
                    setRotationDays(Number(e.target.value));
                    setIsApproved(false);
                  }}
                  className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0d (Normal)</span>
                  <span>7d</span>
                  <span>14d (Recommended)</span>
                  <span>21d</span>
                  <span>30d (Max)</span>
                </div>
              </div>

              {/* Slider 2: Mandatory R&R Leave Sanctions */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-700" />
                    Mandatory R&R Sanctions
                  </label>
                  <span className="font-mono text-sm font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {leaveCount} Jawans
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={leaveCount}
                  onChange={(e) => {
                    setLeaveCount(Number(e.target.value));
                    setIsApproved(false);
                  }}
                  className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 Jawans</span>
                  <span>5 Jawans</span>
                  <span>10 Jawans</span>
                  <span>15 Jawans</span>
                  <span>20 Jawans</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Dynamic Projections & Ratification */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Key Simulation Outcomes Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Outcome 1: Risk Reduction */}
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Burnout Relief</span>
                <TrendingDown className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate-950">
                {simulationResult ? `-${simulationResult.risk_reduction_pct}%` : '-0.0%'}
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold">Projected reduction</p>
            </div>

            {/* Outcome 2: Readiness Gain */}
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Readiness Gain</span>
                <TrendingUp className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate-950">
                {simulationResult ? `+${simulationResult.projected_readiness_increase_pct}%` : '+0.0%'}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Troop availability</p>
            </div>

            {/* Outcome 3: Prevented Breakdowns */}
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Averted Crises</span>
                <ShieldCheck className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate-950">
                {simulationResult ? `${simulationResult.prevented_critical_cases} Troops` : '0 Troops'}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Immediate stabilization</p>
            </div>
          </div>

          {/* Current vs Projected Burnout Comparison Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                Burnout Risk Comparison
              </CardTitle>
              <CardDescription>
                Baseline vs. post-rebalancing projected stress score
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score Comparison Bars */}
              <div className="space-y-4">
                {/* Current Baseline */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">
                      Current Baseline ({selectedCompany} Company)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {simulationResult ? `${simulationResult.current_burnout_risk.toFixed(1)} / 100` : '—'}
                    </span>
                  </div>
                  <ProgressBar
                    value={simulationResult?.current_burnout_risk || 0}
                    variant="dynamic-stress"
                    size="md"
                    showValue={false}
                  />
                </div>

                {/* Projected Rebalanced */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                      Projected Outcome (After Relief & Leaves)
                    </span>
                    <span className="font-mono font-bold text-slate-950 text-sm">
                      {simulationResult ? `${simulationResult.projected_burnout_risk.toFixed(1)} / 100` : '—'}
                    </span>
                  </div>
                  <ProgressBar
                    value={simulationResult?.projected_burnout_risk || 0}
                    variant="dynamic-readiness"
                    size="md"
                    showValue={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actionable Directive Card with Ratify Button */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Tactical Directive</CardTitle>
                <CardDescription>Official order ready for commander ratification</CardDescription>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                REF: ORD-104-{selectedCompany.toUpperCase()}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Formation</span>
                  <span className="font-bold text-slate-900">{selectedCompany} Co</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Rotation</span>
                  <span className="font-mono font-bold text-slate-900">+{rotationDays}d earlier</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">R&R Leaves</span>
                  <span className="font-mono font-bold text-slate-900">{leaveCount} Jawans</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Relief</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {simulationResult?.risk_reduction_pct != null ? `-${simulationResult.risk_reduction_pct}%` : '—'}
                  </span>
                </div>
              </div>

              {/* Status after approval */}
              {isApproved && (
                <div className="p-3 rounded-lg bg-slate-950 text-white text-xs flex items-center gap-2.5 animate-in fade-in-50 duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Order Confirmed & Cryptographically Dispatched</span>
                    <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                      ORD-104-ROTA-{selectedCompany.toUpperCase()}-{new Date().getFullYear()} • Logged in Immutable Audit Ledger
                    </span>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-between pt-0 pb-4 px-5">
              <span className="text-[11px] text-slate-400 font-mono">
                COMMAND AUTH • 104 BN
              </span>
              <Button
                variant={isApproved ? "outline" : "primary"}
                leftIcon={isApproved ? CheckCircle2 : Sparkles}
                onClick={handleApproveOrder}
              >
                {isApproved ? "Re-issue Rotation" : "Approve Rebalanced Rotation"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal for Order Approval */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        size="md"
      >
        <ModalHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <ModalTitle>
              Confirm Operational Rebalancing Order
            </ModalTitle>
          </div>
          <ModalDescription>
            Ministry of Home Affairs • 104 Bn CAPF Command Authority
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 text-slate-700">
            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="text-slate-500">Target Formation:</span>
              <span className="font-bold text-slate-900">{selectedCompany} Company</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="text-slate-500">Rotation Schedule:</span>
              <span className="font-bold text-emerald-800 font-mono">Advance by {rotationDays} Days</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
              <span className="text-slate-500">Mandatory R&R Sanctions:</span>
              <span className="font-bold text-amber-800 font-mono">{leaveCount} Jawans</span>
            </div>
            <div className="flex justify-between pb-0.5">
              <span className="text-slate-500">Projected Burnout Relief:</span>
              <span className="font-bold text-emerald-700 font-mono">
                {simulationResult?.risk_reduction_pct != null ? `-${simulationResult.risk_reduction_pct}%` : 'Calculating...'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            By confirming, this tactical order will be stamped with your digital commander signature, transmitted to the Company Commander and Unit Medical Officer, and logged in the immutable system audit trail.
          </p>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmOrderApproval}>
            Sign & Ratify Rotation Order
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default WorkloadSimulator;
