// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'

import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import styles from './styles.css'
import type { CalibrateTipLengthProps } from './types'

// TODO: fill with real video assets keyed by mount and then channels
const assetMap = {}

const HEADER = 'Save the nozzle z-axis'
const JOG_UNTIL = 'Jog pipette until tip is'
const JUST_BARELY = 'just barely'
const TOUCHING = 'touching the deck in'
const SLOT_5 = 'slot 5'
const SAVE_NOZZLE_Z_AXIS = 'Save nozzle z-axis'

export function MeasureNozzle(props: CalibrateTipLengthProps): React.Node {
  // TODO: get real isMulti and mount from the session
  const isMulti = false
  const mount = 'left'

  const demoAsset = React.useMemo(
    () => mount && assetMap[mount][isMulti ? 'multi' : 'single'],
    [mount, isMulti]
  )

  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    console.log('TODO: jog with params', axis, dir, step)
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
          <b>&nbsp;{SLOT_5}.&nbsp;</b>
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
