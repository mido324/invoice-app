import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield } from 'lucide-react';

const SUPPORT_URL = 'https://buymeacoffee.com/secureinvoice';
const DISMISSED_KEY = 'support_banner_dismissed';

export default function SupportBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => localStorage.getItem(DISMISSED_KEY) !== 'true');

  if (!visible) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  }

  return (
    <div className="bg-slate-800 border-b border-slate-700 print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-slate-300 text-xs">
          <Shield size={14} className="text-green-400 shrink-0" />
          <span>{t('supportPrivacyNote')}</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       bg-[#FFDD00] hover:bg-[#e6c800] text-gray-900
                       text-xs font-bold transition-colors whitespace-nowrap"
          >
            ☕ {t('supportButton')}
          </a>
          <button
            onClick={handleDismiss}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
