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

import * as Sessions from '/app/redux/sessions'
import {
  JogControls,
  MEDIUM_STEP_SIZE_MM,
  SMALL_STEP_SIZE_MM,
} from '/app/molecules/JogControls'
import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'
import { useConfirmCrashRecovery } from './useConfirmCrashRecovery'
import { formatJogVector } from './utils'

import leftMultiBlockAssetTLC from '/app/assets/videos/tip-length-cal/Left_Multi_CalBlock_WITH_TIP_(330x260)REV1.webm'
import leftMultiTrashAsset from '/app/assets/videos/tip-length-cal/Left_Multi_Trash_WITH_TIP_(330x260)REV1.webm'
import leftSingleBlockAssetTLC from '/app/assets/videos/tip-length-cal/Left_Single_CalBlock_WITH_TIP_(330x260)REV1.webm'
import leftSingleTrashAsset from '/app/assets/videos/tip-length-cal/Left_Single_Trash_WITH_TIP_(330x260)REV1.webm'
import rightMultiBlockAssetTLC from '/app/assets/videos/tip-length-cal/Right_Multi_CalBlock_WITH_TIP_(330x260)REV1.webm'
import rightMultiTrashAsset from '/app/assets/videos/tip-length-cal/Right_Multi_Trash_WITH_TIP_(330x260)REV1.webm'
import rightSingleBlockAssetTLC from '/app/assets/videos/tip-length-cal/Right_Single_CalBlock_WITH_TIP_(330x260)REV1.webm'
import rightSingleTrashAsset from '/app/assets/videos/tip-length-cal/Right_Single_Trash_WITH_TIP_(330x260)REV1.webm'
import leftMultiBlockAssetHealth from '/app/assets/videos/health-check/Left_Multi_CalBlock_WITH_TIP_(330x260)REV2.webm'
import rightMultiBlockAssetHealth from '/app/assets/videos/health-check/Right_Multi_CalBlock_WITH_TIP_(330x260)REV2.webm'
import leftSingleBlockAssetHealth from '/app/assets/videos/health-check/Left_Single_CalBlock_WITH_TIP_(330x260)REV2.webm'
import rightSingleBlockAssetHealth from '/app/assets/videos/health-check/Right_Single_CalBlock_WITH_TIP_(330x260)REV2.webm'

import type { Mount } from '@opentrons/components'
import type { Axis, Sign, StepSize } from '/app/molecules/JogControls/types'
import type { CalibrationPanelProps } from './types'

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

const assetMapBlock: {
  [sessionType in Sessions.SessionType]?: {
    [mount in Mount]: { [channels in 'multi' | 'single']: string }
  }
} = {
  [Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION]: {
    left: {
      multi: leftMultiBlockAssetTLC,
      single: leftSingleBlockAssetTLC,
    },
    right: {
      multi: rightMultiBlockAssetTLC,
      single: rightSingleBlockAssetTLC,
    },
  },
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]: {
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

export function MeasureTip(props: CalibrationPanelProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const { sendCommands, calBlock, isMulti, mount, sessionType } = props

  const demoAsset = useMemo(
    () =>
      calBlock != null
        ? assetMapBlock[sessionType]?.[mount]?.[isMulti ? 'multi' : 'single']
        : assetMapTrash[mount]?.[isMulti ? 'multi' : 'single'],
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

  const isHealthCheck =
    sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK

  const proceed = (): void => {
    isHealthCheck
      ? sendCommands(
          { command: Sessions.checkCommands.COMPARE_POINT },
          { command: Sessions.sharedCalCommands.MOVE_TO_DECK }
        )
      : sendCommands(
          { command: Sessions.sharedCalCommands.SAVE_OFFSET },
          { command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK }
        )
  }

  const [confirmLink, crashRecoveryConfirmation] = useConfirmCrashRecovery(
    props
  )

  let titleText =
    calBlock != null ? t('calibrate_tip_on_block') : t('calibrate_tip_on_trash')
  if (isHealthCheck) {
    titleText =
      calBlock != null ? t('check_tip_on_block') : t('check_tip_on_trash')
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
              {titleText}
            </LegacyStyledText>
            <LegacyStyledText as="p">
              {calBlock != null
                ? t('jog_nozzle_to_block', { slotName: calBlock.slot })
                : t('jog_nozzle_to_trash')}
            </LegacyStyledText>
          </Flex>
          <Box flex="1">
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
          <PrimaryButton onClick={proceed}>
            {t('confirm_placement')}
          </PrimaryButton>
        </Flex>
      </Flex>
    )
  )
}
