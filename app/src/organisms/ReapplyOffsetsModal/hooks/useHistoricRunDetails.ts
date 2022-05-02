import { useAllRunsQuery, useRunQuery } from '@opentrons/react-api-client'

import type { RunData, RunSummaryData } from '@opentrons/api-client'

export function useHistoricRunDetails(): RunData[] {
  const { data: allHistoricRuns } = useAllRunsQuery()

  return allHistoricRuns == null
    ? []
    : allHistoricRuns.data
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .reduce((acc: RunData[], run: RunSummaryData) => {
          const runDetails = useRunQuery(run.id)?.data?.data
          return runDetails != null ? [...acc, runDetails] : acc
        }, [])
}
