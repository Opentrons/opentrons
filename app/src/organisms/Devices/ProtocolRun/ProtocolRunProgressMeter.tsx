import * as React from 'react'
import last from 'lodash/last'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { RunProgressMeter } from '../RunProgressMeter'
import { useAllCommandsQuery, useRunQuery } from '@opentrons/react-api-client'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { RUN_STATUS_BLOCKED_BY_OPEN_DOOR, RUN_STATUS_FINISHING, RUN_STATUS_IDLE, RUN_STATUS_PAUSED, RUN_STATUS_PAUSE_REQUESTED, RUN_STATUS_RUNNING, RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'

const MIN_AGGREGATION_PERCENT = 8
const LIVE_RUN_STATUSES = [RUN_STATUS_IDLE, RUN_STATUS_PAUSED, RUN_STATUS_PAUSE_REQUESTED, RUN_STATUS_STOP_REQUESTED, RUN_STATUS_RUNNING, RUN_STATUS_FINISHING, RUN_STATUS_BLOCKED_BY_OPEN_DOOR]
const TICKED_COMMAND_TYPES = ['waitForResume', 'moveLabware', 'dropTip']
const LIVE_RUN_COMMANDS_POLL_MS = 3000
interface ProtocolRunProgressMeterProps {
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
}
export function ProtocolRunProgressMeter(props: ProtocolRunProgressMeterProps) {
  const { runId, makeHandleJumpToStep } = props
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

  const analysisCommands = useMostRecentCompletedAnalysis(runId)?.commands ?? []
  const currentRunCommandIndex = analysisCommands.findIndex(c => c.key === currentCommandKey) ?? 0
  const commandBufferCount = analysisCommands.length * 0.01 * MIN_AGGREGATION_PERCENT
  const ticks = analysisCommands.reduce<Array<{ index: number, count: number }>>((acc, c, index) => {
    if (TICKED_COMMAND_TYPES.includes(c.commandType)) {
      const mostRecentTick = last(acc)
      if (mostRecentTick == null) {
        return [...acc, { index, count: 1 }]
      } else if ((index - mostRecentTick.index) > commandBufferCount) {
        return [...acc, { index, count: 1 }]
      } else {
        return [...acc.slice(0, -1), { index: mostRecentTick.index, count: mostRecentTick.count + 1 }]
      }
    }
    return acc
  }, [])

  return <RunProgressMeter {...{ ticks, makeHandleJumpToStep, analysisCommands, currentRunCommandIndex }} />
}
