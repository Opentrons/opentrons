// @flow
import * as React from 'react'
import get from 'lodash/get'
import cx from 'classnames'
import {FlatButton, PrimaryButton} from '@opentrons/components'

import type {FormData} from '../../form-types'
import {formConnectorFactory} from '../../utils'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import MixForm from './MixForm'
import TransferLikeForm from './TransferLikeForm'
import PauseForm from './PauseForm'

export type Props = {
  formData: FormData,
  handleChange: (accessor: string) => (event: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => void,
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onCancel: (event: SyntheticEvent<>) => mixed,
  onSave: (event: SyntheticEvent<>) => mixed,
  canSave: boolean
}

const StepFormTypeMap = {
  mix: MixForm,
  pause: PauseForm,
  transfer: TransferLikeForm,
  consolidate: TransferLikeForm,
  distribute: TransferLikeForm
}

const StepEditForm = ({formData, handleChange, onClickMoreOptions, onCancel, onSave, canSave}: Props) => {
  const FormComponent: any = get(StepFormTypeMap, formData.stepType)
  if (!FormComponent) return <div className={formStyles.form}><div>Todo: support {formData.stepType} step</div></div>
  return (
    <div className={cx(formStyles.form, styles[formData.stepType])}>
      <FormComponent formData={formData} formConnector={formConnectorFactory(handleChange, formData)} />
      <div className={styles.button_row}>
        <FlatButton className={styles.more_options_button} onClick={onClickMoreOptions}>MORE OPTIONS</FlatButton>
        <PrimaryButton className={styles.cancel_button} onClick={onCancel}>CANCEL</PrimaryButton>
        <PrimaryButton disabled={!canSave} onClick={onSave}>SAVE</PrimaryButton>
      </div>
    </div>
  )
}

export default StepEditForm
