import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import heroVillageImg from '../assets/hero-card-mockup.jpg';
import {
  FileText,
  MapPin,
  Database,
  Users,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Sparkles,
  Leaf,
} from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 32,
    pending: 6,
    inProgress: 9,
    resolved: 14,
    critical: 4,
    preventive: 4,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const kpiRes = await api.get('/analytics/dashboard').catch(() => null);

        if (kpiRes?.data?.kpis) {
          setStats({
            total: kpiRes.data.kpis.totalIssues || 32,
            pending: kpiRes.data.kpis.pendingIssues || 6,
            inProgress: kpiRes.data.kpis.inProgressIssues || 9,
            resolved: kpiRes.data.kpis.resolvedIssues || 14,
            critical: kpiRes.data.kpis.criticalIssues || 4,
            preventive: kpiRes.data.kpis.totalPreventiveActions || 4,
          });
        }
      } catch (err) {
        console.warn('Home data fetch fallback');
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] overflow-y-auto lg:overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#f0fdfa]/40 to-[#e0f2fe]/30 py-6 sm:py-8 lg:py-0">
      {/* HERO SECTION — 16:9 Desktop 50/50 Two-Column Layout, fluid on mobile */}
      <section className="max-w-[1560px] w-full min-h-full mx-auto px-4 sm:px-8 lg:px-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center w-full">
          {/* Left Column: 50% Desktop Width */}
          <div className="w-full flex flex-col justify-center space-y-3.5 xl:space-y-4">
            {/* Top Pill Badge */}
            <div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#e8f5e9] border border-[#c8e6c9] text-[#1b5e20] text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>{t('quickPill')}</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-[36px] xl:text-[42px] 2xl:text-[46px] font-black text-slate-900 tracking-tight leading-[1.14]">
              {t('home.heroTitle1')} <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {t('home.heroTitle2')}
              </span> <br />
              {t('home.heroTitle3')}
            </h1>

            {/* Supporting Description */}
            <p className="text-xs sm:text-sm lg:text-[13px] xl:text-sm text-slate-600 font-normal leading-relaxed max-w-xl">
              {t('home.heroSub')}
            </p>

            {/* 4 Feature Cards in 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:gap-3.5 max-w-xl">
              {/* Card 1: Report Issue */}
              <Link
                to={user ? "/report" : "/login"}
                className="group bg-white rounded-2xl p-3.5 xl:p-4 border border-slate-200/80 shadow-[0_3px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.12)] hover:border-emerald-300 transition-all duration-200 flex items-center space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                    {t('nav.report')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t('home.card1Sub')}
                  </p>
                </div>
              </Link>

              {/* Card 2: Track Issues */}
              <Link
                to={user ? "/issues" : "/login"}
                className="group bg-white rounded-2xl p-3.5 xl:p-4 border border-slate-200/80 shadow-[0_3px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(2,132,199,0.12)] hover:border-sky-300 transition-all duration-200 flex items-center space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-sky-100 transition-all">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                    {t('nav.track')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Live complaint tracking & status
                  </p>
                </div>
              </Link>

              {/* Card 3: Village Memory */}
              <Link
                to={user ? "/memory" : "/login"}
                className="group bg-white rounded-2xl p-3.5 xl:p-4 border border-slate-200/80 shadow-[0_3px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(217,119,6,0.12)] hover:border-amber-300 transition-all duration-200 flex items-center space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                    {t('nav.memory')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t('home.card3Sub')}
                  </p>
                </div>
              </Link>

              {/* Card 4: Community Validation */}
              <Link
                to={user ? "/community-validation" : "/login"}
                className="group bg-white rounded-2xl p-3.5 xl:p-4 border border-slate-200/80 shadow-[0_3px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(124,58,237,0.12)] hover:border-purple-300 transition-all duration-200 flex items-center space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-purple-100 transition-all">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                    {t('nav.validation')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t('home.card4Sub')}
                  </p>
                </div>
              </Link>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-0.5">
              <Link
                to={user ? "/report" : "/login"}
                className="inline-flex items-center space-x-2.5 px-6 xl:px-7 py-3 rounded-full bg-[#1b5e20] hover:bg-[#144718] text-white font-bold text-sm shadow-md shadow-[#1b5e20]/25 transition-all transform hover:-translate-y-0.5"
              >
                <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-white text-[9px] font-bold">
                  ▶
                </span>
                <span>{t('buttons.reportIssue')}</span>
              </Link>

              <Link
                to={user ? (role === 'admin' ? '/admin' : role === 'worker' ? '/worker' : '/issues') : '/login'}
                className="inline-flex items-center px-6 xl:px-7 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-xs transition"
              >
                <span>
                  {user
                    ? role === 'worker'
                      ? t('buttons.workerPortal')
                      : role === 'admin'
                      ? t('buttons.adminPortal')
                      : t('nav.track')
                    : t('nav.login')}
                </span>
              </Link>
            </div>

            {/* Bottom Benefit Row / Value Propositions */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2 max-w-xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center space-x-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px] xl:text-xs">{t('common.cleanerVillages')}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="text-[11px] xl:text-xs">{t('common.strongerCommunities')}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="text-[11px] xl:text-xs">{t('common.dataDrivenGovernance')}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="text-[11px] xl:text-xs">{t('common.smarterRuralIndia')}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[10px] xl:text-[11px] font-bold text-slate-500 tracking-wider uppercase pt-0.5">
                <div className="w-8 h-[2.5px] bg-[#1b5e20] rounded-full"></div>
                <span>{t('common.peopleDataAction')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: 50% Desktop Width — Large Contained Illustration Frame */}
          <div className="w-full flex items-center justify-center lg:justify-end my-4 lg:my-6">
            <div className="relative w-fit max-w-full rounded-3xl xl:rounded-[36px] overflow-hidden shadow-2xl shadow-emerald-950/15 border-2 border-[#a7f3d0]/90 ring-1 ring-emerald-500/10 group">
              <img
                src={heroVillageImg}
                alt="GramSetu AI Smart Rural Civic Intelligence System"
                className="block w-full sm:w-auto h-auto max-h-[280px] sm:max-h-[420px] lg:max-h-[min(600px,calc(100vh-140px))] max-w-full object-cover rounded-3xl xl:rounded-[36px] group-hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

