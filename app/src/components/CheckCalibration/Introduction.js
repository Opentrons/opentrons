// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'
import styles from './styles.css'

const INTRO_ROBOT_CALIBRATION_CHECK_HEADER = 'Check deck calibration'
const INTRO_ROBOT_CALIBRATION_CHECK_BODY =
  "Testing your deck calibration builds confidence that the robot is working correctly and accurately. If at any point the robot does not go to the points as expected, exit this process and re-calibrate your robot deck."
const INTRO_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT = 'Continue'

type IntroductionProps = {|
  proceed: () => mixed,
|}
export function Introduction(props: IntroductionProps) {
  const { proceed } = props

  return (
    <>
      <div className={styles.modal_header}>
        <h3>{INTRO_ROBOT_CALIBRATION_CHECK_HEADER}</h3>
      </div>
      <p className={styles.complete_body}>
        {INTRO_ROBOT_CALIBRATION_CHECK_BODY}
      </p>
      <PrimaryButton onClick={proceed}>
        {INTRO_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT}
      </PrimaryButton>
    </>
  )
}
