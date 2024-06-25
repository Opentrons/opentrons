import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import { routerMiddleware } from 'connected-react-router'
import { createEpicMiddleware } from 'redux-observable'

import { rootReducer, history } from './reducer'
import { rootEpic } from './epic'

import type { StoreEnhancer } from 'redux'
import type { Action, Middleware, State } from './types'

const epicMiddleware = createEpicMiddleware<Action, Action, State, any>()

const middleware = applyMiddleware(
  thunk,
  epicMiddleware,
  routerMiddleware(history) as Middleware
)

const composeEnhancers =
  (window as any)?.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?.({ maxAge: 200 }) ??
  compose

export const store = createStore(
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
