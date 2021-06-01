import * as React from 'react'
import { css } from 'styled-components'
import {
  Box,
  Flex,
  PrimaryBtn,
  Text,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  BORDER_SOLID_LIGHT,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_2,
  POSITION_RELATIVE,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_HEADER,
  SPACING_2,
  SPACING_3,
  SPACING_4,
} from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import { JogControls, VERTICAL_PLANE } from '../../molecules/JogControls'
import type { Axis, Sign, StepSize } from '../../molecules/JogControls/types'
import type { CalibrationPanelProps } from '../CalibrationPanels/types'

import { NeedHelpLink } from './NeedHelpLink'
import { useConfirmCrashRecovery } from './useConfirmCrashRecovery'
import { formatJogVector } from '../CalibrationPanels/utils'
import leftMultiBlockAssetTLC from '../../assets/videos/tip-length-cal/Left_Multi_CalBlock_WITH_TIP_(330x260)REV1.webm'
import leftMultiTrashAsset from '../../assets/videos/tip-length-cal/Left_Multi_Trash_WITH_TIP_(330x260)REV1.webm'
import leftSingleBlockAssetTLC from '../../assets/videos/tip-length-cal/Left_Single_CalBlock_WITH_TIP_(330x260)REV1.webm'
import leftSingleTrashAsset from '../../assets/videos/tip-length-cal/Left_Single_Trash_WITH_TIP_(330x260)REV1.webm'
import rightMultiBlockAssetTLC from '../../assets/videos/tip-length-cal/Right_Multi_CalBlock_WITH_TIP_(330x260)REV1.webm'
import rightMultiTrashAsset from '../../assets/videos/tip-length-cal/Right_Multi_Trash_WITH_TIP_(330x260)REV1.webm'
import rightSingleBlockAssetTLC from '../../assets/videos/tip-length-cal/Right_Single_CalBlock_WITH_TIP_(330x260)REV1.webm'
import rightSingleTrashAsset from '../../assets/videos/tip-length-cal/Right_Single_Trash_WITH_TIP_(330x260)REV1.webm'
import leftMultiBlockAssetHealth from '../../assets/videos/health-check/Left_Multi_CalBlock_WITH_TIP_(330x260)REV2.webm'
import rightMultiBlockAssetHealth from '../../assets/videos/health-check/Right_Multi_CalBlock_WITH_TIP_(330x260)REV2.webm'
import leftSingleBlockAssetHealth from '../../assets/videos/health-check/Left_Single_CalBlock_WITH_TIP_(330x260)REV2.webm'
import rightSingleBlockAssetHealth from '../../assets/videos/health-check/Right_Single_CalBlock_WITH_TIP_(330x260)REV2.webm'

const assetMapTrash = {
  left: {
    multi: leftMultiTrashAsset,
    single: leftSingleTrashAsset,
  },
  right: {
    multi: rightMultiTrashAsset,
    single: rightSingleTrashAsset,
  },
}

const assetMapBlock = {
  tipLength: {
    left: {
      multi: leftMultiBlockAssetTLC,
      single: leftSingleBlockAssetTLC,
    },
    right: {
      multi: rightMultiBlockAssetTLC,
      single: rightSingleBlockAssetTLC,
    },
  },
  healthCheck: {
    left: {
      multi: leftMultiBlockAssetHealth,
      single: leftSingleBlockAssetHealth,
    },
    right: {
      multi: rightMultiBlockAssetHealth,
      single: rightSingleBlockAssetHealth,
    },
  },
}

const HEADER = 'Save the tip length'
const HEALTH_CHECK_HEADER = 'Check the tip length'
const JOG_UNTIL = 'Jog the robot until the tip is'
const BARELY_TOUCHING = 'barely touching (less than 0.1 mm)'
const THE = 'the'
const BLOCK = 'block in'
const FLAT_SURFACE = 'flat surface'
const OF_THE_TRASH_BIN = 'of the trash bin'
const SAVE_NOZZLE_Z_AXIS = 'Save the tip length'
const CHECK_NOZZLE_Z_AXIS = 'Check the tip length'
const SLOT = 'slot'

export function MeasureTip(props: CalibrationPanelProps): JSX.Element {
  const {
    sendCommands,
    calBlock,
    isMulti,
    mount,
    shouldPerformTipLength,
    sessionType,
  } = props

  const referencePointStr = calBlock ? (
    BLOCK
  ) : (
    <Text as="strong">{`${FLAT_SURFACE} `}</Text>
  )
  const referenceSlotStr = calBlock ? (
    <Text as="strong">{` ${SLOT} ${calBlock.slot}`}</Text>
  ) : (
    OF_THE_TRASH_BIN
  )

  const demoAsset = React.useMemo(
    () =>
      mount &&
      (calBlock
        ? assetMapBlock[
            sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
              ? 'healthCheck'
              : 'tipLength'
          ][mount][isMulti ? 'multi' : 'single']
        : assetMapTrash[mount][isMulti ? 'multi' : 'single']),
    [mount, isMulti, calBlock, sessionType]
  )

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    sendCommands({
      command: Sessions.sharedCalCommands.JOG,
      data: {
        vector: formatJogVector(axis, dir, step),
      },
    })
  }

  const isExtendedPipOffset =
    sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION &&
    shouldPerformTipLength
  const isHealthCheck =
    sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK

  const proceed = (): void => {
    isHealthCheck
      ? sendCommands(
          { command: Sessions.checkCommands.COMPARE_POINT },
          { command: Sessions.sharedCalCommands.MOVE_TO_DECK }
        )
      : isExtendedPipOffset
      ? sendCommands({ command: Sessions.sharedCalCommands.SAVE_OFFSET })
      : sendCommands(
          { command: Sessions.sharedCalCommands.SAVE_OFFSET },
          { command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK }
        )
  }

  const [confirmLink, confirmModal] = useConfirmCrashRecovery({
    requiresNewTip: true,
    ...props,
  })

  return (
    <>
      <Flex
        marginY={SPACING_2}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_FLEX_START}
        position={POSITION_RELATIVE}
        width="100%"
      >
        <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Text
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            fontSize={FONT_SIZE_HEADER}
          >
            {isHealthCheck ? HEALTH_CHECK_HEADER : HEADER}
          </Text>
          <NeedHelpLink />
        </Flex>
        <Box
          paddingX={SPACING_3}
          paddingY={SPACING_4}
          border={BORDER_SOLID_LIGHT}
          borderWidth="2px"
          width="100%"
        >
          <Flex alignItems={ALIGN_CENTER} width="100%">
            <Text width="49%" fontSize={FONT_SIZE_BODY_2}>
              {JOG_UNTIL}
              <Text as="strong">{` ${BARELY_TOUCHING} `}</Text>
              {`${THE} `}
              {referencePointStr}
              {referenceSlotStr}
              {`.`}
            </Text>
            <Box marginLeft={SPACING_3}>
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
            </Box>
          </Flex>
        </Box>
        <JogControls
          jog={jog}
          stepSizes={[0.1, 1]}
          planes={[VERTICAL_PLANE]}
          width="100%"
        />
        <Flex width="100%" justifyContent={JUSTIFY_CENTER} marginY={SPACING_3}>
          <PrimaryBtn title="saveTipLengthButton" onClick={proceed} flex="1">
            {isHealthCheck ? CHECK_NOZZLE_Z_AXIS : SAVE_NOZZLE_Z_AXIS}
          </PrimaryBtn>
        </Flex>
      </Flex>
      <Box width="100%">{confirmLink}</Box>
      {confirmModal}
    </>
  )
}
