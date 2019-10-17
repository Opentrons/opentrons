// @flow
import { createSelector } from 'reselect'
import type { BaseState, Selector } from '../types'

export const getFeatureFlagData = (state: BaseState) => state.featureFlags.flags

export const getEnableGen2Pipettes: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_ENABLE_GEN2_PIPETTES
)

export const getEnabledPrereleaseMode: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.PRERELEASE_MODE
)

export const getEnableModules: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_ENABLE_MODULES
)
