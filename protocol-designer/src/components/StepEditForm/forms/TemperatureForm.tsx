import * as React from 'react'
import { useSelector } from 'react-redux'
import { selectors as uiModuleSelectors } from '../../../ui/modules'
import { FormGroup } from '@opentrons/components'
import { i18n } from '../../../localization'

import { StepFormDropdown, RadioGroupField, TextField } from '../fields'
import styles from '../StepEditForm.module.css'
import { StepFormProps } from '../types'

export const TemperatureForm = (props: StepFormProps): JSX.Element => {
  const moduleLabwareOptions = useSelector(
    uiModuleSelectors.getTemperatureLabwareOptions
  )
  const temperatureModuleId = useSelector(
    uiModuleSelectors.getSingleTemperatureModuleId
  )

  const { propsForFields } = props
  const { setTemperature, moduleId } = props.formData

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.temperature')}
        </span>
      </div>
      <div className={styles.temperature_section_wrapper}>
        <FormGroup
          label={i18n.t('form.step_edit_form.field.moduleActionLabware.label')}
          className={styles.temperature_form_group}
        >
          <StepFormDropdown
            {...propsForFields.moduleId}
            options={moduleLabwareOptions}
          />
        </FormGroup>
        {/* TODO (ka 2020-1-6):
          moduleID dropdown will autoselect when creating a new step,
          but this will not be the case when returning to a never saved form.
          Rather than defaulting to one or the other when null,
          display a message (copy, design, etc TBD) that you need to select a module to continue
        */}

        {moduleId === null && (
          <p className={styles.select_module_message}>
            Please ensure a compatible module is present on the deck and
            selected to create a temperature step.
          </p>
        )}
        {moduleId === temperatureModuleId && temperatureModuleId != null && (
          <>
            <div className={styles.checkbox_row}>
              <RadioGroupField
                {...propsForFields.setTemperature}
                options={[
                  {
                    name: i18n.t(
                      'form.step_edit_form.field.setTemperature.options.true'
                    ),
                    value: 'true',
                  },
                ]}
              />
              {setTemperature === 'true' && (
                <TextField
                  {...propsForFields.targetTemperature}
                  className={styles.small_field}
                  units={i18n.t('application.units.degrees')}
                />
              )}
            </div>
            <div className={styles.checkbox_row}>
              <RadioGroupField
                {...propsForFields.setTemperature}
                options={[
                  {
                    name: i18n.t(
                      'form.step_edit_form.field.setTemperature.options.false'
                    ),
                    value: 'false',
                  },
                ]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
