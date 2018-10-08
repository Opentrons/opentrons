import {createStore, combineReducers, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'

function getRootReducer () {
  const rootReducer = combineReducers({
    dismiss: require('./dismiss').rootReducer,
    fileData: require('./file-data').rootReducer,
    labwareIngred: require('./labware-ingred/reducers').default,
    loadFile: require('./load-file').rootReducer,
    navigation: require('./navigation').rootReducer,
    pipettes: require('./pipettes').rootReducer,
    steplist: require('./steplist').rootReducer,
    tutorial: require('./tutorial').rootReducer,
    wellSelection: require('./well-selection/reducers').default,
  })

  return (state, action) => {
    if (action.type === 'LOAD_FILE' || action.type === 'CREATE_NEW_PROTOCOL') {
      // reset entire state, then pass the action
      return rootReducer(undefined, action)
    }
    return rootReducer(state, action)
  }
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
      './dismiss/reducers',
      './file-data/reducers',
      './labware-ingred/reducers',
      './load-file/reducers',
      './navigation/reducers',
      './pipettes',
      './steplist/reducers',
      './tutorial/reducers',
      './well-selection/reducers',
    ], replaceReducers)
  }

  return store
}
