// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import { getLatestLabwareDef } from '../../getLabware'
import { JogControls } from '../JogControls'
import styles from './styles.css'
import multiA1DemoAsset from '../../assets/videos/tip-pick-up/A1_Multi_Channel_REV1.webm'
import singleA1DemoAsset from '../../assets/videos/tip-pick-up/A1_Single_Channel_REV1.webm'
import multiB1DemoAsset from '../../assets/videos/tip-pick-up/B1_Multi_Channel_REV1.webm'
import singleB1DemoAsset from '../../assets/videos/tip-pick-up/B1_Single_Channel_REV1.webm'

import type { RobotCalibrationCheckLabware } from '../../sessions/types'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'

const TIP_PICK_UP_HEADER = 'Position pipette over '
const TIP_PICK_UP_BUTTON_TEXT = 'Pick up tip'

const CONFIRM_TIP_BODY = 'Did pipette pick up tips successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, continue'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'
const SINGLE_JOG_UNTIL_AT = 'Jog pipette until nozzle is centered above the'
const MULTI_JOG_UNTIL_AT = 'Jog pipette until the channel nozzle'
const CLOSEST = 'closest'
const TO_YOU_IS_CENTERED = 'to you is centered above the'
const POSITION = 'position'
const AND = 'and'
const FLUSH = 'flush'
const WITH_TOP_OF_TIP = 'with the top of the tip.'

const ASSET_MAP = {
  A1: {
    multi: multiA1DemoAsset,
    single: singleA1DemoAsset,
  },
  B1: {
    multi: multiB1DemoAsset,
    single: singleB1DemoAsset,
  },
}
type TipPickUpProps = {|
  isMulti: boolean,
  tiprack: RobotCalibrationCheckLabware,
  isInspecting: boolean,
  tipRackWellName: string,
  pickUpTip: () => void,
  confirmTip: () => void,
  invalidateTip: () => void,
  jog: (JogAxis, JogDirection, JogStep) => void,
|}
export function TipPickUp(props: TipPickUpProps): React.Node {
  const {
    tiprack,
    isMulti,
    isInspecting,
    tipRackWellName,
    pickUpTip,
    confirmTip,
    invalidateTip,
    jog,
  } = props
  const tiprackDef = React.useMemo(
    () => getLatestLabwareDef(tiprack?.loadName),
    [tiprack]
  )

  const demoAsset =
    tipRackWellName && ASSET_MAP[tipRackWellName][isMulti ? 'multi' : 'single']

  const jogUntilAbove = isMulti ? (
    <>
      {MULTI_JOG_UNTIL_AT}
      <b>&nbsp;{CLOSEST}&nbsp;</b>
      {TO_YOU_IS_CENTERED}
    </>
  ) : (
    SINGLE_JOG_UNTIL_AT
  )

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

      {isInspecting ? (
        <div className={styles.tip_pick_up_confirmation_wrapper}>
          <p className={styles.pick_up_tip_confirmation_body}>
            {CONFIRM_TIP_BODY}
          </p>
          <PrimaryButton
            className={styles.pick_up_tip_confirmation_button}
            onClick={invalidateTip}
          >
            {CONFIRM_TIP_NO_BUTTON_TEXT}
          </PrimaryButton>
          <PrimaryButton
            className={styles.pick_up_tip_confirmation_button}
            onClick={confirmTip}
          >
            {CONFIRM_TIP_YES_BUTTON_TEXT}
          </PrimaryButton>
        </div>
      ) : (
        <>
          <div className={styles.tip_pick_up_demo_wrapper}>
            <p className={styles.tip_pick_up_demo_body}>
              {jogUntilAbove}
              <b>&nbsp;{tipRackWellName}&nbsp;</b>
              {`${POSITION} ${AND}`}
              <b>&nbsp;{FLUSH}&nbsp;</b>
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
            <PrimaryButton
              onClick={pickUpTip}
              className={styles.command_button}
            >
              {TIP_PICK_UP_BUTTON_TEXT}
            </PrimaryButton>
          </div>
        </>
      )}
    </>
  )
}
