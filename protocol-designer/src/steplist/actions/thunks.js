// @flow
import forEach from 'lodash/forEach'
import handleFormChange from './handleFormChange'
import {uuid} from '../../utils'
import {selectors as labwareIngredsSelectors} from '../../labware-ingred/reducers'
import * as pipetteSelectors from '../../pipettes/selectors'
import {selectors as steplistSelectors} from '../../steplist'
import {actions as tutorialActions} from '../../tutorial'
import {getNextDefaultPipetteId, generateNewForm} from '../formLevel'
import type {StepType, StepIdType, FormData} from '../../form-types'
import type {BaseState, GetState, ThunkAction, ThunkDispatch} from '../../types'

export const SCROLL_ON_SELECT_STEP_CLASSNAME = 'scroll_on_select_step'

export type SelectStepAction = {
  type: 'SELECT_STEP',
  payload: StepIdType,
}

// get new or existing step for given stepId
function getStepFormData (state: BaseState, stepId: StepIdType, newStepType?: StepType): ?FormData {
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

// NOTE: 'newStepType' arg is only used when generating a new step
export const selectStep = (stepId: StepIdType, newStepType?: StepType): ThunkAction<*> =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const selectStepAction: SelectStepAction = {
      type: 'SELECT_STEP',
      payload: stepId,
    }

    dispatch(selectStepAction)

    const state = getState()
    let formData = getStepFormData(state, stepId, newStepType)

    const defaultPipetteId = getNextDefaultPipetteId(
      steplistSelectors.getSavedForms(state),
      steplistSelectors.getOrderedSteps(state),
      pipetteSelectors.getEquippedPipettes(state),
    )

    // For a pristine step, if there is a `pipette` field in the form
    // (added by upstream `getDefaultsForStepType` fn),
    // then set `pipette` field of new steps to the next default pipette id.
    //
    // In order to trigger dependent field changes (eg default disposal volume),
    // update the form thru handleFormChange.
    const formHasPipetteField = formData && 'pipette' in formData
    if (newStepType && formHasPipetteField && defaultPipetteId) {
      const updatePayload = {update: {pipette: defaultPipetteId}}
      const updatedFields = handleFormChange(
        updatePayload,
        formData,
        getState).update

      formData = {
        ...formData,
        ...updatedFields,
      }
    }

    dispatch({
      type: 'POPULATE_FORM',
      payload: formData,
    })

    // scroll to top of all elements with the special class
    forEach(
      global.document.getElementsByClassName(SCROLL_ON_SELECT_STEP_CLASSNAME),
      elem => { elem.scrollTop = 0 }
    )
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
    dispatch(selectStep(stepId, stepType))
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
    const stepId = steplistSelectors.getSelectedStepId(getState())

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
