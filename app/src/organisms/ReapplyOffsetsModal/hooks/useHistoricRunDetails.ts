import { useAllRunsQuery, useRunQuery } from '@opentrons/react-api-client'

import type { Run, RunSummaryData } from '@opentrons/api-client'

export function useHistoricRunDetails(): Run[] {
  const { data: allHistoricRuns } = useAllRunsQuery()
  return allHistoricRuns == null
    ? []
    : allHistoricRuns.data
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .reduce((acc: Run[], run: RunSummaryData) => {
          const runDetails = useRunQuery(run.id)?.data
          return runDetails != null ? [...acc, runDetails] : acc
        }, [])
}
