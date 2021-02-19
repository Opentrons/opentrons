// @flow
import { getBatchEditFieldChanges } from '../selectors'
import type { ThunkAction } from '../../types'
import type { StepIdType, StepFieldName } from '../../form-types'
import type { BatchEditFormChangesState } from '../reducers'
export * from './modules'
export * from './pipettes'

export type ChangeBatchEditFieldAction = {|
  type: 'CHANGE_BATCH_EDIT_FIELD',
  payload: BatchEditFormChangesState,
|}
export const changeBatchEditField = (
  args: $PropertyType<ChangeBatchEditFieldAction, 'payload'>
): ChangeBatchEditFieldAction => ({
  type: 'CHANGE_BATCH_EDIT_FIELD',
  payload: args,
})
export type ResetBatchEditFieldChangesAction = {|
  type: 'RESET_BATCH_EDIT_FIELD_CHANGES',
|}
export const resetBatchEditFieldChanges = (): ResetBatchEditFieldChangesAction => ({
  type: 'RESET_BATCH_EDIT_FIELD_CHANGES',
})

type EditedFields = { [StepFieldName]: mixed }
export type SaveStepFormsMultiAction = {|
  type: 'SAVE_STEP_FORMS_MULTI',
  payload: { stepIds: Array<StepIdType>, editedFields: EditedFields },
|}
export const saveStepFormsMulti: (
  selectedStepIds: Array<StepIdType> | null
) => ThunkAction<SaveStepFormsMultiAction> = selectedStepIds => (
  dispatch,
  getState
) => {
  const state = getState()

  const batchEditFieldChanges = getBatchEditFieldChanges(state)
  const saveStepFormsMultiAction = {
    type: 'SAVE_STEP_FORMS_MULTI',
    payload: {
      editedFields: batchEditFieldChanges,
      stepIds: selectedStepIds || [],
    },
  }

  dispatch(saveStepFormsMultiAction)
}
