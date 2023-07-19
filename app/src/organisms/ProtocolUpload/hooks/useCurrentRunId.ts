import { useAllRunsQuery } from '@opentrons/react-api-client'
import type { UseAllRunsQueryOptions } from '@opentrons/react-api-client/src/runs/useAllRunsQuery'

export function useCurrentRunId(
  options: UseAllRunsQueryOptions = {}
): string | null {
  const { data: allRuns } = useAllRunsQuery({ pageLength: 0 }, options)
  const currentRunLink = allRuns?.links?.current ?? null
  return currentRunLink != null &&
    typeof currentRunLink !== 'string' &&
    'href' in currentRunLink
    ? currentRunLink.href.replace('/runs/', '') // trim link path down to only runId
    : null
}
