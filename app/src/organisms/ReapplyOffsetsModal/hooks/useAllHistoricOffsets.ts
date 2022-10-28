import { useHistoricRunDetails } from './useHistoricRunDetails'

import type { LabwareOffset } from '@opentrons/api-client'

interface HistoricOffset extends LabwareOffset {
  runCreatedAt: string
}
export function useAllHistoricOffsets(): HistoricOffset[] {
  const historicRunDetails = useHistoricRunDetails()
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
