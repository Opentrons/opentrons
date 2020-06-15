// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'

import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'

// TODO: fill with real video assets keyed by mount and then channels
const assetMap = {
  left: {},
  right: {},
}

const HEADER = 'Save the nozzle z-axis'
const JOG_UNTIL = 'Jog the robot until nozzle is'
const JUST_BARELY = 'just barely'
// TODO: check copy here, should be touching the calibration block if present
// and the top of the trash if not
const TOUCHING = 'touching the deck in'
const SAVE_NOZZLE_Z_AXIS = 'Save nozzle z-axis'

export function MeasureNozzle(props: CalibrateTipLengthChildProps): React.Node {
  // TODO: get real isMulti and mount and slotName from the session
  const isMulti = false
  const mount = 'left'
  const slotName = 'slot 3'

  const demoAsset = React.useMemo(
    () => mount && assetMap[mount][isMulti ? 'multi' : 'single'],
    [mount, isMulti]
  )

  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    console.log('TODO: wire up jog with params', axis, dir, step)
    // props.sendSessionCommand('jog',{
    //   vector: formatJogVector(axis, direction, step),
    // }, {})
  }

  return (
    <>
      <div className={styles.modal_header}>
        <h3>{HEADER}</h3>
      </div>
      <div className={styles.tip_pick_up_demo_wrapper}>
        <p className={styles.tip_pick_up_demo_body}>
          {JOG_UNTIL}
          <b>&nbsp;{JUST_BARELY}&nbsp;</b>
          {TOUCHING}
          <b>&nbsp;{slotName}.&nbsp;</b>
        </p>
        <div className={styles.step_check_video_wrapper}>
          <video
            key={demoAsset}
            className={styles.step_check_video}
            autoPlay={true}
            loop={true}
            controls={false}
          >
            {/* TODO: insert assets <source src={demoAsset} /> */}
          </video>
        </div>
      </div>
      <div className={styles.tip_pick_up_controls_wrapper}>
        <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['z']} />
      </div>
      <div className={styles.button_row}>
        <PrimaryButton
          onClick={() => {
            console.log('TODO: save nozzle offset')
          }}
          className={styles.command_button}
        >
          {SAVE_NOZZLE_Z_AXIS}
        </PrimaryButton>
      </div>
    </>
  )
}
