import last from 'lodash/last'

import { useNotifyAllRunsQuery } from '/app/resources/runs'

export function useMostRecentRunId(): string | null {
  const { data: allRuns } = useNotifyAllRunsQuery()
  return allRuns != null && allRuns.data?.length > 0
    ? last(allRuns.data)?.id ?? null
    : null
}
