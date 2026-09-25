"use client";

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  UserPlus,
  Award,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MILITARY_ROLES = [
  {
    role: 'Jawan',
    title: 'Jawan (Field Soldier)',
    badge: 'Field Duty',
    rank: 'Constable',
    company: 'Alpha Company',
  },
  {
    role: 'Welfare Officer',
    title: 'Medical & Welfare Officer',
    badge: 'Medical Unit',
    rank: 'Chief Medical Officer (SG)',
    company: 'Base Hospital Unit',
  },
  {
    role: 'Commanding Officer',
    title: 'Commanding Officer (Commandant)',
    badge: 'HQ Command',
    rank: 'Commandant',
    company: '104 Bn HQ',
  },
  {
    role: 'Audit Admin',
    title: 'Audit Administrator',
    badge: 'Compliance',
    rank: 'Inspector General (Governance)',
    company: 'MHA Welfare Directorate',
  },
];

export function LoginPage() {
  const { login, register, sendOtp } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [otpStep, setOtpStep] = useState('form'); // 'form' | 'otp_verify'

  // Login form fields (clean - no prefilled test values)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register form fields
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Jawan');

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter your Service ID and Password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await login(username.trim().toUpperCase(), password);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtpStep = async (e) => {
    e.preventDefault();
    if (
      !regFullName.trim() ||
      !regUsername.trim() ||
      !regEmail.trim() ||
      !regPhone.trim() ||
      !regPassword
    ) {
      setErrorMsg('Please fill in all required fields (Name, Service ID, Email, Phone, Password).');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await sendOtp(regEmail.trim(), regPhone.trim(), regFullName.trim());
      setOtpSentMsg(res.message || `Verification code dispatched to ${regEmail}.`);
      setOtpStep('otp_verify');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to dispatch verification OTP. Check email format.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the valid 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const selectedRoleMeta = MILITARY_ROLES.find((r) => r.role === regRole) || MILITARY_ROLES[0];
      await register({
        username: regUsername.trim().toUpperCase(),
        password: regPassword,
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        otp: otpCode.trim(),
        role: regRole,
        rank: selectedRoleMeta.rank,
        company: selectedRoleMeta.company,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-black selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200 bg-white px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center font-black text-xs shadow-xs">
            R
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-950">RAKSHAK-AAYUSH</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          <Shield className="w-3 h-3 text-slate-700" />
          <span>DPDPA §14 Quarantined</span>
        </div>
      </header>

      {/* Main Login / Register Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 shadow-sm">
          
          {/* Card Header */}
          <div className="text-center space-y-1 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-black mx-auto mb-3">
              {authMode === 'login' ? (
                <Lock className="w-5 h-5" />
              ) : otpStep === 'otp_verify' ? (
                <KeyRound className="w-5 h-5 text-amber-600" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </div>
            <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
              {authMode === 'login'
                ? 'Sign In to Tactical Workspace'
                : otpStep === 'otp_verify'
                ? 'Verify Official Email OTP'
                : 'Personnel Registration'}
            </h1>
            <p className="text-xs text-slate-500">
              {authMode === 'login'
                ? 'Enter your authorized Service ID and passcode.'
                : otpStep === 'otp_verify'
                ? `Enter the 6-digit passcode sent to ${regEmail}`
                : 'Register defense personnel with role-based access.'}
            </p>
          </div>

          {/* Success Banner */}
          {otpSentMsg && otpStep === 'otp_verify' && !errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{otpSentMsg}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Service ID / Personnel Number
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Service ID (e.g. 14092482X)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">256-bit BCrypt</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter passcode"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-black hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50 mt-2 active:scale-[0.98] cursor-pointer"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Bottom Register Option Link */}
              <div className="text-center pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setOtpStep('form');
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Don't have an account? <span className="font-semibold text-slate-900 underline">Register</span>
                </button>
              </div>
            </form>
          ) : otpStep === 'otp_verify' ? (
            /* MODE 2 - STEP B: OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 text-center">
                  6-Digit Passcode (Sent to {regEmail})
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-center text-lg font-mono tracking-widest font-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:text-slate-400 placeholder:text-xs placeholder:tracking-normal placeholder:font-normal"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-black hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50 mt-2 active:scale-[0.98] cursor-pointer"
              >
                <span>{loading ? 'Verifying & Creating Profile...' : 'Verify OTP & Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('form');
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Edit Details
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSendOtpStep}
                  className="text-xs text-slate-700 hover:text-black font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend OTP
                </button>
              </div>
            </form>
          ) : (
            /* MODE 2 - STEP A: REGISTRATION DETAILS FORM */
            <form onSubmit={handleSendOtpStep} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Service ID / Personnel Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Award className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. 14092482X"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Official Email ID (For OTP) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. soldier.kumar@defense.gov.in"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Mobile / Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Role Selection Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Assigned Operational Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all appearance-none cursor-pointer"
                  >
                    {MILITARY_ROLES.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.title} ({r.badge})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Create Password <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter confidential passcode"
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-black hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50 mt-2 active:scale-[0.98] cursor-pointer"
              >
                <span>{loading ? 'Sending OTP Code...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Bottom Sign In Option Link */}
              <div className="text-center pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setOtpStep('form');
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Already have an account? <span className="font-semibold text-slate-900 underline">Sign In</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      {/* Bottom Compliance & Security Strip */}
      <footer className="w-full border-t border-slate-200 bg-white py-3 px-6 text-center shrink-0">
        <div className="flex items-center justify-center flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
          <span>TLS 1.3 Encryption</span>
          <span>•</span>
          <span>DPDPA 2023 §14 Decoupled</span>
          <span>•</span>
          <span>MeghRaj Sovereign Cloud Ready</span>
          <span>•</span>
          <span>SHA-256 Non-Repudiation Audit</span>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;
