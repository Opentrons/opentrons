// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {OutlineButton, PrimaryButton} from '@opentrons/components'

import {actions, selectors} from '../../steplist'
import type {BaseState, ThunkDispatch} from '../../types'
import styles from './StepEditForm.css'

type OP = {toggleConfirmDeleteModal: () => void}
type SP = {canSave?: ?boolean}
type DP = {
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onDelete: () => mixed,
  onCancel: (event: SyntheticEvent<>) => mixed,
  onSave: (event: SyntheticEvent<>) => mixed,
}

const ButtonRow = (props: OP & SP & DP) => {
  const {toggleConfirmDeleteModal, canSave, onSave, onCancel, onClickMoreOptions} = props
  return (
    <div className={styles.button_row}>
      <OutlineButton onClick={toggleConfirmDeleteModal}>DELETE</OutlineButton>
      <OutlineButton onClick={onClickMoreOptions}>NOTES</OutlineButton>
      <PrimaryButton className={styles.cancel_button} onClick={onCancel}>CANCEL</PrimaryButton>
      <PrimaryButton disabled={!canSave} onClick={onSave}>SAVE</PrimaryButton>
    </div>
  )
}

const STP = (state: BaseState): SP => ({ canSave: selectors.currentFormCanBeSaved(state) })

const DTP = (dispatch: ThunkDispatch<*>): DP => ({
  onDelete: () => dispatch(actions.deleteStep()),
  onCancel: () => dispatch(actions.cancelStepForm()),
  onSave: () => dispatch(actions.saveStepForm()),
  onClickMoreOptions: () => dispatch(actions.openMoreOptionsModal())
})

export default connect(STP, DTP)(ButtonRow)
