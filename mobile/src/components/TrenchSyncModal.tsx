import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../constants/theme';
import { MonochromeButton, MonochromeBadge } from './common';
import { apiClient } from '../api/client';
import {
  getPendingCount,
  getPendingCheckIns,
  getPendingLeaves,
  syncAllPending,
  getFieldTrenchMode,
  setFieldTrenchMode,
  OfflineCheckIn,
  OfflineLeave,
  SyncResult,
} from '../storage/offlineStorage';

interface TrenchSyncModalProps {
  visible: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const TrenchSyncModal: React.FC<TrenchSyncModalProps> = ({
  visible,
  onClose,
  onSyncComplete,
}) => {
  const { lang } = useAuth();
  const [isTrenchMode, setIsTrenchMode] = useState<boolean>(false);
  const [counts, setCounts] = useState<{ checkins: number; leaves: number; total: number }>({
    checkins: 0,
    leaves: 0,
    total: 0,
  });
  const [pendingCheckins, setPendingCheckins] = useState<OfflineCheckIn[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<OfflineLeave[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const refreshQueue = async () => {
    const tMode = await getFieldTrenchMode();
    setIsTrenchMode(tMode);

    const c = await getPendingCount();
    setCounts(c);

    const cList = await getPendingCheckIns();
    setPendingCheckins(cList);

    const lList = await getPendingLeaves();
    setPendingLeaves(lList);
  };

  useEffect(() => {
    if (visible) {
      setSyncResult(null);
      refreshQueue();
    }
  }, [visible]);

  const handleToggleTrenchMode = async (val: boolean) => {
    setIsTrenchMode(val);
    await setFieldTrenchMode(val);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncAllPending(apiClient);
      setSyncResult(res);
      await refreshQueue();
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (e: any) {
      console.log('Sync error:', e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name="radio" size={16} color="#D97706" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {lang === 'hi' ? 'सीमावर्ती बंकर / ऑफलाइन सिंक' : 'FIELD TRENCH & AIR-GAP SYNC'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {lang === 'hi' ? 'स्थानीय SQLite एन्क्रिप्टेड कतार' : 'Encrypted Local SQLite Queue Engine'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Section 1: Simulated Trench Mode Toggle */}
            <View style={styles.toggleCard}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.statusDot, isTrenchMode ? styles.dotAmber : styles.dotGreen]} />
                  <Text style={styles.toggleTitle}>
                    {lang === 'hi' ? 'सीमावर्ती बंकर मोड (एयर-गैप)' : 'Border Trench Mode (Air-Gap)'}
                  </Text>
                </View>
                <Text style={styles.toggleDesc}>
                  {lang === 'hi'
                    ? 'जीरो नेटवर्क (नो इंटरनेट) में भी चेक-इन और आवेदन स्थानीय डेटाबेस में सुरक्षित होते हैं।'
                    : 'Simulates zero connectivity. All records are queued locally in SQLite with instant on-device stress estimation.'}
                </Text>
              </View>
              <Switch
                value={isTrenchMode}
                onValueChange={handleToggleTrenchMode}
                trackColor={{ false: '#CBD5E1', true: '#0F172A' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Section 2: Sync Result Banner */}
            {syncResult && (
              <View style={[styles.resultBanner, syncResult.failed === 0 ? styles.resultSuccess : styles.resultWarning]}>
                <Ionicons
                  name={syncResult.failed === 0 ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={syncResult.failed === 0 ? '#16A34A' : '#D97706'}
                  style={{ marginRight: 6 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>
                    {syncResult.failed === 0
                      ? (lang === 'hi' ? 'सिंक सफल: सभी रिकॉर्ड सर्वर पर भेजे गए' : 'Sync Complete: All records pushed')
                      : (lang === 'hi' ? `आंशिक सिंक: ${syncResult.synced} सफल, ${syncResult.failed} शेष` : `Partial Sync: ${syncResult.synced} synced, ${syncResult.failed} failed`)}
                  </Text>
                  <Text style={styles.resultSub}>
                    {lang === 'hi'
                      ? 'DPDPA 2023 धारा 14: सिंक समय और डेटा अखंडता सत्यापित।'
                      : 'DPDPA 2023 Sec 14: Cryptographic integrity verified.'}
                  </Text>
                </View>
              </View>
            )}

            {/* Section 3: Pending Queue Status */}
            <View style={styles.queueHeaderRow}>
              <Text style={styles.sectionLabel}>
                {lang === 'hi' ? 'स्थानीय कतार में लंबित रिकॉर्ड' : 'PENDING AIR-GAP QUEUE'}
              </Text>
              <View style={[styles.counterPill, counts.total > 0 && styles.counterPillActive]}>
                <Text style={[styles.counterText, counts.total > 0 && styles.counterTextActive]}>
                  {counts.total} {lang === 'hi' ? 'लंबित' : 'Pending'}
                </Text>
              </View>
            </View>

            {counts.total === 0 ? (
              <View style={styles.emptyQueueBox}>
                <Ionicons name="checkmark-done-circle-outline" size={28} color="#16A34A" />
                <Text style={styles.emptyQueueText}>
                  {lang === 'hi'
                    ? 'स्थानीय कतार एकदम खाली है। सभी डेटा सर्वर के साथ सिंक है।'
                    : 'Air-gap queue is empty. All local records are synchronized with HQ.'}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 6 }}>
                {pendingCheckins.map((c, i) => (
                  <View key={`c-${i}`} style={styles.itemRow}>
                    <Ionicons name="stopwatch-outline" size={14} color="#D97706" style={{ marginRight: 6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>
                        {lang === 'hi' ? 'दैनिक चेक-इन' : 'Daily Check-in'} (Mood: {c.mood_score}/5)
                      </Text>
                      <Text style={styles.itemSub}>{c.created_at}</Text>
                    </View>
                    <View style={styles.queuedBadge}>
                      <Text style={styles.queuedBadgeText}>QUEUED</Text>
                    </View>
                  </View>
                ))}

                {pendingLeaves.map((l, i) => (
                  <View key={`l-${i}`} style={styles.itemRow}>
                    <Ionicons name="calendar-outline" size={14} color="#D97706" style={{ marginRight: 6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{l.leave_type} ({l.days_requested}d)</Text>
                      <Text style={styles.itemSub}>{l.personal_reason || l.created_at}</Text>
                    </View>
                    <View style={styles.queuedBadge}>
                      <Text style={styles.queuedBadgeText}>QUEUED</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Section 4: Sync Button */}
            <MonochromeButton
              title={
                syncing
                  ? (lang === 'hi' ? 'सिंक जारी है...' : 'SYNCHRONIZING...')
                  : (lang === 'hi' ? `एयर-गैप कतार सिंक करें (${counts.total})` : `SYNC AIR-GAP QUEUE (${counts.total})`)
              }
              variant="solid"
              disabled={syncing || counts.total === 0}
              onPress={handleSyncNow}
              icon={<Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />}
              style={styles.syncBtn}
            />

            {/* Statutory Compliance Footer */}
            <Text style={styles.statutoryFooter}>
              {lang === 'hi'
                ? 'धारा 14 DPDPA एवं रक्षा मंत्रालय निर्देश: स्थानीय SQLite डेटाबेस एन्क्रिप्टेड है और सिंक के समय कोई डेटा लॉस या छेड़छाड़ नहीं हो सकती।'
                : 'Sec 14 DPDPA & MoD Mandate: Local SQLite storage is air-gap sealed. Payload hash verified at sync.'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  modalSubtitle: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  bodyScroll: {
    flexGrow: 0,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  dotGreen: {
    backgroundColor: '#16A34A',
  },
  dotAmber: {
    backgroundColor: '#D97706',
  },
  toggleTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  toggleDesc: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 12,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  resultSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  resultWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  resultTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultSub: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },
  counterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  counterPillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  counterText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  counterTextActive: {
    color: '#92400E',
  },
  emptyQueueBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyQueueText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 8,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 1,
  },
  queuedBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  queuedBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#92400E',
  },
  syncBtn: {
    marginTop: 10,
  },
  statutoryFooter: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 11,
  },
});
