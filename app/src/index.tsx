// client entry point and application manifest
import React from 'react'
import ReactDom from 'react-dom'
import { Provider } from 'react-redux'

import { ConnectedRouter } from 'connected-react-router'

import { I18nextProvider } from 'react-i18next'
import { ApiClientProvider } from '@opentrons/react-api-client'

import { i18n } from './i18n'
import { createLogger } from './logger'

import { uiInitialized } from './redux/shell'
import { history } from './redux/reducer'
import { store } from './redux/store'

import './styles.global.css'

// component tree
import { App } from './App'

const log = createLogger(__filename)

// kickoff app-shell initializations
store.dispatch(uiInitialized())

log.info('Rendering app UI')

const container = document.getElementById('root')

const root = ReactDom.createRoot(container)

root.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <ApiClientProvider>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </ApiClientProvider>
    </ConnectedRouter>
  </Provider>
)
