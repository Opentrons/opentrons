// @flow

import i18next from 'i18next'
import en from './en'

i18next.init(
  {
    lng: 'en',
    debug: true,
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

export default i18next
