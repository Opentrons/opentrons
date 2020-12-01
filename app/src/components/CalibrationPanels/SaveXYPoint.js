// @flow
import * as React from 'react'
import { css } from 'styled-components'
import {
  Box,
  PrimaryBtn,
  Flex,
  Text,
  FONT_SIZE_BODY_2,
  DIRECTION_ROW,
  SPACING_3,
  SPACING_5,
  BORDER_SOLID_LIGHT,
  FONT_SIZE_HEADER,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import type { CalibrationPanelProps } from './types'
import type {
  SessionType,
  CalibrationSessionStep,
  SessionCommandString,
} from '../../sessions/types'
import { JogControls, HORIZONTAL_PLANE } from '../JogControls'
import { formatJogVector } from './utils'
import { useConfirmCrashRecovery } from './useConfirmCrashRecovery'
import { NeedHelpLink } from './NeedHelpLink'

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
const CHECK_POINT_XY_HEADER = 'Check the X and Y-axis in'
const SLOT = 'slot'
const JOG_UNTIL = 'Jog the robot until the tip is'
const PRECISELY_CENTERED = 'precisely centered'
const ABOVE_THE_CROSS = 'above the cross in'
const THEN = 'Then press the'
const TO_SAVE = 'button to calibrate the x and y-axis in'
const TO_CHECK =
  'button to determine how this position compares to the previously-saved x and y-axis calibration coordinates'

const BASE_BUTTON_TEXT = 'save calibration'
const HEALTH_BUTTON_TEXT = 'check x and y-axis'
const MOVE_TO_POINT_TWO_BUTTON_TEXT = `${BASE_BUTTON_TEXT} and move to slot 3`
const MOVE_TO_POINT_THREE_BUTTON_TEXT = `${BASE_BUTTON_TEXT} and move to slot 7`
const HEALTH_POINT_TWO_BUTTON_TEXT = `${HEALTH_BUTTON_TEXT} and move to slot 3`
const HEALTH_POINT_THREE_BUTTON_TEXT = `${HEALTH_BUTTON_TEXT} and move to slot 7`

const contentsBySessionTypeByCurrentStep: {
  [SessionType]: {
    [CalibrationSessionStep]: {
      slotNumber: string,
      buttonText: string,
      moveCommand: SessionCommandString | null,
      finalCommand?: SessionCommandString | null,
    },
  },
} = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: {
    [Sessions.DECK_STEP_SAVING_POINT_ONE]: {
      slotNumber: '1',
      buttonText: MOVE_TO_POINT_TWO_BUTTON_TEXT,
      moveCommand: Sessions.deckCalCommands.MOVE_TO_POINT_TWO,
    },
    [Sessions.DECK_STEP_SAVING_POINT_TWO]: {
      slotNumber: '3',
      buttonText: MOVE_TO_POINT_THREE_BUTTON_TEXT,
      moveCommand: Sessions.deckCalCommands.MOVE_TO_POINT_THREE,
    },
    [Sessions.DECK_STEP_SAVING_POINT_THREE]: {
      slotNumber: '7',
      buttonText: BASE_BUTTON_TEXT,
      moveCommand: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
    },
  },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    [Sessions.PIP_OFFSET_STEP_SAVING_POINT_ONE]: {
      slotNumber: '1',
      buttonText: BASE_BUTTON_TEXT,
      moveCommand: null,
    },
  },
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]: {
    [Sessions.CHECK_STEP_COMPARING_POINT_ONE]: {
      slotNumber: '1',
      buttonText: HEALTH_POINT_TWO_BUTTON_TEXT,
      moveCommand: Sessions.deckCalCommands.MOVE_TO_POINT_TWO,
      finalCommand: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
    },
    [Sessions.CHECK_STEP_COMPARING_POINT_TWO]: {
      slotNumber: '3',
      buttonText: HEALTH_POINT_THREE_BUTTON_TEXT,
      moveCommand: Sessions.deckCalCommands.MOVE_TO_POINT_THREE,
    },
    [Sessions.CHECK_STEP_COMPARING_POINT_THREE]: {
      slotNumber: '7',
      buttonText: HEALTH_BUTTON_TEXT,
      moveCommand: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
    },
  },
}

export function SaveXYPoint(props: CalibrationPanelProps): React.Node {
  const {
    isMulti,
    mount,
    sendCommands,
    currentStep,
    sessionType,
    activePipette,
    instruments,
    checkBothPipettes,
  } = props

  const {
    slotNumber,
    buttonText,
    moveCommand,
    finalCommand,
  } = contentsBySessionTypeByCurrentStep[sessionType][currentStep]

  const demoAsset = React.useMemo(
    () =>
      slotNumber && assetMap[slotNumber][mount][isMulti ? 'multi' : 'single'],
    [slotNumber, mount, isMulti]
  )

  const isHealthCheck =
    sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    sendCommands({
      command: Sessions.sharedCalCommands.JOG,
      data: {
        vector: formatJogVector(axis, dir, step),
      },
    })
  }

  const savePoint = () => {
    let commands = null
    if (isHealthCheck) {
      commands = [{ command: Sessions.checkCommands.COMPARE_POINT }]
    } else {
      commands = [{ command: Sessions.sharedCalCommands.SAVE_OFFSET }]
    }
    if (
      finalCommand &&
      checkBothPipettes &&
      activePipette?.rank === Sessions.CHECK_PIPETTE_RANK_FIRST
    ) {
      commands = [...commands, { command: finalCommand }]
    } else if (moveCommand) {
      commands = [...commands, { command: moveCommand }]
    }
    sendCommands(...commands)
  }

  const [confirmLink, confirmModal] = useConfirmCrashRecovery({
    requiresNewTip: true,
    ...props,
  })
  const continueButtonText =
    isHealthCheck &&
    instruments?.length &&
    activePipette?.rank === Sessions.CHECK_PIPETTE_RANK_FIRST
      ? HEALTH_BUTTON_TEXT
      : buttonText
  return (
    <>
      <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Text
          fontSize={FONT_SIZE_HEADER}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
        >
          {isHealthCheck ? CHECK_POINT_XY_HEADER : SAVE_XY_POINT_HEADER}
          {` ${SLOT} ${slotNumber || ''}`}
        </Text>
        <NeedHelpLink />
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        padding={SPACING_3}
        border={BORDER_SOLID_LIGHT}
        marginTop={SPACING_3}
      >
        <Text fontSize={FONT_SIZE_BODY_2} alignSelf={JUSTIFY_CENTER}>
          {JOG_UNTIL}
          <b>{` ${PRECISELY_CENTERED} `}</b>
          {ABOVE_THE_CROSS}
          <b>{` ${SLOT} ${slotNumber || ''}`}.</b>
          <br />
          <br />
          {THEN}
          <b>{` '${continueButtonText}' `}</b>
          {isHealthCheck ? TO_CHECK : `${TO_SAVE} ${SLOT} ${slotNumber}`}.
        </Text>
        <video
          key={String(demoAsset)}
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
      <JogControls jog={jog} stepSizes={[0.1, 1]} planes={[HORIZONTAL_PLANE]} />
      <Flex
        width="100%"
        justifyContent={JUSTIFY_CENTER}
        marginBottom={SPACING_3}
      >
        <PrimaryBtn
          title="save"
          onClick={savePoint}
          flex="1"
          marginX={SPACING_5}
        >
          {continueButtonText}
        </PrimaryBtn>
      </Flex>
      <Box width="100%">{confirmLink}</Box>
      {confirmModal}
    </>
  )
}
