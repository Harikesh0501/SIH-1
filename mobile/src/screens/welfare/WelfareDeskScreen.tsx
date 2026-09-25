import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../constants/theme';
import { MonochromeCard, MonochromeBadge, MonochromeButton } from '../../components/common';
import { apiClient } from '../../api/client';

interface TriageItem {
  id: number;
  service_number: string;
  masked_id: string;
  full_name: string;
  rank: string;
  company: string;
  platoon: string;
  role: string;
  deployment_zone: string;
  deployment_type: string;
  days_in_current_zone: number;
  leave_cancellations_count: number;
  consecutive_night_duties: number;
  stress_score: number;
  risk_level: string;
  crisis_flag: boolean;
  top_stress_driver: string;
  active_interventions_count: number;
  last_assessment_date?: string | null;
}

interface XAIFactor {
  feature: string;
  feature_hi: string;
  category: string;
  impact_pct: number;
  description: string;
}

interface DossierData {
  personnel: any;
  xai_attribution: {
    factors: XAIFactor[];
    clinical_narrative_en: string;
    clinical_narrative_hi: string;
  };
  duty_history: any[];
  leave_history: any[];
  recent_assessments: any[];
  recent_biometrics: any[];
  interventions: any[];
  prescribed_recommendations: {
    action_type: string;
    title: string;
    priority: string;
    rationale: string;
  }[];
}

export const WelfareDeskScreen: React.FC = () => {
  const { lang } = useAuth();

  // Triage state
  const [triageList, setTriageList] = useState<TriageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');

  // Dossier modal state
  const [selectedSoldier, setSelectedSoldier] = useState<TriageItem | null>(null);
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loadingDossier, setLoadingDossier] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<boolean>(false);

  const companies = ['All', 'Alpha', 'Bravo', 'Charlie', 'Delta'];
  const tiers = ['All', 'Critical', 'Vulnerable', 'Fatigued', 'Resilient'];

  const fetchTriageQueue = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (selectedCompany !== 'All') params.company = selectedCompany;
      if (selectedTier !== 'All') params.risk_level = selectedTier;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get('/api/welfare/triage-queue', { params });
      setTriageList(res.data);
    } catch (err: any) {
      console.log('Error fetching triage queue:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriageQueue();
  }, [selectedCompany, selectedTier]);

  const handleSearchSubmit = () => {
    fetchTriageQueue();
  };

  const handleOpenDossier = async (soldier: TriageItem) => {
    setSelectedSoldier(soldier);
    setDossier(null);
    setActionSuccess(null);
    setLoadingDossier(true);
    try {
      const res = await apiClient.get(`/api/welfare/personnel/${soldier.id}/dossier`);
      setDossier(res.data);
    } catch (err: any) {
      console.log('Error loading dossier:', err?.message);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleDispatchIntervention = async (
    interventionType: string,
    priority: string = 'Elevated',
    notes: string = 'Dispatched from Mobile Field Care Desk'
  ) => {
    if (!selectedSoldier) return;
    setDispatching(true);
    setActionSuccess(null);
    try {
      await apiClient.post('/api/welfare/interventions', {
        personnel_id: selectedSoldier.id,
        intervention_type: interventionType,
        priority: priority,
        assigned_counselor: 'Chief Medical Officer (SG)',
        action_details: `${interventionType} sanctioned for ${selectedSoldier.rank} ${selectedSoldier.full_name}`,
        clinical_notes: notes,
      });
      setActionSuccess(
        lang === 'hi'
          ? `हस्तक्षेप सफलतापूर्वक जारी हुआ: ${interventionType}`
          : `Intervention dispatched: ${interventionType}`
      );
      // Refresh dossier & triage list
      const res = await apiClient.get(`/api/welfare/personnel/${selectedSoldier.id}/dossier`);
      setDossier(res.data);
      fetchTriageQueue();
    } catch (err: any) {
      console.log('Dispatch error:', err?.message);
    } finally {
      setDispatching(false);
    }
  };

  // Metrics summary
  const criticalCount = triageList.filter((s) => s.risk_level.toLowerCase() === 'critical' || s.stress_score >= 70).length;
  const vulnerableCount = triageList.filter((s) => s.risk_level.toLowerCase() === 'vulnerable').length;
  const crisisCuesCount = triageList.filter((s) => s.crisis_flag).length;

  return (
    <View style={styles.container}>
      {/* Top Clinical Header Ribbon */}
      <View style={styles.topRibbon}>
        <View style={styles.ribbonItem}>
          <Text style={styles.ribbonLabel}>{lang === 'hi' ? 'ट्राइएज कुल' : 'TOTAL QUEUE'}</Text>
          <Text style={styles.ribbonVal}>{triageList.length}</Text>
        </View>
        <View style={styles.ribbonDivider} />
        <View style={styles.ribbonItem}>
          <Text style={[styles.ribbonLabel, { color: '#991B1B' }]}>
            {lang === 'hi' ? 'अति-गंभीर' : 'CRITICAL'}
          </Text>
          <Text style={[styles.ribbonVal, { color: '#991B1B' }]}>{criticalCount}</Text>
        </View>
        <View style={styles.ribbonDivider} />
        <View style={styles.ribbonItem}>
          <Text style={[styles.ribbonLabel, { color: '#D97706' }]}>
            {lang === 'hi' ? 'संवेदनशील' : 'VULNERABLE'}
          </Text>
          <Text style={[styles.ribbonVal, { color: '#D97706' }]}>{vulnerableCount}</Text>
        </View>
        <View style={styles.ribbonDivider} />
        <View style={styles.ribbonItem}>
          <Text style={[styles.ribbonLabel, { color: '#DC2626' }]}>
            {lang === 'hi' ? 'संकट चेतावनी' : 'CRISIS CUES'}
          </Text>
          <Text style={[styles.ribbonVal, { color: '#DC2626' }]}>{crisisCuesCount}</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.filterSection}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={14} color="#64748B" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={lang === 'hi' ? 'जवान का नाम या सर्विस नंबर खोजें...' : 'Search soldier name or service ID...'}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                fetchTriageQueue();
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Company Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsScroll}>
          <View style={styles.pillsRow}>
            {companies.map((c) => (
              <TouchableOpacity
                key={c}
                activeOpacity={0.7}
                onPress={() => setSelectedCompany(c)}
                style={[styles.filterPill, selectedCompany === c && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, selectedCompany === c && styles.filterPillTextActive]}>
                  {c === 'All' ? (lang === 'hi' ? 'सभी कंपनियां' : 'All Units') : `${c} Co`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Risk Tier Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsScroll}>
          <View style={styles.pillsRow}>
            {tiers.map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.7}
                onPress={() => setSelectedTier(t)}
                style={[styles.filterPill, selectedTier === t && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, selectedTier === t && styles.filterPillTextActive]}>
                  {t === 'All' ? (lang === 'hi' ? 'सभी श्रेणियां' : 'All Tiers') : t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Ranked Triage List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#0F172A" />
          <Text style={styles.loadingLabel}>
            {lang === 'hi' ? 'क्लीनिकल ट्राइएज कतार लोड हो रही है...' : 'LOADING CLINICAL TRIAGE QUEUE...'}
          </Text>
        </View>
      ) : triageList.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#16A34A" />
          <Text style={styles.emptyTitle}>
            {lang === 'hi' ? 'कोई गंभीर मामला नहीं मिला' : 'No matching personnel found'}
          </Text>
          <Text style={styles.emptySub}>
            {lang === 'hi' ? 'फ़िल्टर बदलें या खोज रीसेट करें।' : 'Try adjusting the filters above.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={triageList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isCritical = item.risk_level.toLowerCase() === 'critical' || item.stress_score >= 70;
            const isVulnerable = item.risk_level.toLowerCase() === 'vulnerable';
            const isFatigued = item.risk_level.toLowerCase() === 'fatigued';

            return (
              <View style={[styles.soldierCard, isCritical && styles.cardCriticalBorder]}>
                {/* Header Row: Rank, Name & Risk Badge */}
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.soldierRank}>{item.rank}</Text>
                      <Text style={styles.soldierName} numberOfLines={1}>
                        {item.full_name}
                      </Text>
                    </View>
                    <Text style={styles.soldierMeta}>
                      {item.company} • {item.masked_id} • {item.role}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.tierBadge,
                      isCritical && styles.tierBadgeCritical,
                      isVulnerable && styles.tierBadgeVulnerable,
                      isFatigued && styles.tierBadgeFatigued,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierBadgeText,
                        isCritical && styles.tierTextCritical,
                        isVulnerable && styles.tierTextVulnerable,
                        isFatigued && styles.tierTextFatigued,
                      ]}
                    >
                      {item.risk_level.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Score & Key Operational Metrics */}
                <View style={styles.metricsRow}>
                  <View style={styles.scoreBlock}>
                    <Text style={styles.scoreLabel}>STRESS INDEX</Text>
                    <Text style={[styles.scoreValue, isCritical && styles.scoreCritical]}>
                      {Math.round(item.stress_score)}
                      <Text style={styles.scoreScale}>/100</Text>
                    </Text>
                  </View>

                  <View style={styles.vitalsBlock}>
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalLabel}>NIGHT DUTIES:</Text>
                      <Text style={styles.vitalVal}>{item.consecutive_night_duties} consecutive</Text>
                    </View>
                    <View style={styles.vitalItem}>
                      <Text style={styles.vitalLabel}>DAYS IN FOB:</Text>
                      <Text style={styles.vitalVal}>{item.days_in_current_zone} days</Text>
                    </View>
                  </View>
                </View>

                {/* Primary Stress Driver */}
                <View style={styles.driverBox}>
                  <Ionicons name="pulse-outline" size={12} color="#D97706" style={{ marginRight: 4 }} />
                  <Text style={styles.driverText} numberOfLines={1}>
                    <Text style={{ fontWeight: '800' }}>Primary Driver: </Text>
                    {item.top_stress_driver}
                  </Text>
                </View>

                {/* Crisis Alert Banner if detected */}
                {item.crisis_flag && (
                  <View style={styles.crisisBanner}>
                    <Ionicons name="warning" size={12} color="#DC2626" style={{ marginRight: 4 }} />
                    <Text style={styles.crisisBannerText}>
                      {lang === 'hi' ? 'तत्काल नैदानिक हस्तक्षेप आवश्यक' : 'URGENT CLINICAL OUTREACH REQUIRED'}
                    </Text>
                  </View>
                )}

                {/* Action Row */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleOpenDossier(item)}
                    style={styles.dossierBtn}
                  >
                    <Ionicons name="clipboard-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.dossierBtnText}>
                      {lang === 'hi' ? 'एक्सएआई डोजियर देखें' : 'VIEW CLINICAL DOSSIER'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* SOLDIER CLINICAL DOSSIER & XAI MODAL */}
      <Modal
        visible={!!selectedSoldier}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSoldier(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalRankTitle}>
                  {selectedSoldier?.rank} {selectedSoldier?.full_name}
                </Text>
                <Text style={styles.modalSubMeta}>
                  SERVICE ID: {selectedSoldier?.service_number} • {selectedSoldier?.company} • 104 BN
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedSoldier(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {loadingDossier ? (
                <View style={styles.modalLoadingBox}>
                  <ActivityIndicator size="small" color="#0F172A" />
                  <Text style={styles.loadingLabel}>
                    {lang === 'hi' ? 'डोजियर एवं एक्सएआई विश्लेषण लोड हो रहा है...' : 'CALCULATING 5-FACTOR XAI ATTRIBUTION...'}
                  </Text>
                </View>
              ) : dossier ? (
                <>
                  {/* Action Success Alert */}
                  {actionSuccess && (
                    <View style={styles.successBox}>
                      <Ionicons name="checkmark-circle" size={15} color="#16A34A" style={{ marginRight: 6 }} />
                      <Text style={styles.successBoxText}>{actionSuccess}</Text>
                    </View>
                  )}

                  {/* 1. Stress Score Card */}
                  <View style={styles.dossierScoreCard}>
                    <View>
                      <Text style={styles.dossierScoreLabel}>PREDICTIVE STRESS INDEX</Text>
                      <Text style={styles.dossierScoreNum}>
                        {Math.round(selectedSoldier?.stress_score || 0)}
                        <Text style={{ fontSize: 13, color: '#64748B' }}>/100</Text>
                      </Text>
                    </View>
                    <View style={styles.dossierTierPill}>
                      <Text style={styles.dossierTierText}>
                        {selectedSoldier?.risk_level.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* 2. 5-Factor Explainable AI (XAI) Breakdown */}
                  <View style={styles.xaiSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="pie-chart-outline" size={13} color="#0F172A" style={{ marginRight: 4 }} />
                      <Text style={styles.sectionTitle}>
                        {lang === 'hi' ? '5-घटक एक्सएआई तनाव विश्लेषण' : '5-FACTOR EXPLAINABLE AI DRIVERS'}
                      </Text>
                    </View>

                    <View style={{ gap: 8, marginTop: 8 }}>
                      {dossier.xai_attribution.factors.map((factor, idx) => (
                        <View key={idx} style={styles.xaiFactorRow}>
                          <View style={styles.factorLabelRow}>
                            <Text style={styles.factorName}>
                              {lang === 'hi' ? factor.feature_hi : factor.feature}
                            </Text>
                            <Text style={styles.factorPct}>{factor.impact_pct.toFixed(1)}%</Text>
                          </View>

                          <View style={styles.factorBarTrack}>
                            <View
                              style={[
                                styles.factorBarFill,
                                {
                                  width: `${Math.min(100, factor.impact_pct * 2.2)}%`,
                                  backgroundColor: factor.impact_pct >= 25 ? '#D97706' : '#0F172A',
                                },
                              ]}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 3. Clinical Diagnostic Narrative */}
                  <View style={styles.narrativeBox}>
                    <Text style={styles.narrativeTitle}>
                      {lang === 'hi' ? 'नैदानिक सारांश (Clinical Summary)' : 'CLINICAL EVALUATION SUMMARY'}
                    </Text>
                    <Text style={styles.narrativeText}>
                      {lang === 'hi'
                        ? dossier.xai_attribution.clinical_narrative_hi
                        : dossier.xai_attribution.clinical_narrative_en}
                    </Text>
                  </View>

                  {/* 4. Quick Action Dispatcher */}
                  <View style={styles.dispatchSection}>
                    <Text style={styles.dispatchSectionTitle}>
                      {lang === 'hi' ? 'तात्कालिक कल्याण हस्तक्षेप जारी करें' : 'DISPATCH MEDICAL INTERVENTION'}
                    </Text>

                    <View style={styles.actionGrid}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={dispatching}
                        onPress={() =>
                          handleDispatchIntervention(
                            'Mandatory 10-Day R&R Leave',
                            'Urgent - Critical',
                            'Emergency 10-day R&R sanctioned from mobile care desk to reset combat exhaustion.'
                          )
                        }
                        style={styles.actionChoiceBtn}
                      >
                        <Ionicons name="bed-outline" size={14} color="#0F172A" style={{ marginRight: 4 }} />
                        <Text style={styles.actionChoiceText}>
                          {lang === 'hi' ? '10-दिवसीय R&R विश्राम' : '10-Day R&R Rest'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={dispatching}
                        onPress={() =>
                          handleDispatchIntervention(
                            'Psychological Counseling Session',
                            'Elevated',
                            'One-on-one telehealth consultation scheduled with Base Medical Officer.'
                          )
                        }
                        style={styles.actionChoiceBtn}
                      >
                        <Ionicons name="chatbubbles-outline" size={14} color="#0F172A" style={{ marginRight: 4 }} />
                        <Text style={styles.actionChoiceText}>
                          {lang === 'hi' ? 'काउंसलिंग सत्र' : 'Counseling Session'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={dispatching}
                        onPress={() =>
                          handleDispatchIntervention(
                            'Operational Duty Rebalancing',
                            'Routine',
                            'Rotated out of nocturnal ambush shift to daytime administrative duty.'
                          )
                        }
                        style={styles.actionChoiceBtn}
                      >
                        <Ionicons name="swap-horizontal-outline" size={14} color="#0F172A" style={{ marginRight: 4 }} />
                        <Text style={styles.actionChoiceText}>
                          {lang === 'hi' ? 'ड्यूटी स्वैप' : 'Shift Rotation'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topRibbon: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ribbonItem: {
    alignItems: 'center',
    flex: 1,
  },
  ribbonLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  ribbonVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  ribbonDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    height: 34,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    color: '#0F172A',
    height: '100%',
  },
  filterPillsScroll: {
    flexGrow: 0,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  },
  listContent: {
    padding: 10,
    paddingBottom: 24,
    gap: 8,
  },
  soldierCard: {
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
  cardCriticalBorder: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFDFD',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  soldierRank: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 4,
  },
  soldierName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  soldierMeta: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  tierBadgeCritical: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  tierBadgeVulnerable: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tierBadgeFatigued: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tierBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#475569',
  },
  tierTextCritical: {
    color: '#991B1B',
  },
  tierTextVulnerable: {
    color: '#92400E',
  },
  tierTextFatigued: {
    color: '#334155',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  scoreBlock: {
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingRight: 10,
    marginRight: 10,
  },
  scoreLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#64748B',
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  scoreCritical: {
    color: '#DC2626',
  },
  scoreScale: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
  },
  vitalsBlock: {
    flex: 1,
    gap: 2,
  },
  vitalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vitalLabel: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '700',
  },
  vitalVal: {
    fontSize: 8,
    color: '#0F172A',
    fontWeight: '800',
  },
  driverBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  driverText: {
    fontSize: 9,
    color: '#475569',
    flex: 1,
  },
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 6,
  },
  crisisBannerText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  cardActionsRow: {
    marginTop: 8,
  },
  dossierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 5,
    paddingVertical: 6,
  },
  dossierBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  modalRankTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubMeta: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalLoadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  successBoxText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  dossierScoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  dossierScoreLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  dossierScoreNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  dossierTierPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dossierTierText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  xaiSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  xaiFactorRow: {
    gap: 3,
  },
  factorLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  factorName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  factorPct: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
  },
  factorBarTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  narrativeBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  narrativeTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  narrativeText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 14,
  },
  dispatchSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  dispatchSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  actionChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  actionChoiceText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
});
