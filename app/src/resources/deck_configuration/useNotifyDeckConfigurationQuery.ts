import { useDeckConfigurationQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export function useNotifyDeckConfigurationQuery(
  options: QueryOptionsWithPolling<DeckConfiguration, unknown> = {}
): UseQueryResult<DeckConfiguration> {
  const { notifyOnSettled, shouldRefetch } = useNotifyDataReady({
    topic: 'robot-server/deck_configuration',
    options,
  })

  const httpQueryResult = useDeckConfigurationQuery({
    ...options,
    enabled: options?.enabled !== false && shouldRefetch,
    onSettled: notifyOnSettled,
  })

  return httpQueryResult
}
