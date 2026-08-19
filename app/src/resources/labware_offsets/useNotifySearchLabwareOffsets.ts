import { useEffect } from 'react'

import { useSearchLabwareOffsets } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { AxiosError } from 'axios'
import type { UseQueryResult } from 'react-query'
import type {
  SearchLabwareOffsetsRequest,
  SearchLabwareOffsetsResponse,
} from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export function useNotifySearchLabwareOffsets(
  request: SearchLabwareOffsetsRequest,
  options: QueryOptionsWithPolling<
    SearchLabwareOffsetsResponse,
    AxiosError
  > = {}
): UseQueryResult<SearchLabwareOffsetsResponse> {
  const { refetch, queryOptionsNotify } = useNotifyDataReady({
    topic: 'robot-server/labwareOffsets',
    options,
  })

  const httpQueryResult = useSearchLabwareOffsets(request, queryOptionsNotify)

  useEffect(() => {
    if (refetch > 0) {
      void httpQueryResult.refetch()
    }

    // httpQueryResult.refetch is stable, the result object is not
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch])

  return httpQueryResult
}
