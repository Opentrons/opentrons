// @flow
import {createAction} from 'redux-actions'
import selectors from './selectors'
import {changeFormInput} from '../steplist/actions'

import type {StepFieldName} from '../steplist/fieldLevel'
import type {ThunkDispatch, GetState} from '../types'
import type {Wells} from '../labware-ingred/types'
import type {Channels} from '@opentrons/components'

// ===== Preselect / select wells in plate

// these actions all use PRIMARY WELLS (see reducers for definition)
const _wellSelectPayloadMapper = (args: Wells): Wells => args

export const highlightWells = createAction(
  'HIGHLIGHT_WELLS',
  _wellSelectPayloadMapper
)

export const selectWells = createAction(
  'SELECT_WELLS',
  (wells: Wells) => wells
)

export const deselectWells = createAction(
  'DESELECT_WELLS',
  _wellSelectPayloadMapper
)

export const deselectAllWells = createAction(
  'DESELECT_ALL_WELLS'
)

// Well selection modal
export type OpenWellSelectionModalPayload = {
  labwareId: string,
  pipetteId: string,
  formFieldAccessor: StepFieldName, // TODO: BC rename this 'name'
  pipetteChannels?: ?Channels,
  labwareName?: string,
}

export const setWellSelectionLabwareName = (labwareName: ?string): * => ({
  type: 'SET_WELL_SELECTION_LABWARE_NAME',
  payload: labwareName,
})

export const clearWellSelectionLabwareName = (): * => ({
  type: 'CLEAR_WELL_SELECTION_LABWARE_NAME',
  payload: null,
})

export const saveWellSelectionModal = () =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const state = getState()
    const wellSelectionModalData = selectors.wellSelectionModalData(state)

    // this if-else is mostly for Flow
    if (wellSelectionModalData) {
      dispatch(changeFormInput({
        update: {
          [wellSelectionModalData.formFieldAccessor]: selectors.selectedWellNames(state),
        },
      }))
    } else {
      console.warn('No well selection modal data in state')
    }
  }
