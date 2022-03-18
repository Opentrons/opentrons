import { FormGroup } from '@opentrons/components'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { i18n } from '../../../../localization'
import { getHeaterShakerLabwareOptions } from '../../../../ui/modules/selectors'
import { RadioGroupField, StepFormDropdown, TextField } from '../../fields'
import styles from '../../StepEditForm.css'
import type { StepFormProps } from '../../types'
import { StateFields } from './StateFields'

export const HeaterShakerForm = (props: StepFormProps): JSX.Element | null => {
  const moduleLabwareOptions = useSelector(getHeaterShakerLabwareOptions)
  const { propsForFields } = props
  const { moduleId, setTemperature } = props.formData
  return (
    <div>
      <span className={styles.section_header_text}>
        {i18n.t('application.stepType.heaterShaker')}
      </span>
      <FormGroup
        label={i18n.t('form.step_edit_form.field.moduleActionLabware.label')}
        className={styles.temperature_form_group}
      >
        <StepFormDropdown
          options={moduleLabwareOptions}
          {...propsForFields.moduleId}
        />
      </FormGroup>

          <StateFields propsForFields={propsForFields} formData={props.formData} />

    </div>
  )
}
