import { i18n } from '../../../localization'
import styles from '../StepEditForm.css'
import { FieldPropsByName } from '../types'
import { CheckboxRowField, TextField } from './'
import * as React from 'react'

export const MixFields = (props: {
  propsForFields: FieldPropsByName
  checkboxFieldName: string
  volumeFieldName: string
  timesFieldName: string
}): JSX.Element => {
  const {
    propsForFields,
    checkboxFieldName,
    volumeFieldName,
    timesFieldName,
  } = props

  return (
    <CheckboxRowField
      {...propsForFields[checkboxFieldName]}
      label={i18n.t('form.step_edit_form.field.mix.label')}
      className={styles.small_field}
    >
      <TextField
        {...propsForFields[volumeFieldName]}
        className={styles.small_field}
        units={i18n.t('application.units.microliter')}
      />
      <TextField
        {...propsForFields[timesFieldName]}
        className={styles.small_field}
        units={i18n.t('application.units.times')}
      />
    </CheckboxRowField>
  )
}
