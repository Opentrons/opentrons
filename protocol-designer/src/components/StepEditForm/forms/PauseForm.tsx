import * as React from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import { selectors as uiModuleSelectors } from '../../../ui/modules'

import {
  FormGroup,
  useHoverTooltip,
  Tooltip,
  TOOLTIP_BOTTOM,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import {
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_TEMP,
} from '../../../constants'
import { TextField, RadioGroupField, StepFormDropdown } from '../fields'
import { getSingleSelectDisabledTooltip } from '../utils'
import styles from '../StepEditForm.css'

import { StepFormProps } from '../types'
import { useTranslation } from 'react-i18next'

export const PauseForm = (props: StepFormProps): JSX.Element => {
  const tempModuleLabwareOptions = useSelector(
    uiModuleSelectors.getTemperatureLabwareOptions
  )
  const { t } = useTranslation(['tooltip', 'application', 'form'])

  const heaterShakerModuleLabwareOptions = useSelector(
    uiModuleSelectors.getHeaterShakerLabwareOptions
  )

  const moduleLabwareOptions = [
    ...tempModuleLabwareOptions,
    ...heaterShakerModuleLabwareOptions,
  ]

  const pauseUntilTempEnabled = useSelector(
    uiModuleSelectors.getTempModuleIsOnDeck
  )

  const pauseUntilHeaterShakerEnabled = useSelector(
    uiModuleSelectors.getHeaterShakerModuleIsOnDeck
  )

  const pauseUntilModuleEnabled =
    pauseUntilTempEnabled || pauseUntilHeaterShakerEnabled

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_BOTTOM,
    strategy: TOOLTIP_FIXED,
  })

  const { propsForFields } = props
  const { pauseAction } = props.formData

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {t('application:stepType.pause')}
        </span>
      </div>

      <div className={styles.section_wrapper}>
        <div className={styles.section_column}>
          <div className={styles.checkbox_row}>
            <RadioGroupField
              {...propsForFields.pauseAction}
              options={[
                {
                  name: t(
                    'form:step_edit_form.field.pauseAction.options.untilResume'
                  ),
                  value: PAUSE_UNTIL_RESUME,
                },
              ]}
            />
          </div>
          <div className={styles.checkbox_row}>
            <RadioGroupField
              {...propsForFields.pauseAction}
              options={[
                {
                  name: t(
                    'form:step_edit_form.field.pauseAction.options.untilTime'
                  ),
                  value: PAUSE_UNTIL_TIME,
                },
              ]}
            />
          </div>
          {pauseAction === PAUSE_UNTIL_TIME && (
            <div className={styles.form_row}>
              <TextField
                {...propsForFields.pauseHour}
                className={styles.small_field}
                units={t('application:units.hours')}
              />
              <TextField
                {...propsForFields.pauseMinute}
                className={styles.small_field}
                units={t('application:units.minutes')}
              />
              <TextField
                {...propsForFields.pauseSecond}
                className={styles.small_field}
                units={t('application:units.seconds')}
              />
            </div>
          )}

          {pauseUntilModuleEnabled ? null : (
            <Tooltip {...tooltipProps}>
              {getSingleSelectDisabledTooltip('wait_until_temp', 'pauseAction', t)}
            </Tooltip>
          )}
          <div {...targetProps}>
            <div className={styles.checkbox_row}>
              <RadioGroupField
                {...propsForFields.pauseAction}
                className={cx({
                  [styles.disabled]: !pauseUntilModuleEnabled,
                })}
                options={[
                  {
                    name: t(
                      'form:step_edit_form.field.pauseAction.options.untilTemperature'
                    ),
                    value: PAUSE_UNTIL_TEMP,
                  },
                ]}
              />
            </div>
            {pauseAction === PAUSE_UNTIL_TEMP && (
              <div className={styles.form_row}>
                <FormGroup
                  label={t(
                    'form:step_edit_form.field.moduleActionLabware.label'
                  )}
                >
                  <StepFormDropdown
                    {...propsForFields.moduleId}
                    options={moduleLabwareOptions}
                  />
                </FormGroup>
                <FormGroup
                  label={t('form:step_edit_form.field.pauseTemperature.label')}
                >
                  <TextField
                    {...propsForFields.pauseTemperature}
                    className={styles.small_field}
                    units={t('application:units.degrees')}
                  />
                </FormGroup>
              </div>
            )}
          </div>
        </div>
        <div className={styles.section_column}>
          <div className={styles.form_row}>
            {/* TODO: Ian 2019-03-25 consider making this a component eg `TextAreaField.js` if used anywhere else */}
            <FormGroup
              className={styles.full_width_field}
              label={t('form:step_edit_form.field.pauseMessage.label')}
            >
              <textarea
                className={styles.textarea_field}
                value={propsForFields.pauseMessage.value as string}
                onChange={(e: React.ChangeEvent<any>) =>
                  propsForFields.pauseMessage.updateValue(e.currentTarget.value)
                }
              />
            </FormGroup>
          </div>
        </div>
      </div>
    </div>
  )
}
