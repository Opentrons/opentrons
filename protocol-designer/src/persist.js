// @flow
import get from 'lodash/get'
import assert from 'assert'
import type {Store} from 'redux'
import {dismissedHintsPersist} from './tutorial/reducers'

export function rehydratePersistedAction (): {type: 'REHYDRATE_PERSISTED'} {
  return {type: 'REHYDRATE_PERSISTED'}
}

function _addStoragePrefix (path: string): string {
  return `root.${path}`
}

// paths from Redux root to all persisted reducers
const PERSISTED_PATHS = [
  'analytics.hasOptedIn',
  'tutorial.dismissedHints',
]

function transformBeforePersist (path: string, reducerState: any) {
  switch (path) {
    case 'tutorial.dismissedHints':
      return dismissedHintsPersist(reducerState)
    default:
      return reducerState
  }
}

/** Subscribe this fn to the Redux store to persist selected substates */
type PersistSubscriber = () => void
export const makePersistSubscriber = (store: Store<*, *>): PersistSubscriber => {
  const prevReducerStates = {}
  return () => {
    const state = store.getState()
    PERSISTED_PATHS.forEach(path => {
      const nextReducerState = get(state, path)
      if (prevReducerStates[path] !== nextReducerState) {
        try {
          global.localStorage.setItem(
            _addStoragePrefix(path),
            JSON.stringify(transformBeforePersist(path, nextReducerState))
          )
        } catch (e) {
          console.error(`error attempting to persist ${path}:`, e)
        }
        prevReducerStates[path] = nextReducerState
      }
    })
  }
}

/** Use inside a reducer to pull out persisted state,
  * eg in response to REHYDRATE_PERSISTED action.
  * If there's no persisted state, defaults to the given `initialState`.
  * The `path` should match where the reducer lives in the Redux state tree
  */
export function rehydrate<S> (path: string, initialState: S): S {
  assert(
    PERSISTED_PATHS.includes(path),
    `Path "${path}" is missing from PERSISTED_PATHS! The changes to this reducer will not be persisted.`
  )
  try {
    const persisted = global.localStorage.getItem(_addStoragePrefix(path))
    return persisted ? JSON.parse(persisted) : initialState
  } catch (e) {
    console.error('Could not rehydrate:', e)
  }
  return initialState
}
