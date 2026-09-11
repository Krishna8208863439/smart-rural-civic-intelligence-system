import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

import { translatePriority } from '../utils/translateData';

const priorityStyles = {
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function PriorityBadge({ level = 'Medium', score, showScore = false, className = '' }) {
  const { t, i18n } = useTranslation();
  const style = priorityStyles[level] || priorityStyles.Medium;
  const translatedLevel = translatePriority(level, i18n.language) || t(`priority.${level}`) || level;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style} ${className}`}
      title={score ? `Priority Score: ${score}/100` : ''}
    >
      {level === 'Critical' && <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />}
      {level === 'High' && <AlertCircle className="w-3.5 h-3.5 mr-1 text-orange-600" />}
      {level === 'Medium' && <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />}
      {level === 'Low' && <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />}
      {translatedLevel}
      {showScore && score !== undefined && <span className="ml-1 opacity-75 font-mono">({score})</span>}
    </span>
  );
}
