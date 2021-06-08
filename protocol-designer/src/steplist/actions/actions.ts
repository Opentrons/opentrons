import { getOrderedStepIds } from '../../step-forms/selectors'
import { getNextNonTerminalItemId } from '../utils'
import type { ThunkAction } from '../../types'
import type { StepIdType, FormData } from '../../form-types'
import type { ChangeFormPayload } from './types'
import type {
  ClearSelectedItemAction,
  SelectMultipleStepsAction,
} from '../../ui/steps'
export type ChangeSavedStepFormAction = {
  type: 'CHANGE_SAVED_STEP_FORM'
  payload: ChangeFormPayload
}
export const changeSavedStepForm = (
  payload: ChangeFormPayload
): ChangeSavedStepFormAction => ({
  type: 'CHANGE_SAVED_STEP_FORM',
  payload,
})
export type ChangeFormInputAction = {
  type: 'CHANGE_FORM_INPUT'
  payload: ChangeFormPayload
}
export const changeFormInput = (
  payload: ChangeFormPayload
): ChangeFormInputAction => ({
  type: 'CHANGE_FORM_INPUT',
  payload,
})
// Populate form with selected action (only used in thunks)
export type PopulateFormAction = {
  type: 'POPULATE_FORM'
  payload: FormData
}
// Create new step
export type DeleteStepAction = {
  type: 'DELETE_STEP'
  payload: StepIdType
}
export const deleteStep = (stepId: StepIdType): DeleteStepAction => ({
  type: 'DELETE_STEP',
  payload: stepId,
})
export type DeleteMultipleStepsAction = {
  type: 'DELETE_MULTIPLE_STEPS'
  payload: StepIdType[]
}
export const deleteMultipleSteps = (
  stepIds: StepIdType[]
): ThunkAction<
  | DeleteMultipleStepsAction
  | ClearSelectedItemAction
  | SelectMultipleStepsAction
> => (dispatch, getState) => {
  const orderedStepIds = getOrderedStepIds(getState())
  const deleteMultipleStepsAction: DeleteMultipleStepsAction = {
    type: 'DELETE_MULTIPLE_STEPS',
    payload: stepIds,
  }
  dispatch(deleteMultipleStepsAction)

  if (stepIds.length === orderedStepIds.length) {
    // if we are deleting all the steps we need to clear out the selected item
    const clearSelectedItemAction: ClearSelectedItemAction = {
      type: 'CLEAR_SELECTED_ITEM',
    }
    dispatch(clearSelectedItemAction)
  } else {
    const nextStepId = getNextNonTerminalItemId(orderedStepIds, stepIds)

    if (nextStepId) {
      const selectMultipleStepsAction: SelectMultipleStepsAction = {
        type: 'SELECT_MULTIPLE_STEPS',
        payload: {
          stepIds: [nextStepId],
          lastSelected: nextStepId,
        },
      }
      dispatch(selectMultipleStepsAction)
    } else {
      console.warn(
        'something went wrong, could not find the next non terminal item'
      )
    }
  }
}
export type CancelStepFormAction = {
  type: 'CANCEL_STEP_FORM'
  payload: null
}
export const cancelStepForm = (): CancelStepFormAction => ({
  type: 'CANCEL_STEP_FORM',
  payload: null,
})
export type ReorderStepsAction = {
  type: 'REORDER_STEPS'
  payload: {
    stepIds: StepIdType[]
  }
}
export const reorderSteps = (stepIds: StepIdType[]): ReorderStepsAction => ({
  type: 'REORDER_STEPS',
  payload: {
    stepIds,
  },
})
export type AddProfileStepAction = {
  type: 'ADD_PROFILE_STEP'
  payload: null | {
    cycleId: string
  }
}
export const addProfileStep = (
  payload: AddProfileStepAction['payload']
): AddProfileStepAction => ({
  type: 'ADD_PROFILE_STEP',
  payload,
})
export type DeleteProfileCycleAction = {
  type: 'DELETE_PROFILE_CYCLE'
  payload: {
    id: string
  }
}
export const deleteProfileCycle = (
  payload: DeleteProfileCycleAction['payload']
): DeleteProfileCycleAction => ({
  type: 'DELETE_PROFILE_CYCLE',
  payload,
})
export type DeleteProfileStepAction = {
  type: 'DELETE_PROFILE_STEP'
  payload: {
    id: string
  }
}
export const deleteProfileStep = (
  payload: DeleteProfileStepAction['payload']
): DeleteProfileStepAction => ({
  type: 'DELETE_PROFILE_STEP',
  payload,
})
export type EditProfileCycleAction = {
  type: 'EDIT_PROFILE_CYCLE'
  payload: {
    id: string
    fields: {
      repetitions?: string
    }
  }
}
export const editProfileCycle = (
  payload: EditProfileCycleAction['payload']
): EditProfileCycleAction => ({
  type: 'EDIT_PROFILE_CYCLE',
  payload,
})
export type EditProfileStepAction = {
  type: 'EDIT_PROFILE_STEP'
  payload: {
    id: string
    fields: {
      title?: string
      temperature?: string
      durationMinutes?: string
      durationSeconds?: string
    }
  }
}
export const editProfileStep = (
  payload: EditProfileStepAction['payload']
): EditProfileStepAction => ({
  type: 'EDIT_PROFILE_STEP',
  payload,
})
export type AddProfileCycleAction = {
  type: 'ADD_PROFILE_CYCLE'
  payload: null
}
export const addProfileCycle = (
  payload: AddProfileCycleAction['payload']
): AddProfileCycleAction => ({
  type: 'ADD_PROFILE_CYCLE',
  payload,
})
