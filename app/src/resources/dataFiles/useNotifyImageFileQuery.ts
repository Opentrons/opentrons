import { useEffect } from 'react'

import { useImageFileQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { ImageFilesDataResponse } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export function useNotifyImageFileQuery(
  runId: string,
  options: QueryOptionsWithPolling<ImageFilesDataResponse, unknown> = {}
): UseQueryResult<ImageFilesDataResponse> {
  const { refetch, queryOptionsNotify } = useNotifyDataReady({
    topic: `robot-server/dataFiles/${runId}/images`,
    options,
  })

  const httpQueryResult = useImageFileQuery(runId, queryOptionsNotify)

  useEffect(() => {
    if (refetch > 0) {
      void httpQueryResult.refetch()
    }

    // httpQueryResult.refetch is stable, the result object is not
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch])

  return httpQueryResult
}
