import { getBatchEditFieldChanges } from '../selectors'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { StepFieldName, StepIdType } from '../../form-types'
import type { ThunkAction } from '../../types'
import type { BatchEditFormChangesState } from '../reducers'

export * from './modules'
export * from './pipettes'
export interface ChangeBatchEditFieldAction {
  type: 'CHANGE_BATCH_EDIT_FIELD'
  payload: BatchEditFormChangesState
}
export const changeBatchEditField = (
  args: ChangeBatchEditFieldAction['payload']
): ChangeBatchEditFieldAction => ({
  type: 'CHANGE_BATCH_EDIT_FIELD',
  payload: args,
})
export interface ResetBatchEditFieldChangesAction {
  type: 'RESET_BATCH_EDIT_FIELD_CHANGES'
}
export const resetBatchEditFieldChanges =
  (): ResetBatchEditFieldChangesAction => ({
    type: 'RESET_BATCH_EDIT_FIELD_CHANGES',
  })
type EditedFields = Record<StepFieldName, unknown>
export interface SaveStepFormsMultiAction {
  type: 'SAVE_STEP_FORMS_MULTI'
  payload: {
    stepIds: StepIdType[]
    editedFields: EditedFields
  }
}
export const saveStepFormsMulti: (
  selectedStepIds?: StepIdType[] | null
) => ThunkAction<SaveStepFormsMultiAction> =
  selectedStepIds => (dispatch, getState) => {
    const state = getState()
    const batchEditFieldChanges = getBatchEditFieldChanges(state)
    const saveStepFormsMultiAction: SaveStepFormsMultiAction = {
      type: 'SAVE_STEP_FORMS_MULTI',
      payload: {
        editedFields: batchEditFieldChanges,
        stepIds: selectedStepIds || [],
      },
    }
    dispatch(saveStepFormsMultiAction)
  }

export interface DeckConfigurationState {
  deckConfig: DeckConfiguration
}
export interface EditDeckConfigurationAction {
  type: 'EDIT_DECK_CONFIGURATION'
  payload: DeckConfigurationState
}
export const editDeckConfiguration = (
  args: EditDeckConfigurationAction['payload']
): EditDeckConfigurationAction => ({
  type: 'EDIT_DECK_CONFIGURATION',
  payload: args,
})

export interface StackerLabwareCreationStartAction {
  type: 'STACKER_LABWARE_CREATION_START'
}

export interface StackerLabwareCreationFinishAction {
  type: 'STACKER_LABWARE_CREATION_FINISH'
}

export type StackerLabwareActions =
  StackerLabwareCreationStartAction | StackerLabwareCreationFinishAction

export const stackerLabwareCreationStart =
  (): StackerLabwareCreationStartAction => ({
    type: 'STACKER_LABWARE_CREATION_START',
  })

export const stackerLabwareCreationFinish =
  (): StackerLabwareCreationFinishAction => ({
    type: 'STACKER_LABWARE_CREATION_FINISH',
  })
