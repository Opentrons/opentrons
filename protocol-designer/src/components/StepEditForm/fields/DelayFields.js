// @flow
import * as React from 'react'
import { i18n } from '../../../localization'
import { TextField } from './TextField'
import { CheckboxRowField } from './CheckboxRowField'
import { TipPositionField } from './TipPositionField'
import styles from '../StepEditForm.css'
import type { FieldPropsByName } from './makeSingleEditFieldProps'
import type {
  DelayCheckboxFields,
  DelaySecondFields,
  TipOffsetFields,
} from '../../../form-types'

export type DelayFieldProps = {|
  checkboxFieldName: DelayCheckboxFields,
  secondsFieldName: DelaySecondFields,
  tipPositionFieldName?: TipOffsetFields,
  propsForFields: FieldPropsByName,
|}

export const DelayFields = (props: DelayFieldProps): React.Node => {
  const {
    checkboxFieldName,
    secondsFieldName,
    tipPositionFieldName,
    propsForFields,
  } = props

  return (
    <CheckboxRowField
      {...propsForFields[checkboxFieldName]}
      label={i18n.t('form.step_edit_form.field.delay.label')}
      className={styles.small_field}
      tooltipContent={i18n.t(
        `tooltip.step_fields.defaults.${checkboxFieldName}`
      )}
    >
      <TextField
        {...propsForFields[secondsFieldName]}
        className={styles.small_field}
        units={i18n.t('application.units.seconds')}
      />
      {tipPositionFieldName && (
        <TipPositionField fieldName={tipPositionFieldName} />
      )}
    </CheckboxRowField>
  )
}
