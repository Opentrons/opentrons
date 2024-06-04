import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FINISHING,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

import { useNotifyAllCommandsQuery } from '../../../resources/runs'
import { useRunStatus } from '../../RunTimeControl/hooks'

import type { UseQueryOptions } from 'react-query'
import type { CommandsData, RunCommandSummary } from '@opentrons/api-client'

const LIVE_RUN_STATUSES = [
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_FINISHING,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY,
]
const LIVE_RUN_COMMANDS_POLL_MS = 3000

export function useLastRunCommand(
  runId: string,
  options: UseQueryOptions<CommandsData, Error> = {}
): RunCommandSummary | null {
  const runStatus = useRunStatus(runId)
  const { data: commandsData } = useNotifyAllCommandsQuery(
    runId,
    { cursor: null, pageLength: 1 },
    {
      ...options,
      refetchInterval:
        runStatus != null && LIVE_RUN_STATUSES.includes(runStatus)
          ? options.refetchInterval ?? LIVE_RUN_COMMANDS_POLL_MS
          : Infinity,
    }
  )

  return commandsData?.data?.[0]?.intent !== 'setup'
    ? commandsData?.data?.[0] ?? null
    : null
}
