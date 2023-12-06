import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'

import { configureStore } from './configureStore'
import { App } from './components/App'
import { initialize } from './initialize'
import { initializeMixpanel } from './analytics/mixpanel'
import { i18n } from './localization'

// initialize Redux
const store = configureStore()
initialize(store)

// initialize analytics
initializeMixpanel(store.getState())

const container = document.getElementById('root')

const root = ReactDOM.createRoot(container)

const render = (Component: any): void => {
  root.render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n as any}>
        <Component />
      </I18nextProvider>
    </Provider>
  )
}

render(App)
