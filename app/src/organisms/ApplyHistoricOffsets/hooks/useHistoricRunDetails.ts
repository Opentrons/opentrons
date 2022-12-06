import { useAllRunsQuery } from '@opentrons/react-api-client'

import type { HostConfig, RunData } from '@opentrons/api-client'

export function useHistoricRunDetails(
  hostOverride?: HostConfig | null
): RunData[] {
  const { data: allHistoricRuns } = useAllRunsQuery({}, hostOverride)

  return allHistoricRuns == null
    ? []
    : allHistoricRuns.data.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
}
