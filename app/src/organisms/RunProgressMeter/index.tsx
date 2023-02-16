import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  COLORS,
  BORDERS,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  useAllCommandsQuery,
  useCommandQuery,
} from '@opentrons/react-api-client'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { StyledText } from '../../atoms/text'
import { CommandText } from '../CommandText'
import { useRunStatus } from '../RunTimeControl/hooks'
import { ProgressBar } from '../../atoms/ProgressBar'
import { useLastRunCommandKey } from '../Devices/hooks/useLastRunCommandKey'
import { InterventionTicks } from './InterventionTicks'

import type { RunStatus } from '@opentrons/api-client'

const TERMINAL_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
]

interface RunProgressMeterProps {
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
}
export function RunProgressMeter(props: RunProgressMeterProps): JSX.Element {
  const { runId, makeHandleJumpToStep } = props
  const { t } = useTranslation('run_details')
  const runStatus = useRunStatus(runId)
  const analysis = useMostRecentCompletedAnalysis(runId)
  const { data: allCommandsQueryData } = useAllCommandsQuery(runId)
  const analysisCommands = analysis?.commands ?? []
  const runCommands = allCommandsQueryData?.data ?? []

  /**
   * find the analysis command within the analysis
   * that has the same commandKey as the most recent
   * command from the run record. NOTE: the most recent
   * command may not always be "current", for instance if
   * the run has completed/failed */
  const lastRunCommandKey = useLastRunCommandKey(runId)
  const lastRunCommandIndex =
    analysisCommands.findIndex(c => c.key === lastRunCommandKey) ?? 0
  const lastRunCommandIndexFromAllCommands =
    runCommands.findIndex(c => c.key === lastRunCommandKey) ?? 0
  const { data: commandDetails } = useCommandQuery(
    runId,
    runCommands[lastRunCommandIndexFromAllCommands]?.id
  )
  let countOfTotalText = ''
  if (
    lastRunCommandIndex >= 0 &&
    lastRunCommandIndex <= analysisCommands.length - 1
  ) {
    countOfTotalText = ` ${lastRunCommandIndex + 1}/${analysisCommands.length}`
  } else if (lastRunCommandIndex === -1 && lastRunCommandKey != null) {
    countOfTotalText = `${lastRunCommandIndexFromAllCommands + 1}/?`
  } else if (analysis == null) {
    countOfTotalText = '?/?'
  }

  let currentStepContents: React.ReactNode = null
  if (analysis != null && analysisCommands[lastRunCommandIndex] != null) {
    currentStepContents = (
      <CommandText
        robotSideAnalysis={analysis}
        command={analysisCommands[lastRunCommandIndex]}
      />
    )
  } else if (
    analysis != null &&
    lastRunCommandIndex === -1 &&
    commandDetails != null
  ) {
    currentStepContents = (
      <CommandText robotSideAnalysis={analysis} command={commandDetails.data} />
    )
  } else if (
    runStatus === RUN_STATUS_IDLE &&
    analysisCommands[lastRunCommandIndex] == null
  ) {
    currentStepContents = (
      <StyledText as="h2">{t('not_started_yet')}</StyledText>
    )
  } else if (runStatus != null && TERMINAL_RUN_STATUSES.includes(runStatus)) {
    currentStepContents = (
      <StyledText as="h2">{t('protocol_completed')}</StyledText>
    )
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex gridGap={SPACING.spacing3}>
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{`${t(
            'current_step'
          )} ${countOfTotalText}${
            currentStepContents != null ? ': ' : ''
          }`}</StyledText>
          {currentStepContents}
        </Flex>
      </Flex>
      {analysis != null && lastRunCommandIndex >= 0 ? (
        <ProgressBar
          percentComplete={
            lastRunCommandIndex > 0
              ? ((lastRunCommandIndex + 1) / analysisCommands.length) * 100
              : 0
          }
          outerStyles={css`
            height: 0.375rem;
            background-color: ${COLORS.medGreyEnabled};
            border-radius: ${BORDERS.radiusSoftCorners};
            position: relative;
            overflow: initial;
          `}
          innerStyles={css`
            height: 0.375rem;
            background-color: ${COLORS.darkBlackEnabled};
            border-radius: ${BORDERS.radiusSoftCorners};
          `}
        >
          <InterventionTicks {...{ makeHandleJumpToStep, analysisCommands }} />
        </ProgressBar>
      ) : null}
    </Flex>
  )
}
