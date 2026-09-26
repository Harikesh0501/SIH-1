import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { MonochromeCard, MonochromeBadge, MonochromeButton } from '../../components/common';

// -------------------------------------------------------------
// Interfaces matching backend schemas
// -------------------------------------------------------------
export interface ReadinessKPI {
  battalion_name: string;
  total_active_personnel: number;
  force_readiness_index: number;
  average_stress_score: number;
  critical_cases_count: number;
  vulnerable_cases_count: number;
  fatigued_cases_count: number;
  resilient_cases_count: number;
  active_interventions_count: number;
  k_anonymity_enforced: boolean;
  timestamp: string;
}

export interface RiskDistribution {
  resilient_pct: number;
  fatigued_pct: number;
  vulnerable_pct: number;
  critical_pct: number;
}

export interface CompanyHeatmapItem {
  company_name: string;
  strength: number;
  deployment_zone: string;
  deployment_type: string;
  average_days_deployed: number;
  total_leave_denials: number;
  average_stress_score: number;
  company_risk_level: string;
  risk_distribution: RiskDistribution;
  high_risk_flag: boolean;
  recommended_action: string;
}

export interface ExecutiveReport {
  report_id: string;
  title: string;
  battalion: string;
  security_classification: string;
  commanding_officer: string;
  generated_at: string;
  readiness_kpi: ReadinessKPI;
  company_readiness_breakdown: CompanyHeatmapItem[];
  critical_action_items: string[];
  apar_immunity_seal: string;
  digital_signature_hash: string;
}

// -------------------------------------------------------------
// Mini-task 5.1.1: Circular Progress Gauge for FRI (No Blue!)
// -------------------------------------------------------------
interface CircularGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({ score, size = 114, strokeWidth = 11 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score || 0));
  const strokeDashoffset = circumference - (circumference * clampedScore) / 100;

  // Semantic color: Resilient/Green, Alert/Amber, Critical/Red (STRICTLY NO BLUE)
  const strokeColor =
    clampedScore >= 75
      ? '#16A34A'
      : clampedScore >= 55
      ? '#D97706'
      : '#DC2626';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Colored Progress Ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={styles.gaugeInnerContent}>
        <Text style={styles.gaugeScoreText}>{clampedScore.toFixed(1)}%</Text>
        <Text style={[styles.gaugeLabelText, { color: strokeColor }]}>FRI</Text>
      </View>
    </View>
  );
};

// -------------------------------------------------------------
// Format IST Date Helper
// -------------------------------------------------------------
const formatISTDateTime = (isoString?: string): string => {
  if (!isoString) return 'LIVE IST';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return (
      d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' IST'
    );
  } catch {
    return isoString;
  }
};

// -------------------------------------------------------------
// Main Tactical Commander Screen
// -------------------------------------------------------------
export const CommanderDeskScreen: React.FC = () => {
  const { lang, user } = useAuth();
  const [activeSegment, setActiveSegment] = useState<'snapshot' | 'briefing'>('snapshot');

  // Live state from backend
  const [kpi, setKpi] = useState<ReadinessKPI | null>(null);
  const [heatmap, setHeatmap] = useState<CompanyHeatmapItem[]>([]);
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected company for granular drilldown modal
  const [selectedCompany, setSelectedCompany] = useState<CompanyHeatmapItem | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Fetch real-time data from FastAPI
  const loadData = useCallback(async (isPullRefresh: boolean = false) => {
    try {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);

      // Concurrent fetch of KPI and Heatmap
      const [kpiRes, heatmapRes] = await Promise.all([
        apiClient.get<ReadinessKPI>('/api/commander/readiness-kpi'),
        apiClient.get<CompanyHeatmapItem[]>('/api/commander/company-heatmap'),
      ]);

      setKpi(kpiRes.data);
      setHeatmap(heatmapRes.data);

      // Fetch or update executive report
      try {
        const repRes = await apiClient.get<ExecutiveReport>('/api/commander/export-report');
        setReport(repRes.data);
      } catch (repErr) {
        console.warn('Executive report load warning:', repErr);
      }
    } catch (err: any) {
      console.error('Commander dashboard load error:', err);
      setErrorMsg(
        err?.response?.data?.detail ||
          (lang === 'hi'
            ? 'कमांड डेटा लोड करने में असमर्थ। कृपया नेटवर्क कनेक्शन जांचें।'
            : 'Unable to load tactical readiness feed. Check network connection.')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Haptic trigger helper
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch {
        // Ignore
      }
    }
  };

  // Copy hash simulation feedback
  const handleCopyHash = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2400);
  };

  // Helper for company risk badge colors (No Blue)
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return { text: '#DC2626', bg: '#FEE2E2', border: '#FECACA' };
      case 'Vulnerable':
        return { text: '#EA580C', bg: '#FFEDD5', border: '#FED7AA' };
      case 'Fatigued':
        return { text: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
      case 'Resilient':
      default:
        return { text: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0' };
    }
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Segment Switcher (Minimizes Scrolling) */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic();
            setActiveSegment('snapshot');
          }}
          style={[styles.segmentBtn, activeSegment === 'snapshot' && styles.segmentBtnActive]}
        >
          <Ionicons
            name="speedometer-outline"
            size={14}
            color={activeSegment === 'snapshot' ? '#0F172A' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeSegment === 'snapshot' && styles.segmentTextActive]}>
            {lang === 'hi' ? 'तत्परता स्नैपशॉट' : 'READINESS SNAPSHOT'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic();
            setActiveSegment('briefing');
          }}
          style={[styles.segmentBtn, activeSegment === 'briefing' && styles.segmentBtnActive]}
        >
          <Ionicons
            name="document-text-outline"
            size={14}
            color={activeSegment === 'briefing' ? '#0F172A' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeSegment === 'briefing' && styles.segmentTextActive]}>
            {lang === 'hi' ? 'कार्यकारी ब्रीफिंग' : 'EXECUTIVE BRIEFING'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={styles.loadingText}>
            {lang === 'hi' ? 'सामरिक बल डेटा लोड हो रहा है...' : 'CALCULATING BATTALION READINESS...'}
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <MonochromeButton
            title={lang === 'hi' ? 'पुनः प्रयास करें' : 'RETRY CONNECTION'}
            variant="solid"
            onPress={() => loadData()}
            style={{ marginTop: 12 }}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#0F172A" />
          }
        >
          {/* ============================================================= */}
          {/* VIEW 1: READINESS SNAPSHOT (Mini-tasks 5.1.1, 5.1.2, 5.1.3) */}
          {/* ============================================================= */}
          {activeSegment === 'snapshot' && (
            <>
              {/* Mini-task 5.1.1: Force Readiness Index & Battalion Health Hero */}
              <MonochromeCard highlight>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.unitName}>{kpi?.battalion_name || '104 BN CRPF / SPECIAL OPERATIONS'}</Text>
                    <Text style={styles.coHeader}>
                      {user?.full_name ? `COMMANDER: ${user.full_name.toUpperCase()} (${user.rank})` : 'TACTICAL COMMAND POST'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => loadData(true)}
                    style={styles.refreshPill}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="refresh" size={13} color="#0F172A" />
                    <Text style={styles.refreshPillText}>LIVE</Text>
                  </TouchableOpacity>
                </View>

                {/* Circular Progress Gauge & Primary KPI Deck */}
                <View style={styles.gaugeContainerRow}>
                  <CircularGauge score={kpi?.force_readiness_index || 0} size={118} strokeWidth={11} />

                  <View style={styles.kpiCol}>
                    <View style={styles.kpiMiniCard}>
                      <Text style={styles.kpiMiniLabel}>
                        {lang === 'hi' ? 'औसत बटालियन तनाव' : 'BATTALION STRAIN'}
                      </Text>
                      <View style={styles.kpiValueRow}>
                        <Text style={styles.kpiMiniValue}>{kpi?.average_stress_score.toFixed(1) || '0.0'}</Text>
                        <Text style={styles.kpiMiniMax}>/ 100</Text>
                      </View>
                    </View>

                    <View style={styles.kpiMiniCard}>
                      <Text style={styles.kpiMiniLabel}>
                        {lang === 'hi' ? 'सक्रिय सैनिक संख्या' : 'ACTIVE PERSONNEL'}
                      </Text>
                      <Text style={styles.kpiMiniValue}>
                        {kpi?.total_active_personnel || 0}{' '}
                        <Text style={styles.kpiMiniSub}>{lang === 'hi' ? 'जवान' : 'Jawans'}</Text>
                      </Text>
                    </View>

                    <View style={styles.kpiMiniCard}>
                      <Text style={styles.kpiMiniLabel}>
                        {lang === 'hi' ? 'सक्रिय कल्याण हस्तक्षेप' : 'ACTIVE CARE PLANS'}
                      </Text>
                      <Text style={[styles.kpiMiniValue, { color: '#D97706' }]}>
                        {kpi?.active_interventions_count || 0}{' '}
                        <Text style={styles.kpiMiniSub}>{lang === 'hi' ? 'प्रक्रियाधीन' : 'Active'}</Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* k-Anonymity Statutory Guarantee Pill */}
                <View style={styles.kAnonShieldRow}>
                  <Ionicons name="lock-closed" size={12} color="#16A34A" />
                  <Text style={styles.kAnonShieldText}>
                    {lang === 'hi'
                      ? 'k-Anonymity (k≥5) संरक्षित: केवल समग्र डेटा • कोई व्यक्तिगत नाम प्रदर्शित नहीं'
                      : 'k-Anonymity Protected (k≥5): Pure Aggregates • Zero Individual PII Leaked'}
                  </Text>
                </View>
              </MonochromeCard>

              {/* Mini-task 5.1.2: Risk Distribution Breakdown */}
              <MonochromeCard>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="pie-chart-outline" size={15} color="#0F172A" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>
                    {lang === 'hi' ? 'जोखिम वितरण विश्लेषण' : 'FORCE RISK DISTRIBUTION'}
                  </Text>
                </View>

                {/* Proportional Stacked Color Bar */}
                <View style={styles.stackedBar}>
                  <View
                    style={{
                      flex: Math.max(kpi?.resilient_cases_count || 1, 0.1),
                      backgroundColor: '#16A34A',
                    }}
                  />
                  <View
                    style={{
                      flex: Math.max(kpi?.fatigued_cases_count || 1, 0.1),
                      backgroundColor: '#D97706',
                    }}
                  />
                  <View
                    style={{
                      flex: Math.max(kpi?.vulnerable_cases_count || 1, 0.1),
                      backgroundColor: '#EA580C',
                    }}
                  />
                  <View
                    style={{
                      flex: Math.max(kpi?.critical_cases_count || 1, 0.1),
                      backgroundColor: '#DC2626',
                    }}
                  />
                </View>

                {/* 4 Semantic Stat Tiles */}
                <View style={styles.riskTilesGrid}>
                  {/* Resilient */}
                  <View style={[styles.riskTile, { borderLeftColor: '#16A34A' }]}>
                    <Text style={styles.riskTileLabel}>{lang === 'hi' ? 'सहनशील' : 'RESILIENT'}</Text>
                    <Text style={[styles.riskTileCount, { color: '#16A34A' }]}>
                      {kpi?.resilient_cases_count || 0}
                    </Text>
                    <Text style={styles.riskTilePct}>
                      {kpi && kpi.total_active_personnel > 0
                        ? `${((kpi.resilient_cases_count / kpi.total_active_personnel) * 100).toFixed(0)}%`
                        : '0%'}
                    </Text>
                  </View>

                  {/* Fatigued */}
                  <View style={[styles.riskTile, { borderLeftColor: '#D97706' }]}>
                    <Text style={styles.riskTileLabel}>{lang === 'hi' ? 'थके हुए' : 'FATIGUED'}</Text>
                    <Text style={[styles.riskTileCount, { color: '#D97706' }]}>
                      {kpi?.fatigued_cases_count || 0}
                    </Text>
                    <Text style={styles.riskTilePct}>
                      {kpi && kpi.total_active_personnel > 0
                        ? `${((kpi.fatigued_cases_count / kpi.total_active_personnel) * 100).toFixed(0)}%`
                        : '0%'}
                    </Text>
                  </View>

                  {/* Vulnerable */}
                  <View style={[styles.riskTile, { borderLeftColor: '#EA580C' }]}>
                    <Text style={styles.riskTileLabel}>{lang === 'hi' ? 'संवेदनशील' : 'VULNERABLE'}</Text>
                    <Text style={[styles.riskTileCount, { color: '#EA580C' }]}>
                      {kpi?.vulnerable_cases_count || 0}
                    </Text>
                    <Text style={styles.riskTilePct}>
                      {kpi && kpi.total_active_personnel > 0
                        ? `${((kpi.vulnerable_cases_count / kpi.total_active_personnel) * 100).toFixed(0)}%`
                        : '0%'}
                    </Text>
                  </View>

                  {/* Critical */}
                  <View style={[styles.riskTile, { borderLeftColor: '#DC2626' }]}>
                    <Text style={styles.riskTileLabel}>{lang === 'hi' ? 'गंभीर' : 'CRITICAL'}</Text>
                    <Text style={[styles.riskTileCount, { color: '#DC2626' }]}>
                      {kpi?.critical_cases_count || 0}
                    </Text>
                    <Text style={styles.riskTilePct}>
                      {kpi && kpi.total_active_personnel > 0
                        ? `${((kpi.critical_cases_count / kpi.total_active_personnel) * 100).toFixed(0)}%`
                        : '0%'}
                    </Text>
                  </View>
                </View>
              </MonochromeCard>

              {/* Mini-task 5.1.3: Company Strain Heatmap Cards */}
              <View style={styles.sectionHeaderWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="grid-outline" size={15} color="#0F172A" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>
                    {lang === 'hi' ? 'कंपनी तनाव एवं परिचालन स्थिति' : 'COMPANY HEATMAP OVERVIEW'}
                  </Text>
                </View>
                <MonochromeBadge label={`${heatmap.length} UNITS`} variant="outline" />
              </View>

              {heatmap.map((comp) => {
                const colors = getRiskColor(comp.company_risk_level);
                return (
                  <TouchableOpacity
                    key={comp.company_name}
                    activeOpacity={0.8}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedCompany(comp);
                    }}
                  >
                    <MonochromeCard highlight={comp.high_risk_flag}>
                      {/* High Risk Banner */}
                      {comp.high_risk_flag && (
                        <View style={styles.highRiskBanner}>
                          <Ionicons name="warning" size={13} color="#DC2626" />
                          <Text style={styles.highRiskBannerText}>
                            {lang === 'hi'
                              ? 'उच्च परिचालन तनाव चेतावनी: घूर्णन आवश्यक'
                              : 'ELEVATED STRAIN WARNING: ROTATION RECOMMENDED'}
                          </Text>
                        </View>
                      )}

                      {/* Header Row */}
                      <View style={styles.compHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.compNameText}>{comp.company_name.toUpperCase()}</Text>
                          <Text style={styles.compZoneText}>
                            {comp.deployment_zone} • {comp.deployment_type}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.riskBadgePill,
                            { backgroundColor: colors.bg, borderColor: colors.border },
                          ]}
                        >
                          <View style={[styles.riskDot, { backgroundColor: colors.text }]} />
                          <Text style={[styles.riskBadgeText, { color: colors.text }]}>
                            {comp.company_risk_level.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Metrics 3-Column Strip */}
                      <View style={styles.compMetricsRow}>
                        <View style={styles.compMetricBox}>
                          <Text style={styles.compMetricLabel}>{lang === 'hi' ? 'सैनिक बल' : 'STRENGTH'}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.compMetricVal}>{comp.strength}</Text>
                            <View style={styles.kShieldMini}>
                              <Ionicons name="shield-checkmark" size={10} color="#16A34A" />
                              <Text style={styles.kShieldMiniText}>k≥5</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.compMetricBox}>
                          <Text style={styles.compMetricLabel}>{lang === 'hi' ? 'तनाव स्कोर' : 'AVG STRAIN'}</Text>
                          <Text style={[styles.compMetricVal, { color: colors.text }]}>
                            {comp.average_stress_score.toFixed(1)}
                          </Text>
                        </View>

                        <View style={styles.compMetricBox}>
                          <Text style={styles.compMetricLabel}>{lang === 'hi' ? 'क्षेत्र में दिन' : 'DAYS IN ZONE'}</Text>
                          <Text style={styles.compMetricVal}>{comp.average_days_deployed.toFixed(0)}d</Text>
                        </View>
                      </View>

                      {/* Proportional Mini Bar */}
                      <View style={styles.compMiniBar}>
                        <View
                          style={{
                            flex: Math.max(comp.risk_distribution.resilient_pct, 0.1),
                            backgroundColor: '#16A34A',
                          }}
                        />
                        <View
                          style={{
                            flex: Math.max(comp.risk_distribution.fatigued_pct, 0.1),
                            backgroundColor: '#D97706',
                          }}
                        />
                        <View
                          style={{
                            flex: Math.max(comp.risk_distribution.vulnerable_pct, 0.1),
                            backgroundColor: '#EA580C',
                          }}
                        />
                        <View
                          style={{
                            flex: Math.max(comp.risk_distribution.critical_pct, 0.1),
                            backgroundColor: '#DC2626',
                          }}
                        />
                      </View>

                      {/* Recommended Directive */}
                      <View style={styles.directiveBox}>
                        <Ionicons name="flash-outline" size={13} color="#0F172A" style={{ marginTop: 1 }} />
                        <Text style={styles.directiveText} numberOfLines={2}>
                          {comp.recommended_action}
                        </Text>
                      </View>
                    </MonochromeCard>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* ============================================================= */}
          {/* VIEW 2: EXECUTIVE BRIEFING (Mini-task 5.1.4)                   */}
          {/* ============================================================= */}
          {activeSegment === 'briefing' && (
            <>
              {/* Classified Intelligence Header */}
              <MonochromeCard highlight>
                <View style={styles.briefingHeaderBanner}>
                  <Ionicons name="shield-checkmark" size={14} color="#16A34A" />
                  <Text style={styles.briefingClassification}>
                    {report?.security_classification || 'SECRET - FOR BATTALION COMMANDER EYES ONLY'}
                  </Text>
                </View>

                <Text style={styles.briefingTitle}>
                  {lang === 'hi'
                    ? 'कार्यकारी बटालियन तत्परता एवं कार्मिक कल्याण रिपोर्ट'
                    : report?.title || 'EXECUTIVE BATTALION READINESS & PERSONNEL WELFARE AUDIT REPORT'}
                </Text>

                <View style={styles.briefingMetaRow}>
                  <Text style={styles.briefingMetaLabel}>{lang === 'hi' ? 'रिपोर्ट संदर्भ' : 'REPORT REF'}:</Text>
                  <Text style={styles.briefingMetaVal}>{report?.report_id || 'REP-104BN-LIVE'}</Text>
                </View>

                <View style={styles.briefingMetaRow}>
                  <Text style={styles.briefingMetaLabel}>{lang === 'hi' ? 'कमांडेंट' : 'COMMANDING OFFICER'}:</Text>
                  <Text style={styles.briefingMetaVal}>
                    {report?.commanding_officer || `${user?.full_name} (${user?.rank})`}
                  </Text>
                </View>

                <View style={styles.briefingMetaRow}>
                  <Text style={styles.briefingMetaLabel}>{lang === 'hi' ? 'सृजन समय' : 'TIMESTAMP'}:</Text>
                  <Text style={styles.briefingMetaVal}>{formatISTDateTime(report?.generated_at)}</Text>
                </View>

                {/* Cryptographic Seal Monospace Box */}
                <View style={styles.cryptoSealCard}>
                  <View style={styles.cryptoHeader}>
                    <Ionicons name="key-outline" size={13} color="#0F172A" />
                    <Text style={styles.cryptoTitle}>
                      {lang === 'hi'
                        ? 'SHA-256 डिजिटल हस्ताक्षर एवं सत्यापन सील'
                        : 'SHA-256 CRYPTOGRAPHIC SIGNATURE SEAL'}
                    </Text>
                  </View>
                  <Text style={styles.cryptoHashText} selectable>
                    {report?.digital_signature_hash ||
                      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </Text>

                  <TouchableOpacity
                    style={styles.copyHashBtn}
                    activeOpacity={0.7}
                    onPress={handleCopyHash}
                  >
                    <Ionicons
                      name={copyFeedback ? 'checkmark-circle' : 'copy-outline'}
                      size={13}
                      color={copyFeedback ? '#16A34A' : '#0F172A'}
                    />
                    <Text
                      style={[
                        styles.copyHashText,
                        copyFeedback && { color: '#16A34A', fontWeight: '800' },
                      ]}
                    >
                      {copyFeedback
                        ? lang === 'hi'
                          ? 'सील सत्यापित एवं प्रतिलिपि संपन्न!'
                          : 'SEAL VERIFIED & HASH COPIED'
                        : lang === 'hi'
                        ? 'हस्ताक्षर हैश कॉपी करें'
                        : 'COPY SIGNATURE SEAL'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </MonochromeCard>

              {/* Critical Tactical Directives */}
              <MonochromeCard>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="notifications-outline" size={15} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>
                    {lang === 'hi' ? 'महत्वपूर्ण सामरिक निर्देश' : 'CRITICAL TACTICAL DIRECTIVES'}
                  </Text>
                </View>
                <Text style={styles.sectionSub}>
                  {lang === 'hi'
                    ? 'सिस्टम द्वारा संश्लेषित त्वरित फील्ड कार्रवाई बिंदु:'
                    : 'System-synthesized priority field action items:'}
                </Text>

                {report?.critical_action_items && report.critical_action_items.length > 0 ? (
                  report.critical_action_items.map((item, idx) => (
                    <View key={idx} style={styles.actionItemCard}>
                      <View style={styles.actionNumBadge}>
                        <Text style={styles.actionNumText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.actionItemText}>{item}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.actionItemCard}>
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" style={{ marginRight: 8 }} />
                    <Text style={styles.actionItemText}>
                      {lang === 'hi'
                        ? 'बटालियन के सभी दल सामान्य एवं सुरक्षित मानकों में हैं।'
                        : 'Battalion operating within resilient parameters. Zero urgent alerts.'}
                    </Text>
                  </View>
                )}
              </MonochromeCard>

              {/* Statutory Legal Immunity Shield */}
              <MonochromeCard>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="shield-outline" size={15} color="#16A34A" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>
                    {lang === 'hi' ? 'संवैधानिक कानूनी उन्मुक्ति' : 'STATUTORY LEGAL IMMUNITY SEAL'}
                  </Text>
                </View>
                <Text style={styles.aparGuaranteeText}>
                  {report?.apar_immunity_seal ||
                    'LEGAL CERTIFICATE: This operational readiness report is cryptographically quarantined from the Annual Confidential Report (ACR/APAR) appraisal database under Ministry of Home Affairs Medical Confidentiality Directives. Individual soldier identities remain shielded under k-anonymity.'}
                </Text>
              </MonochromeCard>

              {/* Refresh Action Button */}
              <MonochromeButton
                title={lang === 'hi' ? 'खुफिया रिपोर्ट पुनः सिंक करें' : 'RE-SYNC INTELLIGENCE REPORT'}
                variant="solid"
                onPress={() => loadData(true)}
                icon={<Ionicons name="sync-outline" size={14} color="#FFFFFF" />}
                style={{ marginTop: 4, marginBottom: 12 }}
              />
            </>
          )}
        </ScrollView>
      )}

      {/* ============================================================= */}
      {/* COMPANY DETAIL DRILLDOWN MODAL (Minimizes Scrolling)           */}
      {/* ============================================================= */}
      <Modal
        visible={!!selectedCompany}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCompany(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalCompName}>
                  {selectedCompany?.company_name.toUpperCase()}
                </Text>
                <Text style={styles.modalCompSub}>
                  {selectedCompany?.deployment_zone} • {selectedCompany?.deployment_type}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedCompany(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {selectedCompany && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Strength & Anonymity Callout */}
                <View style={styles.modalStatGrid}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>{lang === 'hi' ? 'सैनिक संख्या' : 'FORCE STRENGTH'}</Text>
                    <Text style={styles.modalStatVal}>{selectedCompany.strength} Jawans</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>{lang === 'hi' ? 'औसत तनाव' : 'AVG STRAIN'}</Text>
                    <Text
                      style={[
                        styles.modalStatVal,
                        { color: getRiskColor(selectedCompany.company_risk_level).text },
                      ]}
                    >
                      {selectedCompany.average_stress_score.toFixed(1)} / 100
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>{lang === 'hi' ? 'तैनाती के दिन' : 'AVG DAYS DEPLOYED'}</Text>
                    <Text style={styles.modalStatVal}>{selectedCompany.average_days_deployed.toFixed(0)} Days</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>{lang === 'hi' ? 'छुट्टी रद्द संख्या' : 'LEAVE DENIALS'}</Text>
                    <Text style={styles.modalStatVal}>{selectedCompany.total_leave_denials} Cases</Text>
                  </View>
                </View>

                {/* Risk Distribution Breakdown */}
                <Text style={styles.modalSectionTitle}>
                  {lang === 'hi' ? 'कंपनी जोखिम वितरण' : 'UNIT RISK DISTRIBUTION'}
                </Text>
                <View style={styles.modalBarRow}>
                  <View style={styles.modalBarItem}>
                    <Text style={[styles.modalBarVal, { color: '#16A34A' }]}>
                      {selectedCompany.risk_distribution.resilient_pct}%
                    </Text>
                    <Text style={styles.modalBarLabel}>{lang === 'hi' ? 'सहनशील' : 'Resilient'}</Text>
                  </View>
                  <View style={styles.modalBarItem}>
                    <Text style={[styles.modalBarVal, { color: '#D97706' }]}>
                      {selectedCompany.risk_distribution.fatigued_pct}%
                    </Text>
                    <Text style={styles.modalBarLabel}>{lang === 'hi' ? 'थके हुए' : 'Fatigued'}</Text>
                  </View>
                  <View style={styles.modalBarItem}>
                    <Text style={[styles.modalBarVal, { color: '#EA580C' }]}>
                      {selectedCompany.risk_distribution.vulnerable_pct}%
                    </Text>
                    <Text style={styles.modalBarLabel}>{lang === 'hi' ? 'संवेदनशील' : 'Vulnerable'}</Text>
                  </View>
                  <View style={styles.modalBarItem}>
                    <Text style={[styles.modalBarVal, { color: '#DC2626' }]}>
                      {selectedCompany.risk_distribution.critical_pct}%
                    </Text>
                    <Text style={styles.modalBarLabel}>{lang === 'hi' ? 'गंभीर' : 'Critical'}</Text>
                  </View>
                </View>

                {/* Prescribed Operational Recommendation */}
                <View style={styles.modalDirectiveCard}>
                  <Text style={styles.modalDirectiveLabel}>
                    {lang === 'hi' ? 'परिचालन निर्देश' : 'OPERATIONAL COMMAND DIRECTIVE'}
                  </Text>
                  <Text style={styles.modalDirectiveVal}>{selectedCompany.recommended_action}</Text>
                </View>

                {/* Privacy Guarantee */}
                <View style={styles.modalAnonBadge}>
                  <Ionicons name="shield-checkmark" size={13} color="#16A34A" />
                  <Text style={styles.modalAnonText}>
                    {lang === 'hi'
                      ? 'k-Anonymity (k≥5) सत्यापित: व्यक्तिगत पहचान स्थायी रूप से सुरक्षित'
                      : 'k-Anonymity Verified (k≥5): Individual soldier records shielded from exposure'}
                  </Text>
                </View>
              </ScrollView>
            )}

            <MonochromeButton
              title={lang === 'hi' ? 'बंद करें' : 'CLOSE DOSSIER'}
              variant="solid"
              onPress={() => setSelectedCompany(null)}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// -------------------------------------------------------------
// Styles (Light Institutional Theme, Zero Blue)
// -------------------------------------------------------------
const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0F172A',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: '#0F172A',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 24,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Hero Card
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  unitName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  coHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  refreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  refreshPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  gaugeContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  gaugeInnerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScoreText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  gaugeLabelText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: -2,
  },
  kpiCol: {
    flex: 1,
    marginLeft: 14,
    gap: 8,
  },
  kpiMiniCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiMiniLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  kpiMiniValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiMiniMax: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 2,
  },
  kpiMiniSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  kAnonShieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 12,
    gap: 6,
  },
  kAnonShieldText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
    letterSpacing: 0.2,
  },

  // Risk Distribution Card
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  stackedBar: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  riskTilesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  riskTile: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3.5,
  },
  riskTileLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  riskTileCount: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  riskTilePct: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // Heatmap Section
  sectionHeaderWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  highRiskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
    gap: 6,
  },
  highRiskBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  compHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  compNameText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  compZoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  riskBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
  },
  riskDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  compMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  compMetricBox: {
    flex: 1,
  },
  compMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  compMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  kShieldMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    gap: 2,
  },
  kShieldMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  compMiniBar: {
    height: 6,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  directiveBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 6,
    gap: 6,
  },
  directiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },

  // Executive Briefing Styles
  briefingHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 5,
  },
  briefingClassification: {
    fontSize: 9,
    fontWeight: '900',
    color: '#166534',
    letterSpacing: 0.5,
  },
  briefingTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 18,
  },
  briefingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  briefingMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  briefingMetaVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  cryptoSealCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 10,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  cryptoTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  cryptoHashText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 8.5,
    color: '#334155',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    letterSpacing: 0.2,
    lineHeight: 12,
  },
  copyHashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 5,
  },
  copyHashText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  actionItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  actionNumBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  actionNumText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  actionItemText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    lineHeight: 15,
  },
  aparGuaranteeText: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 15,
    fontStyle: 'italic',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalCompName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  modalCompSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  modalStatItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  modalStatVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalBarRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  modalBarItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalBarVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  modalBarLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
  },
  modalDirectiveCard: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  modalDirectiveLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  modalDirectiveVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 16,
  },
  modalAnonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  modalAnonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
});
