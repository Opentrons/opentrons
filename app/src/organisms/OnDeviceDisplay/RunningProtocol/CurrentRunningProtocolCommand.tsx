import * as React from 'react'
import { css, keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  DIRECTION_ROW,
  SPACING,
  Btn,
  Icon,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  BORDERS,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DISPLAY_FLEX,
} from '@opentrons/components'
import { RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { StyledText } from '../../../atoms/text'
import { CommandText } from '../../CommandText'
import { RunTimer } from '../../Devices/ProtocolRun/ProtocolRunHeader'
import { PlayPauseButton, StopButton } from './Buttons'

import type {
  CompletedProtocolAnalysis,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { RunStatus } from '@opentrons/api-client'
import type { TrackProtocolRunEvent } from '../../Devices/hooks'

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
  color: ${COLORS.darkBlack_seventy};
  font-size: 1.75rem;
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: 2.25rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  animation: ${fadeIn} 1.5s ease-in-out;
`

const RUN_TIMER_STYLE = css`
  font-size: 2rem;
  font-weight: 700;
  line-height: 2.625rem;
  color: ${COLORS.darkBlackEnabled};
`

const COMMAND_ROW_STYLE = css`
  font-size: 1.375rem;
  line-height: 1.75rem;
  font-weight: ${TYPOGRAPHY.fontWeightRegular}
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`

interface RunTimerInfo {
  runStatus: string | null
  startedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
}

interface CurrentRunningProtocolCommandProps {
  runId: string
  runStatus: RunStatus | null
  robotSideAnalysis: CompletedProtocolAnalysis | null
  runTimerInfo: RunTimerInfo
  playRun: () => void
  pauseRun: () => void
  stopRun: () => void
  trackProtocolRunEvent: TrackProtocolRunEvent
  protocolName?: string
  currentRunCommandIndex?: number
}

export function CurrentRunningProtocolCommand({
  runId, // may not need
  runStatus,
  robotSideAnalysis,
  runTimerInfo,
  playRun,
  pauseRun,
  stopRun,
  trackProtocolRunEvent,
  protocolName,
  currentRunCommandIndex,
}: CurrentRunningProtocolCommandProps): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const currentCommand = robotSideAnalysis?.commands.find(
    (c: RunTimeCommand, index: number) => index === currentRunCommandIndex
  )
  const currentRunStatus = t(`status_${runStatus}`)

  // const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId)

  const onStop = (): void => {
    console.log('stop run')
    stopRun() // from useRunActionMutations
    trackProtocolRunEvent({ name: 'runCancel', properties: { tbd: 'tbd' } })
  }

  const onTogglePlayPause = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) {
      pauseRun()
      // ToDo (kj:03/28/2023) update event information
      trackProtocolRunEvent({ name: 'runPause' })
    } else {
      playRun()
      // ToDo (kj:03/28/2023) update event information
      // robotAnalyticsData needs robotName

      // trackProtocolRunEvent({
      //   name: runStatus === RUN_STATUS_IDLE ? 'runStart' : 'runResume',
      //   properties:
      //     runStatus === RUN_STATUS_IDLE && robotAnalyticsData != null
      //       ? robotAnalyticsData
      //       : {},
      // })
    }
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacingXXL}
      height="29.5rem"
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText fontSize="1.75rem" lineHeight="2.25rem" fontWeight="700">
            {currentRunStatus}
          </StyledText>
          <StyledText css={TITLE_TEXT_STYLE}>{protocolName}</StyledText>
        </Flex>
        <RunTimer {...runTimerInfo} onDeviceStyle={RUN_TIMER_STYLE} />
      </Flex>

      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing5}
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
        padding={`0.75rem ${SPACING.spacing5}`}
        backgroundColor={COLORS.foundationalBlue}
        borderRadius={BORDERS.size_two}
        justifyContent={JUSTIFY_CENTER}
      >
        {robotSideAnalysis != null && currentCommand != null ? (
          <CommandText
            command={currentCommand}
            robotSideAnalysis={robotSideAnalysis}
            css={COMMAND_ROW_STYLE}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
