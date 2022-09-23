import { useHistoricRunDetails } from './useHistoricRunDetails'

import type { LabwareOffset, HostConfig } from '@opentrons/api-client'

interface HistoricOffset extends LabwareOffset {
  runCreatedAt: string
}
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
