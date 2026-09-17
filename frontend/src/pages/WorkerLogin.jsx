import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Wrench, Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function WorkerLogin() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password.trim());
      const userRole = (user?.role || '').toLowerCase();
      if (userRole === 'worker' || userRole === 'admin' || userRole === 'field_worker') {
        navigate('/worker');
      } else {
        navigate('/citizen');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Invalid credentials. Please verify your Worker ID / Mobile and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/60">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Portal</span>
        </Link>
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-800 to-teal-700 flex items-center justify-center mx-auto text-white shadow-lg shadow-emerald-800/20 mb-4">
          <Wrench className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Gram Panchayat Chandoli Field Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          GramSetu AI — Field Worker Portal
        </h1>
        <p className="mt-2 text-xs text-slate-500 font-medium">
          Sign in to view assigned civic repair work orders, update progress, and upload resolution proof.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-soft space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Worker ID, Email, or Mobile Number
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. GRAM-WKR-001 or 9876543210"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{loading ? 'Verifying Field Credentials...' : 'Sign In to Field Portal'}</span>
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-1">
            <span>Are you a citizen or admin? </span>
            <Link to="/login" className="font-bold text-emerald-700 hover:underline">
              Main Portal Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
