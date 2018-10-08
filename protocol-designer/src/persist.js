// @flow
import get from 'lodash/get'
import assert from 'assert'
import type {Store} from 'redux'

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

/** Subscribe this fn to the Redux store to persist selected substates */
export const makePersistSubscriber = (store: Store<*, *>) => (): void => {
  const currentPersistedStatesByPath = {}
  const state = store.getState()
  PERSISTED_PATHS.forEach(path => {
    const nextValue = get(state, path)
    if (currentPersistedStatesByPath[path] !== nextValue) {
      global.localStorage.setItem(
        _addStoragePrefix(path),
        JSON.stringify(nextValue)
      )
      currentPersistedStatesByPath[path] = nextValue
    }
  })
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
  const persisted = global.localStorage.getItem(_addStoragePrefix(path))
  return persisted ? JSON.parse(persisted) : initialState
}
