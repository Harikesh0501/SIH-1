import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getSecureToken } from '../services/biometricService';

// Current confirmed LAN IPv4 of host machine
export const CURRENT_LAN_IP = '10.99.237.203';

// Dynamically determine backend host so physical device in Expo Go, Web, and Emulator connect in real time
export const getBackendBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  // If hostUri is a real local IP address (e.g. 192.168.x.x or 10.x.x.x or 172.x.x.x)
  if (hostUri && !hostUri.includes('exp.direct') && !hostUri.includes('localhost') && !hostUri.includes('127.0.0.1')) {
    const rawIp = hostUri.split(':')[0];
    if (rawIp && rawIp.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `http://${rawIp}:8000`;
    }
  }

  // Fallback to active LAN IP of development machine
  return `http://${CURRENT_LAN_IP}:8000`;
};

export const API_BASE_URL = getBackendBaseUrl();
console.log('[Rakshak-Aayush Mobile] Active API_BASE_URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000, // 25s timeout for mobile ML inference & network latency
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

// Response error handler with clear diagnostics
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    console.warn(`[API Error] ${status || 'NET_ERR'} on ${url}:`, error?.response?.data || error?.message);
    return Promise.reject(error);
  }
);

