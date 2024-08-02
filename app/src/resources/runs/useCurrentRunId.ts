import { useNotifyAllRunsQuery } from './useNotifyAllRunsQuery'

import type { AxiosError } from 'axios'
import type { UseAllRunsQueryOptions } from '@opentrons/react-api-client/src/runs/useAllRunsQuery'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'
import type { HostConfig } from '@opentrons/api-client'

export function useCurrentRunId(
  options: QueryOptionsWithPolling<UseAllRunsQueryOptions, AxiosError> = {},
  hostOverride?: HostConfig | null
): string | null {
  const { data: allRuns } = useNotifyAllRunsQuery(
    { pageLength: 0 },
    options,
    hostOverride
  )
  const currentRunLink = allRuns?.links?.current ?? null
  return currentRunLink != null &&
    typeof currentRunLink !== 'string' &&
    'href' in currentRunLink
    ? currentRunLink.href.replace('/runs/', '') // trim link path down to only runId
    : null
}
