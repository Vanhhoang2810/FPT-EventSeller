import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import viCommon from '../locales/vi/common.json';
import viAuth from '../locales/vi/auth.json';
import viEvents from '../locales/vi/events.json';
import viBooking from '../locales/vi/booking.json';
import viTickets from '../locales/vi/tickets.json';
import viAdmin from '../locales/vi/admin.json';
import viQueue from '../locales/vi/queue.json';
import viErrors from '../locales/vi/errors.json';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enEvents from '../locales/en/events.json';
import enBooking from '../locales/en/booking.json';
import enTickets from '../locales/en/tickets.json';
import enAdmin from '../locales/en/admin.json';
import enQueue from '../locales/en/queue.json';
import enErrors from '../locales/en/errors.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'vi',
    supportedLngs: ['vi', 'en'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'events', 'booking', 'tickets', 'admin', 'queue', 'errors'],
    resources: {
      vi: { common: viCommon, auth: viAuth, events: viEvents, booking: viBooking, tickets: viTickets, admin: viAdmin, queue: viQueue, errors: viErrors },
      en: { common: enCommon, auth: enAuth, events: enEvents, booking: enBooking, tickets: enTickets, admin: enAdmin, queue: enQueue, errors: enErrors },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'Ticket Rush_lang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
