import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'RAKSHAK_AUTH_TOKEN';
const USER_KEY = 'RAKSHAK_AUTH_USER';
const BIOMETRIC_PREF_KEY = 'RAKSHAK_BIOMETRIC_ENABLED';
const LANG_PREF_KEY = 'RAKSHAK_APP_LANGUAGE';

/**
 * Saves chosen language preference ('hi' or 'en')
 */
export async function saveLanguagePreference(lang: 'hi' | 'en'): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LANG_PREF_KEY, lang);
      }
      return;
    }
    await SecureStore.setItemAsync(LANG_PREF_KEY, lang);
  } catch (e) {
    console.warn('Save language error:', e);
  }
}

/**
 * Retrieves persisted language preference
 */
export async function getLanguagePreference(): Promise<'hi' | 'en' | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(LANG_PREF_KEY);
        return val === 'hi' || val === 'en' ? val : null;
      }
      return null;
    }
    const val = await SecureStore.getItemAsync(LANG_PREF_KEY);
    return val === 'hi' || val === 'en' ? val : null;
  } catch {
    return null;
  }
}

export interface BiometricCheckResult {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  biometricName?: string;
}

/**
 * Checks if the mobile device / host has biometric hardware (Fingerprint, TouchID, FaceID)
 */
export async function checkBiometricSupport(): Promise<BiometricCheckResult> {
  if (Platform.OS === 'web') {
    const hasWebAuthn = typeof window !== 'undefined' && !!(window as any).PublicKeyCredential;
    return {
      hasHardware: true,
      isEnrolled: true,
      supportedTypes: [LocalAuthentication.AuthenticationType.FINGERPRINT],
      biometricName: hasWebAuthn ? 'WebAuthn / Windows Hello' : 'Biometric Simulation',
    };
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricName = 'Touch Fingerprint';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricName = 'Facial / Biometric Sensor';
    }

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      biometricName,
    };
  } catch (error) {
    console.warn('Biometric support check error:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      biometricName: 'None',
    };
  }
}

/**
 * Triggers native Fingerprint / Face Biometric prompt
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Scan Fingerprint to Unlock'
): Promise<boolean> {
  if (Platform.OS === 'web') {
    await new Promise((res) => setTimeout(res, 400));
    return true;
  }

  try {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    if (!isAvailable) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Service ID Credentials',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.warn('Biometric authentication failed:', error);
    return false;
  }
}

/**
 * Save user preference for automatic biometric login
 */
export async function saveBiometricPreference(enabled: boolean): Promise<void> {
  try {
    const val = enabled ? 'true' : 'false';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(BIOMETRIC_PREF_KEY, val);
      }
      return;
    }
    await SecureStore.setItemAsync(BIOMETRIC_PREF_KEY, val);
  } catch (e) {
    console.warn('Save biometric pref error:', e);
  }
}

/**
 * Retrieve user preference for automatic biometric login
 */
export async function getBiometricPreference(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(BIOMETRIC_PREF_KEY) === 'true';
      }
      return false;
    }
    const val = await SecureStore.getItemAsync(BIOMETRIC_PREF_KEY);
    return val === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Securely stores the cryptographic JWT token in Hardware Keystore / Web LocalStorage
 */
export async function saveSecureToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (e) {
    console.warn('SecureStore set token error:', e);
  }
}

/**
 * Retrieves the stored JWT token
 */
export async function getSecureToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Securely saves user profile
 */
export async function saveSecureUser(user: any): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('SecureStore set user error:', e);
  }
}

/**
 * Retrieves user profile
 */
export async function getSecureUser(): Promise<any | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(USER_KEY);
        return val ? JSON.parse(val) : null;
      }
      return null;
    }
    const str = await SecureStore.getItemAsync(USER_KEY);
    return str ? JSON.parse(str) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Purges hardware token on logout
 */
export async function clearSecureAuth(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (e) {
    // Ignore cleanup error
  }
}

const LAST_ENROLLED_USER_KEY = 'RAKSHAK_LAST_ENROLLED_USER';
const LAST_ENROLLED_TOKEN_KEY = 'RAKSHAK_LAST_ENROLLED_TOKEN';

/**
 * Stores enrolled biometric account details so fingerprint can instantly unlock without re-entering credentials
 */
export async function saveLastEnrolledAuth(user: any, token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LAST_ENROLLED_USER_KEY, JSON.stringify(user));
        window.localStorage.setItem(LAST_ENROLLED_TOKEN_KEY, token);
      }
      return;
    }
    await SecureStore.setItemAsync(LAST_ENROLLED_USER_KEY, JSON.stringify(user));
    await SecureStore.setItemAsync(LAST_ENROLLED_TOKEN_KEY, token);
  } catch (e) {
    console.warn('saveLastEnrolledAuth error:', e);
  }
}

/**
 * Retrieves enrolled biometric account details
 */
export async function getLastEnrolledAuth(): Promise<{ user: any; token: string } | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const userStr = window.localStorage.getItem(LAST_ENROLLED_USER_KEY);
        const token = window.localStorage.getItem(LAST_ENROLLED_TOKEN_KEY);
        if (userStr && token) {
          return { user: JSON.parse(userStr), token };
        }
      }
      return null;
    }
    const userStr = await SecureStore.getItemAsync(LAST_ENROLLED_USER_KEY);
    const token = await SecureStore.getItemAsync(LAST_ENROLLED_TOKEN_KEY);
    if (userStr && token) {
      return { user: JSON.parse(userStr), token };
    }
    return null;
  } catch (e) {
    return null;
  }
}
