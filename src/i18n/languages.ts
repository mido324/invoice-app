/** Top 25 languages by global usage — code, labels, and text direction. */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '简体中文', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', dir: 'ltr' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', dir: 'ltr' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', dir: 'ltr' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', dir: 'ltr' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', dir: 'ltr' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', dir: 'ltr' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const RTL_LANGUAGE_CODES = new Set<LanguageCode>(
  SUPPORTED_LANGUAGES.filter((l) => l.dir === 'rtl').map((l) => l.code),
);

export const SUPPORTED_LANGUAGE_CODES: LanguageCode[] = SUPPORTED_LANGUAGES.map((l) => l.code);

/** Normalize i18next codes like `en-US` → `en`. */
export function normalizeLanguageCode(code: string): string {
  return code.split('-')[0] ?? 'en';
}

export function getLanguageMeta(code: string) {
  const base = normalizeLanguageCode(code);
  return SUPPORTED_LANGUAGES.find((l) => l.code === base);
}

export function getLanguageDirection(code: string): 'ltr' | 'rtl' {
  return getLanguageMeta(code)?.dir ?? 'ltr';
}

export function isRtlLanguage(code: string): boolean {
  return getLanguageDirection(code) === 'rtl';
}

export function isSupportedLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGE_CODES.includes(normalizeLanguageCode(code) as LanguageCode);
}
