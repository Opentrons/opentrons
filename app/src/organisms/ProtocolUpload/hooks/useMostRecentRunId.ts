import { useAllRunsQuery } from '@opentrons/react-api-client'

/**
 * Returns the ID of the most recent run, or null if there are no runs.
 *
 * @returns {string|null} The ID of the most recent run, or null if there are no runs.
 */
export function useMostRecentRunId(): string | null {
  const { data: allRuns } = useAllRunsQuery()
  return allRuns != null && allRuns.data.length > 0
    ? allRuns.data[allRuns.data.length - 1].id
    : null
}
