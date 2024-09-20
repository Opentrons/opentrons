import { RUN_STATUSES_TERMINAL } from '@opentrons/api-client'

import { useNotifyAllCommandsQuery, useRunStatus } from '/app/resources/runs'

import type { UseQueryOptions } from 'react-query'
import type {
  CommandsData,
  RunCommandSummary,
  RunStatus,
} from '@opentrons/api-client'

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
        runStatus != null && runIsLive(runStatus)
          ? options.refetchInterval ?? LIVE_RUN_COMMANDS_POLL_MS
          : Infinity,
    }
  )

  return commandsData?.data?.[0]?.intent !== 'setup'
    ? commandsData?.data?.[0] ?? null
    : null
}

function runIsLive(runStatus: RunStatus): boolean {
  return !(RUN_STATUSES_TERMINAL as RunStatus[]).includes(runStatus)
}
