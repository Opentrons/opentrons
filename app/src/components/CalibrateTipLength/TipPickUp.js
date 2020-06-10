// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import { getLatestLabwareDef } from '../../getLabware'
import { JogControls } from '../JogControls'
import type { CalibrateTipLengthChildProps } from './types'
import styles from './styles.css'

// TODO: put these assets in a shared location?
import multiDemoAsset from '../CheckCalibration/videos/A1-Multi-Channel-SEQ.webm'
import singleDemoAsset from '../CheckCalibration/videos/A1-Single-Channel-SEQ.webm'

const TIP_PICK_UP_HEADER = 'Position pipette over '
const TIP_PICK_UP_BUTTON_TEXT = 'Pick up tip'

const SINGLE_JOG_UNTIL_AT = 'Jog pipette until nozzle is centered above the'
const MULTI_JOG_UNTIL_AT = 'Jog pipette until the channel nozzle'
const CLOSEST = 'closest'
const TO_YOU_IS_CENTERED = 'to you is centered above the'
const POSITION = 'position'
const AND = 'and'
const FLUSH = 'flush'
const WITH_TOP_OF_TIP = 'with the top of the tip.'
const TIP_WELL_NAME = 'A1'

const ASSET_MAP = {
  multi: multiDemoAsset,
  single: singleDemoAsset,
}
export function TipPickUp(props: CalibrateTipLengthChildProps): React.Node {
  // TODO: get real isMulti and tiprack from the session
  const tiprack = {}
  const isMulti = true

  const tiprackDef = React.useMemo(
    () => getLatestLabwareDef(tiprack?.loadName),
    [tiprack]
  )

  const demoAsset = ASSET_MAP[isMulti ? 'multi' : 'single']

  const jogUntilAbove = isMulti ? (
    <>
      {MULTI_JOG_UNTIL_AT}
      <b>&nbsp;{CLOSEST}&nbsp;</b>
      {TO_YOU_IS_CENTERED}
    </>
  ) : (
    SINGLE_JOG_UNTIL_AT
  )

  const pickUpTip = () => {
    console.log('TODO: wire up command')
    // props.sendSessionCommand('pickUpTip')
  }

  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    console.log('TODO: wire up jog with params', axis, dir, step)
    // props.sendSessionCommand('jog',{
    //   vector: formatJogVector(axis, direction, step),
    // }, {})
  }

  return (
    <>
      <div className={styles.modal_header}>
        <h3>
          {TIP_PICK_UP_HEADER}
          {tiprackDef
            ? getLabwareDisplayName(tiprackDef).replace('µL', 'uL')
            : null}
        </h3>
      </div>
      <div className={styles.tip_pick_up_demo_wrapper}>
        <p className={styles.tip_pick_up_demo_body}>
          {jogUntilAbove}
          <b>{` ${TIP_WELL_NAME} `}</b>
          {POSITION}
          <br />
          {AND}
          <b>{` ${FLUSH} `}</b>
          {WITH_TOP_OF_TIP}
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
        <JogControls jog={jog} />
      </div>
      <div className={styles.button_row}>
        <PrimaryButton onClick={pickUpTip} className={styles.command_button}>
          {TIP_PICK_UP_BUTTON_TEXT}
        </PrimaryButton>
      </div>
    </>
  )
}
