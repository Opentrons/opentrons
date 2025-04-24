import { useQuery } from 'react-query'

import { getPipettes } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  GetPipettesParams,
  HostConfig,
  Pipettes,
} from '@opentrons/api-client'

export const DEFAULT_PARAMS: GetPipettesParams = {
  refresh: false,
}

export function usePipettesQuery(
  params: GetPipettesParams = DEFAULT_PARAMS,
  options: UseQueryOptions<Pipettes> = {}
): UseQueryResult<Pipettes> {
  const host = useHost()
  const query = useQuery<Pipettes>(
    [host, 'pipettes'],
    () =>
      getPipettes(host as HostConfig, params).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
