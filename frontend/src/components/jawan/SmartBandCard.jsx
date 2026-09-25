"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar, StackedProgressBar } from '../ui/ProgressBar';
import { syncSmartbandBiometrics, fetchJawanHistory } from '../../lib/api';
import { formatMilitaryDate } from '../../lib/utils';
import { getTranslation } from './translations';
import {
  HeartPulse,
  Activity,
  Moon,
  BatteryCharging,
  Bluetooth,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Clock,
  Zap,
  Radio,
} from 'lucide-react';

/**
 * Task 8.3: Wearable SmartBand Telemetry Sync Simulator
 * Implements Mini-task 8.3.1 (Telemetry Dashboard) & Mini-task 8.3.2 (Sync Simulator)
 */
export function SmartBandCard({ lang = 'en', onSyncSuccess }) {
  const t = (key) => getTranslation(lang, key);

  // Live telemetry metrics
  const [latestVitals, setLatestVitals] = useState({
    resting_heart_rate: 68,
    hrv_rmssd: 54.2,
    sleep_duration_hours: 6.8,
    deep_sleep_pct: 22.4,
    stress_biomarker_index: 38.5,
    autonomic_recovery_status: 'Optimal Parasympathetic Recovery (Balanced ANS Tone)',
    sync_timestamp: new Date().toISOString(),
  });

  const [historyList, setHistoryList] = useState([]);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);
  const [error, setError] = useState(null);

  // Fetch initial history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchJawanHistory();
        if (data.recent_biometrics && data.recent_biometrics.length > 0) {
          const latest = data.recent_biometrics[0];
          setLatestVitals({
            resting_heart_rate: latest.resting_heart_rate,
            hrv_rmssd: latest.hrv_rmssd,
            sleep_duration_hours: latest.sleep_duration_hours,
            deep_sleep_pct: latest.deep_sleep_pct,
            stress_biomarker_index: latest.stress_biomarker_index || 42.0,
            autonomic_recovery_status: latest.hrv_rmssd >= 50
              ? 'Optimal Parasympathetic Recovery (Balanced ANS Tone)'
              : latest.hrv_rmssd >= 35
              ? 'Moderate Sympathetic Arousal (Mild Recovery Deficit)'
              : 'Acute Autonomic Strain (Severe Autonomic Nervous Depletion)',
            sync_timestamp: latest.timestamp,
          });
          setHistoryList(data.recent_biometrics);
        }
      } catch (err) {
        console.warn('Could not load prior biometrics:', err);
      }
    };

    loadHistory();
  }, []);

  // Mini-task 8.3.2: Realistic sensor fluctuation & Bluetooth sync
  const handleSyncTelemetry = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncToast(null);

    // Realistic sensor fluctuations simulating frontline soldier physiology
    // Slightly randomize resting HR (62 - 82), HRV (36 - 68), sleep (5.0 - 8.5), deep sleep (16 - 28)
    const simulatedRHR = Math.floor(62 + Math.random() * 20);
    const simulatedHRV = parseFloat((36 + Math.random() * 32).toFixed(1));
    const simulatedSleep = parseFloat((5.0 + Math.random() * 3.5).toFixed(1));
    const simulatedDeepSleep = parseFloat((16 + Math.random() * 12).toFixed(1));

    try {
      const response = await syncSmartbandBiometrics({
        resting_heart_rate: simulatedRHR,
        hrv_rmssd: simulatedHRV,
        sleep_duration_hours: simulatedSleep,
        deep_sleep_pct: simulatedDeepSleep,
        sync_source: 'SmartBand BLE Tactical V2',
      });

      setLatestVitals({
        resting_heart_rate: response.resting_heart_rate,
        hrv_rmssd: response.hrv_rmssd,
        sleep_duration_hours: response.sleep_duration_hours,
        deep_sleep_pct: response.deep_sleep_pct,
        stress_biomarker_index: response.stress_biomarker_index,
        autonomic_recovery_status: response.autonomic_recovery_status,
        sync_timestamp: response.sync_timestamp,
      });

      // Update history stream locally
      setHistoryList((prev) => [
        {
          id: response.log_id,
          timestamp: response.sync_timestamp,
          resting_heart_rate: response.resting_heart_rate,
          hrv_rmssd: response.hrv_rmssd,
          sleep_duration_hours: response.sleep_duration_hours,
          deep_sleep_pct: response.deep_sleep_pct,
          stress_biomarker_index: response.stress_biomarker_index,
          autonomic_recovery_status: response.autonomic_recovery_status,
        },
        ...prev,
      ]);

      // Drain 1% simulated battery on sync
      setBatteryLevel((b) => Math.max(12, b - 1));

      setSyncToast(t('syncSuccessNotice'));
      setTimeout(() => setSyncToast(null), 5000);

      if (onSyncSuccess) onSyncSuccess(response);
    } catch (err) {
      console.error('Failed to sync biometrics:', err);
      setError(err?.response?.data?.detail || err.message || 'Bluetooth telemetry sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper for RHR classification
  const getRhrStatus = (rhr) => {
    if (rhr <= 80) return { label: t('rhrNormal'), color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (rhr <= 99) return { label: t('rhrElevated'), color: 'text-amber-800 bg-amber-50 border-amber-300' };
    return { label: t('rhrHigh'), color: 'text-red-800 bg-red-50 border-red-300' };
  };

  // Helper for HRV classification
  const getHrvStatus = (hrv) => {
    if (hrv >= 50) return { label: t('hrvOptimal'), color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (hrv >= 35) return { label: t('hrvModerate'), color: 'text-amber-800 bg-amber-50 border-amber-300' };
    return { label: t('hrvStrain'), color: 'text-red-800 bg-red-50 border-red-300' };
  };

  const rhrMeta = getRhrStatus(latestVitals.resting_heart_rate);
  const hrvMeta = getHrvStatus(latestVitals.hrv_rmssd);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {syncToast && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>{syncToast}</span>
          </div>
          <button
            onClick={() => setSyncToast(null)}
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
          <Button size="xs" variant="outline" onClick={handleSyncTelemetry}>
            Retry
          </Button>
        </div>
      )}

      {/* Device Connection Ribbon */}
      <Card className="p-4 border-slate-200 bg-white shadow-gov-subtle">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center border border-slate-700 shadow-xs shrink-0">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {t('deviceStatusConnected')}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                BLE Tactical SmartBand V2 • Synced
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            {/* Battery Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              <BatteryCharging className="w-4 h-4 text-emerald-700" />
              <span>{batteryLevel}%</span>
            </div>

            {/* Sync Now Button (Mini-task 8.3.2) */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSyncTelemetry}
              disabled={isSyncing}
              leftIcon={RefreshCw}
              className={`font-bold text-xs ${isSyncing ? 'animate-pulse' : ''}`}
            >
              {isSyncing ? t('syncingTelemetry') : t('syncTelemetryBtn')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Mini-task 8.3.1: 3 Primary Biometric Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: Resting Heart Rate */}
        <Card className="p-5 border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-red-600" />
              {t('rhrLabel')}
            </span>
            <span className="text-[10px] font-mono text-slate-400">Live Vitals</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {latestVitals.resting_heart_rate}
            </span>
            <span className="text-xs font-bold text-slate-500">{t('rhrUnit')}</span>
          </div>

          {/* RHR Range Gauge */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: '40%' }} title="Normal (60-80)" />
              <div className="h-full bg-amber-400" style={{ width: '35%' }} title="Elevated (81-99)" />
              <div className="h-full bg-red-500" style={{ width: '25%' }} title="High (100+)" />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>60</span>
              <span>80</span>
              <span>100+ BPM</span>
            </div>
          </div>

          {/* Status Pill */}
          <div className={`p-2 rounded text-[11px] font-semibold border ${rhrMeta.color}`}>
            {rhrMeta.label}
          </div>
        </Card>

        {/* CARD 2: Heart Rate Variability (HRV) */}
        <Card className="p-5 border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-800" />
              {t('hrvLabel')}
            </span>
            <span className="text-[10px] font-mono text-slate-400">Autonomic Tone</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {latestVitals.hrv_rmssd.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">{t('hrvUnit')}</span>
          </div>

          {/* HRV Gauge */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-red-400" style={{ width: '30%' }} title="Depleted (<35)" />
              <div className="h-full bg-amber-400" style={{ width: '35%' }} title="Mild (35-50)" />
              <div className="h-full bg-emerald-500" style={{ width: '35%' }} title="Optimal (>50)" />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Low</span>
              <span>Moderate</span>
              <span>Optimal</span>
            </div>
          </div>

          {/* Status Pill */}
          <div className={`p-2 rounded text-[11px] font-semibold border ${hrvMeta.color}`}>
            {hrvMeta.label}
          </div>
        </Card>

        {/* CARD 3: Sleep Architecture & Deep Sleep */}
        <Card className="p-5 border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-slate-700" />
              {t('sleepDurationLabel')}
            </span>
            <span className="text-[10px] font-mono text-slate-400">Sleep Stages</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {latestVitals.sleep_duration_hours.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">hrs</span>
            <span className="text-xs text-slate-500">• Deep: <strong>{latestVitals.deep_sleep_pct.toFixed(0)}%</strong></span>
          </div>

          {/* Sleep Stages Breakdown Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-slate-900"
                style={{ width: `${latestVitals.deep_sleep_pct}%` }}
                title={`Deep Sleep (${latestVitals.deep_sleep_pct}%)`}
              />
              <div
                className="h-full bg-slate-500"
                style={{ width: '55%' }}
                title="Light Sleep (55%)"
              />
              <div
                className="h-full bg-slate-300"
                style={{ width: `${100 - latestVitals.deep_sleep_pct - 55}%` }}
                title="REM Stage"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="font-semibold text-slate-800">Deep ({latestVitals.deep_sleep_pct.toFixed(0)}%)</span>
              <span>Light (55%)</span>
              <span>REM</span>
            </div>
          </div>

          <div className="p-2 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            {latestVitals.sleep_duration_hours >= 6.5
              ? (lang === 'hi' ? 'पर्याप्त आराम व शारीरिक सुधार' : 'Sufficient Restorative Sleep')
              : (lang === 'hi' ? 'नींद की कमी • आराम की आवश्यकता' : 'Sleep Deficit Detected • Rest Advised')}
          </div>
        </Card>
      </div>

      {/* Autonomic Recovery Diagnosis Card */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('autonomicRecoveryLabel')}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                {latestVitals.autonomic_recovery_status}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('biomarkerIndexLabel')}
            </span>
            <span className="text-2xl font-black font-mono text-slate-900">
              {latestVitals.stress_biomarker_index?.toFixed(1) || '38.5'}
            </span>
          </div>
        </div>
      </Card>

      {/* Telemetry Stream History Table */}
      <Card className="border-slate-200 overflow-hidden shadow-gov-subtle">
        <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4 flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-800" />
            {t('telemetryHistoryTitle')}
          </CardTitle>
          <span className="text-[10px] font-mono text-slate-500">
            {historyList.length} Sessions Logged
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b">
                <tr>
                  <th className="py-2.5 px-4">{t('historyTimestamp')}</th>
                  <th className="py-2.5 px-4 text-center">{t('historyRHR')}</th>
                  <th className="py-2.5 px-4 text-center">{t('historyHRV')}</th>
                  <th className="py-2.5 px-4 text-center">{t('historySleep')}</th>
                  <th className="py-2.5 px-4 text-center">{t('historyDeepSleep')}</th>
                  <th className="py-2.5 px-4">{t('historyStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                      No historical telemetry logged yet. Click "Sync SmartBand Telemetry" to record initial vitals.
                    </td>
                  </tr>
                ) : (
                  historyList.slice(0, 7).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatMilitaryDate(item.timestamp)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                        {item.resting_heart_rate} BPM
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-900">
                        {item.hrv_rmssd.toFixed(1)} ms
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-800">
                        {item.sleep_duration_hours.toFixed(1)} h
                      </td>
                      <td className="py-2.5 px-4 text-center text-indigo-900">
                        {item.deep_sleep_pct.toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-4 font-sans text-[11px] text-slate-700">
                        {item.autonomic_recovery_status || 'Balanced Recovery'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SmartBandCard;
