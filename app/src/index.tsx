// client entry point and application manifest
import { ApiClientProvider } from '@opentrons/react-api-client'
import { ConnectedRouter } from 'connected-react-router'
import React from 'react'
import ReactDom from 'react-dom'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'

// component tree
import { App } from './App'
import { i18n } from './i18n'
import { createLogger } from './logger'
import { history } from './redux/reducer'
import { uiInitialized } from './redux/shell'
import { store } from './redux/store'
import './styles.global.css'

const log = createLogger(__filename)

// kickoff app-shell initializations
store.dispatch(uiInitialized())

log.info('Rendering app UI')

ReactDom.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <ApiClientProvider>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </ApiClientProvider>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
)
