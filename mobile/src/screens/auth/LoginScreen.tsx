import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { MonochromeButton } from '../../components/common';

export const LoginScreen: React.FC = () => {
  const {
    lang,
    setLanguage,
    biometricSupported,
    biometricAutoEnabled,
    loginWithBiometrics,
    loginWithCredentials,
    isLoading,
  } = useAuth();

  // Login credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPromptedBiometric, setHasPromptedBiometric] = useState(false);

  // Automatic biometric prompt on sign-in load if previously configured
  useEffect(() => {
    if (biometricSupported && biometricAutoEnabled && !hasPromptedBiometric) {
      setHasPromptedBiometric(true);
      const timer = setTimeout(() => {
        loginWithBiometrics().catch((err) => {
          console.log('Auto biometric dismissed:', err);
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [biometricSupported, biometricAutoEnabled, hasPromptedBiometric]);

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
          {/* Main Tactical Login Enclave Card */}
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
                {lang === 'hi' ? 'सुरक्षित सामरिक लॉगिन' : 'TACTICAL SIGN IN'}
              </Text>
              <Text style={styles.titleSub}>
                {lang === 'hi'
                  ? 'अधिकारिक रक्षा क्रेडेंशियल द्वारा साइन इन करें'
                  : 'Enter your defense credentials to authenticate'}
              </Text>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Input Form Fields */}
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
            </View>

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
    gap: 16,
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
    marginTop: 4,
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
});
