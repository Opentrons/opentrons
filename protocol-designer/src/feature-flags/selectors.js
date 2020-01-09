// @flow
import { createSelector } from 'reselect'
import type { BaseState, Selector } from '../types'

export const getFeatureFlagData = (state: BaseState) => state.featureFlags.flags

export const getEnabledPrereleaseMode: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.PRERELEASE_MODE
)

export const getEnableModules: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_ENABLE_MODULES
)

export const getDisableModuleRestrictions: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_DISABLE_MODULE_RESTRICTIONS
)

export const getEnableThermocycler: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_ENABLE_THERMOCYCLER
)

export const getEnableMultiGEN2Pipettes: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_ENABLE_MULTI_GEN2_PIPETTES
)
