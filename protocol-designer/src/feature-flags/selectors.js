// @flow
// import { createSelector } from 'reselect'
import type { BaseState /*, Selector */ } from '../types'

export const getFeatureFlagData = (state: BaseState) => state.featureFlags.flags

// NOTE: Ian 2019-10-09 this FF has been removed, but I'm leaving these comments as a placeholder for when we add another FF
// export const getShowUploadCustomLabwareButton: Selector<?boolean> = createSelector(
//   getFeatureFlagData,
//   flags => flags.OT_PD_SHOW_UPLOAD_CUSTOM_LABWARE_BUTTON
// )
