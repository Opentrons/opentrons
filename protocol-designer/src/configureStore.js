import {createStore, combineReducers, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'
import mapValues from 'lodash/mapValues'
import merge from 'lodash/merge'

function getRootReducer () {
  const LOAD_FILE = require('./load-file').actions.LOAD_FILE

  const rootReducer = combineReducers({
    fileData: require('./file-data').rootReducer,
    labwareIngred: require('./labware-ingred/reducers').default,
    navigation: require('./navigation').rootReducer,
    pipettes: require('./pipettes').rootReducer,
    steplist: require('./steplist/reducers').default,
    wellSelection: require('./well-selection/reducers').default
  })

  const prereducers = {
    fileData: require('./load-file/prereducers/file-data').default,
    navigation: require('./load-file/prereducers/navigation').default,
    pipettes: require('./load-file/prereducers/pipettes').default
  }

  return (state, action) => {
    if (action.type === LOAD_FILE) {
      const initialState = rootReducer(undefined, {})
      const file = action.payload

      // merge initial Redux state with result of "prereducers"
      return merge(
        {}, // avoid mutating initialState, so root selectors aren't cached on old values
        initialState,
        mapValues(prereducers, prereducerKeys =>
          mapValues(prereducerKeys, prereducer =>
            prereducer(file)
          )
        )
      )
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
