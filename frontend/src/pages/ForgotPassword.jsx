import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Step: 1 = Email, 2 = OTP + New Password, 3 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Pre-fill email if passed in state or query
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: cleanEmail });
      if (res.data.success) {
        if (res.data.otp) {
          setDemoOtp(res.data.otp);
        }
        setStep(2);
        setResendCooldown(45);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      if (res.data.success) {
        if (res.data.otp) {
          setDemoOtp(res.data.otp);
        }
        setResendCooldown(45);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        newPassword: newPassword.trim(),
      });

      if (res.data.success) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-3xl bg-emerald-700 flex items-center justify-center mx-auto text-white shadow-md shadow-emerald-700/20 mb-4 transition-transform hover:scale-105">
          <KeyRound className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {step === 3 ? 'Password Reset Complete' : 'Reset Your Password'}
        </h2>
        <p className="mt-2 text-xs text-slate-500 font-medium">
          Smart Rural Civic Intelligence System — Gram Panchayat Chandoli
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-soft space-y-6">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-[11px] font-semibold">
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                1
              </span>
              <span className={step >= 1 ? 'text-emerald-950 font-bold' : 'text-slate-400'}>Email</span>
            </div>
            <div className="h-[2px] w-8 bg-slate-200" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                2
              </span>
              <span className={step >= 2 ? 'text-emerald-950 font-bold' : 'text-slate-400'}>Verify OTP</span>
            </div>
            <div className="h-[2px] w-8 bg-slate-200" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 3 ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                3
              </span>
              <span className={step === 3 ? 'text-emerald-950 font-bold' : 'text-slate-400'}>Complete</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the email address registered with your GramSetu citizen or worker account. We will issue a 6-digit verification code to reset your password.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. citizen1@example.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: OTP + New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-emerald-900 font-medium">
                    Code generated for <strong className="text-emerald-950">{email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* Instant Demo Helper Pill */}
                {demoOtp && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-800 font-medium flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Demo OTP: <code className="bg-white px-1.5 py-0.5 rounded font-bold text-emerald-900 tracking-widest">{demoOtp}</code></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(demoOtp)}
                      className="px-2 py-0.5 rounded-full bg-emerald-700 text-white font-bold text-[10px] hover:bg-emerald-800 transition shadow-sm"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter 6-digit code"
                  required
                  autoFocus
                  className="w-full text-center tracking-[0.5em] font-mono font-bold text-lg py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Reset */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Reset Password & Secure Account</span>
                  </>
                )}
              </button>

              {/* Resend Code / Back */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-emerald-700 font-semibold hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP Code'}
                </button>
                <Link
                  to="/login"
                  className="text-slate-500 font-semibold hover:text-slate-800"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Password Reset Successful!
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Your password has been securely updated. You can now sign in to GramSetu SRCI with your new credentials.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { prefillEmail: email } })}
                  className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
