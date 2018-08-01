// @flow
import type {Dispatch} from 'redux'

import {selectors} from '../index'
import {selectors as labwareIngredsSelectors} from '../../labware-ingred/reducers'
import {actions as tutorialActions} from '../../tutorial'
import type {StepType, StepIdType, FormModalFields, FormData} from '../../form-types'
import type {ChangeFormPayload} from './types'
import type {TerminalItemId, SubstepIdentifier, FormSectionNames} from '../types'
import type {GetState, ThunkAction, ThunkDispatch} from '../../types'
import handleFormChange from './handleFormChange'

export type ChangeFormInputAction = {
  type: 'CHANGE_FORM_INPUT',
  payload: ChangeFormPayload
}

export const changeFormInput = (payload: ChangeFormPayload) =>
  (dispatch: ThunkDispatch<ChangeFormInputAction>, getState: GetState) => {
    dispatch({
      type: 'CHANGE_FORM_INPUT',
      payload: handleFormChange(payload, getState)
    })
  }

// Populate form with selected action (only used in thunks)

export type PopulateFormAction = {
  type: 'POPULATE_FORM',
  payload: FormData
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
    const state = getState()
    const stepId = selectors.nextStepId(state)
    dispatch({
      type: 'ADD_STEP',
      payload: {
        ...payload,
        id: stepId
      }
    })
    const deckHasLiquid = labwareIngredsSelectors.hasLiquid(state)
    const stepNeedsLiquid = ['transfer', 'distribute', 'consolidate', 'mix'].includes(payload.stepType)
    if (stepNeedsLiquid && !deckHasLiquid) {
      dispatch(tutorialActions.addHint('add_liquids_and_labware'))
    }
    dispatch(selectStep(stepId))
  }

export type DeleteStepAction = {
  type: 'DELETE_STEP',
  payload: StepIdType
}

export const deleteStep = () => (dispatch: Dispatch<*>, getState: GetState) => {
  dispatch({
    type: 'DELETE_STEP',
    payload: selectors.getSelectedStepId(getState())
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

export const toggleStepCollapsed = (stepId: StepIdType): ToggleStepCollapsedAction => ({
  type: 'TOGGLE_STEP_COLLAPSED',
  payload: stepId
})

export type SelectStepAction = {
  type: 'SELECT_STEP',
  payload: StepIdType
}

export const hoverOnSubstep = (payload: SubstepIdentifier): * => ({
  type: 'HOVER_ON_SUBSTEP',
  payload: payload
})

export type SelectTerminalItemAction = {
  type: 'SELECT_TERMINAL_ITEM',
  payload: TerminalItemId
}

export const selectTerminalItem = (terminalId: TerminalItemId): ThunkAction<*> =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const selectTerminalItemAction: SelectTerminalItemAction = {
      type: 'SELECT_TERMINAL_ITEM',
      payload: terminalId
    }

    dispatch(cancelStepForm())
    dispatch(selectTerminalItemAction)
  }

export const selectStep = (stepId: StepIdType): ThunkAction<*> =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const selectStepAction: SelectStepAction = {
      type: 'SELECT_STEP',
      payload: stepId
    }

    dispatch(selectStepAction)

    dispatch({
      type: 'POPULATE_FORM',
      payload: selectors.selectedStepFormData(getState())
    })
  }

// TODO: Ian 2018-07-31 types aren't being inferred by ActionType in hoveredItem reducer...
export const hoverOnStep = (stepId: ?StepIdType) => ({
  type: 'HOVER_ON_STEP',
  payload: stepId
})

export const hoverOnTerminalItem = (terminalId: ?TerminalItemId) => ({
  type: 'HOVER_ON_TERMINAL_ITEM',
  payload: terminalId
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
