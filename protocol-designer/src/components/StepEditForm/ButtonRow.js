// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {OutlineButton, PrimaryButton} from '@opentrons/components'

import {actions as steplistActions} from '../../steplist'
import {selectors as stepsSelectors} from '../../ui/steps'
import type {BaseState, ThunkDispatch} from '../../types'
import styles from './StepEditForm.css'
import formStyles from '../Form.css'

type OP = {
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onDelete?: (event: SyntheticEvent<>) => mixed,
}
type SP = {canSave?: ?boolean}
type DP = {
  onCancel: (event: SyntheticEvent<>) => mixed,
  onSave: (event: SyntheticEvent<>) => mixed,
}
type Props = OP & SP & DP

const ButtonRow = (props: Props) => {
  const {canSave, onDelete, onSave, onCancel, onClickMoreOptions} = props
  return (
    <div className={formStyles.button_row}>
      <OutlineButton onClick={onDelete}>DELETE</OutlineButton>
      <OutlineButton onClick={onClickMoreOptions}>NOTES</OutlineButton>
      <PrimaryButton className={styles.cancel_button} onClick={onCancel}>CANCEL</PrimaryButton>
      <PrimaryButton disabled={!canSave} onClick={onSave}>SAVE</PrimaryButton>
    </div>
  )
}

const STP = (state: BaseState): SP => ({
  canSave: stepsSelectors.getCurrentFormCanBeSaved(state),
})

const DTP = (dispatch: ThunkDispatch<*>): DP => ({
  onCancel: () => dispatch(steplistActions.cancelStepForm()),
  onSave: () => dispatch(steplistActions.saveStepForm()),
})

export default connect(STP, DTP)(ButtonRow)
