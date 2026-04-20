import { useQuery } from 'react-query'

import { CACertPassword, getCACertPassword } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'

export type UseCACertPasswordQueryOptions = UseQueryOptions<CACertPassword>

export function useCACertPasswordQuery(
  options: UseCACertPasswordQueryOptions = {}
): UseQueryResult<CACertPassword> {
  const host = useHost()
  const query = useQuery<CACertPassword>(
    [host!, 'ca_cert_password'],
    () => getCACertPassword(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )
  return query
}
