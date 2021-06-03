// @flow
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
import { i18n } from '../../../localization'
import {
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_TEMP,
} from '../../../constants'
import { TextField, RadioGroupField, StepFormDropdown } from '../fields'
import { getSingleSelectDisabledTooltip } from '../utils'
import styles from '../StepEditForm.css'

import type { StepFormProps } from '../types'

export const PauseForm = (props: StepFormProps): React.Node => {
  const moduleLabwareOptions = useSelector(
    uiModuleSelectors.getTemperatureLabwareOptions
  )

  const pauseUntilTempEnabled = useSelector(
    uiModuleSelectors.getTempModuleIsOnDeck
  )

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
          {i18n.t('application.stepType.pause')}
        </span>
      </div>

      <div className={styles.section_wrapper}>
        <div className={styles.section_column}>
          <div className={styles.checkbox_row}>
            <RadioGroupField
              {...propsForFields['pauseAction']}
              options={[
                {
                  name: i18n.t(
                    'form.step_edit_form.field.pauseAction.options.untilResume'
                  ),
                  value: PAUSE_UNTIL_RESUME,
                },
              ]}
            />
          </div>
          <div className={styles.checkbox_row}>
            <RadioGroupField
              {...propsForFields['pauseAction']}
              options={[
                {
                  name: i18n.t(
                    'form.step_edit_form.field.pauseAction.options.untilTime'
                  ),
                  value: PAUSE_UNTIL_TIME,
                },
              ]}
            />
          </div>
          {pauseAction === PAUSE_UNTIL_TIME && (
            <div className={styles.form_row}>
              <TextField
                {...propsForFields['pauseHour']}
                className={styles.small_field}
                units={i18n.t('application.units.hours')}
              />
              <TextField
                {...propsForFields['pauseMinute']}
                className={styles.small_field}
                units={i18n.t('application.units.minutes')}
              />
              <TextField
                {...propsForFields['pauseSecond']}
                className={styles.small_field}
                units={i18n.t('application.units.seconds')}
              />
            </div>
          )}

          {pauseUntilTempEnabled ? null : (
            <Tooltip {...tooltipProps}>
              {getSingleSelectDisabledTooltip('wait_until_temp', 'pauseAction')}
            </Tooltip>
          )}
          <div {...targetProps}>
            <div className={styles.checkbox_row}>
              <RadioGroupField
                {...propsForFields['pauseAction']}
                className={cx({
                  [styles.disabled]: !pauseUntilTempEnabled,
                })}
                options={[
                  {
                    name: i18n.t(
                      'form.step_edit_form.field.pauseAction.options.untilTemperature'
                    ),
                    value: PAUSE_UNTIL_TEMP,
                  },
                ]}
              />
            </div>
            {pauseAction === PAUSE_UNTIL_TEMP && (
              <div className={styles.form_row}>
                <FormGroup
                  label={i18n.t(
                    'form.step_edit_form.field.moduleActionLabware.label'
                  )}
                >
                  <StepFormDropdown
                    {...propsForFields['moduleId']}
                    options={moduleLabwareOptions}
                  />
                </FormGroup>
                <FormGroup
                  label={i18n.t(
                    'form.step_edit_form.field.pauseTemperature.label'
                  )}
                >
                  <TextField
                    {...propsForFields['pauseTemperature']}
                    className={styles.small_field}
                    units={i18n.t('application.units.degrees')}
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
              label={i18n.t('form.step_edit_form.field.pauseMessage.label')}
            >
              <textarea
                className={styles.textarea_field}
                value={propsForFields['pauseMessage'].value}
                onChange={(e: SyntheticInputEvent<*>) =>
                  propsForFields['pauseMessage'].updateValue(
                    e.currentTarget.value
                  )
                }
              />
            </FormGroup>
          </div>
        </div>
      </div>
    </div>
  )
}
