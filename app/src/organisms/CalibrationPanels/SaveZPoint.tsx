import * as React from 'react'
import { css } from 'styled-components'
import { Trans, useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  SPACING,
  ALIGN_STRETCH,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_END,
} from '@opentrons/components'

import * as Sessions from '../../redux/sessions'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'
import { JogControls, VERTICAL_PLANE } from '../../molecules/JogControls'
import { formatJogVector } from './utils'
import { useConfirmCrashRecovery } from './useConfirmCrashRecovery'
import { NeedHelpLink } from './NeedHelpLink'

import slot5LeftMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_5_LEFT_MULTI_Z.webm'
import slot5LeftSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_5_LEFT_SINGLE_Z.webm'
import slot5RightMultiDemoAsset from '../../assets/videos/cal-movement/SLOT_5_RIGHT_MULTI_Z.webm'
import slot5RightSingleDemoAsset from '../../assets/videos/cal-movement/SLOT_5_RIGHT_SINGLE_Z.webm'

import type { Axis, Sign, StepSize } from '../../molecules/JogControls/types'
import type { CalibrationPanelProps } from './types'

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

export function SaveZPoint(props: CalibrationPanelProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const { isMulti, mount, sendCommands, sessionType } = props
  const demoAsset = React.useMemo(
    () => mount && assetMap[mount][isMulti ? 'multi' : 'single'],
    [mount, isMulti]
  )

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    sendCommands({
      command: Sessions.sharedCalCommands.JOG,
      data: {
        vector: formatJogVector(axis, dir, step),
      },
    })
  }

  const proceed = () => {
    sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
      ? sendCommands(
          { command: Sessions.checkCommands.COMPARE_POINT },
          { command: Sessions.sharedCalCommands.MOVE_TO_POINT_ONE }
        )
      : sendCommands(
          { command: Sessions.sharedCalCommands.SAVE_OFFSET },
          { command: Sessions.sharedCalCommands.MOVE_TO_POINT_ONE }
        )
  }

  const [confirmLink, confirmModal] = useConfirmCrashRecovery({
    requiresNewTip: true,
    ...props,
  })

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="32rem"
    >
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignSelf={ALIGN_STRETCH}
        gridGap={SPACING.spacing3}
      >
        <Flex flexDirection={DIRECTION_COLUMN} flex="1">
          <StyledText as="h1" marginBottom={SPACING.spacing4}>
            {t('calibrate_z_axis')}
          </StyledText>
          <Trans
            t={t}
            i18nKey="jog_pipette_to_touch_slot"
            components={{
              block: <StyledText as="p" marginBottom={SPACING.spacing3} />,
            }}
          />
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
        stepSizes={[0.1, 1]}
        initialPlane={VERTICAL_PLANE}
      />
      <Box alignSelf={ALIGN_FLEX_END} marginTop={SPACING.spacing2}>
        {confirmLink}
      </Box>
      <Flex
        width="100%"
        marginTop={SPACING.spacing4}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <NeedHelpLink />
        <PrimaryButton onClick={proceed()}>
          {t('confirm_placement')}
        </PrimaryButton>
      </Flex>
      {confirmModal}
    </Flex>
  )
}
