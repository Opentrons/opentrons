import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { checkIsRobotBusy } from '../RobotSettings/AdvancedTab/utils'

export function useIsRobotBusy(): boolean {
  const isRobotBusy = useCurrentRunId() !== null
  const allSessionsQueryResponse = useAllSessionsQuery()
  const isBusy = checkIsRobotBusy(allSessionsQueryResponse, isRobotBusy)

  return isBusy
}
