import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FilePlus, List, Users, ChevronDown, Globe } from 'lucide-react';
import DOMPurify from 'dompurify';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { initSettings, getSettings, updateSettings } from './db/db';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import ProfileManager from './components/ProfileManager';
import PrintView from './components/PrintView';
import type { Invoice } from './types';
import { CURRENCIES, type CurrencyCode } from './types';

type View = 'new' | 'list' | 'profiles';

// Sanitize user-provided data to prevent XSS attacks, especially for printing.
function sanitizeInvoiceData(invoice: Invoice): Invoice {
  const sanitized = { ...invoice }; // Create a shallow copy
  // Sanitize potentially risky string fields, providing fallbacks for null/undefined.
  sanitized.clientName = DOMPurify.sanitize(sanitized.clientName || '');
  sanitized.invoiceNumber = DOMPurify.sanitize(sanitized.invoiceNumber || '');
  sanitized.items = sanitized.items.map((item) => ({
    ...item,
    description: DOMPurify.sanitize(item.description || ''),
  }));
  return sanitized;
}

function Shell() {
  const { t, i18n } = useTranslation();
  const { activeProfile, activeCurrency, profiles, setActiveProfileId } = useProfile();

  const [view, setView] = useState<View>('new');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [listReloadKey, setListReloadKey] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRtl, i18n.language]);

  async function switchLanguage(lang: 'en' | 'ar') {
    await i18n.changeLanguage(lang);
    await updateSettings({ language: lang });
  }

  function handleSaved(_invoice: Invoice) {
    setListReloadKey((k) => k + 1);
    setView('list');
    setEditingInvoice(undefined);
  }

  function handleNewInvoice() {
    setEditingInvoice(undefined);
    setView('new');
  }

  if (printInvoice && activeProfile) {
    return (
      <PrintView
        invoice={sanitizeInvoiceData(printInvoice)}
        profile={{
          ...activeProfile,
          storeName: DOMPurify.sanitize(activeProfile.storeName || ''),
          address: DOMPurify.sanitize(activeProfile.address || ''),
          contact: DOMPurify.sanitize(activeProfile.contact || ''),
        }}
        onClose={() => setPrintInvoice(null)}
      />
    );
  }

  const currencyMeta = CURRENCIES[activeCurrency as CurrencyCode];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navbar — dark slate professional theme */}
      <nav className="bg-slate-900 px-4 md:px-6 h-14 flex items-center justify-between print:hidden sticky top-0 z-40 shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-lg tracking-tight">{t('appName')}</span>
          {activeProfile && (
            <span className="hidden sm:inline text-xs bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full font-medium">
              {currencyMeta.symbol} {activeCurrency}
            </span>
          )}
        </div>

        {/* Centre nav links */}
        <div className="flex items-center gap-1">
          <NavBtn active={view === 'new'} onClick={handleNewInvoice} icon={<FilePlus size={16} />}>
            {t('newInvoice')}
          </NavBtn>
          <NavBtn active={view === 'list'} onClick={() => setView('list')} icon={<List size={16} />}>
            {t('invoiceHistory')}
          </NavBtn>
          <NavBtn active={view === 'profiles'} onClick={() => setView('profiles')} icon={<Users size={16} />}>
            {t('profiles')}
          </NavBtn>
        </div>

        {/* Right: language toggle + profile switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchLanguage(isRtl ? 'en' : 'ar')}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Globe size={14} />
            {isRtl ? 'EN' : 'عربي'}
          </button>

          {profiles.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <span className="max-w-[120px] truncate">
                  {activeProfile?.storeName ?? t('selectProfile')}
                </span>
                <ChevronDown size={14} />
              </button>

              {profileMenuOpen && (
                <div className="absolute end-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setActiveProfileId(p.id!); setProfileMenuOpen(false); }}
                      className={`w-full text-start px-4 py-2.5 text-sm transition-colors ${
                        activeProfile?.id === p.id
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {p.storeName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        {profiles.length === 0 && view !== 'profiles' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 flex items-center justify-between print:hidden">
            <span>{t('noProfiles')}</span>
            <button onClick={() => setView('profiles')} className="font-medium underline underline-offset-2">
              {t('addProfile')}
            </button>
          </div>
        )}

        {view === 'new' && (
          <InvoiceForm
            existing={editingInvoice}
            onSaved={handleSaved}
            onPrint={setPrintInvoice}
          />
        )}
        {view === 'list' && (
          <InvoiceList
            onEdit={(inv) => { setEditingInvoice(inv); setView('new'); }}
            onPrint={setPrintInvoice}
            reloadKey={listReloadKey}
          />
        )}
        {view === 'profiles' && <ProfileManager />}
      </main>

      {profileMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    initSettings()
      .then(async () => {
        const s = await getSettings();
        if (s.language && s.language !== i18n.language) {
          await i18n.changeLanguage(s.language);
        }
      })
      .catch((err) => {
        console.error('Failed to initialize database settings:', err);
        // Consider showing an error message to the user
      })
      .finally(() => {
        setReady(true);
      });
  }, [i18n]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <ProfileProvider>
      <Shell />
    </ProfileProvider>
  );
}

function NavBtn({
  active, onClick, icon, children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-300 hover:text-white hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{children}</span>
    </button>
  );
}
