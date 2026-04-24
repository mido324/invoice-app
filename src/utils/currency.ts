import { CURRENCIES, type CurrencyCode } from '../types';

/**
 * Formats a numeric amount as a localized currency string.
 *
 * Decimal places are determined by the currency (e.g. BHD/KWD/OMR = 3, others = 2).
 *
 * @param amount   - The numeric value to format
 * @param currency - ISO currency code (e.g. 'BHD', 'USD')
 * @param locale   - BCP 47 locale tag; defaults to 'en-US'
 * @returns        Formatted string like "BD 1.500" or "$ 12.99"
 *
 * @example
 * formatCurrency(1.5, 'BHD')  // → "BD 1.500"
 * formatCurrency(99.9, 'USD') // → "$ 99.90"
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale = 'en-US',
): string {
  const meta = CURRENCIES[currency];
  const fixed = amount.toFixed(meta.decimals);
  const [intPart, decPart] = fixed.split('.');

  const formattedInt = parseInt(intPart, 10).toLocaleString(locale);
  const number = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;

  return `${meta.symbol} ${number}`;
}

/**
 * Rounds a number to the correct decimal places for the given currency.
 * Use this before persisting calculated values to avoid floating-point drift.
 */
export function roundForCurrency(amount: number, currency: CurrencyCode): number {
  const decimals = CURRENCIES[currency].decimals;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
}

/**
 * Returns the currency symbol string for a given code.
 * @example currencySymbol('BHD') // → 'BD'
 */
export function currencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency].symbol;
}

/**
 * Rounds `amount` to the nearest multiple of `step`.
 *
 * Primary use-case: Iraqi Dinar (IQD) invoices, where the smallest
 * physical banknote in common circulation is 250 IQD.  Rounding the
 * invoice total to the nearest 250 means the customer can pay in exact
 * notes without needing change.
 *
 * @param amount - The raw numeric total
 * @param step   - The rounding step (e.g. 250 for IQD)
 * @returns        Amount rounded to the nearest `step`
 *
 * @example
 * roundToNearest(15_620, 250) // → 15_500  (rounds down)
 * roundToNearest(15_680, 250) // → 15_750  (rounds up)
 * roundToNearest(15_750, 250) // → 15_750  (already exact)
 */
export function roundToNearest(amount: number, step: number): number {
  if (step <= 0) return amount;
  return Math.round(amount / step) * step;
}

/**
 * Returns the rounding step for a currency.
 * IQD → 250  (smallest common banknote)
 * All others → 0  (no note-rounding needed)
 */
export function noteRoundingStep(currency: CurrencyCode): number {
  return currency === 'IQD' ? 250 : 0;
}
