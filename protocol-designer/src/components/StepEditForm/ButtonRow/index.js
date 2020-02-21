// @flow
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { OutlineButton, PrimaryButton } from '@opentrons/components'

import { actions as steplistActions } from '../../../steplist'
import { actions as stepFormActions } from '../../../step-forms'

import { getCurrentFormCanBeSaved } from '../../../step-forms/selectors'

import type { BaseState } from '../../../types'

import modalStyles from '../../modals/modal.css'
import styles from './styles.css'

const { cancelStepForm } = steplistActions
const { saveStepForm } = stepFormActions

type Props = {|
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onDelete?: (event: SyntheticEvent<>) => mixed,
|}

export const ButtonRow = ({ onDelete, onClickMoreOptions }: Props) => {
  const canSave = useSelector((state: BaseState): boolean =>
    getCurrentFormCanBeSaved(state)
  )
  const dispatch = useDispatch()

  return (
    <div className={cx(modalStyles.button_row_divided, styles.form_wrapper)}>
      <div>
        <OutlineButton className={styles.form_button} onClick={onDelete}>
          Delete
        </OutlineButton>
        <OutlineButton
          className={styles.form_button}
          onClick={onClickMoreOptions}
        >
          Notes
        </OutlineButton>
      </div>
      <div>
        <PrimaryButton
          className={styles.form_button}
          onClick={() => dispatch(cancelStepForm())}
        >
          Close
        </PrimaryButton>
        <PrimaryButton
          className={styles.form_button}
          disabled={!canSave}
          onClick={canSave ? () => dispatch(saveStepForm()) : undefined}
        >
          Save
        </PrimaryButton>
      </div>
    </div>
  )
}
