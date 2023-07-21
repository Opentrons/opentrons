import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { ViewportList, ViewportListRef } from 'react-viewport-list'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_HIDDEN,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { RUN_STATUS_RUNNING, RUN_STATUS_IDLE } from '@opentrons/api-client'

import { StyledText } from '../../../atoms/text'
import { CommandText } from '../../CommandText'
import { CommandIcon } from '../../RunPreview/CommandIcon'
import { PlayPauseButton } from './PlayPauseButton'
import { StopButton } from './StopButton'
import {
  ANALYTICS_PROTOCOL_RUN_START,
  ANALYTICS_PROTOCOL_RUN_RESUME,
  ANALYTICS_PROTOCOL_RUN_PAUSE,
} from '../../../redux/analytics'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { RunStatus } from '@opentrons/api-client'
import type { TrackProtocolRunEvent } from '../../Devices/hooks'
import type { RobotAnalyticsData } from '../../../redux/analytics/types'

const TITLE_TEXT_STYLE = css`
  color: ${COLORS.darkBlack70};
  font-size: ${TYPOGRAPHY.fontSize28};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight36};
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
  height: max-content;
`

const COMMAND_ROW_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`

// Note (kj:05/15/2023)
// This blur part will be fixed before the launch
// const BOTTOM_ROW_STYLE = css`
//   position: ${POSITION_ABSOLUTE};
//   bottom: 0;
//   width: 100%;
//   height: 5rem;
//   z-index: 6;
//   backdrop-filter: blur(1.5px);
// `

interface RunningProtocolCommandListProps {
  runStatus: RunStatus | null
  robotSideAnalysis: CompletedProtocolAnalysis | null
  playRun: () => void
  pauseRun: () => void
  setShowConfirmCancelRunModal: (showConfirmCancelRunModal: boolean) => void
  trackProtocolRunEvent: TrackProtocolRunEvent
  robotAnalyticsData: RobotAnalyticsData | null
  protocolName?: string
  currentRunCommandIndex?: number
}

export function RunningProtocolCommandList({
  runStatus,
  robotSideAnalysis,
  playRun,
  pauseRun,
  setShowConfirmCancelRunModal,
  trackProtocolRunEvent,
  robotAnalyticsData,
  protocolName,
  currentRunCommandIndex,
}: RunningProtocolCommandListProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const viewPortRef = React.useRef<HTMLDivElement | null>(null)
  const ref = React.useRef<ViewportListRef>(null)
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
        alignItems={ALIGN_FLEX_START}
        gridGap={SPACING.spacing40}
        height="6.75rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {currentRunStatus}
          </StyledText>
          <StyledText css={TITLE_TEXT_STYLE}>{protocolName}</StyledText>
        </Flex>
        <Flex height="100%" gridGap="1.5rem" alignItems={ALIGN_CENTER}>
          <StopButton onStop={onStop} buttonSize="6.26rem" iconSize="2.5rem" />
          <PlayPauseButton
            onTogglePlayPause={onTogglePlayPause}
            buttonSize="6.25rem"
            runStatus={runStatus}
            iconSize="2.5rem"
          />
        </Flex>
      </Flex>
      {robotSideAnalysis != null ? (
        <Flex
          ref={viewPortRef}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          height="20.25rem"
          position={POSITION_RELATIVE}
          overflow={OVERFLOW_HIDDEN}
        >
          <ViewportList
            viewportRef={viewPortRef}
            ref={ref}
            items={robotSideAnalysis?.commands}
            initialIndex={currentRunCommandIndex}
            margin={0}
          >
            {(command, index) => {
              const backgroundColor =
                index === currentRunCommandIndex
                  ? COLORS.mediumBlueEnabled
                  : COLORS.light1
              return (
                <Flex
                  key={command.id}
                  alignItems={ALIGN_CENTER}
                  gridGap={SPACING.spacing8}
                >
                  <Flex
                    padding={`${SPACING.spacing12} ${SPACING.spacing24}`}
                    alignItems={ALIGN_CENTER}
                    backgroundColor={backgroundColor}
                    width="100%"
                    fontSize="1.375rem"
                    lineHeight="1.75rem"
                    fontWeight={TYPOGRAPHY.fontWeightRegular}
                    borderRadius={BORDERS.borderRadiusSize2}
                  >
                    <CommandIcon command={command} />
                    <CommandText
                      command={command}
                      robotSideAnalysis={robotSideAnalysis}
                      css={COMMAND_ROW_STYLE}
                    />
                  </Flex>
                </Flex>
              )
            }}
          </ViewportList>
          {/* <Flex css={BOTTOM_ROW_STYLE}></Flex> */}
        </Flex>
      ) : null}
    </Flex>
  )
}
