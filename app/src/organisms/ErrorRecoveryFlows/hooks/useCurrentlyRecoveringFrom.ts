import { RUN_STATUS_AWAITING_RECOVERY } from '@opentrons/api-client'
import { useCommandQuery } from '@opentrons/react-api-client'

import { useNotifyAllCommandsQuery } from '../../../resources/runs'

import type { RunStatus } from '@opentrons/api-client'
import type { FailedCommand } from '../types'

const ALL_COMMANDS_POLL_MS = 5000

// Return the `currentlyRecoveringFrom` command returned by the server, if any.
// Otherwise, returns null.
export function useCurrentlyRecoveringFrom(
  runId: string,
  runStatus: RunStatus | null
): FailedCommand | null {
  // There can only be a currentlyRecoveringFrom command when the run is awaiting-recovery.
  // In case we're falling back to polling, only enable queries when that is the case.
  const isRunStatusAwaitingRecovery = runStatus === RUN_STATUS_AWAITING_RECOVERY

  const { data: allCommandsQueryData } = useNotifyAllCommandsQuery(
    runId,
    { cursor: null, pageLength: 0 }, // pageLength 0 because we only care about the links.
    {
      enabled: isRunStatusAwaitingRecovery,
      refetchInterval: ALL_COMMANDS_POLL_MS,
    }
  )
  const currentlyRecoveringFromLink =
    allCommandsQueryData?.links.currentlyRecoveringFrom

  // TODO(mm, 2024-05-21): When the server supports fetching the
  // currentlyRecoveringFrom command in one step, do that instead of this chained query.
  const { data: commandQueryData } = useCommandQuery(
    currentlyRecoveringFromLink?.meta.runId ?? null,
    currentlyRecoveringFromLink?.meta.commandId ?? null,
    {
      enabled:
        currentlyRecoveringFromLink != null && isRunStatusAwaitingRecovery,
    }
  )

  return isRunStatusAwaitingRecovery ? commandQueryData?.data ?? null : null
}
