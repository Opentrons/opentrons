import * as React from 'react'
import { css, keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  DIRECTION_ROW,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  BORDERS,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
} from '@opentrons/components'
import { RUN_STATUS_RUNNING, RUN_STATUS_IDLE } from '@opentrons/api-client'

import { StyledText } from '../../../atoms/text'
import { CommandText } from '../../CommandText'
import { RunTimer } from '../../Devices/ProtocolRun/RunTimer'
import { PlayPauseButton } from './PlayPauseButton'
import { StopButton } from './StopButton'
import {
  ANALYTICS_PROTOCOL_RUN_START,
  ANALYTICS_PROTOCOL_RUN_RESUME,
  ANALYTICS_PROTOCOL_RUN_PAUSE,
} from '../../../redux/analytics'

import type {
  CompletedProtocolAnalysis,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { RunStatus } from '@opentrons/api-client'
import type { TrackProtocolRunEvent } from '../../Devices/hooks'
import type { RobotAnalyticsData } from '../../../redux/analytics/types'

const fadeIn = keyframes`
from {
  opacity: 0;
  transform: translateY(100%);
}
to {
  opacity: 1;
  transform: translateY(0%);
}
`

const TITLE_TEXT_STYLE = css`
  color: ${COLORS.darkBlack70};
  font-size: 1.75rem;
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: 2.25rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  overflow-wrap: break-word;
  height: max-content;
`

const RUN_TIMER_STYLE = css`
  font-size: 2rem;
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  line-height: 2.625rem;
  color: ${COLORS.darkBlackEnabled};
`

const COMMAND_ROW_STYLE = css`
  font-size: 1.375rem;
  line-height: 1.75rem;
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  animation: ${fadeIn} 1.5s ease-in-out;
`

interface RunTimerInfo {
  runStatus: string | null
  startedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
}

interface CurrentRunningProtocolCommandProps {
  runStatus: RunStatus | null
  robotSideAnalysis: CompletedProtocolAnalysis | null
  runTimerInfo: RunTimerInfo
  playRun: () => void
  pauseRun: () => void
  setShowConfirmCancelRunModal: (showConfirmCancelRunModal: boolean) => void
  trackProtocolRunEvent: TrackProtocolRunEvent
  robotAnalyticsData: RobotAnalyticsData | null
  protocolName?: string
  currentRunCommandIndex?: number
}

export function CurrentRunningProtocolCommand({
  runStatus,
  robotSideAnalysis,
  runTimerInfo,
  playRun,
  pauseRun,
  setShowConfirmCancelRunModal,
  trackProtocolRunEvent,
  robotAnalyticsData,
  protocolName,
  currentRunCommandIndex,
}: CurrentRunningProtocolCommandProps): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const currentCommand = robotSideAnalysis?.commands.find(
    (c: RunTimeCommand, index: number) => index === currentRunCommandIndex
  )
  const currentRunStatus = t(`status_${runStatus}`)

  const onStop = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) pauseRun()
    setShowConfirmCancelRunModal(true)
  }

  const onTogglePlayPause = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) {
      pauseRun()
      trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_PAUSE })
    } else {
      playRun()
      trackProtocolRunEvent({
        name:
          runStatus === RUN_STATUS_IDLE
            ? ANALYTICS_PROTOCOL_RUN_START
            : ANALYTICS_PROTOCOL_RUN_RESUME,
        properties:
          runStatus === RUN_STATUS_IDLE && robotAnalyticsData != null
            ? robotAnalyticsData
            : {},
      })
    }
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
      height="29.5rem"
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            fontSize={TYPOGRAPHY.fontSize28}
            lineHeight={TYPOGRAPHY.lineHeight36}
            fontWeight={TYPOGRAPHY.fontWeightBold}
          >
            {currentRunStatus}
          </StyledText>
          <StyledText css={TITLE_TEXT_STYLE}>{protocolName}</StyledText>
        </Flex>
        <RunTimer {...runTimerInfo} style={RUN_TIMER_STYLE} />
      </Flex>

      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing24}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <StopButton onStop={onStop} />
        <PlayPauseButton
          onTogglePlayPause={onTogglePlayPause}
          runStatus={runStatus}
        />
      </Flex>
      <Flex
        padding={`${SPACING.spacing12} ${SPACING.spacing24}`}
        backgroundColor={COLORS.mediumBlueEnabled}
        borderRadius={BORDERS.size2}
        justifyContent={JUSTIFY_CENTER}
        css={COMMAND_ROW_STYLE}
      >
        {robotSideAnalysis != null && currentCommand != null ? (
          <CommandText
            command={currentCommand}
            robotSideAnalysis={robotSideAnalysis}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
