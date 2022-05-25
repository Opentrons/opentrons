import { useQuery } from 'react-query'
import { getModules } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, Modules } from '@opentrons/api-client'

export function useModulesQuery(
  options: UseQueryOptions<Modules> = {}
): UseQueryResult<Modules> {
  const host = useHost()
  const query = useQuery<Modules>(
    [host, 'modules'],
    () =>
      getModules(host as HostConfig).then(response => {
        const modules = response.data.data
        if ('id' in modules) {
          return response.data
        } else {
          return {
            data: [],
          }
        }
      }),
    { enabled: host !== null, ...options }
  )

  return query
}
