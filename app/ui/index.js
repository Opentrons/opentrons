// client entry point and application manifest
import React from 'react'
import ReactDom from 'react-dom'
import {Provider} from 'react-redux'
import {createStore, combineReducers, applyMiddleware} from 'redux'
import {AppContainer} from 'react-hot-loader'
import {createLogger} from 'redux-logger'

// robot logic
import {
  NAME as ROBOT_NAME,
  reducer as robotReducer,
  apiMiddleware as robotApiMiddleware
} from './robot'

// components
import App from './components/app'

const reducer = combineReducers({
  [ROBOT_NAME]: robotReducer
})

const middleware = applyMiddleware(
  robotApiMiddleware,
  // TODO(mc): log to file instead of console in prod
  createLogger(),
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
  module.hot.accept('./components/app', () => {
    const nextApp = require('./components/app').default
    render(nextApp)
  })
}

render(App)
