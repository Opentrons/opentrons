import { useAllRunsQuery } from '@opentrons/react-api-client'

import type { HostConfig, RunData } from '@opentrons/api-client'

/**
 * Retrieves an array of run data objects sorted in ascending order by their `createdAt` timestamp.
 * @param {HostConfig | null} [hostOverride] - Optional host configuration object used to override the default host.
 * @returns {RunData[]} An array of run data objects.
 */
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
