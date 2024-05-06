import { useDeckConfigurationQuery } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { QueryOptionsWithPolling } from '../useNotifyService'

export function useNotifyDeckConfigurationQuery(
  options: QueryOptionsWithPolling<DeckConfiguration, unknown> = {}
): UseQueryResult<DeckConfiguration> {
  const { notifyOnSettled, isNotifyEnabled } = useNotifyService({
    topic: 'robot-server/deck_configuration',
    options,
  })

  const httpQueryResult = useDeckConfigurationQuery({
    ...options,
    enabled: options?.enabled !== false && isNotifyEnabled,
    onSettled: notifyOnSettled,
  })

  return httpQueryResult
}
