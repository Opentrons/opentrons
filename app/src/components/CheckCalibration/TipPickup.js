// @flow
import * as React from 'react'
import {
  PrimaryButton,
  AlertModal,
  type Mount,
} from '@opentrons/components'
import { getLabwareDisplayName, getPipetteModelSpecs } from '@opentrons/shared-data'
import findKey from 'lodash/find'

import type {
  RobotCalibrationCheckInstrument,
  RobotCalibrationCheckLabware,
} from '../../calibration/api-types'
import { getLatestLabwareDef } from '../../getLabware'
import styles from './styles.css'

const TIP_PICK_UP_HEADER = 'Position pipette over '
const TIP_PICK_UP_BUTTON_TEXT = 'Pick up tip'

const CONFIRM_TIP_BODY = 'Did pipette pick up tips successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, move to first check'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'


type TipPickUpProps = {|
  proceed: () => mixed,
  pipette: RobotCalibrationCheckInstrument,
  tiprack: RobotCalibrationCheckLabware,
|}
export function TipPickUp(props: TipPickUpProps) {
  const { proceed, pipette, tiprack} = props
  const [isConfirmingTip, setIsConfirmingTip] = React.useState(false)
  const tiprackDef = React.useMemo(() => getLatestLabwareDef(tiprack?.loadName), [tiprack])
  const isMulti = React.useMemo(() => {
    const spec = getPipetteModelSpecs(pipette.model)
    return spec ? spec.channels > 1 : false
  }, [tiprack])

  const reset = () => {
    setIsConfirmingTip(false)
    console.debug('TODO: reset tip pick to try again')
  }

  const demoVisual = isMulti
    ? <span>I'm the GIF for multi channel pipettes</span>
    : <span>I'm the GIF for single channel pipettes</span>

  return (
    <>
      <div className={styles.modal_header}>
        <h3>
          {TIP_PICK_UP_HEADER}
          {tiprackDef ? getLabwareDisplayName(tiprackDef) : null}
        </h3>
      </div>

      {isConfirmingTip ? (
        <>
          <p>{CONFIRM_TIP_BODY}</p>
          <PrimaryButton onClick={reset}>
            {CONFIRM_TIP_NO_BUTTON_TEXT}
          </PrimaryButton>
          <PrimaryButton onClick={proceed}>
            {CONFIRM_TIP_YES_BUTTON_TEXT}
          </PrimaryButton>
        </>
      ) : (
        <>
          <div className={styles.tip_pick_up_demo_wrapper}>
            {demoVisual}
          </div>
          <div className={styles.tip_pick_up_controls_wrapper}></div>

          <div className={styles.button_row}>
            <PrimaryButton
              onClick={() => setIsConfirmingTip(true)}
              className={styles.continue_button}
            >
              {TIP_PICK_UP_BUTTON_TEXT}
            </PrimaryButton>
          </div>
        </>
      )}
    </>
  )
}
