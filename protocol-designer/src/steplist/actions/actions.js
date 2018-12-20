// @flow
import type {Dispatch} from 'redux'

import {selectors as stepFormSelectors} from '../index'
import {selectors as stepsSelectors} from '../../ui/steps'
import type {StepType, StepIdType, FormData} from '../../form-types'
import type {ChangeFormPayload, ChangeSavedFormPayload} from './types'
import type {GetState, ThunkDispatch} from '../../types'
import handleFormChange from './handleFormChange'

export type ChangeSavedStepFormAction = {type: 'CHANGE_SAVED_STEP_FORM', payload: ChangeSavedFormPayload}
export const changeSavedStepForm = (payload: ChangeSavedFormPayload) => ({
  type: 'CHANGE_SAVED_STEP_FORM',
  payload,
})

export type ChangeFormInputAction = {type: 'CHANGE_FORM_INPUT', payload: ChangeFormPayload}
export const changeFormInput = (payload: ChangeFormPayload) =>
  (dispatch: ThunkDispatch<ChangeFormInputAction>, getState: GetState) => {
    const unsavedForm = stepFormSelectors.getUnsavedForm(getState())
    dispatch({
      type: 'CHANGE_FORM_INPUT',
      payload: handleFormChange(payload, unsavedForm, getState),
    })
  }

// Populate form with selected action (only used in thunks)

export type PopulateFormAction = {type: 'POPULATE_FORM', payload: FormData}

// Create new step

export type AddStepAction = {type: 'ADD_STEP', payload: {id: StepIdType, stepType: StepType }}

export type DeleteStepAction = {type: 'DELETE_STEP', payload: StepIdType}
export const deleteStep = (stepId: StepIdType) => ({
  type: 'DELETE_STEP',
  payload: stepId,
})

export type SaveStepFormAction = {type: 'SAVE_STEP_FORM', payload: {id: StepIdType}}
export const saveStepForm = () =>
  (dispatch: Dispatch<*>, getState: GetState) => {
    const state = getState()

    if (stepsSelectors.getCurrentFormCanBeSaved(state)) {
      dispatch({
        type: 'SAVE_STEP_FORM',
        payload: stepFormSelectors.getUnsavedForm(state),
      })
    }
  }

export type CancelStepFormAction = {type: 'CANCEL_STEP_FORM', payload: null}
export const cancelStepForm = () => ({type: 'CANCEL_STEP_FORM', payload: null})

export type ReorderStepsAction = {type: 'REORDER_STEPS', payload: {stepIds: Array<StepIdType>}}
export const reorderSteps = (stepIds: Array<StepIdType>): ReorderStepsAction => ({
  type: 'REORDER_STEPS',
  payload: {stepIds},
})
