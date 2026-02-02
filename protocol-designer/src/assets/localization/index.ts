import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

import { baseI18nConfig } from '@opentrons/components'

import { en } from './en'

i18n.use(initReactI18next).init(
  {
    ...baseI18nConfig,
    resources: { en },
    keySeparator: '.',
    saveMissing: false,
    debug: false,
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
