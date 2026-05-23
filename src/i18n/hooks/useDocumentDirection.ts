import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguageDirection, normalizeLanguageCode } from '../languages';

/**
 * Keeps `<html dir>` and `<html lang>` in sync with the active i18next locale.
 * RTL languages (ar, fa, he) flip document direction automatically.
 */
export function useDocumentDirection() {
  const { i18n } = useTranslation();
  const language = normalizeLanguageCode(i18n.language);
  const dir = getLanguageDirection(i18n.language);
  const isRtl = dir === 'rtl';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return { dir, isRtl, language };
}
