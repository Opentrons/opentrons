import { useAllRunsQuery } from '@opentrons/react-api-client'

export function useCurrentRunId(): string | null {
  const { data: allRuns } = useAllRunsQuery()
  const currentRunLink = allRuns?.links?.current ?? null
  return currentRunLink != null &&
    typeof currentRunLink !== 'string' &&
    'href' in currentRunLink
    ? currentRunLink.href.replace('/runs/', '') // trim link path down to only runId
    : null
}
