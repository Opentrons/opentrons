import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom/client'

import '@opentrons/components/styles/global'

import { initializeMixpanel } from './analytics/mixpanel'
import { App } from './App'
import { GlobalStyle } from './components/atoms'
import { configureStore } from './configureStore'
import { initialize } from './initialize'
import { initializeSentry } from './resources/sentry'

import type { ReactNode } from 'react'

import { i18n } from './assets/localization'

// initialize Redux
const store = configureStore()
initialize(store)

// initialize analytics
initializeMixpanel(store.getState())

// initialize Sentry
initializeSentry(store.getState())

const container = document.getElementById('root')
if (container == null) throw new Error('Failed to find the root element')
const root = ReactDOM.createRoot(container)

const RootComponent = (): ReactNode => {
  return (
    <>
      <GlobalStyle />
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </>
  )
}

root.render(
  <Provider store={store}>
    <RootComponent />
  </Provider>
)
