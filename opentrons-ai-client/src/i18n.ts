import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

import { baseI18nConfig } from '@opentrons/components'

import { resources } from './assets/localization'

i18n.use(initReactI18next).init(
  {
    ...baseI18nConfig,
    resources,
    debug: _NODE_ENV_ === 'development',
    ns: ['shared'],
    keySeparator: false, // use namespaces and context instead
    missingKeyHandler: (lng, ns, key) => {
      _NODE_ENV_ === 'test'
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
