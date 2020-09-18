// @flow
import * as React from 'react'
import { i18n } from '../../../localization'
import { TextField, CheckboxRowField, TipPositionField } from '.'

import styles from '../StepEditForm.css'

import type { FocusHandlers } from '../types'
import type {
  DelayCheckboxFields,
  DelaySecondFields,
  TipOffsetFields,
} from '../../../form-types'

type DelayFieldProps = {
  checkboxFieldName: DelayCheckboxFields,
  secondsFieldName: DelaySecondFields,
  tipPositionFieldName: TipOffsetFields,
  focusHandlers: FocusHandlers,
}

export const DelayFields = (props: DelayFieldProps): React.Node => {
  const {
    checkboxFieldName,
    secondsFieldName,
    tipPositionFieldName,
    focusHandlers,
  } = props
  return (
    <CheckboxRowField
      name={checkboxFieldName}
      label={i18n.t('form.step_edit_form.field.delay.label')}
      className={styles.small_field}
      tooltipComponent={i18n.t(
        `tooltip.step_fields.defaults.${checkboxFieldName}`
      )}
    >
      <TextField
        name={secondsFieldName}
        units={i18n.t('application.units.seconds')}
        className={styles.small_field}
        {...focusHandlers}
      />
      <TipPositionField fieldName={tipPositionFieldName} />
    </CheckboxRowField>
  )
}
