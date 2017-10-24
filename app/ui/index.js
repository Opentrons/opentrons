// client entry point and application manifest
import React from 'react'
import ReactDom from 'react-dom'
import {Provider} from 'react-redux'
import {AppContainer} from 'react-hot-loader'
import {createStore, combineReducers, applyMiddleware} from 'redux'
import {createLogger} from 'redux-logger'
import createHistory from 'history/createBrowserHistory'
import {
  ConnectedRouter,
  routerReducer,
  routerMiddleware
} from 'react-router-redux'

// interface state
import {
  NAME as INTERFACE_NAME,
  reducer as interfaceReducer
} from './interface'

// robot state
import {
  NAME as ROBOT_NAME,
  reducer as robotReducer,
  apiClientMiddleware as robotApiMiddleware
} from './robot'

// components
import App from './components/App'

const reducer = combineReducers({
  [INTERFACE_NAME]: interfaceReducer,
  [ROBOT_NAME]: robotReducer,
  router: routerReducer
})

const history = createHistory()

const middleware = applyMiddleware(
  robotApiMiddleware,
  routerMiddleware(history),
  // TODO(mc): log to file instead of console in prod
  createLogger()
)

const store = createStore(reducer, middleware)

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

if (process.env.NODE_ENV === 'development') {
  global.store = store
}

renderApp()
