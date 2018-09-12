// @flow
import * as React from 'react'
import {FormGroup} from '@opentrons/components'

import {
  StepInputField,
  StepRadioGroup,
} from './formFields'
import type {FocusHandlers} from './index'
import formStyles from '../forms.css'

type PauseFormProps = {focusHandlers: FocusHandlers}
function PauseForm (props: PauseFormProps): React.Element<'div'> {
  const {focusHandlers} = props
  return (
    <div className={formStyles.row_wrapper}>
      <div className={formStyles.column_1_2}>
        <StepRadioGroup
          name="pauseForAmountOfTime"
          options={[{name: 'Pause for an amount of time', value: 'true'}]}
          {...focusHandlers} />
        <StepInputField units="hr" name="pauseHour" {...focusHandlers} />
        <StepInputField units="m" name="pauseMinute" {...focusHandlers} />
        <StepInputField units="s" name="pauseSecond" {...focusHandlers} />
      </div>
      <div className={formStyles.column_1_2}>
        <StepRadioGroup
          name="pauseForAmountOfTime"
          options={[{name: 'Pause until told to resume', value: 'false'}]}
          {...focusHandlers} />
        <FormGroup label='Message to display'>
          <StepInputField name="pauseMessage" {...focusHandlers} />
        </FormGroup>
      </div>
    </div>
  )
}

export default PauseForm
