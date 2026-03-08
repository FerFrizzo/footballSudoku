import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import ptBR from './locales/pt-BR';
import it from './locales/it';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import pl from './locales/pl';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', flag: '🇬🇧', nativeName: 'English' },
  { code: 'pt-BR', flag: '🇧🇷', nativeName: 'Português (Brasil)' },
  { code: 'it', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'es', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'pl', flag: '🇵🇱', nativeName: 'Polski' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
    it: { translation: it },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    pl: { translation: pl },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

export function changeLanguage(code: string) {
  i18n.changeLanguage(code);
}

export default i18n;
