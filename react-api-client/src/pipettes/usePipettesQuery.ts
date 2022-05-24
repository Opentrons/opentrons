import { useQuery } from 'react-query'
import { getPipettes } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type {
  HostConfig,
  FetchPipettesResponseBody,
} from '@opentrons/api-client'

export function usePipettesQuery(
  options: UseQueryOptions<FetchPipettesResponseBody> = {}
): UseQueryResult<FetchPipettesResponseBody> {
  const host = useHost()
  const query = useQuery<FetchPipettesResponseBody>(
    [host, 'pipettes '],
    () => getPipettes(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
