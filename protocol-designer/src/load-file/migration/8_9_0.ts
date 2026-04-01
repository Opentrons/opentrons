import { produce } from 'immer'
import pickBy from 'lodash/pickBy'

import { uuid } from '/protocol-designer/utils'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { PAUSE_UNTIL_TC_PROFILE_COMPLETE } from '/protocol-designer/constants'
import type { PDMetadata } from '/protocol-designer/file-types'
import type { FormData } from '/protocol-designer/form-types'

// FormData isn't typed today, but these definitions are written in such a way that this
// migration should automatically benefit from the added detail whenever it is typed.
type ThermocyclerProfileFormData = FormData & {
  stepType: 'thermocycler'
  thermocyclerFormType: 'thermocyclerProfile'
}
type ThermocyclerStateFormData = FormData & {
  stepType: 'thermocycler'
  thermocyclerFormType: 'thermocyclerState'
}
type PauseUntilProfileCompleteFormData = FormData & {
  stepType: 'pause'
  pauseAction: typeof PAUSE_UNTIL_TC_PROFILE_COMPLETE
}

type StepForms = Pick<PDMetadata, 'savedStepForms' | 'orderedStepIds'>

/**
 * Migrates a PD v8.8.0 file to a PD v8.9.0 file.
 *
 * This migration splits up Thermocycler profile steps to support running them
 * concurrently to other steps.
 *
 * First: whereas prior PD versions interpreted Thermocycler profile steps as blocking,
 * PD v8.9.0 will interpret them as non-blocking. Like "start running profile" instead of
 * "run profile and wait for it to complete." So, to retain the protocol's existing
 * behavior, we need to insert a new "wait for profile to complete" step
 * immediately after every profile step.
 *
 * Second: if the original, blocking profile had any "ending hold" options set, those
 * aren't supported on the new non-blocking profile, because of backend limitations.
 * So, to retain the protocol's existing behavior, we need to insert a separate
 * "set Thermocycler state" step immediately after "wait for profile to complete".
 */
export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> =>
  produce(appData, draft => {
    if (draft?.designerApplication?.data == null) {
      throw Error('The designerApplication key in your file is corrupt.')
    }
    const newForms = mapStepForms(draft.designerApplication.data, migrateForm)
    draft.designerApplication.data.savedStepForms = newForms.savedStepForms
    draft.designerApplication.data.orderedStepIds = newForms.orderedStepIds
    return draft
  })

/**
 * v8.9.0 released with a bug where it would export a file that was mostly correctly
 * v8.9.0-shaped, except that designerApplication.version was incorrectly set to '8.8.0'.
 * This function detects such files.
 */
export function isBroken890Export(
  // This is `unknown` so this is safe to call on potentially ancient or invalid files,
  // where we can't assume much about their structure.
  appData: unknown
): boolean {
  // Inspect .designerApplication.version if it exists,
  // paranoically accounting for unknown input file shapes.
  const isDeclared880 =
    typeof appData === 'object' &&
    appData != null &&
    'designerApplication' in appData &&
    typeof appData.designerApplication === 'object' &&
    appData.designerApplication != null &&
    'version' in appData.designerApplication &&
    appData.designerApplication.version === '8.8.0'

  if (isDeclared880) {
    const trustedAppData = appData as ProtocolFile<PDMetadata>
    const savedStepForms = Object.values(
      trustedAppData.designerApplication?.data?.savedStepForms ?? {}
    )
    const fileContains890Structures = savedStepForms.some(
      savedStepForm =>
        savedStepForm.stepType === 'pause' &&
        savedStepForm.pauseAction === 'untilThermocyclerProfileComplete'
    )
    return fileContains890Structures
  } else {
    return false
  }
}

function migrateForm(originalForm: FormData): FormData[] {
  if (isThermocyclerProfileForm(originalForm)) {
    return migrateThermocyclerProfileForm(originalForm)
  } else {
    return [originalForm]
  }
}

function migrateThermocyclerProfileForm(
  originalForm: ThermocyclerProfileFormData
): FormData[] {
  const newProfileForm: ThermocyclerProfileFormData = {
    id: uuid(),
    stepType: 'thermocycler',
    stepName: originalForm.stepName,
    stepDetails: originalForm.stepDetails,

    thermocyclerFormType: 'thermocyclerProfile',

    moduleId: originalForm.moduleId,

    // These should be ignored because this is a profile step, not a state step.
    blockIsActive: false,
    blockTargetTemp: null,
    lidIsActive: false,
    lidTargetTemp: null,
    lidOpen: false,

    orderedProfileItems: originalForm.orderedProfileItems,
    profileItemsById: originalForm.profileItemsById,
    profileTargetLidTemp: originalForm.profileTargetLidTemp,
    profileVolume: originalForm.profileVolume,
  }

  const newPauseForm: PauseUntilProfileCompleteFormData = {
    id: uuid(),
    stepType: 'pause',
    stepName: 'pause',
    stepDetails: '',

    pauseAction: 'untilThermocyclerProfileComplete',
    moduleId: originalForm.moduleId,
  }

  const newStateForm: ThermocyclerStateFormData = {
    id: uuid(),
    stepType: 'thermocycler',
    stepName: originalForm.stepName,
    stepDetails: originalForm.stepDetails,

    thermocyclerFormType: 'thermocyclerState',

    moduleId: originalForm.moduleId,

    // The "end hold" options of the original thermocyclerProfile step get mapped into
    // the main options of this new thermocyclerState step.
    blockIsActive: originalForm.blockIsActiveHold,
    blockTargetTemp: originalForm.blockTargetTempHold,
    lidIsActive: originalForm.lidIsActiveHold,
    lidTargetTemp: originalForm.lidTargetTempHold,
    lidOpen: originalForm.lidOpenHold,

    orderedProfileItems: [],
    profileItemsById: {},
    profileTargetLidTemp: null,
    profileVolume: null,
  }

  return [newProfileForm, newPauseForm, newStateForm]
}

function isThermocyclerProfileForm(
  formData: FormData
): formData is ThermocyclerProfileFormData {
  return (
    formData.stepType === 'thermocycler' &&
    'thermocyclerFormType' in formData &&
    formData.thermocyclerFormType === 'thermocyclerProfile'
  )
}

function mapStepForms(
  originalStepForms: StepForms,
  mapFn: (originalForm: FormData) => FormData[]
): StepForms {
  const stepIdsPresentInOrdering = new Set(originalStepForms.orderedStepIds)

  // Capture special entries like __INITIAL_DECK_SETUP_STEP__ that are present in
  // savedStepForms but not present in orderedStepIds.
  const stepFormsMissingFromOrdering = pickBy(
    originalStepForms.savedStepForms,
    (stepForm, stepId) => !stepIdsPresentInOrdering.has(stepId)
  )

  const originalOrderedStepForms = originalStepForms.orderedStepIds.map(
    stepId => originalStepForms.savedStepForms[stepId]
  )
  const newOrderedStepForms = originalOrderedStepForms.flatMap(mapFn)

  return {
    orderedStepIds: newOrderedStepForms.map(form => form.id),
    savedStepForms: {
      ...stepFormsMissingFromOrdering,
      ...Object.fromEntries(newOrderedStepForms.map(form => [form.id, form])),
    },
  }
}
