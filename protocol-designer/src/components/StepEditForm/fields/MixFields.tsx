import { useTranslation } from 'react-i18next'
import { CheckboxRowField, TextField } from './'
import styles from '../StepEditForm.module.css'
import type { FieldPropsByName } from '../types'

export const MixFields = (props: {
  propsForFields: FieldPropsByName
  checkboxFieldName: string
  volumeFieldName: string
  timesFieldName: string
}): JSX.Element => {
  const { t } = useTranslation(['form', 'application'])
  const {
    propsForFields,
    checkboxFieldName,
    volumeFieldName,
    timesFieldName,
  } = props

  return (
    <CheckboxRowField
      {...propsForFields[checkboxFieldName]}
      label={t('step_edit_form.field.mix.label')}
      className={styles.small_field}
    >
      <TextField
        {...propsForFields[volumeFieldName]}
        className={styles.small_field}
        units={t('application:units.microliter')}
      />
      <TextField
        {...propsForFields[timesFieldName]}
        className={styles.small_field}
        units={t('application:units.times')}
      />
    </CheckboxRowField>
  )
}
