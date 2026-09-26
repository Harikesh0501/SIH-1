import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { THEME } from './src/constants/theme';
import { MonochromeCard, MonochromeBadge, MonochromeButton, TacticalHeader } from './src/components/common';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { CheckInScreen } from './src/screens/jawan/CheckInScreen';
import { AiSathiScreen } from './src/screens/jawan/AiSathiScreen';
import { CertificateScreen } from './src/screens/jawan/CertificateScreen';
import { LeaveScreen } from './src/screens/jawan/LeaveScreen';
import { WelfareDeskScreen } from './src/screens/welfare/WelfareDeskScreen';
import { CommanderDeskScreen } from './src/screens/commander/CommanderDeskScreen';
import { AuditValidatorScreen } from './src/screens/audit/AuditValidatorScreen';
import { TrenchSyncModal } from './src/components/TrenchSyncModal';
import { getPendingCount, getFieldTrenchMode } from './src/storage/offlineStorage';

function MainApp() {
  const { user, lang, t, biometricSupported, logout, isLoading } = useAuth();
  const [jawanTab, setJawanTab] = useState<'checkin' | 'sathi' | 'leave' | 'cert' | 'profile'>('checkin');
  const [welfareTab, setWelfareTab] = useState<'triage' | 'profile'>('triage');
  const [commanderTab, setCommanderTab] = useState<'snapshot' | 'profile'>('snapshot');
  const [auditTab, setAuditTab] = useState<'validator' | 'profile'>('validator');
  const [showTrenchModal, setShowTrenchModal] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isTrenchMode, setIsTrenchMode] = useState<boolean>(false);

  const refreshTrenchState = async () => {
    try {
      const c = await getPendingCount();
      setPendingCount(c.total);
      const t = await getFieldTrenchMode();
      setIsTrenchMode(t);
    } catch (e) {
      // Ignore
    }
  };

  React.useEffect(() => {
    refreshTrenchState();
  }, [user]);

  // If initializing on boot
  if (isLoading && !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={styles.loadingText}>INITIALIZING TACTICAL ENCLAVE...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If unauthenticated, render Tactical Login & Hardware Fingerprint Screen
  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen />
      </>
    );
  }

  // Authenticated Defense Session View
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <TacticalHeader
        onPressSync={() => {
          refreshTrenchState();
          setShowTrenchModal(true);
        }}
        pendingCount={pendingCount}
        isTrenchMode={isTrenchMode}
      />

      {/* Audit Admin Navigation Bar */}
      {user.role === 'Audit Admin' && (
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAuditTab('validator')}
            style={[styles.tabNavItem, auditTab === 'validator' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color={auditTab === 'validator' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabNavText, auditTab === 'validator' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'ऑडिट सत्यापन' : 'AUDIT VALIDATOR'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAuditTab('profile')}
            style={[styles.tabNavItem, auditTab === 'profile' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="person-outline"
              size={13}
              color={auditTab === 'profile' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabNavText, auditTab === 'profile' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'प्रशासक प्रोफाइल' : 'ADMIN PROFILE'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Commanding Officer Navigation Bar */}
      {user.role === 'Commanding Officer' && (
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCommanderTab('snapshot')}
            style={[styles.tabNavItem, commanderTab === 'snapshot' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="speedometer-outline"
              size={13}
              color={commanderTab === 'snapshot' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabNavText, commanderTab === 'snapshot' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'सामरिक स्नैपशॉट' : 'COMMAND SNAPSHOT'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCommanderTab('profile')}
            style={[styles.tabNavItem, commanderTab === 'profile' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="person-outline"
              size={13}
              color={commanderTab === 'profile' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabNavText, commanderTab === 'profile' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'कमांडेंट प्रोफाइल' : 'COMMANDER PROFILE'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Welfare Officer Navigation Bar */}
      {user.role === 'Welfare Officer' && (
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setWelfareTab('triage')}
            style={[styles.tabNavItem, welfareTab === 'triage' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="medkit-outline"
              size={13}
              color={welfareTab === 'triage' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabNavText, welfareTab === 'triage' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'क्लीनिकल ट्राइएज' : 'CLINICAL TRIAGE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setWelfareTab('profile')}
            style={[styles.tabNavItem, welfareTab === 'profile' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="person-outline"
              size={13}
              color={welfareTab === 'profile' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabNavText, welfareTab === 'profile' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'अधिकारी प्रोफाइल' : 'OFFICER PROFILE'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Jawan Tactical Navigation Bar */}
      {user.role === 'Jawan' && (
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setJawanTab('checkin')}
            style={[styles.tabNavItem, jawanTab === 'checkin' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="stopwatch-outline"
              size={13}
              color={jawanTab === 'checkin' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.tabNavText, jawanTab === 'checkin' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'चेक-इन' : 'CHECK-IN'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setJawanTab('sathi')}
            style={[styles.tabNavItem, jawanTab === 'sathi' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={13}
              color={jawanTab === 'sathi' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.tabNavText, jawanTab === 'sathi' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'साथी' : 'SATHI'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setJawanTab('leave')}
            style={[styles.tabNavItem, jawanTab === 'leave' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="calendar-outline"
              size={13}
              color={jawanTab === 'leave' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.tabNavText, jawanTab === 'leave' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'छुट्टी' : 'LEAVE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setJawanTab('cert')}
            style={[styles.tabNavItem, jawanTab === 'cert' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color={jawanTab === 'cert' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.tabNavText, jawanTab === 'cert' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'पास' : 'APAR PASS'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setJawanTab('profile')}
            style={[styles.tabNavItem, jawanTab === 'profile' && styles.tabNavItemActive]}
          >
            <Ionicons
              name="person-outline"
              size={13}
              color={jawanTab === 'profile' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.tabNavText, jawanTab === 'profile' && styles.tabNavTextActive]}>
              {lang === 'hi' ? 'प्रोफाइल' : 'PROFILE'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Audit Admin Active Module */}
      {user.role === 'Audit Admin' && auditTab === 'validator' ? (
        <AuditValidatorScreen />
      ) : user.role === 'Commanding Officer' && commanderTab === 'snapshot' ? (
        <CommanderDeskScreen />
      ) : user.role === 'Welfare Officer' && welfareTab === 'triage' ? (
        <WelfareDeskScreen />
      ) : user.role === 'Jawan' && jawanTab === 'checkin' ? (
        <CheckInScreen onComplete={() => setJawanTab('sathi')} />
      ) : user.role === 'Jawan' && jawanTab === 'sathi' ? (
        <AiSathiScreen />
      ) : user.role === 'Jawan' && jawanTab === 'leave' ? (
        <LeaveScreen />
      ) : user.role === 'Jawan' && jawanTab === 'cert' ? (
        <CertificateScreen />
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Authenticated Officer/Soldier Profile Card */}
          <MonochromeCard highlight>
            <View style={styles.badgeRow}>
              <MonochromeBadge label={user.role.toUpperCase()} variant="gold" />
            </View>

            <Text style={styles.title}>{user.rank} {user.full_name}</Text>
            <Text style={styles.subtitle}>
              {user.company ? `${user.company.toUpperCase()} • ` : ''}SERVICE NO: {user.service_number || user.username}
            </Text>
            <Text style={styles.unitText}>104 BATTALION CRPF</Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{lang === 'hi' ? 'तैनाती बटालियन:' : 'ASSIGNED UNIT:'}</Text>
              <Text style={styles.infoValue}>{user.company || '104 Bn HQ'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{lang === 'hi' ? 'बायोमेट्रिक स्थिति:' : 'BIOMETRIC STATUS:'}</Text>
              <Text style={styles.infoValue}>
                {biometricSupported ? (lang === 'hi' ? 'सक्रिय (फिंगरप्रिंट)' : 'Active (Fingerprint)') : (lang === 'hi' ? 'पिन लॉक' : 'PIN Enclave')}
              </Text>
            </View>

            {user.role === 'Jawan' && (
              <View style={styles.jawanQuickActions}>
                <MonochromeButton
                  title={lang === 'hi' ? 'चेक-इन' : 'CHECK-IN'}
                  variant="solid"
                  onPress={() => setJawanTab('checkin')}
                  icon={<Ionicons name="stopwatch" size={13} color="#FFFFFF" />}
                  style={{ flex: 1 }}
                />
                <MonochromeButton
                  title={lang === 'hi' ? 'साथी' : 'SATHI'}
                  variant="secondary"
                  onPress={() => setJawanTab('sathi')}
                  icon={<Ionicons name="chatbubbles" size={13} color="#0F172A" />}
                  style={{ flex: 1 }}
                />
                <MonochromeButton
                  title={lang === 'hi' ? 'छुट्टी' : 'LEAVE'}
                  variant="secondary"
                  onPress={() => setJawanTab('leave')}
                  icon={<Ionicons name="calendar" size={13} color="#0F172A" />}
                  style={{ flex: 1 }}
                />
                <MonochromeButton
                  title={lang === 'hi' ? 'पास' : 'APAR PASS'}
                  variant="secondary"
                  onPress={() => setJawanTab('cert')}
                  icon={<Ionicons name="shield-checkmark" size={13} color="#0F172A" />}
                  style={{ flex: 1 }}
                />
              </View>
            )}
            {user.role === 'Commanding Officer' && (
              <View style={{ marginTop: 14 }}>
                <MonochromeButton
                  title={lang === 'hi' ? 'सामरिक बल स्नैपशॉट खोलें' : 'OPEN COMMAND READINESS SNAPSHOT'}
                  variant="solid"
                  onPress={() => setCommanderTab('snapshot')}
                  icon={<Ionicons name="speedometer" size={14} color="#FFFFFF" />}
                />
              </View>
            )}

            {user.role === 'Welfare Officer' && (
              <View style={{ marginTop: 14 }}>
                <MonochromeButton
                  title={lang === 'hi' ? 'क्लीनिकल ट्राइएज खोलें' : 'OPEN CLINICAL TRIAGE DESK'}
                  variant="solid"
                  onPress={() => setWelfareTab('triage')}
                  icon={<Ionicons name="medkit" size={14} color="#FFFFFF" />}
                />
              </View>
            )}

            {user.role === 'Audit Admin' && (
              <View style={{ marginTop: 14 }}>
                <MonochromeButton
                  title={lang === 'hi' ? 'ऑडिट एवं अखंडता सत्यापन खोलें' : 'OPEN AUDIT & INTEGRITY VALIDATOR'}
                  variant="solid"
                  onPress={() => setAuditTab('validator')}
                  icon={<Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />}
                />
              </View>
            )}
          </MonochromeCard>

          {/* Lock / Exit Enclave Button */}
          <MonochromeButton
            title={lang === 'hi' ? 'एनक्लेव लॉक करें एवं बाहर निकलें' : 'LOCK ENCLAVE & LOGOUT'}
            variant="outline"
            onPress={logout}
            style={styles.logoutActionBtn}
          />
        </ScrollView>
      )}

      {/* Field Trench & Air-Gap Sync Modal */}
      <TrenchSyncModal
        visible={showTrenchModal}
        onClose={() => {
          setShowTrenchModal(false);
          refreshTrenchState();
        }}
        onSyncComplete={refreshTrenchState}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 12,
  },
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabNavItemActive: {
    borderBottomColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  tabNavText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  tabNavTextActive: {
    color: '#0F172A',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  unitText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  jawanQuickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  logoutActionBtn: {
    marginTop: 14,
  },
});
