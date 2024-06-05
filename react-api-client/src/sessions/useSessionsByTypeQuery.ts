import { getSessions } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'

import type { UseQueryResult } from 'react-query'
import type { HostConfig, Sessions, SessionType } from '@opentrons/api-client'

export function useSessionsByTypeQuery(args: {
  sessionType: SessionType
}): UseQueryResult<Sessions, Error> {
  const { sessionType } = args
  const host = useHost()
  const query = useQuery<Sessions, Error>(
    ['session', sessionType, getSanitizedQueryKeyObject(host)],
    () =>
      getSessions(host as HostConfig, {
        session_type: sessionType,
      })
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    { enabled: host !== null, refetchInterval: 5000 }
  )

  return query
}
