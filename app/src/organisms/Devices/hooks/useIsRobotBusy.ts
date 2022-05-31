import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { useCurrentRunId } from '../../ProtocolUpload/hooks'

export function useIsRobotBusy(): boolean {
  const robotHasCurrentRun = useCurrentRunId() !== null
  const allSessionsQueryResponse = useAllSessionsQuery()
  return (
    robotHasCurrentRun ||
    Object.keys(allSessionsQueryResponse?.data ?? {}).length !== 0
  )
}
