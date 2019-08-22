// @flow
import { createSelector } from 'reselect'
import type { BaseState, Selector } from '../types'

export const getFeatureFlagData = (state: BaseState) => state.featureFlags.flags

export const getShowUploadCustomLabwareButton: Selector<?boolean> = createSelector(
  getFeatureFlagData,
  flags => flags.OT_PD_SHOW_UPLOAD_CUSTOM_LABWARE_BUTTON
)
