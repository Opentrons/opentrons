import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'

import { titleCase } from '@opentrons/shared-data'

import { en } from './en'

i18n.use(initReactI18next).init(
  {
    lng: 'en',
    fallbackLng: 'en',
    resources: { en },
    ns: [
      'alert',
      'button',
      'card',
      'contex_menu',
      'deck',
      'feature_flags',
      'form',
      'liquids',
      'modal',
      'modules',
      'nav',
      'onboarding',
      'protocol_overview',
      'protocol_steps',
      'shared',
      'starting_deck_state',
      'tooltip',
      'well_selection',
    ],
    defaultNS: 'shared',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
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
