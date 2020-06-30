// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { RehydratePersistedAction } from '../persist'
import type { SetOptIn } from './actions'

type OptInState = boolean | null
const optInInitialState = null

// NOTE(mc, 2020-06-04): `handleActions` cannot be strictly typed
const hasOptedIn: Reducer<OptInState, any> = handleActions(
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

export type RootState = {|
  hasOptedIn: OptInState,
|}

export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _allReducers
)
