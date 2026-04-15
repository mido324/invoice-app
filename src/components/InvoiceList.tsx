import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Printer, FileText } from 'lucide-react';
import { db } from '../db/db';
import { useProfile } from '../context/ProfileContext';
import { formatCurrency } from '../utils/currency';
import type { Invoice } from '../types';

interface Props {
  onEdit: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  /** Reload key — increment to force re-fetch (e.g. after a save) */
  reloadKey?: number;
}

const STATUS_PILL: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  partial:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-600',
};

/**
 * InvoiceList — scrollable table of all saved invoices.
 * Filters to the active profile's invoices.
 * Provides edit, print, and delete actions per row.
 */
export default function InvoiceList({ onEdit, onPrint, reloadKey }: Props) {
  const { t } = useTranslation();
  const { activeProfile, activeCurrency } = useProfile();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      let query = db.invoices.orderBy('date').reverse();
      if (activeProfile?.id != null) {
        const all = await query.toArray();
        setInvoices(all.filter((inv) => inv.profileId === activeProfile.id));
      } else {
        setInvoices(await query.toArray());
      }
    }
    load();
  }, [activeProfile, reloadKey]);

  async function confirmDelete(id: number) {
    await db.invoices.delete(id);
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    setDeleteId(null);
  }

  const fmt = (n: number, currency = activeCurrency) => formatCurrency(n, currency);

  if (invoices.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t('invoiceHistory')}</h2>
        <div className="text-center py-16 text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>{t('noInvoices')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">{t('invoiceHistory')}</h2>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
            <tr>
              <th className="text-left px-4 py-3">{t('invoiceNumber')}</th>
              <th className="text-left px-4 py-3">{t('clientName')}</th>
              <th className="text-left px-4 py-3">{t('date')}</th>
              <th className="text-left px-4 py-3">{t('status')}</th>
              <th className="text-right px-4 py-3">{t('totalAmount')}</th>
              <th className="text-right px-4 py-3">{t('remainingBalance')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-4 py-3 font-mono font-medium text-blue-600">
                  {inv.invoiceNumber}
                </td>
                <td className="px-4 py-3 text-gray-700">{inv.clientName}</td>
                <td className="px-4 py-3 text-gray-500">{inv.date}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_PILL[inv.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t(inv.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">
                  {fmt(inv.totalAmount, inv.currency)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-semibold ${
                    inv.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {fmt(inv.remainingBalance, inv.currency)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(inv)}
                      title={t('edit')}
                      className="p-1.5 rounded hover:bg-blue-100 text-blue-500"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onPrint(inv)}
                      title={t('print')}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(inv.id!)}
                      title={t('delete')}
                      className="p-1.5 rounded hover:bg-red-100 text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      {deleteId != null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <p className="text-gray-800 font-medium">{t('confirmDelete')}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">
                {t('cancel')}
              </button>
              <button
                onClick={() => confirmDelete(deleteId)}
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
