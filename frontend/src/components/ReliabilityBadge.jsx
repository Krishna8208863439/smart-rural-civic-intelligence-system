import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ShieldAlert, Shield, CheckCircle2 } from 'lucide-react';
import { translateReliability } from '../utils/translateData';

const reliabilityStyles = {
  'Very High': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  High: 'bg-teal-50 text-teal-700 border-teal-200',
  Medium: 'bg-sky-50 text-sky-700 border-sky-200',
  Low: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function ReliabilityBadge({ level = 'High', score, showScore = true, className = '' }) {
  const { t, i18n } = useTranslation();
  const style = reliabilityStyles[level] || reliabilityStyles.High;
  const translatedLevel = translateReliability(level, i18n.language) || level;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style} ${className}`}
      title={score ? `${t('reliability.title')}: ${score}/100` : ''}
    >
      {level === 'Very High' && <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
      {level === 'High' && <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-600" />}
      {level === 'Medium' && <Shield className="w-3.5 h-3.5 mr-1 text-sky-600" />}
      {level === 'Low' && <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-600" />}
      <span>{translatedLevel}</span>
      {showScore && score !== undefined && (
        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/70 text-[10px] font-bold font-mono">
          {score}%
        </span>
      )}
    </span>
  );
}

