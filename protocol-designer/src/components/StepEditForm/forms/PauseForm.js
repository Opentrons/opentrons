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
import { FieldConnector } from '../fields/FieldConnector'
import styles from '../StepEditForm.css'

import type { FocusHandlers } from '../types'

type PauseFormProps = { focusHandlers: FocusHandlers }

export const PauseForm = (props: PauseFormProps): React.Element<'div'> => {
  const { focusHandlers } = props

  const moduleLabwareOptions = useSelector(
    uiModuleSelectors.getTemperatureLabwareOptions
  )

  const pauseUntilTempEnabled = useSelector(
    uiModuleSelectors.getTempModuleOrThermocyclerIsOnDeck
  )

  const pauseUntilTempTooltip = (
    <div>
      {i18n.t(`tooltip.step_fields.pauseAction.disabled.wait_until_temp`)}
    </div>
  )

  // time fields blur together
  const blurAllTimeUnitFields = () => {
    ;['pauseHour', 'pauseMinute', 'pauseSecond'].forEach(timeUnitFieldName =>
      props.focusHandlers.onFieldBlur(timeUnitFieldName)
    )
  }

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
              name="pauseAction"
              options={[
                {
                  name: i18n.t(
                    'form.step_edit_form.field.pauseAction.options.untilResume'
                  ),
                  value: PAUSE_UNTIL_RESUME,
                },
              ]}
              {...focusHandlers}
            />
          </div>
          <div className={styles.checkbox_row}>
            <RadioGroupField
              name="pauseAction"
              options={[
                {
                  name: i18n.t(
                    'form.step_edit_form.field.pauseAction.options.untilTime'
                  ),
                  value: PAUSE_UNTIL_TIME,
                },
              ]}
              {...focusHandlers}
            />
          </div>
          <ConditionalOnField
            name={'pauseAction'}
            condition={val => val === PAUSE_UNTIL_TIME}
          >
            <div className={styles.form_row}>
              <TextField
                {...focusHandlers}
                onFieldBlur={blurAllTimeUnitFields}
                className={styles.small_field}
                units={i18n.t('application.units.hours')}
                name="pauseHour"
              />
              <TextField
                {...focusHandlers}
                onFieldBlur={blurAllTimeUnitFields}
                className={styles.small_field}
                units={i18n.t('application.units.minutes')}
                name="pauseMinute"
              />
              <TextField
                {...focusHandlers}
                onFieldBlur={blurAllTimeUnitFields}
                className={styles.small_field}
                units={i18n.t('application.units.seconds')}
                name="pauseSecond"
              />
            </div>
          </ConditionalOnField>

          <HoverTooltip
            placement="bottom"
            tooltipComponent={
              pauseUntilTempEnabled ? null : pauseUntilTempTooltip
            }
          >
            {hoverTooltipHandlers => (
              <div {...hoverTooltipHandlers}>
                <div className={styles.checkbox_row}>
                  <RadioGroupField
                    className={cx({
                      [styles.disabled]: !pauseUntilTempEnabled,
                    })}
                    name="pauseAction"
                    options={[
                      {
                        name: i18n.t(
                          'form.step_edit_form.field.pauseAction.options.untilTemperature'
                        ),
                        value: PAUSE_UNTIL_TEMP,
                      },
                    ]}
                    {...focusHandlers}
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
                        {...focusHandlers}
                        name="moduleId"
                        options={moduleLabwareOptions}
                      />
                    </FormGroup>
                    <FormGroup
                      label={i18n.t(
                        'form.step_edit_form.field.pauseTemperature.label'
                      )}
                    >
                      <TextField
                        name="pauseTemperature"
                        className={styles.small_field}
                        units={i18n.t('application.units.degrees')}
                        {...focusHandlers}
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
            <FieldConnector
              dirtyFields={focusHandlers.dirtyFields}
              focusedField={focusHandlers.focusedField}
              name="pauseMessage"
              render={({ value, updateValue }) => (
                <FormGroup
                  className={styles.full_width_field}
                  label={i18n.t('form.step_edit_form.field.pauseMessage.label')}
                >
                  <textarea
                    className={styles.textarea_field}
                    value={value}
                    onChange={(e: SyntheticInputEvent<*>) =>
                      updateValue(e.currentTarget.value)
                    }
                  />
                </FormGroup>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
