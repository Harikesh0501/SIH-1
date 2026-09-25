"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, loginUser, registerUser, sendOtp, verifyOtp, logoutUser, getCurrentUser } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize session from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('rakshak_token');
        const storedUser = getCurrentUser();

        if (storedToken && storedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          // Verify with backend
          try {
            const verifyRes = await api.get('/auth/me');
            setUser(verifyRes.data);
          } catch {
            // Token expired or invalid, fallback to stored user or clear
            setUser(storedUser);
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setError(null);
    setLoading(true);
    try {
      const data = await loginUser(username, password);
      setUser(data.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid Service ID or Password. Access Denied.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setError(null);
    setLoading(true);
    try {
      const data = await registerUser(payload);
      setUser(data.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please verify credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      logoutUser();
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
