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
import { MonochromeButton } from './common';
import { apiClient } from '../api/client';
import {
  getPendingCount,
  getPendingCheckIns,
  getPendingLeaves,
  syncAllPending,
  clearOfflineQueue,
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
  const [clearing, setClearing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const refreshQueue = async () => {
    try {
      const tMode = await getFieldTrenchMode();
      setIsTrenchMode(tMode);

      const c = await getPendingCount();
      setCounts(c);

      const cList = await getPendingCheckIns();
      setPendingCheckins(cList);

      const lList = await getPendingLeaves();
      setPendingLeaves(lList);
    } catch (e) {
      console.log('Error refreshing queue:', e);
    }
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

  const handleClearQueue = async () => {
    setClearing(true);
    try {
      await clearOfflineQueue();
      setSyncResult(null);
      await refreshQueue();
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (e) {
      console.log('Error clearing queue:', e);
    } finally {
      setClearing(false);
    }
  };

  const formatTimestamp = (raw: string) => {
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw.slice(0, 16);
      return `${d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return raw.slice(0, 16);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name="cloud-offline-outline" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {lang === 'hi' ? 'ऑफलाइन बंकर एवं सिंक' : 'AIR-GAP & OFFLINE SYNC'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {lang === 'hi' ? 'स्थानीय डिवाइस डेटाबेस' : 'Local Encrypted SQLite Storage'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Section 1: Trench Mode Toggle */}
            <View style={styles.toggleCard}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View style={[styles.statusDot, isTrenchMode ? styles.dotAmber : styles.dotGreen]} />
                  <Text style={styles.toggleTitle}>
                    {lang === 'hi' ? 'सीमावर्ती बंकर मोड (ऑफलाइन)' : 'Border Trench Mode (Offline)'}
                  </Text>
                </View>
                <Text style={styles.toggleDesc}>
                  {lang === 'hi'
                    ? 'इंटरनेट न होने पर चेक-इन और आवेदन फोन में सुरक्षित रहते हैं।'
                    : 'Queues assessments locally when disconnected from base network.'}
                </Text>
              </View>
              <Switch
                value={isTrenchMode}
                onValueChange={handleToggleTrenchMode}
                trackColor={{ false: '#CBD5E1', true: '#0F172A' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Section 2: Sync Status Notification Banner */}
            {syncResult && (
              <View
                style={[
                  styles.resultBanner,
                  syncResult.failed === 0 ? styles.resultSuccess : styles.resultWarning,
                ]}
              >
                <Ionicons
                  name={syncResult.failed === 0 ? 'checkmark-circle' : 'alert-circle'}
                  size={18}
                  color={syncResult.failed === 0 ? '#16A34A' : '#D97706'}
                  style={{ marginRight: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>
                    {syncResult.failed === 0
                      ? (lang === 'hi' ? 'सिंक सफल: सभी रिकॉर्ड सुरक्षित भेजे गए' : 'Sync Complete: All records pushed')
                      : (lang === 'hi'
                          ? `सिंक स्थिति: ${syncResult.synced} सफल, ${syncResult.failed} असफल`
                          : `Sync Status: ${syncResult.synced} synced, ${syncResult.failed} pending`)}
                  </Text>
                  {syncResult.details && syncResult.details.length > 0 && (
                    <Text style={styles.resultSub} numberOfLines={2}>
                      {syncResult.details[0]}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Section 3: Pending Queue Header */}
            <View style={styles.queueHeaderRow}>
              <Text style={styles.sectionLabel}>
                {lang === 'hi' ? 'लंबित रिकॉर्ड' : 'QUEUED RECORDS'}
              </Text>
              <View style={[styles.counterPill, counts.total > 0 && styles.counterPillActive]}>
                <Text style={[styles.counterText, counts.total > 0 && styles.counterTextActive]}>
                  {counts.total} {lang === 'hi' ? 'बाकी' : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Section 4: Pending Items List */}
            {counts.total === 0 ? (
              <View style={styles.emptyQueueBox}>
                <Ionicons name="checkmark-done-circle-outline" size={32} color="#16A34A" />
                <Text style={styles.emptyQueueText}>
                  {lang === 'hi'
                    ? 'स्थानीय कतार खाली है। सभी डेटा सिंक है।'
                    : 'Queue is clear. All records are synced with HQ.'}
                </Text>
              </View>
            ) : (
              <View style={styles.itemsContainer}>
                {pendingCheckins.map((c, i) => (
                  <View key={`c-${i}`} style={styles.itemRow}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name="stopwatch-outline" size={15} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>
                        {lang === 'hi' ? 'दैनिक चेक-इन' : 'Daily Check-in'} (Mood: {c.mood_score}/5)
                      </Text>
                      <Text style={styles.itemSub}>{formatTimestamp(c.created_at)}</Text>
                    </View>
                    <View style={styles.queuedBadge}>
                      <Text style={styles.queuedBadgeText}>QUEUED</Text>
                    </View>
                  </View>
                ))}

                {pendingLeaves.map((l, i) => (
                  <View key={`l-${i}`} style={styles.itemRow}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name="calendar-outline" size={15} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>
                        {l.leave_type} ({l.days_requested}d)
                      </Text>
                      <Text style={styles.itemSub}>
                        {l.personal_reason || formatTimestamp(l.created_at)}
                      </Text>
                    </View>
                    <View style={styles.queuedBadge}>
                      <Text style={styles.queuedBadgeText}>QUEUED</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Section 5: Action Buttons */}
            <View style={styles.actionsContainer}>
              <MonochromeButton
                title={
                  syncing
                    ? (lang === 'hi' ? 'सिंक हो रहा है...' : 'SYNCHRONIZING...')
                    : (lang === 'hi'
                        ? `कतार सिंक करें (${counts.total})`
                        : `SYNC AIR-GAP QUEUE (${counts.total})`)
                }
                variant="solid"
                disabled={syncing || counts.total === 0}
                onPress={handleSyncNow}
                icon={<Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />}
                style={styles.syncBtn}
              />

              {counts.total > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClearQueue}
                  disabled={clearing}
                  style={styles.clearBtn}
                >
                  <Ionicons name="trash-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.clearBtnText}>
                    {clearing
                      ? (lang === 'hi' ? 'हटाया जा रहा है...' : 'Clearing...')
                      : (lang === 'hi' ? 'कतार साफ करें (Clear Queue)' : 'Clear Local Queue')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  bodyScroll: {
    marginTop: 14,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotAmber: {
    backgroundColor: '#D97706',
  },
  dotGreen: {
    backgroundColor: '#16A34A',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  toggleDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
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
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
  },
  counterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  counterPillActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  counterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  counterTextActive: {
    color: '#92400E',
  },
  emptyQueueBox: {
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyQueueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 8,
    textAlign: 'center',
  },
  itemsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  itemIconWrap: {
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  queuedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  queuedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.4,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  syncBtn: {
    height: 46,
    borderRadius: 10,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
});
