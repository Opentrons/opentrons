import * as React from 'react'
import { Flex, DIRECTION_COLUMN, JUSTIFY_SPACE_BETWEEN, TYPOGRAPHY, SPACING } from '@opentrons/components'
import last from 'lodash/last'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { RunProgressMeter } from '../RunProgressMeter'
import { useAllCommandsQuery, useRunQuery } from '@opentrons/react-api-client'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { RUN_STATUS_BLOCKED_BY_OPEN_DOOR, RUN_STATUS_FINISHING, RUN_STATUS_IDLE, RUN_STATUS_PAUSED, RUN_STATUS_PAUSE_REQUESTED, RUN_STATUS_RUNNING, RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'
import { StyledText } from '../../../atoms/text'
import { useTranslation } from 'react-i18next'
import { AnalysisStepText } from '../../AnalysisStepText'

const MIN_AGGREGATION_PERCENT = 0.6
const LIVE_RUN_STATUSES = [RUN_STATUS_IDLE, RUN_STATUS_PAUSED, RUN_STATUS_PAUSE_REQUESTED, RUN_STATUS_STOP_REQUESTED, RUN_STATUS_RUNNING, RUN_STATUS_FINISHING, RUN_STATUS_BLOCKED_BY_OPEN_DOOR]
const TICKED_COMMAND_TYPES = [
  'waitForResume',
  'moveLabware',
  // 'loadLabware',
  // 'loadPipette',
  // 'aspirate',
]
const LIVE_RUN_COMMANDS_POLL_MS = 3000
interface ProtocolRunProgressMeterProps {
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
}
export function ProtocolRunProgressMeter(props: ProtocolRunProgressMeterProps) {
  const { runId, makeHandleJumpToStep } = props
  const { t } = useTranslation('run_details')
  const runStatus = useRunStatus(runId)
  const { data: commandsData } = useAllCommandsQuery(
    runId,
    { cursor: 0, pageLength: 0 },
    {
      refetchInterval: runStatus != null && LIVE_RUN_STATUSES.includes(runStatus) ? LIVE_RUN_COMMANDS_POLL_MS : Infinity,
      keepPreviousData: true,
    }
  )
  const currentCommandKey = commandsData?.links?.current?.meta?.key ?? null

  const analysis = useMostRecentCompletedAnalysis(runId)
  const analysisCommands = analysis?.commands ?? []
  const currentRunCommandIndex = analysisCommands.findIndex(c => c.key === currentCommandKey) ?? 0
  const commandAggregationCount = analysisCommands.length > 100 ? analysisCommands.length * 0.01 * MIN_AGGREGATION_PERCENT : 0
  const ticks = analysisCommands.reduce<Array<{ index: number, count: number, range: number }>>((acc, c, index) => {
    if (TICKED_COMMAND_TYPES.includes(c.commandType)) {
      const mostRecentTick = last(acc)
      if (mostRecentTick == null) {
        return [...acc, { index, count: 1, range: 1 }]
      } else if ((index - mostRecentTick.index) > commandAggregationCount) {
        return [...acc, { index, count: 1, range: 1 }]
      } else {
        return [
          ...acc.slice(0, -1),
          {
            index: mostRecentTick.index,
            count: mostRecentTick.count + 1,
            range: index - mostRecentTick.index
          }
        ]
      }
    }
    return acc
  }, [])
  const countOfTotalText = currentRunCommandIndex < 0 || currentRunCommandIndex === analysisCommands.length - 1 ? '' : ` ${currentRunCommandIndex + 1}/${analysisCommands.length}`

  const hasCurrentCommand = analysis != null && analysisCommands[currentRunCommandIndex] != null
  const statusPlaceholder = runStatus === RUN_STATUS_IDLE && !hasCurrentCommand ? t('not_started_yet') : t('protocol_completed')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex gridGap={SPACING.spacing3}>
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{`${t('current_step')}${countOfTotalText}: `}</StyledText>
          <StyledText as="h2">
            {hasCurrentCommand
              ? <AnalysisStepText robotSideAnalysis={analysis} command={analysisCommands[currentRunCommandIndex]} />
              : statusPlaceholder}
          </StyledText>
        </Flex>
      </Flex>
      <RunProgressMeter {...{ ticks, makeHandleJumpToStep, analysisCommands, currentRunCommandIndex }} />
    </Flex>
  )
}
