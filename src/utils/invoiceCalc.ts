import type { LineItem, InvoiceTotals } from '../types';
import type { CurrencyCode } from '../types';
import { roundForCurrency } from './currency';

/**
 * Computes the line total for a single item row.
 * Result is rounded to the currency's decimal precision.
 */
export function calcLineTotal(
  unitPrice: number,
  quantity: number,
  currency: CurrencyCode,
): number {
  return roundForCurrency(unitPrice * quantity, currency);
}

/**
 * Derives all financial totals from the invoice's items and rate fields.
 *
 * @param items    - Array of line items (lineTotal must already be set)
 * @param taxRate  - Tax percentage (0–100)
 * @param discount - Flat discount amount
 * @param amountPaid - Amount already paid
 * @param currency - Active currency (controls rounding)
 */
export function calcTotals(
  items: LineItem[],
  taxRate: number,
  discount: number,
  amountPaid: number,
  currency: CurrencyCode,
): InvoiceTotals {
  const subtotal = roundForCurrency(
    items.reduce((sum, item) => sum + item.lineTotal, 0),
    currency,
  );

  const taxAmount = roundForCurrency(subtotal * (taxRate / 100), currency);

  const totalAmount = roundForCurrency(
    Math.max(0, subtotal + taxAmount - discount),
    currency,
  );

  const remainingBalance = roundForCurrency(
    Math.max(0, totalAmount - amountPaid),
    currency,
  );

  return { subtotal, taxAmount, totalAmount, remainingBalance };
}
