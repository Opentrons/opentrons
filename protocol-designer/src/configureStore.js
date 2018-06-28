import {createStore, combineReducers, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'

function getRootReducer () {
  return combineReducers({
    fileData: require('./file-data').rootReducer,
    labwareIngred: require('./labware-ingred/reducers').default,
    navigation: require('./navigation').rootReducer,
    pipettes: require('./pipettes').rootReducer,
    steplist: require('./steplist/reducers').default,
    wellSelection: require('./well-selection/reducers').default
  })
}

export default function configureStore () {
  const reducer = getRootReducer()

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
    module.hot.accept([
      './file-data/reducers',
      './labware-ingred/reducers',
      './navigation/reducers',
      './pipettes',
      './steplist/reducers',
      './well-selection/reducers'
    ], replaceReducers)
  }

  return store
}
