import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ReliabilityBadge from '../components/ReliabilityBadge';
import {
  translateData,
  translateCategory,
  translateStatus,
  translatePriority,
  translateReliability,
} from '../utils/translateData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  Users,
  Database,
  Wrench,
  AlertTriangle,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const COLORS = ['#059669', '#0284c7', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#64748b'];

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [workersList, setWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTableTab, setActiveTableTab] = useState('recent');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [res, workersRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/workers').catch(() => ({ data: { workers: [] } })),
        ]);
        setData(res.data);
        setWorkersList(workersRes.data?.workers || []);
      } catch (err) {
        console.error('Admin dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const { kpis, charts, alerts = [], recentIssues = [] } = data || {
    kpis: {},
    charts: { categories: [], statuses: [], priorities: [], monthlyTrends: [], recurrenceRisks: [] },
    alerts: [],
    recentIssues: [],
  };

  // Dynamically translate chart labels whenever the selected language changes
  const translatedMonthlyTrends = useMemo(() => {
    return (charts.monthlyTrends || []).map((m) => ({
      ...m,
      month: translateData(m.month, i18n.language),
    }));
  }, [charts.monthlyTrends, i18n.language]);

  const translatedCategories = useMemo(() => {
    return (charts.categories || []).map((c) => ({
      ...c,
      name: translateCategory(c.name, i18n.language),
    }));
  }, [charts.categories, i18n.language]);

  const translatedStatuses = useMemo(() => {
    return (charts.statuses || []).map((s) => ({
      ...s,
      name: translateStatus(s.name, i18n.language),
    }));
  }, [charts.statuses, i18n.language]);

  const translatedRecurrenceRisks = useMemo(() => {
    return (charts.recurrenceRisks || []).map((r) => ({
      ...r,
      rawName: r.name,
      name: translateData(r.name, i18n.language),
    }));
  }, [charts.recurrenceRisks, i18n.language]);

  const verificationIssues = useMemo(() => {
    return (recentIssues || []).filter((i) =>
      ['ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'].includes(i.status)
    );
  }, [recentIssues]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-sm">{t('adminDashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('adminDashboard.opCenter')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('adminDashboard.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('adminDashboard.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/workers"
            className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5 text-emerald-200" />
            <span>Field Workers & Tasks</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black">
              {workersList.length || 0}
            </span>
          </Link>
          <Link
            to="/admin/issues"
            className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            {t('adminDashboard.manageAllIssues')}
          </Link>
        </div>
      </div>

      {/* KPI Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[10px] font-bold uppercase text-slate-500">{t('adminDashboard.totalIssues')}</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{kpis.totalIssues}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[10px] font-bold uppercase text-slate-500">{t('adminDashboard.pendingReview')}</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{kpis.pendingIssues}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[10px] font-bold uppercase text-slate-500">{t('adminDashboard.underAction')}</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{kpis.inProgressIssues}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[10px] font-bold uppercase text-slate-500">{t('adminDashboard.resolved')}</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{kpis.resolvedIssues}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[10px] font-bold uppercase text-slate-500">{t('adminDashboard.reopened')}</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{kpis.reopenedIssues}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[10px] font-bold uppercase text-slate-500">{t('adminDashboard.critical')}</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{kpis.criticalIssues}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[10px] font-bold uppercase text-slate-500">{t('adminDashboard.highRecurrence')}</div>
          <div className="text-2xl font-black text-violet-600 mt-1">{kpis.highRecurrenceIssues}</div>
        </div>

        <Link
          to="/admin/workers"
          className="p-4 rounded-2xl bg-white hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-300 shadow-soft transition group block cursor-pointer"
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-500 group-hover:text-teal-700">
            <span>{t('adminDashboard.activeWorkers')}</span>
            <ArrowRight className="w-3 h-3 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-black text-teal-600 mt-1">{kpis.totalWorkers || workersList.length || 0}</div>
          <div className="text-[9px] text-teal-700 font-bold mt-0.5">Manage Field Staff →</div>
        </Link>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Monthly Reporting vs Resolution Trends */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-1">
            {t('adminDashboard.monthlyTrendsTitle')}
          </h2>
          <p className="text-xs text-slate-500 mb-4">{t('adminDashboard.monthlyTrendsSub')}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={translatedMonthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="reported"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name={t('adminDashboard.reported')}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#059669"
                  strokeWidth={2}
                  name={t('adminDashboard.resolvedLegend')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Issues by Category */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-1">
            {t('adminDashboard.categoryTitle')}
          </h2>
          <p className="text-xs text-slate-500 mb-4">{t('adminDashboard.categorySub')}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={translatedCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#059669" radius={[0, 8, 8, 0]}>
                  {translatedCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Issues by Status */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-1">
            {t('adminDashboard.statusTitle')}
          </h2>
          <p className="text-xs text-slate-500 mb-4">{t('adminDashboard.statusSub')}</p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={translatedStatuses}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {translatedStatuses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Recurrence Risk Distribution */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-1">
            {t('adminDashboard.recurrenceTitle')}
          </h2>
          <p className="text-xs text-slate-500 mb-4">{t('adminDashboard.recurrenceSub')}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={translatedRecurrenceRisks}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                  {translatedRecurrenceRisks.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.rawName === 'Very High' || entry.name.includes('अति')
                          ? '#ef4444'
                          : entry.rawName === 'High' || entry.name.includes('उच्च')
                          ? '#f97316'
                          : entry.rawName === 'Medium' || entry.name.includes('मध्यम')
                          ? '#eab308'
                          : '#10b981'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Live Queue & Alerts Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          {/* Tabs */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTableTab('recent')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTableTab === 'recent'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Incoming Citizen Reports</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
                {recentIssues.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('alerts')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTableTab === 'alerts'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Critical Alerts & Risks</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
                {alerts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('verification')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTableTab === 'verification'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
              <span>
                {i18n.language === 'mr' ? 'दुरुस्ती पुरावा पडताळणी' : i18n.language === 'hi' ? 'समाधान प्रमाण सत्यापन' : 'Resolution Proof Verification'}
              </span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
                {verificationIssues.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('workers')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTableTab === 'workers'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Field Workers & Staff</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
                {workersList.length}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/workers"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Workers Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab 1: Live Incoming Citizen Reports */}
        {activeTableTab === 'recent' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3">{t('adminDashboard.colTitleCategory')}</th>
                  <th className="pb-3">Citizen</th>
                  <th className="pb-3">{t('adminDashboard.colLocation')}</th>
                  <th className="pb-3">{t('adminDashboard.colPriority')}</th>
                  <th className="pb-3">{t('adminDashboard.colReliability')}</th>
                  <th className="pb-3">{t('adminDashboard.colStatus')}</th>
                  <th className="pb-3">Reported At</th>
                  <th className="pb-3 text-right">{t('adminDashboard.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentIssues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No citizen reports registered yet.
                    </td>
                  </tr>
                ) : (
                  recentIssues.map((issue, idx) => (
                    <tr key={issue._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pr-3 font-semibold text-slate-800 max-w-[240px]">
                        <div className="flex items-center space-x-2">
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                              LATEST
                            </span>
                          )}
                          <span className="truncate">{translateData(issue.title, i18n.language)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {translateCategory(issue.category, i18n.language)}
                        </div>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600 max-w-[130px] truncate">
                        <div className="font-medium text-slate-800 truncate">
                          {issue.createdBy?.name || 'Citizen'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {issue.location?.village || 'Chandoli'}
                        </div>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600 max-w-[150px] truncate">
                        {translateData(issue.location?.landmark || issue.location?.address, i18n.language)}
                      </td>
                      <td className="py-3.5 pr-3">
                        <PriorityBadge level={issue.priority?.level || 'Medium'} />
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600">
                        <ReliabilityBadge level={issue.reliabilityLevel || 'Medium'} />
                      </td>
                      <td className="py-3.5 pr-3">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="py-3.5 pr-3 text-slate-500 font-mono text-[11px]">
                        {new Date(issue.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/issues/${issue._id}`)}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition"
                        >
                          Inspect & Dispatch
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Critical Alerts & High-Risk Incidents */}
        {activeTableTab === 'alerts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3">{t('adminDashboard.colTitleCategory')}</th>
                  <th className="pb-3">{t('adminDashboard.colLocation')}</th>
                  <th className="pb-3">{t('adminDashboard.colPriority')}</th>
                  <th className="pb-3">{t('adminDashboard.colRecurrence')}</th>
                  <th className="pb-3">{t('adminDashboard.colReliability')}</th>
                  <th className="pb-3">{t('adminDashboard.colStatus')}</th>
                  <th className="pb-3 text-right">{t('adminDashboard.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pr-3 font-semibold text-slate-800 max-w-[240px]">
                      <div className="truncate">{translateData(alert.title, i18n.language)}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {translateCategory(alert.category, i18n.language)}
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 text-slate-600 max-w-[150px] truncate">
                      {translateData(alert.location?.landmark || alert.location?.address, i18n.language)}
                    </td>
                    <td className="py-3.5 pr-3">
                      <PriorityBadge level={alert.priority?.level} />
                    </td>
                    <td className="py-3.5 pr-3">
                      <span
                        className={`font-semibold ${
                          alert.recurrenceLevel === 'Very High' ? 'text-rose-600' : 'text-orange-600'
                        }`}
                      >
                        {translateData(alert.recurrenceLevel, i18n.language)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-slate-600">
                      {translateReliability(alert.reliabilityLevel, i18n.language)}
                    </td>
                    <td className="py-3.5 pr-3">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/issues/${alert._id}`)}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-semibold transition"
                      >
                        {t('adminDashboard.inspect')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Resolution Proof Verification */}
        {activeTableTab === 'verification' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3">{t('adminDashboard.colTitleCategory')}</th>
                  <th className="pb-3">Assigned Worker</th>
                  <th className="pb-3">Worker Proof Photo</th>
                  <th className="pb-3">Worker Notes</th>
                  <th className="pb-3">{t('adminDashboard.colStatus')}</th>
                  <th className="pb-3 text-right">{t('adminDashboard.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verificationIssues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No worker completion evidence awaiting verification.
                    </td>
                  </tr>
                ) : (
                  verificationIssues.map((issue) => (
                    <tr key={issue._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pr-3 font-semibold text-slate-800 max-w-[240px]">
                        <div className="truncate">{translateData(issue.title, i18n.language)}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {translateCategory(issue.category, i18n.language)}
                        </div>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600 font-medium">
                        {issue.assignedWorker?.name || 'Assigned Specialist'}
                      </td>
                      <td className="py-3.5 pr-3">
                        {issue.completionDetails?.images?.[0]?.url ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-xs">
                            <img
                              src={issue.completionDetails.images[0].url}
                              alt="Proof"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No image</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600 max-w-[200px] truncate text-[11px]">
                        {issue.completionDetails?.notes || 'Work completed to standard.'}
                      </td>
                      <td className="py-3.5 pr-3">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/issues/${issue._id}`)}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition text-xs shadow-xs"
                        >
                          {issue.status === 'VERIFIED RESOLVED' ? 'View Verified' : '✓ Inspect & Verify'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Field Workers & Operational Staff */}
        {activeTableTab === 'workers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Worker ID</th>
                  <th className="pb-3">Worker Name</th>
                  <th className="pb-3">Role / Specialty</th>
                  <th className="pb-3">Assigned Area</th>
                  <th className="pb-3">Mobile</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No field workers registered yet.
                      <div className="mt-3">
                        <Link
                          to="/admin/workers"
                          className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-sm transition"
                        >
                          + Register First Field Worker
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  workersList.map((worker) => (
                    <tr key={worker._id || worker.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pr-3 font-mono font-bold text-emerald-700">
                        {worker.workerId || 'GRAM-WKR-001'}
                      </td>
                      <td className="py-3.5 pr-3">
                        <div className="font-bold text-slate-800">{worker.name}</div>
                        <div className="text-[10px] text-slate-400">{worker.email}</div>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {worker.workerRole || 'General Maintenance'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600 font-medium">
                        {worker.assignedArea || 'All Wards'}
                      </td>
                      <td className="py-3.5 pr-3 text-slate-600 font-mono text-[11px]">
                        {worker.phone || '—'}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            worker.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {worker.isActive !== false ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to="/admin/workers"
                          className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition inline-flex items-center space-x-1"
                        >
                          <span>Manage Staff</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
