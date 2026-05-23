import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGE_CODES } from './languages';

const localeModules = import.meta.glob('./locales/*/translation.json', { eager: true });

const resources: Record<string, { translation: Record<string, string> }> = {};

for (const [path, mod] of Object.entries(localeModules)) {
  const match = path.match(/\/locales\/([^/]+)\/translation\.json$/);
  if (!match) continue;
  resources[match[1]] = { translation: mod as Record<string, string> };
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGE_CODES],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
