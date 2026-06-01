'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/utils/api';
import { KeyRound, Mail, AlertTriangle, Send } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token exists, direct to dashboard
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('gsp_token');
      if (token) {
        router.push('/admin/dashboard');
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('gsp_token', data.token);
      localStorage.setItem('gsp_admin_name', data.name);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials or connection failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen w-full flex items-center justify-center p-4">
      {/* Visual background abstract designs */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(20,184,166,0.1),transparent_60%)] pointer-events-none"></div>

      <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full relative z-10 text-left">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <img 
            src="/GSPlogoTransperant.png" 
            alt="Global Service Point Logo" 
            className="h-12 w-auto" 
          />
          <div className="flex flex-col">
            <h2 className="text-xl font-extrabold text-white">Administrator Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Sign in with authorized corporate credentials</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-4 rounded-xl flex gap-2.5 items-start text-xs mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5 text-sm">
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@globalservicepoint.com"
                className="w-full bg-slate-950 border border-slate-850 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-semibold placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-850 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-semibold placeholder:text-slate-600"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Secure Sign In</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
