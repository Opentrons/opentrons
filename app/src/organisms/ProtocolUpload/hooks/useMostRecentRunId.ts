import { useAllRunsQuery } from '@opentrons/react-api-client'

export function useMostRecentRunId(): string | null {
  const { data: allRuns } = useAllRunsQuery()
  return allRuns != null && allRuns.data.length > 0
    ? allRuns.data[allRuns.data.length - 1].id
    : null
}
