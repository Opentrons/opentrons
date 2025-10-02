import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'

import { resources } from './localization/index'
import { titleCase } from './titleCase'

import type { InitOptions } from 'i18next'

export const baseI18nConfig: InitOptions = {
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'shared',
  interpolation: {
    escapeValue: false,
    format: function (value: string, format) {
      if (format === 'upperCase') return value.toUpperCase()
      if (format === 'lowerCase') return value.toLowerCase()
      if (format === 'capitalize') return capitalize(value)
      if (format === 'sentenceCase') return startCase(value)
      if (format === 'titleCase') return titleCase(value)
      return value
    },
  },
  keySeparator: false,
  saveMissing: true,
}
