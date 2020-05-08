// @flow
import * as React from 'react'
import cx from 'classnames'
import { PrimaryButton, Icon, type Mount } from '@opentrons/components'
import { useDispatch } from 'react-redux'

import type { Dispatch } from '../../types'
import {
  jogRobotCalibrationCheck,
  comparePointRobotCalibrationCheck,
  confirmStepRobotCalibrationCheck,
  type RobotCalibrationCheckComparison,
} from '../../calibration'
import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import styles from './styles.css'
import { formatJogVector, formatOffsetValue } from './utils'

import slot5LeftMultiDemoAsset from './videos/SLOT_5_LEFT_MULTI_Z_(640X480)_REV1.webm'
import slot5LeftSingleDemoAsset from './videos/SLOT_5_LEFT_SINGLE_Z_(640X480)_REV1.webm'
import slot5RightMultiDemoAsset from './videos/SLOT_5_RIGHT_MULTI_Z_(640X480)_REV1.webm'
import slot5RightSingleDemoAsset from './videos/SLOT_5_RIGHT_SINGLE_Z_(640X480)_REV1.webm'

const assetMap = {
  left: {
    multi: slot5LeftMultiDemoAsset,
    single: slot5LeftSingleDemoAsset,
  },
  right: {
    multi: slot5RightMultiDemoAsset,
    single: slot5RightSingleDemoAsset,
  },
}

const CHECK_Z_HEADER = 'Check the Z-axis'
const CHECK_Z_BUTTON_TEXT = 'check z-axis'

const JOG_UNTIL = 'Jog pipette until tip is'
const JUST_BARELY = 'just barely'
const TOUCHING = 'touching the deck in'
const SLOT_5 = 'slot 5'
const THEN = 'Then'
const CHECK_AXES = 'check z-axis'
const TO_DETERMINE_MATCH =
  'to see if the position matches the calibration co-ordinate.'

const MOVE_TO_NEXT = 'move to next check'
const DROP_TIP_AND_EXIT = 'Drop tip and exit calibration check'

const BAD_INSPECTING_HEADER = 'Bad calibration data detected'
const GOOD_INSPECTING_HEADER = 'Good calibration'
const BAD_INSPECTING_BODY =
  'The jogged and calibrated z-axis co-ordinates do not match, and are out of acceptable bounds.'
const GOOD_INSPECTING_BODY =
  'The jogged and calibrated z-axis co-ordinates fall within acceptable bounds.'
const DIFFERENCE = 'Difference'

type CheckHeightProps = {|
  pipetteId: string,
  robotName: string,
  isMulti: boolean,
  mount: Mount,
  isInspecting: boolean,
  comparison: RobotCalibrationCheckComparison,
  exit: () => void,
|}
export function CheckHeight(props: CheckHeightProps) {
  const {
    pipetteId,
    robotName,
    isMulti,
    mount,
    isInspecting,
    comparison,
    exit,
  } = props

  const dispatch = useDispatch<Dispatch>()
  const demoAsset = React.useMemo(
    () => assetMap[mount][isMulti ? 'multi' : 'single'],
    [mount, isMulti]
  )
  function jog(axis: JogAxis, direction: JogDirection, step: JogStep) {
    dispatch(
      jogRobotCalibrationCheck(
        robotName,
        pipetteId,
        formatJogVector(axis, direction, step)
      )
    )
  }

  function comparePoint() {
    dispatch(comparePointRobotCalibrationCheck(robotName, pipetteId))
  }
  function goToNextCheck() {
    dispatch(confirmStepRobotCalibrationCheck(robotName, pipetteId))
  }

  return (
    <>
      <div className={styles.modal_header}>
        <h3>{CHECK_Z_HEADER}</h3>
      </div>
      {isInspecting ? (
        <CompareZ
          comparison={comparison}
          goToNextCheck={goToNextCheck}
          exit={exit}
        />
      ) : (
        <>
          <div className={styles.tip_pick_up_demo_wrapper}>
            <p className={styles.tip_pick_up_demo_body}>
              {JOG_UNTIL}
              <b>&nbsp;{JUST_BARELY}&nbsp;</b>
              {TOUCHING}
              <b>&nbsp;{SLOT_5}.&nbsp;</b>
              {THEN}
              <b>&nbsp;{CHECK_AXES}&nbsp;</b>
              {TO_DETERMINE_MATCH}
            </p>
            <div className={styles.step_check_video_wrapper}>
              <video
                key={demoAsset}
                className={styles.step_check_video}
                autoPlay={true}
                loop={true}
                controls={false}
              >
                <source src={demoAsset} />
              </video>
            </div>
          </div>
          <div className={styles.tip_pick_up_controls_wrapper}>
            <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['z']} />
          </div>
          <div className={styles.button_row}>
            <PrimaryButton
              onClick={comparePoint}
              className={styles.command_button}
            >
              {CHECK_Z_BUTTON_TEXT}
            </PrimaryButton>
          </div>
        </>
      )}
    </>
  )
}

type CompareZProps = {|
  comparison: RobotCalibrationCheckComparison,
  goToNextCheck: () => void,
  exit: () => void,
|}
function CompareZ(props: CompareZProps) {
  const { comparison, goToNextCheck, exit } = props
  const { differenceVector, exceedsThreshold } = comparison

  let header = GOOD_INSPECTING_HEADER
  let body = GOOD_INSPECTING_BODY
  let icon = <Icon name="check-circle" className={styles.success_status_icon} />
  let differenceClass = styles.difference_good

  if (exceedsThreshold) {
    header = BAD_INSPECTING_HEADER
    body = BAD_INSPECTING_BODY
    icon = <Icon name="close-circle" className={styles.error_status_icon} />
    differenceClass = styles.difference_bad
  }

  return (
    <div className={styles.padded_contents_wrapper}>
      <div className={styles.modal_icon_wrapper}>
        {icon}
        <h3>{header}</h3>
      </div>
      <p className={styles.difference_body}>{body}</p>
      <div className={cx(styles.difference_wrapper, differenceClass)}>
        <h5>{DIFFERENCE}</h5>
        <div className={styles.difference_value_wrapper}>
          <h5>Z</h5>
          <span className={cx(styles.difference_value, differenceClass)}>
            {formatOffsetValue(differenceVector[2])}
          </span>
        </div>
      </div>
      <div className={styles.button_stack}>
        {exceedsThreshold && (
          <PrimaryButton onClick={exit}>{DROP_TIP_AND_EXIT}</PrimaryButton>
        )}
        <PrimaryButton onClick={goToNextCheck}>{MOVE_TO_NEXT}</PrimaryButton>
      </div>
    </div>
  )
}
