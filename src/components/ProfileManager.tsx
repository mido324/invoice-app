import { useState, useRef, type ChangeEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Pencil, Trash2, CheckCircle, X, Upload } from 'lucide-react';
import { db } from '../db/db';
import { useProfile } from '../context/ProfileContext';
import type { Profile, CurrencyCode } from '../types';
import { CURRENCIES } from '../types';
import { isRtlLanguage } from '../i18n/languages';

const EMPTY_FORM: Omit<Profile, 'id' | 'createdAt'> = {
  storeName: '',
  phone: '',
  email: '',
  address: '',
  logo: '',
  currency: 'USD',
};

/**
 * ProfileManager — full CRUD UI for business profiles.
 * Displays all profiles as cards; provides inline add/edit form.
 */
export default function ProfileManager() {
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const { profiles, activeProfile, setActiveProfileId, reloadProfiles } = useProfile();

  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<Omit<Profile, 'id' | 'createdAt'>>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(profile: Profile) {
    setEditing(profile);
    setForm({
      storeName: profile.storeName,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      logo: profile.logo ?? '',
      currency: profile.currency,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSave() {
    if (!form.storeName.trim()) return;
    if (editing?.id != null) {
      await db.profiles.update(editing.id, { ...form });
    } else {
      await db.profiles.add({ ...form, createdAt: new Date().toISOString() });
    }
    await reloadProfiles();
    closeForm();
  }

  async function handleDelete(id: number) {
    await db.profiles.delete(id);
    await reloadProfiles();
    setConfirmDeleteId(null);
  }

  /** Converts the selected image file to a base64 data URL and stores it in form state */
  function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo: reader.result as string }));
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t('profiles')}</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          {t('addProfile')}
        </button>
      </div>

      {/* Profile cards */}
      {profiles.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">{t('noProfiles')}</p>
      )}

      <div className="grid gap-4">
        {profiles.map((p) => (
          <div
            key={p.id}
            className={`border rounded-xl p-4 flex items-start gap-4 transition-shadow ${
              activeProfile?.id === p.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:shadow-sm'
            }`}
          >
            {/* Logo / avatar */}
            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
              {p.logo ? (
                <img src={p.logo} alt={p.storeName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-bold text-gray-400">
                  {p.storeName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800">{p.storeName}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {CURRENCIES[p.currency]?.symbol} {p.currency}
                </span>
                {activeProfile?.id === p.id && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {t('activeProfile')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{p.email}</p>
              <p className="text-sm text-gray-500 truncate">{p.phone}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {activeProfile?.id !== p.id && (
                <button
                  onClick={() => setActiveProfileId(p.id!)}
                  title={t('selectProfile')}
                  className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                >
                  <CheckCircle size={18} />
                </button>
              )}
              <button
                onClick={() => openEdit(p)}
                title={t('editProfile')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => setConfirmDeleteId(p.id!)}
                title={t('deleteProfile')}
                className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editing ? t('editProfile') : t('addProfile')}
              </h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Logo upload */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                  {form.logo ? (
                    <img src={form.logo} alt="logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload size={22} className="text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t('uploadLogo')}
                  </button>
                  {form.logo && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, logo: '' }))}
                      className="text-sm text-red-500 hover:underline"
                    >
                      {t('removeLogo')}
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>

              <Field label={t('storeName')} required>
                <input
                  value={form.storeName}
                  onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
                  className="input"
                  placeholder={t('storeName')}
                />
              </Field>

              <Field label={t('phone')}>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="input"
                  placeholder="+973 3300 0000"
                />
              </Field>

              <Field label={t('email')}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input"
                  placeholder="store@example.com"
                />
              </Field>

              <Field label={t('address')}>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="input resize-none"
                  rows={2}
                  placeholder="123 Main St, City"
                />
              </Field>

              <Field label={t('currency')}>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value as CurrencyCode }))
                  }
                  className="input"
                >
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <option key={code} value={code}>
                      {code} — {isRtl ? CURRENCIES[code].nameAr : CURRENCIES[code].name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={closeForm} className="btn-secondary">
                {t('cancel')}
              </button>
              <button onClick={handleSave} disabled={!form.storeName.trim()} className="btn-primary">
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId != null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <p className="text-gray-800 font-medium">{t('confirmDelete')}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary">
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </label>
      {children}
    </div>
  );
}
