"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from '../../components/auth/LoginPage';

export default function LoginRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm shadow-sm animate-pulse">
            R
          </div>
          <div className="text-xs font-semibold text-slate-500 font-mono">
            Checking Session...
          </div>
        </div>
      </div>
    );
  }

  return <LoginPage />;
}
