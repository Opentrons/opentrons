// @flow
import type {
  ChangeBatchEditFieldAction,
  ResetBatchEditFieldChangesAction,
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
