import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
  translateData,
  translateCategory,
  translateStatus,
} from '../utils/translateData';
import {
  ShieldAlert,
  PlusCircle,
  TrendingDown,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  UserCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function PreventiveManagement() {
  const { t, i18n } = useTranslation();

  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Form State for New Action
  const [category, setCategory] = useState('Waste accumulation');
  const [locationName, setLocationName] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [beforeFrequency, setBeforeFrequency] = useState('8');
  const [notes, setNotes] = useState('');

  // AI recommendations state
  const [aiRecs, setAiRecs] = useState([]);
  const [fetchingRecs, setFetchingRecs] = useState(false);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/prevention/actions');
      setActions(res.data.actions || []);
    } catch (err) {
      console.error('Fetch preventive actions error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchAiRecommendations = async (cat) => {
    try {
      setFetchingRecs(true);
      const res = await api.get(`/prevention/recommendations?category=${cat}`);
      setAiRecs(res.data.recommendations || []);
    } catch (err) {
      console.error('Fetch AI recommendations error:', err);
    } finally {
      setFetchingRecs(false);
    }
  };

  useEffect(() => {
    if (showPlanModal) {
      fetchAiRecommendations(category);
    }
  }, [category, showPlanModal]);

  const handleCreateAction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prevention/action', {
        category,
        locationName: locationName || 'Gram Panchayat Hotspot',
        recommendedAction,
        actionTaken: actionTaken || recommendedAction,
        targetDate,
        beforeFrequency: Number(beforeFrequency) || 5,
        notes,
      });

      setShowPlanModal(false);
      setLocationName('');
      setRecommendedAction('');
      setActionTaken('');
      setNotes('');
      await fetchActions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record preventive action');
    }
  };

  const handleEvaluate = async (actionId, currentBefore) => {
    const afterCount = prompt('Enter observed complaints in the post-action observation window:', '1');
    if (afterCount === null) return;

    try {
      await api.get(`/prevention/effectiveness/${actionId}?afterFrequency=${afterCount}`);
      await fetchActions();
    } catch (err) {
      alert('Evaluation failed');
    }
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>Operational Prevention & Effectiveness Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Preventive Action Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Formulate targeted municipal preventive measures for high-recurrence hotspots and measure post-action effectiveness.
          </p>
        </div>

        <button
          onClick={() => setShowPlanModal(true)}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Formulate Preventive Plan</span>
        </button>
      </div>

      {/* Actions List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Recorded Preventive Plans ({actions.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">Empirical Complaint Reduction Tracker</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading preventive actions...</div>
        ) : actions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No preventive actions recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {actions.map((act) => (
              <div key={act._id} className="p-6 hover:bg-slate-50/70 transition space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {translateCategory(act.category, i18n.language)}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          act.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {translateStatus(act.status, i18n.language)}
                      </span>
                      {act.effectivenessLevel && act.effectivenessLevel !== 'Pending Evaluation' && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                          {t('memory.effectiveness')}: {translateData(act.effectivenessLevel, i18n.language)} ({act.reductionPercentage}% drop)
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{translateData(act.recommendedAction, i18n.language)}</h3>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <span>{t('form.location')}: {translateData(act.location?.name, i18n.language)}</span>
                      <span>•</span>
                      <span>{t('buttons.assignWorker')}: {act.assignedTo?.name || 'Gram Panchayat Team'}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => handleEvaluate(act._id, act.beforeFrequency)}
                      className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                      Evaluate Effectiveness
                    </button>
                  </div>
                </div>

                {/* Effectiveness Before vs After Box */}
                {act.effectivenessScore !== null && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-emerald-950">
                        Operational Recurrence Reduction Measurement
                      </div>
                      <div className="text-emerald-800">
                        Pre-intervention complaints: <span className="font-bold">{act.beforeFrequency}</span> → Post-intervention complaints: <span className="font-bold">{act.afterFrequency}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-900 text-sm">
                      {act.reductionPercentage}% Net Reduction
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Form Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Formulate Rural Preventive Plan</h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Civic Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Waste accumulation">Waste accumulation</option>
                    <option value="Drainage blockage">Drainage blockage</option>
                    <option value="Water leakage">Water leakage</option>
                    <option value="Damaged road">Damaged road</option>
                    <option value="Streetlight failure">Streetlight failure</option>
                    <option value="Water supply">Water supply</option>
                    <option value="Sanitation">Sanitation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hotspot Location Name *</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Weekly Market Junction"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* AI Recommendations Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SRCI AI Recommended Measures:</span>
                </div>
                {fetchingRecs ? (
                  <div className="text-xs text-slate-400">Loading recommendations...</div>
                ) : (
                  <div className="space-y-1.5">
                    {aiRecs.map((rec, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setRecommendedAction(rec.action);
                          setActionTaken(rec.action);
                        }}
                        className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs cursor-pointer transition text-slate-800 flex justify-between items-center"
                      >
                        <span className="line-clamp-2">{rec.action}</span>
                        <span className="text-[10px] font-bold text-emerald-700 shrink-0 ml-2">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recommended Action Description *</label>
                <input
                  type="text"
                  value={recommendedAction}
                  onChange={(e) => setRecommendedAction(e.target.value)}
                  placeholder="e.g., Install 2x 240L twin masonry bins and reschedule collection"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Baseline Frequency (Pre-action)</label>
                  <input
                    type="number"
                    value={beforeFrequency}
                    onChange={(e) => setBeforeFrequency(e.target.value)}
                    placeholder="8 complaints in prior 60 days"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm"
                >
                  Record Action Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
