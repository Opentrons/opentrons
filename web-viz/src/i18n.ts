import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import protocolVisualization from './localization/en/protocol_visualization.json'

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      protocol_visualization: protocolVisualization,
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export { i18n }
