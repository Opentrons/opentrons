import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'

import { titleCase } from '../titleCase'
import { sharedDataEn } from './en'

export { sharedDataEn } from './en'

i18n.use(initReactI18next).init(
  {
    lng: 'en',
    fallbackLng: 'en',
    resources: { sharedDataEn },
    ns: ['command_type_summary'],
    defaultNS: 'command_type_summary',
    interpolation: {
      format: function (value: string, format, lng) {
        if (format === 'upperCase') return value.toUpperCase()
        if (format === 'capitalize') return capitalize(value)
        if (format === 'sentenceCase') return startCase(value)
        if (format === 'titleCase') return titleCase(value)
        return value
      },
    },
    saveMissing: true,
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
