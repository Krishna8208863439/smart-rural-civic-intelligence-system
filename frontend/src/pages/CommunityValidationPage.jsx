import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { translateData, translateCategory } from '../utils/translateData';
import {

  Users,
  ThumbsUp,
  XCircle,
  CheckCircle2,
  MapPin,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function CommunityValidationPage() {
  const { t, i18n } = useTranslation();

  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | MONITORING

  const fetchCommunityIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues?limit=50');
      setIssues(res.data.issues || []);
    } catch (err) {
      console.error('Fetch validation issues error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityIssues();
  }, []);

  const handleVoteQuick = async (issueId, response) => {
    try {
      await api.post(`/issues/${issueId}/validate`, {
        response,
        comment: 'Citizen community verification vote',
      });
      await fetchCommunityIssues();
    } catch (err) {
      alert(err.response?.data?.message || 'Vote failed. Please log in.');
    }
  };

  const displayedIssues = issues.filter((i) => {
    if (activeTab === 'MONITORING') return i.status === 'MONITORING';
    return true;
  });

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>Gram Sabha Public Validation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Community Validation Bulletin
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Empowering village citizens to verify ongoing issues, confirm repairs, or flag persisting problems.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/80 text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-1.5 rounded-full font-semibold transition ${
              activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            All Reports ({issues.length})
          </button>
          <button
            onClick={() => setActiveTab('MONITORING')}
            className={`px-4 py-1.5 rounded-full font-semibold transition ${
              activeTab === 'MONITORING' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Awaiting Resolution Verification ({issues.filter((i) => i.status === 'MONITORING').length})
          </button>
        </div>
      </div>

      {/* Grid of Issues for Validation */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500">Loading community issues...</div>
      ) : displayedIssues.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
          No civic issues currently waiting for community validation.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedIssues.map((issue) => (
            <div
              key={issue._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge level={issue.priority?.level} />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {translateCategory(issue.category, i18n.language)}
                  </span>
                </div>

                <h3
                  onClick={() => navigate(`/issues/${issue._id}`)}
                  className="font-bold text-slate-900 text-base cursor-pointer hover:text-emerald-700 transition"
                >
                  {translateData(issue.title, i18n.language)}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {translateData(issue.description, i18n.language)}
                </p>

                <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{translateData(issue.location?.landmark || issue.location?.address, i18n.language)}</span>
                </div>

                {/* Validation Stats Bar */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-800 font-medium">
                    <div className="font-black text-sm">{issue.communityValidationStats?.confirms || 0}</div>
                    <div className="text-[10px]">{t('buttons.confirmIssue') || 'Confirms'}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-800 font-medium">
                    <div className="font-black text-sm">{issue.communityValidationStats?.stillExists || 0}</div>
                    <div className="text-[10px]">{t('buttons.stillExists') || 'Still Exists'}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 font-medium">
                    <div className="font-black text-sm">{issue.communityValidationStats?.resolved || 0}</div>
                    <div className="text-[10px]">{t('buttons.markResolved') || 'Resolved'}</div>
                  </div>
                </div>
              </div>

              {/* Action Voting Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleVoteQuick(issue._id, 'CONFIRM')}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-semibold text-xs transition flex items-center space-x-1"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('buttons.confirmIssue') || 'Confirm'}</span>
                </button>

                <button
                  onClick={() => handleVoteQuick(issue._id, 'STILL_EXISTS')}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-800 text-slate-700 font-semibold text-xs transition flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t('buttons.stillExists') || 'Still Exists'}</span>
                </button>

                <button
                  onClick={() => handleVoteQuick(issue._id, 'RESOLVED')}
                  className="px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition flex items-center space-x-1 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('buttons.markResolved') || 'Verify Resolved'}</span>
                </button>
              </div>
            </div>

          ))}
        </div>
      )}
    </div>
  );
}
