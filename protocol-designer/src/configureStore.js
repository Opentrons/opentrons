import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import {rootReducer as fileDataRootReducer} from './file-data'
import labwareIngredRootReducer from './labware-ingred/reducers'
import {rootReducer as navigationRootReducer} from './navigation'
import {rootReducer as pipetteRootReducer} from './pipettes'
import steplistRootReducer from './steplist/reducers'
import wellSelectionRootReducer from './well-selection/reducers'

// TODO: Ian 2018-01-15 how to make this more DRY with hot reloading?
function getRootReducer () {
  return combineReducers({
    fileData: require('./file-data').rootReducer,
    labwareIngred: require('./labware-ingred/reducers'),
    navigation: require('./navigation').rootReducer,
    pipettes: require('./pipettes').rootReducer,
    steplist: require('./steplist/reducers'),
    wellSelection: require('./well-selection/reducers')
  })
}

export default function configureStore () {
  const reducer = combineReducers({
    fileData: fileDataRootReducer,
    labwareIngred: labwareIngredRootReducer,
    navigation: navigationRootReducer,
    pipettes: pipetteRootReducer,
    steplist: steplistRootReducer,
    wellSelection: wellSelectionRootReducer
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
    module.hot.accept('./file-data/reducers', replaceReducers)
    module.hot.accept('./labware-ingred/reducers', replaceReducers)
    module.hot.accept('./navigation/reducers', replaceReducers)
    module.hot.accept('./pipettes', replaceReducers)
    module.hot.accept('./steplist/reducers', replaceReducers)
    module.hot.accept('./well-selection/reducers', replaceReducers)
  }

  return store
}
