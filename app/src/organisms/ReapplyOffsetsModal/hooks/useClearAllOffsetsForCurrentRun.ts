import {
  IDENTITY_VECTOR,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'
import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'
import { useProtocolDetailsForRun } from '../../Devices/hooks'
import { getLabwareDefinitionUri } from '../../Devices/ProtocolRun/utils/getLabwareDefinitionUri'
import { getLabwareOffsetLocation } from '../../Devices/ProtocolRun/utils/getLabwareOffsetLocation'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'

export function useClearAllOffsetsForCurrentRun(): () => void {
  const currentRunId = useCurrentRunId()
  const { protocolData } = useProtocolDetailsForRun(currentRunId)
  const { createLabwareOffset } = useCreateLabwareOffsetMutation()
  return () => {
    if (currentRunId == null || protocolData == null) return
    const labwareDefinitions = getLoadedLabwareDefinitionsByUri(
      protocolData.commands
    )
    protocolData.labware.forEach(item => {
      const location = getLabwareOffsetLocation(
        item.id,
        protocolData.commands,
        protocolData.modules
      )
      if (location != null) {
        createLabwareOffset({
          runId: currentRunId,
          data: {
            definitionUri: getLabwareDefinitionUri(
              item.id,
              protocolData.labware,
              labwareDefinitions
            ),
            location: location,
            vector: IDENTITY_VECTOR,
          },
        }).catch((e: Error) => {
          console.error(`error clearing labware offsets: ${e.message}`)
        })
      }
    })
  }
}
