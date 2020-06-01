// @flow
import assert from 'assert'
import * as React from 'react'
import difference from 'lodash/difference'
import { i18n } from '../../localization'
import {
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '../../step-generation/utils'
import styles from './StepEditForm.css'
import type { Options } from '@opentrons/components'
import type { ProfileFormError } from '../../steplist/formLevel/profileErrors'
import type { FormWarning } from '../../steplist/formLevel/warnings'
import type { StepFormErrors } from '../../steplist/types'
import type { FormData, ProfileItem } from '../../form-types'

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
|}) => `${id}:${name}`

export const getVisibleProfileErrors = (args: {|
  focusedField: ?string,
  dirtyFields: Array<string>,
  errors: Array<ProfileFormError>,
  profileItemsById: { [itemId: string]: ProfileItem },
|}): Array<ProfileFormError> => {
  const { dirtyFields, focusedField, errors, profileItemsById } = args
  const profileIds = Object.keys(profileItemsById)

  return errors.filter(error => {
    return profileIds.every(itemId => {
      const fieldsForItem = error.dependentProfileFields.map(
        fieldName => `${itemId}:${fieldName}` // TODO IMMEDIATELY import util for "hashing" the name + id
      )

      const dependentFieldsAreNotFocused = !fieldsForItem.includes(focusedField)

      const dependentProfileFieldsAreDirty =
        difference(fieldsForItem, dirtyFields).length === 0

      return dependentFieldsAreNotFocused && dependentProfileFieldsAreDirty
    })
  })
}

// NOTE: some field components get their tooltips directly from i18n, and do not use `getTooltipForField`.
// TODO: Ian 2019-03-29 implement tooltip-content-getting in a more organized way
// once we have more comprehensive requirements about tooltips
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
    ? name
        .split('_')
        .slice(1)
        .join('_')
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
