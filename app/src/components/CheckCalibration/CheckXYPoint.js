// @flow
import * as React from 'react'
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
import { formatJogVector } from './utils'

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
const CHECK_XY_BUTTON_TEXT = 'check x and y-axis'
const SLOT = 'slot'
const JOG_UNTIL = 'Jog pipette until tip is'
const JUST_BARELY = 'just barely'
const TOUCHING_THE_CROSS = 'touching the cross in'
const THEN = 'Then'
const CHECK_AXES = 'check x and y-axis'
const TO_DETERMINE_MATCH =
  'to see if the position matches the calibration co-ordinate.'
const MOVE_TO_NEXT = 'move to next check'
const DROP_TIP_AND_EXIT = 'Drop tip and exit calibration check'

const BAD_INSPECTING_HEADER = 'Bad calibration data detected'
const GOOD_INSPECTING_HEADER = 'Good calibration'
const BAD_INSPECTING_BODY =
  'The jogged and calibrated x and y-axis co-ordinates do not match, and are out of acceptable bounds.'
const GOOD_INSPECTING_BODY =
  'The jogged and calibrated x and y-axis co-ordinates fall within acceptable bounds.'
const DIFFERENCE = 'difference'

type CheckXYPointProps = {|
  pipetteId: string,
  robotName: string,
  slotNumber: string | null,
  isMulti: boolean,
  mount: Mount,
  isInspecting: boolean,
  comparison: RobotCalibrationCheckComparison,
  exit: () => void,
|}
export function CheckXYPoint(props: CheckXYPointProps) {
  const {
    pipetteId,
    robotName,
    slotNumber,
    isMulti,
    mount,
    isInspecting,
    comparison,
    exit,
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
              {CHECK_XY_BUTTON_TEXT}
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
|}
function CompareXY(props: CompareXYProps) {
  const { comparison, goToNextCheck, exit } = props
  const { differenceVector, thresholdVector, exceedsThreshold } = comparison

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
    <>
      <div className={styles.modal_icon_wrapper}>
        {icon}
        <h3>{header}</h3>
      </div>
      <p>{body}</p>
      <div className={differenceClass}>
        <h5>{DIFFERENCE}</h5>
        <h5>X</h5>
        {differenceVector[0]}
        <h5>Y</h5>
        {differenceVector[1]}
      </div>
      <div>{thresholdVector}</div>
      {exceedsThreshold && (
        <div className={styles.button_row}>
          <PrimaryButton onClick={exit} className={styles.command_button}>
            {DROP_TIP_AND_EXIT}
          </PrimaryButton>
        </div>
      )}
      <div className={styles.button_row}>
        <PrimaryButton
          onClick={goToNextCheck}
          className={styles.command_button}
        >
          {MOVE_TO_NEXT}
        </PrimaryButton>
      </div>
    </>
  )
}
