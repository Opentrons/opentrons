// @flow
import type { StepIdType, FormData } from '../../form-types'
import type { ChangeFormPayload } from './types'

export type ChangeSavedStepFormAction = {|
  type: 'CHANGE_SAVED_STEP_FORM',
  payload: ChangeFormPayload,
|}
export const changeSavedStepForm = (
  payload: ChangeFormPayload
): ChangeSavedStepFormAction => ({
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
export const deleteStep = (stepId: StepIdType): DeleteStepAction => ({
  type: 'DELETE_STEP',
  payload: stepId,
})

export type CancelStepFormAction = {| type: 'CANCEL_STEP_FORM', payload: null |}
export const cancelStepForm = (): CancelStepFormAction => ({
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

export type AddProfileStepAction = {|
  type: 'ADD_PROFILE_STEP',
  payload: null | {| cycleId: string |},
|}
export const addProfileStep = (
  payload: $PropertyType<AddProfileStepAction, 'payload'>
): AddProfileStepAction => ({
  type: 'ADD_PROFILE_STEP',
  payload,
})

export type DeleteProfileCycleAction = {|
  type: 'DELETE_PROFILE_CYCLE',
  payload: {| id: string |},
|}
export const deleteProfileCycle = (
  payload: $PropertyType<DeleteProfileCycleAction, 'payload'>
): DeleteProfileCycleAction => ({
  type: 'DELETE_PROFILE_CYCLE',
  payload,
})

export type DeleteProfileStepAction = {|
  type: 'DELETE_PROFILE_STEP',
  payload: {| id: string |},
|}
export const deleteProfileStep = (
  payload: $PropertyType<DeleteProfileStepAction, 'payload'>
): DeleteProfileStepAction => ({
  type: 'DELETE_PROFILE_STEP',
  payload,
})

export type EditProfileCycleAction = {|
  type: 'EDIT_PROFILE_CYCLE',
  payload: {|
    id: string,
    fields: {|
      repetitions?: string,
    |},
  |},
|}
export const editProfileCycle = (
  payload: $PropertyType<EditProfileCycleAction, 'payload'>
): EditProfileCycleAction => ({
  type: 'EDIT_PROFILE_CYCLE',
  payload,
})

export type EditProfileStepAction = {|
  type: 'EDIT_PROFILE_STEP',
  payload: {|
    id: string,
    fields: {|
      title?: string,
      temperature?: string,
      durationMinutes?: string,
      durationSeconds?: string,
    |},
  |},
|}
export const editProfileStep = (
  payload: $PropertyType<EditProfileStepAction, 'payload'>
): EditProfileStepAction => ({
  type: 'EDIT_PROFILE_STEP',
  payload,
})

export type AddProfileCycleAction = {|
  type: 'ADD_PROFILE_CYCLE',
  payload: null,
|}
export const addProfileCycle = (
  payload: $PropertyType<AddProfileCycleAction, 'payload'>
): AddProfileCycleAction => ({
  type: 'ADD_PROFILE_CYCLE',
  payload,
})
