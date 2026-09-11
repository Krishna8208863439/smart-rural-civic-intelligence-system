import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { translateData, translateCategory } from '../utils/translateData';
import {
  Wrench,
  Clock,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Play,
  Upload,
  FileCheck,
  Users,
  Sparkles,
} from 'lucide-react';

export default function WorkerDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [workersList, setWorkersList] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('all');

  useEffect(() => {
    // Fetch all field workers for quick switcher
    api
      .get('/workers')
      .then((res) => {
        if (res.data?.workers) setWorkersList(res.data.workers);
      })
      .catch(() => {});
  }, []);

  const fetchWorkerTasks = async (targetId) => {
    try {
      setLoading(true);
      const wId = targetId !== undefined ? targetId : selectedWorkerId;
      const res = await api.get(`/workers/assigned?workerId=${wId}`);
      setIssues(res.data.issues || []);
      setStats(res.data.stats || { total: 0, pending: 0, inProgress: 0, completed: 0 });
    } catch (err) {
      console.error('Worker assigned tasks fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerTasks(selectedWorkerId);
  }, [selectedWorkerId]);

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-2">
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {i18n.language === 'mr' ? 'ग्रामपंचायत क्षेत्रीय कामकाज' : i18n.language === 'hi' ? 'ग्राम पंचायत क्षेत्रीय संचालन' : 'Panchayat Field Operations'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {i18n.language === 'mr' ? 'क्षेत्रीय कर्मचारी कार्य पोर्टल' : i18n.language === 'hi' ? 'क्षेत्रीय कार्यकर्ता कार्य पोर्टल' : 'Field Worker Task Portal'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {i18n.language === 'mr'
              ? 'नियुक्त केलेली कामे पहा, कामाची प्रगती नोंदवा आणि काम पूर्ण झाल्यावर फोटो पुरावा अपलोड करा.'
              : i18n.language === 'hi'
              ? 'सौंपे गए कार्य देखें, कार्य प्रगति दर्ज करें और कार्य पूरा होने पर फोटो प्रमाण अपलोड करें।'
              : 'View assigned work orders, update field progress notes, and upload photo evidence upon completion.'}
          </p>
        </div>

        {/* Dynamic Worker Switcher for instant cross-specialist evaluation */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 px-4 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-extrabold text-slate-700 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>{i18n.language === 'mr' ? 'कर्मचारी कार्य यादी:' : i18n.language === 'hi' ? 'कार्यकर्ता कार्य सूची:' : 'Field Lead Queue:'}</span>
          </div>
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">
              {i18n.language === 'mr' ? '🌐 सर्व क्षेत्रीय कामे (सर्व विशेषज्ञ)' : i18n.language === 'hi' ? '🌐 सभी कार्य (सभी विशेषज्ञ)' : '🌐 All Field Tasks (All Specialists)'}
            </option>
            {user?.role === 'worker' && user?.id && (
              <option value={user.id}>
                ⭐ {i18n.language === 'mr' ? 'माझी कामे' : i18n.language === 'hi' ? 'मेरे सौंपे गए कार्य' : 'Assigned Directly to Me'} ({user.name})
              </option>
            )}
            {workersList.map((w) => (
              <option key={w._id} value={w._id}>
                👤 {w.name} ({translateData(w.specialization, i18n.language)}) {w._id === user?.id ? (i18n.language === 'mr' ? '⭐ [सक्रिय खाते]' : i18n.language === 'hi' ? '⭐ [सक्रिय खाता]' : '⭐ [Active Session]') : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filter Specialist Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setSelectedWorkerId('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
            selectedWorkerId === 'all'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>🌐 {i18n.language === 'mr' ? 'सर्व क्षेत्रीय कामे' : i18n.language === 'hi' ? 'सभी कार्य' : 'All Tasks'}</span>
        </button>

        {user?.role === 'worker' && user?.id && (
          <button
            type="button"
            onClick={() => setSelectedWorkerId(user.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
              selectedWorkerId === user.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>⭐ {i18n.language === 'mr' ? 'माझी कामे' : i18n.language === 'hi' ? 'मेरे कार्य' : 'My Tasks'} ({user.name.split(' ')[0]})</span>
          </button>
        )}

        {workersList.map((w) => (
          <button
            key={w._id}
            type="button"
            onClick={() => setSelectedWorkerId(w._id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
              selectedWorkerId === w._id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>
              {w.specialization?.includes('Water') ? '💧' : w.specialization?.includes('Sanitation') ? '🗑️' : '🛣️'}{' '}
              {w.name.split(' ')[0]} ({translateData(w.specialization, i18n.language)})
            </span>
          </button>
        ))}
      </div>

      {/* Worker Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {i18n.language === 'mr' ? 'एकूण नियुक्त कामे' : i18n.language === 'hi' ? 'कुल सौंपे गए कार्य' : 'Assigned Orders'}
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{stats.total}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {i18n.language === 'mr' ? 'काम सुरू करणे बाकी' : i18n.language === 'hi' ? 'प्रारंभ होना बाकी' : 'Pending Start'}
          </div>
          <div className="text-3xl font-black text-amber-600 mt-1">{stats.pending}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {i18n.language === 'mr' ? 'काम चालू आहे' : i18n.language === 'hi' ? 'कार्य प्रगति पर' : 'In Progress'}
          </div>
          <div className="text-3xl font-black text-indigo-600 mt-1">{stats.inProgress}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {i18n.language === 'mr' ? 'पूर्ण / निरीक्षण' : i18n.language === 'hi' ? 'पूर्ण / निगरानी' : 'Completed / Monitoring'}
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{stats.completed}</div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          {i18n.language === 'mr' ? 'तुमची नियुक्त नागरी कामे' : i18n.language === 'hi' ? 'आपके सौंपे गए नागरिक कार्य' : 'Your Assigned Civic Work Orders'}
        </h2>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            {i18n.language === 'mr' ? 'कामे लोड होत आहेत...' : i18n.language === 'hi' ? 'कार्य लोड हो रहे हैं...' : 'Loading work orders...'}
          </div>
        ) : issues.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
            {i18n.language === 'mr' ? 'सध्या या खात्याला कोणतेही काम नियुक्त केलेले नाही.' : i18n.language === 'hi' ? 'वर्तमान में आपके खाते में कोई कार्य नहीं सौंपा गया है।' : 'No work orders assigned to your account right now.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {issues.map((issue, idx) => (
              <div
                key={issue._id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-soft space-y-4 flex flex-col justify-between ${
                  idx === 0 ? 'border-emerald-400/90 ring-2 ring-emerald-500/25 shadow-md bg-gradient-to-b from-emerald-50/20 to-white' : 'border-slate-200/80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {idx === 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider animate-pulse shadow-xs">
                          {i18n.language === 'mr' ? '⚡ नवीन नियुक्त (LATEST)' : i18n.language === 'hi' ? '⚡ नवीनतम कार्य (LATEST)' : '⚡ JUST ASSIGNED'}
                        </span>
                      )}
                      <StatusBadge status={issue.status} />
                      <PriorityBadge level={issue.priority?.level} />
                      {issue.category && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {translateCategory(issue.category, i18n.language)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">#{issue._id.slice(-6)}</span>
                  </div>

                  {issue.assignedWorker && (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold">
                      <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>
                        {i18n.language === 'mr' ? 'विशेषज्ञ कर्मचारी' : i18n.language === 'hi' ? 'विशेषज्ञ कार्यकर्ता' : 'Specialist Lead'}: {issue.assignedWorker.name} ({translateData(issue.assignedWorker.specialization, i18n.language) || translateData('Field Worker', i18n.language)})
                      </span>
                    </div>
                  )}

                  <h3 className="font-bold text-slate-900 text-base">{translateData(issue.title, i18n.language)}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{translateData(issue.description, i18n.language)}</p>

                  {/* Worker Action Indicator */}
                  <div className="pt-1">
                    {issue.status === 'ASSIGNED' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                        {i18n.language === 'mr' ? '⚡ कृती: काम सुरू करण्यास तयार' : i18n.language === 'hi' ? '⚡ कार्रवाई: कार्य शुरू करने के लिए तैयार' : '⚡ Action: Ready to Start Field Work'}
                      </span>
                    )}
                    {issue.status === 'UNDER ACTION' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-bold">
                        {i18n.language === 'mr' ? '🛠️ कृती: काम चालू आहे — काम पूर्ण झाल्यावर पुरावा अपलोड करा' : i18n.language === 'hi' ? '🛠️ कार्रवाई: कार्य प्रगति पर — समाधान होने पर प्रमाण अपलोड करें' : '🛠️ Action: Work in Progress — Upload Proof when Solved'}
                      </span>
                    )}
                    {issue.status === 'ACTION COMPLETED' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
                        {i18n.language === 'mr' ? '⏳ पुराव्याची प्रशासनाकडून पडताळणी प्रलंबित' : i18n.language === 'hi' ? '⏳ प्रमाण प्रशासन सत्यापन के लिए भेजा गया' : '⏳ Proof Submitted to Admin for Verification'}
                      </span>
                    )}
                    {issue.status === 'VERIFIED RESOLVED' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                        {i18n.language === 'mr' ? '✓ प्रशासनाकडून प्रमाणित' : i18n.language === 'hi' ? '✓ प्रशासन द्वारा सत्यापित' : '✓ Verified by Admin'} {issue.citizenFeedback?.rating ? `• ${i18n.language === 'mr' ? 'नागरिक रेटिंग' : i18n.language === 'hi' ? 'नागरिक रेटिंग' : 'Citizen Rating'}: ${issue.citizenFeedback.rating}★` : ''}
                      </span>
                    )}
                  </div>

                  {/* Proof thumbnail if already uploaded */}
                  {issue.completionDetails?.images?.length > 0 && (
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {i18n.language === 'mr' ? 'निवारण पुरावा:' : i18n.language === 'hi' ? 'समाधान प्रमाण:' : 'Resolution Proof:'}
                      </span>
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-300">
                        <img src={issue.completionDetails.images[0].url} alt="Proof" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center space-x-1 font-semibold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{translateData(issue.location?.landmark || issue.location?.address, i18n.language)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {i18n.language === 'mr' ? 'स्थान निर्देशांक:' : i18n.language === 'hi' ? 'स्थान निर्देशांक:' : 'Coordinates:'} {issue.location?.coordinates?.[1]?.toFixed(4)}, {issue.location?.coordinates?.[0]?.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/issues/${issue._id}`)}
                    className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition"
                  >
                    {i18n.language === 'mr' ? 'काम उघडा व पुरावा द्या' : i18n.language === 'hi' ? 'कार्य खोलें एवं प्रमाण दें' : 'Open Task & Update Proof'}
                  </button>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
