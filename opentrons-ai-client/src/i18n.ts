import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

import { baseI18nConfig } from '@opentrons/shared-data'

i18n.use(initReactI18next).init(
  {
    ...baseI18nConfig,
    debug: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'test') {
        console.error(`Missing ${lng} Translation: key={${key}} ns={${ns}}`)
      } else {
        console.warn(`Missing ${lng} Translation: key={${key}} ns={${ns}}`)
      }
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
