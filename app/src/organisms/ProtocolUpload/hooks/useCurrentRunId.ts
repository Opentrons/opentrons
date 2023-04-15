import { useAllRunsQuery } from '@opentrons/react-api-client'

/**
 * Retrieves the ID of the current run from the query parameters of the URL.
 * @returns The ID of the current run, or `null` if no run ID is found.
 */
export function useCurrentRunId(): string | null {
  const { data: allRuns } = useAllRunsQuery()
  const currentRunLink = allRuns?.links?.current ?? null
  return currentRunLink != null &&
    typeof currentRunLink !== 'string' &&
    'href' in currentRunLink
    ? currentRunLink.href.replace('/runs/', '') // trim link path down to only runId
    : null
}
