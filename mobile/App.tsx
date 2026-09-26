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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <TacticalHeader
        onPressSync={() => {
          refreshTrenchState();
          setShowTrenchModal(true);
        }}
        pendingCount={pendingCount}
        isTrenchMode={isTrenchMode}
      />

      {/* Main Screen Content Area */}
      <View style={styles.mainContentContainer}>
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
      </View>

      {/* Modern Fixed Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        {user.role === 'Jawan' && (
          <View style={styles.bottomNavRow}>
            {/* 1. Check-In */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setJawanTab('checkin')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, jawanTab === 'checkin' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={jawanTab === 'checkin' ? 'stopwatch' : 'stopwatch-outline'}
                  size={20}
                  color={jawanTab === 'checkin' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, jawanTab === 'checkin' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'चेक-इन' : 'CHECK-IN'}
              </Text>
            </TouchableOpacity>

            {/* 2. Sathi */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setJawanTab('sathi')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, jawanTab === 'sathi' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={jawanTab === 'sathi' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                  size={20}
                  color={jawanTab === 'sathi' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, jawanTab === 'sathi' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'साथी' : 'AI SATHI'}
              </Text>
            </TouchableOpacity>

            {/* 3. Leave */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setJawanTab('leave')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, jawanTab === 'leave' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={jawanTab === 'leave' ? 'calendar' : 'calendar-outline'}
                  size={20}
                  color={jawanTab === 'leave' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, jawanTab === 'leave' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'छुट्टी' : 'LEAVE'}
              </Text>
            </TouchableOpacity>

            {/* 4. Pass */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setJawanTab('cert')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, jawanTab === 'cert' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={jawanTab === 'cert' ? 'shield-checkmark' : 'shield-checkmark-outline'}
                  size={20}
                  color={jawanTab === 'cert' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, jawanTab === 'cert' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'पास' : 'APAR PASS'}
              </Text>
            </TouchableOpacity>

            {/* 5. Profile */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setJawanTab('profile')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, jawanTab === 'profile' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={jawanTab === 'profile' ? 'person' : 'person-outline'}
                  size={20}
                  color={jawanTab === 'profile' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, jawanTab === 'profile' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'प्रोफाइल' : 'PROFILE'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Welfare Officer Bottom Nav */}
        {user.role === 'Welfare Officer' && (
          <View style={styles.bottomNavRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setWelfareTab('triage')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, welfareTab === 'triage' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={welfareTab === 'triage' ? 'medkit' : 'medkit-outline'}
                  size={20}
                  color={welfareTab === 'triage' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, welfareTab === 'triage' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'क्लीनिकल ट्राइएज' : 'CLINICAL TRIAGE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setWelfareTab('profile')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, welfareTab === 'profile' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={welfareTab === 'profile' ? 'person' : 'person-outline'}
                  size={20}
                  color={welfareTab === 'profile' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, welfareTab === 'profile' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'अधिकारी प्रोफाइल' : 'OFFICER PROFILE'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Commanding Officer Bottom Nav */}
        {user.role === 'Commanding Officer' && (
          <View style={styles.bottomNavRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCommanderTab('snapshot')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, commanderTab === 'snapshot' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={commanderTab === 'snapshot' ? 'speedometer' : 'speedometer-outline'}
                  size={20}
                  color={commanderTab === 'snapshot' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, commanderTab === 'snapshot' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'सामरिक स्नैपशॉट' : 'COMMAND READINESS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCommanderTab('profile')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, commanderTab === 'profile' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={commanderTab === 'profile' ? 'person' : 'person-outline'}
                  size={20}
                  color={commanderTab === 'profile' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, commanderTab === 'profile' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'कमांडेंट प्रोफाइल' : 'COMMANDER PROFILE'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Audit Admin Bottom Nav */}
        {user.role === 'Audit Admin' && (
          <View style={styles.bottomNavRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setAuditTab('validator')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, auditTab === 'validator' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={auditTab === 'validator' ? 'shield-checkmark' : 'shield-checkmark-outline'}
                  size={20}
                  color={auditTab === 'validator' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, auditTab === 'validator' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'ऑडिट सत्यापन' : 'AUDIT VALIDATOR'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setAuditTab('profile')}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomIconPill, auditTab === 'profile' && styles.bottomIconPillActive]}>
                <Ionicons
                  name={auditTab === 'profile' ? 'person' : 'person-outline'}
                  size={20}
                  color={auditTab === 'profile' ? '#0F172A' : '#64748B'}
                />
              </View>
              <Text style={[styles.bottomNavText, auditTab === 'profile' && styles.bottomNavTextActive]}>
                {lang === 'hi' ? 'प्रशासक प्रोफाइल' : 'ADMIN PROFILE'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
  mainContentContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bottomNavContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomIconPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  bottomIconPillActive: {
    backgroundColor: '#F1F5F9',
  },
  bottomNavText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  bottomNavTextActive: {
    color: '#0F172A',
    fontWeight: '800',
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
