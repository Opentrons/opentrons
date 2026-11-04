import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'

import '@opentrons/protocol-visualization/styles'
import '@opentrons/components/styles/global'
import '@opentrons/components/styles'

import { App } from './App'
import { i18n } from './i18n'

const rootElement = document.getElementById('root')
if (rootElement == null) {
  throw new Error('Root element not found')
}
const root = createRoot(rootElement)

root.render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>
)
