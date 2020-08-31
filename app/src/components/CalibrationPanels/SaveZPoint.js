// @flow
import * as React from 'react'
import { css } from 'styled-components'
import {
  PrimaryBtn,
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
import type { CalibrationPanelProps } from './types'
import { JogControls } from '../JogControls'
import { formatJogVector } from './utils'

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

const CALIBRATE = 'calibrate'
const TARGET_SLOT = 'slot 5'
const BASE_HEADER = `z-axis in ${TARGET_SLOT}`
const JOG_UNTIL = 'Jog the pipette until the tip is'
const JUST_BARELY_TOUCHING = 'barely touching (less than 0.1mm)'
const DECK_IN = 'the deck in'
const THEN = 'Then press the'
const DECK_CAL_BUTTON_TEXT = 'remember z-axis and move to slot 1'
const PIP_OFFSET_BUTTON_TEXT = 'save calibration and move to slot 1'
const TO_USE_Z =
  'button to use this z position for the rest of deck calibration'

const contentsBySessionType: {
  [SessionType]: {
    headerText: string,
    buttonText: string,
  },
} = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: {
    buttonText: DECK_CAL_BUTTON_TEXT,
    headerText: BASE_HEADER,
  },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    buttonText: PIP_OFFSET_BUTTON_TEXT,
    headerText: `${CALIBRATE} ${BASE_HEADER}`,
  },
}

export function SaveZPoint(props: CalibrationPanelProps): React.Node {
  const { isMulti, mount, sendSessionCommand, sessionType } = props

  const { headerText, buttonText } = contentsBySessionType[sessionType]

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
    sendSessionCommand(Sessions.sharedCalCommands.SAVE_OFFSET)
    sendSessionCommand(Sessions.sharedCalCommands.MOVE_TO_POINT_ONE)
  }

  return (
    <>
      <Text
        textTransform="uppercase"
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        fontSize={FONT_SIZE_HEADER}
      >
        {headerText}
      </Text>
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
          <b>{TARGET_SLOT}.</b>
          <br />
          <br />
          {THEN}
          <b>{` ${buttonText} `}</b>
          {TO_USE_Z}.
        </Text>
        <video
          key={demoAsset}
          css={css`
            max-width: 100%;
            max-height: 15rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
        >
          <source src={demoAsset} />
        </video>
      </Flex>
      <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['z']} />
      <Flex width="100%" marginBottom={SPACING_3}>
        <PrimaryBtn onClick={savePoint} margin={`0 ${SPACING_5}`}>
          {buttonText}
        </PrimaryBtn>
      </Flex>
    </>
  )
}
