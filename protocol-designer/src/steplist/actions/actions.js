// @flow
import type { StepIdType, FormData } from '../../form-types'
import type { ChangeFormPayload } from './types'

export type ChangeSavedStepFormAction = {|
  type: 'CHANGE_SAVED_STEP_FORM',
  payload: ChangeFormPayload,
|}
export const changeSavedStepForm = (payload: ChangeFormPayload) => ({
  type: 'CHANGE_SAVED_STEP_FORM',
  payload,
})

export type ChangeFormInputAction = {|
  type: 'CHANGE_FORM_INPUT',
  payload: ChangeFormPayload,
|}
export const changeFormInput = (
  payload: ChangeFormPayload
): ChangeFormInputAction => ({
  type: 'CHANGE_FORM_INPUT',
  payload,
})

// Populate form with selected action (only used in thunks)

export type PopulateFormAction = {| type: 'POPULATE_FORM', payload: FormData |}

// Create new step

export type DeleteStepAction = {| type: 'DELETE_STEP', payload: StepIdType |}
export const deleteStep = (stepId: StepIdType) => ({
  type: 'DELETE_STEP',
  payload: stepId,
})

export type CancelStepFormAction = {| type: 'CANCEL_STEP_FORM', payload: null |}
export const cancelStepForm = () => ({
  type: 'CANCEL_STEP_FORM',
  payload: null,
})

export type ReorderStepsAction = {|
  type: 'REORDER_STEPS',
  payload: { stepIds: Array<StepIdType> },
|}
export const reorderSteps = (
  stepIds: Array<StepIdType>
): ReorderStepsAction => ({
  type: 'REORDER_STEPS',
  payload: { stepIds },
})
