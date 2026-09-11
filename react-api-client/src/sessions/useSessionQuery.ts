import { useQuery } from 'react-query'

import { getSession } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryResult } from 'react-query'
import type { Session } from '@opentrons/api-client'

export function useSessionQuery(sessionId: string): UseQueryResult<Session> {
  const host = useHost()
  const query = useQuery(
    getQueryKey(host, 'session', sessionId),
    () => getSession(host!, sessionId).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
