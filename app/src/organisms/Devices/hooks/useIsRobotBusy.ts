import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { useCurrentRunId } from '../../ProtocolUpload/hooks'

export function useIsRobotBusy(): boolean {
  const robotHasCurrentRun = useCurrentRunId() !== null
  const allSessionsQueryResponse = useAllSessionsQuery()
  return (
    robotHasCurrentRun ||
    (allSessionsQueryResponse?.data?.data != null &&
      allSessionsQueryResponse?.data?.data?.length !== 0)
  )
}
