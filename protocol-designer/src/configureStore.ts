import {
  applyMiddleware,
  combineReducers,
  compose,
  legacy_createStore,
} from 'redux'
import { thunk } from 'redux-thunk'

import { rootReducer as analyticsReducer } from './analytics'
import { trackEventMiddleware } from './analytics/middleware'
import { rootReducer as dismissReducer } from './dismiss'
import { rootReducer as featureFlagsReducer } from './feature-flags'
import { rootReducer as fileDataReducer } from './file-data'
import { rootReducer as labwareIngredReducer } from './labware-ingred/reducers'
import { rootReducer as loadFileReducer } from './load-file'
import { fileUploadMessage } from './load-file/actions'
import { rootReducer as navigationReducer } from './navigation'
import { makePersistSubscriber, rehydratePersistedAction } from './persist'
import { rootReducer as stepFormsReducer } from './step-forms'
import { makeTimelineMiddleware } from './timelineMiddleware/makeTimelineMiddleware'
import { rootReducer as tutorialReducer } from './tutorial'
import { rootReducer as uiReducer } from './ui'
import { rootReducer as wellSelectionReducer } from './well-selection/reducers'

import type { Middleware, Reducer, Store, StoreEnhancer } from 'redux'
import type { ThunkMiddleware } from 'redux-thunk'
import type { Action, BaseState } from './types'

const timelineMiddleware = makeTimelineMiddleware()

type ReducerMap = {
  [K in keyof BaseState]: Reducer<BaseState[K], Action>
}

function getRootReducer(): Reducer<BaseState, Action> {
  const reducers: ReducerMap = {
    analytics: analyticsReducer,
    dismiss: dismissReducer,
    featureFlags: featureFlagsReducer,
    fileData: fileDataReducer,
    labwareIngred: labwareIngredReducer,
    loadFile: loadFileReducer,
    navigation: navigationReducer,
    stepForms: stepFormsReducer,
    tutorial: tutorialReducer,
    ui: uiReducer,
    wellSelection: wellSelectionReducer,
  }

  const combinedReducer = combineReducers(reducers)

  // TODO: Ian 2019-06-25 consider making file loading non-committal
  // so UNDO_LOAD_FILE doesnt' just reset Redux state
  return (state, action) => {
    if (
      action.type === 'LOAD_FILE' ||
      action.type === 'CREATE_NEW_PROTOCOL' ||
      action.type === 'UNDO_LOAD_FILE'
    ) {
      // reset entire state, rehydrate from localStorage
      const resetState = combinedReducer(undefined, rehydratePersistedAction())

      if (action.type === 'LOAD_FILE') {
        try {
          return combinedReducer(resetState, action)
        } catch (e) {
          console.error(e)
          if (e instanceof Error) {
            // something in the reducers went wrong, show it to the user for bug report
            return combinedReducer(
              state || resetState,
              fileUploadMessage({
                isError: true,
                errorType: 'INVALID_JSON_FILE',
                errorMessage: e.message,
              })
            )
          }
        }
      }

      return combinedReducer(resetState, action)
    }

    // pass-thru
    return combinedReducer(state, action)
  }
}

export type StoreType = Store<BaseState, Action>

export function configureStore(): StoreType {
  const reducer = getRootReducer()
  const composeEnhancers: any =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  const store = legacy_createStore(
    reducer,
    /* preloadedState, */
    composeEnhancers(
      applyMiddleware(
        timelineMiddleware as Middleware<BaseState, Record<string, any>, any>,
        thunk as ThunkMiddleware<BaseState, Action>,
        trackEventMiddleware as Middleware<BaseState, Record<string, any>, any>
      )
    ) as StoreEnhancer
  )

  // initial rehydration, and persistence subscriber
  store.dispatch(rehydratePersistedAction())
  store.subscribe(makePersistSubscriber(store))

  global.enablePrereleaseMode = () => {
    store.dispatch({
      type: 'SET_FEATURE_FLAGS',
      payload: {
        PRERELEASE_MODE: true,
      },
    })
  }

  return store
}
