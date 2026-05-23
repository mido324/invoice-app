import Dexie, { type EntityTable } from 'dexie';
import type { Invoice, Profile, AppSettings } from '../types';

/**
 * InvoiceDB — the application's IndexedDB database.
 *
 * Schema version history:
 *   v1 — initial schema: profiles, invoices, settings
 */
class InvoiceDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  invoices!: EntityTable<Invoice, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('InvoiceAppDB');

    this.version(1).stores({
      /**
       * profiles: indexed on id (auto-key) and storeName for quick lookup.
       */
      profiles: '++id, storeName',

      /**
       * invoices: indexed on id, invoiceNumber, profileId, date, and status
       * for flexible querying (filter by profile, sort by date, etc.).
       */
      invoices: '++id, invoiceNumber, profileId, date, status, clientName',

      /**
       * settings: single-row table (id=1 always), no secondary indexes needed.
       */
      settings: '++id',
    });
  }
}

export const db = new InvoiceDB();

/**
 * Ensures a default AppSettings row exists (id=1).
 * Call once at app startup.
 */
export async function initSettings(): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const existing = await db.settings.get(1);
    if (existing) return;
    try {
      await db.settings.add({
        id: 1,
        activeProfileId: null,
        language: 'en',
        invoiceSequence: 1,
      });
    } catch (err) {
      // React StrictMode double-mount can race two inits; row may exist by now.
      if (!(err instanceof Dexie.ConstraintError)) throw err;
    }
  });
}

/**
 * Reads the singleton settings row.
 */
export async function getSettings(): Promise<AppSettings> {
  const s = await db.settings.get(1);
  if (!s) throw new Error('Settings not initialized');
  return s;
}

/**
 * Partially updates the singleton settings row.
 * @param patch — fields to merge into the settings row
 */
export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  await db.settings.update(1, patch);
}

/**
 * Generates the next formatted invoice number and increments the sequence.
 * Format: INV-YYYY-NNNN  (e.g. INV-2024-0003)
 */
export async function nextInvoiceNumber(): Promise<string> {
  return db.transaction('rw', db.settings, async () => {
    const s = await db.settings.get(1);
    if (!s) throw new Error('Settings not initialized');
    const year = new Date().getFullYear();
    const num = String(s.invoiceSequence).padStart(4, '0');
    await db.settings.update(1, { invoiceSequence: s.invoiceSequence + 1 });
    return `INV-${year}-${num}`;
  });
}
