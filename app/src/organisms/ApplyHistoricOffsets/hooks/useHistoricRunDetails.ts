import { useNotifyAllRunsQuery } from '../../../resources/runs/useNotifyAllRunsQuery'

import type { HostConfig, RunData } from '@opentrons/api-client'

export function useHistoricRunDetails(
  hostOverride?: HostConfig | null
): RunData[] {
  const { data: allHistoricRuns } = useNotifyAllRunsQuery({}, {}, hostOverride)

  return allHistoricRuns == null
    ? []
    : allHistoricRuns.data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
}
