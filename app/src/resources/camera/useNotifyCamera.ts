import { useCamera } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { CameraResponse } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export function useNotifyCamera(
  options: QueryOptionsWithPolling<CameraResponse, unknown> = {}
): UseQueryResult<CameraResponse> {
  const { shouldRefetch, queryOptionsNotify } = useNotifyDataReady({
    topic: `robot-server/camera`,
    options,
  })

  const httpQueryResult = useCamera(queryOptionsNotify)

  if (shouldRefetch) {
    void httpQueryResult.refetch()
  }

  return httpQueryResult
}
