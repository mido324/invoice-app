import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Printer } from 'lucide-react';
import type { Invoice, Profile } from '../types';
import { formatCurrency } from '../utils/currency';

interface Props {
  invoice: Invoice;
  profile: Profile | null;
  onClose: () => void;
}

/**
 * PrintView — A4-formatted invoice for browser print / Save as PDF.
 *
 * Print isolation strategy
 * ─────────────────────────
 * We assign `id="invoice-print-target"` to the white A4 container.
 * The global CSS sets `body { visibility: hidden }` in @media print, then
 * overrides with `#invoice-print-target, #invoice-print-target * { visibility: visible }`.
 * Because visibility is inherited (not layout-based), this works even though the
 * element is deeply nested — unlike the `display: none / block` approach which
 * breaks as soon as any ancestor is hidden.
 *
 * The element is then pulled to the top-left via `position: absolute; inset: 0`
 * so the @page margins are the only whitespace around the invoice.
 */
export default function PrintView({ invoice, profile, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const isRtl = i18n.language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  const fmt = (n: number) => formatCurrency(n, invoice.currency);

  /** Sets a descriptive document.title so the browser uses it as the PDF filename. */
  function handlePrint() {
    const prev = document.title;
    const sanitize  = (s: string) => s.replace(/[\\/:*?"<>|\s]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const storeName = sanitize(profile?.storeName ?? 'Invoice');
    const client    = sanitize(invoice.clientName  ?? 'Client');
    const date      =  invoice.date         ?? new Date().toISOString().split('T')[0];
    document.title  = `${storeName}_${client}_${date}`;
    window.print();
    document.title  = prev;
  }

  const STATUS_COLORS: Record<string, string> = {
    paid:      'bg-green-100  text-green-700',
    draft:     'bg-gray-100   text-gray-600',
    sent:      'bg-blue-100   text-blue-700',
    partial:   'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100    text-red-600',
  };

  return (
    <>
      {/* ── Screen-only toolbar ────────────────────────── */}
      {/* print:hidden keeps this bar out of the PDF entirely */}
      <div className="print:hidden fixed top-0 inset-x-0 z-50 bg-white border-b shadow-sm
                      flex items-center justify-between px-6 py-3">
        <span className="font-semibold text-gray-700">{invoice.invoiceNumber}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2"
          >
            <Printer size={16} />
            {t('print')}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── Screen preview wrapper ──────────────────────── */}
      {/* print:contents collapses this wrapper in print mode so it contributes   */}
      {/* no height/margin — only the A4 div below actually renders on the page.  */}
      <div className="mt-16 print:mt-0 bg-gray-100 print:bg-transparent
                      flex justify-center py-8 print:py-0 print:contents">

        {/* ── A4 invoice container ────────────────────────
            id="invoice-print-target" is the print isolation anchor.
            In @media print the global CSS makes only this element (and its
            children) visible, positioned at the page origin.                   */}
        <div
          id="invoice-print-target"
          ref={invoiceRef}
          dir={dir}
          className="bg-white w-[210mm] shadow-lg print:shadow-none
                     p-12 print:p-0
                     space-y-7
                     text-gray-800"
          style={{ fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}
        >

          {/* ── Page header ───────────────────────────── */}
          <header className="flex justify-between items-start gap-6">
            {/* Sender branding */}
            <div className="space-y-1 flex-1">
              {profile?.logo && (
                <img
                  src={profile.logo}
                  alt={profile.storeName}
                  className="h-14 object-contain mb-2"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.storeName ?? t('appName')}
              </h1>
              {profile?.address && (
                <p className="text-sm text-gray-500 whitespace-pre-line">{profile.address}</p>
              )}
              {profile?.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
              {profile?.email && <p className="text-sm text-gray-500">{profile.email}</p>}
            </div>

            {/* Invoice number / dates */}
            <div className="text-end space-y-1 shrink-0">
              <div className="text-3xl font-black text-blue-600 tracking-tight">
                {t('invoiceTitle')}
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">#</span> {invoice.invoiceNumber}
              </p>
              <p className="text-sm text-gray-500">
                {t('date')}:{' '}
                <span className="font-medium text-gray-700">{invoice.date}</span>
              </p>
              <p className="text-sm text-gray-500">
                {t('dueDate')}:{' '}
                <span className="font-medium text-gray-700">{invoice.dueDate}</span>
              </p>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1
                  ${STATUS_COLORS[invoice.status] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {t(invoice.status)}
              </span>
            </div>
          </header>

          <hr className="border-gray-200" />

          {/* ── Bill To ───────────────────────────────── */}
          <section className="avoid-break">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {t('to')}
            </p>
            <p className="font-bold text-gray-900 text-base">{invoice.clientName}</p>
            {invoice.clientEmail   && <p className="text-sm text-gray-500">{invoice.clientEmail}</p>}
            {invoice.clientPhone   && <p className="text-sm text-gray-500">{invoice.clientPhone}</p>}
            {invoice.clientAddress && (
              <p className="text-sm text-gray-500 whitespace-pre-line">{invoice.clientAddress}</p>
            )}
          </section>

          {/* ── Line-items table ──────────────────────── */}
          <section>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="text-start py-2 px-3 font-semibold text-gray-600 w-[30%]">
                    {t('itemName')}
                  </th>
                  <th className="text-start py-2 px-3 font-semibold text-gray-600">
                    {t('description')}
                  </th>
                  <th className="text-end py-2 px-3 font-semibold text-gray-600 w-[14%]">
                    {t('unitPrice')}
                  </th>
                  <th className="text-end py-2 px-3 font-semibold text-gray-600 w-[7%]">
                    {t('quantity')}
                  </th>
                  <th className="text-end py-2 px-3 font-semibold text-gray-600 w-[15%]">
                    {t('lineTotal')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  /* avoid-break prevents a row from being split across pages */
                  <tr
                    key={item.id}
                    className={`avoid-break ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                  >
                    <td className="py-2.5 px-3 font-medium text-gray-800 align-top">
                      {item.item || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs leading-relaxed
                                   whitespace-pre-wrap align-top">
                      {item.description || ''}
                    </td>
                    <td className="py-2.5 px-3 text-end font-mono text-gray-700 align-top">
                      {fmt(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-end text-gray-700 align-top">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-end font-mono font-semibold text-gray-800 align-top">
                      {fmt(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ── Financial summary ─────────────────────── */}
          {/* avoid-break keeps the whole totals block on one page */}
          <section className="flex justify-end avoid-break">
            <div className="w-72 space-y-1.5">
              <SummaryRow label={t('subtotal')} value={fmt(invoice.subtotal)} />

              {invoice.taxRate > 0 && (
                <SummaryRow
                  label={`${t('taxAmount')} (${invoice.taxRate}%)`}
                  value={fmt(invoice.taxAmount)}
                />
              )}

              {invoice.discount > 0 && (
                <SummaryRow
                  label={t('discount')}
                  value={`− ${fmt(invoice.discount)}`}
                  className="text-green-700"
                />
              )}

              <div className="border-t border-gray-300 pt-1.5">
                <SummaryRow label={t('totalAmount')} value={fmt(invoice.totalAmount)} bold />
              </div>

              {invoice.amountPaid > 0 && (
                <SummaryRow label={t('amountPaid')} value={fmt(invoice.amountPaid)} />
              )}

              <div className="border-t border-gray-800 pt-1.5">
                <SummaryRow
                  label={t('remainingBalance')}
                  value={fmt(invoice.remainingBalance)}
                  bold
                  className={invoice.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}
                />
              </div>
            </div>
          </section>

          {/* ── Notes ────────────────────────────────── */}
          {invoice.notes && (
            <section className="border-t pt-4 avoid-break">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                {t('notes')}
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </section>
          )}

          {/* ── Footer ───────────────────────────────── */}
          <footer className="border-t pt-4 text-center avoid-break">
            <p className="text-xs text-gray-400">{profile?.storeName}</p>
          </footer>

        </div>{/* end #invoice-print-target */}
      </div>{/* end screen preview wrapper */}
    </>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  className = '',
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex justify-between text-sm ${className}`}>
      <span className={bold ? 'font-semibold' : 'text-gray-600'}>{label}</span>
      <span className={`font-mono ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  );
}
