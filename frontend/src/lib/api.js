import axios from 'axios';

const API_BASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) 
  ? process.env.NEXT_PUBLIC_API_BASE_URL 
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token from localStorage/sessionStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rakshak_token') || sessionStorage.getItem('rakshak_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Security response interceptor: auto-logout on 401 Unauthorized token expiry/revocation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rakshak_token');
      localStorage.removeItem('rakshak_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export async function loginUser(username, password) {
  const response = await api.post('/auth/login', { username, password });
  if (response.data.access_token && typeof window !== 'undefined') {
    localStorage.setItem('rakshak_token', response.data.access_token);
    localStorage.setItem('rakshak_user', JSON.stringify(response.data));
  }
  return response.data;
}

export async function registerUser({ username, password, full_name, email, phone, otp, rank = 'Constable', company = 'Alpha Company', role = 'Jawan' }) {
  const response = await api.post('/auth/register', { username, password, full_name, email, phone, otp, rank, company, role });
  if (response.data.access_token && typeof window !== 'undefined') {
    localStorage.setItem('rakshak_token', response.data.access_token);
    localStorage.setItem('rakshak_user', JSON.stringify(response.data));
  }
  return response.data;
}

export async function sendOtp(email, phone, full_name) {
  const response = await api.post('/auth/send-otp', { email, phone, full_name });
  return response.data;
}

export async function verifyOtp(email, otp) {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('rakshak_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function logoutUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('rakshak_token');
  localStorage.removeItem('rakshak_user');
  sessionStorage.removeItem('rakshak_token');
  sessionStorage.removeItem('rakshak_user');
}

// Commander Endpoints
export async function fetchCommanderKPI() {
  const response = await api.get('/commander/readiness-kpi');
  return response.data;
}

export async function fetchCompanyHeatmap() {
  const response = await api.get('/commander/company-heatmap');
  return response.data;
}

export async function simulateCommanderWorkload(payload) {
  const response = await api.post('/commander/simulate-workload', payload);
  return response.data;
}

export async function exportCommanderReport() {
  const response = await api.get('/commander/export-report');
  return response.data;
}

// Welfare & Medical Endpoints
export async function fetchWelfareTriageQueue(params = {}) {
  const response = await api.get('/welfare/triage-queue', { params });
  return response.data;
}

export async function fetchPersonnelDossier(personnelId) {
  const response = await api.get(`/welfare/personnel/${personnelId}/dossier`);
  return response.data;
}

export async function createIntervention(payload) {
  const response = await api.post('/welfare/interventions', payload);
  return response.data;
}

export async function updateInterventionStatus(interventionId, status, clinicalNotes) {
  const response = await api.patch(`/welfare/interventions/${interventionId}/status`, {
    status: status,
    clinical_notes: clinicalNotes,
  });
  return response.data;
}

export async function fetchInterventions(params = {}) {
  const response = await api.get('/welfare/interventions', { params });
  return response.data;
}

// Jawan Self-Service Endpoints (Epic 8)
export async function fetchPrivacyCertificate() {
  const response = await api.get('/jawan/privacy-certificate');
  return response.data;
}

export async function submitDailyCheckin(payload) {
  const response = await api.post('/jawan/check-in', payload);
  return response.data;
}

export async function syncSmartbandBiometrics(payload = {}) {
  const response = await api.post('/jawan/sync-biometrics', payload);
  return response.data;
}

export async function fetchJawanHistory() {
  const response = await api.get('/jawan/my-history');
  return response.data;
}

export async function chatWithAiSathi(payload) {
  const response = await api.post('/jawan/ai-sathi/chat', payload);
  return response.data;
}

export async function submitLeaveRequest(payload) {
  const response = await api.post('/jawan/leave-request', payload);
  return response.data;
}

// Audit & Governance Endpoints (Epic 9)
export async function fetchAuditLogs(params = {}) {
  const response = await api.get('/audit/logs', { params });
  return response.data;
}

export async function fetchComplianceMetrics() {
  const response = await api.get('/audit/compliance-metrics');
  return response.data;
}

export async function verifyAuditLedgerIntegrity() {
  const response = await api.post('/audit/verify-tamper');
  return response.data;
}

export default api;


