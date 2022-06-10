import {
  HostConfig,
  CurrentRobotName,
  getRobotName,
} from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useRobotName(): UseQueryResult<CurrentRobotName> {
  const host = useHost()
  const query = useQuery(
    [host, 'server/name'],
    () => getRobotName(host as HostConfig).then(response => response.data),
    {
      enabled: host !== null,
    }
  )

  return query
}
