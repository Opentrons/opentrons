import * as React from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import { FormGroup } from '@opentrons/components'
import { i18n } from '../../../../localization'
import { getHeaterShakerLabwareOptions } from '../../../../ui/modules/selectors'
import {
  ToggleRowField,
  TextField,
  CheckboxRowField,
  StepFormDropdown,
} from '../../fields'
import styles from '../../StepEditForm.css'
import type { StepFormProps } from '../../types'

export const HeaterShakerForm = (props: StepFormProps): JSX.Element | null => {
  const moduleLabwareOptions = useSelector(getHeaterShakerLabwareOptions)
  const { propsForFields, formData } = props
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

      <div className={styles.form_row}>
        <FormGroup
          label={i18n.t(
            'form.step_edit_form.field.heaterShaker.temperature.setTemperature'
          )}
          className={styles.toggle_form_group}
        >
          <div className={styles.toggle_row}>
            <ToggleRowField
              {...propsForFields.setTemperature}
              offLabel={i18n.t(
                'form.step_edit_form.field.heaterShaker.temperature.toggleOff'
              )}
              onLabel={i18n.t(
                'form.step_edit_form.field.heakerShakerState.temperature.toggleOn'
              )}
            />
            {formData.setTemperature === true && (
              <TextField
                {...propsForFields.targetHeaterShakerTemperature}
                className={cx(
                  styles.small_field,
                  styles.toggle_temperature_field
                )}
                units={i18n.t('application.units.degrees')}
              />
            )}
          </div>
        </FormGroup>

        <FormGroup
          label={i18n.t(
            'form.step_edit_form.field.heaterShaker.shaker.setShake'
          )}
          className={styles.toggle_form_group}
        >
          <div className={styles.toggle_row}>
            <ToggleRowField
              {...propsForFields.setShake}
              offLabel={i18n.t(
                'form.step_edit_form.field.heaterShaker.shaker.toggleOff'
              )}
              onLabel={i18n.t(
                'form.step_edit_form.field.heaterShaker.shaker.toggleOn'
              )}
            />
            {formData.setShake === true && (
              <TextField
                {...propsForFields.targetSpeed}
                className={cx(
                  styles.small_field,
                  styles.toggle_temperature_field
                )}
                units={i18n.t('application.units.rpm')}
              />
            )}
          </div>
        </FormGroup>

        <FormGroup
          label={i18n.t(
            'form.step_edit_form.field.heaterShaker.latch.setLatch'
          )}
          className={styles.toggle_form_group}
        >
          <ToggleRowField
            {...propsForFields.latchOpen}
            offLabel={i18n.t(
              'form.step_edit_form.field.heaterShaker.latch.toggleOff'
            )}
            onLabel={i18n.t(
              'form.step_edit_form.field.heaterShaker.latch.toggleOn'
            )}
          />
        </FormGroup>
      </div>
      <CheckboxRowField
        {...propsForFields.heaterShakerSetTimer}
        label={i18n.t(
          'form.step_edit_form.field.heaterShaker.timer.heaterShakerSetTimer'
        )}
        className={styles.small_field}
      >
        <TextField
          {...propsForFields.heaterShakerTimerMinutes}
          className={styles.small_field}
          units={i18n.t('application.units.minutes')}
        />
        <TextField
          {...propsForFields.heaterShakerTimerSeconds}
          className={styles.small_field}
          units={i18n.t('application.units.seconds')}
        />
      </CheckboxRowField>
    </div>
  )
}
