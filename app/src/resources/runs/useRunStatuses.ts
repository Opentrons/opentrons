import {
  isIdleStatus,
  isRunningStatus,
  isTerminalRunStatus,
} from '/app/local-resources/runs/utils'
import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useCurrentRunId,
  useNotifyRunQuery,
} from '/app/resources/runs'

interface RunStatusesInfo {
  isRunStill: boolean
  isRunTerminal: boolean
  isRunIdle: boolean
  isRunRunning: boolean
}

export function useRunStatuses(): RunStatusesInfo {
  const currentRunId = useCurrentRunId()
  const { data: runRecord } = useNotifyRunQuery(currentRunId, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  const runStatus = runRecord?.data.status ?? null
  const isRunIdle = isIdleStatus(runStatus)
  const isRunRunning = isRunningStatus(runStatus)
  const isRunTerminal = isTerminalRunStatus(runStatus)
  const isRunStill = isIdleStatus(runStatus) || isTerminalRunStatus(runStatus)

  return { isRunStill, isRunTerminal, isRunIdle, isRunRunning }
}
