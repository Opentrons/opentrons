// @flow
import * as React from 'react'
import { PrimaryButton, type Mount } from '@opentrons/components'
import { useDispatch } from 'react-redux'

import type { Dispatch } from '../../types'
import {
  jogRobotCalibrationCheck,
  confirmStepRobotCalibrationCheck,
} from '../../calibration'
import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import styles from './styles.css'
import { formatJogVector } from './utils'

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

type CheckHeightProps = {|
  pipetteId: string,
  robotName: string,
  isMulti: boolean,
  mount: Mount,
|}
export function CheckHeight(props: CheckHeightProps) {
  const { pipetteId, robotName, isMulti, mount } = props

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

  function confirmStep() {
    dispatch(confirmStepRobotCalibrationCheck(robotName, pipetteId))
  }

  return (
    <>
      <div className={styles.modal_header}>
        <h3>{CHECK_Z_HEADER}</h3>
      </div>
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
          onClick={confirmStep}
          className={styles.pick_up_tip_button}
        >
          {CHECK_Z_BUTTON_TEXT}
        </PrimaryButton>
      </div>
    </>
  )
}
