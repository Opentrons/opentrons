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
  shimCurrentStep,
  CHECK_STEP_INSPECTING_TIP,
} from '../../calibration'
import { getLatestLabwareDef } from '../../getLabware'
import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import styles from './styles.css'
import multiDemoAsset from './videos/A1-Multi-Channel-SEQ.gif'
import singleDemoAsset from './videos/A1-Single-Channel-SEQ.gif'

const TIP_PICK_UP_HEADER = 'Position pipette over '
const TIP_PICK_UP_BUTTON_TEXT = 'Pick up tip'

const CONFIRM_TIP_BODY = 'Did pipette pick up tips successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, move to first check'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'
const JOG_UNTIL_AT = 'Jog pipette until nozzle is centered above'
const WELL_NAME = 'A1'
const POSITION_AND = 'position and'
const FLUSH = 'flush'
const WITH_TOP_OF_TIP = 'with the top of the tip.'

type TipPickUpProps = {|
  pipetteId: string,
  isMulti: boolean,
  tiprack: RobotCalibrationCheckLabware,
  robotName: string,
  isInspecting: boolean,
|}
export function TipPickUp(props: TipPickUpProps) {
  const { pipetteId, tiprack, robotName, isMulti, isInspecting } = props
  const tiprackDef = React.useMemo(
    () => getLatestLabwareDef(tiprack?.loadName),
    [tiprack]
  )
  const dispatch = useDispatch<Dispatch>()

  const ORDERED_AXES: Array<JogAxis> = ['x', 'y', 'z']
  function jog(axis: JogAxis, direction: JogDirection, step: JogStep) {
    // e.g. reformat from ['x', -1, 0.1] to [-0.1, 0, 0]
    let vector = [0, 0, 0]
    const index = ORDERED_AXES.findIndex(a => a === axis)
    if (index >= 0) {
      vector[index] = step * direction
    }
    dispatch(jogRobotCalibrationCheck(robotName, pipetteId, vector))
  }

  function pickUpTip() {
    dispatch(pickUpTipRobotCalibrationCheck(robotName, pipetteId))
  }

  function confirmTipPickedUp() {
    dispatch(confirmTipRobotCalibrationCheck(robotName, pipetteId))
  }

  function rejectPickUpAttempt() {
    console.log('TODO: implement domain layer of invalidateTip')
    // dispatch(invalidateTipRobotCalibrationCheck(robotName, pipetteId))
  }

  const demoAsset = isMulti ? multiDemoAsset : singleDemoAsset

  return (
    <>
      <div className={styles.modal_header}>
        <h3>
          {TIP_PICK_UP_HEADER}
          {tiprackDef ? getLabwareDisplayName(tiprackDef) : null}
        </h3>
      </div>

      {isInspecting ? (
        <>
          <p>{CONFIRM_TIP_BODY}</p>
          <PrimaryButton onClick={rejectPickUpAttempt}>
            {CONFIRM_TIP_NO_BUTTON_TEXT}
          </PrimaryButton>
          <PrimaryButton onClick={confirmTipPickedUp}>
            {CONFIRM_TIP_YES_BUTTON_TEXT}
          </PrimaryButton>
        </>
      ) : (
        <>
          <div className={styles.tip_pick_up_demo_wrapper}>
            <p className={styles.tip_pick_up_demo_body}>
              {JOG_UNTIL_AT}
              <b>&nbsp;{WELL_NAME}&nbsp;</b>
              {POSITION_AND}
              <b>&nbsp;{FLUSH}&nbsp;</b>
              {WITH_TOP_OF_TIP}
            </p>
            <img src={demoAsset} className={styles.tip_pick_up_demo_image} />
          </div>
          <div className={styles.tip_pick_up_controls_wrapper}>
            <JogControls jog={jog} />
          </div>
          <div className={styles.button_row}>
            <PrimaryButton
              onClick={pickUpTip}
              className={styles.pick_up_tip_button}
            >
              {TIP_PICK_UP_BUTTON_TEXT}
            </PrimaryButton>
          </div>
        </>
      )}
    </>
  )
}
