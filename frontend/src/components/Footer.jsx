import React from 'react';
import { Compass, Shield, HeartHandshake, PhoneCall, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white/70 backdrop-blur-md w-full">
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">GramSetu AI</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('footer.desc')}
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>{t('footer.status')}</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">{t('footer.colEngines')}</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>• {t('footer.engine1')}</li>
              <li>• {t('footer.engine2')}</li>
              <li>• {t('footer.engine3')}</li>
              <li>• {t('footer.engine4')}</li>
              <li>• {t('footer.engine5')}</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">{t('footer.colCategories')}</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>• {t('footer.cat1')}</li>
              <li>• {t('footer.cat2')}</li>
              <li>• {t('footer.cat3')}</li>
              <li>• {t('footer.cat4')}</li>
              <li>• {t('footer.cat5')}</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">{t('footer.colContact')}</h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('footer.phone')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-emerald-700" />
                <span>help@chandoli-panchayat.gov.in</span>
              </div>
              <div className="pt-2 text-[11px] text-slate-500">
                {t('footer.address')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div>© {new Date().getFullYear()} {t('footer.rights')}</div>
          <div className="mt-2 sm:mt-0 flex space-x-4">
            <span>{t('footer.audit')}</span>
            <span>•</span>
            <span>{t('footer.memory')}</span>
            <span>•</span>
            <span>{t('footer.multilingual')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

