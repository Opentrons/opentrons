import { useQuery } from 'react-query'

import { getPipettes } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { GetPipettesParams, Pipettes } from '@opentrons/api-client'

export const DEFAULT_PARAMS: GetPipettesParams = {
  refresh: false,
}

export function usePipettesQuery(
  params: GetPipettesParams = DEFAULT_PARAMS,
  options: UseQueryOptions<Pipettes> = {}
): UseQueryResult<Pipettes> {
  const host = useHost()
  const query = useQuery<Pipettes>(
    getQueryKey(host, 'pipettes'),
    () => getPipettes(host!, params).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
