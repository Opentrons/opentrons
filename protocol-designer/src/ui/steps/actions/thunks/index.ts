import last from 'lodash/last'

import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { PAUSE_UNTIL_TEMP } from '/protocol-designer/constants'
import * as fileDataSelectors from '/protocol-designer/file-data/selectors'
import {
  getCurrentFormIsPresaved,
  getInitialDeckSetup,
  getSavedStepHierarchy,
  getUnsavedForm,
} from '/protocol-designer/step-forms/selectors'
import {
  changeFormInput,
  reorderSteps,
} from '/protocol-designer/steplist/actions/actions'
import { PRESAVED_STEP_ID } from '/protocol-designer/steplist/types'
import { getStepHierarchyAfterDuplication } from '/protocol-designer/steplist/utils/getStepHierarchyAfterDuplication'
import { getStepsToSelectAfterDuplication } from '/protocol-designer/steplist/utils/getStepsToSelect'
import {
  computeStepSwap,
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
import type { ReorderStepsAction } from '/protocol-designer/steplist/actions/actions'
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
  } else if (payload.stepType === 'vacuum') {
    const vacuumModules = Object.entries(modules).filter(
      ([_, module]) => module.type === VACUUM_MODULE_TYPE
    )
    const vacuumModuleId =
      vacuumModules.length === 1 ? vacuumModules[0][0] : null
    if (vacuumModuleId != null) {
      dispatch(
        selectDropdownItem({
          selection: { id: vacuumModuleId, text: 'Selected', field: '1' },
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

export const reorderSelectedStep: (
  direction: 'up' | 'down'
) => ThunkAction<ReorderStepsAction> = direction => (dispatch, getState) => {
  const initialState = getState()

  const stepId = getSelectedStepId(initialState)
  if (stepId == null) {
    return
  }

  const originalStepHierarchy = getSavedStepHierarchy(initialState)
  const newStepHierarchy = computeStepSwap(
    originalStepHierarchy,
    stepId,
    direction
  )

  if (stepId != null) {
    dispatch(reorderSteps(convertStepHierarchyToArray(newStepHierarchy)))
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
    SelectStepAction | SelectMultipleStepsAction | null => {
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
  payload: {
    /**
     * The form that the user is saving.
     *
     * If the ID points to one that already exists, it will be edited in-place.
     * Otherwise, it will be appended to the timeline as a new step.
     */
    form: FormData

    /**
     * If a new concurrent group step is being saved, a "wait for group to
     * complete" step will be saved along with it, implicitly. This is the ID to use
     * for that new wait step.
     *
     * If no wait step needs to be created, this is ignored.
     */
    concurrentGroupPauseStepId: StepIdType
  }
}
export const _saveStepForm = (form: FormData): SaveStepFormAction => {
  // if presaved, transform pseudo ID to real UUID upon save
  const id = form.id === PRESAVED_STEP_ID ? uuid() : form.id
  const adjustedForm = { ...form, id }

  return {
    type: SAVE_STEP_FORM,
    payload: {
      form: adjustedForm,
      concurrentGroupPauseStepId: uuid(),
    },
  }
}

/**
 * Take the current unsaved form and save it.
 */
export const saveStepForm: () => ThunkAction<any> =
  () => (dispatch, getState) => {
    const initialState = getState()
    const unsavedForm = getUnsavedForm(initialState)
    const isFirstTimeSavingThisForm = getCurrentFormIsPresaved(initialState)

    // this check is only for TypeScript. At this point, unsavedForm should always be populated
    if (unsavedForm == null) {
      console.assert(
        false,
        'Tried to saveStepForm with falsey unsavedForm. This should never be able to happen.'
      )
      return
    }

    if (tutorialSelectors.shouldShowCoolingHint(initialState)) {
      dispatch(
        tutorialActions.addHint({ hintKey: 'thermocycler_lid_passive_cooling' })
      )
    }
    if (tutorialSelectors.shouldShowWasteChuteHint(initialState)) {
      dispatch(tutorialActions.addHint({ hintKey: 'waste_chute_warning' }))
    }

    // save the form
    dispatch(_saveStepForm(unsavedForm))

    // Save any bonus steps that come with it.
    const isTempModSetTempForm =
      unsavedForm.stepType === 'temperature' &&
      unsavedForm.targetTemperature != null
    const isHSSetTempForm =
      unsavedForm.stepType === 'heaterShaker' &&
      unsavedForm.targetHeaterShakerTemperature != null &&
      unsavedForm.heaterShakerSetTimer !== true
    const isThermocyclerProfileForm =
      unsavedForm.stepType === 'thermocycler' &&
      unsavedForm.thermocyclerFormType === 'thermocyclerProfile'
    if (isTempModSetTempForm && isFirstTimeSavingThisForm) {
      dispatch(saveWaitForTemperatureModuleTemp(unsavedForm))
      dispatch(
        tutorialActions.addHint({
          hintKey: 'wait_for_temperature_module_temp',
          targetTemperature: unsavedForm.targetTemperature,
        })
      )
    } else if (isHSSetTempForm && isFirstTimeSavingThisForm) {
      dispatch(saveWaitForHeaterShakerTemp(unsavedForm))
      dispatch(
        tutorialActions.addHint({
          hintKey: 'wait_for_heater_shaker_temp',
          targetTemperature: unsavedForm.targetHeaterShakerTemperature,
        })
      )
    } else if (isThermocyclerProfileForm && isFirstTimeSavingThisForm) {
      // The "wait for profile" bonus step should get added by the underlying
      // reducer, so we don't need to add it here. Just raise the hint to explain it.
      dispatch(
        tutorialActions.addHint({
          hintKey: 'wait_for_thermocycler_profile',
        })
      )
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
