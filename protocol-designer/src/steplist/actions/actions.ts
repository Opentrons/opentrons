import { getSavedStepHierarchy } from '/protocol-designer/step-forms/selectors'

import { getStepToSelectAfterDeletion } from '../utils/getStepsToSelect'
import { getPairedSteps } from '../utils/stepHierarchy'

import type { FormData, StepIdType } from '../../form-types'
import type { ThunkAction } from '../../types'
import type {
  ClearSelectedItemAction,
  SelectMultipleStepsAction,
} from '../../ui/steps'
import type { ChangeFormPayload } from './types'

export interface ChangeSavedStepFormAction {
  type: 'CHANGE_SAVED_STEP_FORM'
  payload: ChangeFormPayload
}
export const changeSavedStepForm = (
  payload: ChangeFormPayload
): ChangeSavedStepFormAction => ({
  type: 'CHANGE_SAVED_STEP_FORM',
  payload,
})

export interface ChangeFormInputAction {
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
export interface PopulateFormAction {
  type: 'POPULATE_FORM'
  payload: FormData
}

export interface DeleteMultipleStepsAction {
  type: 'DELETE_MULTIPLE_STEPS'
  payload: StepIdType[]
}
export const deleteMultipleSteps =
  (
    stepIds: StepIdType[]
  ): ThunkAction<
    | DeleteMultipleStepsAction
    | ClearSelectedItemAction
    | SelectMultipleStepsAction
  > =>
  (dispatch, getState) => {
    const stepIdsSet = new Set(stepIds)
    const stepHierarchy = getSavedStepHierarchy(getState())

    // If the user is trying to delete a Thermocycler or Vacuum profile step, we need to also
    // delete the internal "wait for profile to complete" pause step that's paired with it.
    const expandedStepIds = getUnionOfSets(
      stepIdsSet,
      getPairedSteps(stepHierarchy, stepIdsSet)
    )

    const nextSelection = getStepToSelectAfterDeletion(
      stepHierarchy,
      expandedStepIds
    )

    const deleteMultipleStepsAction: DeleteMultipleStepsAction = {
      type: 'DELETE_MULTIPLE_STEPS',
      payload: [...expandedStepIds],
    }
    dispatch(deleteMultipleStepsAction)

    if (nextSelection == null) {
      const clearSelectedItemAction: ClearSelectedItemAction = {
        type: 'CLEAR_SELECTED_ITEM',
      }
      dispatch(clearSelectedItemAction)
    } else {
      const selectMultipleStepsAction: SelectMultipleStepsAction = {
        type: 'SELECT_MULTIPLE_STEPS',
        payload: {
          stepIds: [nextSelection],
          lastSelected: nextSelection,
        },
      }
      dispatch(selectMultipleStepsAction)
    }
  }

export interface CancelStepFormAction {
  type: 'CANCEL_STEP_FORM'
  payload: null
}

export const cancelStepForm = () => (dispatch: any) => {
  const clearSelectedItemAction: ClearSelectedItemAction = {
    type: 'CLEAR_SELECTED_ITEM',
  }

  dispatch(clearSelectedItemAction)

  dispatch({
    type: 'CANCEL_STEP_FORM',
    payload: null,
  })
}

export interface ReorderStepsAction {
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

// todo(mm, 2025-11-03): Replace with JS's native Set.union() when our JS version is new enough.
function getUnionOfSets<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a, ...b])
}
