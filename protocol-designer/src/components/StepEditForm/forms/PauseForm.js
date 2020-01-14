// @flow
import * as React from 'react'
import { FormGroup } from '@opentrons/components'
import i18n from '../../../localization'

import { ConditionalOnField, TextField, RadioGroupField } from '../fields'
import { FieldConnector } from '../fields/FieldConnector'
import styles from '../StepEditForm.css'

import type { FocusHandlers } from '../types'

type PauseFormProps = { focusHandlers: FocusHandlers }
export const PauseForm = (props: PauseFormProps): React.Element<'div'> => {
  const { focusHandlers } = props

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
              name="pauseForAmountOfTime"
              options={[
                {
                  name: i18n.t(
                    'form.step_edit_form.field.pauseForAmountOfTime.options.false'
                  ),
                  value: 'false',
                },
              ]}
              {...focusHandlers}
            />
          </div>
          <div className={styles.checkbox_row}>
            <RadioGroupField
              name="pauseForAmountOfTime"
              options={[
                {
                  name: i18n.t(
                    'form.step_edit_form.field.pauseForAmountOfTime.options.true'
                  ),
                  value: 'true',
                },
              ]}
              {...focusHandlers}
            />
          </div>
          <ConditionalOnField
            name={'pauseForAmountOfTime'}
            condition={val => val === 'true'}
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
