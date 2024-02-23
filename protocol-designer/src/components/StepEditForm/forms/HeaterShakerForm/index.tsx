import * as React from 'react'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  FormGroup,
  Flex,
  SPACING,
  useHoverTooltip,
  Tooltip,
  TOOLTIP_BOTTOM,
} from '@opentrons/components'
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
  const [targetLatchProps, tooltipLatchProps] = useHoverTooltip({
    placement: TOOLTIP_BOTTOM,
  })
  const { t } = useTranslation(['application', 'form'])
  const { propsForFields, formData } = props

  return (
    <div>
      <span className={styles.section_header_text}>
        {t('stepType.heaterShaker')}
      </span>
      <FormGroup
        label={t('form:step_edit_form.field.moduleActionLabware.label')}
        className={styles.temperature_form_group}
      >
        <StepFormDropdown
          options={moduleLabwareOptions}
          {...propsForFields.moduleId}
        />
      </FormGroup>

      <div className={styles.form_row}>
        <FormGroup
          label={t(
            'form:step_edit_form.field.heaterShaker.temperature.setTemperature'
          )}
          className={styles.toggle_form_group}
        >
          <div className={styles.toggle_row}>
            <ToggleRowField
              {...propsForFields.setHeaterShakerTemperature}
              offLabel={t(
                'form:step_edit_form.field.heaterShaker.temperature.toggleOff'
              )}
              onLabel={t(
                'form:step_edit_form.field.heaterShaker.temperature.toggleOn'
              )}
            />
            {formData.setHeaterShakerTemperature === true && (
              <TextField
                {...propsForFields.targetHeaterShakerTemperature}
                className={cx(
                  styles.small_field,
                  styles.toggle_temperature_field
                )}
                units={t('units.degrees')}
              />
            )}
          </div>
        </FormGroup>

        <FormGroup
          label={t('form:step_edit_form.field.heaterShaker.shaker.setShake')}
          className={styles.toggle_form_group}
        >
          <div className={styles.toggle_row}>
            <ToggleRowField
              {...propsForFields.setShake}
              offLabel={t(
                'form:step_edit_form.field.heaterShaker.shaker.toggleOff'
              )}
              onLabel={t(
                'form:step_edit_form.field.heaterShaker.shaker.toggleOn'
              )}
            />
            {formData.setShake === true && (
              <TextField
                {...propsForFields.targetSpeed}
                className={cx(
                  styles.small_field,
                  styles.toggle_temperature_field
                )}
                units={t('units.rpm')}
              />
            )}
          </div>
        </FormGroup>
        <Flex {...targetLatchProps}>
          <FormGroup
            label={t('form:step_edit_form.field.heaterShaker.latch.setLatch')}
            className={styles.set_plate_latch_form_group}
          >
            <ToggleRowField
              {...propsForFields.latchOpen}
              offLabel={t(
                'form:step_edit_form.field.heaterShaker.latch.toggleOff'
              )}
              onLabel={t(
                'form:step_edit_form.field.heaterShaker.latch.toggleOn'
              )}
            />
          </FormGroup>
        </Flex>
      </div>
      <Flex paddingBottom="8.4rem">
        <Flex width={SPACING.spacing20}>
          <CheckboxRowField
            tooltipPlacement={TOOLTIP_BOTTOM}
            {...propsForFields.heaterShakerSetTimer}
            className={styles.small_field}
            label={t(
              'form:step_edit_form.field.heaterShaker.timer.heaterShakerSetTimer'
            )}
          >
            <TextField
              {...propsForFields.heaterShakerTimerMinutes}
              className={styles.small_field}
              units={t('units.minutes')}
            />
            <TextField
              {...propsForFields.heaterShakerTimerSeconds}
              className={styles.small_field}
              units={t('units.seconds')}
            />
          </CheckboxRowField>
        </Flex>
        {propsForFields.latchOpen.disabled && (
          <Tooltip {...tooltipLatchProps}>
            {propsForFields.latchOpen.tooltipContent}
          </Tooltip>
        )}
      </Flex>
    </div>
  )
}
