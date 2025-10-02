import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

import { baseI18nConfig } from '@opentrons/shared-data'

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
  debug: process.env.NODE_ENV === 'development',
  missingKeyHandler: (lng, ns, key) => {
    if (process.env.NODE_ENV === 'test') {
      console.error(`Missing ${lng} Translation: key={${key}} ns={${ns}}`)
    } else {
      console.warn(`Missing ${lng} Translation: key={${key}} ns={${ns}}`)
    }
  },
}

const i18nCb = (err?: Error): void => {
  if (err) {
    console.error('Internationalization failed to initialize:', err)
  }
}

void i18n.use(initReactI18next).init(i18nConfig, i18nCb)

export { i18n, i18nConfig, i18nCb }
