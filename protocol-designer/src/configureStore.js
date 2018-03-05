import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import labwareIngredRootReducer from './labware-ingred/reducers'
import steplistRootReducer from './steplist/reducers'
import {rootReducer as navigationRootReducer} from './navigation'
import {rootReducer as fileDataRootReducer} from './file-data'

// TODO: Ian 2018-01-15 how to make this more DRY with hot reloading?
function getRootReducer () {
  return combineReducers({
    labwareIngred: require('./labware-ingred/reducers'),
    steplist: require('./steplist/reducers'),
    navigation: require('./navigation').rootReducer,
    fileData: require('./file-data').rootReducer
  })
}

export default function configureStore () {
  const reducer = combineReducers({
    labwareIngred: labwareIngredRootReducer,
    steplist: steplistRootReducer,
    navigation: navigationRootReducer,
    fileData: fileDataRootReducer
  })

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  const store = createStore(
    reducer,
    /* preloadedState, */
    composeEnhancers(applyMiddleware(thunk))
  )

  function replaceReducers () {
    const nextRootReducer = getRootReducer()
    store.replaceReducer(nextRootReducer)
  }

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./labware-ingred/reducers', replaceReducers)
    module.hot.accept('./steplist/reducers', replaceReducers)
    module.hot.accept('./navigation/reducers', replaceReducers)
    module.hot.accept('./file-data/reducers', replaceReducers)
  }

  return store
}
