// @flow
import {uuid} from '../../utils'
import {selectors as labwareIngredsSelectors} from '../../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../../steplist'
import {selectors as stepsSelectors, actions as stepsActions} from '../../ui/steps'
import {actions as tutorialActions} from '../../tutorial'
import {generateNewForm} from '../formLevel'
import type {StepType, StepIdType, FormData} from '../../form-types'
import type {BaseState, GetState, ThunkDispatch} from '../../types'

export const SCROLL_ON_SELECT_STEP_CLASSNAME = 'scroll_on_select_step'

export type SelectStepAction = {
  type: 'SELECT_STEP',
  payload: StepIdType,
}

// get new or existing step for given stepId
export function getStepFormData (state: BaseState, stepId: StepIdType, newStepType?: StepType): ?FormData {
  const existingStep = steplistSelectors.getSavedForms(state)[stepId]

  if (existingStep) {
    return existingStep
  }

  // TODO: Ian 2018-09-19 sunset 'steps' reducer. Right now, it's needed here to get stepType
  // for any step that was created but never saved (never clicked Save button).
  // Instead, new steps should have their stepType immediately added
  // to 'savedStepForms' upon creation.
  const steps = steplistSelectors.getSteps(state)
  const stepTypeFromStepReducer = steps[stepId] && steps[stepId].stepType
  const stepType = newStepType || stepTypeFromStepReducer

  if (!stepType) {
    console.error(`New step with id "${stepId}" was added with no stepType, could not generate form`)
    return null
  }

  return generateNewForm({
    stepId,
    stepType: stepType,
  })
}

// addStep thunk adds an incremental integer ID for Step reducers.
export const addStep = (payload: {stepType: StepType}) =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const state = getState()
    const stepId = uuid()
    const {stepType} = payload
    dispatch({
      type: 'ADD_STEP',
      payload: {
        ...payload,
        id: stepId,
      },
    })
    const deckHasLiquid = labwareIngredsSelectors.getDeckHasLiquid(state)
    const stepNeedsLiquid = ['transfer', 'distribute', 'consolidate', 'mix'].includes(payload.stepType)
    if (stepNeedsLiquid && !deckHasLiquid) {
      dispatch(tutorialActions.addHint('add_liquids_and_labware'))
    }
    dispatch(stepsActions.selectStep(stepId, stepType))
  }

export type ReorderSelectedStepAction = {
  type: 'REORDER_SELECTED_STEP',
  payload: {
    delta: number,
    stepId: StepIdType,
  },
}

export const reorderSelectedStep = (delta: number) =>
  (dispatch: ThunkDispatch<ReorderSelectedStepAction>, getState: GetState) => {
    const stepId = stepsSelectors.getSelectedStepId(getState())

    if (stepId != null) {
      dispatch({
        type: 'REORDER_SELECTED_STEP',
        payload: {
          delta,
          stepId,
        },
      })
    }
  }

export type DuplicateStepAction = {
  type: 'DUPLICATE_STEP',
  payload: {
    stepId: StepIdType,
    duplicateStepId: StepIdType,
  },
}

export const duplicateStep = (stepId: StepIdType) =>
  (dispatch: ThunkDispatch<DuplicateStepAction>, getState: GetState) => {
    const duplicateStepId = uuid()

    if (stepId != null) {
      dispatch({
        type: 'DUPLICATE_STEP',
        payload: {stepId, duplicateStepId},
      })
    }
  }
