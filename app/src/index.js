// client entry point and application manifest
import React from 'react'
import ReactDom from 'react-dom'
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader'
import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import { ConnectedRouter, routerMiddleware } from 'connected-react-router'
import { createEpicMiddleware } from 'redux-observable'

import createLogger from './logger'
import { checkShellUpdate } from './shell'

import { apiClientMiddleware as robotApiMiddleware } from './robot'
import { initializeAnalytics } from './analytics'
import { initializeSupport, supportMiddleware } from './support'
import { startDiscovery } from './discovery'

import { rootReducer, history } from './reducer'
import { rootEpic } from './epic'

// components
import { App } from './components/App'

const log = createLogger(__filename)

const epicMiddleware = createEpicMiddleware()

const middleware = applyMiddleware(
  thunk,
  epicMiddleware,
  robotApiMiddleware(),
  supportMiddleware,
  routerMiddleware(history)
)

const composeEnhancers =
  (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ maxAge: 200 })) ||
  compose

const store = createStore(rootReducer, composeEnhancers(middleware))

epicMiddleware.run(rootEpic)

const renderApp = () =>
  ReactDom.render(
    <AppContainer>
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <App />
        </ConnectedRouter>
      </Provider>
    </AppContainer>,
    document.getElementById('root')
  )

if (module.hot) {
  module.hot.accept('./components/App', renderApp)
}

const { config } = store.getState()

// attach store to window if devtools are on
if (config.devtools) window.store = store

// initialize analytics and support after first render
store.dispatch(initializeAnalytics())
store.dispatch(initializeSupport())

// kickoff an initial update check at launch
store.dispatch(checkShellUpdate())

// kickoff a discovery run immediately
store.dispatch(startDiscovery())

log.info('Rendering app UI')
renderApp()
