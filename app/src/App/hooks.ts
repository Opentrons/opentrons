import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useInterval } from '@opentrons/components'
import { checkShellUpdate } from '../redux/shell'
import { useCurrentRunId } from '../organisms/ProtocolUpload/hooks'

import type { Dispatch } from '../redux/types'
import { useRunQuery } from '@opentrons/react-api-client'
import { 
  RUN_ACTION_TYPE_PLAY,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED
} from '@opentrons/api-client'

const CURRENT_RUN_POLL = 5000
const UPDATE_RECHECK_INTERVAL_MS = 60000

export function useSoftwareUpdatePoll(): void {
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  useInterval(checkAppUpdate, UPDATE_RECHECK_INTERVAL_MS)
}

export function useCurrentRunRoute(): string | null {
  const currentRunId = useCurrentRunId({ refetchInterval: CURRENT_RUN_POLL })

  const runRecord = useRunQuery(currentRunId, { enabled: currentRunId != null })
  const status = runRecord.data?.data?.status
  const actions = runRecord.data?.data?.actions
  if (status == null || actions == null || currentRunId == null) return null

  const hasBeenStarted = actions?.some(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  if (status === RUN_STATUS_SUCCEEDED ||
    status === RUN_STATUS_STOPPED ||
    status === RUN_STATUS_FAILED) {
    return `/runs/${currentRunId}/summary`
  } else if (status === RUN_STATUS_IDLE || (!hasBeenStarted && status === RUN_STATUS_BLOCKED_BY_OPEN_DOOR)) {
    return `/runs/${currentRunId}/setup`
  } else {
    return `/runs/${currentRunId}/run`
  }
}


