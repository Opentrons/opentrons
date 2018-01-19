// @flow
import {createAction} from 'redux-actions'
import type {
  // Store as ReduxStore,
  Dispatch as ReduxDispatch
} from 'redux'
import type {StepType, StepIdType} from './types'

// TODO Ian 2018-01-19 import GenericAction from some "general Redux types" file
export type GenericAction = {
  type: string,
  payload?: any,
  meta?: any
}

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

type StepListState = {}

// addStep thunk adds an incremental integer ID for Step reducers.
let stepIdCounter = 0
export const addStep = (payload: NewStepPayload) =>
  (dispatch: ReduxDispatch<GenericAction>, getState: StepListState) => {
    dispatch({
      type: 'ADD_STEP',
      payload: {
        ...payload,
        id: stepIdCounter
      }
    })
    stepIdCounter += 1
  }

type ExpandAddStepButtonAction = {
  type: 'EXPAND_ADD_STEP_BUTTON',
  payload: boolean
}

export const expandAddStepButton = (payload: boolean): ExpandAddStepButtonAction => ({
  type: 'EXPAND_ADD_STEP_BUTTON',
  payload
})

// TODO use action creator instead of manual dispatch elsewhere!!
type ToggleStepCollapsedAction = {
  type: 'TOGGLE_STEP_COLLAPSED',
  payload: StepIdType
}

export const toggleStepCollapsed = (payload: StepIdType): ToggleStepCollapsedAction => ({
  type: 'TOGGLE_STEP_COLLAPSED',
  payload
})

// TODO use action creator instead of manual dispatch elsewhere!!
export const selectStep = createAction('SELECT_STEP', (stepId: StepIdType) => stepId)
