// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  FlatButton,
  PrimaryButton,
  FormGroup,
  InputField,
  RadioGroup,
  type DropdownOption
} from '@opentrons/components'

import MixForm from './MixForm'
import TransferLikeForm from './TransferLikeForm'
import PauseForm from './PauseForm'
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

const StepEditForm = (props: Props) => {
  const {formData} = props
  const formConnector = formConnectorFactory(props.handleChange, formData)

  const buttonRow = (
    <div className={styles.button_row}>
      <FlatButton className={styles.more_options_button} onClick={props.onClickMoreOptions}>
        MORE OPTIONS
      </FlatButton>
      <PrimaryButton className={styles.cancel_button} onClick={props.onCancel}>CANCEL</PrimaryButton>
      <PrimaryButton disabled={!props.canSave} onClick={props.onSave}>SAVE</PrimaryButton>
    </div>
  )
  let FormComponent = null

  switch (formData.stepType) {
    case 'mix'
    case 'pause'
    case 'transfer'
    case 'consolidate'
    case 'distribute'

  }
'mix'
'pause'
'transfer'
'consolidate'
'distribute'

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
        <PauseForm formData={formData} formConnector={formConnector} />
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

export default StepEditForm
