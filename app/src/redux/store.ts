import { routerMiddleware } from 'connected-react-router'
import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import thunk from 'redux-thunk'

import { rootEpic } from './epic'
import { rootReducer, history } from './reducer'
import type { Action, State } from './types'

const epicMiddleware = createEpicMiddleware<Action, Action, State, any>()

const middleware = applyMiddleware(
  thunk,
  epicMiddleware,
  routerMiddleware(history)
)

const composeEnhancers =
  ((window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ maxAge: 200 })) ||
  compose
export const store = createStore(rootReducer, composeEnhancers(middleware))

epicMiddleware.run(rootEpic)

// attach store to window if devtools are on once config initializes
const unsubscribe = store.subscribe(() => {
  const { config } = store.getState()
  if (config !== null) {
    if (config.devtools) (window as any).store = store
    unsubscribe()
  }
})
