// @flow
import type {ThunkDispatch, GetState} from '../types'
import selectors from './selectors'
import {changeFormInput} from '../steplist/actions'

// Well selection modal
export type OpenWellSelectionModalPayload = {
  labwareId: string,
  pipetteId: string,
  formFieldAccessor: string // eg 'aspirate--wells' or 'dispense--wells'
}

export const openWellSelectionModal = (payload: OpenWellSelectionModalPayload): * => ({
  type: 'OPEN_WELL_SELECTION_MODAL',
  payload
})

export const closeWellSelectionModal = (): * => ({
  type: 'CLOSE_WELL_SELECTION_MODAL',
  payload: null
})

export const saveWellSelectionModal = () =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const state = getState()
    const wellSelectionModalData = selectors.wellSelectionModalData(state)

    // this if-else is mostly for Flow
    if (wellSelectionModalData) {
      dispatch(changeFormInput({
        accessor: wellSelectionModalData.formFieldAccessor,
        value: selectors.selectedWellNames(state)
      }))
    } else {
      console.warn('No well selection modal data in state')
    }

    dispatch(closeWellSelectionModal())
  }
