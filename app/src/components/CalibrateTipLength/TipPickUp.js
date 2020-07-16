// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import * as Sessions from '../../sessions'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import { getLatestLabwareDef } from '../../getLabware'
import { JogControls } from '../JogControls'
import type { CalibrateTipLengthChildProps } from './types'
import styles from './styles.css'
import { formatJogVector } from './utils'

// TODO: put these assets in a shared location?
import multiDemoAsset from '../CheckCalibration/videos/A1_Multi_Channel_REV1.webm'
import singleDemoAsset from '../CheckCalibration/videos/A1_Single_Channel_REV1.webm'

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
  const { sendSessionCommand } = props
  // TODO: get real isMulti and tiprack from the session
  const tiprack = {}
  const isMulti = true

  const [showTipInspection, setShowTipInspection] = React.useState(false)
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
    sendSessionCommand(Sessions.tipCalCommands.PICK_UP_TIP)
    setShowTipInspection(true)
  }

  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    sendSessionCommand(Sessions.tipCalCommands.JOG, {
      vector: formatJogVector(axis, dir, step),
    })
  }

  const invalidateTip = () => {
    setShowTipInspection(false)
    sendSessionCommand(Sessions.tipCalCommands.INVALIDATE_TIP)
  }
  const confirmTip = () => {
    sendSessionCommand(Sessions.tipCalCommands.MOVE_TO_REFERENCE_POINT)
  }

  return showTipInspection ? (
    <InspectingTip invalidateTip={invalidateTip} confirmTip={confirmTip} />
  ) : (
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

const CONFIRM_TIP_BODY = 'Did pipette pick up tips successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, continue'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'

type InspectingTipProps = {|
  invalidateTip: () => void,
  confirmTip: () => void,
|}

export function InspectingTip(props: InspectingTipProps): React.Node {
  return (
    <div className={styles.tip_pick_up_confirmation_wrapper}>
      <p className={styles.pick_up_tip_confirmation_body}>{CONFIRM_TIP_BODY}</p>
      <PrimaryButton
        className={styles.pick_up_tip_confirmation_button}
        onClick={props.invalidateTip}
      >
        {CONFIRM_TIP_NO_BUTTON_TEXT}
      </PrimaryButton>
      <PrimaryButton
        className={styles.pick_up_tip_confirmation_button}
        onClick={props.confirmTip}
      >
        {CONFIRM_TIP_YES_BUTTON_TEXT}
      </PrimaryButton>
    </div>
  )
}
