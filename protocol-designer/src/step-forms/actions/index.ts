import { getBatchEditFieldChanges } from '../selectors'
import { ThunkAction } from '../../types'
import { StepIdType, StepFieldName } from '../../form-types'
import { BatchEditFormChangesState } from '../reducers'
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
export const resetBatchEditFieldChanges = (): ResetBatchEditFieldChangesAction => ({
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
) => ThunkAction<SaveStepFormsMultiAction> = selectedStepIds => (
  dispatch,
  getState
) => {
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
