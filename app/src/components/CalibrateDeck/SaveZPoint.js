// @flow
import * as React from 'react'
import { css } from 'styled-components'
import {
  PrimaryButton,
  Flex,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_HEADER,
  FONT_SIZE_BODY_2,
  DIRECTION_ROW,
  SPACING_3,
  BORDER_SOLID_LIGHT,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import type { CalibrateDeckChildProps } from './types'
import { JogControls } from '../JogControls'
import { formatJogVector } from './utils'
import styles from './styles.css'

import slot5LeftMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_5_LEFT_MULTI_Z.webm'
import slot5LeftSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_5_LEFT_SINGLE_Z.webm'
import slot5RightMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_5_RIGHT_MULTI_Z.webm'
import slot5RightSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_5_RIGHT_SINGLE_Z.webm'

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

const HEADER = 'z-axis in slot 5'

const JOG_UNTIL = 'Jog the pipette until the tip is'
const JUST_BARELY_TOUCHING = 'barely touching (less than 0.1mm)'
const DECK_IN = 'the deck in'
const SLOT_5 = 'slot 5'
const THEN = 'Then press the'
const BUTTON_TEXT = 'remember z-axis and move to slot 1'
const TO_USE_Z =
  'button to use this z position for the rest of deck calibration'

export function SaveZPoint(props: CalibrateDeckChildProps): React.Node {
  const { isMulti, mount, sendSessionCommand } = props

  const demoAsset = React.useMemo(
    () => mount && assetMap[mount][isMulti ? 'multi' : 'single'],
    [mount, isMulti]
  )

  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    sendSessionCommand(
      Sessions.deckCalCommands.JOG,
      {
        vector: formatJogVector(axis, dir, step),
      },
      false
    )
  }

  const savePoint = () => {
    sendSessionCommand(Sessions.deckCalCommands.SAVE_OFFSET)
    sendSessionCommand(Sessions.deckCalCommands.MOVE_TO_POINT_ONE)
  }

  return (
    <>
      <div className={styles.modal_header}>
        <Text
          textTransform="uppercase"
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          fontSize={FONT_SIZE_HEADER}
        >
          {HEADER}
        </Text>
      </div>
      <Flex
        flexDirection={DIRECTION_ROW}
        padding={SPACING_3}
        border={BORDER_SOLID_LIGHT}
        marginTop={SPACING_3}
      >
        <Text
          fontSize={FONT_SIZE_BODY_2}
          css={css`
            align-self: center;
          `}
        >
          {JOG_UNTIL}
          <b>{` ${JUST_BARELY_TOUCHING} `}</b>
          {DECK_IN}
          <b>{SLOT_5}.</b>
          <br />
          <br />
          {THEN}
          <b>{` ${BUTTON_TEXT} `}</b>
          {TO_USE_Z}.
        </Text>
        <video
          key={demoAsset}
          className={styles.step_check_video}
          autoPlay={true}
          loop={true}
          controls={false}
        >
          <source src={demoAsset} />
        </video>
      </Flex>
      <div className={styles.tip_pick_up_controls_wrapper}>
        <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['z']} />
      </div>
      <div className={styles.button_row}>
        <PrimaryButton onClick={savePoint} className={styles.command_button}>
          {BUTTON_TEXT}
        </PrimaryButton>
      </div>
    </>
  )
}
