import { initReactI18next } from 'react-i18next'
import i18next from 'i18next'

import { resources } from './assets/localization'

export const i18n = i18next.createInstance()
i18n.use(initReactI18next).init({ lng: 'en', resources })

export function registerProtocolVisualizationI18n(
  i18nInstance: typeof i18n
): void {
  i18nInstance.addResourceBundle(
    'en',
    'protocol_visualization',
    resources,
    true,
    false
  )
}
