import { useRunQuery } from '@opentrons/react-api-client'
import { getLoadedLabwareDefinitionsByUri } from '@opentrons/shared-data'

import {
  getLabwareOffsetLocation,
  getLabwareDefinitionUri,
  getCurrentOffsetForLabwareInLocation,
} from '../../Devices/ProtocolRun/utils'

import type { LabwareOffset } from '@opentrons/api-client'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

export function useLabwareOffsetForLabware(
  runId: string,
  labwareId: string
): LabwareOffset | null {
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const { data: runRecord } = useRunQuery(runId)
  if (mostRecentAnalysis == null) return null

  const labwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri(
    mostRecentAnalysis.commands
  )
  const labwareDefinitionUri = getLabwareDefinitionUri(
    labwareId,
    mostRecentAnalysis.labware,
    labwareDefinitionsByUri
  )

  const labwareLocation = getLabwareOffsetLocation(
    labwareId,
    mostRecentAnalysis?.commands ?? [],
    mostRecentAnalysis?.modules ?? [],
    mostRecentAnalysis?.labware ?? []
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
