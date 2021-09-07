import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './assets/localization'

i18n.use(initReactI18next).init(
  {
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: true,
    ns: [
      'shared',
      'robot_advanced_settings',
      'robot_calibration',
      'robot_connection',
      'robot_controls',
      'robot_info',
      'top_navigation',
    ],
    defaultNS: 'shared',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    keySeparator: false, // use namespaces and context instead
    saveMissing: true,
    missingKeyHandler: (lng, ns, key) => {
      process.env.NODE_ENV === 'test'
        ? console.error(`Missing ${lng} Translation: key={${key}} ns={${ns}}`)
        : console.warn(`Missing ${lng} Translation: key={${key}} ns={${ns}}`)
    },
  },
  err => {
    if (err) {
      console.error(
        'Internationalization was not initialized properly. error: ',
        err
      )
    }
  }
)

export { i18n }
