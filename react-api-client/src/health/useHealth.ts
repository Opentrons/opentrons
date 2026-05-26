import { useQuery } from 'react-query'

import { getHealth } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError, AxiosResponse } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { Health } from '@opentrons/api-client'

export function useHealthQuery(
  options: UseQueryOptions<AxiosResponse<Health>, AxiosError> = {}
): UseQueryResult<AxiosResponse<Health>, AxiosError> {
  const host = useHost()
  const queryKey = getQueryKey(host, 'health')
  const query = useQuery<AxiosResponse<Health>, AxiosError>(
    queryKey,
    () => getHealth(host!),
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
