import { IDENTITY_VECTOR } from '@opentrons/shared-data'
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
    Object.keys(protocolData.labware).forEach(labwareId => {
      const offsetLocation = getLabwareOffsetLocation(
        labwareId,
        protocolData.commands,
        protocolData.modules
      )
      if (offsetLocation != null) {
        createLabwareOffset({
          runId: currentRunId,
          data: {
            definitionUri: getLabwareDefinitionUri(
              labwareId,
              protocolData.labware,
              protocolData.labwareDefinitions
            ),
            location: offsetLocation,
            vector: IDENTITY_VECTOR,
          },
        }).catch((e: Error) => {
          console.error(`error clearing labware offsets: ${e.message}`)
        })
      }
    })
  }
}
