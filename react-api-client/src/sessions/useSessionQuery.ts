import { getSession } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryResult } from 'react-query'
import type { HostConfig, Session } from '@opentrons/api-client'

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
