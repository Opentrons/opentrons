// client entry point and application manifest
import React from 'react'
import ReactDom from 'react-dom'
import {Provider} from 'react-redux'
import {createStore, combineReducers} from 'redux'
import {AppContainer} from 'react-hot-loader'

// reducers
import {NAME as ROBOT_NAME, reducer as robotReducer} from './robot'

// components
import App from './components/app'

const rootReducer = combineReducers({
  [ROBOT_NAME]: robotReducer
})

const store = createStore(rootReducer)

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
