// @flow
import * as React from 'react'
import {FormGroup} from '@opentrons/components'

import {
  StepInputField,
  StepRadioGroup
} from './formFields'
import type {FocusHandlers} from './index'
import formStyles from '../forms.css'

type PauseFormProps = {focusHandlers: FocusHandlers}
function PauseForm (props: PauseFormProps) {
  const {focusHandlers} = props
  return (
    <div className={formStyles.row_wrapper}>
      <div className={formStyles.column_1_2}>
        <StepRadioGroup
          name="pause-for-amount-of-time"
          options={[{name: 'Pause for an amount of time', value: 'true'}]}
          {...focusHandlers} />
        <StepInputField units="hr" name="pause-hour" {...focusHandlers} />
        <StepInputField units="m" name="pause-minute" {...focusHandlers} />
        <StepInputField units="s" name="pause-second" {...focusHandlers} />
      </div>
      <div className={formStyles.column_1_2}>
        <StepRadioGroup
          name="pause-for-amount-of-time"
          options={[{name: 'Pause until told to resume', value: 'false'}]}
          {...focusHandlers} />
        <FormGroup label='Message to display'>
          <StepInputField name="pause-message" {...focusHandlers} />
        </FormGroup>
      </div>
    </div>
  )
}

export default PauseForm
