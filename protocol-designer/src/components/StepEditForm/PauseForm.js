// @flow
import * as React from 'react'
import {FormGroup, InputField, RadioGroup} from '@opentrons/components'

import type {PauseForm as PauseFormData} from '../../form-types'
import type {FormConnector} from '../../utils'
import formStyles from '../forms.css'

type PauseFormProps = {formData: PauseFormData, formConnector: FormConnector<*>}
const PauseForm = ({formData, formConnector}: PauseFormProps) => (
  <div className={formStyles.row_wrapper}>
    <div className={formStyles.column_1_2}>
      <RadioGroup options={[{name: 'Pause for an amount of time', value: 'true'}]}
        {...formConnector('pause-for-amount-of-time')} />
      <InputField units='hr' {...formConnector('pause-hour')} />
      <InputField units='m' {...formConnector('pause-minute')} />
      <InputField units='s' {...formConnector('pause-second')} />
    </div>
    <div className={formStyles.column_1_2}>
      <RadioGroup options={[{name: 'Pause until told to resume', value: 'false'}]}
        {...formConnector('pause-for-amount-of-time')} />
      <FormGroup label='Message to display'>
        <InputField {...formConnector('pause-message')} />
      </FormGroup>
    </div>
  </div>
)

export default PauseForm
