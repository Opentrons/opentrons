import { initReactI18next } from 'react-i18next'
import i18next from 'i18next'

import en from './locale/en/protocol_visualization.json'

export const i18n = i18next.createInstance()
i18n
  .use(initReactI18next)
  .init({ lng: 'en', resources: { en: { protocol_visualization: en } } })

export function registerProtocolVisualizationI18n(i18nInstance: typeof i18n): void {
  i18nInstance.addResourceBundle(
    'en',
    'protocol_visualization',
    en,
    true,
    false
  )
}
