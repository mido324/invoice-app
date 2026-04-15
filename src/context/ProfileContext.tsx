import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { db, getSettings, updateSettings } from '../db/db';
import type { Profile, CurrencyCode } from '../types';
import { CURRENCIES } from '../types';

interface ProfileContextValue {
  /** Currently active business profile, or null if none selected */
  activeProfile: Profile | null;
  /** Currency code derived from the active profile (falls back to 'USD') */
  activeCurrency: CurrencyCode;
  /** All profiles stored in the database */
  profiles: Profile[];
  /** Switch the active profile by ID and persist the choice */
  setActiveProfileId: (id: number) => Promise<void>;
  /** Reload profiles list from IndexedDB */
  reloadProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * ProfileProvider — wraps the entire app and broadcasts the active profile
 * and derived currency to all consumers via context.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  const reloadProfiles = useCallback(async () => {
    const all = await db.profiles.toArray();
    setProfiles(all);

    const settings = await getSettings();
    if (settings.activeProfileId != null) {
      const found = all.find((p) => p.id === settings.activeProfileId) ?? null;
      setActiveProfile(found);
    } else if (all.length > 0) {
      // Auto-select the first profile if no preference is stored
      setActiveProfile(all[0]);
      await updateSettings({ activeProfileId: all[0].id! });
    } else {
      setActiveProfile(null);
    }
  }, []);

  useEffect(() => {
    reloadProfiles();
  }, [reloadProfiles]);

  const setActiveProfileId = useCallback(
    async (id: number) => {
      await updateSettings({ activeProfileId: id });
      const found = profiles.find((p) => p.id === id) ?? null;
      setActiveProfile(found);
    },
    [profiles],
  );

  const activeCurrency: CurrencyCode =
    activeProfile?.currency && activeProfile.currency in CURRENCIES
      ? activeProfile.currency
      : 'USD';

  return (
    <ProfileContext.Provider
      value={{ activeProfile, activeCurrency, profiles, setActiveProfileId, reloadProfiles }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

/**
 * Hook to consume the active profile and currency from any component.
 * Must be used inside <ProfileProvider>.
 */
export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}
