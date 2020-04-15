// @flow

import i18next from 'i18next'
import { en } from './en'

export const i18n = i18next.init(
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
