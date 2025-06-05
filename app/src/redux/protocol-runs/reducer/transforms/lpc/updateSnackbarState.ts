import isEqual from 'lodash/isEqual'

import {
  OFFSET_KIND_DEFAULT,
  SET_FINAL_POSITION,
} from '/app/redux/protocol-runs'

import type { LPCWizardState } from '/app/redux/protocol-runs'
import type { LPCUiState } from '/app/redux/protocol-runs/types/lpc/ui'
import type { UpdateOffsetsAction } from './types'

// Determine the appropriate snackbar to render, if any.
export function updateSnackbarState(
  state: LPCWizardState,
  action: UpdateOffsetsAction
): LPCUiState['showSnackbar'] {
  if (action.type === SET_FINAL_POSITION) {
    const { isOnDevice } = action.payload

    if (isOnDevice) {
      const { offsetLocationDetails } = state.labwareInfo.selectedLabware ?? {
        offsetLocationDetails: null,
      }
      const {
        defaultOffsetDetails,
        locationSpecificOffsetDetails,
      } = state.labwareInfo.labware[offsetLocationDetails?.definitionUri ?? '']
      const {
        workingOffset: defaultWorkingOffset,
        existingOffset: defaultExistingOffset,
      } = defaultOffsetDetails
      const {
        workingOffset: lsWorkingOffset,
      } = locationSpecificOffsetDetails.find(detail =>
        isEqual(detail.locationDetails, offsetLocationDetails)
      ) ?? { workingOffset: null, existingOffset: null }

      if (offsetLocationDetails?.kind === OFFSET_KIND_DEFAULT) {
        const vectorExists =
          defaultWorkingOffset?.confirmedVector != null ||
          defaultExistingOffset?.vector != null

        if (vectorExists) {
          return 'defaultAdjusted'
        } else {
          return 'defaultAdded'
        }
      } else {
        const doesLSMatchDefault =
          isEqual(
            lsWorkingOffset?.confirmedVector,
            defaultWorkingOffset?.confirmedVector
          ) ||
          isEqual(
            lsWorkingOffset?.confirmedVector,
            defaultExistingOffset?.vector
          )

        if (!doesLSMatchDefault) {
          return 'locationSpecificAdjusted'
        }
      }
    }
  }

  return state.ui.showSnackbar
}
