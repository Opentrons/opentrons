// @flow
import assert from 'assert'
import {
  getUnsavedForm,
  getUnsavedFormIsPristineSetTempForm,
} from '../../../../step-forms/selectors'
import { changeFormInput } from '../../../../steplist/actions/actions'
import { PRESAVED_STEP_ID } from '../../../../steplist/types'

import { PAUSE_UNTIL_TEMP } from '../../../../constants'
import { uuid } from '../../../../utils'
import { selectors as labwareIngredsSelectors } from '../../../../labware-ingred/selectors'
import { getSelectedStepId } from '../../selectors'
import { addStep } from '../actions'
import {
  actions as tutorialActions,
  selectors as tutorialSelectors,
} from '../../../../tutorial'

import * as uiModuleSelectors from '../../../../ui/modules/selectors'
import * as fileDataSelectors from '../../../../file-data/selectors'
import type { DuplicateStepAction } from '../types'

import type { StepType, StepIdType, FormData } from '../../../../form-types'
import type { ThunkAction } from '../../../../types'

export const addAndSelectStepWithHints: ({
  stepType: StepType,
}) => ThunkAction<any> = payload => (dispatch, getState) => {
  const robotStateTimeline = fileDataSelectors.getRobotStateTimeline(getState())
  dispatch(addStep({ stepType: payload.stepType, robotStateTimeline }))

  const state = getState()
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
  const stepModuleMissingLabware =
    (stepMagnetNeedsLabware && !magnetModuleHasLabware) ||
    (stepTemperatureNeedsLabware &&
      ((temperatureModuleOnDeck && !temperatureModuleHasLabware) ||
        (thermocyclerModuleOnDeck && !thermocyclerModuleHasLabware)))
  if (stepNeedsLiquid && !deckHasLiquid) {
    dispatch(tutorialActions.addHint('add_liquids_and_labware'))
  }
  if (stepModuleMissingLabware) {
    dispatch(tutorialActions.addHint('module_without_labware'))
  }
}

export type ReorderSelectedStepAction = {
  type: 'REORDER_SELECTED_STEP',
  payload: {
    delta: number,
    stepId: StepIdType,
  },
}

export const reorderSelectedStep: (
  delta: number
) => ThunkAction<ReorderSelectedStepAction> = delta => (dispatch, getState) => {
  const stepId = getSelectedStepId(getState())

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

export const duplicateStep: (
  stepId: StepIdType
) => ThunkAction<DuplicateStepAction> = stepId => (dispatch, getState) => {
  const duplicateStepId = uuid()

  if (stepId != null) {
    dispatch({
      type: 'DUPLICATE_STEP',
      payload: { stepId, duplicateStepId },
    })
  }
}

export const SAVE_STEP_FORM: 'SAVE_STEP_FORM' = 'SAVE_STEP_FORM'

export type SaveStepFormAction = {|
  type: typeof SAVE_STEP_FORM,
  payload: FormData,
|}

export const _saveStepForm = (form: FormData): SaveStepFormAction => {
  // if presaved, transform pseudo ID to real UUID upon save
  const payload = form.id === PRESAVED_STEP_ID ? { ...form, id: uuid() } : form
  return {
    type: SAVE_STEP_FORM,
    payload,
  }
}

/** take unsavedForm state and put it into the payload */
export const saveStepForm: () => ThunkAction<any> = () => (
  dispatch,
  getState
) => {
  const initialState = getState()
  const unsavedForm = getUnsavedForm(initialState)

  // this check is only for Flow. At this point, unsavedForm should always be populated
  if (!unsavedForm) {
    assert(
      false,
      'Tried to saveStepForm with falsey unsavedForm. This should never be able to happen.'
    )
    return
  }

  if (tutorialSelectors.shouldShowCoolingHint(initialState)) {
    dispatch(tutorialActions.addHint('thermocycler_lid_passive_cooling'))
  }

  // save the form
  dispatch(_saveStepForm(unsavedForm))
}

/** "power action", mimicking saving the never-saved "set temperature X" step,
 ** then creating and saving a "pause until temp X" step */
export const saveSetTempFormWithAddedPauseUntilTemp: () => ThunkAction<any> = () => (
  dispatch,
  getState
) => {
  const initialState = getState()
  const unsavedSetTemperatureForm = getUnsavedForm(initialState)
  const isPristineSetTempForm = getUnsavedFormIsPristineSetTempForm(
    initialState
  )

  // this check is only for Flow. At this point, unsavedForm should always be populated
  if (!unsavedSetTemperatureForm) {
    assert(
      false,
      'Tried to saveSetTempFormWithAddedPauseUntilTemp with falsey unsavedForm. This should never be able to happen.'
    )
    return
  }

  const { id } = unsavedSetTemperatureForm

  if (!isPristineSetTempForm) {
    // this check should happen upstream (before dispatching saveSetTempFormWithAddedPauseUntilTemp in the first place)
    assert(
      false,
      `tried to saveSetTempFormWithAddedPauseUntilTemp but form ${id} is not a pristine set temp form`
    )
    return
  }

  const temperature = unsavedSetTemperatureForm?.targetTemperature
  assert(
    temperature != null && temperature !== '',
    `tried to auto-add a pause until temp, but targetTemperature is missing: ${temperature}`
  )
  // save the set temperature step form that is currently open
  dispatch(_saveStepForm(unsavedSetTemperatureForm))

  // add a new pause step form
  dispatch(
    addStep({
      stepType: 'pause',
      robotStateTimeline: fileDataSelectors.getRobotStateTimeline(getState()),
    })
  )

  // NOTE: fields should be set one at a time b/c dependentFieldsUpdate fns can filter out inputs
  // contingent on other inputs (eg changing the pauseAction radio button may clear the pauseTemperature).
  dispatch(
    changeFormInput({
      update: {
        pauseAction: PAUSE_UNTIL_TEMP,
      },
    })
  )
  dispatch(changeFormInput({ update: { pauseTemperature: temperature } }))

  // finally save the new pause form
  const unsavedPauseForm = getUnsavedForm(getState())

  // this conditional is for Flow, the unsaved form should always exist
  if (unsavedPauseForm != null) {
    dispatch(_saveStepForm(unsavedPauseForm))
  } else {
    assert(false, 'could not auto-save pause form, getUnsavedForm returned')
  }
}
