import i18next from 'i18next'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'
import { initReactI18next } from 'react-i18next'
import { titleCase } from '@opentrons/shared-data'
import { en } from './en'

// TODO(IL, 2020-06-08): use a proper type def for i18next module -- but flow-types seems wrong
interface I18n {
  t: (
    key: string | Array<string | null | undefined>,
    data?: Record<string, unknown> | string
  ) => string
}
// @ts-expect-error missing property t
export const i18n: I18n = i18next.use(initReactI18next).init(
  {
    lng: 'en',
    resources: {
      en,
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
      format: function (value, format, lng) {
        if (format === 'upperCase') return value.toUpperCase()
        if (format === 'capitalize') return capitalize(value)
        if (format === 'sentenceCase') return startCase(value)
        if (format === 'titleCase') return titleCase(value)
        return value
      },
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
