import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getSecureToken } from '../services/biometricService';

// Dynamically determine backend host so physical device in Expo Go, Web, and Emulator connect in real time
const getBackendBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.99.237.128:8000';
  }

  return 'http://localhost:8000';
};

export const API_BASE_URL = getBackendBaseUrl();
console.log('[Rakshak-Aayush Mobile] Resolved API_BASE_URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
apiClient.interceptors.request.use(async (config) => {
  const token = await getSecureToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
