import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { updateSettings } from '../db/db';
import {
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  normalizeLanguageCode,
  type LanguageCode,
} from '../i18n/languages';

interface LanguageSwitcherProps {
  /** Compact styling for the dark navbar */
  variant?: 'navbar' | 'default';
}

export default function LanguageSwitcher({ variant = 'navbar' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const currentCode = normalizeLanguageCode(i18n.language);
  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentCode) ?? SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  async function selectLanguage(code: LanguageCode) {
    await i18n.changeLanguage(code);
    await updateSettings({ language: code });
    setOpen(false);
  }

  const triggerClass =
    variant === 'navbar'
      ? 'flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition-colors'
      : 'flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors';

  const panelClass =
    variant === 'navbar'
      ? 'absolute end-0 mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1'
      : 'absolute end-0 mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('selectLanguage')}
      >
        <Globe size={14} aria-hidden />
        <span className="max-w-[7rem] truncate">{current.nativeName}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className={panelClass} role="listbox" aria-label={t('selectLanguage')}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const selected = lang.code === currentCode;
            return (
              <li key={lang.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    if (isSupportedLanguage(lang.code)) void selectLanguage(lang.code);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-start transition-colors ${
                    selected
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  dir={lang.dir}
                >
                  <span>
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="ms-2 text-xs text-gray-400">{lang.name}</span>
                  </span>
                  {selected && <Check size={14} className="shrink-0 text-indigo-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
