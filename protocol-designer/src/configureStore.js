import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

export default function configureStore () {
  const reducer = combineReducers(require('./reducers/index'))
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  const store = createStore(
    reducer,
    /* preloadedState, */
    composeEnhancers(applyMiddleware(thunk))
  )

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers/index', () => {
      const nextRootReducer = combineReducers(require('./reducers/index'))
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}
