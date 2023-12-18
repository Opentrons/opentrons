import { useAllRunsQuery } from '@opentrons/react-api-client'
import { last } from 'lodash'

export function useMostRecentRunId(): string | null {
  const { data: allRuns } = useAllRunsQuery()
  return allRuns != null && allRuns.data?.length > 0
    ? last(allRuns.data)?.id ?? null
    : null
}
