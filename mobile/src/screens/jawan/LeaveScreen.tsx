import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import { MonochromeCard, MonochromeBadge, MonochromeButton } from '../../components/common';
import { apiClient } from '../../api/client';
import { saveLeaveLocally, getFieldTrenchMode } from '../../storage/offlineStorage';

interface LeaveItem {
  id: number;
  leave_type: string;
  days_requested: number;
  start_date: string;
  end_date: string;
  status: string;
  cancellation_reason?: string | null;
  personal_reason?: string | null;
}

export const LeaveScreen: React.FC = () => {
  const { user, lang } = useAuth();
  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('apply');

  // Form State
  const [leaveType, setLeaveType] = useState<string>('Casual Leave (CL)');
  const [daysRequested, setDaysRequested] = useState<number>(10);
  const [personalReason, setPersonalReason] = useState<string>('');
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [confidentialNotes, setConfidentialNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // History State
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Leave types configuration
  const leaveTypes = [
    { key: 'Casual Leave (CL)', labelHi: 'आकस्मिक अवकाश (CL)', labelEn: 'Casual Leave (CL)' },
    { key: 'Earned Leave (EL)', labelHi: 'अर्जित अवकाश (EL)', labelEn: 'Earned Leave (EL)' },
    { key: 'Mandatory 10-Day R&R Leave', labelHi: 'अनिवार्य R&R विश्राम', labelEn: '10-Day R&R Rest' },
    { key: 'Emergency Compassionate Leave', labelHi: 'आपातकालीन अनुकंपा', labelEn: 'Emergency Leave' },
    { key: 'Medical Convalescence', labelHi: 'चिकित्सा अवकाश', labelEn: 'Medical Leave' },
  ];

  // Quick reason chips
  const reasonChips = lang === 'hi'
    ? ['पारिवारिक आपातकाल', 'गंभीर मानसिक/शारीरिक थकान', 'माता-पिता की चिकित्सा', 'वार्षिक अवकाश कोटा']
    : ['Family emergency', 'Severe operational fatigue', 'Parental healthcare', 'Annual quota'];

  // Calculate start & end date strings
  const getDates = (days: number) => {
    const start = new Date();
    start.setDate(start.getDate() + 1); // Starts tomorrow
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { startDate: fmt(start), endDate: fmt(end) };
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get('/api/jawan/my-history');
      if (res.data?.leave_records) {
        setLeaves(res.data.leave_records);
      }
    } catch (err: any) {
      console.log('Error fetching leave history:', err?.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async () => {
    if (!personalReason.trim()) {
      setSubmitError(lang === 'hi' ? 'कृपया आवेदन का कारण लिखें' : 'Please provide a reason');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const { startDate, endDate } = getDates(daysRequested);

    const payload = {
      leave_type: leaveType,
      days_requested: daysRequested,
      start_date: startDate,
      end_date: endDate,
      personal_reason: personalReason.trim(),
      is_emergency_welfare_request: isEmergency,
      confidential_notes: confidentialNotes.trim() || undefined,
    };

    const isTrench = await getFieldTrenchMode();
    if (!isTrench) {
      try {
        const res = await apiClient.post('/api/jawan/leave-request', payload);
        setSubmitSuccess(
          lang === 'hi'
            ? `अवकाश आवेदन सफलतापूर्वक दर्ज हुआ (ID: #${res.data?.id || 'OK'})`
            : `Leave request registered successfully (Ref: #${res.data?.id || 'OK'})`
        );
        setPersonalReason('');
        setConfidentialNotes('');
        setIsEmergency(false);
        fetchHistory();
        setTimeout(() => {
          setSubmitSuccess(null);
          setActiveTab('history');
        }, 1500);
        return;
      } catch (err: any) {
        console.log('Online leave submission failed, saving to local SQLite queue:', err?.message);
      }
    }

    // Save to local offline SQLite queue (Trench Mode / No Internet)
    try {
      const offlineId = await saveLeaveLocally({
        leave_type: leaveType,
        days_requested: daysRequested,
        start_date: startDate,
        end_date: endDate,
        personal_reason: personalReason.trim(),
        is_emergency_welfare_request: isEmergency,
        confidential_notes: confidentialNotes.trim() || undefined,
        created_at: new Date().toISOString(),
      });
      setSubmitSuccess(
        lang === 'hi'
          ? `बंकर मोड: आवेदन स्थानीय SQLite में सुरक्षित हुआ (#${offlineId})`
          : `Trench Mode: Application queued in local SQLite (#${offlineId}). Will sync when online.`
      );
      setPersonalReason('');
      setConfidentialNotes('');
      setIsEmergency(false);
    } catch (dbErr: any) {
      setSubmitError('Offline storage error: ' + dbErr?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const { startDate, endDate } = getDates(daysRequested);

  return (
    <View style={styles.container}>
      {/* Tab Switcher: Apply vs Status */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('apply')}
          style={[styles.subTabBtn, activeTab === 'apply' && styles.subTabBtnActive]}
        >
          <Ionicons
            name="create-outline"
            size={13}
            color={activeTab === 'apply' ? '#0F172A' : '#64748B'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.subTabText, activeTab === 'apply' && styles.subTabTextActive]}>
            {lang === 'hi' ? 'नया आवेदन' : 'APPLY LEAVE'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveTab('history');
            fetchHistory();
          }}
          style={[styles.subTabBtn, activeTab === 'history' && styles.subTabBtnActive]}
        >
          <Ionicons
            name="time-outline"
            size={13}
            color={activeTab === 'history' ? '#0F172A' : '#64748B'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.subTabText, activeTab === 'history' && styles.subTabTextActive]}>
            {lang === 'hi' ? `स्थिति (${leaves.length})` : `STATUS (${leaves.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* VIEW 1: APPLY LEAVE & EMERGENCY GRIEVANCE */}
      {activeTab === 'apply' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MonochromeCard highlight style={styles.formCard}>
            {/* Header Shield */}
            <View style={styles.formHeader}>
              <View style={styles.headerIcon}>
                <Ionicons name="document-text" size={15} color="#D97706" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.formTitle}>
                  {lang === 'hi' ? 'गोपनीय अवकाश एवं चिकित्सा शिकायत' : 'CONFIDENTIAL LEAVE APPLICATION'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {lang === 'hi'
                    ? 'धारा 14 DPDPA: सेवा पुस्तिका (APAR) से 100% सुरक्षित एवं अलग'
                    : 'Sec 14 DPDPA 2023: Fully decoupled from APAR / service records'}
                </Text>
              </View>
            </View>

            {/* Success Banner */}
            {submitSuccess && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={15} color="#16A34A" style={{ marginRight: 6 }} />
                <Text style={styles.successBannerText}>{submitSuccess}</Text>
              </View>
            )}

            {/* Error Banner */}
            {submitError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={15} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </View>
            )}

            {/* 1. Leave Type Selector */}
            <Text style={styles.inputSectionLabel}>
              {lang === 'hi' ? 'अवकाश का प्रकार चुनें' : 'SELECT LEAVE TYPE'}
            </Text>
            <View style={styles.typePillRow}>
              {leaveTypes.map((lt) => {
                const isSelected = leaveType === lt.key;
                return (
                  <TouchableOpacity
                    key={lt.key}
                    activeOpacity={0.7}
                    onPress={() => setLeaveType(lt.key)}
                    style={[styles.typePill, isSelected && styles.typePillActive]}
                  >
                    <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                      {lang === 'hi' ? lt.labelHi : lt.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Days Stepper & Date Range */}
            <View style={styles.daysRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputSectionLabel}>
                  {lang === 'hi' ? 'अवधि (दिन)' : 'DURATION (DAYS)'}
                </Text>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setDaysRequested((p) => Math.max(1, p - 1))}
                    style={styles.stepperBtn}
                  >
                    <Ionicons name="remove" size={16} color="#0F172A" />
                  </TouchableOpacity>

                  <Text style={styles.stepperVal}>{daysRequested} {lang === 'hi' ? 'दिन' : 'Days'}</Text>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setDaysRequested((p) => Math.min(60, p + 1))}
                    style={styles.stepperBtn}
                  >
                    <Ionicons name="add" size={16} color="#0F172A" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dateRangeBox}>
                <Text style={styles.dateLabel}>{lang === 'hi' ? 'प्रस्तावित तिथि' : 'SCHEDULE'}</Text>
                <Text style={styles.dateVal}>{startDate}</Text>
                <Text style={styles.dateArrow}>↓ {daysRequested} days</Text>
                <Text style={styles.dateVal}>{endDate}</Text>
              </View>
            </View>

            {/* 3. Reason & Quick Chips */}
            <View style={{ marginTop: 8 }}>
              <Text style={styles.inputSectionLabel}>
                {lang === 'hi' ? 'आवेदन का कारण' : 'REASON FOR APPLICATION'}
              </Text>

              {/* Chips */}
              <View style={styles.chipRow}>
                {reasonChips.map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => setPersonalReason(chip)}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.reasonInput}
                placeholder={lang === 'hi' ? 'विस्तृत कारण या समस्या लिखें...' : 'State your reason or grievance...'}
                placeholderTextColor="#94A3B8"
                value={personalReason}
                onChangeText={setPersonalReason}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* 4. Emergency Welfare Grievance Toggle */}
            <View style={styles.emergencyBox}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="alert-circle" size={14} color="#D97706" style={{ marginRight: 5 }} />
                  <Text style={styles.emergencyTitle}>
                    {lang === 'hi' ? 'अति आवश्यक चिकित्सा/कल्याण शिकायत' : 'Urgent Welfare Grievance'}
                  </Text>
                </View>
                <Text style={styles.emergencySub}>
                  {lang === 'hi'
                    ? 'सीधे वेलफेयर ऑफिसर (Chief Medical Officer) को तत्काल प्राथमिकता से प्रेषित करें।'
                    : 'Dispatch directly to Welfare Officer queue with emergency priority status.'}
                </Text>
              </View>
              <Switch
                value={isEmergency}
                onValueChange={setIsEmergency}
                trackColor={{ false: '#CBD5E1', true: '#0F172A' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Submit Button */}
            <MonochromeButton
              title={
                submitting
                  ? (lang === 'hi' ? 'जमा हो रहा है...' : 'SUBMITTING...')
                  : (lang === 'hi' ? 'गोपनीय आवेदन जमा करें' : 'SUBMIT CONFIDENTIAL APPLICATION')
              }
              variant="solid"
              disabled={submitting}
              onPress={handleSubmit}
              icon={<Ionicons name="paper-plane" size={14} color="#FFFFFF" />}
              style={{ marginTop: 10 }}
            />
          </MonochromeCard>
        </ScrollView>
      ) : (
        /* VIEW 2: APPLICATION STATUS & HISTORY */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingHistory ? (
            <View style={styles.loadingHistoryWrap}>
              <ActivityIndicator size="small" color="#0F172A" />
              <Text style={styles.loadingLabel}>
                {lang === 'hi' ? 'आवेदन स्थिति लोड हो रही है...' : 'FETCHING APPLICATION STATUS...'}
              </Text>
            </View>
          ) : leaves.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="file-tray-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>
                {lang === 'hi' ? 'कोई पूर्व आवेदन नहीं मिला' : 'No previous leave applications'}
              </Text>
              <Text style={styles.emptySub}>
                {lang === 'hi'
                  ? 'ऊपर "नया आवेदन" टैब पर क्लिक करके छुट्टी के लिए आवेदन करें।'
                  : 'Tap "APPLY LEAVE" above to submit a new application.'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {leaves.map((item) => {
                const isApproved = item.status?.toLowerCase() === 'approved';
                const isPending = item.status?.toLowerCase() === 'pending';
                const isRejected = item.status?.toLowerCase() === 'rejected';

                return (
                  <View key={item.id} style={styles.historyCard}>
                    {/* Top Row: Type & Status Badge */}
                    <View style={styles.historyTop}>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text style={styles.historyType}>{item.leave_type}</Text>
                        <Text style={styles.historyDays}>
                          {item.days_requested} {lang === 'hi' ? 'दिन' : 'Days'} • {item.start_date} → {item.end_date}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          isApproved && styles.statusBadgeApproved,
                          isPending && styles.statusBadgePending,
                          isRejected && styles.statusBadgeRejected,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            isApproved && { backgroundColor: '#16A34A' },
                            isPending && { backgroundColor: '#D97706' },
                            isRejected && { backgroundColor: '#DC2626' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isApproved && styles.statusTextApproved,
                            isPending && styles.statusTextPending,
                            isRejected && styles.statusTextRejected,
                          ]}
                        >
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Reason Snippet */}
                    {item.personal_reason && (
                      <View style={styles.historyReasonBox}>
                        <Text style={styles.historyReasonLabel}>
                          {lang === 'hi' ? 'कारण:' : 'Reason:'}
                        </Text>
                        <Text style={styles.historyReasonVal}>{item.personal_reason}</Text>
                      </View>
                    )}

                    {/* Cancellation Note if any */}
                    {item.cancellation_reason && (
                      <View style={styles.historyCancelBox}>
                        <Ionicons name="information-circle" size={13} color="#DC2626" style={{ marginRight: 4 }} />
                        <Text style={styles.historyCancelText}>{item.cancellation_reason}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Refresh Action */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={fetchHistory}
            style={styles.refreshBtn}
          >
            <Ionicons name="refresh-outline" size={13} color="#0F172A" style={{ marginRight: 4 }} />
            <Text style={styles.refreshBtnText}>
              {lang === 'hi' ? 'स्थिति रीफ्रेश करें' : 'REFRESH STATUS'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  subTabBtnActive: {
    backgroundColor: '#0F172A',
  },
  subTabText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  subTabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  formCard: {
    padding: 12,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  formSubtitle: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  successBannerText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  inputSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  typePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  typePill: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  typePillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  typePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    height: 38,
  },
  stepperBtn: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  stepperVal: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateRangeBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 110,
  },
  dateLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  dateVal: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dateArrow: {
    fontSize: 8,
    color: '#D97706',
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 8,
    color: '#475569',
    fontWeight: '600',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    padding: 8,
    fontSize: 11,
    color: '#0F172A',
    minHeight: 48,
    textAlignVertical: 'top',
  },
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  emergencyTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  emergencySub: {
    fontSize: 8,
    color: '#B45309',
    marginTop: 1,
    lineHeight: 11,
  },
  loadingHistoryWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyType: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyDays: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeApproved: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusTextApproved: {
    color: '#166534',
  },
  statusTextPending: {
    color: '#92400E',
  },
  statusTextRejected: {
    color: '#991B1B',
  },
  historyReasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  historyReasonLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  historyReasonVal: {
    fontSize: 9,
    color: '#334155',
    marginTop: 1,
  },
  historyCancelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  historyCancelText: {
    fontSize: 8,
    color: '#DC2626',
    fontWeight: '600',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  refreshBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
});
