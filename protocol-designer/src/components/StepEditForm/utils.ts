import difference from 'lodash/difference'
import isEqual from 'lodash/isEqual'
import without from 'lodash/without'
import {
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'
import { i18n } from '../../localization'
import {
  PROFILE_CYCLE,
  FormData,
  ProfileItem,
  StepFieldName,
  StepType,
  PathOption,
} from '../../form-types'
import { getDefaultsForStepType } from '../../steplist/formLevel/getDefaultsForStepType'
import { Options } from '@opentrons/components'
import { ProfileFormError } from '../../steplist/formLevel/profileErrors'
import { FormWarning } from '../../steplist/formLevel/warnings'
import type { StepFormErrors } from '../../steplist/types'
import type { LabwareDefByDefURI } from '../../labware-defs'

export function getBlowoutLocationOptionsForForm(args: {
  stepType: StepType
  path?: PathOption | null | undefined
}): Options {
  const { stepType, path } = args
  // TODO: Ian 2019-02-21 use i18n for names
  const destOption = {
    name: 'Destination Well',
    value: DEST_WELL_BLOWOUT_DESTINATION,
  }
  const sourceOption = {
    name: 'Source Well',
    value: SOURCE_WELL_BLOWOUT_DESTINATION,
  }

  if (stepType === 'mix') {
    return [destOption]
  } else if (stepType === 'moveLiquid') {
    switch (path) {
      case 'single': {
        return [sourceOption, destOption]
      }

      case 'multiDispense': {
        return [sourceOption, { ...destOption, disabled: true }]
      }

      case 'multiAspirate': {
        return [{ ...sourceOption, disabled: true }, destOption]
      }

      default: {
        // is moveLiquid but no path -- assume we're in batch edit mode
        // with mixed/indeterminate path values
        return [
          { ...sourceOption, disabled: true },
          { ...destOption, disabled: true },
        ]
      }
    }
  }

  return []
}
// TODO: type fieldNames, don't use `string`
export const getDirtyFields = (
  isNewStep: boolean,
  formData?: FormData | null
): string[] => {
  let dirtyFields = []

  if (formData == null) {
    return []
  }

  if (!isNewStep) {
    dirtyFields = Object.keys(formData)
  } else {
    const data = formData
    // new step, but may have auto-populated fields.
    // "Dirty" any fields that differ from default new form values
    const defaultFormData = getDefaultsForStepType(formData.stepType)
    dirtyFields = Object.keys(defaultFormData).reduce(
      (acc: string[], fieldName: StepFieldName) => {
        const currentValue = data[fieldName]
        const initialValue = defaultFormData[fieldName]
        return isEqual(currentValue, initialValue) ? acc : [...acc, fieldName]
      },
      []
    )
  }

  // exclude form "metadata" (not really fields)
  return without(dirtyFields, 'stepType', 'id')
}
export const getVisibleFormErrors = (args: {
  focusedField?: string | null
  dirtyFields: string[]
  errors: StepFormErrors
}): StepFormErrors => {
  const { focusedField, dirtyFields, errors } = args
  return errors.filter(error => {
    const dependentFieldsAreNotFocused = !error.dependentFields.includes(
      // @ts-expect-error(sa, 2021-6-22): focusedField might be undefined
      focusedField
    )
    const dependentFieldsAreDirty =
      difference(error.dependentFields, dirtyFields).length === 0
    return dependentFieldsAreNotFocused && dependentFieldsAreDirty
  })
}
export const getVisibleFormWarnings = (args: {
  focusedField?: string | null
  dirtyFields: string[]
  errors: FormWarning[]
}): FormWarning[] => {
  const { focusedField, dirtyFields, errors } = args
  return errors.filter(error => {
    const dependentFieldsAreNotFocused = !error.dependentFields.includes(
      // @ts-expect-error(sa, 2021-6-22): focusedField might be undefined
      focusedField
    )
    const dependentFieldsAreDirty =
      difference(error.dependentFields, dirtyFields).length === 0
    return dependentFieldsAreNotFocused && dependentFieldsAreDirty
  })
}
// for the purpose of focus handlers, derive a unique ID for each dynamic field
export const getDynamicFieldFocusHandlerId = ({
  id,
  name,
}: {
  id: string
  name: string
}): string => `${id}:${name}`
// NOTE: if any fields of a given name are pristine, treat all fields of that name as pristine.
// (Errors don't currently specify the id, so if we later want to only mask form-level errors
// for specific profile fields, the field's parent ProfileItem id needs to be included in the error)
export const getVisibleProfileFormLevelErrors = (args: {
  focusedField?: string | null
  dirtyFields: string[]
  errors: ProfileFormError[]
  profileItemsById: Record<string, ProfileItem>
}): ProfileFormError[] => {
  const { dirtyFields, focusedField, errors, profileItemsById } = args
  const profileItemIds = Object.keys(profileItemsById)
  return errors.filter(error => {
    return profileItemIds.every(itemId => {
      const item = profileItemsById[itemId]
      const steps = item.type === PROFILE_CYCLE ? item.steps : [item]
      return steps.every(step => {
        const fieldsForStep = error.dependentProfileFields.map(fieldName =>
          getDynamicFieldFocusHandlerId({
            id: step.id,
            name: fieldName,
          })
        )
        const dependentFieldsAreNotFocused = !fieldsForStep.includes(
          // @ts-expect-error(sa, 2021-6-22): focusedField might be undefined
          focusedField
        )
        const dependentProfileFieldsAreDirty =
          difference(fieldsForStep, dirtyFields).length === 0
        return dependentFieldsAreNotFocused && dependentProfileFieldsAreDirty
      })
    })
  })
}
export const getFieldDefaultTooltip = (name: string): string =>
  i18n.t([`tooltip.step_fields.defaults.${name}`, ''])
export const getFieldIndeterminateTooltip = (name: string): string =>
  i18n.t([`tooltip.step_fields.indeterminate.${name}`, ''])
export const getSingleSelectDisabledTooltip = (
  name: string,
  stepType: string
): string =>
  i18n.t([
    `tooltip.step_fields.${stepType}.disabled.${name}`,
    `tooltip.step_fields.${stepType}.disabled.$generic`,
    '',
  ])
// TODO(IL, 2021-03-03): keys for fieldMap are more strictly of TipOffsetFields type,
// but since utils like addFieldNamePrefix return StepFieldName/string instead
// of strict TipOffsetFields, we have to be more lenient with the types
export function getLabwareFieldForPositioningField(
  name: StepFieldName
): StepFieldName {
  const fieldMap: Record<StepFieldName, StepFieldName> = {
    aspirate_mmFromBottom: 'aspirate_labware',
    aspirate_touchTip_mmFromBottom: 'aspirate_labware',
    aspirate_delay_mmFromBottom: 'aspirate_labware',
    dispense_mmFromBottom: 'dispense_labware',
    dispense_touchTip_mmFromBottom: 'dispense_labware',
    dispense_delay_mmFromBottom: 'dispense_labware',
    mix_mmFromBottom: 'labware',
    mix_touchTip_mmFromBottom: 'labware',
  }
  return fieldMap[name]
}

export function getTouchTipNotSupportedLabware(
  allLabware: LabwareDefByDefURI,
  labwareId?: string
): boolean {
  const labwareDefURI = labwareId?.split(':')[1] ?? ''
  const isTouchTipNotSupported =
    allLabware[labwareDefURI]?.parameters?.quirks?.includes(
      'touchTipDisabled'
    ) ?? false
  return isTouchTipNotSupported
}
