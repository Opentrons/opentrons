import { useAllRunsQuery } from '@opentrons/react-api-client'

import type { RunData } from '@opentrons/api-client'

export function useHistoricRunDetails(): RunData[] {
  const { data: allHistoricRuns } = useAllRunsQuery()

  return allHistoricRuns == null
    ? []
    : allHistoricRuns.data
        .filter(run => !run.current)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
}
