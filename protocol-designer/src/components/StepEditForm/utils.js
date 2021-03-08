// @flow
import assert from 'assert'
import * as React from 'react'
import difference from 'lodash/difference'
import isEqual from 'lodash/isEqual'
import without from 'lodash/without'
import { i18n } from '../../localization'
import { PROFILE_CYCLE } from '../../form-types'
import {
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '../../step-generation/utils'
import { getDefaultsForStepType } from '../../steplist/formLevel/getDefaultsForStepType.js'
import styles from './StepEditForm.css'
import type { Options } from '@opentrons/components'
import type { ProfileFormError } from '../../steplist/formLevel/profileErrors'
import type { FormWarning } from '../../steplist/formLevel/warnings'
import type { StepFormErrors } from '../../steplist/types'
import type { FormData, ProfileItem, StepFieldName } from '../../form-types'

export function getBlowoutLocationOptionsForForm(
  disposalLabwareOptions: Options,
  rawForm: ?FormData
): Options {
  if (!rawForm) {
    assert(rawForm, `getBlowoutLocationOptionsForForm expected a form`)
    return disposalLabwareOptions
  }
  const { stepType } = rawForm
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
    return [...disposalLabwareOptions, destOption]
  } else if (stepType === 'moveLiquid') {
    const path = rawForm.path
    switch (path) {
      case 'single': {
        return [...disposalLabwareOptions, sourceOption, destOption]
      }
      case 'multiDispense': {
        return [
          ...disposalLabwareOptions,
          sourceOption,
          { ...destOption, disabled: true },
        ]
      }
      case 'multiAspirate': {
        return [
          ...disposalLabwareOptions,
          { ...sourceOption, disabled: true },
          destOption,
        ]
      }
      default: {
        assert(
          false,
          `getBlowoutLocationOptionsForForm got unexpected path for moveLiquid step: ${path}`
        )
        return disposalLabwareOptions
      }
    }
  }
  return disposalLabwareOptions
}

// TODO: type fieldNames, don't use `string`
export const getDirtyFields = (
  isNewStep: boolean,
  formData: ?FormData
): Array<string> => {
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
      (acc, fieldName: StepFieldName) => {
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
  focusedField: ?string,
  dirtyFields: Array<string>,
  errors: StepFormErrors,
}): StepFormErrors => {
  const { focusedField, dirtyFields, errors } = args
  return errors.filter(error => {
    const dependentFieldsAreNotFocused = !error.dependentFields.includes(
      focusedField
    )
    const dependentFieldsAreDirty =
      difference(error.dependentFields, dirtyFields).length === 0

    return dependentFieldsAreNotFocused && dependentFieldsAreDirty
  })
}

export const getVisibleFormWarnings = (args: {
  focusedField: ?string,
  dirtyFields: Array<string>,
  errors: Array<FormWarning>,
}): Array<FormWarning> => {
  const { focusedField, dirtyFields, errors } = args
  return errors.filter(error => {
    const dependentFieldsAreNotFocused = !error.dependentFields.includes(
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
}: {|
  id: string,
  name: string,
|}): string => `${id}:${name}`

// NOTE: if any fields of a given name are pristine, treat all fields of that name as pristine.
// (Errors don't currently specify the id, so if we later want to only mask form-level errors
// for specific profile fields, the field's parent ProfileItem id needs to be included in the error)
export const getVisibleProfileFormLevelErrors = (args: {|
  focusedField: ?string,
  dirtyFields: Array<string>,
  errors: Array<ProfileFormError>,
  profileItemsById: { [itemId: string]: ProfileItem },
|}): Array<ProfileFormError> => {
  const { dirtyFields, focusedField, errors, profileItemsById } = args
  const profileItemIds = Object.keys(profileItemsById)

  return errors.filter(error => {
    return profileItemIds.every(itemId => {
      const item = profileItemsById[itemId]
      const steps = item.type === PROFILE_CYCLE ? item.steps : [item]
      return steps.every(step => {
        const fieldsForStep = error.dependentProfileFields.map(fieldName =>
          getDynamicFieldFocusHandlerId({ id: step.id, name: fieldName })
        )

        const dependentFieldsAreNotFocused = !fieldsForStep.includes(
          focusedField
        )

        const dependentProfileFieldsAreDirty =
          difference(fieldsForStep, dirtyFields).length === 0
        return dependentFieldsAreNotFocused && dependentProfileFieldsAreDirty
      })
    })
  })
}

// TODO(IL, 2021-02-25): DEPRECATED. this is only used by FieldConnector. Remove in #7298
export function getTooltipForField(
  stepType: ?string,
  name: string,
  disabled: boolean
): ?React.Node {
  if (!stepType) {
    console.error(
      `expected stepType for form, cannot getTooltipText for ${name}`
    )
    return null
  }

  const prefixes = ['aspirate_', 'dispense_']
  const nameWithoutPrefix = prefixes.some(prefix => name.startsWith(prefix))
    ? name.split('_').slice(1).join('_')
    : name

  // NOTE: this is a temporary solution until we want to be able to choose from
  // multiple tooltips for the same field depending on form state.
  // As-is, this will only let us show two tooltips for any given field per step type:
  // non-disabled tooltip copy, and disabled tooltip copy.
  const disabledKeys = disabled
    ? [
        `tooltip.step_fields.${stepType}.disabled.${name}`,
        `tooltip.step_fields.${stepType}.disabled.$generic`,
      ]
    : []

  // specificity cascade for names.
  // first level: "disabled" wins out if disabled arg is true
  // second level: prefix. "aspirate_foo" wins over "foo"
  const text: string = i18n.t([
    ...disabledKeys,
    `tooltip.step_fields.defaults.${name}`,
    `tooltip.step_fields.defaults.${nameWithoutPrefix}`,
    '',
  ])

  return text ? <div className={styles.tooltip}>{text}</div> : null
}

export const getFieldDefaultTooltip = (name: string): string =>
  i18n.t([`tooltip.step_fields.defaults.${name}`, ''])

export const getSingleSelectDisabledTooltip = (name: string, stepType: string): string =>
  i18n.t([
    `tooltip.step_fields.${stepType}.disabled.${name}`,
    `tooltip.step_fields.${stepType}.disabled.$generic`,
  ])
