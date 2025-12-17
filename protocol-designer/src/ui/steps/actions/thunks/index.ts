import last from 'lodash/last'

import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import {
  PAUSE_UNTIL_TC_PROFILE_COMPLETE,
  PAUSE_UNTIL_TEMP,
} from '/protocol-designer/constants'
import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'
import * as fileDataSelectors from '/protocol-designer/file-data/selectors'
import {
  getCurrentFormIsPresaved,
  getInitialDeckSetup,
  getSavedStepHierarchy,
  getUnsavedForm,
} from '/protocol-designer/step-forms/selectors'
import { changeFormInput } from '/protocol-designer/steplist/actions/actions'
import { PRESAVED_STEP_ID } from '/protocol-designer/steplist/types'
import { getStepHierarchyAfterDuplication } from '/protocol-designer/steplist/utils/getStepHierarchyAfterDuplication'
import { getStepsToSelectAfterDuplication } from '/protocol-designer/steplist/utils/getStepsToSelect'
import {
  convertStepHierarchyToArray,
  getPairedSteps,
} from '/protocol-designer/steplist/utils/stepHierarchy'
import {
  actions as tutorialActions,
  selectors as tutorialSelectors,
} from '/protocol-designer/tutorial'
import { uuid } from '/protocol-designer/utils'

import {
  getMultiSelectItemIds,
  getMultiSelectLastSelected,
  getSelectedStepId,
} from '../../selectors'
import { addStep, selectDropdownItem } from '../actions'

import type {
  FormData,
  StepIdType,
  StepType,
} from '/protocol-designer/form-types'
import type { ThunkAction } from '/protocol-designer/types'
import type {
  DuplicateSelectedStepsAction,
  SelectMultipleStepsAction,
  SelectStepAction,
} from '../types'

export const addAndSelectStep: (arg: {
  stepType: StepType
}) => ThunkAction<any> = payload => (dispatch, getState) => {
  const robotStateTimeline = fileDataSelectors.getRobotStateTimeline(getState())
  const initialDeckSetup = getInitialDeckSetup(getState())
  const { modules, labware } = initialDeckSetup
  dispatch(
    addStep({
      stepType: payload.stepType,
      robotStateTimeline,
    })
  )
  if (payload.stepType === 'thermocycler') {
    const tcId = Object.entries(modules).find(
      ([key, module]) => module.type === THERMOCYCLER_MODULE_TYPE
    )?.[0]
    if (tcId != null) {
      dispatch(
        selectDropdownItem({
          selection: {
            id: tcId,
            text: 'Selected',
            field: '1',
          },
          mode: 'add',
        })
      )
    }
  } else if (payload.stepType === 'magnet') {
    const magId = Object.entries(modules).find(
      ([key, module]) => module.type === MAGNETIC_MODULE_TYPE
    )?.[0]
    if (magId != null) {
      dispatch(
        selectDropdownItem({
          selection: {
            id: magId,
            text: 'Selected',
            field: '1',
          },
          mode: 'add',
        })
      )
    }
  } else if (payload.stepType === 'temperature') {
    const temperatureModules = Object.entries(modules).filter(
      ([key, module]) => module.type === TEMPERATURE_MODULE_TYPE
    )
    //  only set selected temperature module if only 1 type is on deck
    const tempId =
      temperatureModules.length === 1 ? temperatureModules[0][0] : null
    if (tempId != null) {
      dispatch(
        selectDropdownItem({
          selection: {
            id: tempId,
            text: 'Selected',
            field: '1',
          },
          mode: 'add',
        })
      )
    }
  } else if (payload.stepType === 'heaterShaker') {
    const hsModules = Object.entries(modules).filter(
      ([key, module]) => module.type === HEATERSHAKER_MODULE_TYPE
    )
    //  only set selected h-s module if only 1 type is on deck
    const hsId = hsModules.length === 1 ? hsModules[0][0] : null
    if (hsId != null) {
      dispatch(
        selectDropdownItem({
          selection: {
            id: hsId,
            text: 'Selected',
            field: '1',
          },
          mode: 'add',
        })
      )
    }
  } else if (payload.stepType === 'absorbanceReader') {
    const abosrbanceReaderModules = Object.entries(modules).filter(
      ([, module]) => module.type === ABSORBANCE_READER_TYPE
    )
    const absorbanceReaderId =
      abosrbanceReaderModules.length === 1
        ? abosrbanceReaderModules[0][0]
        : null
    if (abosrbanceReaderModules != null) {
      dispatch(
        selectDropdownItem({
          selection: {
            id: absorbanceReaderId,
            text: 'Selected',
            field: '1',
          },
          mode: 'add',
        })
      )
    }
  } else if (payload.stepType === 'flexStacker') {
    const flexStackerModules = Object.entries(modules).filter(
      ([key, module]) => module.type === FLEX_STACKER_MODULE_TYPE
    )
    const flexStackerId =
      flexStackerModules.length === 1 ? flexStackerModules[0][0] : null
    if (flexStackerId != null) {
      dispatch(
        selectDropdownItem({
          selection: { id: flexStackerId, text: 'Selected', field: '1' },
          mode: 'add',
        })
      )
    }
  } else if (payload.stepType === 'mix' || payload.stepType === 'moveLiquid') {
    const labwares = Object.entries(labware).filter(
      ([key, lw]) =>
        !lw.def.parameters.isTiprack &&
        !lw.def.allowedRoles?.includes('adapter') &&
        !lw.def.allowedRoles?.includes('lid')
    )
    //  only set selected labware if only 1 available labware is on deck
    const labwareId = labwares.length === 1 ? labwares[0][0] : null
    if (labwareId != null) {
      dispatch(
        selectDropdownItem({
          selection: {
            id: labwareId,
            text: payload.stepType === 'moveLiquid' ? 'Source' : 'Selected',
            field: '1',
          },
          mode: 'add',
        })
      )
    }
  } else if (payload.stepType === 'moveLabware') {
    const labwares = Object.entries(labware).filter(
      ([key, lw]) => !lw.def.allowedRoles?.includes('adapter')
    )
    //  only set selected labware if only 1 available labware/tiprack/lid is on deck
    const labwareId = labwares.length === 1 ? labwares[0][0] : null
    if (labwareId != null) {
      dispatch(
        selectDropdownItem({
          selection: {
            id: labwareId,
            text: 'Selected',
            field: '1',
          },
          mode: 'add',
        })
      )
    }
  }
}

// todo(mm, 2025-10-27): This action, currently only used for moving steps via keyboard,
// needs to be updated to correctly handle the selected step being the root of a nested
// group.  Currently, it lets you reorder the root of a group after the paired step
// that closes the group, which causes all manner of timeline breakage.
export interface ReorderSelectedStepAction {
  type: 'REORDER_SELECTED_STEP'
  payload: {
    delta: number
    stepId: StepIdType
  }
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

export const duplicateSelectedSteps: () => ThunkAction<
  DuplicateSelectedStepsAction | SelectStepAction | SelectMultipleStepsAction
> = () => (dispatch, getState) => {
  const originalStepHierarchy = getSavedStepHierarchy(getState())

  // todo(mm, 2025-11-05): This input gathering is a bit tedious because the state and
  // selectors have a firm separation between single-select mode and multi-select mode.
  // We probably want to combine the two modes into one.
  const rawMultiSelectedStepIds = getMultiSelectItemIds(getState())
  const rawSingleSelectedStepId = getSelectedStepId(getState())
  const rawSelectedStepIds =
    rawMultiSelectedStepIds ??
    (rawSingleSelectedStepId != null ? [rawSingleSelectedStepId] : [])
  const lastSelectedStepId =
    getMultiSelectLastSelected(getState()) ?? rawSingleSelectedStepId

  const stepIdsToDuplicate = new Set([
    ...rawSelectedStepIds,
    ...getPairedSteps(originalStepHierarchy, new Set(rawSelectedStepIds)),
  ])
  const duplicateIdsZipped = [...stepIdsToDuplicate].map(originalStepId => ({
    originalStepId,
    duplicateStepId: uuid(),
  }))
  const originalIdsToDuplicateIds = Object.fromEntries(
    duplicateIdsZipped.map(({ originalStepId, duplicateStepId }) => [
      originalStepId,
      duplicateStepId,
    ])
  )

  if (lastSelectedStepId == null) {
    // Nothing selected, apparently, so nothing to do.
    return
  }

  const stepHierarchyAfterDuplication = getStepHierarchyAfterDuplication(
    originalStepHierarchy,
    originalIdsToDuplicateIds,
    lastSelectedStepId
  )
  const stepOrderAfterDuplication = convertStepHierarchyToArray(
    stepHierarchyAfterDuplication
  )

  const stepIdsToSelect = getStepsToSelectAfterDuplication(
    stepHierarchyAfterDuplication,
    new Set(Object.values(originalIdsToDuplicateIds))
  )

  const duplicateSelectedStepsAction: DuplicateSelectedStepsAction = {
    type: 'DUPLICATE_SELECTED_STEPS',
    payload: {
      steps: duplicateIdsZipped,
      newStepOrder: stepOrderAfterDuplication,
    },
  }
  const selectNewStepsAction = (():
    | SelectStepAction
    | SelectMultipleStepsAction
    | null => {
    // If we have multiple step IDs to select, dispatch a SELECT_MULTIPLE_STEPS; if we
    // have just one, dispatch a SELECT_STEP. This just preserves prior behavior and
    // I'm not sure the distinction actually matters. We might be able to simplify this
    // by returning one action type always.
    if (stepIdsToSelect.length > 1) {
      return {
        type: 'SELECT_MULTIPLE_STEPS',
        payload: {
          stepIds: stepIdsToSelect,
          lastSelected: last(stepIdsToSelect)!,
        },
      }
    } else if (stepIdsToSelect.length === 1) {
      return {
        type: 'SELECT_STEP',
        payload: stepIdsToSelect[0],
      }
    } else {
      return null
    }
  })()
  dispatch(duplicateSelectedStepsAction)
  if (selectNewStepsAction != null) dispatch(selectNewStepsAction)
}
export const SAVE_STEP_FORM: 'SAVE_STEP_FORM' = 'SAVE_STEP_FORM'
export interface SaveStepFormAction {
  type: typeof SAVE_STEP_FORM
  payload: FormData
}
export const _saveStepForm = (form: FormData): SaveStepFormAction => {
  // if presaved, transform pseudo ID to real UUID upon save
  const payload = form.id === PRESAVED_STEP_ID ? { ...form, id: uuid() } : form
  return {
    type: SAVE_STEP_FORM,
    payload,
  }
}

/**
 * Take the current unsaved form and save it.
 *
 * Certain forms, when saved, also save a "bonus step" under certain circumstances.
 * e.g. saving a Temperature Module step may also save a "wait for temperature" step.
 * The bonus step might either be mandatory, in which case this thunk will always save it,
 * or optional as decided by the user, in which case the user's preference should be
 * passed in.
 */
export const saveStepForm: (options?: {
  userWantsBonusStep?: boolean
}) => ThunkAction<any> = options => (dispatch, getState) => {
  const { userWantsBonusStep = false } = options ?? {}
  const initialState = getState()
  const unsavedForm = getUnsavedForm(initialState)
  const isFirstTimeSavingThisForm = getCurrentFormIsPresaved(initialState)
  const enableConcurrentModuleActions =
    getEnableConcurrentModuleActions(initialState)

  // this check is only for TypeScript. At this point, unsavedForm should always be populated
  if (unsavedForm == null) {
    console.assert(
      false,
      'Tried to saveStepForm with falsey unsavedForm. This should never be able to happen.'
    )
    return
  }

  if (tutorialSelectors.shouldShowCoolingHint(initialState)) {
    dispatch(tutorialActions.addHint('thermocycler_lid_passive_cooling'))
  }

  if (tutorialSelectors.shouldShowWasteChuteHint(initialState)) {
    dispatch(tutorialActions.addHint('waste_chute_warning'))
  }

  // save the form
  dispatch(_saveStepForm(unsavedForm))

  // Save any bonus steps that come with it.
  // NOTE: This logic to decide whether a bonus step is warranted should be kept in sync
  // with getBonusStepDialogType().
  const isTempModSetTempForm =
    unsavedForm?.stepType === 'temperature' &&
    unsavedForm?.targetTemperature != null
  const isHSSetTempForm =
    unsavedForm?.stepType === 'heaterShaker' &&
    unsavedForm?.targetHeaterShakerTemperature != null &&
    unsavedForm?.heaterShakerSetTimer !== true
  const isTCProfileForm =
    unsavedForm?.stepType === 'thermocycler' &&
    unsavedForm?.thermocyclerFormType === 'thermocyclerProfile'
  if (isTempModSetTempForm && userWantsBonusStep) {
    dispatch(saveWaitForTemperatureModuleTemp(unsavedForm))
  } else if (isHSSetTempForm && userWantsBonusStep) {
    dispatch(saveWaitForHeaterShakerTemp(unsavedForm))
  } else if (
    isTCProfileForm &&
    // todo(mm, 2025-11-25): isFirstTimeSavingThisForm is not quite sufficient here.
    // We also need to cover the case where the form existed before as a non-profile step
    // and now it's being edited into a profile step.
    // https://opentrons.atlassian.net/browse/EXEC-2024
    isFirstTimeSavingThisForm &&
    // With enableConcurrentModuleActions, TC profile forms are interpreted as
    // "start profile" steps and they're always paired with separate "wait for profile
    // to complete" steps. Without enableConcurrentModuleActions, TC profile forms are
    // interpreted as blocking "start profile and wait for it to complete" steps,
    // without a separate wait step.
    enableConcurrentModuleActions
  ) {
    dispatch(saveWaitForThermocyclerProfile(unsavedForm))
  }
}

const saveWaitForTemperatureModuleTemp: (
  unsavedSetTemperatureForm: FormData
) => ThunkAction<any> = unsavedSetTemperatureForm => (dispatch, getState) => {
  const tempertureModuleId = unsavedSetTemperatureForm?.moduleId
  const temperature = unsavedSetTemperatureForm.targetTemperature

  console.assert(
    temperature != null && temperature !== '',
    `tried to auto-add a pause until temp, but targetTemperature is missing: ${temperature}`
  )

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
  dispatch(
    changeFormInput({
      update: {
        moduleId: tempertureModuleId,
      },
    })
  )
  dispatch(
    changeFormInput({
      update: {
        pauseTemperature: temperature,
      },
    })
  )

  // finally save the new pause form
  const unsavedPauseForm = getUnsavedForm(getState())
  if (unsavedPauseForm != null) {
    dispatch(_saveStepForm(unsavedPauseForm))
  } else {
    // this conditional is for TypeScript, the unsaved form should always exist
    console.assert(
      false,
      'could not auto-save pause form, getUnsavedForm returned nullish'
    )
  }
}

const saveWaitForHeaterShakerTemp: (
  unsavedHeaterShakerForm: FormData
) => ThunkAction<any> = unsavedHeaterShakerForm => (dispatch, getState) => {
  const heaterShakerModuleId = unsavedHeaterShakerForm.moduleId
  const temperature = unsavedHeaterShakerForm.targetHeaterShakerTemperature

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
  dispatch(
    changeFormInput({
      update: {
        moduleId: heaterShakerModuleId,
      },
    })
  )
  dispatch(
    changeFormInput({
      update: {
        pauseTemperature: temperature,
      },
    })
  )

  // finally save the new pause form
  const unsavedPauseForm = getUnsavedForm(getState())
  if (unsavedPauseForm != null) {
    dispatch(_saveStepForm(unsavedPauseForm))
  } else {
    // this conditional is for TypeScript, the unsaved form should always exist
    console.assert(
      false,
      'could not auto-save pause form, getUnsavedForm returned nullish'
    )
  }
}

const saveWaitForThermocyclerProfile: (
  unsavedThermocyclerProfileForm: FormData
) => ThunkAction<any> =
  unsavedThermocyclerProfileForm => (dispatch, getState) => {
    const thermocyclerModuleId = unsavedThermocyclerProfileForm.moduleId

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
          pauseAction: PAUSE_UNTIL_TC_PROFILE_COMPLETE,
        },
      })
    )

    dispatch(
      changeFormInput({
        update: {
          moduleId: thermocyclerModuleId,
        },
      })
    )

    // finally save the new pause form
    const unsavedPauseForm = getUnsavedForm(getState())
    if (unsavedPauseForm != null) {
      dispatch(_saveStepForm(unsavedPauseForm))
    } else {
      // this conditional is for TypeScript, the unsaved form should always exist
      console.assert(
        false,
        'could not auto-save pause form, getUnsavedForm returned nullish'
      )
    }
  }
