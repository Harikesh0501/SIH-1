import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getSecureToken } from '../services/biometricService';

// Live Production Backend URL hosted on Render (Singapore Cloud)
export const LIVE_BACKEND_URL = 'https://sih-1-defq.onrender.com';
export const CURRENT_LAN_IP = '10.99.113.105';

// Connect to live cloud backend so standalone APK, physical device, and Expo connect anywhere on 4G/5G
export const getBackendBaseUrl = (): string => {
  return LIVE_BACKEND_URL;
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
    console.log(`[API Error] ${status || 'NET_ERR'} on ${url}:`, error?.response?.data || error?.message);
    return Promise.reject(error);
  }
);

