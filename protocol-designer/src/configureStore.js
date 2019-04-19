// @flow
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { makePersistSubscriber, rehydratePersistedAction } from './persist'
import { fileUploadMessage } from './load-file/actions'

const ReselectTools =
  process.env.NODE_ENV === 'development' ? require('reselect-tools') : undefined

function getRootReducer() {
  const rootReducer: any = combineReducers({
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

  return (state: any, action) => {
    if (action.type === 'LOAD_FILE' || action.type === 'CREATE_NEW_PROTOCOL') {
      // reset entire state, rehydrate from localStorage
      const resetState = rootReducer(undefined, rehydratePersistedAction())

      if (action.type === 'LOAD_FILE') {
        try {
          return rootReducer(resetState, action)
        } catch (e) {
          console.error(e)
          // something in the reducers went wrong, show it to the user for bug report
          return rootReducer(
            state,
            fileUploadMessage({
              isError: true,
              errorType: 'INVALID_JSON_FILE',
              errorMessage: e.message,
            })
          )
        }
      }
      return rootReducer(resetState, action)
    }
    // pass-thru
    return rootReducer(state, action)
  }
}

export default function configureStore() {
  const reducer = getRootReducer()

  const composeEnhancers: any =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  const store = createStore(
    reducer,
    /* preloadedState, */
    composeEnhancers(applyMiddleware(thunk))
  )

  // give reselect tools access to state if in dev env
  if (ReselectTools) ReselectTools.getStateWith(() => store.getState())

  // initial rehydration, and persistence subscriber
  store.dispatch(rehydratePersistedAction())
  store.subscribe(makePersistSubscriber(store))

  function replaceReducers() {
    const nextRootReducer = getRootReducer()
    store.replaceReducer(nextRootReducer)
  }
  // $FlowFixMe no module.hot
  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    // $FlowFixMe no module.hot
    module.hot.accept(
      [
        './analytics/reducers',
        './dismiss/reducers',
        './file-data/reducers',
        './labware-defs/reducers',
        './labware-ingred/reducers',
        './load-file/reducers',
        './navigation/reducers',
        './step-forms/reducers',
        './tutorial/reducers',
        './ui/steps/reducers',
        './well-selection/reducers',
      ],
      replaceReducers
    )
  }

  return store
}
