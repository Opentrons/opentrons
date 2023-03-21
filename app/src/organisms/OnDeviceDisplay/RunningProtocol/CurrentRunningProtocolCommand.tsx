import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

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

import { StyledText } from '../../../atoms/text'
import { CommandText } from '../../CommandText'
import { RunTimer } from '../../Devices/ProtocolRun/ProtocolRunHeader'

import type {
  CompletedProtocolAnalysis,
  RunTimeCommand,
} from '@opentrons/shared-data'

const RUN_TIMER_STYLE = css`
  font-size: 2rem;
  font-weight: 700;
  line-height: 2.625rem;
  color: ${COLORS.darkBlackEnabled};
`

const CURRENT_COMMAND_STYLE = css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;=
  text-align: ${TYPOGRAPHY.textAlignCenter}
  font-size: 1.375rem;
  line-height: 1.75rem;
  font-weight: ${TYPOGRAPHY.fontWeightRegular}
`

interface RunTimerInfo {
  runStatus: string | null
  startedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
}

interface CurrentRunningProtocolCommandProps {
  currentRunStatus: string
  protocolName?: string
  playRun: () => void
  pauseRun: () => void
  stopRun: () => void
  currentRunCommandIndex?: number
  robotSideAnalysis: CompletedProtocolAnalysis | null
  runTimerInfo: RunTimerInfo
}

export function CurrentRunningProtocolCommand({
  currentRunStatus,
  protocolName,
  currentRunCommandIndex,
  robotSideAnalysis,
  runTimerInfo,
}: // runId,
CurrentRunningProtocolCommandProps): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const currentCommand = robotSideAnalysis?.commands.find(
    (c: RunTimeCommand, index: number) => index === currentRunCommandIndex
  )

  const onStop = (): void => {
    console.log('stop the running')
  }

  const onPause = (): void => {
    console.log('stop the running')
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
          <StyledText
            color={COLORS.darkBlack_seventy}
            fontSize="1.75rem"
            lineHeight="2.25rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {protocolName}
          </StyledText>
        </Flex>
        <RunTimer {...runTimerInfo} onDeviceStyle={RUN_TIMER_STYLE} />
      </Flex>

      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing5}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        {/* <Btn height="12.5rem" width="12.5rem">
          <Icon name="close-circle" size="100%" color={COLORS.red_two} />
        </Btn> */}
        <StopButton onStop={onStop} />
        <PauseButton onPause={onPause} />
        {/* <Btn height="12.5rem" width="12.5rem">
          <Icon name="pause-circle" size="100%" color={COLORS.blueEnabled} />
        </Btn> */}
      </Flex>
      {/* <StyledText>{runId}</StyledText> */}
      <Flex
        padding={`0.75rem ${SPACING.spacing5}`}
        backgroundColor={COLORS.foundationalBlue}
        borderRadius={BORDERS.size_two}
      >
        {robotSideAnalysis != null && currentCommand != null ? (
          <CommandText
            command={currentCommand}
            robotSideAnalysis={robotSideAnalysis}
            /* fontSize="1.375rem"
            lineHeight="1.75rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            textAlign={TYPOGRAPHY.textAlignCenter} */
            css={CURRENT_COMMAND_STYLE}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}

interface StopButtonProps {
  onStop: () => void
}
const StopButton = ({ onStop }: StopButtonProps): JSX.Element => {
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.red_two}
      borderRadius="50%"
      display={DISPLAY_FLEX}
      height="12.5rem"
      justifyContent={JUSTIFY_CENTER}
      width="12.5rem"
      // onClick={onClose}
      aria-label="close"
    >
      <Icon name="close" color={COLORS.white} size="10rem" />
    </Btn>
  )
}

interface PauseButtonProps {
  onPause: () => void
}
const PauseButton = ({ onPause }: PauseButtonProps): JSX.Element => {
  return (
    <Btn
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.blueEnabled}
      borderRadius="50%"
      display={DISPLAY_FLEX}
      height="12.5rem"
      justifyContent={JUSTIFY_CENTER}
      width="12.5rem"
      // onClick={onPause}
      aria-label="pause"
    >
      <Icon name="pause" color={COLORS.white} size="5rem" />
    </Btn>
  )
}
