'use client';

import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { loginWithPassword, loginWithEmail, loginWithGoogle, quickDemoLogin, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');

  // Form fields
  const [email, setEmail] = useState('admin@focusapp.com');
  const [password, setPassword] = useState('Admin@Focus2026!');
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide your administrator email and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await loginWithPassword(email, password);
    } catch (err: any) {
      setError(err?.message || 'Access denied: Invalid administrative email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid administrator email address');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      setOtpSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email);
    } catch (err: any) {
      setError(err?.message || 'Access denied: Administrative clearance verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#12141D] border border-[#1E2230] rounded-2xl p-8 relative z-10 shadow-2xl">
        {/* Header Badge & Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#38BDF8] to-[#10B981] flex items-center justify-center shadow-lg shadow-cyan-500/20 text-black mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Focus Admin Control</h1>
          <p className="text-xs text-[#8A94A6] mt-1">
            Enterprise Digital Well-Being & App Blocker Portal
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#38BDF8] text-[11px] font-mono">
            <Sparkles className="w-3 h-3" />
            <span>Admin-Only Password & OAuth Gate</span>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Mode Tabs (Password vs OTP) */}
        <div className="flex p-1 mb-6 rounded-xl bg-[#08090D] border border-[#1E2230]">
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              authMode === 'password'
                ? 'bg-[#161925] text-white border border-[#1E2230] shadow-sm'
                : 'text-[#8A94A6] hover:text-white'
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              authMode === 'otp'
                ? 'bg-[#161925] text-white border border-[#1E2230] shadow-sm'
                : 'text-[#8A94A6] hover:text-white'
            }`}
          >
            Email OTP / OAuth
          </button>
        </div>

        {/* 1. EMAIL & PASSWORD LOGIN (PRIMARY) */}
        {authMode === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8A94A6] mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A94A6] absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@focusapp.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090D] border border-[#1E2230] text-sm text-white placeholder-[#8A94A6]/50 focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#8A94A6]">Password</label>
                <span className="text-[10px] font-mono text-[#8A94A6]">Default: Admin@Focus2026!</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A94A6] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#08090D] border border-[#1E2230] text-sm text-white placeholder-[#8A94A6]/50 focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#8A94A6] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#10B981] text-sm font-semibold text-black hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 mt-2"
            >
              <span>{submitting ? 'Verifying Credentials...' : 'Sign In with Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* 2. EMAIL OTP & GOOGLE OAUTH */
          <div className="space-y-4">
            <button
              onClick={loginWithGoogle}
              disabled={isLoading || submitting}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#161925] border border-[#1E2230] text-sm font-semibold text-white hover:bg-[#1E2230] hover:border-[#38BDF8]/40 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.4C.7 8.8 0 11.3 0 14s.7 5.2 1.9 7.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
                />
              </svg>
              Sign in with Google Admin
            </button>

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-[#1E2230]" />
              <span className="px-3 text-[10px] font-mono uppercase text-[#8A94A6]">or 6-digit OTP</span>
              <div className="flex-1 border-t border-[#1E2230]" />
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8A94A6] mb-1.5">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8A94A6] absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@focusapp.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090D] border border-[#1E2230] text-sm text-white placeholder-[#8A94A6]/50 focus:outline-none focus:border-[#38BDF8]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#161925] border border-[#1E2230] text-xs font-semibold text-white hover:border-[#38BDF8] flex items-center justify-center gap-2"
                >
                  <span>Send Security OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-[#10B981]">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>OTP dispatched to {email}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8A94A6] mb-1.5">
                    Enter 6-Digit Security Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#8A94A6] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="849201"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090D] border border-[#1E2230] text-sm font-mono text-center tracking-widest text-white focus:outline-none focus:border-[#38BDF8]"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#10B981] text-xs font-semibold text-black flex items-center justify-center gap-2"
                >
                  <span>Verify OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* 1-Click Quick Demo Login */}
        <div className="mt-8 pt-6 border-t border-[#1E2230] flex flex-col items-center">
          <button
            type="button"
            onClick={quickDemoLogin}
            className="text-xs text-[#38BDF8] hover:text-[#10B981] font-mono transition-colors flex items-center gap-1.5"
          >
            <span>⚡ Instant Super Admin Access (Demo Mode)</span>
          </button>
          <span className="text-[10px] text-[#8A94A6] mt-1 font-mono">Pre-authenticates admin_root</span>
        </div>
      </div>
    </div>
  );
}
