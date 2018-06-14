// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  FlatButton,
  PrimaryButton,
  FormGroup,
  DropdownField,
  InputField,
  RadioGroup,
  type DropdownOption
} from '@opentrons/components'

import {
  // CheckboxRow,
  // DelayField,
  FlowRateField,
  // MixField,
  TipPositionField
} from './formFields'

import MixForm from './MixForm'
import TransferLikeForm from './TransferLikeForm'
// import WellSelectionInput from '../../containers/WellSelectionInput'
// import FormSection from './FormSection'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import type {FormSectionNames, FormSectionState} from '../../steplist/types' // TODO import from index.js
import type {FormData} from '../../form-types'

import {formConnectorFactory} from '../../utils'

type Options = Array<DropdownOption>

export type Props = {
  // ingredientOptions: Options,
  pipetteOptions: Options,
  labwareOptions: Options,
  formSectionCollapse: FormSectionState,
  onCancel: (event: SyntheticEvent<>) => mixed,
  onSave: (event: SyntheticEvent<>) => mixed,
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onToggleFormSection: (section: FormSectionNames) => mixed => mixed, // ???
  handleChange: (accessor: string) => (event: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => void,
  openWellSelectionModal: (args: {labwareId: string, pipetteId: string}) => mixed,
  formData: FormData, // TODO: make sure flow will give clear warning if you put transfer field in pause form, etc
  canSave: boolean
  /* TODO Ian 2018-01-24 **type** the different forms for different stepTypes,
    this obj reflects the form selector's return values */
}

export default function StepEditForm (props: Props) {
  const {formData} = props
  const formConnector = formConnectorFactory(props.handleChange, formData)

  const buttonRow = <div className={styles.button_row}>
    <FlatButton className={styles.more_options_button} onClick={props.onClickMoreOptions}>
      MORE OPTIONS
    </FlatButton>
    <PrimaryButton className={styles.cancel_button} onClick={props.onCancel}>CANCEL</PrimaryButton>
    <PrimaryButton disabled={!props.canSave} onClick={props.onSave}>SAVE</PrimaryButton>
  </div>

  if (formData.stepType === 'mix') {
    return (
      <div className={formStyles.form}>
        <MixForm formData={formData} formConnector={formConnector} />
        {buttonRow}
      </div>
    )
  }

  if (formData.stepType === 'pause') {
    return (
      <div className={formStyles.form}>
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
        {buttonRow}
      </div>
    )
  }

  if (formData.stepType === 'transfer' ||
    formData.stepType === 'consolidate' ||
    formData.stepType === 'distribute'
  ) {
    return (
      <div className={cx(formStyles.form, styles[formData.stepType])}>
        <TransferLikeForm formData={formData} formConnector={formConnector} />
        {buttonRow}
      </div>
    )
  }

  return (
    <div className={formStyles.form}>
      <div>Todo: support {formData.stepType} step</div>
    </div>
  )
}
