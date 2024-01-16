import * as React from 'react'
import { FormGroup, DropdownField } from '@opentrons/components'
import { selectors as stepFormSelectors } from '../../../step-forms'
import styles from '../StepEditForm.css'
import { FieldProps } from '../types'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

export const PipetteField = (props: FieldProps): JSX.Element => {
  const { onFieldBlur, onFieldFocus, updateValue, value } = props
  const pipetteOptions = useSelector(
    stepFormSelectors.getEquippedPipetteOptions
  )

  const { t } = useTranslation('form')
  return (
    <FormGroup
      label={t('step_edit_form.field.pipette.label')}
      className={styles.large_field}
    >
      <DropdownField
        options={pipetteOptions}
        name={props.name}
        value={value ? String(value) : null}
        onBlur={onFieldBlur}
        onFocus={onFieldFocus}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          updateValue(e.currentTarget.value)
        }}
      />
    </FormGroup>
  )
}
