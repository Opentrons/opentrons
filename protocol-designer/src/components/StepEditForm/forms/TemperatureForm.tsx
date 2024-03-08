import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { FormGroup } from '@opentrons/components'
import { selectors as uiModuleSelectors } from '../../../ui/modules'
import { StepFormDropdown, RadioGroupField, TextField } from '../fields'
import styles from '../StepEditForm.module.css'
import type { StepFormProps } from '../types'

<<<<<<< HEAD
import styles from '../StepEditForm.module.css'

export function TemperatureForm(props: StepFormProps): JSX.Element {
=======
export const TemperatureForm = (props: StepFormProps): JSX.Element => {
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  const { t } = useTranslation(['application', 'form'])
  const moduleLabwareOptions = useSelector(
    uiModuleSelectors.getTemperatureLabwareOptions
  )
  const temperatureModuleIds = useSelector(
    uiModuleSelectors.getTemperatureModuleIds
  )

  const { propsForFields } = props
  const { setTemperature, moduleId } = props.formData

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {t('stepType.temperature')}
        </span>
      </div>
      <div className={styles.temperature_section_wrapper}>
        <FormGroup
          label={t('form:step_edit_form.field.moduleActionLabware.label')}
          className={styles.temperature_form_group}
        >
          <StepFormDropdown
            {...propsForFields.moduleId}
            options={moduleLabwareOptions}
          />
        </FormGroup>
        {temperatureModuleIds != null
          ? temperatureModuleIds.map(id =>
              id === moduleId ? (
                <React.Fragment key={id}>
                  <div className={styles.checkbox_row}>
                    <RadioGroupField
                      {...propsForFields.setTemperature}
                      options={[
                        {
                          name: t(
                            'form:step_edit_form.field.setTemperature.options.true'
                          ),
                          value: 'true',
                        },
                      ]}
                    />
                    {setTemperature === 'true' && (
                      <TextField
                        {...propsForFields.targetTemperature}
                        className={styles.small_field}
                        units={t('units.degrees')}
                      />
                    )}
                  </div>
                  <div className={styles.checkbox_row}>
                    <RadioGroupField
                      {...propsForFields.setTemperature}
                      options={[
                        {
                          name: t(
                            'form:step_edit_form.field.setTemperature.options.false'
                          ),
                          value: 'false',
                        },
                      ]}
                    />
                  </div>
                </React.Fragment>
              ) : null
            )
          : null}
      </div>
    </div>
  )
}
