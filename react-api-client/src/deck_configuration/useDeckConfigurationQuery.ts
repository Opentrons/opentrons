import { useQuery } from 'react-query'

import { getDeckConfiguration } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'

export function useDeckConfigurationQuery(
  options: UseQueryOptions<DeckConfiguration> = {}
): UseQueryResult<DeckConfiguration> {
  const host = useHost()
  const query = useQuery<DeckConfiguration>(
    getQueryKey(host, 'deck_configuration'),
    () =>
      getDeckConfiguration(host!).then(
        response => response.data?.data?.cutoutFixtures ?? []
      ),
    { enabled: host !== null, ...options }
  )

  return query
}
