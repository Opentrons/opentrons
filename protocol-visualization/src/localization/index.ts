import type { i18n as I18nType } from 'i18next'

import protocolVisualizationEn from './en/protocol_visualization.json'

export { protocolVisualizationEn }

export function registerProtocolVisualizationI18n(i18n: I18nType): void {
  i18n.addResourceBundle(
    'en',
    'protocol_visualization',
    protocolVisualizationEn,
    true,
    true
  )
}
