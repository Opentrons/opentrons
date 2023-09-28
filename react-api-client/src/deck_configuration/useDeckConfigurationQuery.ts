import { useQuery } from 'react-query'
import { getDeckConfiguration } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { DeckConfiguration, HostConfig } from '@opentrons/api-client'

export function useDeckConfigurationQuery(
  options: UseQueryOptions<DeckConfiguration> = {}
): UseQueryResult<DeckConfiguration> {
  const host = useHost()
  const query = useQuery<DeckConfiguration>(
    [host, 'deck_configuration'],
    () =>
      getDeckConfiguration(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
