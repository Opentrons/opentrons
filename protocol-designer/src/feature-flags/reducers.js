// @flow
import omit from 'lodash/omit'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { rehydrate, type RehydratePersistedAction } from '../persist'
import { DEPRECATED_FLAGS, type Flags } from './types'
import type { SetFeatureFlagAction } from './actions'
import type { Action } from '../types'

// NOTE: these values will always be overridden by persisted values,
// whenever the browser has seen the feature flag before and persisted it.
// Only "never before seen" flags will take on the default values from `initialFlags`.
const initialFlags: Flags = {
  OT_PD_ENABLE_GEN2_PIPETTES: false,
}

const flags = handleActions<Flags, any>(
  {
    SET_FEATURE_FLAGS: (state: Flags, action: SetFeatureFlagAction): Flags => ({
      ...state,
      ...action.payload,
    }),
    // Feature flags that are new (not yet in browser storage) should take on default values.
    // Deprecated flags should not be retrieved from browser storage
    REHYDRATE_PERSISTED: (
      state: Flags,
      action: RehydratePersistedAction
    ): Flags => ({
      ...state,
      // TODO(mc, 2019-10-15): reading from localStorage is not appropriate
      // inside a reducer; move this logic elsewhere
      ...omit(rehydrate('featureFlags.flags', initialFlags), DEPRECATED_FLAGS),
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
