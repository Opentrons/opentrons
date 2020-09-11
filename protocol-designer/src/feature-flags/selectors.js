// @flow
import { createSelector } from 'reselect'

import type { BaseState, Selector } from '../types'
import type { Flags } from './types'

export const getFeatureFlagData = (state: BaseState): Flags =>
  state.featureFlags.flags

export const getEnabledPrereleaseMode: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.PRERELEASE_MODE
)

export const getDisableModuleRestrictions: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_DISABLE_MODULE_RESTRICTIONS
)

export const getEnabledMixDelay: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_ENABLE_MIX_DELAY
)
