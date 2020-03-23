// @flow
import omit from 'lodash/omit'
import mapValues from 'lodash/mapValues'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { userFacingFlags, DEPRECATED_FLAGS, type Flags } from './types'
import type { RehydratePersistedAction } from '../persist'
import type { SetFeatureFlagAction } from './actions'
import type { Action } from '../types'

// NOTE: these values will always be overridden by persisted values,
// whenever the browser has seen the feature flag before and persisted it.
// Only "never before seen" flags will take on the default values from `initialFlags`.
//
// For debugging / E2E testing: if these flags don't have persisted values already
// in the browser session, then corresponding env vars can be used to set the
// initial values. Eg `OT_PD_PRERELEASE_MODE=1 make -C protocol-designer dev`
// will initialize PRERELEASE_MODE to true (but as per the note above, that
// initial value is only relevant matters if there is no persisted value already)
const initialFlags: Flags = {
  PRERELEASE_MODE: process.env.OT_PD_PRERELEASE_MODE === '1' || false,
  OT_PD_ENABLE_MODULES: process.env.OT_PD_ENABLE_MODULES === '1' || false,
  OT_PD_DISABLE_MODULE_RESTRICTIONS:
    process.env.OT_PD_DISABLE_MODULE_RESTRICTIONS === '1' || false,
  OT_PD_ENABLE_MULTI_GEN2_PIPETTES:
    process.env.OT_PD_ENABLE_MULTI_GEN2_PIPETTES === '1' || false,
  OT_PD_ENABLE_THERMOCYCLER:
    process.env.OT_PD_ENABLE_THERMOCYCLER === '1' || false,
}

const flags = handleActions<Flags, any>(
  {
    SET_FEATURE_FLAGS: (state: Flags, action: SetFeatureFlagAction): Flags => {
      const nextState = { ...state, ...action.payload }
      if (action.payload.PRERELEASE_MODE === false) {
        // turn off all non-user-facing flags when prerelease mode disabled
        return mapValues(nextState, (value, flagName) =>
          userFacingFlags.includes(flagName) ? value : false
        )
      }
      return nextState
    },
    // Feature flags that are new (not yet in browser storage) should take on default values.
    // Deprecated flags should not be retrieved from browser storage
    REHYDRATE_PERSISTED: (
      state: Flags,
      action: RehydratePersistedAction
    ): Flags => ({
      ...state,
      ...omit(action.payload?.['featureFlags.flags'], DEPRECATED_FLAGS),
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

export const rootReducer = combineReducers<_, Action>(_allReducers)
