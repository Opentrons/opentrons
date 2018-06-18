// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import get from 'lodash/get'
import cx from 'classnames'
import {FlatButton, PrimaryButton} from '@opentrons/components'

import {actions, selectors} from '../../steplist' // TODO use steplist/index.js
import type {FormData, StepType} from '../../form-types'
import {formConnectorFactory} from '../../utils'
import type {BaseState, ThunkDispatch} from '../../types'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import MixForm from './MixForm'
import TransferLikeForm from './TransferLikeForm'
import PauseForm from './PauseForm'

type StepForm = typeof MixForm | typeof PauseForm | typeof TransferLikeForm
const STEP_FORM_MAP: {[StepType]: StepForm} = {
  mix: MixForm,
  pause: PauseForm,
  transfer: TransferLikeForm,
  consolidate: TransferLikeForm,
  distribute: TransferLikeForm
}

type SP = {formData?: FormData, canSave: boolean}
type DP = {
  handleChange: (accessor: string) => (event: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => void,
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onCancel: (event: SyntheticEvent<>) => mixed,
  onSave: (event: SyntheticEvent<>) => mixed,
}

const StepEditForm = (props: SP & DP) => {
  const {formData, handleChange, onClickMoreOptions, onCancel, onSave, canSave} = props
  const FormComponent: any = get(STEP_FORM_MAP, formData.stepType)
  if (!FormComponent) return <div className={formStyles.form}><div>Todo: support {formData && formData.stepType} step</div></div>
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

const mapStateToProps = (state: BaseState): SP => ({
  formData: selectors.formData(state),
  canSave: selectors.currentFormCanBeSaved(state)
})

const mapDispatchToProps = (dispatch: ThunkDispatch<*>): DP => ({
  onCancel: () => dispatch(actions.cancelStepForm()),
  onSave: () => dispatch(actions.saveStepForm()),
  onClickMoreOptions: () => dispatch(actions.openMoreOptionsModal()),
  handleChange: (accessor: string) => (e: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => {
    // TODO Ian 2018-01-26 factor this nasty type handling out
    const dispatchEvent = value => dispatch(actions.changeFormInput({update: {[accessor]: value}}))

    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      dispatchEvent(e.target.checked)
    } else if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      dispatchEvent(e.target.value)
    }
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(StepEditForm)
