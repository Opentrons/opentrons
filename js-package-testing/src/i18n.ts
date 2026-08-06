import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'

import protocolVisualizationEn from './locale/en/protocol_visualization.json'

void i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      protocol_visualization: protocolVisualizationEn,
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

export { i18n }
