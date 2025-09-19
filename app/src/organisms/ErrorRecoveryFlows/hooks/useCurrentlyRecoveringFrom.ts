import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
} from '@opentrons/api-client'
import { useCommandQuery, useHost } from '@opentrons/react-api-client'

import { useNotifyAllCommandsQuery } from '/app/resources/runs'

import type { RunStatus } from '@opentrons/api-client'
import type { FailedCommand } from '../types'

const ALL_COMMANDS_POLL_MS = 5000

// TODO(jh, 08-06-24): See EXEC-656.
const VALID_RECOVERY_FETCH_STATUSES = [
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
] as Array<RunStatus | null>

// Return the `currentlyRecoveringFrom` command returned by the server, if any.
// The command will only be returned after the initial fetches are complete to prevent rendering of stale data.
export function useCurrentlyRecoveringFrom(
  runId: string,
  runStatus: RunStatus | null
): FailedCommand | null {
  const queryClient = useQueryClient()
  const host = useHost()
  const [isReadyToShow, setIsReadyToShow] = useState(false)

  // There can only be a currentlyRecoveringFrom command when the run is in recovery mode.
  // In case we're falling back to polling, only enable queries when that is the case.
  const isRunInRecoveryMode = VALID_RECOVERY_FETCH_STATUSES.includes(runStatus)

  // Prevent stale data on subsequent recoveries by clearing the query cache at the start of each recovery.
  useEffect(() => {
    if (isRunInRecoveryMode) {
      void queryClient.invalidateQueries([host, 'runs', runId])
    } else {
      setIsReadyToShow(false)
    }
  }, [isRunInRecoveryMode, host, runId])

  const {
    data: allCommandsQueryData,
    isFetching: isAllCommandsFetching,
  } = useNotifyAllCommandsQuery(
    runId,
    { pageLength: 0 }, // pageLength 0 because we only care about the links.
    {
      enabled: isRunInRecoveryMode,
      refetchInterval: ALL_COMMANDS_POLL_MS,
    }
  )
  const currentlyRecoveringFromLink =
    allCommandsQueryData?.links.currentlyRecoveringFrom

  // TODO(mm, 2024-05-21): When the server supports fetching the
  // currentlyRecoveringFrom command in one step, do that instead of this chained query.
  const {
    data: commandQueryData,
    isFetching: isCommandFetching,
  } = useCommandQuery(
    currentlyRecoveringFromLink?.meta.runId ?? null,
    currentlyRecoveringFromLink?.meta.commandId ?? null,
    {
      enabled: currentlyRecoveringFromLink != null && isRunInRecoveryMode,
    }
  )

  // Only mark as ready to show when waterfall fetches are complete
  useEffect(() => {
    if (
      isRunInRecoveryMode &&
      !isAllCommandsFetching &&
      !isCommandFetching &&
      !isReadyToShow
    ) {
      setIsReadyToShow(true)
    }
  }, [
    isRunInRecoveryMode,
    isAllCommandsFetching,
    isCommandFetching,
    isReadyToShow,
  ])

  const shouldShowCommand =
    isRunInRecoveryMode && isReadyToShow && commandQueryData?.data

  return shouldShowCommand ? commandQueryData.data : null
}
