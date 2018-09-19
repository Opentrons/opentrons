// @flow
import {selectors} from '../index'

import {selectors as labwareIngredsSelectors} from '../../labware-ingred/reducers'
import * as pipetteSelectors from '../../pipettes/selectors'
import {actions as tutorialActions} from '../../tutorial'
import {getNextDefaultPipetteId, generateNewForm} from '../formLevel'

import type {StepType, StepIdType, FormData} from '../../form-types'
import type {BaseState, GetState, ThunkAction, ThunkDispatch} from '../../types'

export type SelectStepAction = {
  type: 'SELECT_STEP',
  payload: StepIdType,
}

// get new or existing step for given stepId
function getStepFormData (state: BaseState, stepId: StepIdType, newStepType?: StepType): ?FormData {
  const existingStep = selectors.getSavedForms(state)[stepId]

  if (existingStep) {
    return existingStep
  }

  const defaultNextPipette = getNextDefaultPipetteId(
    selectors.getSavedForms(state),
    selectors.orderedSteps(state),
    pipetteSelectors.pipetteIdsByMount(state)
  )

  // TODO: Ian 2018-09-19 sunset 'steps' reducer. Right now, it's needed here to get stepType
  // for any step that was created but never saved (never clicked Save button).
  // Instead, new steps should have their stepType immediately added
  // to 'savedStepForms' upon creation.
  const steps = selectors.getSteps(state)
  const stepTypeFromStepReducer = steps[stepId] && steps[stepId].stepType
  const stepType = newStepType || stepTypeFromStepReducer

  if (!stepType) {
    console.error(`New step with id "${stepId}" was added with no stepType, could not generate form`)
    return null
  }

  return generateNewForm({
    stepId,
    stepType: stepType,
    defaultNextPipette,
  })
}

// NOTE: 'newStepType' arg is only used when generating a new step
export const selectStep = (stepId: StepIdType, newStepType?: StepType): ThunkAction<*> =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const selectStepAction: SelectStepAction = {
      type: 'SELECT_STEP',
      payload: stepId,
    }

    dispatch(selectStepAction)

    const formData = getStepFormData(getState(), stepId, newStepType)
    dispatch({
      type: 'POPULATE_FORM',
      payload: formData,
    })
  }

// addStep thunk adds an incremental integer ID for Step reducers.
export const addStep = (payload: {stepType: StepType}) =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const state = getState()
    const stepId = selectors.nextStepId(state)
    const {stepType} = payload
    dispatch({
      type: 'ADD_STEP',
      payload: {
        ...payload,
        id: stepId,
      },
    })
    const deckHasLiquid = labwareIngredsSelectors.hasLiquid(state)
    const stepNeedsLiquid = ['transfer', 'distribute', 'consolidate', 'mix'].includes(payload.stepType)
    if (stepNeedsLiquid && !deckHasLiquid) {
      dispatch(tutorialActions.addHint('add_liquids_and_labware'))
    }
    dispatch(selectStep(stepId, stepType))
  }
