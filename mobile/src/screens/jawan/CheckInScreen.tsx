import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { MonochromeButton, MonochromeBadge, MonochromeCard, StepSelector } from '../../components/common';
import { apiClient } from '../../api/client';
import { saveCheckInLocally, getFieldTrenchMode } from '../../storage/offlineStorage';
import { getIstIsoString } from '../../utils/time';

interface CheckInResult {
  stress_score: number;
  risk_level: string;
  is_crisis: boolean;
  message: string;
  is_offline: boolean;
}

export const CheckInScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { user, t, lang } = useAuth();

  // The 6 Telemetry Metrics (Required by ML Stress Model)
  const [moodScore, setMoodScore] = useState<number>(3);
  const [sleepHours, setSleepHours] = useState<number>(6.5);
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [physicalExhaustion, setPhysicalExhaustion] = useState<number>(2);
  const [mentalStress, setMentalStress] = useState<number>(2);
  const [voluntaryNotes, setVoluntaryNotes] = useState<string>('');

  // Optional PHQ-4 Screener (Collapsed by default)
  const [showPhq4, setShowPhq4] = useState<boolean>(false);
  const [phq1, setPhq1] = useState<number>(0);
  const [phq2, setPhq2] = useState<number>(0);
  const [phq3, setPhq3] = useState<number>(0);
  const [phq4, setPhq4] = useState<number>(0);

  // Status
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mood options (Symbols + 1-word label)
  const moodOptions = [
    { score: 1, icon: 'sad-outline' as const, emoji: '😞', label: lang === 'hi' ? 'उदास' : 'Low' },
    { score: 2, icon: 'remove-circle-outline' as const, emoji: '😐', label: lang === 'hi' ? 'थका' : 'Tired' },
    { score: 3, icon: 'happy-outline' as const, emoji: '🙂', label: lang === 'hi' ? 'सामान्य' : 'Normal' },
    { score: 4, icon: 'sunny-outline' as const, emoji: '😊', label: lang === 'hi' ? 'अच्छा' : 'Good' },
    { score: 5, icon: 'flash-outline' as const, emoji: '⚡', label: lang === 'hi' ? 'जोशीला' : 'Peak' },
  ];

  // Sleep Quality labels
  const sleepQualityLabels = [
    lang === 'hi' ? 'अशांत' : 'Restless',
    lang === 'hi' ? 'खंडित' : 'Broken',
    lang === 'hi' ? 'औसत' : 'Fair',
    lang === 'hi' ? 'गहरी' : 'Sound',
    lang === 'hi' ? 'सर्वश्रेष्ठ' : 'Deep Rest',
  ];

  // Physical Exhaustion (Energy Battery) labels
  const exhaustionLevels = [
    { level: 1, label: lang === 'hi' ? 'तरोताजा' : 'Fresh', color: '#16A34A', icon: 'battery-full' as const },
    { level: 2, label: lang === 'hi' ? 'हल्की थकान' : 'Mild', color: '#22C55E', icon: 'battery-half' as const },
    { level: 3, label: lang === 'hi' ? 'मध्यम' : 'Moderate', color: '#D97706', icon: 'battery-half' as const },
    { level: 4, label: lang === 'hi' ? 'भारी थकान' : 'Heavy', color: '#EA580C', icon: 'battery-dead' as const },
    { level: 5, label: lang === 'hi' ? 'अत्यधिक' : 'Exhausted', color: '#DC2626', icon: 'battery-dead' as const },
  ];

  // Mental Stress labels
  const stressLevels = [
    { level: 1, label: lang === 'hi' ? 'शांत' : 'Calm', color: '#16A34A' },
    { level: 2, levelLabel: '2', label: lang === 'hi' ? 'सजग' : 'Alert', color: '#22C55E' },
    { level: 3, levelLabel: '3', label: lang === 'hi' ? 'दबाव' : 'Tense', color: '#D97706' },
    { level: 4, levelLabel: '4', label: lang === 'hi' ? 'उच्च तनाव' : 'High Strain', color: '#EA580C' },
    { level: 5, levelLabel: '5', label: lang === 'hi' ? 'गंभीर' : 'Acute', color: '#DC2626' },
  ];

  const quickSleepPresets = [4, 5.5, 6.5, 7.5, 8.5];

  const promptChips = lang === 'hi'
    ? ['रात की गश्त', 'परिवार की चिंता', 'छुट्टी में विलंब', 'पूर्ण स्वस्थ']
    : ['Night Patrol', 'Family Concern', 'Leave Delay', 'Fully Fit'];

  const adjustSleep = (delta: number) => {
    setSleepHours((prev) => {
      const updated = Math.round((prev + delta) * 10) / 10;
      return Math.min(12, Math.max(2, updated));
    });
  };

  const calculatePhq4Total = () => phq1 + phq2 + phq3 + phq4;

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      mood_score: moodScore,
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      physical_exhaustion: physicalExhaustion,
      mental_stress_rating: mentalStress,
      phq4_score: calculatePhq4Total(),
      voluntary_notes: voluntaryNotes.trim(),
      is_offline_synced: false,
    };

    try {
      const isTrench = await getFieldTrenchMode();
      if (isTrench) {
        throw new Error('SIMULATED_TRENCH_AIRGAP');
      }

      // Real-time backend submission with ML model prediction
      const res = await apiClient.post('/api/jawan/check-in', payload);
      const data = res.data;

      setResult({
        stress_score: Math.round(data.stress_score ?? 30),
        risk_level: data.risk_level || 'Resilient',
        is_crisis: !!(data.crisis_detected ?? data.is_crisis),
        message: lang === 'hi'
          ? (data.resilience_message_hi || data.message_hi || data.recommendation || 'चेक-इन सफलतापूर्वक दर्ज हुआ।')
          : (data.resilience_message_en || data.message_en || data.recommendation || 'Check-in successfully recorded.'),
        is_offline: false,
      });
    } catch (apiError: any) {
      console.log('Trench or offline event, saving to local SQLite queue:', apiError?.message);
      try {
        await saveCheckInLocally({
          mood_score: moodScore,
          sleep_hours: sleepHours,
          sleep_quality: sleepQuality,
          physical_exhaustion: physicalExhaustion,
          mental_stress_rating: mentalStress,
          phq4_score: calculatePhq4Total(),
          voluntary_notes: voluntaryNotes.trim(),
          created_at: getIstIsoString(),
        });

        // Predictive offline estimate
        const estimatedScore = Math.min(
          95,
          Math.max(
            15,
            Math.round(
              (6 - moodScore) * 12 +
              (physicalExhaustion * 8) +
              (mentalStress * 10) +
              (calculatePhq4Total() * 3) +
              (sleepHours < 5 ? 15 : 0)
            )
          )
        );

        let offlineTier = 'Resilient';
        if (estimatedScore >= 70) offlineTier = 'Critical Strain';
        else if (estimatedScore >= 45) offlineTier = 'Moderate Strain';

        setResult({
          stress_score: estimatedScore,
          risk_level: offlineTier,
          is_crisis: false,
          message: lang === 'hi'
            ? 'स्थानीय स्टोरेज में सुरक्षित। नेटवर्क मिलने पर रियल-टाइम सिंक होगा।'
            : 'Saved locally in SQLite queue. Will sync in real time when online.',
          is_offline: true,
        });
      } catch (dbErr: any) {
        setErrorMsg('Storage error: ' + dbErr?.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setMoodScore(3);
    setSleepHours(6.5);
    setSleepQuality(3);
    setPhysicalExhaustion(2);
    setMentalStress(2);
    setVoluntaryNotes('');
  };

  // Immediate Result Card
  if (result) {
    const isCritical = result.risk_level.toLowerCase().includes('critical') || result.stress_score >= 70;
    const isModerate = result.risk_level.toLowerCase().includes('moderate') || (result.stress_score >= 45 && result.stress_score < 70);

    return (
      <View style={styles.safeArea}>
        <View style={styles.resultContainer}>
          <MonochromeCard highlight style={{ padding: 18 }}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIconWrap}>
                <Ionicons name="checkmark-done" size={22} color="#16A34A" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.resultTitle}>
                  {lang === 'hi' ? 'दैनिक चेक-इन दर्ज' : 'CHECK-IN RECORDED'}
                </Text>
                <Text style={styles.resultSub}>
                  {result.is_offline ? 'OFFLINE QUEUE SYNC READY' : 'AI MODEL PREDICTION READY'}
                </Text>
              </View>
            </View>

            {/* Score & Tier Gauge */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>{lang === 'hi' ? 'तनाव स्कोर' : 'STRESS SCORE'}</Text>
                <Text style={[styles.scoreNum, isCritical && styles.criticalText, isModerate && styles.moderateText]}>
                  {result.stress_score}
                  <Text style={styles.scoreOutOf}>/100</Text>
                </Text>
              </View>

              <View style={styles.tierBox}>
                <Text style={styles.scoreLabel}>{lang === 'hi' ? 'जोखिम श्रेणी' : 'RISK TIER'}</Text>
                <View style={[styles.tierPill, isCritical && styles.tierCritical, isModerate && styles.tierModerate]}>
                  <Text style={[styles.tierPillText, isCritical && styles.criticalText, isModerate && styles.moderateText]}>
                    {result.risk_level.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Advice */}
            <View style={styles.adviceBox}>
              <Ionicons name="bulb-outline" size={18} color="#D97706" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.adviceText}>{result.message}</Text>
            </View>

            <View style={styles.btnRow}>
              <MonochromeButton
                title={lang === 'hi' ? 'नया चेक-इन' : 'NEW CHECK-IN'}
                variant="solid"
                onPress={resetForm}
                style={{ flex: 1 }}
              />
              {onComplete && (
                <MonochromeButton
                  title={lang === 'hi' ? 'AI साथी से बात करें' : 'TALK TO SATHI'}
                  variant="secondary"
                  onPress={onComplete}
                  icon={<Ionicons name="chatbubbles" size={14} color="#0F172A" />}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </MonochromeCard>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Clean Header Bar */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.screenTitle}>
              {lang === 'hi' ? 'दैनिक 15-सेकंड चेक-इन' : 'DAILY 15-SEC CHECK-IN'}
            </Text>
            <Text style={styles.screenSubtitle}>
              {lang === 'hi' ? 'गोपनीय • APAR से पूर्णतः अलग' : 'Confidential • Isolated from APAR'}
            </Text>
          </View>
          <MonochromeBadge label="APAR ISOLATED" variant="gold" />
        </View>

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* 1. MOOD - 5 Expressive Symbol Buttons */}
        <View style={styles.symbolCard}>
          <Text style={styles.cardSectionLabel}>
            {lang === 'hi' ? '1. वर्तमान मनोदशा (मूड)' : '1. CURRENT MOOD'}
          </Text>
          <View style={styles.moodRow}>
            {moodOptions.map((opt) => {
              const active = moodScore === opt.score;
              return (
                <TouchableOpacity
                  key={opt.score}
                  activeOpacity={0.7}
                  onPress={() => setMoodScore(opt.score)}
                  style={[styles.moodBtn, active && styles.moodBtnActive]}
                >
                  <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.moodLabelText, active && styles.moodLabelTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2 & 3. SLEEP HOURS & SLEEP QUALITY (Side by Side Row) */}
        <View style={styles.dualCardRow}>
          {/* 2. Sleep Hours Stepper + Quick Chips */}
          <View style={[styles.symbolCard, { flex: 1.1 }]}>
            <Text style={styles.cardSectionLabel}>
              {lang === 'hi' ? '2. नींद (घंटे)' : '2. SLEEP DURATION'}
            </Text>
            <View style={styles.stepperWrap}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => adjustSleep(-0.5)} style={styles.stepBtn}>
                <Ionicons name="remove" size={18} color="#0F172A" />
              </TouchableOpacity>
              <View style={styles.sleepNumberWrap}>
                <Ionicons name="moon" size={14} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.stepperVal}>{sleepHours.toFixed(1)}</Text>
                <Text style={styles.stepperUnit}>h</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => adjustSleep(0.5)} style={styles.stepBtn}>
                <Ionicons name="add" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Quick sleep presets */}
            <View style={styles.presetRow}>
              {quickSleepPresets.map((val) => (
                <TouchableOpacity
                  key={val}
                  activeOpacity={0.7}
                  onPress={() => setSleepHours(val)}
                  style={[styles.presetChip, sleepHours === val && styles.presetChipActive]}
                >
                  <Text style={[styles.presetChipText, sleepHours === val && styles.presetChipTextActive]}>
                    {val}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 3. Sleep Quality (5 Star Rating) */}
          <View style={[styles.symbolCard, { flex: 1 }]}>
            <Text style={styles.cardSectionLabel}>
              {lang === 'hi' ? '3. नींद गुणवत्ता' : '3. SLEEP QUALITY'}
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((starVal) => {
                const filled = sleepQuality >= starVal;
                return (
                  <TouchableOpacity
                    key={starVal}
                    activeOpacity={0.7}
                    onPress={() => setSleepQuality(starVal)}
                    style={styles.starTouch}
                  >
                    <Ionicons
                      name={filled ? 'star' : 'star-outline'}
                      size={20}
                      color={filled ? '#D97706' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.qualitySubText}>
              {sleepQualityLabels[sleepQuality - 1]}
            </Text>
          </View>
        </View>

        {/* 4. PHYSICAL EXHAUSTION (Battery Levels) */}
        <View style={styles.symbolCard}>
          <View style={styles.labelWithSub}>
            <Text style={styles.cardSectionLabel}>
              {lang === 'hi' ? '4. शारीरिक थकान स्तर' : '4. PHYSICAL EXHAUSTION'}
            </Text>
            <Text style={styles.selectedLevelBadge}>
              {exhaustionLevels[physicalExhaustion - 1].label}
            </Text>
          </View>

          <View style={styles.gaugeLevelsRow}>
            {exhaustionLevels.map((item) => {
              const active = physicalExhaustion === item.level;
              return (
                <TouchableOpacity
                  key={item.level}
                  activeOpacity={0.7}
                  onPress={() => setPhysicalExhaustion(item.level)}
                  style={[
                    styles.gaugeLevelBtn,
                    active && { borderColor: item.color, backgroundColor: '#F8FAFC' },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={active ? item.color : '#94A3B8'}
                  />
                  <Text style={[styles.gaugeNum, active && { color: item.color, fontWeight: '800' }]}>
                    {item.level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. MENTAL STRESS / STRAIN (Pulse Levels) */}
        <View style={styles.symbolCard}>
          <View style={styles.labelWithSub}>
            <Text style={styles.cardSectionLabel}>
              {lang === 'hi' ? '5. मानसिक तनाव' : '5. MENTAL STRAIN'}
            </Text>
            <Text style={[styles.selectedLevelBadge, { color: stressLevels[mentalStress - 1].color }]}>
              {stressLevels[mentalStress - 1].label}
            </Text>
          </View>

          <View style={styles.gaugeLevelsRow}>
            {stressLevels.map((item) => {
              const active = mentalStress === item.level;
              return (
                <TouchableOpacity
                  key={item.level}
                  activeOpacity={0.7}
                  onPress={() => setMentalStress(item.level)}
                  style={[
                    styles.gaugeLevelBtn,
                    active && { borderColor: item.color, backgroundColor: '#F8FAFC' },
                  ]}
                >
                  <Ionicons
                    name="pulse"
                    size={18}
                    color={active ? item.color : '#94A3B8'}
                  />
                  <Text style={[styles.gaugeNum, active && { color: item.color, fontWeight: '800' }]}>
                    {item.level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. VOLUNTARY NOTES (Quick Tap Chips + Compact Field) */}
        <View style={styles.symbolCard}>
          <Text style={styles.cardSectionLabel}>
            {lang === 'hi' ? '6. गोपनीय नोट्स (वैकल्पिक)' : '6. CONFIDENTIAL NOTES (OPTIONAL)'}
          </Text>

          <View style={styles.chipsRow}>
            {promptChips.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                style={styles.chip}
                onPress={() => setVoluntaryNotes((p) => (p ? `${p}, ${chip}` : chip))}
              >
                <Text style={styles.chipText}>+{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.compactInput}
            placeholder={
              lang === 'hi'
                ? 'कोई भी विचार साझा करें (गश्त, परिवार, स्वास्थ्य)...'
                : 'Share thoughts (patrol, family, duty)...'
            }
            placeholderTextColor="#94A3B8"
            value={voluntaryNotes}
            onChangeText={setVoluntaryNotes}
          />
        </View>

        {/* Optional Collapsed PHQ-4 Screener */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowPhq4(!showPhq4)}
          style={styles.phqToggleRow}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="clipboard-outline" size={15} color="#0F172A" style={{ marginRight: 6 }} />
            <Text style={styles.phqToggleText}>
              {lang === 'hi' ? '4-प्रश्नीय विस्तृत स्वास्थ्य जांच (वैकल्पिक)' : '4-Question Clinical Screener (Optional)'}
            </Text>
          </View>
          <Ionicons name={showPhq4 ? 'chevron-up' : 'chevron-down'} size={15} color="#64748B" />
        </TouchableOpacity>

        {showPhq4 && (
          <View style={styles.phqBox}>
            <Text style={styles.phqQText}>1. {t('phqQ1')}</Text>
            <StepSelector value={phq1} onChange={setPhq1} min={0} max={3} />
            <Text style={styles.phqQText}>2. {t('phqQ2')}</Text>
            <StepSelector value={phq2} onChange={setPhq2} min={0} max={3} />
            <Text style={styles.phqQText}>3. {t('phqQ3')}</Text>
            <StepSelector value={phq3} onChange={setPhq3} min={0} max={3} />
            <Text style={styles.phqQText}>4. {t('phqQ4')}</Text>
            <StepSelector value={phq4} onChange={setPhq4} min={0} max={3} />
          </View>
        )}

        {/* Direct Action Submit Button */}
        <MonochromeButton
          title={
            submitting
              ? (lang === 'hi' ? 'विश्लेषण जारी...' : 'CALCULATING STRESS TELEMETRY...')
              : (lang === 'hi' ? 'चेक-इन दर्ज करें' : 'SUBMIT DAILY CHECK-IN')
          }
          variant="solid"
          disabled={submitting}
          onPress={handleSubmit}
          icon={
            submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
            )
          }
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 14,
    paddingBottom: 28,
  },
  resultContainer: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  screenSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  symbolCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  labelWithSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedLevelBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  moodBtnActive: {
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  moodLabelTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 4,
    height: 44,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepNumberWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stepperVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  stepperUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 2,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 4,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  presetChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  starTouch: {
    padding: 4,
  },
  qualitySubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  gaugeLevelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  gaugeLevelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  gaugeNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  compactInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  phqToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  phqToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  phqBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  phqQText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 6,
    marginBottom: 4,
  },
  submitBtn: {
    marginTop: 8,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '600',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  resultSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  tierBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  scoreNum: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  scoreOutOf: {
    fontSize: 12,
    color: '#94A3B8',
  },
  criticalText: {
    color: '#DC2626',
  },
  moderateText: {
    color: '#D97706',
  },
  tierPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  tierPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#166534',
  },
  tierCritical: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  tierModerate: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  adviceBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  adviceText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

