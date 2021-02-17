// @flow
import { getBatchEditFieldChanges } from '../selectors'
import type { StepIdType } from '../../form-types'
import type { ThunkAction } from '../../types'
import type {
  ChangeBatchEditFieldAction,
  ResetBatchEditFieldChangesAction,
  SaveStepFormsMultiAction,
} from '../types'
export * from './modules'
export * from './pipettes'

export const changeBatchEditField = (
  args: $PropertyType<ChangeBatchEditFieldAction, 'payload'>
): ChangeBatchEditFieldAction => ({
  type: 'CHANGE_BATCH_EDIT_FIELD',
  payload: args,
})

export const resetBatchEditFieldChanges = (): ResetBatchEditFieldChangesAction => ({
  type: 'RESET_BATCH_EDIT_FIELD_CHANGES',
})

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
