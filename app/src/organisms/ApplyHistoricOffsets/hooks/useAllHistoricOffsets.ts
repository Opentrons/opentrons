import { useHistoricRunDetails } from './useHistoricRunDetails'

import type { LabwareOffset, HostConfig } from '@opentrons/api-client'

interface HistoricOffset extends LabwareOffset {
  runCreatedAt: string
}

/**
 * Returns an array of all historic labware offsets for all historic runs.
 *
 * @param {HostConfig|null|undefined} [hostOverride] - Optional host override configuration.
 * @returns {HistoricOffset[]} An array of historic labware offsets.
 */
export function useAllHistoricOffsets(
  hostOverride?: HostConfig | null
): HistoricOffset[] {
  const historicRunDetails = useHistoricRunDetails(hostOverride)
  return historicRunDetails
    .map(
      run =>
        run.labwareOffsets
          ?.map(offset => ({
            ...offset,
            runCreatedAt: run.createdAt,
          }))
          ?.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ) ?? []
    )
    .flat()
}
