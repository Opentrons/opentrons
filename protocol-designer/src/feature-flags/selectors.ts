import { BaseState, Selector } from '../types'
import { Flags } from './types'
import { getFlagsFromQueryParams } from './utils'
import { createSelector } from 'reselect'

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
