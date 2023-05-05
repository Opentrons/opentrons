import { getModules } from '@opentrons/api-client'
import type { HostConfig, Modules } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

import { useHost } from '../api'

export function useModulesQuery(
  options: UseQueryOptions<Modules> = {}
): UseQueryResult<Modules> {
  const host = useHost()
  const query = useQuery<Modules>(
    [host, 'modules'],
    () =>
      getModules(host as HostConfig).then(response => {
        const modules = response.data.data
        // this check will determine if the module response is v3 or v2
        // if v2, we will return an empty array
        if (modules.length > 0 && 'id' in modules[0]) {
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
