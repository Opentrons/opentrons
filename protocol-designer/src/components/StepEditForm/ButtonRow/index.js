// @flow
import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { OutlineButton, PrimaryButton } from '@opentrons/components'

import { actions as steplistActions } from '../../../steplist'
import { actions as stepsActions } from '../../../ui/steps'

import {
  getCurrentFormCanBeSaved,
  getUnsavedForm,
  getUnsavedFormIsPristineSetTempForm,
} from '../../../step-forms/selectors'

import type { BaseState } from '../../../types'

import modalStyles from '../../modals/modal.css'
import styles from './styles.css'

type Props = {|
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onDelete?: (event: SyntheticEvent<>) => mixed,
|}

export const ButtonRow = ({ onDelete, onClickMoreOptions }: Props) => {
  const [
    showAddPauseUntilTempStepModal,
    setShowAddPauseUntilTempStepModal,
  ] = useState<boolean>(false)

  const dispatch = useDispatch()
  const canSave = useSelector((state: BaseState): boolean =>
    getCurrentFormCanBeSaved(state)
  )
  const unsavedForm = useSelector(getUnsavedForm)
  const shouldShowPauseUntilTempStepModal = useSelector(
    getUnsavedFormIsPristineSetTempForm
  )

  const handleClickSave = useCallback(() => {
    if (!canSave) {
      return
    }
    if (shouldShowPauseUntilTempStepModal) {
      setShowAddPauseUntilTempStepModal(true)
    } else {
      dispatch(stepsActions.saveStepForm())
    }
  }, [canSave, shouldShowPauseUntilTempStepModal, dispatch])

  return (
    <>
      {showAddPauseUntilTempStepModal && (
        <div>
          <p>
            Pause until module is {unsavedForm?.targetTemperature} DegReeSSS?
          </p>
          <button
            onClick={() => {
              setShowAddPauseUntilTempStepModal(false)
              // save normally
              dispatch(stepsActions.saveStepForm())
            }}
          >
            I WILL BUILD A PAUSE LATER
          </button>
          <button
            onClick={() => {
              setShowAddPauseUntilTempStepModal(false)
              // save this form and add a subsequent pause
              dispatch(stepsActions.saveSetTempFormWithAddedPauseUntilTemp())
            }}
          >
            PAUSE PROTOCOL NOW
          </button>
        </div>
      )}
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
            onClick={() => dispatch(steplistActions.cancelStepForm())}
          >
            Close
          </PrimaryButton>
          <PrimaryButton
            className={styles.form_button}
            disabled={!canSave}
            onClick={handleClickSave}
          >
            Save
          </PrimaryButton>
        </div>
      </div>
    </>
  )
}
