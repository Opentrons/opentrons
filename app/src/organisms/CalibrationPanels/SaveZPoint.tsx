import * as React from 'react'
import { css } from 'styled-components'
import {
  PrimaryBtn,
  Box,
  Btn,
  Flex,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_HEADER,
  FONT_SIZE_BODY_2,
  FONT_BODY_2_DARK,
  DIRECTION_ROW,
  SPACING_3,
  SPACING_5,
  BORDER_SOLID_LIGHT,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  ALIGN_STRETCH,
  TEXT_TRANSFORM_UPPERCASE,
  TEXT_DECORATION_UNDERLINE,
  TEXT_ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import type { SessionType } from '../../redux/sessions/types'
import type { Axis, Sign, StepSize } from '../../molecules/JogControls/types'
import type { CalibrationPanelProps } from './types'
import {
  JogControls,
  HORIZONTAL_PLANE,
  VERTICAL_PLANE,
} from '../../molecules/JogControls'
import { formatJogVector } from './utils'
import { useConfirmCrashRecovery } from './useConfirmCrashRecovery'
import { NeedHelpLink } from './NeedHelpLink'

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
const CHECK = 'check'
const TARGET_SLOT = 'slot 5'
const BASE_HEADER = `z-axis in ${TARGET_SLOT}`
const JOG_UNTIL = 'Jog the pipette until the tip is'
const JUST_BARELY_TOUCHING = 'barely touching (less than 0.1mm)'
const DECK_IN = 'the deck in'
const THEN = 'Then press the'
const DECK_CAL_BUTTON_TEXT = 'remember z-axis and move to slot 1'
const PIP_OFFSET_BUTTON_TEXT = 'save calibration and move to slot 1'
const CALIBRATION_HEALTH_BUTTON_TEXT = 'check z-axis'
const TO_USE_Z =
  'button to use this z position for the rest of deck calibration'
const TO_CALIBRATE_Z = 'button to calibrate the z offset for this pipette'
const CALIBRATION_HEALTH_TO_DETERMINE =
  'button to determine how this position compares to the previously saved z-axis calibration coordinate'
const ALLOW_HORIZONTAL_TEXT = 'Reveal XY jog controls to move across deck'
const ALLOW_XY_JOG_INSTRUCTIONS =
  'If the pipette is over the embossed 5, on the ridge of the slot, or hard to see, reveal the jog controls to move the pipette across the deck.'

const contentsBySessionType: Partial<
  Record<
    SessionType,
    {
      headerText: string
      buttonText: string
      buttonEffectText: string
    }
  >
> = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: {
    buttonText: DECK_CAL_BUTTON_TEXT,
    headerText: BASE_HEADER,
    buttonEffectText: TO_USE_Z,
  },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    buttonText: PIP_OFFSET_BUTTON_TEXT,
    headerText: `${CALIBRATE} ${BASE_HEADER}`,
    buttonEffectText: TO_CALIBRATE_Z,
  },
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]: {
    buttonText: CALIBRATION_HEALTH_BUTTON_TEXT,
    headerText: `${CHECK} ${BASE_HEADER}`,
    buttonEffectText: CALIBRATION_HEALTH_TO_DETERMINE,
  },
}

export function SaveZPoint(props: CalibrationPanelProps): JSX.Element {
  const { isMulti, mount, sendCommands, sessionType } = props
  // @ts-expect-error(sa, 2021-05-27): avoiding src code change, need to to type narrow
  const { headerText, buttonText, buttonEffectText } = contentsBySessionType[
    sessionType
  ]

  const demoAsset = React.useMemo(
    () => mount && assetMap[mount][isMulti ? 'multi' : 'single'],
    [mount, isMulti]
  )

  const [allowHorizontal, setAllowHorizontal] = React.useState(false)

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    sendCommands({
      command: Sessions.sharedCalCommands.JOG,
      data: {
        vector: formatJogVector(axis, dir, step),
      },
    })
  }

  const continueCommands = (): (() => void) => {
    if (sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK) {
      return (): void => {
        sendCommands(
          { command: Sessions.checkCommands.COMPARE_POINT },
          { command: Sessions.sharedCalCommands.MOVE_TO_POINT_ONE }
        )
      }
    } else {
      return (): void => {
        sendCommands(
          { command: Sessions.sharedCalCommands.SAVE_OFFSET },
          { command: Sessions.sharedCalCommands.MOVE_TO_POINT_ONE }
        )
      }
    }
  }

  const [confirmLink, confirmModal] = useConfirmCrashRecovery({
    requiresNewTip: true,
    ...props,
  })

  const AllowHorizontalPrompt = (): JSX.Element => (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      flex={1}
      alignSelf={ALIGN_STRETCH}
    >
      <Btn
        onClick={() => setAllowHorizontal(true)}
        css={FONT_BODY_2_DARK}
        textDecoration={TEXT_DECORATION_UNDERLINE}
        textAlign={TEXT_ALIGN_CENTER}
      >
        {ALLOW_HORIZONTAL_TEXT}
      </Btn>
    </Flex>
  )

  return (
    <>
      <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Text
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          fontSize={FONT_SIZE_HEADER}
        >
          {headerText}
        </Text>
        <NeedHelpLink />
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        padding={SPACING_3}
        border={BORDER_SOLID_LIGHT}
        marginTop={SPACING_3}
      >
        <Text fontSize={FONT_SIZE_BODY_2} alignSelf={ALIGN_CENTER}>
          {JOG_UNTIL}
          <b>{` ${JUST_BARELY_TOUCHING} `}</b>
          {DECK_IN}
          <b>{` ${TARGET_SLOT}`}.</b>
          <br />
          <br />
          {THEN}
          <b>{` '${buttonText}' `}</b>
          {buttonEffectText}.
          <br />
          <br />
          {ALLOW_XY_JOG_INSTRUCTIONS}
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
      <JogControls
        jog={jog}
        stepSizes={[0.1, 1]}
        planes={
          allowHorizontal
            ? [VERTICAL_PLANE, HORIZONTAL_PLANE]
            : [VERTICAL_PLANE]
        }
        auxiliaryControl={allowHorizontal ? null : <AllowHorizontalPrompt />}
        width="100%"
      />
      <Flex
        width="100%"
        marginBottom={SPACING_3}
        justifyContent={JUSTIFY_CENTER}
      >
        <PrimaryBtn
          title="save"
          onClick={continueCommands()}
          flex="1"
          marginX={SPACING_5}
        >
          {buttonText}
        </PrimaryBtn>
      </Flex>
      <Box width="100%">{confirmLink}</Box>
      {confirmModal}
    </>
  )
}
