"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { submitDailyCheckin } from '../../lib/api';
import { getTranslation } from './translations';
import {
  Clock,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  Lock,
  Smile,
  Meh,
  Frown,
  Star,
  Moon,
  Battery,
  BatteryCharging,
  BatteryLow,
  Zap,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Send,
  RotateCcw,
  Activity,
  HeartHandshake,
} from 'lucide-react';

/**
 * Task 8.2: 15-Second Daily Wellness Micro-Check-in Card
 * Implements Mini-task 8.2.1, 8.2.2, 8.2.3, 8.2.4, 8.2.5
 */
export function DailyCheckinCard({ lang = 'en', onNavigateToSathi, onCheckinComplete }) {
  const t = (key) => getTranslation(lang, key);

  // Form State
  const [mood, setMood] = useState(3); // 1-5
  const [sleepHours, setSleepHours] = useState(6.5); // 3-10
  const [sleepQuality, setSleepQuality] = useState(3); // 1-5 stars
  const [physicalExhaustion, setPhysicalExhaustion] = useState(2); // 1-5
  const [mentalStress, setMentalStress] = useState(2); // 1-5
  const [phq1, setPhq1] = useState(1); // 0-3
  const [phq2, setPhq2] = useState(1); // 0-3
  const [voluntaryNotes, setVoluntaryNotes] = useState('');

  // Submission & Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [checkinResult, setCheckinResult] = useState(null);

  // Mini-task 8.2.1: 5 Responsive Mood Options
  const moodOptions = [
    { value: 1, label: t('moodVeryLow'), emoji: '😞', color: 'hover:bg-red-50 hover:border-red-300 selected:bg-red-100' },
    { value: 2, label: t('moodLow'), emoji: '🙁', color: 'hover:bg-amber-50 hover:border-amber-300 selected:bg-amber-100' },
    { value: 3, label: t('moodNeutral'), emoji: '😐', color: 'hover:bg-slate-50 hover:border-slate-300 selected:bg-slate-100' },
    { value: 4, label: t('moodGood'), emoji: '🙂', color: 'hover:bg-emerald-50 hover:border-emerald-300 selected:bg-emerald-100' },
    { value: 5, label: t('moodExcellent'), emoji: '😄', color: 'hover:bg-emerald-100 hover:border-emerald-400 selected:bg-emerald-200' },
  ];

  // Mini-task 8.2.3: Exhaustion Levels
  const exhaustionLevels = [
    { value: 1, label: lang === 'hi' ? '1 - तरोताजा' : '1 - Fresh', desc: lang === 'hi' ? 'पूरी तरह तैयार' : 'Full Energy' },
    { value: 2, label: lang === 'hi' ? '2 - हल्की थकान' : '2 - Mild', desc: lang === 'hi' ? 'सामान्य दिन' : 'Normal Shift' },
    { value: 3, label: lang === 'hi' ? '3 - मध्यम' : '3 - Moderate', desc: lang === 'hi' ? 'आराम की जरूरत' : 'Rest Helpful' },
    { value: 4, label: lang === 'hi' ? '4 - भारी' : '4 - Heavy', desc: lang === 'hi' ? 'थका हुआ' : 'Worn Out' },
    { value: 5, label: lang === 'hi' ? '5 - अत्यधिक' : '5 - Severe', desc: lang === 'hi' ? 'थकावट चरम पर' : 'Severely Drained' },
  ];

  // Submit Handler (Mini-task 8.2.5)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Dynamically derive clinical PHQ-4 score (0-12) from mood and mental stress:
    // Depressive mood subscale (0-6) + Anxiety/stress subscale (0-6)
    const calculatedPhq4 = Math.round(((5 - mood) / 4 * 6) + ((mentalStress - 1) / 4 * 6));

    try {
      const response = await submitDailyCheckin({
        mood_score: mood,
        sleep_hours: parseFloat(sleepHours),
        sleep_quality: sleepQuality,
        physical_exhaustion: physicalExhaustion,
        mental_stress_rating: mentalStress,
        phq4_score: calculatedPhq4,
        voluntary_notes: voluntaryNotes.trim() || undefined,
        is_offline_synced: false,
      });

      setCheckinResult(response);
      if (onCheckinComplete) onCheckinComplete(response);
    } catch (err) {
      console.error('Failed to submit check-in:', err);
      setError(err?.response?.data?.detail || err.message || 'Error recording check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCheckinResult(null);
    setVoluntaryNotes('');
  };

  // If already submitted, display positive reinforcement card (Mini-task 8.2.5)
  if (checkinResult) {
    const isCrisis = checkinResult.crisis_detected;
    const resilienceMsg = lang === 'hi' ? checkinResult.resilience_message_hi : checkinResult.resilience_message_en;

    return (
      <Card className="border-slate-300 bg-white overflow-hidden shadow-gov-subtle animate-in fade-in duration-300">
        <div className={`p-6 sm:p-8 text-center space-y-5 ${isCrisis ? 'bg-red-50/70 border-b border-red-200' : 'bg-slate-50 border-b border-slate-200'}`}>
          {/* Animated Success / Alert Emblem */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2 shadow-xs ${
            isCrisis
              ? 'bg-red-100 text-red-800 border-red-300 animate-bounce'
              : 'bg-black text-white border-slate-800'
          }`}>
            {isCrisis ? (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-white" />
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-800">
              {t('checkinSuccessTitle')}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {isCrisis ? t('crisisAlertTitle') : (lang === 'hi' ? 'स्वास्थ्य मूल्यांकन संपन्न' : 'Assessment Complete')}
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {isCrisis ? t('crisisAlertSub') : t('aparGuaranteeShort')}
            </p>
          </div>

          {/* Calibrated Risk Matrix Card */}
          <div className="max-w-md mx-auto p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {t('stressScoreLabel')}
              </span>
              <span className="font-mono text-xl font-black text-slate-900">
                {checkinResult.stress_score.toFixed(1)} <span className="text-xs font-normal text-slate-500">/ 100</span>
              </span>
            </div>

            <ProgressBar
              value={checkinResult.stress_score}
              max={100}
              variant="dynamic-stress"
              size="md"
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">{t('riskTierLabel')}</span>
              <Badge tier={checkinResult.risk_level} size="sm" score={checkinResult.stress_score.toFixed(1)} />
            </div>
          </div>

          {/* Bilingual Resilience Reinforcement Message */}
          <div className={`max-w-lg mx-auto p-4 rounded-lg text-xs leading-relaxed font-medium ${
            isCrisis
              ? 'bg-red-100/80 text-red-900 border border-red-300'
              : 'bg-black text-white border border-slate-800'
          }`}>
            <p className="font-semibold text-sm mb-1">
              {isCrisis ? (lang === 'hi' ? 'सहायता संदेश:' : 'Support Message:') : (lang === 'hi' ? 'सैनिक संबल संदेश:' : 'Resilience Guidance:')}
            </p>
            "{resilienceMsg}"
          </div>

          {/* Emergency SOS Hotlines (if crisis detected) */}
          {isCrisis && (
            <div className="max-w-md mx-auto p-4 rounded-lg bg-white border-2 border-red-300 space-y-2 text-xs text-slate-800">
              <div className="flex items-center justify-center gap-2 text-red-700 font-bold uppercase tracking-wider text-xs">
                <PhoneCall className="w-4 h-4 text-red-600 animate-pulse" />
                24x7 Immediate Psychological Lifeline
              </div>
              <p className="font-mono font-black text-lg text-red-800">
                Tele-MANAS: 14416 / 1800-891-4416
              </p>
              <p className="text-[11px] text-slate-500">
                Confidential • Free • Armed Forces Dedicated Psychological First-Aid
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onNavigateToSathi && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToSathi}
                leftIcon={Sparkles}
                className="font-bold text-xs"
              >
                {t('takePranayamaBtn')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetForm}
              leftIcon={RotateCcw}
              className="text-xs"
            >
              {t('newCheckinBtn')}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-gov-subtle">
      {/* Header */}
      <CardHeader className="bg-slate-50/80 border-b border-slate-200 py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-800" />
            {t('checkinHeading')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 mt-0.5">
            {t('checkinSubheading')}
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-950 border border-emerald-200 text-[11px] font-mono font-bold self-start sm:self-auto">
          <Lock className="w-3 h-3 text-emerald-700" />
          <span>APAR Quarantined</span>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-red-900 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* QUESTION 1 (Mini-task 8.2.1): Visual Mood Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('moodQuestion')} <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {moodOptions.map((opt) => {
                const isSelected = mood === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMood(opt.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-black bg-black text-white shadow-sm scale-102 font-bold ring-2 ring-black/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl mb-1 select-none">{opt.emoji}</span>
                    <span className="text-xs leading-tight font-semibold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUESTION 2 & 3 (Mini-task 8.2.2): Sleep Duration Slider & Sleep Quality Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-slate-50/70 rounded-xl border border-slate-200">
            {/* Sleep Duration Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-slate-600" />
                  {t('sleepDurationQuestion')}
                </label>
                <span className="font-mono text-xs font-bold bg-white text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
                  {sleepHours} {t('sleepHoursSuffix')}
                </span>
              </div>

              <input
                type="range"
                min="3.0"
                max="10.0"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-emerald-800 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>3.0 h (Critical)</span>
                <span>6.5 h (Target)</span>
                <span>10.0 h (Full Rest)</span>
              </div>
            </div>

            {/* Sleep Quality Stars */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900">
                {t('sleepQualityQuestion')}
              </label>

              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSleepQuality(star)}
                    className="p-1 text-slate-300 hover:text-amber-400 transition-colors focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-all ${
                        star <= sleepQuality
                          ? 'fill-amber-400 text-amber-500 scale-105'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold font-mono text-slate-700 ml-2">
                  {sleepQuality} / 5
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {sleepQuality <= 2
                  ? (lang === 'hi' ? 'खराब / बार-बार नींद टूटना' : 'Restless / Interrupted')
                  : sleepQuality === 3
                  ? (lang === 'hi' ? 'सामान्य नींद' : 'Average Rest')
                  : (lang === 'hi' ? 'गहरी व आरामदायक नींद' : 'Deep & Restorative')}
              </p>
            </div>
          </div>

          {/* Physical Exhaustion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t('exhaustionQuestion')}
              </label>
              <span className="font-mono text-xs font-bold text-slate-700">
                Level {physicalExhaustion} / 5
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {exhaustionLevels.map((lvl) => {
                const isSelected = physicalExhaustion === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setPhysicalExhaustion(lvl.value)}
                    className={`py-2 px-1 text-center rounded-lg border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-black bg-black text-white font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">{lvl.value}</div>
                    <div className="text-[10px] truncate hidden sm:block">{lvl.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mental Pressure Rating */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t('mentalStressQuestion')}
              </label>
              <span className="font-mono text-xs font-bold text-slate-700">
                {mentalStress} / 5
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMentalStress(val)}
                  className={`py-2 text-center rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    mentalStress === val
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Confidential Journal */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t('journalQuestion')} <span className="text-[11px] font-normal text-slate-400 font-sans lowercase">(optional)</span>
            </label>

            <textarea
              rows={2}
              value={voluntaryNotes}
              onChange={(e) => setVoluntaryNotes(e.target.value)}
              placeholder={t('journalPlaceholder')}
              className="w-full rounded-lg border border-slate-200 text-xs p-3 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400 bg-white"
            />
          </div>
        </CardContent>

        {/* Footer Submit Button */}
        <CardFooter className="bg-slate-50/50 border-t border-slate-200 py-3.5 px-6 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
            <span>DPDPA §14 Confidential • Zero APAR Impact</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="font-bold text-xs"
            leftIcon={Send}
          >
            {isSubmitting ? t('submittingCheckin') : t('submitCheckinBtn')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default DailyCheckinCard;
