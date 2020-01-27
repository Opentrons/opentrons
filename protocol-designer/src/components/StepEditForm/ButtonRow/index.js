// @flow
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { OutlineButton, PrimaryButton } from '@opentrons/components'

import { actions as steplistActions } from '../../../steplist'
import { actions as stepFormActions } from '../../../step-forms'

import { getCurrentFormCanBeSaved } from './selector'

import type { BaseState } from '../../../types'

import styles from './styles.css'
const { button_row, form_button, form_wrapper } = styles

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
    <div className={cx(button_row, form_wrapper)}>
      <div>
        <OutlineButton className={form_button} onClick={onDelete}>
          Delete
        </OutlineButton>
        <OutlineButton className={form_button} onClick={onClickMoreOptions}>
          Notes
        </OutlineButton>
      </div>
      <div>
        <PrimaryButton
          className={form_button}
          onClick={() => dispatch(cancelStepForm())}
        >
          Close
        </PrimaryButton>
        <PrimaryButton
          className={form_button}
          disabled={!canSave}
          onClick={canSave ? () => dispatch(saveStepForm()) : undefined}
        >
          Save
        </PrimaryButton>
      </div>
    </div>
  )
}
