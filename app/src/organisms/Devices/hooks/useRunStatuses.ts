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
  isLegacySessionInProgress: boolean
  isRunStill: boolean
  isRunTerminal: boolean
  isRunIdle: boolean
}

//  TODO:(jr, 6/27/22): rename this hook or turn it into a utility, rename to something that includes sessions
export function useRunStatuses(): RunStatusesInfo {
  const currentRunId = useCurrentRunId()
  const runStatus = useRunStatus(currentRunId)
  const isRunIdle = runStatus === RUN_STATUS_IDLE
  const isRunTerminal =
    runStatus === RUN_STATUS_SUCCEEDED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED

  const allSessionsQueryResponse = useAllSessionsQuery()

  const isLegacySessionInProgress =
    allSessionsQueryResponse?.data?.data != null &&
    allSessionsQueryResponse?.data?.data?.length !== 0

  const isRunStill =
    runStatus === RUN_STATUS_SUCCEEDED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED ||
    runStatus === RUN_STATUS_IDLE

  return { isLegacySessionInProgress, isRunStill, isRunTerminal, isRunIdle }
}
