import { useQuery } from 'react-query'

import { getHealth } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  Health,
  HttpClientError,
  HttpResponse,
} from '@opentrons/api-client'

export function useHealthQuery(
  options: UseQueryOptions<HttpResponse<Health>, HttpClientError> = {}
): UseQueryResult<HttpResponse<Health>, HttpClientError> {
  const host = useHost()
  const queryKey = ['health', host]
  const query = useQuery<HttpResponse<Health>, HttpClientError>(
    queryKey,
    async () => {
      if (host == null) {
        throw new Error('Host config is required')
      }
      return await getHealth(host)
    },
    {
      ...options,
      enabled: host !== null && options.enabled !== false,
    }
  )

  return query
}

export function useHealth(): Health | undefined {
  return useHealthQuery().data?.data
}
