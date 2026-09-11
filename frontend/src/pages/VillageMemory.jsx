import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { translateData, translateCategory, translateReliability } from '../utils/translateData';
import {

  Database,
  Search,
  Filter,
  AlertTriangle,
  History,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Compass,
} from 'lucide-react';

export default function VillageMemory() {
  const { t, i18n } = useTranslation();


  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [search, setSearch] = useState('');

  const fetchMemory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedRisk !== 'All') params.append('riskLevel', selectedRisk);
      if (search) params.append('search', search);

      const res = await api.get(`/village-memory?${params.toString()}`);
      setRecords(res.data.records || []);
    } catch (err) {
      console.error('Village memory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, [selectedCategory, selectedRisk]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMemory();
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-violet-200 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            <span>Gram Panchayat Long-Term Civic Repository</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Village Digital Memory
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Preserves institutional operational knowledge across village civic infrastructure.
            Tracks chronic hotspots, average recurrence intervals, probable root-cause hypotheses,
            preventive measures taken, and measured complaint reductions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-soft space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hotspot location (e.g., Weekly Bazaar, School Culvert, Water Tank)..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-2xl bg-violet-700 hover:bg-violet-800 text-white font-semibold text-xs transition"
          >
            Search Memory
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1 font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-violet-600" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Waste accumulation">Waste accumulation</option>
            <option value="Drainage blockage">Drainage blockage</option>
            <option value="Water leakage">Water leakage</option>
            <option value="Damaged road">Damaged road</option>
            <option value="Streetlight failure">Streetlight failure</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
          >
            <option value="All">All Recurrence Risks</option>
            <option value="Very High">Very High</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Memory Hotspot Profiles Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading Village Digital Memory records...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <p className="text-sm font-semibold text-slate-700">No recurrence hotspot memory profiles match criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {records.map((rec) => (
            <div
              key={rec._id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 sm:p-8 space-y-6"
            >
              {/* Hotspot Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 font-bold">
                      {translateCategory(rec.category, i18n.language)}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                        rec.recurrenceLevel === 'Very High'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      {t('recurrence.risk')}: {translateReliability(rec.recurrenceLevel, i18n.language)} ({rec.recurrenceRisk}%)
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                      Stability: {translateData(rec.resolutionStability, i18n.language)}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{translateData(rec.locationPattern?.name, i18n.language)}</span>
                  </h2>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-400 font-medium">Historical Frequency</div>
                  <div className="text-2xl font-black text-slate-900">{rec.frequency} Incidents</div>
                  <div className="text-[11px] text-slate-500">
                    Typical interval: ~{rec.averageIntervalDays || 14} days
                  </div>
                </div>
              </div>

              {/* Hotspot Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Probable Root Causes */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
                  <div className="font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>{t('memory.probableCauses')}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Confidence %</span>
                  </div>
                  {rec.probableCauses && rec.probableCauses.length > 0 ? (
                    <div className="space-y-2">
                      {rec.probableCauses.map((cause, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-800 flex-1 pr-2">
                              {translateData(cause.cause, i18n.language)}
                            </span>
                            <span className="font-mono font-bold text-violet-700 shrink-0">{cause.confidence}%</span>
                          </div>

                          {cause.observations && (
                            <ul className="mt-1 space-y-0.5 text-[11px] text-slate-500 list-disc pl-4">
                              {cause.observations.map((obs, j) => (
                                <li key={j}>{obs}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No causal hypotheses registered yet.</p>
                  )}
                </div>

                {/* Preventive Interventions & Effectiveness */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2.5">
                  <div className="font-bold text-emerald-950 uppercase tracking-wider flex items-center justify-between">
                    <span>Preventive Interventions & Measured Impact</span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      {rec.averageEffectiveness ? `${rec.averageEffectiveness}% Avg Reduction` : 'Active'}
                    </span>
                  </div>

                  {rec.recentActions && rec.recentActions.length > 0 ? (
                    <div className="space-y-2">
                      {rec.recentActions.map((act) => (
                        <div key={act._id} className="p-2.5 rounded-xl bg-white border border-emerald-200/80">
                          <div className="font-semibold text-slate-900">{act.recommendedAction}</div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            Action taken: {act.actionTaken || 'Scheduled for field execution'}
                          </div>
                          {act.effectivenessScore !== null && (
                            <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                              <span>Complaints dropped from {act.beforeFrequency} to {act.afterFrequency}</span>
                              <span>{act.reductionPercentage}% Reduction ({act.effectivenessLevel})</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">No preventive actions recorded for this hotspot yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
