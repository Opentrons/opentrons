import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './assets/localization'

i18n.use(initReactI18next).init(
  {
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: true,
    ns: ['shared'],
    defaultNS: 'shared',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    saveMissing: true,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing Translation: key={${key}} ns={${ns}}`)
    },
  },
  (err, t) => {
    if (err) {
      console.error(
        'Internationalization was not initialized properly. error: ',
        err
      )
    }
  }
)

export { i18n }
