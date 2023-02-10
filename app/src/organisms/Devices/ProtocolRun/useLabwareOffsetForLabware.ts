import { useRunQuery } from '@opentrons/react-api-client'

import { getCurrentOffsetForLabwareInLocation } from '../../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { getLabwareOffsetLocation } from '../../Devices/ProtocolRun/utils/getLabwareOffsetLocation'

import type { LabwareOffset } from '@opentrons/api-client'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

export function useLabwareOffsetForLabware(
  runId: string,
  labwareId: string
): LabwareOffset | null {
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const { data: runRecord } = useRunQuery(runId)

  if (mostRecentAnalysis == null) return null

  const labwareDefinitionUri = mostRecentAnalysis.labware.find(
    l => l.id === labwareId
  )?.definitionUri

  const labwareLocation = getLabwareOffsetLocation(
    labwareId,
    mostRecentAnalysis?.commands ?? [],
    mostRecentAnalysis.modules.reduce((acc, m) => ({ ...acc, [m.id]: m }), {})
  )
  if (labwareLocation == null || labwareDefinitionUri == null) return null
  const labwareOffsets = runRecord?.data?.labwareOffsets ?? []

  return (
    getCurrentOffsetForLabwareInLocation(
      labwareOffsets,
      labwareDefinitionUri,
      labwareLocation
    ) ?? null
  )
}
