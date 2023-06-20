import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { AppContainer } from 'react-hot-loader'

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

const render = (Component: any): void => {
  ReactDOM.render(
    <Provider store={store}>
      <AppContainer>
        <I18nextProvider i18n={i18n as any}>
          <Component />
        </I18nextProvider>
      </AppContainer>
    </Provider>,
    document.getElementById('root')
  )
}

render(App)

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./components/App', () => {
    render(App)
  })
}
