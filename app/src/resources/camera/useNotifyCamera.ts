import { useEffect } from 'react'

import { useCamera } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { CameraResponse } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export function useNotifyCamera(
  options: QueryOptionsWithPolling<CameraResponse, unknown> = {}
): UseQueryResult<CameraResponse> {
  const { refetch, queryOptionsNotify } = useNotifyDataReady({
    topic: `robot-server/camera`,
    options,
  })

  const httpQueryResult = useCamera(queryOptionsNotify)
  const { refetch: refetchQuery } = httpQueryResult

  useEffect(() => {
    if (refetch > 0) {
      void refetchQuery()
    }
  }, [refetch, refetchQuery])

  return httpQueryResult
}
