import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

export function useRunStartedOrLegacySessionInProgress(): boolean {
  const runId = useCurrentRunId()
  const runStatus = useRunStatus(runId)
  const allSessionsQueryResponse = useAllSessionsQuery()

  return (
    (runStatus != null && runStatus !== RUN_STATUS_IDLE) ||
    (allSessionsQueryResponse?.data?.data != null &&
      allSessionsQueryResponse?.data?.data?.length !== 0)
  )
}
