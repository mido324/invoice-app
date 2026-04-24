import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, FileText, Pencil, Printer, Trash2 } from 'lucide-react';
import { db } from '../db/db';
import { useProfile } from '../context/ProfileContext';
import { useToast } from './Toast';
import { formatCurrency } from '../utils/currency';
import type { Invoice } from '../types';

interface Props {
  onEdit: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  onDuplicate: (invoice: Invoice) => void;
  onCreateNew: () => void;
  reloadKey?: number;
}

const STATUS_PILL: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  partial:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function InvoiceList({ onEdit, onPrint, onDuplicate, onCreateNew, reloadKey }: Props) {
  const { t } = useTranslation();
  const { activeProfile, activeCurrency } = useProfile();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const pendingDeletes = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    async function load() {
      const query = db.invoices.orderBy('date').reverse();
      if (activeProfile?.id != null) {
        const all = await query.toArray();
        setInvoices(all.filter((inv) => inv.profileId === activeProfile.id));
      } else {
        setInvoices(await query.toArray());
      }
    }
    load();
  }, [activeProfile, reloadKey]);

  function handleDelete(inv: Invoice) {
    const id = inv.id!;
    setInvoices((prev) => prev.filter((i) => i.id !== id));

    const timer = setTimeout(async () => {
      await db.invoices.delete(id);
      pendingDeletes.current.delete(id);
    }, 5000);

    pendingDeletes.current.set(id, timer);

    showToast(t('invoiceDeleted'), 'success', {
      label: t('undo'),
      onClick: () => {
        clearTimeout(timer);
        pendingDeletes.current.delete(id);
        setInvoices((prev) =>
          [...prev, inv].sort((a, b) => b.date.localeCompare(a.date)),
        );
      },
    });
  }

  const fmt = (n: number, currency = activeCurrency) => formatCurrency(n, currency);

  if (invoices.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t('invoiceHistory')}</h2>
        <div className="text-center py-20 text-gray-400 space-y-4">
          <FileText size={52} className="mx-auto opacity-20" />
          <p className="text-gray-500">{t('noInvoices')}</p>
          <button onClick={onCreateNew} className="btn-primary inline-flex">
            {t('createFirstInvoice')}
          </button>
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
                  <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(inv)}
                      title={t('edit')}
                      className="p-1.5 rounded hover:bg-blue-100 text-blue-500"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDuplicate(inv)}
                      title={t('duplicate')}
                      className="p-1.5 rounded hover:bg-indigo-100 text-indigo-400"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => onPrint(inv)}
                      title={t('print')}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(inv)}
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
    </div>
  );
}
