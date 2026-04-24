/**
 * Supported currency codes.
 * 3 decimal places: BHD, IQD, KWD, JOD.
 * 2 decimal places: all others.
 */
export type CurrencyCode =
  | 'IQD' | 'BHD' | 'KWD' | 'JOD' | 'OMR'
  | 'SAR' | 'AED' | 'QAR'
  | 'USD' | 'EUR'
  | 'GBP' | 'EGP'; // kept for backward-compatibility

/** Map of currency code → { symbol, decimals, name } */
export interface CurrencyMeta {
  symbol: string;
  decimals: number;
  name: string;
  nameAr: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  // ── 0-decimal local Dinar ──
  IQD: { symbol: 'IQD', decimals: 0, name: 'Iraqi Dinar',    nameAr: 'دينار عراقي' },
  // ── 2-decimal Gulf & regional currencies ──
  BHD: { symbol: 'BD',  decimals: 2, name: 'Bahraini Dinar', nameAr: 'دينار بحريني' },
  KWD: { symbol: 'KD',  decimals: 2, name: 'Kuwaiti Dinar',  nameAr: 'دينار كويتي' },
  JOD: { symbol: 'JD',  decimals: 2, name: 'Jordanian Dinar',nameAr: 'دينار أردني' },
  OMR: { symbol: 'OMR', decimals: 2, name: 'Omani Rial',     nameAr: 'ريال عُماني' },
  // ── 2-decimal Gulf currencies ──
  SAR: { symbol: 'SAR', decimals: 2, name: 'Saudi Riyal',    nameAr: 'ريال سعودي' },
  AED: { symbol: 'AED', decimals: 2, name: 'UAE Dirham',     nameAr: 'درهم إماراتي' },
  QAR: { symbol: 'QAR', decimals: 2, name: 'Qatari Riyal',   nameAr: 'ريال قطري' },
  // ── International ──
  USD: { symbol: '$',   decimals: 2, name: 'US Dollar',      nameAr: 'دولار أمريكي' },
  EUR: { symbol: '€',   decimals: 2, name: 'Euro',           nameAr: 'يورو' },
  // ── Legacy (backward-compat) ──
  GBP: { symbol: '£',   decimals: 2, name: 'British Pound',  nameAr: 'جنيه إسترليني' },
  EGP: { symbol: 'EGP', decimals: 2, name: 'Egyptian Pound', nameAr: 'جنيه مصري' },
};

/**
 * A single line-item row on an invoice.
 *
 * `item`        — product or service name (المنتج أو الصنف)
 * `description` — optional detailed notes / specifications (الوصف)
 */
export interface LineItem {
  id: string;
  /** Product / service name — e.g. "iPhone 15 Pro" */
  item: string;
  /** Detailed notes or specifications for this line — e.g. colour, size, warranty */
  description: string;
  /** Price per unit */
  unitPrice: number;
  /** Quantity ordered */
  quantity: number;
  /** Computed: unitPrice × quantity */
  lineTotal: number;
}

/**
 * Status of an invoice.
 */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'cancelled';

/**
 * Full invoice document stored in IndexedDB.
 */
export interface Invoice {
  /** Auto-incremented primary key */
  id?: number;
  /** Human-readable invoice number, e.g. "INV-2024-001" */
  invoiceNumber: string;
  /** ISO date string: YYYY-MM-DD */
  date: string;
  /** ISO date string for payment due date */
  dueDate: string;
  /** ID of the profile (business identity) that issued this invoice */
  profileId: number;
  /** Client / customer name */
  clientName: string;
  /** Client email address */
  clientEmail: string;
  /** Client phone number */
  clientPhone: string;
  /** Client mailing address */
  clientAddress: string;
  /** Line items on the invoice */
  items: LineItem[];
  /** Sum of all lineTotal values */
  subtotal: number;
  /** Tax rate as a percentage (e.g. 15 for 15%) */
  taxRate: number;
  /** Computed: subtotal × (taxRate / 100) */
  taxAmount: number;
  /** Flat discount amount (not percentage) */
  discount: number;
  /** Computed: subtotal + taxAmount − discount */
  totalAmount: number;
  /** Amount already paid by the client */
  amountPaid: number;
  /** Computed: totalAmount − amountPaid */
  remainingBalance: number;
  /** Invoice lifecycle status */
  status: InvoiceStatus;
  /** Optional notes or payment terms shown on the invoice */
  notes: string;
  /** Currency code in use when this invoice was created */
  currency: CurrencyCode;
}

/**
 * Business profile / tenant identity stored in IndexedDB.
 * Each profile represents a distinct business or brand.
 */
export interface Profile {
  /** Auto-incremented primary key */
  id?: number;
  /** Business / store display name */
  storeName: string;
  /** Primary phone number */
  phone: string;
  /** Business email */
  email: string;
  /** Physical or mailing address */
  address: string;
  /** Base64-encoded logo image (optional) */
  logo?: string;
  /** Preferred currency for this profile */
  currency: CurrencyCode;
  /** ISO date string when the profile was created */
  createdAt: string;
}

/**
 * App-wide settings stored as a single key-value row in IndexedDB.
 */
export interface AppSettings {
  id?: number;
  /** Currently active profile ID */
  activeProfileId: number | null;
  /** UI language: 'en' | 'ar' */
  language: 'en' | 'ar';
  /** Next invoice sequence number (auto-incremented per save) */
  invoiceSequence: number;
}

/**
 * Derived financial totals, computed from raw invoice fields.
 * Used in the form and print view.
 */
export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  remainingBalance: number;
}
