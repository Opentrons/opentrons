import { UseQueryResult, useQuery } from 'react-query'
import { getPipettes } from '@opentrons/api-client'
import { useHost } from '../api'
import type {
  HostConfig,
  FetchPipettesResponseBody,
} from '@opentrons/api-client'

export function useAttachedPipettesQuery(): UseQueryResult<FetchPipettesResponseBody> {
  const host = useHost()
  const query = useQuery(
    [host, 'pipettes '],
    () => getPipettes(host as HostConfig).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
