import { getLoadedLabwareDefinitionsByUri } from '@opentrons/shared-data'

import { getCurrentOffsetForLabwareInLocation } from '../../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { getLabwareDefinitionUri } from '../../Devices/ProtocolRun/utils/getLabwareDefinitionUri'
import { getLabwareOffsetLocation } from '../../Devices/ProtocolRun/utils/getLabwareOffsetLocation'
import { useNotifyRunQuery } from '../../../resources/runs/useNotifyRunQuery'

import type { LabwareOffset } from '@opentrons/api-client'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

export function useLabwareOffsetForLabware(
  runId: string,
  labwareId: string
): LabwareOffset | null {
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const { data: runRecord } = useNotifyRunQuery(runId)
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
