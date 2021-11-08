import { HostConfig, Session, getSession } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useSessionQuery(sessionId: string): UseQueryResult<Session> {
  const host = useHost()
  const query = useQuery(
    ['session', sessionId, host],
    () =>
      getSession(host as HostConfig, sessionId).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
