import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Compass,
  PlusCircle,
  ListFilter,
  MapPin,
  Database,
  Users,
  ShieldAlert,
  Wrench,
  LogOut,
  Bell,
  Globe,
  User,
  Check,
  Zap,
  Menu,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout, switchLanguage } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#064e3b] via-[#065f46] to-[#047857] text-white border-b border-emerald-700/60 shadow-md">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-[68px] sm:h-[72px] gap-2 sm:gap-4">
          
          {/* Left: Logo Brand */}
          <Link to="/" onClick={handleNavClick} className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">GramSetu AI</span>
                <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-white/20 text-white/90 border border-white/25">
                  BETA
                </span>
              </div>
              <p className="hidden xs:block text-[10px] sm:text-[11px] text-emerald-100/80 font-medium leading-tight truncate max-w-[160px] sm:max-w-none">
                Smart Rural Civic Intelligence
              </p>
            </div>
          </Link>

          {/* Center: Desktop Navigation Pills (lg and up) */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1 bg-black/20 backdrop-blur-md p-1.5 rounded-full border border-white/15 shrink-0">
              {role === 'admin' ? (
                <>
                  <Link
                    to="/admin"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/admin')
                        ? 'bg-white text-emerald-950 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                    <span>{t('nav.admin')}</span>
                  </Link>

                  <Link
                    to="/admin/issues"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/admin/issues')
                        ? 'bg-white text-emerald-950 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5 shrink-0 text-teal-300" />
                    <span>{i18n.language === 'mr' ? 'कामांची यादी' : i18n.language === 'hi' ? 'कार्य सूची' : 'Dispatch Queue'}</span>
                  </Link>

                  <Link
                    to="/admin/workers"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/admin/workers')
                        ? 'bg-white text-emerald-950 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0 text-cyan-300" />
                    <span>{i18n.language === 'mr' ? 'क्षेत्रीय कर्मचारी' : i18n.language === 'hi' ? 'फील्ड कार्यकर्ता' : 'Field Workers'}</span>
                  </Link>

                  <Link
                    to="/memory"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/memory')
                        ? 'bg-white text-emerald-950 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 shrink-0 text-violet-300" />
                    <span>{t('nav.memory')}</span>
                  </Link>

                  <Link
                    to="/preventive-management"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/preventive-management')
                        ? 'bg-white text-emerald-950 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                    <span>{t('adminDashboard.preventiveActions')}</span>
                  </Link>
                </>
              ) : role === 'worker' ? (
                <>
                  <Link
                    to="/worker"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/worker')
                        ? 'bg-white text-emerald-950 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 shrink-0 text-sky-300" />
                    <span>{t('nav.worker')}</span>
                  </Link>
                  <Link
                    to="/memory"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/memory')
                        ? 'bg-white text-emerald-950 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 shrink-0 text-violet-300" />
                    <span>{t('nav.memory')}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive('/')
                        ? 'bg-white text-emerald-900 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    {t('nav.home')}
                  </Link>

                  <Link
                    to="/report"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/report')
                        ? 'bg-white text-emerald-900 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <PlusCircle className={`w-3.5 h-3.5 shrink-0 ${isActive('/report') ? 'text-emerald-700' : 'text-emerald-300'}`} />
                    <span>{t('nav.report')}</span>
                  </Link>

                  <Link
                    to="/issues"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive('/issues')
                        ? 'bg-white text-emerald-900 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    {t('nav.track')}
                  </Link>

                  <Link
                    to="/map"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/map')
                        ? 'bg-white text-emerald-900 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${isActive('/map') ? 'text-sky-600' : 'text-sky-300'}`} />
                    <span>{i18n.language === 'mr' ? 'लाईव्ह नकाशा' : i18n.language === 'hi' ? 'लाइव मैप' : 'Live Map'}</span>
                  </Link>

                  <Link
                    to="/memory"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/memory')
                        ? 'bg-white text-emerald-900 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <Database className={`w-3.5 h-3.5 shrink-0 ${isActive('/memory') ? 'text-violet-600' : 'text-violet-300'}`} />
                    <span>{t('nav.memory')}</span>
                  </Link>

                  <Link
                    to="/community-validation"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/community-validation')
                        ? 'bg-white text-emerald-900 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <Users className={`w-3.5 h-3.5 shrink-0 ${isActive('/community-validation') ? 'text-amber-600' : 'text-amber-300'}`} />
                    <span>{t('nav.validation')}</span>
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Right: Controls & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            
            {/* Desktop Language Switcher (hidden on mobile, in drawer) */}
            <div className="hidden sm:flex items-center bg-black/20 backdrop-blur-md rounded-full p-1 border border-white/15 text-xs shrink-0 whitespace-nowrap">
              <button
                onClick={() => switchLanguage('en')}
                className={`px-2 py-0.5 rounded-full font-semibold transition text-[11px] ${
                  i18n.language === 'en'
                    ? 'bg-white text-emerald-900 shadow-xs font-bold'
                    : 'text-emerald-100 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => switchLanguage('mr')}
                className={`px-2 py-0.5 rounded-full font-semibold transition text-[11px] ${
                  i18n.language === 'mr'
                    ? 'bg-white text-emerald-900 shadow-xs font-bold'
                    : 'text-emerald-100 hover:text-white'
                }`}
                title="मराठी"
              >
                मराठी
              </button>
              <button
                onClick={() => switchLanguage('hi')}
                className={`px-2 py-0.5 rounded-full font-semibold transition text-[11px] ${
                  i18n.language === 'hi'
                    ? 'bg-white text-emerald-900 shadow-xs font-bold'
                    : 'text-emerald-100 hover:text-white'
                }`}
                title="हिंदी"
              >
                हिंदी
              </button>
            </div>

            {/* Notifications Bell */}
            {user && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-emerald-100 hover:text-white hover:bg-white/15 transition relative shrink-0"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-[min(380px,calc(100vw-32px))] rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-slate-800 animate-in fade-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="text-xs font-bold text-slate-900">
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] text-emerald-700 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => { markAsRead(n._id); setShowNotifications(false); }}
                            className={`p-2.5 rounded-xl text-xs cursor-pointer transition ${
                              n.read
                                ? 'bg-slate-50 text-slate-600'
                                : 'bg-emerald-50/70 border border-emerald-100 text-slate-900 font-medium'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{n.title}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop User Badge */}
            {user ? (
              <div className="hidden sm:flex items-center space-x-2 bg-black/20 border border-white/20 rounded-full pl-3 pr-1.5 py-1 shrink-0 whitespace-nowrap text-white">
                <div className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span className="text-xs font-semibold text-white max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-300/30 text-emerald-100 shrink-0">
                    {i18n.language === 'mr' ? (user.role === 'admin' ? 'प्रशासन' : user.role === 'worker' ? 'कर्मचारी' : 'नागरिक') : i18n.language === 'hi' ? (user.role === 'admin' ? 'प्रशासन' : user.role === 'worker' ? 'कार्यकर्ता' : 'नागरिक') : user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1 rounded-full text-emerald-200 hover:text-rose-200 hover:bg-rose-500/20 transition shrink-0"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 shrink-0 whitespace-nowrap">
                <Link
                  to="/worker/login"
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition flex items-center space-x-1"
                >
                  <Wrench className="w-3 h-3 text-sky-300" />
                  <span>Field Worker</span>
                </Link>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white hover:text-emerald-100 transition whitespace-nowrap"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs font-bold text-emerald-950 bg-white hover:bg-emerald-50 rounded-full transition shadow-sm whitespace-nowrap"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger Button (visible on < lg) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-white hover:bg-white/15 transition shrink-0 flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#064e3b]/98 backdrop-blur-xl border-b border-emerald-700/80 shadow-2xl px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
          
          {/* User Status Bar (Mobile) */}
          {user ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/25 border border-white/15 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-emerald-200/80 font-medium">
                    {user.village || 'Gram Panchayat Chandoli'} • <span className="uppercase font-bold text-amber-300">{user.role}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold flex items-center space-x-1 transition"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={handleNavClick}
                  className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 transition"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={handleNavClick}
                  className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 shadow-sm transition"
                >
                  {t('nav.register')}
                </Link>
              </div>
              <Link
                to="/worker/login"
                onClick={handleNavClick}
                className="w-full py-2 text-center text-xs font-bold rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-500/40 transition flex items-center justify-center space-x-1.5"
              >
                <Wrench className="w-3.5 h-3.5 text-sky-300" />
                <span>Field Worker Portal Login</span>
              </Link>
            </div>
          )}

          {/* Navigation Links List */}
          <div className="space-y-1 pt-1">
            {role === 'admin' ? (
              <>
                <Link
                  to="/admin"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/admin') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>{t('nav.admin')}</span>
                </Link>
                <Link
                  to="/admin/issues"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/admin/issues') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <ListFilter className="w-4 h-4 text-teal-400" />
                  <span>{i18n.language === 'mr' ? 'कामांची यादी' : i18n.language === 'hi' ? 'कार्य सूची' : 'Dispatch Queue'}</span>
                </Link>
                <Link
                  to="/admin/workers"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/admin/workers') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>{i18n.language === 'mr' ? 'क्षेत्रीय कर्मचारी' : i18n.language === 'hi' ? 'फील्ड कार्यकर्ता' : 'Field Workers'}</span>
                </Link>
                <Link
                  to="/memory"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/memory') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Database className="w-4 h-4 text-violet-400" />
                  <span>{t('nav.memory')}</span>
                </Link>
                <Link
                  to="/preventive-management"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/preventive-management') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('adminDashboard.preventiveActions')}</span>
                </Link>
              </>
            ) : role === 'worker' ? (
              <>
                <Link
                  to="/worker"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/worker') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-sky-400" />
                  <span>{t('nav.worker')}</span>
                </Link>
                <Link
                  to="/memory"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/memory') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Database className="w-4 h-4 text-violet-400" />
                  <span>{t('nav.memory')}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Compass className="w-4 h-4 text-emerald-300" />
                  <span>{t('nav.home')}</span>
                </Link>
                <Link
                  to="/report"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/report') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-amber-300" />
                  <span>{t('nav.report')}</span>
                </Link>
                <Link
                  to="/issues"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/issues') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <ListFilter className="w-4 h-4 text-sky-300" />
                  <span>{t('nav.track')}</span>
                </Link>
                <Link
                  to="/map"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/map') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-sky-300" />
                  <span>{i18n.language === 'mr' ? 'लाईव्ह नकाशा' : i18n.language === 'hi' ? 'लाइव मैप' : 'Live Map'}</span>
                </Link>
                <Link
                  to="/memory"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/memory') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Database className="w-4 h-4 text-violet-300" />
                  <span>{t('nav.memory')}</span>
                </Link>
                <Link
                  to="/community-validation"
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive('/community-validation') ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-300" />
                  <span>{t('nav.validation')}</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Language Switcher */}
          <div className="pt-3 border-t border-white/15">
            <div className="text-[11px] font-bold text-emerald-200 mb-2">Preferred Language / भाषा निवडा:</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { switchLanguage('en'); setMobileMenuOpen(false); }}
                className={`py-2 rounded-xl text-xs font-bold transition text-center ${
                  i18n.language === 'en'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'bg-white/10 text-emerald-100 hover:bg-white/15'
                }`}
              >
                English
              </button>
              <button
                onClick={() => { switchLanguage('mr'); setMobileMenuOpen(false); }}
                className={`py-2 rounded-xl text-xs font-bold transition text-center ${
                  i18n.language === 'mr'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'bg-white/10 text-emerald-100 hover:bg-white/15'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => { switchLanguage('hi'); setMobileMenuOpen(false); }}
                className={`py-2 rounded-xl text-xs font-bold transition text-center ${
                  i18n.language === 'hi'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'bg-white/10 text-emerald-100 hover:bg-white/15'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

        </div>
      )}
    </header>
  );
}
