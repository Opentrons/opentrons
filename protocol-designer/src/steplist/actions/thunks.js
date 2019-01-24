// @flow
import {uuid} from '../../utils'
import {selectors as labwareIngredsSelectors} from '../../labware-ingred/selectors'
import {selectors as stepsSelectors, actions as stepsActions} from '../../ui/steps'
import {actions as tutorialActions} from '../../tutorial'
import type {StepType, StepIdType} from '../../form-types'
import type {GetState, ThunkDispatch} from '../../types'

export const SCROLL_ON_SELECT_STEP_CLASSNAME = 'scroll_on_select_step'

export type SelectStepAction = {
  type: 'SELECT_STEP',
  payload: StepIdType,
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
    // TODO: Ian 2019-01-17 move out to centralized step info file - see #2926
    const stepNeedsLiquid = ['transfer', 'distribute', 'consolidate', 'mix', 'moveLiquid'].includes(payload.stepType)
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
