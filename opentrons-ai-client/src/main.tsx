import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'

import { i18n } from './i18n'
import { App } from './App'

const rootElement = document.getElementById('root')
if (rootElement != null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </React.StrictMode>
  )
} else {
  console.error('Root element not found')
}
