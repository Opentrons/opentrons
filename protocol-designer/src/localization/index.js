// @flow

import i18next from 'i18next'
import { en } from './en'

// TODO(IL, 2020-06-08): use a proper type def for i18next module -- but flow-types seems wrong
type I18n = {|
  t: (
    key: string | Array<?string>,
    data?: { [string]: mixed, ... } | string
  ) => string,
|}
export const i18n: I18n = i18next.init(
  {
    lng: 'en',
    resources: {
      en,
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
