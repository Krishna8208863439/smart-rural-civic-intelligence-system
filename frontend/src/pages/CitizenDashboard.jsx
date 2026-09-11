import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ReliabilityBadge from '../components/ReliabilityBadge';
import { translateData, translateCategory } from '../utils/translateData';
import {

  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function CitizenDashboard() {
  const { t, i18n } = useTranslation();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    const fetchCitizenIssues = async () => {
      try {
        setLoading(true);
        const res = await api.get('/issues?limit=50');
        setIssues(res.data.issues || []);
      } catch (err) {
        console.error('Fetch issues error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCitizenIssues();
  }, []);

  const filteredIssues = issues.filter((i) => {
    if (filterStatus !== 'All' && i.status !== filterStatus) return false;
    if (filterCategory !== 'All' && i.category !== filterCategory) return false;
    return true;
  });

  const pendingCount = issues.filter((i) => ['NEW', 'VALIDATED'].includes(i.status)).length;
  const inProgressCount = issues.filter((i) => ['ASSIGNED', 'UNDER ACTION'].includes(i.status)).length;
  const resolvedCount = issues.filter((i) => ['ACTION COMPLETED', 'MONITORING', 'VERIFIED RESOLVED'].includes(i.status)).length;

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {i18n.language === 'mr' ? 'नागरिक नागरी डॅशबोर्ड' : i18n.language === 'hi' ? 'नागरिक शिकायत डैशबोर्ड' : 'Citizen Civic Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {i18n.language === 'mr'
              ? 'गावातील तक्रारींची स्थिती ट्रॅक करा, पुरावा विश्वासार्हता व नागरिक पडताळणी पहा.'
              : i18n.language === 'hi'
              ? 'ग्राम शिकायतों की स्थिति ट्रैक करें, साक्ष्य विश्वसनीयता और नागरिक सत्यापन देखें।'
              : 'Track submitted village complaints, view evidence reliability ratings, and community validations.'}
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{i18n.language === 'mr' ? 'नवीन तक्रार नोंदवा' : i18n.language === 'hi' ? 'नई समस्या दर्ज करें' : 'Report New Problem'}</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {i18n.language === 'mr' ? 'एकूण तक्रारी' : i18n.language === 'hi' ? 'कुल शिकायतें' : 'Total Reports'}
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{issues.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {i18n.language === 'mr' ? 'गाव परिसर' : i18n.language === 'hi' ? 'ग्राम क्षेत्र' : 'Village area'}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {i18n.language === 'mr' ? 'तपासणी प्रलंबित' : i18n.language === 'hi' ? 'समीक्षा लंबित' : 'Pending Review'}
          </div>
          <div className="text-3xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            {i18n.language === 'mr' ? 'कर्मचारी नियुक्ती प्रलंबित' : i18n.language === 'hi' ? 'कार्यकर्ता सौंपना प्रतीक्षित' : 'Awaiting worker dispatch'}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {i18n.language === 'mr' ? 'काम चालू आहे' : i18n.language === 'hi' ? 'कार्य प्रगति पर' : 'Work in Progress'}
          </div>
          <div className="text-3xl font-black text-indigo-600 mt-1">{inProgressCount}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">
            {i18n.language === 'mr' ? 'ग्रामपंचायत पथक घटनास्थळी' : i18n.language === 'hi' ? 'पंचायत टीम मौके पर' : 'Panchayat field team on site'}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {i18n.language === 'mr' ? 'निवारण झाले' : i18n.language === 'hi' ? 'समाधान हुआ' : 'Resolved'}
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{resolvedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {i18n.language === 'mr' ? 'नागरिकांकडून पुष्टी' : i18n.language === 'hi' ? 'नागरिकों द्वारा सत्यापित' : 'Community corroborated'}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>{i18n.language === 'mr' ? 'फिल्टर:' : i18n.language === 'hi' ? 'फ़िल्टर:' : 'Filter:'}</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="All">{i18n.language === 'mr' ? 'सर्व स्थिती' : i18n.language === 'hi' ? 'सभी स्थितियां' : 'All Statuses'}</option>
            <option value="NEW">{t('status.NEW') || 'NEW'}</option>
            <option value="VALIDATED">{t('status.VALIDATED') || 'VALIDATED'}</option>
            <option value="ASSIGNED">{t('status.ASSIGNED') || 'ASSIGNED'}</option>
            <option value="UNDER ACTION">{t('status.UNDER ACTION') || 'UNDER ACTION'}</option>
            <option value="ACTION COMPLETED">{t('status.ACTION COMPLETED') || 'ACTION COMPLETED'}</option>
            <option value="MONITORING">{t('status.MONITORING') || 'MONITORING'}</option>
            <option value="VERIFIED RESOLVED">{t('status.VERIFIED RESOLVED') || 'VERIFIED RESOLVED'}</option>
            <option value="REOPENED">{t('status.REOPENED') || 'REOPENED'}</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="All">{i18n.language === 'mr' ? 'सर्व प्रकार' : i18n.language === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
            <option value="Waste accumulation">{t('categories.Waste accumulation') || 'Waste accumulation'}</option>
            <option value="Drainage blockage">{t('categories.Drainage blockage') || 'Drainage blockage'}</option>
            <option value="Water leakage">{t('categories.Water leakage') || 'Water leakage'}</option>
            <option value="Damaged road">{t('categories.Damaged road') || 'Damaged road'}</option>
            <option value="Streetlight failure">{t('categories.Streetlight failure') || 'Streetlight failure'}</option>
            <option value="Water supply">{t('categories.Water supply') || 'Water supply'}</option>
            <option value="Sanitation">{t('categories.Sanitation') || 'Sanitation'}</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredIssues.length} of {issues.length} issues
        </div>
      </div>

      {/* Issues Cards List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading civic reports...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <p className="text-sm font-semibold text-slate-700">No civic issues match the selected filters.</p>
          <button
            onClick={() => {
              setFilterStatus('All');
              setFilterCategory('All');
            }}
            className="mt-3 text-xs text-emerald-700 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue._id}
              onClick={() => navigate(`/issues/${issue._id}`)}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-soft hover:shadow-hover hover:border-emerald-300 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge level={issue.priority?.level} score={issue.priority?.score} showScore />
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {translateCategory(issue.category, i18n.language)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {translateData(issue.title, i18n.language)}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {translateData(issue.description, i18n.language)}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{translateData(issue.location?.landmark || issue.location?.address, i18n.language)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                  {issue.assignedWorker && (
                    <div className="text-emerald-700 font-medium">
                      Lead: {issue.assignedWorker.name}
                    </div>
                  )}
                </div>

                {/* Resolution Status & Feedback Callout */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  {issue.status === 'VERIFIED RESOLVED' && !issue.citizenFeedback?.rating && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold animate-pulse">
                      ⭐ Action Needed: Inspect Proof & Provide Feedback
                    </span>
                  )}
                  {issue.citizenFeedback?.rating && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                      ✓ Your Feedback: {issue.citizenFeedback.rating}★ ({issue.citizenFeedback.satisfied ? 'Satisfied' : 'Unsatisfied'})
                    </span>
                  )}
                  {issue.completionDetails?.images?.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                      📸 Resolution Proof Available
                    </span>
                  )}
                </div>
              </div>


              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <ReliabilityBadge level={issue.reliabilityLevel} score={issue.reliabilityScore} />
                <span className="text-xs text-emerald-700 font-bold group-hover:underline flex items-center space-x-1">
                  <span>Track Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
