import { createSelector } from 'reselect'
import { getFlagsFromQueryParams } from './utils'
import { BaseState, Selector } from '../types'
import { Flags } from './types'
export const getFeatureFlagData = (state: BaseState): Flags => ({
  ...state.featureFlags.flags,
  ...getFlagsFromQueryParams(),
})
export const getEnabledPrereleaseMode: Selector<
  boolean | null | undefined
> = createSelector(getFeatureFlagData, flags => flags.PRERELEASE_MODE)
export const getDisableModuleRestrictions: Selector<
  boolean | null | undefined
> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_DISABLE_MODULE_RESTRICTIONS
)
export const getEnabledOT3: Selector<boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_ENABLE_OT_3 ?? false
)
export const getAllowAllTipracks: Selector<boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_ALLOW_ALL_TIPRACKS ?? false
)
