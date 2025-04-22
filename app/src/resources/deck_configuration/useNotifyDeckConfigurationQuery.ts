import { useDeckConfigurationQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { QueryOptionsWithPolling } from '../useNotifyDataReady'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { UseQueryResult } from 'react-query'

export function useNotifyDeckConfigurationQuery(
  options: QueryOptionsWithPolling<DeckConfiguration, unknown> = {}
): UseQueryResult<DeckConfiguration> {
  const { shouldRefetch, queryOptionsNotify } = useNotifyDataReady({
    topic: 'robot-server/deck_configuration',
    options,
  })

  const httpQueryResult = useDeckConfigurationQuery(queryOptionsNotify)

  if (shouldRefetch) {
    void httpQueryResult.refetch()
  }

  return httpQueryResult
}
