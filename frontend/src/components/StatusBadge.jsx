import React from 'react';
import { useTranslation } from 'react-i18next';

import { translateStatus } from '../utils/translateData';

const statusStyles = {
  NEW: 'bg-blue-50 text-blue-700 border-blue-200',
  VALIDATED: 'bg-teal-50 text-teal-700 border-teal-200',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'UNDER ACTION': 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
  'ACTION COMPLETED': 'bg-purple-50 text-purple-700 border-purple-200',
  MONITORING: 'bg-sky-50 text-sky-700 border-sky-200',
  'VERIFIED RESOLVED': 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
  REOPENED: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
};

export default function StatusBadge({ status, className = '' }) {
  const { t, i18n } = useTranslation();
  const style = statusStyles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const label = translateStatus(status, i18n.language) || t(`status.${status}`) || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {label}
    </span>
  );
}
