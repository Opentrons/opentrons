// @flow
import type {Dispatch} from 'redux'

import {selectors} from './reducers'
import {END_STEP} from './types'
import type {SubstepIdentifier, FormSectionNames} from './types'
import type {StepType, StepIdType, FormModalFields} from '../form-types'
import type {GetState, ThunkAction, ThunkDispatch} from '../types'

type EndStepId = typeof END_STEP
// Update Form input (onChange on inputs)

type ChangeFormPayload = {
  accessor: string, // TODO use FormData keys type
  value: string | boolean | Array<string>
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
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
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

export type DeleteStepAction = {
  type: 'DELETE_STEP',
  payload: StepIdType
}

export const deleteStep = () => (dispatch: Dispatch<*>, getState: GetState) => {
  dispatch({
    type: 'DELETE_STEP',
    payload: selectors.selectedStepId(getState())
  })
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
  payload: StepIdType | EndStepId
}

export const hoverOnSubstep = (payload: SubstepIdentifier): * => ({
  type: 'HOVER_ON_SUBSTEP',
  payload: payload
})

export const selectStep = (stepId: StepIdType | EndStepId): ThunkAction<*> =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const selectStepAction: SelectStepAction = {
      type: 'SELECT_STEP',
      payload: stepId
    }

    if (stepId === '__end__') {
      // End step has no form
      dispatch(cancelStepForm())
      dispatch(selectStepAction)

      return
    }

    const stepData = selectors.allSteps(getState())[stepId]
    const stepType = stepData && stepData.stepType

    dispatch(selectStepAction)

    // 'deck-setup' steps don't use a Step Form, all others do
    if (stepType === 'deck-setup') {
      // Cancel open step form, if any
      dispatch(cancelStepForm())
    } else {
      dispatch({
        type: 'POPULATE_FORM',
        payload: selectors.selectedStepFormData(getState())
      })
    }
  }

export const hoverOnStep = (stepId: StepIdType | EndStepId | null): * => ({
  type: 'HOVER_ON_STEP',
  payload: stepId
})

export type SaveStepFormAction = {
  type: 'SAVE_STEP_FORM',
  payload: {
    id: StepIdType
  }
}

export const saveStepForm = () =>
  (dispatch: Dispatch<*>, getState: GetState) => {
    const state = getState()

    if (selectors.currentFormCanBeSaved(state)) {
      dispatch({
        type: 'SAVE_STEP_FORM',
        payload: selectors.formData(state)
      })
    }
  }

export function cancelStepForm () {
  return {
    type: 'CANCEL_STEP_FORM',
    payload: null
  }
}

export type CollapseFormSectionAction = {type: 'COLLAPSE_FORM_SECTION', payload: FormSectionNames}
export function collapseFormSection (payload: FormSectionNames): CollapseFormSectionAction {
  return {
    type: 'COLLAPSE_FORM_SECTION',
    payload
  }
}

// ========= MORE OPTIONS MODAL =======
// Effectively another unsaved form, that saves to unsavedForm's "hidden" fields

// Populate newly-opened options modal with fields from unsaved form
export type OpenMoreOptionsModal = {
  type: 'OPEN_MORE_OPTIONS_MODAL',
  payload: FormModalFields
}
export const openMoreOptionsModal = () => (dispatch: Dispatch<*>, getState: GetState) => {
  dispatch({
    type: 'OPEN_MORE_OPTIONS_MODAL',
    payload: selectors.formData(getState()) // TODO only pull in relevant fields?
  })
}

export const cancelMoreOptionsModal = () => ({
  type: 'CANCEL_MORE_OPTIONS_MODAL',
  payload: null
})

export type ChangeMoreOptionsModalInputAction = {
  type: 'CHANGE_MORE_OPTIONS_MODAL_INPUT',
  payload: ChangeFormPayload
}

export const changeMoreOptionsModalInput = (payload: ChangeFormPayload): ChangeMoreOptionsModalInputAction => ({
  type: 'CHANGE_MORE_OPTIONS_MODAL_INPUT',
  payload
})

export type SaveMoreOptionsModal = {
  type: 'SAVE_MORE_OPTIONS_MODAL',
  payload: any // TODO
}

export const saveMoreOptionsModal = () => (dispatch: Dispatch<*>, getState: GetState) => {
  dispatch({
    type: 'SAVE_MORE_OPTIONS_MODAL',
    payload: selectors.formModalData(getState())
  })
}
