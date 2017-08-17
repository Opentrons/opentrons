// client entry point and application manifest
import React from 'react'
import ReactDom from 'react-dom'
import {Provider} from 'react-redux'
import {createStore, combineReducers, applyMiddleware} from 'redux'
import {AppContainer} from 'react-hot-loader'
import {createLogger} from 'redux-logger'

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
import Root from './containers/Root'

const reducer = combineReducers({
  [INTERFACE_NAME]: interfaceReducer,
  [ROBOT_NAME]: robotReducer
})

const middleware = applyMiddleware(
  robotApiMiddleware,
  // TODO(mc): log to file instead of console in prod
  createLogger()
)

const store = createStore(reducer, middleware)

const render = (Component) => ReactDom.render(
  (
    <Provider store={store}>
      <AppContainer>
        <Component store={store} />
      </AppContainer>
    </Provider>
  ),
  document.getElementById('root')
)

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    render(require('./containers/Root').default)
  })
}

if (process.env.NODE_ENV === 'development') {
  global.store = store
}

render(Root)
