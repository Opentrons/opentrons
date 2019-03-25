// @flow
import * as React from 'react'
import {FormGroup} from '@opentrons/components'
import i18n from '../../../localization'

import {ConditionalOnField, TextField, RadioGroupField} from '../fields'
import StepField from '../fields/FieldConnector'
import styles from '../StepEditForm.css'

import type {FocusHandlers} from '../types'

type PauseFormProps = {focusHandlers: FocusHandlers}
function PauseForm (props: PauseFormProps): React.Element<'div'> {
  const {focusHandlers} = props
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
              options={[{name: 'Pause until told to resume', value: 'false'}]}
              {...focusHandlers} />
          </div>
          <div className={styles.checkbox_row}>
            <RadioGroupField
              name="pauseForAmountOfTime"
              options={[{name: 'Delay for an amount of time', value: 'true'}]}
              {...focusHandlers} />
          </div>
          <ConditionalOnField name={'pauseForAmountOfTime'} condition={(val) => val === 'true'}>
            <div className={styles.form_row}>
              <TextField {...focusHandlers} className={styles.small_field}
                units="hr" name="pauseHour" />
              <TextField {...focusHandlers} className={styles.small_field}
                units="m" name="pauseMinute" />
              <TextField {...focusHandlers} className={styles.small_field}
                units="s" name="pauseSecond" />
            </div>
          </ConditionalOnField>
        </div>
        <div className={styles.section_column}>
          <div className={styles.form_row}>
            {/* TODO: Ian 2019-03-25 consider making this a component eg `TextAreaField.js` if used anywhere else */}
            <StepField {...focusHandlers} name='pauseMessage' render={({value, updateValue}) => (
              <FormGroup label='Message to display' className={styles.full_width_field}>
                <textarea
                  className={styles.textarea_field}
                  value={value}
                  onChange={(e: SyntheticInputEvent<*>) => updateValue(e.currentTarget.value)} />
              </FormGroup>)
            }/>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PauseForm
