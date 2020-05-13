// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import type { RobotCalibrationCheckLabware } from '../../calibration/api-types'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import { getLatestLabwareDef } from '../../getLabware'
import { JogControls } from '../JogControls'
import styles from './styles.css'
import multiA1DemoAsset from './videos/A1-Multi-Channel-SEQ.webm'
import singleA1DemoAsset from './videos/A1-Single-Channel-SEQ.webm'
import multiB1DemoAsset from './videos/B1-Multi-Channel-SEQ.webm'
import singleB1DemoAsset from './videos/B1-Single-Channel-SEQ.webm'

const TIP_PICK_UP_HEADER = 'Position pipette over '
const TIP_PICK_UP_BUTTON_TEXT = 'Pick up tip'

const CONFIRM_TIP_BODY = 'Did pipette pick up tips successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, move to first check'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'
const JOG_UNTIL_AT = 'Jog pipette until nozzle is centered above'
const POSITION_AND = 'position and'
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
export function TipPickUp(props: TipPickUpProps) {
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
              {JOG_UNTIL_AT}
              <b>&nbsp;{tipRackWellName}&nbsp;</b>
              {POSITION_AND}
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
