import { useAllCommandsQuery, useHost } from '@opentrons/react-api-client'
import { useNotifyService } from './useNotifyService'
import {
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FINISHING,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

import { useRunStatus } from '../../organisms/RunTimeControl/hooks'

const LIVE_RUN_STATUSES = [
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_FINISHING,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
]
const LIVE_RUN_COMMANDS_POLL_MS = 3000

// TOME: This one is VERY up in the air until we decide on resource stuff.
export function useNotifyLastRunCommandKey(runId: string): string | null {
  const host = useHost()
  const runStatus = useRunStatus(runId)
  const queryKey = [host, 'runs', 'current_command']

  const { notifyQueryResponse, isNotifyError } = useNotifyService<string>({
    topic: 'robot-server/runs/current_command',
    queryKey: queryKey,
    forceHttpPolling: false,
  })
  const isUsingNotifyData = !isNotifyError

  const { data: commandsData } = useAllCommandsQuery(
    runId,
    { cursor: null, pageLength: 1 },
    {
      refetchInterval:
        runStatus != null && LIVE_RUN_STATUSES.includes(runStatus)
          ? LIVE_RUN_COMMANDS_POLL_MS
          : Infinity,
      enabled: !isUsingNotifyData,
    }
  )

  const httpResponse =
    commandsData?.data?.[0]?.intent !== 'setup'
      ? commandsData?.links?.current?.meta?.key ??
        commandsData?.data?.[0]?.key ??
        null
      : null

  return isUsingNotifyData ? notifyQueryResponse.data : httpResponse
}
