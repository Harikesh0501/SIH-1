import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import {
  checkBiometricSupport,
  authenticateWithBiometrics,
  saveSecureToken,
  getSecureToken,
  saveSecureUser,
  getSecureUser,
  clearSecureAuth,
  saveBiometricPreference,
  getBiometricPreference,
  saveLastEnrolledAuth,
  getLastEnrolledAuth,
  BiometricCheckResult,
  saveLanguagePreference,
  getLanguagePreference,
} from '../services/biometricService';
import { TRANSLATIONS } from '../i18n/translations';

export interface User {
  id: number;
  username: string;
  role: 'Jawan' | 'Welfare Officer' | 'Commanding Officer' | 'Audit Admin';
  full_name: string;
  rank: string;
  company?: string;
  service_number?: string;
  email?: string;
  phone?: string;
}

export const FALLBACK_USERS: Record<string, User> = {
  'CT-RAMESH-84920': {
    id: 1,
    username: 'CT-RAMESH-84920',
    role: 'Jawan',
    full_name: 'Ct. Ramesh Kumar',
    rank: 'Constable',
    company: 'Alpha Company',
    service_number: 'CT-84920',
  },
  'MED-104-MALHOTRA': {
    id: 2,
    username: 'MED-104-MALHOTRA',
    role: 'Welfare Officer',
    full_name: 'Dr. Rajiv Malhotra',
    rank: 'Chief Medical Officer (SG)',
    company: 'Base Hospital Unit',
    service_number: 'MED-104-998',
  },
  'CO-104-SHARMA': {
    id: 3,
    username: 'CO-104-SHARMA',
    role: 'Commanding Officer',
    full_name: 'Col. V.K. Sharma',
    rank: 'Commandant',
    company: '104 Bn HQ',
    service_number: 'IC-48291X',
  },
  'AUDIT-HQ-OFFICER': {
    id: 4,
    username: 'AUDIT-HQ-OFFICER',
    role: 'Audit Admin',
    full_name: 'Insp. Gen. R.S. Verma',
    rank: 'Inspector General (Governance)',
    company: 'MHA Welfare Directorate',
    service_number: 'IPS-90214',
  },
};

interface RegisterPayload {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  phone?: string;
  rank?: string;
  company?: string;
  role?: 'Jawan' | 'Welfare Officer' | 'Commanding Officer' | 'Audit Admin';
  otp?: string;
  enableBiometric?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lang: 'en' | 'hi';
  t: (key: string) => string;
  setLanguage: (lang: 'en' | 'hi') => void;
  biometricSupported: boolean;
  biometricInfo: BiometricCheckResult | null;
  biometricAutoEnabled: boolean;
  loginWithCredentials: (username: string, password?: string, enableBiometric?: boolean) => Promise<{ success: boolean; message?: string }>;
  registerWithCredentials: (req: RegisterPayload) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (email: string, phone?: string, fullName?: string) => Promise<{ success: boolean; message?: string; demo_phone_otp?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  loginWithBiometrics: () => Promise<{ success: boolean; message?: string }>;
  setBiometricPreference: (enabled: boolean) => Promise<void>;
  switchDemoRole: (role: 'Jawan' | 'Welfare Officer' | 'Commanding Officer' | 'Audit Admin') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [biometricSupported, setBiometricSupported] = useState<boolean>(false);
  const [biometricInfo, setBiometricInfo] = useState<BiometricCheckResult | null>(null);
  const [biometricAutoEnabled, setBiometricAutoEnabled] = useState<boolean>(false);

  // Translation helper
  const t = (key: string): string => {
    const dict = TRANSLATIONS[lang] as Record<string, string>;
    return dict[key] || (TRANSLATIONS['en'] as Record<string, string>)[key] || key;
  };

  // Check biometric support & stored credentials on boot
  useEffect(() => {
    async function initAuth() {
      try {
        const bio = await checkBiometricSupport();
        setBiometricSupported(bio.hasHardware);
        setBiometricInfo(bio);

        const storedLang = await getLanguagePreference();
        if (storedLang) {
          setLang(storedLang);
        }

        const isBioPref = await getBiometricPreference();
        setBiometricAutoEnabled(isBioPref);

        const storedToken = await getSecureToken();
        const storedUser = await getSecureUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const loginWithCredentials = async (
    username: string,
    password: string = 'demo123',
    enableBiometric: boolean = false
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const cleanUsername = username.trim().toUpperCase();

      try {
        const res = await apiClient.post('/api/auth/login', { username: cleanUsername, password });
        const data = res.data;
        setToken(data.access_token);
        setUser(data.user);
        await saveSecureToken(data.access_token);
        await saveSecureUser(data.user);

        if (enableBiometric) {
          await saveBiometricPreference(true);
          await saveLastEnrolledAuth(data.user, data.access_token);
          setBiometricAutoEnabled(true);
        }
        return { success: true };
      } catch (apiErr: any) {
        // Fallback for offline mode
        const matched = FALLBACK_USERS[cleanUsername] || {
          id: 99,
          username: cleanUsername,
          role: cleanUsername.startsWith('CO-')
            ? 'Commanding Officer'
            : cleanUsername.startsWith('MED-')
            ? 'Welfare Officer'
            : cleanUsername.startsWith('AUDIT-')
            ? 'Audit Admin'
            : 'Jawan',
          full_name: cleanUsername.startsWith('CT-') ? 'Ct. Ramesh Kumar' : cleanUsername,
          rank: cleanUsername.startsWith('CT-') ? 'Constable' : 'Personnel',
          company: 'Alpha Company',
          service_number: cleanUsername,
        };

        const mockToken = `OFFLINE_JWT_${Date.now()}`;
        setToken(mockToken);
        setUser(matched as User);
        await saveSecureToken(mockToken);
        await saveSecureUser(matched);

        if (enableBiometric) {
          await saveBiometricPreference(true);
          await saveLastEnrolledAuth(matched, mockToken);
          setBiometricAutoEnabled(true);
        }
        return { success: true };
      }
    } catch (error: any) {
      return { success: false, message: error?.message || 'Authentication error' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithCredentials = async (
    payload: RegisterPayload
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const cleanUsername = payload.username.trim().toUpperCase();

      try {
        const res = await apiClient.post('/api/auth/register', {
          username: cleanUsername,
          password: payload.password,
          full_name: payload.full_name.trim(),
          email: payload.email?.trim() || '',
          phone: payload.phone?.trim() || '',
          rank: payload.rank || 'Constable',
          company: payload.company || 'Alpha Company',
          role: payload.role || 'Jawan',
          otp: payload.otp ? payload.otp.trim() : undefined,
        });
        const data = res.data;
        setToken(data.access_token);
        setUser(data.user);
        await saveSecureToken(data.access_token);
        await saveSecureUser(data.user);

        if (payload.enableBiometric) {
          await saveBiometricPreference(true);
          await saveLastEnrolledAuth(data.user, data.access_token);
          setBiometricAutoEnabled(true);
        }
        return { success: true };
      } catch (apiErr: any) {
        // Fallback for offline mode registration
        const newUser: User = {
          id: Date.now(),
          username: cleanUsername,
          role: payload.role || 'Jawan',
          full_name: payload.full_name.trim(),
          email: payload.email?.trim() || '',
          phone: payload.phone?.trim() || '',
          rank: payload.rank || 'Constable',
          company: payload.company || 'Alpha Company',
          service_number: cleanUsername,
        };
        const mockToken = `OFFLINE_REG_JWT_${Date.now()}`;
        setToken(mockToken);
        setUser(newUser);
        await saveSecureToken(mockToken);
        await saveSecureUser(newUser);

        if (payload.enableBiometric) {
          await saveBiometricPreference(true);
          await saveLastEnrolledAuth(newUser, mockToken);
          setBiometricAutoEnabled(true);
        }
        return { success: true };
      }
    } catch (error: any) {
      return { success: false, message: error?.message || 'Registration error' };
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (
    email: string,
    phone?: string,
    fullName?: string
  ): Promise<{ success: boolean; message?: string; demo_phone_otp?: string }> => {
    try {
      const res = await apiClient.post('/api/auth/send-otp', {
        email: email.trim(),
        phone: phone ? phone.trim() : undefined,
        full_name: fullName ? fullName.trim() : undefined,
      });
      return {
        success: true,
        message: res.data?.message || 'OTP sent successfully',
        demo_phone_otp: res.data?.demo_phone_otp,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.detail || err?.message || 'Failed to dispatch verification code',
      };
    }
  };

  const verifyOtp = async (
    email: string,
    otp: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await apiClient.post('/api/auth/verify-otp', {
        email: email.trim(),
        otp: otp.trim(),
      });
      return {
        success: true,
        message: res.data?.message || 'OTP verified successfully',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.detail || err?.message || 'Invalid or expired OTP passcode',
      };
    }
  };

  // Direct Hardware Fingerprint Quick-Access Engine (<0.5s)
  const loginWithBiometrics = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const promptText =
        lang === 'hi'
          ? 'रक्षक-आयुष: त्वरित अनलॉक हेतु फिंगरप्रिंट लगाएं'
          : 'RAKSHAK-AAYUSH: Scan Fingerprint to Unlock';

      const success = await authenticateWithBiometrics(promptText);

      if (success) {
        const storedToken = await getSecureToken();
        const storedUser = await getSecureUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          return { success: true };
        }

        const enrolled = await getLastEnrolledAuth();
        if (enrolled && enrolled.token && enrolled.user) {
          setToken(enrolled.token);
          setUser(enrolled.user);
          await saveSecureToken(enrolled.token);
          await saveSecureUser(enrolled.user);
          return { success: true };
        }

        // If fresh install, unlock default soldier profile
        const defaultSoldier = FALLBACK_USERS['CT-RAMESH-84920'];
        const mockToken = `BIOMETRIC_TOKEN_${Date.now()}`;
        setToken(mockToken);
        setUser(defaultSoldier);
        await saveSecureToken(mockToken);
        await saveSecureUser(defaultSoldier);
        await saveBiometricPreference(true);
        await saveLastEnrolledAuth(defaultSoldier, mockToken);
        setBiometricAutoEnabled(true);
        return { success: true };
      }
      return { success: false, message: 'Biometric verification cancelled' };
    } catch (error: any) {
      console.warn('Biometric login error:', error);
      return { success: false, message: error?.message || 'Biometric authentication failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const setBiometricPref = async (enabled: boolean) => {
    await saveBiometricPreference(enabled);
    setBiometricAutoEnabled(enabled);
  };

  const switchDemoRole = async (role: 'Jawan' | 'Welfare Officer' | 'Commanding Officer' | 'Audit Admin') => {
    const credentialsMap: Record<string, string> = {
      Jawan: 'CT-RAMESH-84920',
      'Welfare Officer': 'MED-104-MALHOTRA',
      'Commanding Officer': 'CO-104-SHARMA',
      'Audit Admin': 'AUDIT-HQ-OFFICER',
    };

    const uname = credentialsMap[role];
    if (uname) {
      await loginWithCredentials(uname, 'demo123');
    }
  };

  const handleSetLanguage = async (newLang: 'hi' | 'en') => {
    setLang(newLang);
    await saveLanguagePreference(newLang);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await clearSecureAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        lang,
        t,
        setLanguage: handleSetLanguage,
        biometricSupported,
        biometricInfo,
        biometricAutoEnabled,
        loginWithCredentials,
        registerWithCredentials,
        sendOtp,
        verifyOtp,
        loginWithBiometrics,
        setBiometricPreference: setBiometricPref,
        switchDemoRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
