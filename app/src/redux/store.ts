import { applyMiddleware, compose, legacy_createStore } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import { thunk } from 'redux-thunk'

import { rootEpic } from './epic'
import { rootReducer } from './reducer'
import { expirationMiddleware } from './robot-auth'
import { robotUpdateMiddleware } from './robot-update/robotUpdateMiddleware'

import type { StoreEnhancer } from 'redux'
import type { Action, State } from './types'

const epicMiddleware = createEpicMiddleware<Action, Action, State, any>()

const middleware = applyMiddleware(
  thunk,
  epicMiddleware,
  expirationMiddleware.middleware,
  robotUpdateMiddleware.middleware
)

const composeEnhancers =
  (window as any)?.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?.({ maxAge: 200 }) ??
  compose

export const store = legacy_createStore(
  rootReducer,
  composeEnhancers(middleware) as StoreEnhancer
)

epicMiddleware.run(rootEpic)

// attach store to window if devtools are on once config initializes
const unsubscribe = store.subscribe(() => {
  const { config } = store.getState()
  if (config !== null) {
    if (config.devtools) (window as any).store = store
    unsubscribe()
  }
})
