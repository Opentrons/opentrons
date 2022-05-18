import { UseQueryResult } from 'react-query'
import { Sessions } from '@opentrons/api-client'

export const checkIsRobotBusy = (
  allSessionsQueryResponse: UseQueryResult<Sessions, Error>,
  isRobotBusy: boolean
): boolean => {
  // check robot is busy or there is a session => not allow to change the setting
  const data =
    allSessionsQueryResponse.data != null ? allSessionsQueryResponse.data : {}
  return !(!isRobotBusy && Object.keys(data).length !== 0)
}
