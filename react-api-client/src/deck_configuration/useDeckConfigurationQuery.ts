import { getDeckConfiguration } from '@opentrons/api-client'
import type { HostConfig } from '@opentrons/api-client'
import type { DeckConfiguration } from '@opentrons/shared-data'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

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
