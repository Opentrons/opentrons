import {
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { useAllSessionsQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useRunStatus } from '../../RunTimeControl/hooks'

interface RunStatusesInfo {
  isRunIncomplete: boolean
  isRunStill: boolean
  isRunTerminal: boolean
}

export function useRunStatuses(): RunStatusesInfo {
  const currentRunId = useCurrentRunId()
  const runStatus = useRunStatus(currentRunId)
  const isRunTerminal =
    runStatus === RUN_STATUS_SUCCEEDED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED

  const allSessionsQueryResponse = useAllSessionsQuery()

  const isRunIncomplete =
    !isRunTerminal ||
    (allSessionsQueryResponse?.data?.data != null &&
      allSessionsQueryResponse?.data?.data?.length !== 0)

  const isRunStill =
    runStatus === RUN_STATUS_SUCCEEDED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED ||
    runStatus === RUN_STATUS_IDLE

  return { isRunIncomplete, isRunStill, isRunTerminal }
}
