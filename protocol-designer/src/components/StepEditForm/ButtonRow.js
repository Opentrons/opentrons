// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {FlatButton, PrimaryButton} from '@opentrons/components'

import {actions, selectors} from '../../steplist'
import type {BaseState, ThunkDispatch} from '../../types'
import styles from './StepEditForm.css'

const ButtonRow = (props) => {
  const {canSave, onSave, onCancel, onClickMoreOptions} = props
  return (
    <div className={styles.button_row}>
      <FlatButton className={styles.more_options_button} onClick={onClickMoreOptions}>MORE OPTIONS</FlatButton>
      <PrimaryButton className={styles.cancel_button} onClick={onCancel}>CANCEL</PrimaryButton>
      <PrimaryButton disabled={!canSave} onClick={onSave}>SAVE</PrimaryButton>
    </div>
  )
}

type SP = {canSave?: ?boolean}
const STP = (state: BaseState): SP => ({ canSave: selectors.currentFormCanBeSaved(state) })

type DP = {
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onCancel: (event: SyntheticEvent<>) => mixed,
  onSave: (event: SyntheticEvent<>) => mixed,
}
const DTP = (dispatch: ThunkDispatch<*>): DP => ({
  onCancel: () => dispatch(actions.cancelStepForm()),
  onSave: () => dispatch(actions.saveStepForm()),
  onClickMoreOptions: () => dispatch(actions.openMoreOptionsModal())
})

export default connect(STP, DTP)(ButtonRow)
