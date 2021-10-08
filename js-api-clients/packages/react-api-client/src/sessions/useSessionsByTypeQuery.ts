import {
  getSessions,
  HostConfig,
  Sessions,
  SessionType,
} from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useSessionsByTypeQuery(args: {
  sessionType: SessionType
}): UseQueryResult<Sessions> {
  const { sessionType } = args
  const host = useHost()
  const query = useQuery(
    ['session', host],
    () =>
      getSessions(host as HostConfig, {
        session_type: sessionType,
      }).then((response) => response.data),
    { enabled: host !== null, refetchInterval: 5000 }
  )

  return query
}
