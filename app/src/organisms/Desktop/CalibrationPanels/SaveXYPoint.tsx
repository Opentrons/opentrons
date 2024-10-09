import { useMemo } from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_FLEX_END,
  ALIGN_STRETCH,
  Box,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { useLogger } from '/app/logger'
import * as Sessions from '/app/redux/sessions'
import {
  JogControls,
  MEDIUM_STEP_SIZE_MM,
  SMALL_STEP_SIZE_MM,
} from '/app/molecules/JogControls'
import { formatJogVector } from './utils'
import { useConfirmCrashRecovery } from './useConfirmCrashRecovery'
import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'

import slot1LeftMultiDemoAsset from '/app/assets/videos/cal-movement/SLOT_1_LEFT_MULTI_X-Y.webm'
import slot1LeftSingleDemoAsset from '/app/assets/videos/cal-movement/SLOT_1_LEFT_SINGLE_X-Y.webm'
import slot1RightMultiDemoAsset from '/app/assets/videos/cal-movement/SLOT_1_RIGHT_MULTI_X-Y.webm'
import slot1RightSingleDemoAsset from '/app/assets/videos/cal-movement/SLOT_1_RIGHT_SINGLE_X-Y.webm'
import slot3LeftMultiDemoAsset from '/app/assets/videos/cal-movement/SLOT_3_LEFT_MULTI_X-Y.webm'
import slot3LeftSingleDemoAsset from '/app/assets/videos/cal-movement/SLOT_3_LEFT_SINGLE_X-Y.webm'
import slot3RightMultiDemoAsset from '/app/assets/videos/cal-movement/SLOT_3_RIGHT_MULTI_X-Y.webm'
import slot3RightSingleDemoAsset from '/app/assets/videos/cal-movement/SLOT_3_RIGHT_SINGLE_X-Y.webm'
import slot7LeftMultiDemoAsset from '/app/assets/videos/cal-movement/SLOT_7_LEFT_MULTI_X-Y.webm'
import slot7LeftSingleDemoAsset from '/app/assets/videos/cal-movement/SLOT_7_LEFT_SINGLE_X-Y.webm'
import slot7RightMultiDemoAsset from '/app/assets/videos/cal-movement/SLOT_7_RIGHT_MULTI_X-Y.webm'
import slot7RightSingleDemoAsset from '/app/assets/videos/cal-movement/SLOT_7_RIGHT_SINGLE_X-Y.webm'

import type { Axis, Sign, StepSize } from '/app/molecules/JogControls/types'
import type { CalibrationPanelProps } from './types'
import type {
  SessionType,
  CalibrationSessionStep,
  SessionCommandString,
  CalibrationLabware,
} from '/app/redux/sessions/types'
import type { Mount } from '@opentrons/components'

const assetMap: Record<
  CalibrationLabware['slot'],
  Record<Mount, Record<'multi' | 'single', string>>
> = {
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

const contentsBySessionTypeByCurrentStep: {
  [sessionType in SessionType]?: {
    [step in CalibrationSessionStep]?: {
      slotNumber: string
      moveCommand: SessionCommandString | null
    }
  }
} = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: {
    [Sessions.DECK_STEP_SAVING_POINT_ONE]: {
      slotNumber: '1',
      moveCommand: Sessions.deckCalCommands.MOVE_TO_POINT_TWO,
    },
    [Sessions.DECK_STEP_SAVING_POINT_TWO]: {
      slotNumber: '3',
      moveCommand: Sessions.deckCalCommands.MOVE_TO_POINT_THREE,
    },
    [Sessions.DECK_STEP_SAVING_POINT_THREE]: {
      slotNumber: '7',
      moveCommand: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
    },
  },
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]: {
    [Sessions.PIP_OFFSET_STEP_SAVING_POINT_ONE]: {
      slotNumber: '1',
      moveCommand: null,
    },
  },
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]: {
    [Sessions.CHECK_STEP_COMPARING_POINT_ONE]: {
      slotNumber: '1',
      moveCommand: Sessions.deckCalCommands.MOVE_TO_POINT_TWO,
    },
    [Sessions.CHECK_STEP_COMPARING_POINT_TWO]: {
      slotNumber: '3',
      moveCommand: Sessions.deckCalCommands.MOVE_TO_POINT_THREE,
    },
    [Sessions.CHECK_STEP_COMPARING_POINT_THREE]: {
      slotNumber: '7',
      moveCommand: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
    },
  },
}

export function SaveXYPoint(props: CalibrationPanelProps): JSX.Element | null {
  const { t } = useTranslation('robot_calibration')
  const logger = useLogger(new URL('', import.meta.url).pathname)
  const {
    isMulti,
    mount,
    sendCommands,
    currentStep,
    sessionType,
    activePipette,
    checkBothPipettes,
  } = props

  const { slotNumber, moveCommand } =
    contentsBySessionTypeByCurrentStep[sessionType]?.[currentStep] ?? {}

  const demoAsset = useMemo(
    () =>
      slotNumber != null
        ? assetMap[slotNumber][mount][isMulti ? 'multi' : 'single']
        : undefined,
    [slotNumber, mount, isMulti]
  )

  const [confirmLink, crashRecoveryConfirmation] = useConfirmCrashRecovery(
    props
  )

  if (slotNumber == null) {
    logger.warn(
      `Failed to render SaveXYPoint component. no valid slot name associated with {sessionType: ${sessionType}, currentStep: ${currentStep}}`
    )
    return null
  }

  const isHealthCheck =
    sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    sendCommands({
      command: Sessions.sharedCalCommands.JOG,
      data: {
        vector: formatJogVector(axis, dir, step),
      },
    })
  }

  const savePoint = (): void => {
    if (isHealthCheck) {
      if (
        currentStep === Sessions.CHECK_STEP_COMPARING_POINT_ONE &&
        checkBothPipettes === true &&
        activePipette?.rank === Sessions.CHECK_PIPETTE_RANK_FIRST
      ) {
        sendCommands(
          ...[
            { command: Sessions.checkCommands.COMPARE_POINT },
            { command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK },
          ]
        )
      } else {
        sendCommands(
          ...(moveCommand != null
            ? [
                { command: Sessions.checkCommands.COMPARE_POINT },
                { command: moveCommand },
              ]
            : [{ command: Sessions.checkCommands.COMPARE_POINT }])
        )
      }
    } else {
      sendCommands(
        ...(moveCommand != null
          ? [
              { command: Sessions.sharedCalCommands.SAVE_OFFSET },
              { command: moveCommand },
            ]
          : [{ command: Sessions.sharedCalCommands.SAVE_OFFSET }])
      )
    }
  }

  return (
    crashRecoveryConfirmation ?? (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        padding={SPACING.spacing32}
        minHeight="32rem"
      >
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignSelf={ALIGN_STRETCH}
          gridGap={SPACING.spacing8}
        >
          <Flex flexDirection={DIRECTION_COLUMN} flex="1">
            <LegacyStyledText as="h1" marginBottom={SPACING.spacing16}>
              {t(isHealthCheck ? 'check_xy_axes' : 'calibrate_xy_axes', {
                slotName: slotNumber,
              })}
            </LegacyStyledText>
            <LegacyStyledText as="p">
              {t('jog_pipette_to_touch_cross', { slotName: slotNumber })}
            </LegacyStyledText>
          </Flex>
          <Box flex="1">
            <video
              key={String(demoAsset)}
              css={css`
                max-width: 100%;
                max-height: 15rem;
              `}
              autoPlay={true}
              loop={true}
              controls={false}
              aria-label={`${mount} ${
                isMulti ? 'multi' : 'single'
              } channel pipette moving to slot ${slotNumber}`}
            >
              <source src={demoAsset} />
            </video>
          </Box>
        </Flex>
        <JogControls
          jog={jog}
          stepSizes={[SMALL_STEP_SIZE_MM, MEDIUM_STEP_SIZE_MM]}
        />
        <Box alignSelf={ALIGN_FLEX_END} marginTop={SPACING.spacing4}>
          {confirmLink}
        </Box>
        <Flex
          width="100%"
          marginTop={SPACING.spacing16}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <NeedHelpLink />
          <PrimaryButton onClick={savePoint}>
            {t('confirm_placement')}
          </PrimaryButton>
        </Flex>
      </Flex>
    )
  )
}
