import {
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { useAllSessionsQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useRunStatus } from '../../RunTimeControl/hooks'

export function useRunIncompleteOrLegacySessionInProgress(): boolean {
  const currentRunId = useCurrentRunId()
  const runStatus = useRunStatus(currentRunId)
  const isRunTerminal =
    runStatus === RUN_STATUS_SUCCEEDED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED
  const allSessionsQueryResponse = useAllSessionsQuery()

  return (
    !isRunTerminal ||
    (allSessionsQueryResponse?.data?.data != null &&
      allSessionsQueryResponse?.data?.data?.length !== 0)
  )
}
