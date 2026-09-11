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
} from 'lucide-react';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout, switchLanguage, demoLogin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#064e3b] via-[#065f46] to-[#047857] text-white border-b border-emerald-700/60 shadow-md">
      <div className="max-w-[1600px] w-full mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-[72px] gap-4">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center space-x-3 shrink-0 group">
            <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="whitespace-nowrap shrink-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">GramSetu AI</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white/90 border border-white/25">
                  BETA
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80 font-medium leading-tight">
                Smart Rural Civic Intelligence
              </p>
            </div>
          </Link>

          {/* Center Navigation Pills - Role-Specific */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1 bg-black/20 backdrop-blur-md p-1.5 rounded-full border border-white/15 shrink-0">
              {role === 'admin' ? (
                /* ADMIN NAVIGATION: STRICTLY ONLY THESE TWO FEATURES */
                <>
                  <Link
                    to="/admin"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive('/admin')
                        ? 'bg-white text-emerald-950 shadow-sm font-bold'
                        : 'text-emerald-100 hover:text-white hover:bg-white/15 font-semibold'
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
                        : 'text-emerald-100 hover:text-white hover:bg-white/15 font-semibold'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5 shrink-0 text-teal-300" />
                    <span>{i18n.language === 'mr' ? 'कामांची यादी' : i18n.language === 'hi' ? 'कार्य सूची' : 'Dispatch Queue'}</span>
                  </Link>
                </>
              ) : role === 'worker' ? (
                /* WORKER NAVIGATION */
                <Link
                  to="/worker"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive('/worker')
                      ? 'bg-white text-emerald-950 shadow-sm font-bold'
                      : 'text-emerald-100 hover:text-white hover:bg-white/15 font-semibold'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 shrink-0 text-sky-300" />
                  <span>{t('nav.worker')}</span>
                </Link>
              ) : (
                /* CITIZEN NAVIGATION */
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

          {/* Right Controls: Language, User & Notifications */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-black/20 backdrop-blur-md rounded-full p-1 border border-white/15 text-xs shrink-0 whitespace-nowrap">
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

            {/* Notifications Bell - only when user is logged in */}
            {user && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-emerald-100 hover:text-white hover:bg-white/15 transition relative shrink-0"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-slate-800">
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
                            onClick={() => markAsRead(n._id)}
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

            {/* User Pill Badge */}
            {user ? (
              <div className="flex items-center space-x-2 bg-black/20 border border-white/20 rounded-full pl-3 pr-1.5 py-1 shrink-0 whitespace-nowrap text-white">
                <div className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span className="text-xs font-semibold text-white max-w-[110px] truncate">
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
              <div className="flex items-center space-x-3 shrink-0 whitespace-nowrap">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-semibold text-white hover:text-emerald-100 transition whitespace-nowrap"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-bold text-emerald-950 bg-white hover:bg-emerald-50 rounded-full transition shadow-sm whitespace-nowrap"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
