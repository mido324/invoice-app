import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Trash2, Printer } from 'lucide-react';
import { db, nextInvoiceNumber } from '../db/db';
import { useProfile } from '../context/ProfileContext';
import { calcLineTotal, calcTotals } from '../utils/invoiceCalc';
import { formatCurrency } from '../utils/currency';
import type { Invoice, LineItem, InvoiceStatus } from '../types';

/** Generates a random UUID using the Web Crypto API (no external dep needed). */
function newId(): string {
  return crypto.randomUUID();
}

const TODAY = new Date().toISOString().split('T')[0];
const DUE_DEFAULT = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

function emptyItem(): LineItem {
  return { id: newId(), item: '', description: '', unitPrice: 0, quantity: 1, lineTotal: 0 };
}

interface Props {
  /** When provided, the form operates in "edit" mode for this invoice. */
  existing?: Invoice;
  onSaved?: (invoice: Invoice) => void;
  onPrint?: (invoice: Invoice) => void;
}

/**
 * InvoiceForm — the main data-entry screen.
 * Handles dynamic line items, auto-calculated totals, and save/print actions.
 */
export default function InvoiceForm({ existing, onSaved, onPrint }: Props) {
  const { t } = useTranslation();
  const { activeProfile, activeCurrency } = useProfile();

  // ── Header fields ──────────────────────────────────────────────
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(TODAY);
  const [dueDate, setDueDate] = useState(DUE_DEFAULT);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [notes, setNotes] = useState('');

  // ── Line items ──────────────────────────────────────────────────
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  // ── Financial fields ────────────────────────────────────────────
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);

  // ── Derived totals (recomputed on every render) ─────────────────
  const totals = calcTotals(items, taxRate, discount, amountPaid, activeCurrency);

  // Populate form when editing an existing invoice
  useEffect(() => {
    if (existing) {
      setInvoiceNumber(existing.invoiceNumber);
      setDate(existing.date);
      setDueDate(existing.dueDate);
      setClientName(existing.clientName);
      setClientEmail(existing.clientEmail);
      setClientPhone(existing.clientPhone);
      setClientAddress(existing.clientAddress);
      setStatus(existing.status);
      setNotes(existing.notes);
      setItems(existing.items.length > 0 ? existing.items : [emptyItem()]);
      setTaxRate(existing.taxRate);
      setDiscount(existing.discount);
      setAmountPaid(existing.amountPaid);
    } else {
      // New invoice — generate a number
      nextInvoiceNumber().then(setInvoiceNumber);
    }
  }, [existing]);

  // ── Line item helpers ───────────────────────────────────────────

  const updateItem = useCallback(
    (id: string, patch: Partial<LineItem>) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, ...patch };
          updated.lineTotal = calcLineTotal(updated.unitPrice, updated.quantity, activeCurrency);
          return updated;
        }),
      );
    },
    [activeCurrency],
  );

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));

  // ── Save ────────────────────────────────────────────────────────

  async function buildInvoice(): Promise<Omit<Invoice, 'id'>> {
    return {
      invoiceNumber,
      date,
      dueDate,
      profileId: activeProfile?.id ?? 0,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      items,
      subtotal: totals.subtotal,
      taxRate,
      taxAmount: totals.taxAmount,
      discount,
      totalAmount: totals.totalAmount,
      amountPaid,
      remainingBalance: totals.remainingBalance,
      status,
      notes,
      currency: activeCurrency,
    };
  }

  async function handleSave() {
    const data = await buildInvoice();
    let saved: Invoice;
    if (existing?.id != null) {
      await db.invoices.update(existing.id, data);
      saved = { ...data, id: existing.id };
    } else {
      const id = await db.invoices.add(data as Invoice);
      saved = { ...data, id };
    }
    onSaved?.(saved);
  }

  async function handlePrint() {
    const data = await buildInvoice();
    // Auto-save before printing so the print view always has a persisted record
    let saved: Invoice;
    if (existing?.id != null) {
      await db.invoices.update(existing.id, data);
      saved = { ...data, id: existing.id };
    } else {
      const id = await db.invoices.add(data as Invoice);
      saved = { ...data, id };
    }
    onPrint?.(saved);
  }

  const fmt = (n: number) => formatCurrency(n, activeCurrency);

  const STATUS_OPTIONS: InvoiceStatus[] = ['draft', 'sent', 'paid', 'partial', 'cancelled'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Page title row — sits outside the card */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {existing ? invoiceNumber : t('newInvoice')}
          </h2>
          {activeProfile && (
            <p className="text-sm text-gray-400 mt-0.5">{activeProfile.storeName}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer size={16} />
            {t('print')}
          </button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            {t('save')}
          </button>
        </div>
      </div>

      {/* ── White card wraps the full form ── */}
      <div className="card p-6 md:p-8 space-y-8">

      {/* Invoice meta */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="field-label">{t('invoiceNumber')}</label>
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="input"
          />
        </div>
        <div className="space-y-1">
          <label className="field-label">{t('date')}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>
        <div className="space-y-1">
          <label className="field-label">{t('dueDate')}</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input"
          />
        </div>
        <div className="space-y-1">
          <label className="field-label">{t('status')}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
            className="input"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(s)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Client info */}
      <section className="space-y-3">
        <h3 className="section-title">{t('to')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="field-label">{t('clientName')}</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="input"
              placeholder={t('clientName')}
            />
          </div>
          <div className="space-y-1">
            <label className="field-label">{t('clientEmail')}</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="input"
              placeholder="client@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="field-label">{t('clientPhone')}</label>
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="input"
              placeholder="+973 3300 0000"
            />
          </div>
          <div className="space-y-1">
            <label className="field-label">{t('clientAddress')}</label>
            <input
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              className="input"
              placeholder="123 Main St, City"
            />
          </div>
        </div>
      </section>

      {/* Line items */}
      <section className="space-y-3">
        <h3 className="section-title">{t('items')}</h3>

        {/* Header row — desktop only, light-blue background */}
        <div className="hidden md:grid grid-cols-[1.2fr_2fr_120px_72px_110px_36px] gap-2
                        bg-blue-50 border border-blue-100 rounded-lg
                        text-xs font-semibold text-blue-700 uppercase px-3 py-2">
          <span>{t('itemName')}</span>
          <span>{t('description')}</span>
          <span className="text-right">{t('unitPrice')}</span>
          <span className="text-right">{t('quantity')}</span>
          <span className="text-right">{t('lineTotal')}</span>
          <span />
        </div>

        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 md:grid-cols-[1.2fr_2fr_120px_72px_110px_36px] gap-2 items-start"
          >
            {/* Product / item name */}
            <input
              value={item.item}
              onChange={(e) => updateItem(item.id, { item: e.target.value })}
              className="input"
              placeholder={t('itemName')}
            />
            {/* Detailed description — textarea so long text doesn't break layout */}
            <textarea
              value={item.description}
              onChange={(e) => updateItem(item.id, { description: e.target.value })}
              className="input resize-none leading-snug"
              rows={2}
              placeholder={t('description')}
            />
            <input
              type="number"
              min={0}
              step="any"
              value={item.unitPrice === 0 ? '' : item.unitPrice}
              onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
              className="input text-right"
              placeholder="0.00"
            />
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
              className="input text-right"
            />
            <div className="input bg-gray-50 text-right text-gray-700 font-medium pointer-events-none select-none">
              {fmt(item.lineTotal)}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors mt-1"
              title={t('removeItem')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          onClick={addItem}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-1 transition-colors"
        >
          <PlusCircle size={16} />
          {t('addItem')}
        </button>
      </section>

      {/* Financial summary */}
      <section className="flex justify-end">
        <div className="w-full max-w-sm space-y-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <TotalRow label={t('subtotal')} value={fmt(totals.subtotal)} />

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 flex-1">{t('taxRate')}</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="input w-20 text-right"
              />
              <span className="text-gray-500 text-sm">%</span>
            </div>
          </div>

          <TotalRow label={t('taxAmount')} value={fmt(totals.taxAmount)} />

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 flex-1">{t('discount')}</label>
            <input
              type="number"
              min={0}
              step="any"
              value={discount === 0 ? '' : discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="input w-32 text-right"
              placeholder="0.00"
            />
          </div>

          <div className="border-t pt-2">
            <TotalRow label={t('totalAmount')} value={fmt(totals.totalAmount)} bold />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 flex-1">{t('amountPaid')}</label>
            <input
              type="number"
              min={0}
              step="any"
              value={amountPaid === 0 ? '' : amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="input w-32 text-right"
              placeholder="0.00"
            />
          </div>

          <div className="border-t pt-2">
            <TotalRow
              label={t('remainingBalance')}
              value={fmt(totals.remainingBalance)}
              bold
              highlight={totals.remainingBalance > 0}
            />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-1">
        <label className="field-label">{t('notes')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input resize-none"
          rows={3}
          placeholder="Payment terms, bank details, thank-you note…"
        />
      </section>

      </div>{/* end card */}
    </div>
  );
}

function TotalRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className={`text-gray-600 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span
        className={`font-mono ${bold ? 'font-bold text-base' : ''} ${
          highlight ? 'text-red-600' : 'text-gray-800'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
