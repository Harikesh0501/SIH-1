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
import { SafeAreaView } from 'react-native-safe-area-context';
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

  // Metrics
  const [moodScore, setMoodScore] = useState<number>(3);
  const [sleepHours, setSleepHours] = useState<number>(6.5);
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [physicalExhaustion, setPhysicalExhaustion] = useState<number>(2);
  const [mentalStress, setMentalStress] = useState<number>(2);

  // Optional PHQ-4 Screener (Collapsed by default to eliminate scrolling)
  const [showPhq4, setShowPhq4] = useState<boolean>(false);
  const [phq1, setPhq1] = useState<number>(0);
  const [phq2, setPhq2] = useState<number>(0);
  const [phq3, setPhq3] = useState<number>(0);
  const [phq4, setPhq4] = useState<number>(0);

  // Notes
  const [voluntaryNotes, setVoluntaryNotes] = useState<string>('');

  // States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const promptChips = lang === 'hi'
    ? ['गश्त से थकान', 'परिवार की चिंता', 'छुट्टी में विलंब', 'एकदम फिट']
    : ['Patrol fatigue', 'Family concern', 'Leave delay', 'Fully fit'];

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
        stress_score: Math.round(data.stress_score || 30),
        risk_level: data.risk_level || 'Resilient',
        is_crisis: !!data.is_crisis,
        message: lang === 'hi' ? (data.message_hi || data.recommendation) : (data.message_en || data.recommendation),
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.resultContainer}>
          <MonochromeCard highlight style={{ padding: 16 }}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIconWrap}>
                <Ionicons name="checkmark-done" size={20} color="#16A34A" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.resultTitle}>
                  {lang === 'hi' ? 'चेक-इन दर्ज हुआ' : 'CHECK-IN RECORDED'}
                </Text>
                <Text style={styles.resultSub}>
                  {result.is_offline ? 'OFFLINE QUEUED' : 'AI MODEL PREDICTION READY'}
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
              <Ionicons name="bulb-outline" size={15} color="#D97706" style={{ marginRight: 6, marginTop: 1 }} />
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
                  title={lang === 'hi' ? 'आगे बढ़ें' : 'PROCEED'}
                  variant="secondary"
                  onPress={onComplete}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </MonochromeCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Compact Viewport-Friendly Layout with Minimum Scrolling */}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Compact Header */}
        <View style={styles.topHeader}>
          <Text style={styles.screenTitle}>{lang === 'hi' ? '15-सेकंड दैनिक चेक-इन' : '15-SEC DAILY CHECK-IN'}</Text>
          <MonochromeBadge label="APAR ISOLATED" variant="gold" />
        </View>

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* 1. Mood Rating */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{lang === 'hi' ? '1. मूड स्कोर' : '1. CURRENT MOOD'}</Text>
          <StepSelector
            value={moodScore}
            onChange={setMoodScore}
            min={1}
            max={5}
            labels={{
              1: lang === 'hi' ? 'उदास' : 'Low',
              3: lang === 'hi' ? 'सामान्य' : 'Normal',
              5: lang === 'hi' ? 'सर्वश्रेष्ठ' : 'Peak Spirit',
            }}
          />
        </View>

        {/* 2. Sleep Hours Stepper + Sleep Quality (Side by Side Row) */}
        <View style={styles.dualCardRow}>
          {/* Sleep Hours Stepper */}
          <View style={[styles.metricCard, { flex: 1 }]}>
            <Text style={styles.metricLabel}>{lang === 'hi' ? '2. नींद (घंटे)' : '2. SLEEP (HRS)'}</Text>
            <View style={styles.stepperWrap}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => adjustSleep(-0.5)} style={styles.stepBtn}>
                <Ionicons name="remove" size={16} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{sleepHours.toFixed(1)}h</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => adjustSleep(0.5)} style={styles.stepBtn}>
                <Ionicons name="add" size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sleep Quality */}
          <View style={[styles.metricCard, { flex: 1 }]}>
            <Text style={styles.metricLabel}>{lang === 'hi' ? '3. नींद की गुणवत्ता' : '3. SLEEP QUALITY'}</Text>
            <StepSelector
              value={sleepQuality}
              onChange={setSleepQuality}
              min={1}
              max={5}
            />
          </View>
        </View>

        {/* 3. Physical Fatigue & Mental Strain (Side by Side Row) */}
        <View style={styles.dualCardRow}>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <Text style={styles.metricLabel}>{lang === 'hi' ? '4. शारीरिक थकान' : '4. EXHAUSTION'}</Text>
            <StepSelector
              value={physicalExhaustion}
              onChange={setPhysicalExhaustion}
              min={1}
              max={5}
            />
          </View>

          <View style={[styles.metricCard, { flex: 1 }]}>
            <Text style={styles.metricLabel}>{lang === 'hi' ? '5. मानसिक तनाव' : '5. STRESS'}</Text>
            <StepSelector
              value={mentalStress}
              onChange={setMentalStress}
              min={1}
              max={5}
            />
          </View>
        </View>

        {/* 4. Quick Field Notes (Single Line + Chips) */}
        <View style={styles.metricCard}>
          <View style={styles.notesHeader}>
            <Text style={styles.metricLabel}>{lang === 'hi' ? '6. गोपनीय नोट्स (वैकल्पिक)' : '6. NOTES (OPTIONAL)'}</Text>
          </View>

          <View style={styles.chipsRow}>
            {promptChips.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                style={styles.chip}
                onPress={() => setVoluntaryNotes((p) => p ? `${p}, ${chip}` : chip)}
              >
                <Text style={styles.chipText}>+{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.compactInput}
            placeholder={lang === 'hi' ? 'कोई भी विचार दर्ज करें...' : 'Type thoughts (patrol, family, leave)...'}
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
            <Ionicons name="clipboard-outline" size={14} color="#0F172A" style={{ marginRight: 6 }} />
            <Text style={styles.phqToggleText}>
              {lang === 'hi' ? '4-प्रश्नीय स्वास्थ्य जांच (वैकल्पिक)' : '4-Question Screener (Optional)'}
            </Text>
          </View>
          <Ionicons name={showPhq4 ? 'chevron-up' : 'chevron-down'} size={14} color="#64748B" />
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

        {/* Direct Submit Button */}
        <MonochromeButton
          title={submitting ? (lang === 'hi' ? 'विश्लेषण जारी...' : 'CALCULATING...') : (lang === 'hi' ? 'चेक-इन दर्ज करें' : 'SUBMIT CHECK-IN')}
          variant="solid"
          disabled={submitting}
          onPress={handleSubmit}
          icon={submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />}
          style={{ marginTop: 6 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 12,
    paddingBottom: 24,
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
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 4,
    height: 44,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  compactInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    color: '#0F172A',
  },
  phqToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
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
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  phqQText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
    marginBottom: 2,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 10,
    fontWeight: '600',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  resultSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  tierBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  scoreNum: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  scoreOutOf: {
    fontSize: 11,
    color: '#94A3B8',
  },
  criticalText: {
    color: '#DC2626',
  },
  moderateText: {
    color: '#D97706',
  },
  tierPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  tierPillText: {
    fontSize: 10,
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
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  adviceText: {
    fontSize: 10,
    color: '#92400E',
    flex: 1,
    lineHeight: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
