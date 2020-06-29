// client entry point and application manifest
import { ConnectedRouter, routerMiddleware } from 'connected-react-router'
import React from 'react'
import ReactDom from 'react-dom'
import { Provider } from 'react-redux'
import { applyMiddleware, compose, createStore } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import thunk from 'redux-thunk'

// components
import { App } from './components/App'
import { rootEpic } from './epic'
import { createLogger } from './logger'
import { history, rootReducer } from './reducer'
import { apiClientMiddleware as robotApiMiddleware } from './robot/api-client'
import { uiInitialized } from './shell'

const log = createLogger(__filename)

const epicMiddleware = createEpicMiddleware()

const middleware = applyMiddleware(
  thunk,
  epicMiddleware,
  robotApiMiddleware(),
  routerMiddleware(history)
)

const composeEnhancers =
  (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ maxAge: 200 })) ||
  compose

const store = createStore(rootReducer, composeEnhancers(middleware))

epicMiddleware.run(rootEpic)

// attach store to window if devtools are on once config initializes
const unsubscribe = store.subscribe(() => {
  const { config } = store.getState()
  if (config !== null) {
    if (config.devtools) window.store = store
    unsubscribe()
  }
})

// kickoff app-shell initializations
store.dispatch(uiInitialized())

log.info('Rendering app UI')

ReactDom.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
)
