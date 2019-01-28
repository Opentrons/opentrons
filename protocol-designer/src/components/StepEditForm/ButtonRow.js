// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {OutlineButton, PrimaryButton} from '@opentrons/components'
import cx from 'classnames'

import {actions as steplistActions} from '../../steplist'
import {selectors as stepsSelectors} from '../../ui/steps'
import type {BaseState, ThunkDispatch} from '../../types'
import styles from './StepEditForm.css'

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
    <div className={cx(styles.form_row, styles.form_footer)}>
      <div className={styles.start_group}>
        <OutlineButton className={styles.form_button} onClick={onDelete}>DELETE</OutlineButton>
        <OutlineButton className={styles.form_button} onClick={onClickMoreOptions}>NOTES</OutlineButton>
      </div>
      <div className={styles.end_group}>
        <PrimaryButton className={styles.form_button} onClick={onCancel}>CLOSE</PrimaryButton>
        <PrimaryButton className={styles.form_button} disabled={!canSave} onClick={onSave}>SAVE</PrimaryButton>
      </div>
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
