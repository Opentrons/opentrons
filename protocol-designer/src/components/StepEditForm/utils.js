// @flow
import assert from 'assert'
import * as React from 'react'
import difference from 'lodash/difference'
import i18n from '../../localization'
import {
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '../../step-generation/utils'
import styles from './StepEditForm.css'
import type {Options} from '@opentrons/components'
import type {FormData} from '../../form-types'

export function getBlowoutLocationOptionsForForm (
  disposalLabwareOptions: Options,
  rawForm: ?FormData,
): Options {
  if (!rawForm) {
    assert(rawForm, `getBlowoutLocationOptionsForForm expected a form`)
    return disposalLabwareOptions
  }
  const {stepType} = rawForm
  const destOption = {name: 'Destination Well', value: DEST_WELL_BLOWOUT_DESTINATION}
  const sourceOption = {name: 'Source Well', value: SOURCE_WELL_BLOWOUT_DESTINATION}

  if (stepType === 'mix') {
    return [...disposalLabwareOptions, destOption]
  } else if (stepType === 'moveLiquid') {
    const path = rawForm.path
    switch (path) {
      case 'single': {
        return [...disposalLabwareOptions, sourceOption, destOption]
      }
      case 'multiDispense': {
        return [...disposalLabwareOptions, sourceOption, {...destOption, disabled: true}]
      }
      case 'multiAspirate': {
        return [...disposalLabwareOptions, {...sourceOption, disabled: true}, destOption]
      }
      default: {
        assert(false, `getBlowoutLocationOptionsForForm got unexpected path for moveLiquid step: ${path}`)
        return disposalLabwareOptions
      }
    }
  }
  return disposalLabwareOptions
}

export function getVisibleAlerts<Field, Alert: {dependentFields: Array<Field>}> (args: {
  focusedField: ?Field,
  dirtyFields: Array<Field>,
  alerts: Array<Alert>,
}): Array<Alert> {
  const {focusedField, dirtyFields, alerts} = args
  return alerts.filter(alert => (
    !alert.dependentFields.includes(focusedField) &&
    difference(alert.dependentFields, dirtyFields).length === 0)
  )
}

export function getTooltipForField (stepType: ?string, name: string): ?React.Node {
  if (!stepType) {
    console.error(`expected stepType for form, cannot getTooltipText for ${name}`)
    return null
  }

  const prefixes = ['aspirate_', 'dispense_']
  const nameWithoutPrefix = prefixes.some(prefix => name.startsWith(prefix))
    ? name.split('_').slice(1).join('_')
    : name

  // specificity cascade for names.
  // first level: try getting from step_fields.moveLiquid, fallback to step_fields.default
  // second level: prefix. "aspirate_foo" wins over "foo"
  const text: string = i18n.t([
    `tooltip.step_fields.${stepType}.${name}`,
    `tooltip.step_fields.${stepType}.${nameWithoutPrefix}`,
    `tooltip.step_fields.defaults.${name}`,
    `tooltip.step_fields.defaults.${nameWithoutPrefix}`,
    '',
  ])

  return text ? (<div className={styles.tooltip}>{text}</div>) : null
}
