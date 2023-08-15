import uniqBy from 'lodash/uniqBy'
import { LabwareLocation, ModuleType } from '@opentrons/shared-data'
import { THERMOCYCLER_PROFILE } from '../../constants'
import { i18n } from '../../localization'
import {
  COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE,
  COMPATIBLE_LABWARE_ALLOWLIST_FOR_ADAPTER,
} from '../../utils/labwareModuleCompatibility'
import { PROFILE_STEP, ProfileStepItem } from '../../form-types'
import { LabwareEntity } from '@opentrons/step-generation'

// TODO: real HydratedFormData type
type HydratedFormData = any
export interface ProfileFormError {
  title: string
  body?: React.ReactNode
  dependentProfileFields: string[]
}
type ProfileFormErrorKey = 'INVALID_PROFILE_DURATION'
const PROFILE_FORM_ERRORS: Record<ProfileFormErrorKey, ProfileFormError> = {
  INVALID_PROFILE_DURATION: {
    title: 'Invalid profile duration',
    dependentProfileFields: ['durationMinutes', 'durationSeconds'],
  },
}
// TC Profile multi-field error fns
export const profileStepValidDuration = (
  step: ProfileStepItem
): ProfileFormError | null => {
  const minutes = parseFloat(step.durationMinutes) || 0
  const seconds = parseFloat(step.durationSeconds) || 0
  const isValid = minutes > 0 || seconds > 0
  return isValid ? null : PROFILE_FORM_ERRORS.INVALID_PROFILE_DURATION
}
// =====
const PROFILE_STEP_ERROR_GETTERS = [profileStepValidDuration]
export const getProfileFormErrors = (
  hydratedForm: HydratedFormData
): ProfileFormError[] => {
  if (
    hydratedForm.stepType !== 'thermocycler' ||
    hydratedForm.thermocyclerFormType !== THERMOCYCLER_PROFILE
  ) {
    return []
  }

  const { orderedProfileItems, profileItemsById } = hydratedForm
  const errors: ProfileFormError[] = []

  const addStepErrors = (step: ProfileStepItem): void => {
    PROFILE_STEP_ERROR_GETTERS.forEach(errorGetter => {
      const nextErrors = errorGetter(step)

      if (nextErrors !== null) {
        errors.push(nextErrors)
      }
    })
  }

  orderedProfileItems.forEach((itemId: string) => {
    const item = profileItemsById[itemId]

    if (item.type === PROFILE_STEP) {
      addStepErrors(item)
    } else {
      // Cycles themselves don't currently have any form-level errors,
      // so we just validate each cycle's steps
      item.steps.forEach(addStepErrors)
    }
  })
  // NOTE: since errors stacking doesn't seem to serve a purpose, remove repeats
  return uniqBy(errors, error => error.title)
}

const getMoveLabwareError = (
  labware: LabwareEntity,
  newLocation: LabwareLocation
): string | null => {
  let errorString: string | null = null
  if (labware == null || newLocation == null || newLocation === 'offDeck')
    return null
  const selectedLabwareDefUri = labware?.labwareDefURI
  if ('moduleId' in newLocation) {
    const loadName = selectedLabwareDefUri.split('/')[1].split('/')[0]
    const modValueDefUri = newLocation.moduleId.split(':')[1] as ModuleType
    const modAllowList =
      COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE[modValueDefUri]
    errorString = !modAllowList.includes(loadName)
      ? i18n.t(
          'form.step_edit_form.labwareLabel.errors.labwareIncompatibleWithMod'
        )
      : null
  } else if ('labwareId' in newLocation) {
    const adapterValueDefUri = newLocation.labwareId.split(':')[1]
    const adapterAllowList =
      COMPATIBLE_LABWARE_ALLOWLIST_FOR_ADAPTER[adapterValueDefUri]
    errorString = !adapterAllowList?.includes(selectedLabwareDefUri)
      ? i18n.t(
          'form.step_edit_form.labwareLabel.errors.labwareIncompatibleWithAdapter'
        )
      : null
  }
  return errorString
}

export const getMoveLabwareProfileFormErrors = (
  hydratedForm: HydratedFormData
): ProfileFormError[] => {
  if (hydratedForm.stepType !== 'moveLabware') {
    return []
  }

  const labware = hydratedForm.labware as LabwareEntity
  const newLocation = hydratedForm.newLocation as LabwareLocation

  const errorString = getMoveLabwareError(labware, newLocation)

  return errorString != null
    ? ([
        {
          title: errorString,
          dependentProfileFields: [],
        },
      ] as ProfileFormError[])
    : []
}
