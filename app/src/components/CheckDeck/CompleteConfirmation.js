// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { Icon, PrimaryButton } from '@opentrons/components'
import type { Dispatch } from '../../types'
import { completeRobotCalibrationCheck } from '../../calibration'
import styles from './styles.css'

const END_ROBOT_CALIBRATION_CHECK_HEADER = 'Calibration check is complete'
const END_ROBOT_CALIBRATION_CHECK_BODY =
  "You have successfully checked the accuracy of this robot's calibration."
const END_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT = 'Drop tip and exit'

type CompleteConfirmationProps = {|
  robotName: string,
  exit: () => mixed,
|}
export function CompleteConfirmation(props: CompleteConfirmationProps) {
  const { robotName, exit } = props
  const dispatch = useDispatch<Dispatch>()
  React.useEffect(() => {
    dispatch(completeRobotCalibrationCheck(robotName))
  }, [dispatch, robotName])

  return (
    <>
      <div className={styles.modal_header}>
        <Icon name="check-circle" className={styles.status_icon} />
        <h3>{END_ROBOT_CALIBRATION_CHECK_HEADER}</h3>
      </div>
      <p className={styles.complete_body}>{END_ROBOT_CALIBRATION_CHECK_BODY}</p>
      <PrimaryButton onClick={exit}>{END_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT}</PrimaryButton>
    </>
  )
}
