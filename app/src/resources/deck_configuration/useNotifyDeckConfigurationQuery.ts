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

  useEffect(() => {
    if (refetch > 0) {
      void httpQueryResult.refetch()
    }

    // httpQueryResult.refetch is stable, the result object is not
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch])

  return httpQueryResult
}
