import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

import { baseI18nConfig } from '@opentrons/components'

import { resources } from './assets/localization'

import type { InitOptions } from 'i18next'

export const US_ENGLISH = 'en-US'
export const SIMPLIFIED_CHINESE = 'zh-CN'

// these strings will not be translated so should not be localized
export const US_ENGLISH_DISPLAY_NAME = 'English (US)'
export const SIMPLIFIED_CHINESE_DISPLAY_NAME = '中文'

export type Language = typeof US_ENGLISH | typeof SIMPLIFIED_CHINESE

export const LANGUAGES: Array<{ name: string; value: Language }> = [
  { name: US_ENGLISH_DISPLAY_NAME, value: US_ENGLISH },
  { name: SIMPLIFIED_CHINESE_DISPLAY_NAME, value: SIMPLIFIED_CHINESE },
]

const i18nConfig: InitOptions = {
  ...baseI18nConfig,
  resources,
  debug: _NODE_ENV_ === 'development',
  keySeparator: false, // use namespaces and context instead
  missingKeyHandler: (lng, ns, key) => {
    _NODE_ENV_ === 'test'
      ? console.error(`Missing ${lng} Translation: key={${key}} ns={${ns}}`)
      : console.warn(`Missing ${lng} Translation: key={${key}} ns={${ns}}`)
  },
}

const i18nCb = (err?: Error): void => {
  if (err != null) {
    console.error(
      'Internationalization was not initialized properly. error: ',
      err
    )
  }
}

void i18n.use(initReactI18next).init(i18nConfig, i18nCb)

export { i18n, i18nCb, i18nConfig }
