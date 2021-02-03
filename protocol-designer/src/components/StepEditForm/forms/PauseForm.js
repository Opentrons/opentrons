// @flow
import * as React from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import { selectors as uiModuleSelectors } from '../../../ui/modules'

import { FormGroup, HoverTooltip } from '@opentrons/components'
import { i18n } from '../../../localization'
import {
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_TEMP,
} from '../../../constants'
import {
  ConditionalOnField,
  TextField,
  RadioGroupField,
  StepFormDropdown,
} from '../fields'
import styles from '../StepEditForm.css'

import { useSingleEditFieldProps } from '../fields/useSingleEditFieldProps'

import type { StepFormProps } from '../types'

const PauseUntilTempTooltip = () => (
  <div>
    {i18n.t(`tooltip.step_fields.pauseAction.disabled.wait_until_temp`)}
  </div>
)

export const PauseForm = (props: StepFormProps): React.Node => {
  const moduleLabwareOptions = useSelector(
    uiModuleSelectors.getTemperatureLabwareOptions
  )

  const pauseUntilTempEnabled = useSelector(
    uiModuleSelectors.getTempModuleIsOnDeck
  )

  const propsForFields = useSingleEditFieldProps(props.focusHandlers)
  if (propsForFields == null) return null

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
          <ConditionalOnField
            name={'pauseAction'}
            condition={val => val === PAUSE_UNTIL_TIME}
          >
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
          </ConditionalOnField>

          <HoverTooltip
            placement="bottom"
            tooltipComponent={
              pauseUntilTempEnabled ? null : <PauseUntilTempTooltip />
            }
          >
            {hoverTooltipHandlers => (
              <div {...hoverTooltipHandlers}>
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
                <ConditionalOnField
                  name={'pauseAction'}
                  condition={val => val === PAUSE_UNTIL_TEMP}
                >
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
                </ConditionalOnField>
              </div>
            )}
          </HoverTooltip>
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
