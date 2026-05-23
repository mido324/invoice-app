import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FilePlus, List, Users, ChevronDown, Globe } from 'lucide-react';
import DOMPurify from 'dompurify';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { ToastProvider } from './components/Toast';
import { initSettings, getSettings, updateSettings, nextInvoiceNumber } from './db/db';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import ProfileManager from './components/ProfileManager';
import PrintView from './components/PrintView';
import SupportBanner from './components/SupportBanner';
import MilestoneModal from './components/MilestoneModal';
import { shouldShowMilestone } from './utils/milestoneTracker';
import type { Invoice } from './types';
import { CURRENCIES, type CurrencyCode } from './types';

type View = 'new' | 'list' | 'profiles';

/**
 * Sanitizes every user-supplied string field on an Invoice before it reaches
 * PrintView.  React escapes text nodes automatically, but DOMPurify also
 * neutralises any HTML/script that could be injected via dangerouslySetInnerHTML
 * or future copy-paste from an untrusted source.
 *
 * BUG FIX: previous version missed item.item, clientEmail, clientPhone,
 * clientAddress, and notes — all rendered verbatim in PrintView.
 */
function sanitizeInvoice(invoice: Invoice): Invoice {
  const s = DOMPurify.sanitize.bind(DOMPurify);
  return {
    ...invoice,
    invoiceNumber:   s(invoice.invoiceNumber   || ''),
    clientName:      s(invoice.clientName      || ''),
    clientEmail:     s(invoice.clientEmail     || ''),
    clientPhone:     s(invoice.clientPhone     || ''),
    clientAddress:   s(invoice.clientAddress   || ''),
    notes:           s(invoice.notes           || ''),
    items: invoice.items.map((item) => ({
      ...item,
      item:        s(item.item        || ''),   // product name — was missing
      description: s(item.description || ''),
    })),
  };
}

/**
 * Sanitizes the profile fields that are rendered in the PrintView header.
 * BUG FIX: previous version sanitized a non-existent `contact` field and
 * left `phone` and `email` unsanitized.
 */
function sanitizeProfile(profile: NonNullable<Parameters<typeof PrintView>[0]['profile']>) {
  const s = DOMPurify.sanitize.bind(DOMPurify);
  return {
    ...profile,
    storeName: s(profile.storeName || ''),
    address:   s(profile.address   || ''),
    phone:     s(profile.phone     || ''),
    email:     s(profile.email     || ''),
  };
}

function Shell() {
  const { t, i18n } = useTranslation();
  const { activeProfile, activeCurrency, profiles, setActiveProfileId } = useProfile();

  const [view, setView] = useState<View>('new');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [listReloadKey, setListReloadKey] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);

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

  async function handleDuplicate(inv: Invoice) {
    const newNumber = await nextInvoiceNumber();
    const today = new Date().toISOString().split('T')[0];
    const { id: _id, ...rest } = inv;
    setEditingInvoice({
      ...rest,
      invoiceNumber: newNumber,
      date: today,
      status: 'draft',
      amountPaid: 0,
      remainingBalance: rest.totalAmount,
    } as Invoice);
    setView('new');
  }

  function handleMilestoneCheck() {
    if (shouldShowMilestone()) setShowMilestone(true);
  }

  if (printInvoice && activeProfile) {
    return (
      <>
        <PrintView
          invoice={sanitizeInvoice(printInvoice)}
          profile={sanitizeProfile(activeProfile)}
          onClose={() => setPrintInvoice(null)}
          onMilestone={handleMilestoneCheck}
        />
        {showMilestone && <MilestoneModal onClose={() => setShowMilestone(false)} />}
      </>
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

      <SupportBanner />

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
            onDuplicate={handleDuplicate}
            onCreateNew={handleNewInvoice}
            reloadKey={listReloadKey}
          />
        )}
        {view === 'profiles' && <ProfileManager />}
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-3 text-center text-xs text-gray-400 print:hidden">
        {t('footerCta')} ·{' '}
        <a
          href="https://buymeacoffee.com/secureinvoice"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
        >
          {t('footerSupport')}
        </a>
      </footer>

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
      <ToastProvider>
        <Shell />
      </ToastProvider>
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
