// @flow
import * as React from 'react'
import {FormGroup} from '@opentrons/components'

import formStyles from '../../forms/forms.css'

import {TextField, RadioGroupField} from '../fields'
import type {FocusHandlers} from '../types'

type PauseFormProps = {focusHandlers: FocusHandlers}
function PauseForm (props: PauseFormProps): React.Element<'div'> {
  const {focusHandlers} = props
  return (
    <div className={formStyles.row_wrapper}>
      <div className={formStyles.column_1_2}>
        <RadioGroupField
          name="pauseForAmountOfTime"
          options={[{name: 'Pause for an amount of time', value: 'true'}]}
          {...focusHandlers} />
        <FormGroup className={formStyles.stacked_row}>
          <TextField units="hr" name="pauseHour" {...focusHandlers} />
        </FormGroup>
        <FormGroup className={formStyles.stacked_row}>
          <TextField units="m" name="pauseMinute" {...focusHandlers} />
        </FormGroup>
        <FormGroup className={formStyles.stacked_row}>
          <TextField units="s" name="pauseSecond" {...focusHandlers} />
        </FormGroup>
      </div>
      <div className={formStyles.column_1_2}>
        <RadioGroupField
          name="pauseForAmountOfTime"
          options={[{name: 'Pause until told to resume', value: 'false'}]}
          {...focusHandlers} />
        <FormGroup label='Message to display'>
          <TextField name="pauseMessage" {...focusHandlers} />
        </FormGroup>
      </div>
    </div>
  )
}

export default PauseForm
