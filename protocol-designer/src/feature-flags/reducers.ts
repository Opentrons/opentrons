import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'

import { DEPRECATED_FLAGS, userFacingFlags } from './types'

import type { Reducer } from 'redux'
import type { RehydratePersistedAction } from '../persist'
import type { Action } from '../types'
import type { SetFeatureFlagAction } from './actions'
import type { Flags, FlagTypes } from './types'

// NOTE: these values will always be overridden by persisted values,
// whenever the browser has seen the feature flag before and persisted it.
// Only "never before seen" flags will take on the default values from `initialFlags`.
//
// For debugging / E2E testing: if these flags don't have persisted values already
// in the browser session, then corresponding env vars can be used to set the
// initial values. Eg `OT_PD_PRERELEASE_MODE=1 make -C protocol-designer dev`
// will initialize PRERELEASE_MODE to true (but as per the note above, that
// initial value is only relevant if there is no persisted value already)
//
// If you add/remove an environment variable here, also update vite.config.mts.
const initialFlags: Flags = {
  PRERELEASE_MODE: _FF_ENV_VARS_.OT_PD_PRERELEASE_MODE === '1' || false,
  OT_PD_DISABLE_MODULE_RESTRICTIONS:
    _FF_ENV_VARS_.OT_PD_DISABLE_MODULE_RESTRICTIONS === '1' || false,
  OT_PD_ENABLE_COMMENT: _FF_ENV_VARS_.OT_PD_ENABLE_COMMENT === '1' || false,
  OT_PD_ENABLE_HOT_KEYS_DISPLAY:
    _FF_ENV_VARS_.OT_PD_ENABLE_HOT_KEYS_DISPLAY === '1' || true,
  OT_PD_ENABLE_CONCURRENT_MODULE_ACTIONS:
    _FF_ENV_VARS_.OT_PD_ENABLE_CONCURRENT_MODULE_ACTIONS === '1' || false,
  OT_PD_ENABLE_BY_VOLUME_BUILDER:
    _FF_ENV_VARS_.OT_PD_ENABLE_BY_VOLUME_BUILDER === '1' || false,
  OT_PD_ENABLE_VACUUM_MODULE:
    _FF_ENV_VARS_.OT_PD_ENABLE_VACUUM_MODULE === '1' || false,
}
// @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const flags: Reducer<Flags, any> = handleActions(
  {
    SET_FEATURE_FLAGS: (state: Flags, action: SetFeatureFlagAction): Flags => {
      const nextState = { ...state, ...action.payload }

      if (action.payload.PRERELEASE_MODE === false) {
        // turn off all non-user-facing flags when prerelease mode disabled
        return mapValues(nextState, (value, flagName: FlagTypes) =>
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
export interface RootState {
  flags: Flags
}
export const rootReducer: Reducer<RootState, Action> =
  combineReducers(_allReducers)
