import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { MonochromeButton } from '../../components/common';

export type UserRole = 'Jawan' | 'Welfare Officer' | 'Commanding Officer' | 'Audit Admin';

interface RoleOption {
  role: UserRole;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'Jawan',
    titleEn: 'Field Jawan (Soldier)',
    titleHi: 'फील्ड जवान (सैनिक)',
    descEn: 'Patrol duties, 15s daily check-in, AI Sathi, leave requests',
    descHi: 'गश्त, 15-सेकंड दैनिक चेक-इन, एआई साथी, अवकाश आवेदन',
    icon: 'shield-checkmark-outline',
    badge: 'FIELD DUTY',
  },
  {
    role: 'Welfare Officer',
    titleEn: 'Medical & Welfare Officer',
    titleHi: 'कल्याण एवं चिकित्सा अधिकारी',
    descEn: 'Battalion triage queue, psychological support, interventions',
    descHi: 'बटालियन ट्रायज कतार, मानसिक स्वास्थ्य, हस्तक्षेप प्रबंधन',
    icon: 'medkit-outline',
    badge: 'MEDICAL UNIT',
  },
  {
    role: 'Commanding Officer',
    titleEn: 'Commanding Officer',
    titleHi: 'कमांडिंग ऑफिसर (कमांडेंट)',
    descEn: 'Readiness KPI, anonymized heatmap, workload simulation',
    descHi: 'बटालियन तत्परता केपीआई, गोपनीयता हीटमैप, कार्यभार सिमुलेशन',
    icon: 'ribbon-outline',
    badge: 'HQ COMMAND',
  },
  {
    role: 'Audit Admin',
    titleEn: 'Audit Administrator',
    titleHi: 'ऑडिट एवं गवर्नेंस प्रशासक',
    descEn: 'Zero-trust cryptographic validation, immutable audit log',
    descHi: 'शून्य-विश्वास क्रिप्टोग्राफ़िक सत्यापन, अपरिवर्तनीय ऑडिट बहीखाता',
    icon: 'document-text-outline',
    badge: 'COMPLIANCE',
  },
];

const getRoleDefaults = (role: UserRole) => {
  switch (role) {
    case 'Commanding Officer':
      return { rank: 'Commandant', company: '104 Bn HQ' };
    case 'Welfare Officer':
      return { rank: 'Chief Medical Officer (SG)', company: 'Base Hospital Unit' };
    case 'Audit Admin':
      return { rank: 'Inspector General (Governance)', company: 'MHA Welfare Directorate' };
    case 'Jawan':
    default:
      return { rank: 'Constable', company: 'Alpha Company' };
  }
};

export const LoginScreen: React.FC = () => {
  const {
    lang,
    setLanguage,
    biometricSupported,
    biometricAutoEnabled,
    loginWithBiometrics,
    loginWithCredentials,
    registerWithCredentials,
    sendOtp,
    isLoading,
  } = useAuth();

  // Mode: Controlled via bottom link only (no top segment tabs!)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register form fields
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Jawan');
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [enableBiometric, setEnableBiometric] = useState(true);

  // OTP Verification Modal states
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [regOtp, setRegOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPromptedBiometric, setHasPromptedBiometric] = useState(false);

  // Timer for OTP resend countdown
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Automatic biometric popup on sign-in load if previously configured
  useEffect(() => {
    if (authMode === 'login' && biometricSupported && biometricAutoEnabled && !hasPromptedBiometric) {
      setHasPromptedBiometric(true);
      const timer = setTimeout(() => {
        loginWithBiometrics().catch((err) => {
          console.log('Auto biometric dismissed:', err);
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [authMode, biometricSupported, biometricAutoEnabled, hasPromptedBiometric]);

  const handleManualLogin = async () => {
    if (!username.trim()) {
      setErrorMessage(lang === 'hi' ? 'कृपया सर्विस नंबर दर्ज करें' : 'Please enter Service ID / Force ID');
      return;
    }
    if (!password.trim()) {
      setErrorMessage(lang === 'hi' ? 'कृपया पासवर्ड दर्ज करें' : 'Please enter Password');
      return;
    }
    setErrorMessage(null);
    const res = await loginWithCredentials(username, password);
    if (!res.success && res.message) {
      setErrorMessage(res.message);
    }
  };

  const handleInitiateRegister = async () => {
    if (
      !regFullName.trim() ||
      !regUsername.trim() ||
      !regEmail.trim() ||
      !regPhone.trim() ||
      !regPassword.trim()
    ) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया सभी आवश्यक फ़ील्ड (ईमेल और फ़ोन सहित) भरें'
          : 'Please fill all required fields (including email & phone)'
      );
      return;
    }

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया मान्य आधिकारिक ईमेल पता दर्ज करें'
          : 'Please enter a valid official email address'
      );
      return;
    }

    setErrorMessage(null);
    setOtpError(null);
    setIsSendingOtp(true);

    const res = await sendOtp(regEmail, regPhone, regFullName);
    setIsSendingOtp(false);

    if (res.success) {
      setRegOtp('');
      setShowOtpModal(true);
      setOtpCountdown(60);
    } else {
      setErrorMessage(res.message || 'Failed to dispatch verification code');
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setOtpError(null);
    setIsSendingOtp(true);
    const res = await sendOtp(regEmail, regPhone, regFullName);
    setIsSendingOtp(false);
    if (res.success) {
      setOtpCountdown(60);
    } else {
      setOtpError(res.message || 'Failed to resend code');
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!regOtp.trim() || regOtp.trim().length !== 6) {
      setOtpError(
        lang === 'hi'
          ? 'कृपया 6 अंकों का ओटीपी कोड दर्ज करें'
          : 'Please enter the 6-digit verification code'
      );
      return;
    }

    setOtpError(null);
    setIsVerifyingOtp(true);
    const defaults = getRoleDefaults(regRole);
    const res = await registerWithCredentials({
      username: regUsername,
      full_name: regFullName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      rank: defaults.rank,
      company: defaults.company,
      role: regRole,
      otp: regOtp.trim(),
      enableBiometric,
    });
    setIsVerifyingOtp(false);

    if (res.success) {
      setShowOtpModal(false);
    } else {
      setOtpError(res.message || 'Verification failed. Please check the code.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <View style={styles.contentCard}>
            {/* Top Brand Header */}
            <View style={styles.topRow}>
              <View style={styles.crestRow}>
                <View style={styles.crestIcon}>
                  <Ionicons name="shield-checkmark" size={14} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.crestText}>RAKSHAK-AAYUSH</Text>
                  <Text style={styles.crestSub}>DEFENSE HEALTH ENCLAVE</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.langPill}
                onPress={() => setLanguage(lang === 'hi' ? 'en' : 'hi')}
              >
                <Text style={styles.langPillText}>{lang === 'hi' ? 'ENG' : 'हिंदी'}</Text>
              </TouchableOpacity>
            </View>

            {/* Form Title & Subtitle */}
            <View style={styles.titleWrap}>
              <Text style={styles.titleText}>
                {authMode === 'login'
                  ? (lang === 'hi' ? 'सुरक्षित सामरिक लॉगिन' : 'TACTICAL SIGN IN')
                  : (lang === 'hi' ? 'नया जवान पंजीकरण' : 'PERSONNEL REGISTRATION')}
              </Text>
              <Text style={styles.titleSub}>
                {authMode === 'login'
                  ? (lang === 'hi'
                      ? 'अधिकारिक रक्षा क्रेडेंशियल द्वारा साइन इन करें'
                      : 'Enter your defense credentials to authenticate')
                  : (lang === 'hi'
                      ? 'नया खाता बनाने के लिए विवरण दर्ज करें'
                      : 'Create your authenticated defense profile')}
              </Text>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* MODE 1: LOGIN FORM */}
            {authMode === 'login' ? (
              <View style={styles.formContainer}>
                {/* Service ID Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {lang === 'hi' ? 'सर्विस नंबर / फ़ोर्स आईडी' : 'SERVICE NUMBER / FORCE ID'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={lang === 'hi' ? 'उदा. CT-84920 या 2026J101' : 'e.g. CT-84920 or 2026J101'}
                      placeholderTextColor="#94A3B8"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {lang === 'hi' ? 'गोपनीय पासवर्ड' : 'PASSWORD'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={lang === 'hi' ? 'पासवर्ड दर्ज करें' : 'Enter Password'}
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Biometric Quick Unlock (If Supported) */}
                {biometricSupported && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => loginWithBiometrics()}
                    style={styles.biometricBtn}
                  >
                    <Ionicons name="finger-print" size={20} color="#D97706" style={{ marginRight: 8 }} />
                    <Text style={styles.biometricBtnText}>
                      {lang === 'hi' ? 'बायोमेट्रिक / फ़िंगरप्रिंट से अनलॉक करें' : 'Quick Unlock with Biometrics'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Submit Button */}
                <MonochromeButton
                  title={
                    isLoading
                      ? (lang === 'hi' ? 'प्रमाणीकरण जारी...' : 'AUTHENTICATING...')
                      : (lang === 'hi' ? 'साइन इन करें' : 'SIGN IN TO ENCLAVE')
                  }
                  variant="solid"
                  disabled={isLoading}
                  onPress={handleManualLogin}
                  style={styles.submitBtn}
                />

                {/* Bottom Link to Register Now */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                  }}
                  style={styles.switchAuthLink}
                >
                  <Text style={styles.switchAuthText}>
                    {lang === 'hi' ? 'अकाउंट नहीं है? ' : "Don't have an account? "}
                    <Text style={styles.switchAuthHighlight}>
                      {lang === 'hi' ? 'नया पंजीकरण करें (Register Now)' : 'Register Now'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* MODE 2: REGISTER FORM */
              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{lang === 'hi' ? 'पूरा नाम *' : 'FULL NAME *'}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="id-card-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={lang === 'hi' ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                      placeholderTextColor="#94A3B8"
                      value={regFullName}
                      onChangeText={setRegFullName}
                    />
                  </View>
                </View>

                {/* Service Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {lang === 'hi' ? 'सर्विस नंबर / फ़ोर्स आईडी *' : 'SERVICE NUMBER / FORCE ID *'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={lang === 'hi' ? 'उदा. 14092482X' : 'e.g. 14092482X'}
                      placeholderTextColor="#94A3B8"
                      value={regUsername}
                      onChangeText={setRegUsername}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {lang === 'hi' ? 'ईमेल आईडी (ओटीपी सत्यापन हेतु) *' : 'EMAIL ID (FOR OTP VERIFICATION) *'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={lang === 'hi' ? 'उदा. soldier@crpf.gov.in' : 'e.g. soldier@crpf.gov.in'}
                      placeholderTextColor="#94A3B8"
                      value={regEmail}
                      onChangeText={setRegEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Phone Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {lang === 'hi' ? 'मोबाइल नंबर *' : 'MOBILE NUMBER *'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={lang === 'hi' ? 'उदा. 9876543210' : 'e.g. 9876543210'}
                      placeholderTextColor="#94A3B8"
                      value={regPhone}
                      onChangeText={setRegPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Military Role Selection Trigger */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {lang === 'hi' ? 'पद एवं भूमिका (रोल चुनें) *' : 'SELECT ROLE / DESIGNATION *'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.rolePickerButton}
                    onPress={() => setShowRoleModal(true)}
                  >
                    <View style={styles.rolePickerLeft}>
                      <View style={styles.rolePickerIconWrap}>
                        <Ionicons
                          name={ROLE_OPTIONS.find((r) => r.role === regRole)?.icon || 'shield-outline'}
                          size={18}
                          color="#0F172A"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rolePickerValue} numberOfLines={1}>
                          {lang === 'hi'
                            ? ROLE_OPTIONS.find((r) => r.role === regRole)?.titleHi
                            : ROLE_OPTIONS.find((r) => r.role === regRole)?.titleEn}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rolePickerRight}>
                      <View style={styles.roleBadgePill}>
                        <Text style={styles.roleBadgePillText}>
                          {ROLE_OPTIONS.find((r) => r.role === regRole)?.badge}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={18} color="#475569" style={{ marginLeft: 6 }} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {lang === 'hi' ? 'पासवर्ड बनाएं *' : 'CREATE PASSWORD *'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={lang === 'hi' ? 'नया पासवर्ड दर्ज करें' : 'Enter New Password'}
                      placeholderTextColor="#94A3B8"
                      value={regPassword}
                      onChangeText={setRegPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Biometric Enrollment */}
                {biometricSupported && (
                  <View style={styles.biometricToggleBox}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="finger-print" size={18} color="#0F172A" style={{ marginRight: 6 }} />
                        <Text style={styles.bioToggleTitle}>
                          {lang === 'hi' ? 'फिंगरप्रिंट लॉगिन सक्षम करें' : 'Enable Fingerprint Login'}
                        </Text>
                      </View>
                      <Text style={styles.bioToggleSub}>
                        {lang === 'hi'
                          ? 'अगली बार बिना पासवर्ड 1-टैप फिंगरप्रिंट से लॉगिन करें।'
                          : 'Sign in directly with fingerprint next time.'}
                      </Text>
                    </View>
                    <Switch
                      value={enableBiometric}
                      onValueChange={setEnableBiometric}
                      trackColor={{ false: '#CBD5E1', true: '#0F172A' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                )}

                {/* Submit Register Button */}
                <MonochromeButton
                  title={
                    isSendingOtp
                      ? (lang === 'hi' ? 'ओटीपी भेजा जा रहा है...' : 'SENDING PASSCODE...')
                      : (lang === 'hi' ? 'ओटीपी सत्यापन एवं पंजीकरण' : 'VERIFY EMAIL & REGISTER')
                  }
                  variant="solid"
                  disabled={isLoading || isSendingOtp}
                  onPress={handleInitiateRegister}
                  style={styles.submitBtn}
                />

                {/* Bottom Link back to Sign In */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  style={styles.switchAuthLink}
                >
                  <Text style={styles.switchAuthText}>
                    {lang === 'hi' ? 'पहले से खाता है? ' : 'Already have an account? '}
                    <Text style={styles.switchAuthHighlight}>
                      {lang === 'hi' ? 'साइन इन करें (Sign In)' : 'Sign In'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Institutional Security Notice */}
            <View style={styles.securityNotice}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.securityText}>
                {lang === 'hi'
                  ? 'सुरक्षित सत्र • सभी लॉगिन ऑडिट लॉग में दर्ज होते हैं'
                  : 'Encrypted Session • 104 BN CRPF Sovereign Network'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Role Selection Modal */}
      <Modal visible={showRoleModal} transparent animationType="fade" onRequestClose={() => setShowRoleModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowRoleModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      {lang === 'hi' ? 'सैन्य पद / भूमिका चुनें' : 'SELECT MILITARY ROLE'}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {lang === 'hi' ? 'अधिकार एवं कार्यक्षेत्र निर्धारित करें' : 'Assign functional role enclave'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowRoleModal(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={20} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <View style={styles.roleOptionsList}>
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = regRole === opt.role;
                    return (
                      <TouchableOpacity
                        key={opt.role}
                        activeOpacity={0.7}
                        onPress={() => {
                          setRegRole(opt.role);
                          setShowRoleModal(false);
                        }}
                        style={[styles.roleOptionCard, isSelected && styles.roleOptionCardSelected]}
                      >
                        <View style={[styles.roleOptionIconBox, isSelected && styles.roleOptionIconBoxSelected]}>
                          <Ionicons name={opt.icon} size={18} color="#0F172A" />
                        </View>
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text style={[styles.roleOptionTitle, isSelected && styles.roleOptionTitleSelected]}>
                            {lang === 'hi' ? opt.titleHi : opt.titleEn}
                          </Text>
                          <Text style={styles.roleOptionDesc}>
                            {lang === 'hi' ? opt.descHi : opt.descEn}
                          </Text>
                        </View>
                        <View style={[styles.roleRadioCircle, isSelected && styles.roleRadioCircleSelected]}>
                          {isSelected && <View style={styles.roleRadioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal visible={showOtpModal} transparent animationType="slide" onRequestClose={() => setShowOtpModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowOtpModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      {lang === 'hi' ? 'ईमेल सुरक्षा कोड दर्ज करें' : 'ENTER VERIFICATION CODE'}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {lang === 'hi' ? 'सत्यापन के लिए ओटीपी भेजा गया है' : 'Sent to official email inbox'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowOtpModal(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={20} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                {/* Recipient Display */}
                <View style={styles.otpRecipientBox}>
                  <Ionicons name="mail" size={16} color="#D97706" style={{ marginRight: 8 }} />
                  <Text style={styles.otpRecipientEmail} numberOfLines={1}>
                    {regEmail}
                  </Text>
                  <View style={styles.otpVerifiedBadge}>
                    <Text style={styles.otpVerifiedBadgeText}>BREVO 2FA</Text>
                  </View>
                </View>

                {otpError && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.errorText}>{otpError}</Text>
                  </View>
                )}

                {/* 6 Digit Input */}
                <View style={styles.otpInputContainer}>
                  <TextInput
                    style={styles.otpCodeInput}
                    value={regOtp}
                    onChangeText={(val) => {
                      const clean = val.replace(/[^0-9]/g, '').slice(0, 6);
                      setRegOtp(clean);
                      if (otpError) setOtpError(null);
                    }}
                    placeholder="------"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus={true}
                  />
                  <Text style={styles.otpInputHelp}>
                    {lang === 'hi'
                      ? '6 अंकों का कोड ईमेल इनबॉक्स में देखें'
                      : 'Check inbox for 6-digit code'}
                  </Text>
                </View>

                {/* Verify Button */}
                <MonochromeButton
                  title={
                    isVerifyingOtp
                      ? (lang === 'hi' ? 'सत्यापन हो रहा है...' : 'VERIFYING CODE...')
                      : (lang === 'hi' ? 'ओटीपी सत्यापित कर प्रवेश करें' : 'VERIFY & COMPLETE REGISTRATION')
                  }
                  variant="solid"
                  disabled={isVerifyingOtp || regOtp.trim().length !== 6}
                  onPress={handleVerifyAndRegister}
                  style={styles.submitBtn}
                />

                {/* Resend and Edit Actions */}
                <View style={styles.otpActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={otpCountdown > 0 || isSendingOtp}
                    onPress={handleResendOtp}
                    style={styles.otpResendBtn}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={14}
                      color={otpCountdown > 0 ? '#94A3B8' : '#0F172A'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.otpResendText,
                        otpCountdown > 0 && { color: '#94A3B8' },
                      ]}
                    >
                      {otpCountdown > 0
                        ? `${lang === 'hi' ? 'पुनः भेजें' : 'Resend in'} (${otpCountdown}s)`
                        : lang === 'hi'
                        ? 'कोड पुनः भेजें'
                        : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowOtpModal(false)}
                    style={styles.otpEditBtn}
                  >
                    <Text style={styles.otpEditText}>
                      {lang === 'hi' ? 'विवरण बदलें' : 'Edit details'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  crestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crestIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  crestText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.6,
  },
  crestSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  langPill: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langPillText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  titleWrap: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  titleSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 2,
  },
  biometricBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  submitBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 10,
  },
  switchAuthLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  switchAuthText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  switchAuthHighlight: {
    color: '#0F172A',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  rolePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
  },
  rolePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  rolePickerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rolePickerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  rolePickerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadgePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  biometricToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 2,
  },
  bioToggleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  bioToggleSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  roleOptionsList: {
    gap: 10,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  roleOptionCardSelected: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
  },
  roleOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleOptionIconBoxSelected: {
    backgroundColor: '#E2E8F0',
  },
  roleOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  roleOptionTitleSelected: {
    color: '#0F172A',
    fontWeight: '900',
  },
  roleOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  roleRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  roleRadioCircleSelected: {
    borderColor: '#0F172A',
  },
  roleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
  },
  otpRecipientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  otpRecipientEmail: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  otpVerifiedBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  otpVerifiedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  otpInputContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  otpCodeInput: {
    width: '100%',
    height: 54,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 10,
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 10,
  },
  otpInputHelp: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
  },
  otpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  otpResendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  otpResendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  otpEditBtn: {
    paddingVertical: 4,
  },
  otpEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});
