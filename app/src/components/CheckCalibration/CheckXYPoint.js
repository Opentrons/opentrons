// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon, PrimaryButton, type Mount } from '@opentrons/components'
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

import slot1LeftMultiDemoAsset from './videos/SLOT_1_LEFT_MULTI_X-Y_(640X480)_REV1.webm'
import slot1LeftSingleDemoAsset from './videos/SLOT_1_LEFT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot1RightMultiDemoAsset from './videos/SLOT_1_RIGHT_MULTI_X-Y_(640X480)_REV1.webm'
import slot1RightSingleDemoAsset from './videos/SLOT_1_RIGHT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot3LeftMultiDemoAsset from './videos/SLOT_3_LEFT_MULTI_X-Y_(640X480)_REV1.webm'
import slot3LeftSingleDemoAsset from './videos/SLOT_3_LEFT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot3RightMultiDemoAsset from './videos/SLOT_3_RIGHT_MULTI_X-Y_(640X480)_REV1.webm'
import slot3RightSingleDemoAsset from './videos/SLOT_3_RIGHT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot7LeftMultiDemoAsset from './videos/SLOT_7_LEFT_MULTI_X-Y_(640X480)_REV1.webm'
import slot7LeftSingleDemoAsset from './videos/SLOT_7_LEFT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot7RightMultiDemoAsset from './videos/SLOT_7_RIGHT_MULTI_X-Y_(640X480)_REV1.webm'
import slot7RightSingleDemoAsset from './videos/SLOT_7_RIGHT_SINGLE_X-Y_(640X480)_REV1.webm'

const assetMap = {
  '1': {
    left: {
      multi: slot1LeftMultiDemoAsset,
      single: slot1LeftSingleDemoAsset,
    },
    right: {
      multi: slot1RightMultiDemoAsset,
      single: slot1RightSingleDemoAsset,
    },
  },
  '3': {
    left: {
      multi: slot3LeftMultiDemoAsset,
      single: slot3LeftSingleDemoAsset,
    },
    right: {
      multi: slot3RightMultiDemoAsset,
      single: slot3RightSingleDemoAsset,
    },
  },
  '7': {
    left: {
      multi: slot7LeftMultiDemoAsset,
      single: slot7LeftSingleDemoAsset,
    },
    right: {
      multi: slot7RightMultiDemoAsset,
      single: slot7RightSingleDemoAsset,
    },
  },
}

const CHECK_POINT_XY_HEADER = 'Check the X and Y-axis in'
const SLOT = 'slot'
const JOG_UNTIL = 'Jog pipette until tip is'
const JUST_BARELY = 'just barely'
const TOUCHING_THE_CROSS = 'touching the cross in'
const THEN = 'Then'
const CHECK_AXES = 'check x and y-axis'
const TO_DETERMINE_MATCH =
  'to see if the position matches the calibration co-ordinate.'
const DROP_TIP_AND_EXIT = 'Drop tip and exit calibration check'

const BAD_INSPECTING_HEADER = 'Bad calibration data detected'
const GOOD_INSPECTING_HEADER = 'Good calibration'
const BAD_INSPECTING_BODY =
  'The jogged and calibrated x and y-axis co-ordinates do not match, and are out of acceptable bounds.'
const GOOD_INSPECTING_BODY =
  'The jogged and calibrated x and y-axis co-ordinates fall within acceptable bounds.'
const DIFFERENCE = 'Difference'

type CheckXYPointProps = {|
  robotName: string,
  slotNumber: string | null,
  isMulti: boolean,
  mount: Mount,
  isInspecting: boolean,
  comparison: RobotCalibrationCheckComparison,
  exit: () => void,
  nextButtonText: string,
|}
export function CheckXYPoint(props: CheckXYPointProps) {
  const {
    robotName,
    slotNumber,
    isMulti,
    mount,
    isInspecting,
    comparison,
    exit,
    nextButtonText,
  } = props

  const dispatch = useDispatch<Dispatch>()
  const demoAsset = React.useMemo(
    () =>
      slotNumber && assetMap[slotNumber][mount][isMulti ? 'multi' : 'single'],
    [slotNumber, mount, isMulti]
  )
  function jog(axis: JogAxis, direction: JogDirection, step: JogStep) {
    dispatch(
      jogRobotCalibrationCheck(
        robotName,
        formatJogVector(axis, direction, step)
      )
    )
  }

  function comparePoint() {
    dispatch(comparePointRobotCalibrationCheck(robotName))
  }
  function goToNextCheck() {
    dispatch(confirmStepRobotCalibrationCheck(robotName))
  }

  return (
    <>
      <div className={styles.modal_header}>
        <h3>
          {CHECK_POINT_XY_HEADER}
          &nbsp;
          {`${SLOT} ${slotNumber || ''}`}
        </h3>
      </div>
      {isInspecting ? (
        <CompareXY
          comparison={comparison}
          goToNextCheck={goToNextCheck}
          exit={exit}
          nextButtonText={nextButtonText}
        />
      ) : (
        <>
          <div className={styles.tip_pick_up_demo_wrapper}>
            <p className={styles.tip_pick_up_demo_body}>
              {JOG_UNTIL}
              <b>&nbsp;{JUST_BARELY}&nbsp;</b>
              {TOUCHING_THE_CROSS}
              <b>&nbsp;{`${SLOT} ${slotNumber || ''}`}.&nbsp;</b>
              {THEN}
              <b>&nbsp;{CHECK_AXES}&nbsp;</b>
              {TO_DETERMINE_MATCH}
            </p>
            <div className={styles.step_check_video_wrapper}>
              <video
                key={String(demoAsset)}
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
            <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['x', 'y']} />
          </div>
          <div className={styles.button_row}>
            <PrimaryButton
              onClick={comparePoint}
              className={styles.command_button}
            >
              {nextButtonText}
            </PrimaryButton>
          </div>
        </>
      )}
    </>
  )
}

type CompareXYProps = {|
  comparison: RobotCalibrationCheckComparison,
  goToNextCheck: () => void,
  exit: () => void,
  nextButtonText: string,
|}
function CompareXY(props: CompareXYProps) {
  const { comparison, goToNextCheck, exit, nextButtonText } = props
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
        <div className={styles.difference_values}>
          <div className={styles.difference_value_wrapper}>
            <h5>X</h5>
            <span className={cx(styles.difference_value, differenceClass)}>
              {formatOffsetValue(differenceVector[0])}
            </span>
          </div>
          <div className={styles.difference_value_wrapper}>
            <h5>Y</h5>
            <span className={cx(styles.difference_value, differenceClass)}>
              {formatOffsetValue(differenceVector[1])}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.button_stack}>
        {exceedsThreshold && (
          <PrimaryButton onClick={exit}>{DROP_TIP_AND_EXIT}</PrimaryButton>
        )}
        <PrimaryButton onClick={goToNextCheck}>{nextButtonText}</PrimaryButton>
      </div>
    </div>
  )
}
