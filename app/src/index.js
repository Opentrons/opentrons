// client entry point and application manifest
import React from 'react'
import ReactDom from 'react-dom'
import {Provider} from 'react-redux'
import {AppContainer} from 'react-hot-loader'
import {createStore, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'
import createHistory from 'history/createHashHistory'
import {ConnectedRouter, routerMiddleware} from 'react-router-redux'

import createLogger from './logger'
import {checkShellUpdate, shellMiddleware} from './shell'

import {healthCheckMiddleware} from './health-check'
import {apiClientMiddleware as robotApiMiddleware} from './robot'
import {initializeAnalytics, analyticsMiddleware} from './analytics'
import {initializeSupport, supportMiddleware} from './support'
import {startDiscovery} from './discovery'

import reducer from './reducer'

// components
import App from './components/App'

const log = createLogger(__filename)

const history = createHistory()

const middleware = applyMiddleware(
  thunk,
  robotApiMiddleware(),
  shellMiddleware,
  healthCheckMiddleware,
  analyticsMiddleware,
  supportMiddleware,
  routerMiddleware(history)
)

const composeEnhancers = (
  (
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({maxAge: 200})
  ) ||
  compose
)

const store = createStore(reducer, composeEnhancers(middleware))

const renderApp = () => ReactDom.render(
  (
    <AppContainer>
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <App />
        </ConnectedRouter>
      </Provider>
    </AppContainer>
  ),
  document.getElementById('root')
)

if (module.hot) {
  module.hot.accept('./components/App', renderApp)
}

const {config} = store.getState()

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
