// @flow
import * as React from 'react'
import { Icon, PrimaryButton } from '@opentrons/components'
import styles from './styles.css'

const DELETE_ROBOT_CALIBRATION_CHECK_HEADER = 'Calibration check is complete'
const DELETE_ROBOT_CALIBRATION_CHECK_BODY =
  "You have successfully checked the accuracy of this robot's calibration."
const DELETE_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT = 'Drop tip and exit'

type CompleteConfirmationProps = {|
  exit: () => mixed,
|}
export function CompleteConfirmation(props: CompleteConfirmationProps) {
  const { exit } = props

  return (
    <>
      <div className={styles.modal_icon_wrapper}>
        <Icon name="check-circle" className={styles.success_status_icon} />
        <h3>{DELETE_ROBOT_CALIBRATION_CHECK_HEADER}</h3>
      </div>
      <p className={styles.complete_body}>
        {DELETE_ROBOT_CALIBRATION_CHECK_BODY}
      </p>
      <PrimaryButton onClick={exit}>
        {DELETE_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT}
      </PrimaryButton>
    </>
  )
}
