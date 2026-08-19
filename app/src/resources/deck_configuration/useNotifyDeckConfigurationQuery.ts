import { useEffect } from 'react'

import { useDeckConfigurationQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export function useNotifyDeckConfigurationQuery(
  options: QueryOptionsWithPolling<DeckConfiguration, unknown> = {}
): UseQueryResult<DeckConfiguration> {
  const { refetch, queryOptionsNotify } = useNotifyDataReady({
    topic: 'robot-server/deck_configuration',
    options,
  })

  const httpQueryResult = useDeckConfigurationQuery(queryOptionsNotify)
  const { refetch: refetchQuery } = httpQueryResult

  useEffect(() => {
    if (refetch > 0) {
      void refetchQuery()
    }
  }, [refetch, refetchQuery])

  return httpQueryResult
}
