import { useQuery } from 'react-query'
import { getDeckConfiguration } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { DeckConfiguration } from '@opentrons/shared-data'

export function useDeckConfigurationQuery(
  options: UseQueryOptions<DeckConfiguration> = {}
): UseQueryResult<DeckConfiguration> {
  const host = useHost()
  const query = useQuery<DeckConfiguration>(
    [host, 'deck_configuration'],
    () =>
      getDeckConfiguration(host as HostConfig).then(
        response => response.data?.data?.cutoutFixtures ?? []
      ),
    { enabled: host !== null, ...options }
  )

  return query
}
