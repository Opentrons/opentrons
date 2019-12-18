// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'

import type { Action } from '../types'
import type { SetOptIn } from './actions'
import type { RehydratePersistedAction } from '../persist'

type OptInState = boolean | null
const optInInitialState = null
const hasOptedIn = handleActions(
  {
    SET_OPT_IN: (state: OptInState, action: SetOptIn): OptInState =>
      action.payload,
    REHYDRATE_PERSISTED: (
      state: OptInState,
      action: RehydratePersistedAction
    ) => {
      const persistedState = action.payload?.['analytics.hasOptedIn']
      return persistedState !== undefined ? persistedState : optInInitialState
    },
  },
  optInInitialState
)

const _allReducers = {
  hasOptedIn,
}

export type RootState = {
  hasOptedIn: OptInState,
}

export const rootReducer = combineReducers<_, Action>(_allReducers)
