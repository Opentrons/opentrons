import { useQuery } from 'react-query'

import { getCACertPassword } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { CACertPassword } from '@opentrons/api-client'

export type UseCACertPasswordQueryOptions = UseQueryOptions<CACertPassword>

export function useCACertPasswordQuery(
  options: UseCACertPasswordQueryOptions = {}
): UseQueryResult<CACertPassword> {
  const host = useHost()
  const query = useQuery<CACertPassword>(
    getQueryKey(host, 'ca_cert_password'),
    () => getCACertPassword(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )
  return query
}
