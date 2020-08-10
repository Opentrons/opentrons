// @flow
import * as React from 'react'
import { PrimaryButton, Icon, type Mount } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import * as Sessions from '../../sessions'
import type { RobotCalibrationCheckComparison } from '../../sessions/types'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import type { CalibrateDeckChildProps } from './types'
import { JogControls } from '../JogControls'
import { formatJogVector } from './utils'
import styles from './styles.css'

import slot5LeftMultiDemoAsset from './videos/SLOT_5_LEFT_MULTI_Z.webm'
import slot5LeftSingleDemoAsset from './videos/SLOT_5_LEFT_SINGLE_Z.webm'
import slot5RightMultiDemoAsset from './videos/SLOT_5_RIGHT_MULTI_Z.webm'
import slot5RightSingleDemoAsset from './videos/SLOT_5_RIGHT_SINGLE_Z.webm'

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

const SAVE_Z_HEADER = 'save z-axis in slot 5'

const JOG_UNTIL = 'Jog the pipette until the tip is'
const JUST_BARELY_TOUCHING = 'barely touching (less than 0.1mm)'
const DECK_IN = 'the deck in'
const SLOT_5 = 'slot 5'
const THEN = 'Then press the'
const SAVE_POINT = 'save z-axis'
const TO_DETERMINE_MATCH = 'button to save z-axis calibration coordinate.'

export function CheckHeight(props: CalibrateDeckChildProps): React.Node {
  const { isMulti, mount, sendSessionCommand } = props

  const demoAsset = React.useMemo(
    () => mount && assetMap[mount][isMulti ? 'multi' : 'single'],
    [mount, isMulti]
  )

  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    sendSessionCommand(Sessions.deckCalCommands.JOG, {
      vector: formatJogVector(axis, dir, step),
    })
  }

  const savePoint = () => {
    sendSessionCommand(Sessions.deckCalCommands.SAVE_OFFSET)
    sendSessionCommand(Sessions.deckCalCommands.MOVE_TO_POINT_ONE)
  }

  return (
    <>
      <div className={styles.modal_header}>
        <h3>{SAVE_Z_HEADER}</h3>
      </div>
      <div className={styles.step_check_wrapper}>
        <div className={styles.step_check_body_wrapper}>
          <p className={styles.tip_pick_up_demo_body}>
            {JOG_UNTIL}
            <b>&nbsp;{JUST_BARELY_TOUCHING}&nbsp;</b>
            {DECK_IN}
            <b>&nbsp;{SLOT_5}.&nbsp;</b>
            <br />
            <br />
            {THEN}
            <b>&nbsp;{SAVE_POINT}&nbsp;</b>
            {TO_DETERMINE_MATCH}
          </p>
        </div>
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
        <PrimaryButton onClick={savePoint} className={styles.command_button}>
          {SAVE_POINT}
        </PrimaryButton>
      </div>
    </>
  )
}
