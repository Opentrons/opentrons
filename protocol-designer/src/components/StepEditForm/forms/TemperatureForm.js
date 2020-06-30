// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { FormGroup } from '@opentrons/components'
import { selectors as uiModuleSelectors } from '../../../ui/modules'
import { i18n } from '../../../localization'

import {
  StepFormDropdown,
  RadioGroupField,
  ConditionalOnField,
  TextField,
} from '../fields'
import styles from '../StepEditForm.css'

import type { FocusHandlers } from '../types'

type TemperatureFormProps = { focusHandlers: FocusHandlers }

export const TemperatureForm = (
  props: TemperatureFormProps
): React.Element<'div'> => {
  const { focusHandlers } = props
  const moduleLabwareOptions = useSelector(
    uiModuleSelectors.getTemperatureLabwareOptions
  )
  const temperatureModuleId = useSelector(
    uiModuleSelectors.getSingleTemperatureModuleId
  )

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
            {...focusHandlers}
            name="moduleId"
            options={moduleLabwareOptions}
          />
        </FormGroup>
        {/* TODO (ka 2020-1-6):
          moduleID dropdown will autoselect when creating a new step,
          but this will not be the case when returning to a never saved form.
          Rather than defaulting to one or the other when null,
          display a message (copy, design, etc TBD) that you need to select a module to continue
        */}
        <ConditionalOnField name={'moduleId'} condition={val => val === null}>
          <p className={styles.select_module_message}>
            Please ensure a compatible module is present on the deck and
            selected to create a temperature step.
          </p>
        </ConditionalOnField>
        <ConditionalOnField
          name={'moduleId'}
          condition={val => val === temperatureModuleId && val != null}
        >
          <div className={styles.checkbox_row}>
            <RadioGroupField
              name="setTemperature"
              options={[
                {
                  name: i18n.t(
                    'form.step_edit_form.field.setTemperature.options.true'
                  ),
                  value: 'true',
                },
              ]}
              {...focusHandlers}
            />
            <ConditionalOnField
              name={'setTemperature'}
              condition={val => val === 'true'}
            >
              <TextField
                name="targetTemperature"
                className={styles.small_field}
                units={i18n.t('application.units.degrees')}
                {...focusHandlers}
              />
            </ConditionalOnField>
          </div>
          <div className={styles.checkbox_row}>
            <RadioGroupField
              name="setTemperature"
              options={[
                {
                  name: i18n.t(
                    'form.step_edit_form.field.setTemperature.options.false'
                  ),
                  value: 'false',
                },
              ]}
              {...focusHandlers}
            />
          </div>
        </ConditionalOnField>
      </div>
    </div>
  )
}
