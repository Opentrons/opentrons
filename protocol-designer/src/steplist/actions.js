// @flow
import type {
  Dispatch
} from 'redux'

import {selectors} from './reducers'
import type {StepType, StepIdType} from './types'
import type {GetState, ThunkAction} from '../types'

// Update Form input (onChange on inputs)

type ChangeFormPayload = {
  accessor: string, // TODO use FormData keys type
  value: string | boolean
}

type ChangeFormInputAction = {
  type: 'CHANGE_FORM_INPUT',
  payload: ChangeFormPayload
}

export const changeFormInput = (payload: ChangeFormPayload): ChangeFormInputAction => ({
  type: 'CHANGE_FORM_INPUT',
  payload
})

// Populate form with selected action (only used in thunks)

export type PopulateFormAction = {
  type: 'POPULATE_FORM',
  payload: {} // TODO use FormData keys type
}

// Create new step

export type AddStepAction = {
  type: 'ADD_STEP',
  payload: {
    id: StepIdType,
    stepType: StepType
  }
}

type NewStepPayload = {
  stepType: StepType
}

// addStep thunk adds an incremental integer ID for Step reducers.
export const addStep = (payload: NewStepPayload) =>
  (dispatch: any, getState: GetState) => {
    const stepId = selectors.nextStepId(getState())
    dispatch({
      type: 'ADD_STEP',
      payload: {
        ...payload,
        id: stepId
      }
    })

    dispatch(selectStep(stepId))
  }

type ExpandAddStepButtonAction = {
  type: 'EXPAND_ADD_STEP_BUTTON',
  payload: boolean
}

export const expandAddStepButton = (payload: boolean): ExpandAddStepButtonAction => ({
  type: 'EXPAND_ADD_STEP_BUTTON',
  payload
})

type ToggleStepCollapsedAction = {
  type: 'TOGGLE_STEP_COLLAPSED',
  payload: StepIdType
}

export const toggleStepCollapsed = (payload: StepIdType): ToggleStepCollapsedAction => ({
  type: 'TOGGLE_STEP_COLLAPSED',
  payload
})

export type SelectStepAction = {
  type: 'SELECT_STEP',
  payload: StepIdType
}

export const selectStep = (payload: StepIdType): ThunkAction<*> =>
  (dispatch: Dispatch<*>, getState: GetState) => {
    dispatch({
      type: 'SELECT_STEP',
      payload: payload
    })

    dispatch({
      type: 'POPULATE_FORM',
      payload: selectors.selectedStepFormData(getState())
    })
  }

export type SaveStepFormAction = {
  type: 'SAVE_STEP_FORM',
  payload: {
    id: StepIdType
  }
}

export const saveStepForm = () =>
  (dispatch: Dispatch<*>, getState: GetState) => {
    dispatch({
      type: 'SAVE_STEP_FORM',
      payload: selectors.formData(getState())
    })
  }

export const cancelStepForm = () => ({
  type: 'CANCEL_STEP_FORM',
  payload: null
})
