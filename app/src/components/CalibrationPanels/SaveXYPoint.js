// @flow
import * as React from 'react'
import { css } from 'styled-components'
import {
  PrimaryButton,
  Flex,
  Text,
  FONT_SIZE_BODY_2,
  DIRECTION_ROW,
  SPACING_3,
  BORDER_SOLID_LIGHT,
  FONT_SIZE_HEADER,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import type { CalibrationPanelProps } from './types'
import type { DeckCalibrationStep } from '../../sessions/deck-calibration/types'
import type { SessionCommandString, SessionType } from '../../sessions/types'
import { JogControls } from '../JogControls'
import { formatJogVector } from './utils'
import styles from './styles.css'

import slot1LeftMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_1_LEFT_MULTI_X-Y.webm'
import slot1LeftSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_1_LEFT_SINGLE_X-Y.webm'
import slot1RightMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_1_RIGHT_MULTI_X-Y.webm'
import slot1RightSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_1_RIGHT_SINGLE_X-Y.webm'
import slot3LeftMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_3_LEFT_MULTI_X-Y.webm'
import slot3LeftSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_3_LEFT_SINGLE_X-Y.webm'
import slot3RightMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_3_RIGHT_MULTI_X-Y.webm'
import slot3RightSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_3_RIGHT_SINGLE_X-Y.webm'
import slot7LeftMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_7_LEFT_MULTI_X-Y.webm'
import slot7LeftSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_7_LEFT_SINGLE_X-Y.webm'
import slot7RightMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_7_RIGHT_MULTI_X-Y.webm'
import slot7RightSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_7_RIGHT_SINGLE_X-Y.webm'

const assetMap = {
  '1': {
    left: {
      multi: slot1LeftMultiDemoAsset,
      single: slot1LeftSingleDemoAsset,
    },
    right: {
      multi: slot1RightMultiDemoAsset,
      single: slot1RightSingleDemoAsset,
    },
  },
  '3': {
    left: {
      multi: slot3LeftMultiDemoAsset,
      single: slot3LeftSingleDemoAsset,
    },
    right: {
      multi: slot3RightMultiDemoAsset,
      single: slot3RightSingleDemoAsset,
    },
  },
  '7': {
    left: {
      multi: slot7LeftMultiDemoAsset,
      single: slot7LeftSingleDemoAsset,
    },
    right: {
      multi: slot7RightMultiDemoAsset,
      single: slot7RightSingleDemoAsset,
    },
  },
}

const SAVE_XY_POINT_HEADER = 'Calibrate the X and Y-axis in'
const SLOT = 'slot'
const JOG_UNTIL = 'Jog the robot until the tip is'
const PRECISELY_CENTERED = 'precisely centered'
const ABOVE_THE_CROSS = 'above the cross in'
const THEN = 'Then press the'
const TO_SAVE = 'button to calibrate the x and y-axis in'

const BASE_BUTTON_TEXT = 'save calibration'
const MOVE_TO_POINT_TWO_BUTTON_TEXT = `${BASE_BUTTON_TEXT} and move to slot 3`
const MOVE_TO_POINT_THREE_BUTTON_TEXT = `${BASE_BUTTON_TEXT} and move to slot 7`

const contentsBySessionTypeByCurrentStep: {
  [SessionType]: {
    [DeckCalibrationStep]: {
      slotNumber: string,
      buttonText: string,
      commandString: SessionCommandString,
    },
  },
} = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: {
    [Sessions.DECK_STEP_SAVING_POINT_ONE]: {
      slotNumber: '1',
      buttonText: MOVE_TO_POINT_TWO_BUTTON_TEXT,
      commandString: Sessions.deckCalCommands.MOVE_TO_POINT_TWO,
    },
    [Sessions.DECK_STEP_SAVING_POINT_TWO]: {
      slotNumber: '3',
      buttonText: MOVE_TO_POINT_THREE_BUTTON_TEXT,
      commandString: Sessions.deckCalCommands.MOVE_TO_POINT_THREE,
    },
    [Sessions.DECK_STEP_SAVING_POINT_THREE]: {
      slotNumber: '7',
      buttonText: BASE_BUTTON_TEXT,
      commandString: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
    },
  },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    [Sessions.PIP_OFFSET_STEP_SAVING_POINT_ONE]: {
      slotNumber: '1',
      buttonText: BASE_BUTTON_TEXT,
      commandString: Sessions.sharedCalCommands.SAVE_OFFSET,
    },
  },
}

export function SaveXYPoint(props: CalibrationPanelProps): React.Node {
  const { isMulti, mount, sendSessionCommand, currentStep, sessionType } = props

  const {
    slotNumber,
    buttonText,
    commandString,
  } = contentsBySessionTypeByCurrentStep[sessionType][currentStep]

  const demoAsset = React.useMemo(
    () =>
      slotNumber && assetMap[slotNumber][mount][isMulti ? 'multi' : 'single'],
    [slotNumber, mount, isMulti]
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
    sendSessionCommand(commandString)
  }

  return (
    <>
      <div className={styles.modal_header}>
        <Text
          fontSize={FONT_SIZE_HEADER}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          textTransform="uppercase"
        >
          {SAVE_XY_POINT_HEADER}
          {` ${SLOT} ${slotNumber || ''}`}
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
          <b>{` ${PRECISELY_CENTERED} `}</b>
          {ABOVE_THE_CROSS}
          <b>{` ${SLOT} ${slotNumber || ''}`}.</b>
          <br />
          <br />
          {THEN}
          <b>{` ${buttonText} `}</b>
          {`${TO_SAVE} ${SLOT} ${slotNumber}`}.
        </Text>
        <video
          key={String(demoAsset)}
          className={styles.step_check_video}
          autoPlay={true}
          loop={true}
          controls={false}
        >
          <source src={demoAsset} />
        </video>
      </Flex>
      <div className={styles.tip_pick_up_controls_wrapper}>
        <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['x', 'y']} />
      </div>
      <Flex width="100%" marginBottom={SPACING_3}>
        <PrimaryButton onClick={savePoint} className={styles.command_button}>
          {buttonText}
        </PrimaryButton>
      </Flex>
    </>
  )
}
