// @flow
import { uuid } from '../../../utils'
import { selectors as labwareIngredsSelectors } from '../../../labware-ingred/selectors'
import stepsSelectors from '../selectors'
import { selectStep } from './actions'
import { actions as tutorialActions } from '../../../tutorial'

import * as uiModuleSelectors from '../../../ui/modules/selectors'
import type { DuplicateStepAction } from './types'

import type { StepType, StepIdType } from '../../../form-types'
import type { GetState, ThunkDispatch } from '../../../types'

// addStep thunk adds an incremental integer ID for Step reducers.
export const addStep = (payload: { stepType: StepType }) => (
  dispatch: ThunkDispatch<*>,
  getState: GetState
) => {
  const state = getState()
  const stepId = uuid()
  const { stepType } = payload
  dispatch({
    type: 'ADD_STEP',
    payload: {
      ...payload,
      id: stepId,
    },
  })
  const deckHasLiquid = labwareIngredsSelectors.getDeckHasLiquid(state)
  const magnetModuleHasLabware = uiModuleSelectors.getMagnetModuleHasLabware(
    state
  )
  const temperatureModuleHasLabware = uiModuleSelectors.getTemperatureModuleHasLabware(
    state
  )
  const thermocyclerModuleHasLabware = uiModuleSelectors.getThermocyclerModuleHasLabware(
    state
  )
  const temperatureModuleOnDeck = uiModuleSelectors.getSingleTemperatureModuleId(
    state
  )
  const thermocyclerModuleOnDeck = uiModuleSelectors.getSingleThermocyclerModuleId(
    state
  )

  // TODO: Ian 2019-01-17 move out to centralized step info file - see #2926
  const stepNeedsLiquid = ['mix', 'moveLiquid'].includes(payload.stepType)
  const stepMagnetNeedsLabware = ['magnet'].includes(payload.stepType)
  const stepTemperatureNeedsLabware = ['temperature'].includes(payload.stepType)
  if (stepNeedsLiquid && !deckHasLiquid) {
    dispatch(tutorialActions.addHint('add_liquids_and_labware'))
  }
  if (
    (stepMagnetNeedsLabware && !magnetModuleHasLabware) ||
    (stepTemperatureNeedsLabware &&
      ((temperatureModuleOnDeck && !temperatureModuleHasLabware) ||
        (thermocyclerModuleOnDeck && !thermocyclerModuleHasLabware)))
  ) {
    dispatch(tutorialActions.addHint('module_without_labware'))
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

export const reorderSelectedStep = (delta: number) => (
  dispatch: ThunkDispatch<ReorderSelectedStepAction>,
  getState: GetState
) => {
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

export const duplicateStep = (stepId: StepIdType) => (
  dispatch: ThunkDispatch<DuplicateStepAction>,
  getState: GetState
) => {
  const duplicateStepId = uuid()

  if (stepId != null) {
    dispatch({
      type: 'DUPLICATE_STEP',
      payload: { stepId, duplicateStepId },
    })
  }
}
