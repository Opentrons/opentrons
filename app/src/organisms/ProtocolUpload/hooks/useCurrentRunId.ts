import { useNotifyAllRunsQuery } from '../../../resources/runs/useNotifyAllRunsQuery'

import type { AxiosError } from 'axios'
import type { UseAllRunsQueryOptions } from '@opentrons/react-api-client/src/runs/useAllRunsQuery'
import type { QueryOptionsWithPolling } from '../../../resources/useNotifyService'

export function useCurrentRunId(
  options: QueryOptionsWithPolling<UseAllRunsQueryOptions, AxiosError> = {}
): string | null {
  const { data: allRuns } = useNotifyAllRunsQuery({ pageLength: 0 }, options)
  const currentRunLink = allRuns?.links?.current ?? null
  return currentRunLink != null &&
    typeof currentRunLink !== 'string' &&
    'href' in currentRunLink
    ? currentRunLink.href.replace('/runs/', '') // trim link path down to only runId
    : null
}
