import isEqual from 'lodash/isEqual'
import { useProtocolDetailsForRun } from '../../Devices/hooks'
import { getLabwareDefinitionUri } from '../../ProtocolSetup/utils/getLabwareDefinitionUri'
import { getLabwareOffsetLocation } from '../../ProtocolSetup/utils/getLabwareOffsetLocation'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useHistoricRunDetails } from './useHistoricRunDetails'

import type { LabwareOffset } from '@opentrons/api-client'

export function useOffsetCandidatesForCurrentRun(): LabwareOffset[] {
  const currentRunId = useCurrentRunId()
  const { protocolData } = useProtocolDetailsForRun(currentRunId)
  const historicRunDetails = useHistoricRunDetails()
  const allHistoricOffsets = historicRunDetails
    .map(run => run.labwareOffsets ?? [])
    .flat()

  if (
    protocolData == null ||
    allHistoricOffsets == null ||
    allHistoricOffsets.length === 0
  )
    return []

  return Object.keys(protocolData.labware)
    .map(labwareId => {
      const location = getLabwareOffsetLocation(
        labwareId,
        protocolData.commands,
        protocolData.modules
      )
      const defUri = getLabwareDefinitionUri(
        labwareId,
        protocolData.labware,
        protocolData.labwareDefinitions
      )

      return allHistoricOffsets.find(
        offset =>
          isEqual(offset.location, location) && offset.definitionUri === defUri
      )
    })
    .filter((candidate): candidate is LabwareOffset => candidate !== undefined)
}
