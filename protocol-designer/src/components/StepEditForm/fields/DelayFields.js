// @flow
import * as React from 'react'
import { i18n } from '../../../localization'
import { TextField } from './TextField'
import { CheckboxRowField } from './CheckboxRowField'
import { TipPositionField } from './TipPositionField'
import styles from '../StepEditForm.css'
import type { FieldPropsByName } from '../types'
import type {
  DelayCheckboxFields,
  DelaySecondFields,
  TipOffsetFields,
  FormData,
} from '../../../form-types'

export type DelayFieldProps = {|
  checkboxFieldName: DelayCheckboxFields,
  formData: FormData,
  propsForFields: FieldPropsByName,
  secondsFieldName: DelaySecondFields,
  tipPositionFieldName?: TipOffsetFields,
|}

export const DelayFields = (props: DelayFieldProps): React.Node => {
  const {
    checkboxFieldName,
    secondsFieldName,
    tipPositionFieldName,
    propsForFields,
    formData,
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
        <TipPositionField
          {...propsForFields[tipPositionFieldName]}
          formData={formData}
        />
      )}
    </CheckboxRowField>
  )
}
