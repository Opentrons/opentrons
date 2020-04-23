// @flow
import * as React from 'react'
import { PrimaryButton, type Mount } from '@opentrons/components'
import {
  getLabwareDisplayName,
  getPipetteModelSpecs,
} from '@opentrons/shared-data'
import findKey from 'lodash/find'
import { useDispatch } from 'react-redux'

import type { Dispatch } from '../../types'
import type {
  RobotCalibrationCheckInstrument,
  RobotCalibrationCheckLabware,
} from '../../calibration/api-types'
import {
  pickUpTipRobotCalibrationCheck,
  jogRobotCalibrationCheck,
  confirmTipRobotCalibrationCheck,
  invalidateTipRobotCalibrationCheck,
  shimCurrentStep,
  CHECK_STEP_INSPECTING_TIP,
  CHECK_STEP_CHECKING_POINT_ONE,
  CHECK_STEP_CHECKING_POINT_TWO,
  CHECK_STEP_CHECKING_POINT_THREE,
} from '../../calibration'
import { getLatestLabwareDef } from '../../getLabware'
import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import styles from './styles.css'
import multiDemoAsset from './videos/A1-Multi-Channel-SEQ.gif'
import singleDemoAsset from './videos/A1-Single-Channel-SEQ.gif'
import { formatJogVector } from './utils'

type XYPointStep =
  | typeof CHECK_STEP_CHECKING_POINT_ONE
  | typeof CHECK_STEP_CHECKING_POINT_TWO
  | typeof CHECK_STEP_CHECKING_POINT_THREE

const CHECK_POINT_XY_HEADER = 'Check the X and Y-axis in'
const TIP_PICK_UP_BUTTON_TEXT = 'Pick up tip'
const SLOT_NAME_BY_STEP: { XYPointStep: string } = {
  [CHECK_STEP_CHECKING_POINT_ONE]: 'slot 1',
  [CHECK_STEP_CHECKING_POINT_TWO]: 'slot 3',
  [CHECK_STEP_CHECKING_POINT_THREE]: 'slot 7',
}
const JOG_UNTIL = 'Jog the pipette until thie tip is'
const JUST_BARELY = 'just barely'
const TOUCHING_THE_CROSS = 'touching the cross in'
const THEN = 'Then'
const CHECK_AXES = 'check x and y-axis'
const TO_DETERMINE_MATCH =
  'to see if the position matches the calibration co-ordinate.'

type CheckXYPointProps = {|
  pipetteId: string,
  robotName: string,
  currentStep: XYPointStep,
|}
export function CheckXYPoint(props: CheckXYPointProps) {
  const { pipetteId, robotName, currentStep } = props

  const dispatch = useDispatch<Dispatch>()

  function jog(axis: JogAxis, direction: JogDirection, step: JogStep) {
    console.table({ axis, direction, step })
    dispatch(
      jogRobotCalibrationCheck(
        robotName,
        pipetteId,
        formatJogVector(axis, direction, step)
      )
    )
  }

  function confirmStep() {
    dispatch(confirmStepRobotCalibrationCheck(robotName, pipetteId))
  }

  const demoAsset = singleDemoAsset

  return (
    <>
      <div className={styles.modal_header}>
        <h3>
          {CHECK_POINT_XY_HEADER}
          &nbsp;
          {SLOT_NAME_BY_STEP[currentStep]}
        </h3>
      </div>
      <div className={styles.tip_pick_up_demo_wrapper}>
        <p className={styles.tip_pick_up_demo_body}>
          {JOG_UNTIL}
          <b>&nbsp;{JUST_BARELY}&nbsp;</b>
          {TOUCHING_THE_CROSS}
          <b>&nbsp;{SLOT_NAME_BY_STEP[currentStep]}&nbsp;</b>
          {THEN}
          <b>&nbsp;{CHECK_AXES}&nbsp;</b>
          {TO_DETERMINE_MATCH}
        </p>
        <img src={demoAsset} className={styles.tip_pick_up_demo_image} />
      </div>
      <div className={styles.tip_pick_up_controls_wrapper}>
        <JogControls jog={jog} stepSizes={[0.1, 2]} axes={['x', 'y']} />
      </div>
      <div className={styles.button_row}>
        <PrimaryButton
          onClick={confirmStep}
          className={styles.pick_up_tip_button}
        >
          {TIP_PICK_UP_BUTTON_TEXT}
        </PrimaryButton>
      </div>
    </>
  )
}
