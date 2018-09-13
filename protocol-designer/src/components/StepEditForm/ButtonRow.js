// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {OutlineButton, PrimaryButton} from '@opentrons/components'

import {actions, selectors} from '../../steplist'
import type {BaseState, ThunkDispatch} from '../../types'
import styles from './StepEditForm.css'

type OP = {onDelete?: (event: SyntheticEvent<>) => mixed}
type SP = {canSave?: ?boolean}
type DP = {
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onCancel: (event: SyntheticEvent<>) => mixed,
  onSave: (event: SyntheticEvent<>) => mixed,
}
type Props = OP & SP & DP

const ButtonRow = (props: Props) => {
  const {canSave, onDelete, onSave, onCancel, onClickMoreOptions} = props
  return (
    <div className={styles.button_row}>
      <OutlineButton onClick={onDelete}>DELETE</OutlineButton>
      <OutlineButton onClick={onClickMoreOptions}>NOTES</OutlineButton>
      <PrimaryButton className={styles.cancel_button} onClick={onCancel}>CANCEL</PrimaryButton>
      <PrimaryButton disabled={!canSave} onClick={onSave}>SAVE</PrimaryButton>
    </div>
  )
}

const STP = (state: BaseState): SP => ({ canSave: selectors.currentFormCanBeSaved(state) })

const DTP = (dispatch: ThunkDispatch<*>): DP => ({
  onCancel: () => dispatch(actions.cancelStepForm()),
  onSave: () => dispatch(actions.saveStepForm()),
  onClickMoreOptions: () => dispatch(actions.openMoreOptionsModal()),
})

export default connect(STP, DTP)(ButtonRow)
