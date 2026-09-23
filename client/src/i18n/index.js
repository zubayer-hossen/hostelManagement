import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en/translation.json';
import bn from '../locales/bn/translation.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'bn', label: 'বাংলা', short: 'বাং' },
];
const STORAGE_KEY = 'dhms_lang';

const saved = (() => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } })();
const initial = LANGUAGES.some((l) => l.code === saved) ? saved : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
});

document.documentElement.lang = initial;

export function changeLanguage(code) {
  i18n.changeLanguage(code);
  document.documentElement.lang = code;
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* storage unavailable */ }
}

export default i18n;
