import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from './TextField'
import { CheckboxRowField } from './CheckboxRowField'
import { TipPositionField } from './TipPositionField'
import styles from '../StepEditForm.css'
import { FieldPropsByName } from '../types'
import { StepFieldName } from '../../../form-types'

export interface DelayFieldProps {
  checkboxFieldName: StepFieldName // TODO(IL, 2021-03-03): strictly, could be DelayCheckboxFields!
  labwareId?: string | null
  propsForFields: FieldPropsByName
  secondsFieldName: StepFieldName // TODO(IL, 2021-03-03): strictly, could be DelaySecondFields!
  tipPositionFieldName?: StepFieldName // TODO(IL, 2021-03-03): strictly, could be TipOffsetFields!
}

export const DelayFields = (props: DelayFieldProps): JSX.Element => {
  const {
    checkboxFieldName,
    secondsFieldName,
    tipPositionFieldName,
    propsForFields,
    labwareId,
  } = props
  const { t } = useTranslation(['form', 'application'])
  return (
    <CheckboxRowField
      {...propsForFields[checkboxFieldName]}
      label={t('step_edit_form.field.delay.label')}
      className={styles.small_field}
    >
      <TextField
        {...propsForFields[secondsFieldName]}
        className={styles.small_field}
        units={t('application:units.seconds')}
      />
      {tipPositionFieldName && (
        <TipPositionField
          {...propsForFields[tipPositionFieldName]}
          labwareId={labwareId}
        />
      )}
    </CheckboxRowField>
  )
}
