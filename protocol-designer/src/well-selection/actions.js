// @flow
import {createAction} from 'redux-actions'
import selectors from './selectors'
import {changeFormInput} from '../steplist/actions'

import {selectors as steplistSelectors} from '../steplist'
import {selectors as pipetteSelectors} from '../pipettes'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'

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

// Well selection modal
export type OpenWellSelectionModalPayload = {
  labwareId: string,
  pipetteId: string,
  formFieldAccessor: StepFieldName, // TODO: BC rename this 'name'
  pipetteChannels?: ?Channels,
  labwareName?: string,
}

function _wellArrayToObj (wells: ?Array<string>): Wells {
  if (!wells) {
    return {}
  }
  return wells.reduce((acc: Wells, well: string) => ({
    ...acc,
    [well]: well,
  }), {})
}

export const openWellSelectionModal = (payload: OpenWellSelectionModalPayload) =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const state = getState()
    const accessor = payload.formFieldAccessor
    const formData = steplistSelectors.formData(state)

    const wells: Wells = (accessor && formData && formData[accessor] &&
      _wellArrayToObj(formData[accessor])) || {}

    // initially selected wells in form get selected in state before modal opens
    dispatch(selectWells(wells))

    const pipettes = pipetteSelectors.equippedPipettes(state)
    const labware = labwareIngredSelectors.getLabware(state)
    // TODO type this action, make an underline fn action creator

    dispatch({
      type: 'OPEN_WELL_SELECTION_MODAL',
      payload: {
        ...payload,
        pipetteChannels: pipettes && pipettes[payload.pipetteId] && pipettes[payload.pipetteId].channels,
        labwareName: labware && labware[payload.labwareId] && labware[payload.labwareId].type,
      },
    })
  }

export const closeWellSelectionModal = (): * => ({
  type: 'CLOSE_WELL_SELECTION_MODAL',
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

    dispatch(closeWellSelectionModal())
  }
