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
import type { FormData } from '../../form-types'

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

export function getVisibleAlerts<
  Field,
  Alert: { dependentFields: Array<Field> }
>(args: {
  focusedField: ?Field,
  dirtyFields: Array<Field>,
  alerts: Array<Alert>,
}): Array<Alert> {
  const { focusedField, dirtyFields, alerts } = args
  return alerts.filter(
    alert =>
      !alert.dependentFields.includes(focusedField) &&
      difference(alert.dependentFields, dirtyFields).length === 0
  )
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
