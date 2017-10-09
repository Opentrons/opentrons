import { createStore, combineReducers } from 'redux'

export default function configureStore () {
  const reducer = combineReducers(require('./reducers/index'))
  const store = createStore(
    reducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
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
