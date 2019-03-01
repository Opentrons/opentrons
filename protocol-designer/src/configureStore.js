import {createStore, combineReducers, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'
import {makePersistSubscriber, rehydratePersistedAction} from './persist'
import {fileErrors} from './load-file/actions'

function getRootReducer () {
  const rootReducer = combineReducers({
    analytics: require('./analytics').rootReducer,
    dismiss: require('./dismiss').rootReducer,
    fileData: require('./file-data').rootReducer,
    labwareIngred: require('./labware-ingred/reducers').default,
    loadFile: require('./load-file').rootReducer,
    navigation: require('./navigation').rootReducer,
    stepForms: require('./step-forms').rootReducer,
    tutorial: require('./tutorial').rootReducer,
    ui: require('./ui').rootReducer,
    wellSelection: require('./well-selection/reducers').default,
  })

  return (state, action) => {
    if (action.type === 'LOAD_FILE' || action.type === 'CREATE_NEW_PROTOCOL') {
      const hydratedState = rootReducer(undefined, rehydratePersistedAction())

      // reset entire state, rehydrate from localStorage, then pass the action
      if (action.type === 'LOAD_FILE') {
        try {
          return rootReducer(hydratedState, action)
        } catch (e) {
          console.error(e)
          // something in the reducers went wrong, show it to the user for bug report
          return rootReducer(hydratedState, fileErrors({
            isError: true,
            errorType: 'INVALID_JSON_FILE',
            message: e.message,
          }))
        }
      }
      return rootReducer(hydratedState, action)
    }
    // pass-thru
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

  // initial rehydration, and persistence subscriber
  store.dispatch(rehydratePersistedAction())
  store.subscribe(makePersistSubscriber(store))

  function replaceReducers () {
    const nextRootReducer = getRootReducer()
    store.replaceReducer(nextRootReducer)
  }

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept([
      './analytics/reducers',
      './dismiss/reducers',
      './file-data/reducers',
      './labware-ingred/reducers',
      './load-file/reducers',
      './navigation/reducers',
      './step-forms/reducers',
      './tutorial/reducers',
      './ui/steps/reducers',
      './well-selection/reducers',
    ], replaceReducers)
  }

  return store
}
