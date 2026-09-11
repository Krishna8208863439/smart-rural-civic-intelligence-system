import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ReliabilityBadge from '../components/ReliabilityBadge';
import { getAiWorkerRecommendation } from '../utils/aiWorkerMatcher';
import {
  translateData,
  translateCategory,
  translateStatus,
  translatePriority,
  translateReliability,
} from '../utils/translateData';
import {

  Search,
  Filter,
  UserCheck,
  ChevronRight,
  MapPin,
  Check,
  X,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

export default function AdminIssues() {
  const { t, i18n } = useTranslation();

  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [recurrenceLevel, setRecurrenceLevel] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Assign Modal
  const [assignModalIssue, setAssignModalIssue] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (status !== 'All') params.append('status', status);
      if (priority !== 'All') params.append('priority', priority);
      if (recurrenceLevel !== 'All') params.append('recurrenceLevel', recurrenceLevel);
      if (search) params.append('search', search);
      params.append('sortBy', sortBy);
      params.append('order', order);
      params.append('limit', '100');

      const [issuesRes, workersRes] = await Promise.all([
        api.get(`/issues?${params.toString()}`),
        api.get('/workers').catch(() => null),
      ]);

      setIssues(issuesRes.data.issues || []);
      if (workersRes?.data?.workers) setWorkers(workersRes.data.workers);
    } catch (err) {
      console.error('Admin fetch issues error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [category, status, priority, recurrenceLevel, sortBy, order]);

  // AI Worker recommendation for modal
  const aiWorkerMatch = useMemo(() => {
    return getAiWorkerRecommendation(assignModalIssue?.category, workers);
  }, [assignModalIssue, workers]);

  useEffect(() => {
    if (assignModalIssue && workers.length > 0) {
      const match = getAiWorkerRecommendation(assignModalIssue.category, workers);
      if (match?.worker) {
        setSelectedWorker(match.worker._id);
      }
    }
  }, [assignModalIssue, workers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIssues();
  };

  const handleAssignWorker = async () => {
    if (!assignModalIssue || !selectedWorker) return;
    try {
      await api.put(`/admin/assign-worker/${assignModalIssue._id}`, { workerId: selectedWorker });
      setAssignModalIssue(null);
      setSelectedWorker('');
      await fetchIssues();
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            All Civic Issues Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search, filter, assign field workers, and oversee civic issue progression.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200">
          Total Records: {issues.length}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, or landmark..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <div className="flex items-center space-x-1 font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filters:</span>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Waste accumulation">{t('categories.Waste accumulation') || 'Waste accumulation'}</option>
            <option value="Drainage blockage">{t('categories.Drainage blockage') || 'Drainage blockage'}</option>
            <option value="Water leakage">{t('categories.Water leakage') || 'Water leakage'}</option>
            <option value="Damaged road">{t('categories.Damaged road') || 'Damaged road'}</option>
            <option value="Streetlight failure">{t('categories.Streetlight failure') || 'Streetlight failure'}</option>
            <option value="Water supply">{t('categories.Water supply') || 'Water supply'}</option>
            <option value="Sanitation">{t('categories.Sanitation') || 'Sanitation'}</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="NEW">{t('status.NEW')}</option>
            <option value="VALIDATED">{t('status.VALIDATED')}</option>
            <option value="ASSIGNED">{t('status.ASSIGNED')}</option>
            <option value="UNDER ACTION">{t('status.UNDER ACTION')}</option>
            <option value="ACTION COMPLETED">{t('status.ACTION COMPLETED')}</option>
            <option value="MONITORING">{t('status.MONITORING')}</option>
            <option value="VERIFIED RESOLVED">{t('status.VERIFIED RESOLVED')}</option>
            <option value="REOPENED">{t('status.REOPENED')}</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">{t('priority.Critical')}</option>
            <option value="High">{t('priority.High')}</option>
            <option value="Medium">{t('priority.Medium')}</option>
            <option value="Low">{t('priority.Low')}</option>
          </select>

          <select
            value={recurrenceLevel}
            onChange={(e) => setRecurrenceLevel(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
          >
            <option value="All">All Recurrence Risks</option>
            <option value="Very High">{translateReliability('Very High', i18n.language)}</option>
            <option value="High">{translateReliability('High', i18n.language)}</option>
            <option value="Medium">{translateReliability('Medium', i18n.language)}</option>
            <option value="Low">{translateReliability('Low', i18n.language)}</option>
          </select>


          <div className="ml-auto flex items-center space-x-1">
            <span className="text-slate-400 font-medium">Sort:</span>
            <button
              onClick={() => {
                setSortBy(sortBy === 'createdAt' ? 'priority' : 'createdAt');
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium flex items-center space-x-1"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{sortBy === 'createdAt' ? 'Date' : 'Priority'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs">Loading records...</div>
        ) : issues.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">No issues found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('form.title')}</th>
                  <th className="py-3.5 px-3">{t('form.category')}</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">{t('form.severity')}</th>
                  <th className="py-3.5 px-3">{t('reliability.level')}</th>
                  <th className="py-3.5 px-3">{t('recurrence.title')}</th>
                  <th className="py-3.5 px-3">Assigned Worker</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 max-w-[260px]">
                      <div className="font-bold text-slate-900 truncate">
                        {translateData(issue.title, i18n.language)}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">
                          {translateData(issue.location?.landmark || issue.location?.address, i18n.language)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700">
                      {translateCategory(issue.category, i18n.language)}
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={issue.status} />
                    </td>

                    <td className="py-3 px-3">
                      <PriorityBadge level={issue.priority?.level} score={issue.priority?.score} showScore />
                    </td>

                    <td className="py-3 px-3">
                      <ReliabilityBadge level={issue.reliabilityLevel} score={issue.reliabilityScore} />
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          issue.recurrenceLevel === 'Very High'
                            ? 'text-rose-600'
                            : issue.recurrenceLevel === 'High'
                            ? 'text-orange-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {translateReliability(issue.recurrenceLevel, i18n.language)} ({issue.recurrenceRisk}%)
                      </span>
                    </td>


                    <td className="py-3 px-3">
                      {issue.assignedWorker ? (
                        <div className="font-semibold text-slate-800 text-xs">{issue.assignedWorker.name}</div>
                      ) : (
                        <button
                          onClick={() => setAssignModalIssue(issue)}
                          className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-[11px]"
                        >
                          + Assign Lead
                        </button>
                      )}
                      {issue.citizenFeedback?.rating && (
                        <div className="text-[11px] text-amber-700 font-bold mt-0.5">
                          ⭐ {issue.citizenFeedback.rating}/5 ({issue.citizenFeedback.satisfied ? 'Satisfied' : 'Unsatisfied'})
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5">
                      {issue.status === 'ACTION COMPLETED' && (
                        <button
                          onClick={() => navigate(`/issues/${issue._id}`)}
                          className="px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
                        >
                          Verify Proof
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/issues/${issue._id}`)}
                        className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-semibold text-xs transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Worker Assignment Modal */}
      {assignModalIssue && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Assign Field Worker Lead</h3>
              <button
                onClick={() => setAssignModalIssue(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-800">{assignModalIssue.title}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Category: {assignModalIssue.category}</div>
            </div>

            {/* AI Auto-Matched Specialist Banner */}
            {aiWorkerMatch && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-950">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>AI Specialist Match:</span>
                    <span className="text-emerald-800 font-extrabold underline decoration-emerald-400">
                      {aiWorkerMatch.worker.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]">
                    {aiWorkerMatch.confidence}% Match
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-tight">
                  Category <strong className="font-bold text-emerald-950">"{assignModalIssue.category}"</strong> automatically matched specialist <strong className="font-bold text-emerald-950">{aiWorkerMatch.worker.name}</strong> ({aiWorkerMatch.worker.specialization}).
                </p>
                <div className="text-[10px] text-emerald-700 italic">
                  💡 {aiWorkerMatch.reason}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Field Worker</label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800"
              >
                <option value="">Choose worker...</option>
                {workers.map((w) => {
                  const isMatch = aiWorkerMatch?.worker?._id === w._id;
                  return (
                    <option key={w._id} value={w._id}>
                      {w.name} — {w.specialization} ({w.activeTasks || 0} active tasks) {isMatch ? '⭐ [AI Best Match]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setAssignModalIssue(null)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignWorker}
                disabled={!selectedWorker}
                className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
