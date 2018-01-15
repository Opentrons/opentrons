import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import labwareIngredRootReducer from './labware-ingred/reducers'
// import steplistRootReducer from './steplist/reducers'

export default function configureStore () {
  const reducer = labwareIngredRootReducer
  // TODO: also use steplist reducer
  // const reducer = combineReducers({
  //   labwareIngred: labwareIngredRootReducer,
  //   steplist: steplistRootReducer
  // })
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  const store = createStore(
    reducer,
    /* preloadedState, */
    composeEnhancers(applyMiddleware(thunk))
  )

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    // TODO: also use steplist reducer
    module.hot.accept('./labware-ingred/reducers', () => {
      const nextRootReducer = combineReducers(require('./labware-ingred/reducers'))
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}
