import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'

import { i18n } from './i18n'
import { App } from './App'

import '@opentrons/components/styles'
import '@opentrons/components/styles/global'

const container = document.getElementById('root')
if (container == null) {
  throw new Error('Failed to find the root element')
}

const root = ReactDOM.createRoot(container)
root.render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
)
