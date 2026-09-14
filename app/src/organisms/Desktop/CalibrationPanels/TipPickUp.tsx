import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_FLEX_END,
  ALIGN_STRETCH,
  AnimationVideo,
  Box,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'

import multiDemoAsset from '/app/assets/videos/tip-pick-up/A1_Multi_Channel_REV1.webm'
import singleDemoAsset from '/app/assets/videos/tip-pick-up/A1_Single_Channel_REV1.webm'
import { JogControls } from '/app/molecules/JogControls'
import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'
import * as Sessions from '/app/redux/sessions'

import { useConfirmCrashRecovery } from './useConfirmCrashRecovery'
import { formatJogVector } from './utils'

import type { ReactNode } from 'react'
import type { Axis, Sign, StepSize } from '/app/molecules/JogControls/types'
import type { CalibrationPanelProps } from './types'

const ASSET_MAP = {
  multi: multiDemoAsset,
  single: singleDemoAsset,
}
export function TipPickUp(props: CalibrationPanelProps): ReactNode {
  const { t } = useTranslation('robot_calibration')
  const { sendCommands, isMulti } = props

  const demoAsset = ASSET_MAP[isMulti ? 'multi' : 'single']
  const pickUpTip = (): void => {
    sendCommands({ command: Sessions.sharedCalCommands.PICK_UP_TIP })
  }

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    sendCommands({
      command: Sessions.sharedCalCommands.JOG,
      data: {
        vector: formatJogVector(axis, dir, step),
      },
    })
  }
  const [confirmLink, crashRecoveryConfirmation] =
    useConfirmCrashRecovery(props)

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
            <LegacyStyledText forwardedAs="h1" marginBottom={SPACING.spacing16}>
              {t('position_pipette_over_tip')}
            </LegacyStyledText>
            <Trans
              t={t}
              i18nKey="tip_pick_up_instructions"
              components={{
                block: (
                  <LegacyStyledText
                    forwardedAs="p"
                    marginBottom={SPACING.spacing8}
                  />
                ),
              }}
            />
          </Flex>
          <Box flex="1">
            <AnimationVideo
              key={demoAsset}
              css={css`
                max-width: 100%;
                max-height: 15rem;
              `}
            >
              <source src={demoAsset} />
            </AnimationVideo>
          </Box>
        </Flex>
        <JogControls jog={jog} />
        <Box alignSelf={ALIGN_FLEX_END}>{confirmLink}</Box>
        <Flex
          width="100%"
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          marginTop={SPACING.spacing16}
        >
          <NeedHelpLink />
          <PrimaryButton onClick={pickUpTip}>{t('pick_up_tip')}</PrimaryButton>
        </Flex>
      </Flex>
    )
  )
}
