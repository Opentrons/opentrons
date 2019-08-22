// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { rehydrate, type RehydratePersistedAction } from '../persist'
import type { Flags } from './types'
import type { SetFeatureFlagAction } from './actions'
import type { Action } from '../types'

// NOTE: these values will always be overridden by persisted values,
// whenever the browser has seen the feature flag before and persisted it.
// Only "never before seen" flags will take on the default values from `initialFlags`.
const initialFlags: Flags = {
  OT_PD_SHOW_UPLOAD_CUSTOM_LABWARE_BUTTON: false,
}

const flags = handleActions<Flags, *>(
  {
    SET_FEATURE_FLAGS: (state, action: SetFeatureFlagAction) => ({
      ...state,
      ...action.payload,
    }),
    // feature flags that are new (to browser storage) should take on default values
    REHYDRATE_PERSISTED: (state, action: RehydratePersistedAction) => ({
      ...state,
      ...rehydrate('featureFlags.flags', initialFlags),
    }),
  },
  initialFlags
)

export const _allReducers = {
  flags,
}

export type RootState = {
  flags: Flags,
}

const rootReducer = combineReducers<_, Action>(_allReducers)

export default rootReducer
